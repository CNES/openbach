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

#define PY_SSIZE_T_CLEAN
#include <Python.h>

#define STR_VALUE(arg) #arg
#define STRINGIFY(arg) STR_VALUE(arg)
#define VERSION STRINGIFY(MAJOR_VERSION) "." STRINGIFY(MINOR_VERSION) "." STRINGIFY(DEBUG_VERSION)

#include <iostream>
#include <functional>
#include <cstring>

#include "collectagent.h"
#include "syslog.h"

/*
 * Helper Functions
 */

bool extract_statistics(PyObject *args, long long& timestamp, std::string& suffix, PyObject *statistics)
{
    /*
     * Extract functions arguments from the statistics dictionary into their
     * respective variables. Keep the actual statistics in statistics.
     * This ensure that a python function of the form
     *     def function(timestamp, suffix=None, **statistics):
     * behaves as expected.
     */

    PyObject *python_suffix = nullptr;
    static const char *argument_names[] = {"timestamp", "suffix", nullptr};

    if (statistics) {
        PyObject * kwargs = PyDict_New();
        for (std::size_t i = 0; argument_names[i] != nullptr; ++i) {
            PyObject * key = Py_BuildValue("s", argument_names[i]);
            int contains = PyDict_Contains(statistics, key);
            if (contains < 0) {
                Py_DECREF(key);
                return false;
            }
            if (contains) {
                PyObject * value = PyDict_GetItem(statistics, key);
                if (value == Py_None) {
                    /*
                     * Filtering out None values to make arguments
                     * optionals when need be. The ParseTupleAndKeywords
                     * call bellow will check if they were needed or
                     * not anyway.
                     */
                    if (PyDict_DelItem(statistics, key) < 0) {
                        Py_DECREF(key);
                        return false;
                    }
                } else {
                    Py_INCREF(value);

                    /*
                     * Inserting the function arguments into the
                     * kwargs dictionary to parse them later.
                     */
                    if (PyDict_SetItem(kwargs, key, value) < 0) {
                        Py_DECREF(key);
                        return false;
                    }

                    /*
                     * Removing the function arguments from the
                     * statistics dictionary to only keep actual
                     * statistics in there.
                     */
                    if (PyDict_DelItem(statistics, key) < 0) {
                        Py_DECREF(key);
                        return false;
                    }
                }
            }
            Py_DECREF(key);
        }

        bool failed = !PyArg_ParseTupleAndKeywords(
                args, kwargs, "L|U", const_cast<char**>(argument_names),
                &timestamp, &python_suffix);
        Py_DECREF(kwargs);

        if (failed)
            return false;
    } else {
        if(!PyArg_ParseTupleAndKeywords(
                args, statistics, "L|U", const_cast<char**>(argument_names),
                &timestamp, &python_suffix))
            return false;
    }

    if (python_suffix) {
        const char * c_suffix = PyUnicode_AsUTF8(python_suffix);
        if (c_suffix == nullptr)
            return false;
        suffix = c_suffix;
    }
    return true;
}


json::JSON parse_json(PyObject * value) {
    if (value == Py_None) {
        return nullptr;
    }

    if (PyDict_Check(value)) {
        json::JSON result;
        PyObject *k, *v;
        Py_ssize_t pos = 0;
        while (PyDict_Next(value, &pos, &k, &v)) {
            const char * key = PyUnicode_AsUTF8(k);
            if (key == nullptr)
                throw std::bad_function_call();
            result[key] = parse_json(v);
        }
        return result;
    }

    if (PyList_Check(value) || PyTuple_Check(value)) {
        PyObject *iterator = PyObject_GetIter(value);
        if (iterator == nullptr)
            return nullptr;

        PyObject *item;
        std::size_t index = 0;
        json::JSON array = json::Array();
        while ((item = PyIter_Next(iterator))) {
            try {
                array[index++] = parse_json(item);
            } catch (std::bad_function_call& e) {
                Py_DECREF(item);
                Py_DECREF(iterator);
                throw;
            }
            Py_DECREF(item);
        }

        Py_DECREF(iterator);
        if (PyErr_Occurred())
            throw std::bad_function_call();
        return array;
    }
    
    if (PyBool_Check(value)) {
        return value == Py_True;
    }

    if (PyUnicode_Check(value)) {
        return PyUnicode_AsUTF8(value);
    }
    
    if (PyFloat_Check(value)) {
        return PyFloat_AsDouble(value);
    }
    
    if (PyLong_Check(value)) {
        long result = PyLong_AsLong(value);
        if (PyErr_Occurred())
            throw std::bad_function_call();
        return result;
    }
    
    throw std::bad_function_call();
}


