/*
 * OpenBACH is a generic testbed able to control/configure multiple
 * network/physical entities (under test) and collect data from them. It is
 * composed of an Auditorium (HMIs), a Controller, a Collector and multiple
 * Agents (one for each network entity that wants to be tested).
 *
 *
 * Copyright © 2016-2023 CNES
 *
 *
 * This file is part of the OpenBACH testbed.
 *
 *
 * OpenBACH is a free software : you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see http://www.gnu.org/licenses/.
 */

#include <functional>
#include <stdexcept>
#include <sstream>
#include <string>
#include <fstream>
#include <cstring>
#include <errno.h>
#if defined(_WIN32)
#include <direct.h>
#endif

#include "collectagent.h"
#include "asio.hpp"

unsigned int rstats_connection_id = 0;
unsigned int job_instance_id = 0;
unsigned int scenario_instance_id = 0;
unsigned int owner_scenario_instance_id = 0;
std::string agent_name("");
std::string job_name;


namespace collect_agent {

inline std::string getenv(const char* name) {
#if defined _WIN32
  const unsigned int ENV_VALUE_LENGTH = 1024;
  char value[ENV_VALUE_LENGTH];
  unsigned int retrieved = GetEnvironmentVariableA(name, value, ENV_VALUE_LENGTH);
  if (!retrieved) {
    return std::string();
  }
#else
  const char* value = std::getenv(name);
  if (!value) {
    return std::string();
  }
#endif
  return value;
}


inline unsigned int from_env(const char* name, unsigned int default_value) {
  const std::string value = getenv(name);
  if (value.empty()) {
    return default_value;
  }
  std::stringstream parser;
  parser << value;
  unsigned int parsed;
  parser >> parsed;
  return parsed;
}


/*
 * Helper function that creates a directory
 */
inline int create_path(const std::string& path) {
#if defined(_WIN32)
  return _mkdir(path.c_str());
#else
  return mkdir(path.c_str(), 0755);
#endif
}


/*
 * Helper function that recursively creates a directory
 */
bool make_path(const std::string& path){
  int error = create_path(path);
  if (!error) {
    return true;
  }

  switch (errno) {
    case ENOENT: {
      // parent doest not exist, try to create it
      size_t pos = path.find_last_of("/\\");
      if (pos == std::string::npos || !make_path(path.substr(0, pos))) {
        return false;
      }

      // try to create again
      return !create_path(path);
    }
    case EEXIST: {
      // directory already exists
      return true;
    }
    default: {
      return false;
    }
  }
}


/*
 * Helper class to manage timeouts on sockets
 */
using asio::ip::udp;
using std::placeholders::_1;
using std::placeholders::_2;

class RStatsClient {
  asio::io_context context;
  udp::socket socket;
  bool timeout;

public:
  RStatsClient(): socket(context), timeout(false) {
    socket.open(udp::v4());
  }

  std::size_t receive(
      const asio::mutable_buffer& buffer,
      std::chrono::steady_clock::duration timeout,
      std::error_code& error) {
    std::size_t length = 0;
    socket.async_receive(buffer, std::bind(&RStatsClient::handler, _1, _2, &error, &length));

    run(timeout);
    return length;
  }

  std::size_t send_to(
      const asio::const_buffer& buffer,
      const udp::endpoint& endpoint,
      std::chrono::steady_clock::duration timeout,
      std::error_code& error) {
    std::size_t length = 0;
    socket.async_send_to(buffer, endpoint, std::bind(&RStatsClient::handler, _1, _2, &error, &length));

    run(timeout);
    return length;
  }

  inline bool timed_out() { return timeout; }

  udp::endpoint resolve(const std::string& host, const std::string& service) {
    udp::resolver resolver(context);
    return *resolver.resolve(udp::v4(), host, service);
  }

private:
  void run(std::chrono::steady_clock::duration duration) {
    // Restart the io_context, as it may have been left in the "stopped" state
    // by a previous operation.
    context.restart();
    timeout = false;

    // Block until the asynchronous operation has completed, or timed out. If
    // the pending asynchronous operation is a composed operation, the deadline
    // applies to the entire operation, rather than individual operations on
    // the socket.
    context.run_for(duration);

    // If the asynchronous operation completed successfully then the io_context
    // would have been stopped due to running out of work. If it was not
    // stopped, then the io_context::run_for call must have timed out.
    if (!context.stopped()) {
      // Cancel the outstanding asynchronous operation.
      socket.cancel();
      timeout = true;
      // Run the io_context again until the operation completes.
      context.run();
    }
  }

