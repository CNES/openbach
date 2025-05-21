import os
import sys
import time
import signal
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


@contextlib.contextmanager
def replace_all_signals(handler):
    def replace_signal(signum):
        with contextlib.suppress(OSError):
            return signal.signal(signum, handler)
    backup = {
            sig: hdl
            for sig in signal.valid_signals()
            if (hdl := replace_signal(sig)) is not None
    }
    try:
        yield
    finally:
        for sig, handler in backup.items():
            signal.signal(sig, handler)


def wait_for_signal(handler=None):
    if handler is None:
        def handler(signum, frame):
            pass
    with replace_all_signals(handler):
        signal.pause()


def now():
    """Current timestamp with a suitable format for stats storage"""
    return int(time.time() * 1000)