/*
 * Public Python module
 */

extern "C" {

// static PyObject *CollectAgentError;
static PyObject *__version__;


static PyObject *
collect_agent_register_collect(PyObject *self, PyObject *args, PyObject *kwargs)
{
    PyObject * python_config_file = nullptr;
    int log_option = LOG_PID;
    int log_facility = LOG_USER;
    int create = false;

    static const char *argument_names[] = {"config_file", "log_option", "log_facility", "new", nullptr};
    if (!PyArg_ParseTupleAndKeywords(
            args, kwargs, "O&|iip", const_cast<char**>(argument_names),
            PyUnicode_FSConverter, &python_config_file, &log_option, &log_facility, &create))
        return nullptr;

    std::string config_file = PyBytes_AsString(python_config_file);
    Py_DECREF(python_config_file);

    bool success = true;
    Py_BEGIN_ALLOW_THREADS
    success = collect_agent::register_collect(config_file, log_option, log_facility, create);
    Py_END_ALLOW_THREADS
    return Py_BuildValue("O", success ? Py_True : Py_False);
}
PyDoc_STRVAR(doc_register_collect,
    "register_collect(config_file, log_option=LOG_PID, log_facility=LOG_USER, new=False)\n\n"
    "Opens a new connection to RStats.");


static PyObject *
collect_agent_send_log(PyObject *self, PyObject *args, PyObject *kwargs)
{
    int priority = 0;
    PyObject *python_log_message = nullptr;

    static const char *argument_names[] = {"priority", "log", nullptr};
    if (!PyArg_ParseTupleAndKeywords(
            args, kwargs, "iU", const_cast<char**>(argument_names),
            &priority, &python_log_message))
        return nullptr;

    const char * log_message = PyUnicode_AsUTF8(python_log_message);
    if (log_message == nullptr)
        return nullptr;

    Py_BEGIN_ALLOW_THREADS
    collect_agent::send_log(priority, "%s", log_message);
    Py_END_ALLOW_THREADS
    Py_RETURN_NONE;
}
PyDoc_STRVAR(doc_send_log,
    "send_log(priority, message)\n\n"
    "Send a log message to the collector.");


static PyObject *
collect_agent_send_stat(PyObject *self, PyObject *args, PyObject *kwargs)
{
    long long timestamp = 0;
    std::string suffix;

    if (!extract_statistics(args, timestamp, suffix, kwargs))
        return nullptr;

    json::JSON statistics;
    if (kwargs){
        try {
            statistics = parse_json(kwargs);
        } catch (std::bad_function_call& e) {
            if (!PyErr_Occurred())
                PyErr_SetString(PyExc_ValueError, "Incompatible type found in statistics dictionary");
            return nullptr;
        }
    }

    std::string result;
    Py_BEGIN_ALLOW_THREADS
    result = collect_agent::send_stat(timestamp, statistics, suffix);
    Py_END_ALLOW_THREADS
    return Py_BuildValue("s", result.c_str());
}
PyDoc_STRVAR(doc_send_stat,
    "send_stat(timestamp, suffix=None, **statistics)\n\n"
    "Send a statistic message to the collector.");


static PyObject *
collect_agent_store_files(PyObject *self, PyObject *args, PyObject *kwargs)
{
    long long timestamp = 0;
    std::string suffix;

    if (!extract_statistics(args, timestamp, suffix, kwargs))
        return nullptr;

    json::JSON statistics;
    if (kwargs) {
        bool should_copy = true;
        PyObject *key, *value;
        Py_ssize_t pos = 0;
        while (PyDict_Next(kwargs, &pos, &key, &value)) {
            const char * c_key = PyUnicode_AsUTF8(key);
            if (c_key == nullptr)
                return nullptr;

            if (std::strcmp(c_key, "copy") == 0) {
                should_copy = PyObject_IsTrue(value) == 1;
            }
        }

        pos = 0;
        while (PyDict_Next(kwargs, &pos, &key, &value)) {
            const char * c_key = PyUnicode_AsUTF8(key);
            if (c_key == nullptr)
                return nullptr;

            if (std::strcmp(c_key, "copy") == 0) {
                continue;
            }

            PyObject *path;
            if (!PyUnicode_FSConverter(value, &path))
                return nullptr;

            std::string filepath = PyBytes_AsString(path);
            Py_DECREF(path);

            try {
                if (should_copy) {
                    std::string stored_file = collect_agent::store_file(timestamp, filepath);
                    statistics[c_key] = stored_file;
                } else {
                    statistics[c_key] = filepath;
                }
            } catch (std::exception& e) {
                syslog(LOG_INFO, "%s", "Exception");
                PyErr_SetString(PyExc_RuntimeError, e.what());
                return nullptr;
            }
        }
    }

    std::string result;
    Py_BEGIN_ALLOW_THREADS
    result = collect_agent::send_stat(timestamp, statistics, suffix, true);
    Py_END_ALLOW_THREADS
    return Py_BuildValue("s", result.c_str());
}
PyDoc_STRVAR(doc_store_files,
    "store_files(timestamp, suffix=None, copy=True, **filepaths)\n\n"
    "Store files and send their path to the collector.\n\n"
    "If copy is False, does not attempt to copy the specified files\n"
    "in an OpenBACH specific directory and send the statistic with\n"
    "their current path instead.");


static PyObject *
collect_agent_reload_stat(PyObject *self, PyObject *unused)
{
    std::string result;
    Py_BEGIN_ALLOW_THREADS
    result = collect_agent::reload_stat();
    Py_END_ALLOW_THREADS
    return Py_BuildValue("s", result.c_str());
}
PyDoc_STRVAR(doc_reload_stat,
    "reload_stat()\n\n"
    "Reload the configuration for the current job.");


static PyObject *
collect_agent_remove_stat(PyObject *self, PyObject *unused)
{
    std::string result;
    Py_BEGIN_ALLOW_THREADS
    result = collect_agent::remove_stat();
    Py_END_ALLOW_THREADS
    return Py_BuildValue("s", result.c_str());
}
PyDoc_STRVAR(doc_remove_stat,
    "remove_stat()\n\n"
    "Remove the current job from the pool handled by the rstats server.");


static PyObject *
collect_agent_reload_all_stats(PyObject *self, PyObject *unused)
{
    std::string result;
    Py_BEGIN_ALLOW_THREADS
    result = collect_agent::reload_all_stats();
    Py_END_ALLOW_THREADS
    return Py_BuildValue("s", result.c_str());
}
PyDoc_STRVAR(doc_reload_all_stats,
    "reload_all_stats()\n\n"
    "Reload the configuration for all registered jobs.");


static PyObject *
collect_agent_change_config(PyObject *self, PyObject *args, PyObject *kwargs)
{
    bool storage = true;
    bool broadcast = true;

    static const char *argument_names[] = {"storage", "broadcast", nullptr};
    if (!PyArg_ParseTupleAndKeywords(
            args, kwargs, "|pp", const_cast<char**>(argument_names),
            &storage, &broadcast))
        return nullptr;

    std::string result;
    Py_BEGIN_ALLOW_THREADS
    result = collect_agent::change_config(storage, broadcast);
    Py_END_ALLOW_THREADS
    return Py_BuildValue("s", result.c_str());
}
PyDoc_STRVAR(doc_change_config,
    "change_config(storage=True, broadcast=True)\n\n"
    "Apply the given configuration to the current job.");


static PyObject *
collect_agent_restart_rstats(PyObject *self, PyObject *unused)
{
    std::string result;
    Py_BEGIN_ALLOW_THREADS
    result = collect_agent::restart_rstats();
    Py_END_ALLOW_THREADS
    return Py_BuildValue("s", result.c_str());
}
PyDoc_STRVAR(doc_restart_rstats,
    "restart_rstats()\n\n"
    "Reset the internal state of the rstats service, "
    "effectivelly boiling down to restarting it.");


static PyObject *
collect_agent_connect(PyObject *self, PyObject *args)
{
    PyObject * python_config_file = nullptr;
    if (!PyArg_ParseTuple(args, "O&", PyUnicode_FSConverter, &python_config_file))
        return nullptr;

    std::string config_file = PyBytes_AsString(python_config_file);
    Py_DECREF(python_config_file);

    bool success = true;
    const char * message = "ERROR connecting to collect-agent";
    Py_BEGIN_ALLOW_THREADS
    success = collect_agent::register_collect(config_file);
    if (!success) {
        collect_agent::send_log(LOG_ERR, message);
    } else {
        collect_agent::send_log(LOG_DEBUG, "Starting Job");
    }
    Py_END_ALLOW_THREADS

    if (!success) {
        PySys_WriteStderr("%s\n", message);
        Py_Exit(1);
    }
    Py_RETURN_NONE;
}
PyDoc_STRVAR(doc_connect,
    "connect(config_file)\n\n"
    "Helper function to quickly open and check a new connection to RStats.");


static PyMethodDef CollectAgentMethods[] = {
    {
        "register_collect",
        (PyCFunction)collect_agent_register_collect,
        METH_VARARGS | METH_KEYWORDS,
        doc_register_collect
    },
    {
        "send_log",
        (PyCFunction)collect_agent_send_log,
        METH_VARARGS | METH_KEYWORDS,
        doc_send_log
    },
    {
        "send_stat",
        (PyCFunction)collect_agent_send_stat,
        METH_VARARGS | METH_KEYWORDS,
        doc_send_stat
    },
    {
        "store_files",
        (PyCFunction)collect_agent_store_files,
        METH_VARARGS | METH_KEYWORDS,
        doc_store_files
    },
    {
        "reload_stat",
        collect_agent_reload_stat,
        METH_NOARGS,
        doc_reload_stat
    },
    {
        "remove_stat",
        collect_agent_remove_stat,
        METH_NOARGS,
        doc_remove_stat
    },
    {
        "reload_all_stats",
        collect_agent_reload_all_stats,
        METH_NOARGS,
        doc_reload_all_stats
    },
    {
        "change_config",
        (PyCFunction)collect_agent_change_config,
        METH_VARARGS | METH_KEYWORDS,
        doc_change_config
    },
    {
        "restart_rstats",
        collect_agent_restart_rstats,
        METH_NOARGS,
        doc_restart_rstats
    },
    {
        "connect",
        collect_agent_connect,
        METH_VARARGS,
        doc_connect
    },
    /* Sentinel */
    {NULL, NULL, 0, NULL}
};


static struct PyModuleDef collect_agent_module = {
    PyModuleDef_HEAD_INIT,
    /* name of module */
    "collect_agent",
    /* module documentation, may be NULL */
    "Collect-Agent API\n\n"
    "Collection of tools aimed at OpenBACH agents to send informations "
    "such as logs, files or statistics to their collector.",
    /* size of per-interpreter state of the module, or -1 if the module keeps state in global variables. */
    -1,
    CollectAgentMethods
};


PyMODINIT_FUNC
PyInit__collect_agent(void)
{
    PyObject *module;

    module = PyModule_Create(&collect_agent_module);
    if (module == nullptr)
        return nullptr;
/*
    CollectAgentError = PyErr_NewException("collect_agent.CollectAgentError", NULL, NULL);
    Py_INCREF(CollectAgentError);
    PyModule_AddObject(module, "CollectAgentError", CollectAgentError);
*/
    __version__ = Py_BuildValue("s", VERSION);
    PyModule_AddObject(module, "__version__", __version__);
    
    return module;
}

};