  static void handler(
      const std::error_code& error, std::size_t length,
      std::error_code* out_error, std::size_t* out_length) {
    *out_error = error;
    *out_length = length;
  }
};

/*
 * Helper function to send a message to the local RStats relay.
 */
std::string rstats_messager(const json::JSON& message) {
  std::error_code error;
  RStatsClient rstats;
  static udp::endpoint endpoint = rstats.resolve("", "1111");

  // Connect to the RStats service and send our message
  rstats.send_to(asio::buffer(message.serialize()), endpoint, std::chrono::seconds(10), error);
  if (error || rstats.timed_out()) {
    send_log(LOG_ERR, "Error: Connexion to rstats refused, maybe rstats service isn't started");
    throw asio::system_error(error);
  }

  // Receive the response from the RStats service and propagate it to the caller.
  char data[2048];
  std::size_t n = rstats.receive(asio::buffer(data), std::chrono::seconds(30), error);
  if ((error && error != asio::error::message_size) || rstats.timed_out()) {
    send_log(LOG_ERR, "Error: Connexion to rstats was closed, could not get an answer");
    throw asio::system_error(error);
  }

  return std::string(data, n);
}


/*
 * Create the message to register and configure a new job;
 * send it to the RStats service and propagate its response.
 * Also open a syslog connection
 */
bool register_collect(
    const std::string& config_file,
    int log_option,
    int log_facility,
    bool _new) {
  // Get the ids
  job_name = getenv("JOB_NAME");
  if (job_name.empty()) {
    job_name = "job_debug";
  }
  job_instance_id = from_env("JOB_INSTANCE_ID", 0);
  scenario_instance_id = from_env("SCENARIO_INSTANCE_ID", 0);
  owner_scenario_instance_id = from_env("OWNER_SCENARIO_INSTANCE_ID", 0);
  std::ifstream agent_name_file;
  
  agent_name_file.open("/opt/openbach/agent/agent_name");
  if (agent_name_file.is_open()) {
    goto read;
  }

  agent_name_file.open("/etc/hostname");
  if (agent_name_file.is_open()) {
    goto read;
  }

  agent_name_file.open("C:\\openbach\\agent_name");
  if (!agent_name_file.is_open()) {
    agent_name = "agent_name_not_found";
  } else {
read:
    std::getline(agent_name_file, agent_name);
    agent_name_file.close();
  }

  // Open the log
  openlog(job_name.c_str(), log_option, log_facility);

  // Format the message to send to rstats
  json::JSON command = {
    "command_id", 1,
    "command_parameters", {
      "confpath", config_file,
      "job_name", job_name,
      "agent_name", agent_name,
      "job_instance_id", job_instance_id,
      "scenario_instance_id", scenario_instance_id,
      "owner_scenario_instance_id", owner_scenario_instance_id,
      "override", _new,
    }
  };

  // Send the message to rstats
  std::string result;
  try {
    result = rstats_messager(command);
  } catch (std::exception& e) {
    send_log(LOG_ERR, "Failed to register to rstats service: %s", e.what());
    return false;
  }
  std::stringstream parser(result);

  // Format the response and propagate it
  std::string startswith;
  parser >> startswith;
  if (startswith == "OK") {
    unsigned int id;
    parser >> id;
    if (!id) {
      send_log(LOG_ERR, "ERROR: Return message isn't well formed");
      send_log(LOG_ERR, "\t%s", result.c_str());
    } else {
      send_log(LOG_NOTICE, "NOTICE: Connexion ID is %d", id);
    }
    rstats_connection_id = id;
    return true;
  } else if (startswith == "KO") {
    send_log(LOG_ERR, "ERROR: Something went wrong");
  } else {
    send_log(LOG_ERR, "ERROR: Return message isn't well formed");
  }

  rstats_connection_id = 0;
  send_log(LOG_ERR, "\t%s", result.c_str());
  return false;
}


/*
 * Send the log
 */
void send_log(
    int priority,
    const char* log,
    va_list ap) {
  // Create the message to log
  std::stringstream message;
  message
    << "OWNER_SCENARIO_INSTANCE_ID "
    << owner_scenario_instance_id
    << ", SCENARIO_INSTANCE_ID "
    << scenario_instance_id
    << ", JOB_INSTANCE_ID "
    << job_instance_id
    << ", AGENT_NAME "
    << agent_name
    << ", " << log;
  // Send the message
  vsyslog(priority, message.str().c_str(), ap);
}


/*
 * Send the log
 */
void send_log(
    int priority,
    const char* log,
    ...) {
  // Get the variable arguments
  va_list ap;
  va_start(ap, log);
  // Send the message
  send_log(priority, log, ap);
  va_end(ap);
}


/*
 * Create the message to generate a new statistic;
 * send it to the RStats service and propagate its response.
 */
std::string send_stat(
    long long timestamp,
    const std::unordered_map<std::string, std::string>& stats,
    const std::string& suffix,
    bool is_files) {
  // Format the message
  json::JSON command = {
    "command_id", 2,
    "command_parameters", {
      "connection_id", rstats_connection_id,
      "timestamp", timestamp,
      "stored_files", is_files,
      "statistics", json::Object()
    }
  };

  for (auto& stat : stats) {
    command["command_parameters"]["statistics"][stat.first] = stat.second;
  }

  if (suffix != "") {
    command["command_parameters"]["suffix"] = suffix;
  }

  // Send the message and propagate RStats response
  try {
    return rstats_messager(command);
  } catch (std::exception& e) {
    std::string msg = "KO Failed to send statistic to rstats: ";
    msg += e.what();
    send_log(LOG_ERR, "%s", msg.c_str());
    return msg;
  }
}


/*
 * Create the message to generate a new statistic;
 * send it to the RStats service and propagate its response.
 */
std::string send_stat(
    long long timestamp,
    const json::JSON& stats,
    const std::string& suffix,
    bool is_files) {
  // Format the message
  json::JSON command = {
    "command_id", 2,
    "command_parameters", {
      "connection_id", rstats_connection_id,
      "timestamp", timestamp,
      "statistics", stats,
      "stored_files", is_files,
    }
  };
  if (suffix != "") {
    command["command_parameters"]["suffix"] = suffix;
  }

  // Send the message and propagate RStats response
  try {
    return rstats_messager(command);
  } catch (std::exception& e) {
    std::string msg = "KO Failed to send statistic to rstats: ";
    msg += e.what();
    send_log(LOG_ERR, "%s", msg.c_str());
    return msg;
  }
}


/*
 * Helper function that mimics `send_stat` functionality with
 * statistics values already formatted as JSON dump.
 */
std::string send_prepared_stat(
    long long timestamp,
    const std::string& suffix,
    const std::string& stat_values) {
  // Format the message
  json::JSON command = {
    "command_id", 2,
    "command_parameters", {
      "connection_id", rstats_connection_id,
      "timestamp", timestamp,
      "statistics", json::JSON::Load(stat_values),
    }
  };
  if (suffix != "") {
    command["command_parameters"]["suffix"] = suffix;
  }

  // Send the message and propagate RStats response
  try {
    return rstats_messager(command);
  } catch (std::exception& e) {
    std::string msg = "KO Failed to send statistic to rstats: ";
    msg += e.what();
    send_log(LOG_ERR, "%s", msg.c_str());
    return msg;
  }
}


/*
 * Store a single file in a defined local path 
 */
std::string store_file(long long timestamp, const std::string& filepath) {
  std::stringstream dest_dir;
  dest_dir << "/opt/openbach/agent/collect_agent/" << job_name << "/" << job_instance_id << "/" << timestamp;
  if (!make_path(dest_dir.str())){
    std::string msg = "KO Failed making destination directory: " + dest_dir.str();
    send_log(LOG_ERR, "%s", msg.c_str());
    throw std::runtime_error(msg.c_str());
  }

  std::string filename = "";
  size_t pos = filepath.find_last_of("/\\");

  if (pos != std::string::npos) {
    filename = filepath.substr(pos + 1);
  } else {
    std::string msg = "KO Failed extracting filename from: " + filepath;
    send_log(LOG_ERR, "%s", msg.c_str());
    throw std::runtime_error(msg.c_str());
  }

  //Store file
  std::string dest_filepath = dest_dir.str() + "/" + filename;
  std::ifstream source(filepath.c_str(), std::ios::binary);
  std::ofstream dest(dest_filepath.c_str(), std::ios::binary);
  if (!source.fail() && !dest.fail()) {
    dest << source.rdbuf();
  }

  //Check copy was done properly
  bool is_bad = source.fail() || dest.fail();
  source.close();
  dest.close();
  if (is_bad) {
    std::string msg = "KO Failed copying " + filepath + " to " + dest_filepath;
    send_log(LOG_ERR, "%s", msg.c_str());
    throw std::runtime_error(msg.c_str());
  }

  return dest_filepath;
}


/*
 * Store file(s) in a defined local path ;
 */
std::string store_files(
    long long timestamp,
    const char* suffix,
    int n_filepaths,
    va_list src_filepaths) {

  std::stringstream dest_dir;
  dest_dir << "/opt/openbach/agent/collect_agent/" << job_name << "/" << job_instance_id << "/" << timestamp;
  if (!make_path(dest_dir.str())){
    std::string msg = "KO Failed making destination directory: " + dest_dir.str();
    send_log(LOG_ERR, "%s", msg.c_str());
    return msg;
  }

  std::string filename = "";
  json::JSON statistics;
  for (int i = 0; i < n_filepaths; ++i) {
    //Extract stat name
    std::string stat = va_arg(src_filepaths, const char*);

    //Extract file path
    std::string src_filepath = va_arg(src_filepaths, const char*);
    size_t pos = src_filepath.find_last_of("/\\");

    if (pos != std::string::npos) {
      filename = src_filepath.substr(pos + 1);
    } else {
      std::string msg = "KO Failed extracting filename from: " + src_filepath;
      send_log(LOG_ERR, "%s", msg.c_str());
      return msg;
    }

    //Store file
    std::string dest_filepath = dest_dir.str() + "/" + filename;
    std::ifstream source(src_filepath.c_str(), std::ios::binary);
    std::ofstream dest(dest_filepath.c_str(), std::ios::binary);
    if (!source.fail() && !dest.fail()) {
      dest << source.rdbuf();
    }

    //Check copy was done properly
    bool is_bad = source.fail() || dest.fail();
    source.close();
    dest.close();
    if (is_bad) {
      std::string msg = "KO Failed copying " + src_filepath + " to " + dest_filepath;
      send_log(LOG_ERR, "%s", msg.c_str());
      return msg;
    }

    //Send stats representing the filepaths
    statistics[stat] = dest_filepath;
  }
  return send_stat(timestamp, statistics, suffix, true);
}


/*
 * Store file(s) in a defined local path ;
 */
std::string store_files(
    long long timestamp,
    const char* suffix,
    int n_filepaths,
    ...) {
  va_list src_filepaths;
  va_start(src_filepaths, n_filepaths);
  std::string result = store_files(timestamp, suffix, n_filepaths, src_filepaths);
  va_end(src_filepaths);
  return result;
}


/*
 * Create the message to reload a job configuration;
 * send it to the RStats service and propagate its response.
 */
std::string reload_stat() {
  // Format the message
  json::JSON command = {
    "command_id", 3,
    "command_parameters", {
      "connection_id", rstats_connection_id,
    }
  };

  // Send the message and propagate RStats response
  try {
    return rstats_messager(command);
  } catch (std::exception& e) {
    std::string msg = "KO Failed to reload statistic: ";
    msg += e.what();
    send_log(LOG_ERR, "%s", msg.c_str());
    return msg;
  }
}


/*
 * Create the message to remove a registered job;
 * send it to the RStats service and propagate its response.
 */
std::string remove_stat() {
  // Format the message
  json::JSON command = {
    "command_id", 4,
    "command_parameters", {
      "connection_id", rstats_connection_id,
    }
  };

  // Send the message and propagate RStats response
  try {
    return rstats_messager(command);
  } catch (std::exception& e) {
    std::string msg = "KO Failed to remove statistic: ";
    msg += e.what();
    send_log(LOG_ERR, "%s", msg.c_str());
    return msg;
  }
}


/*
 * Create the message to reload all jobs configurations at once;
 * send it to the RStats service and propagate its response.
 */
std::string reload_all_stats() {
  // Format the message
  json::JSON command = {
    "command_id", 5,
    "command_parameters", json::Object()
  };

  try {
    return rstats_messager(command);
  } catch (std::exception& e) {
    std::string msg = "KO Failed to reload statistics: ";
    msg += e.what();
    send_log(LOG_ERR, "%s", msg.c_str());
    return msg;
  }
}


/*
 * Create the message to fetch current jobs configurations;
 * send it to the RStats service and propagate its response.
 */
std::string change_config(bool storage, bool broadcast) {
  // Get the ids
  unsigned int job_id = from_env("JOB_INSTANCE_ID", 0);
  unsigned int scenario_id = from_env("SCENARIO_INSTANCE_ID", 0);

  // Format the message
  json::JSON command = {
    "command_id", 6,
    "command_parameters", {
      "job_instance_id", job_id,
      "scenario_instance_id", scenario_id,
      "enable_storage", storage,
      "enable_broadcast", broadcast,
    }
  };

  try {
    return rstats_messager(command);
  } catch (std::exception& e) {
    std::string msg = "KO Failed to fetch configurations: ";
    msg += e.what();
    send_log(LOG_ERR, "%s", msg.c_str());
    return msg;
  }
}


/*
 * Create the message to reset RStats;
 * send it to the RStats service and propagate its response.
 */
std::string restart_rstats() {
  // Format the message
  json::JSON command = {
    "command_id", 7,
    "command_parameters", json::Object()
  };

  try {
    return rstats_messager(command);
  } catch (std::exception& e) {
    std::string msg = "KO Failed to reset rstats: ";
    msg += e.what();
    send_log(LOG_ERR, "%s", msg.c_str());
    return msg;
  }
}

}
