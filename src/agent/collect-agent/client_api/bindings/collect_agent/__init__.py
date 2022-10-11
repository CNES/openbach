import os
import sys
import time
import contextlib

from ._collect_agent import (
        __doc__,
        __version__,
        register_collect,
        send_log,
        send_stat,
        store_files,
        reload_stat,
        remove_stat,
        reload_all_stats,
        change_config,
        restart_rstats,
        connect,
)


@contextlib.contextmanager
def use_configuration(filepath):
    """Context manager to ensure proper registration and teardown from a job to rstats"""

    # Not importing syslog on purpose to keep the file cross-platform
    success = register_collect(filepath)
    if not success:
        message = 'ERROR connecting to collect-agent'
        send_log(3, message)  # syslog.LOG_ERR
        sys.exit(message)
    send_log(7, 'Starting job ' + os.environ.get('JOB_NAME', '!'))  # syslog.LOG_DEBUG
    try:
        yield
    except Exception:
        import traceback
        message = traceback.format_exc()
        send_log(2, message)  # syslog.LOG_CRIT
        raise
    except SystemExit as e:
        if e.code != 0:
            send_log(2, 'Abrupt program termination: ' + str(e.code))  # syslog.LOG_CRIT
        raise
    finally:
        remove_stat()


def now():
    """Current timestamp with a suitable format for stats storage"""
    return int(time.time() * 1000)
