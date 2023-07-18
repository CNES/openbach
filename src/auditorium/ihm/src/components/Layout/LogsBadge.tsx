import React from 'react';

import Badge from '@mui/material/Badge';
import DialogContent from '@mui/material/DialogContent';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';

import Check from '@mui/icons-material/Check';
import Delete from '@mui/icons-material/DeleteForever';

import Dialog from '../common/ActionDialog';
import MenuButton from '../common/MenuButton';

import {getLogs} from '../../api/global';
import {useSelector, useDispatch} from '../../redux';
import {dismissLog, dismissAll, markAsRead, markAsSeen} from '../../redux/logs';
import type {ILog} from '../../utils/interfaces';


const formatLog = (log: ILog) => {
    const date = new Date(log.timestamp);
    const time = date.toLocaleTimeString();
    return `[${time}] ${log.severity} on ${log.source}`;
};


const LogsBadge: React.FC<Props> = (props) => {
    const dispatch = useDispatch();
    const {logs, pending, healthy} = useSelector((state) => state.logs);
    const [log, setLog] = React.useState<ILog>();

    const showLog = React.useCallback((id: string) => {
        const found = logs.find((l: ILog) => l.id === id);
        setLog(found);
    }, [logs]);

    const handleClose = React.useCallback(() => {
        setLog((l?: ILog) => {
            if (l != null) {
                dispatch(markAsRead(l.id));
            }
            return undefined;
        });
    }, [dispatch]);

    const handleDismiss = React.useCallback(() => {
        setLog((l?: ILog) => {
            if (l != null) {
                dispatch(dismissLog(l.id));
            }
            return undefined;
        });
    }, [dispatch]);

    const handleSeen = React.useCallback(() => {
        dispatch(markAsSeen());
    }, [dispatch]);

    const handleDismissAll = React.useCallback(() => {
        dispatch(dismissAll());
    }, [dispatch]);

    const fetchLogs = React.useCallback(() => {
        dispatch(getLogs({delay: 10000}));
    }, [dispatch]);

    React.useEffect(() => {
        const logsTimer = setInterval(fetchLogs, 5000);
        return () => clearInterval(logsTimer);
    }, [fetchLogs]);

    return (
        <React.Fragment>
            <Badge badgeContent={healthy ? pending : "?"} color="secondary">
                <MenuButton title="Latest Logs" onOpen={handleSeen}>
                    <MenuItem
                        key="__THIS_IS_NOT_AN_ID__"
                        onClick={handleDismissAll}
                        disabled={logs.length === 0}
                    >
                        <ListItemIcon><Delete /></ListItemIcon>
                        Dismiss All
                    </MenuItem>
                    {logs.map((l: ILog) => (
                        <MenuItem key={l.id} onClick={() => showLog(l.id)} selected={!l.checked}>
                            <ListItemIcon>
                                <Check color={l.checked ? "primary" : "inherit"} />
                            </ListItemIcon>
                            {formatLog(l)}
                        </MenuItem>
                    ))}
                </MenuButton>
            </Badge>
            {log != null && <Dialog
                title={formatLog(log)}
                open={true}
                cancel={{label: "OK", action: handleClose}}
                actions={[{label: "Dismiss", action: handleDismiss}]}
            >
                <DialogContent sx={{boxSizing: "border-box", height: "100%", width: "100%"}}>
                    <pre>{log.message}</pre>
                </DialogContent>
            </Dialog>}
        </React.Fragment>
    );
};


interface Props {
}


export default LogsBadge;
