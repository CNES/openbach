import React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import UpdateDialog from './AgentUpdate';
import Dialog from '../common/ActionDialog';

import {getAgentState, removeAgent} from '../../api/agents';
import {useDispatch} from '../../redux';


const AgentUninstall: React.FC<Props> = (props) => {
    const {name, address, collector} = props;
    const dispatch = useDispatch();
    const [update, storeUpdate] = React.useState<boolean>(false);
    const [removeLabel, storeRemoveLabel] = React.useState<string>();
    const [statusCode, storeStatusCode] = React.useState<number>(202);
    const [force, storeForce] = React.useState<{}>({});

    const forceUpdate = React.useCallback(() => {
        storeForce({});
    }, []);

    const handleRemove = React.useCallback(() => {
        storeRemoveLabel((label?: string) => {
            switch (label) {
                case "uninstall":
                    dispatch(removeAgent({address, detach: false})).then(forceUpdate);
                    break;
                case "detach":
                    dispatch(removeAgent({address, detach: true})).then(forceUpdate);
                    break;
            }
            return undefined;
        });
    }, [address, dispatch, forceUpdate]);

    const handleClose = React.useCallback(() => {
        storeRemoveLabel(undefined);
    }, []);

    const openRemoveDialog = React.useCallback(() => {
        storeRemoveLabel("uninstall");
    }, []);

    const openDetachDialog = React.useCallback(() => {
        storeRemoveLabel("detach");
    }, []);

    const openUpdateDialog = React.useCallback(() => {
        storeUpdate(true);
    }, []);

    const closeUpdateDialog = React.useCallback(() => {
        storeUpdate(false);
    }, []);

    React.useEffect(() => {
        let timeout: NodeJS.Timeout;
        const promise = dispatch(getAgentState({address}));
        promise.unwrap().then(({install, uninstall}) => {
            if (!install && !uninstall) {
                storeStatusCode(200);  // Agents installed by ansible lead to a 204
                return;
            }
            const lastInstallDate = new Date(install ? install.last_operation_date : 0);
            const lastUninstallDate = new Date(uninstall ? uninstall.last_operation_date : 0);
            const operation = lastInstallDate < lastUninstallDate ? uninstall : install;
            const code = operation ? operation.returncode : 202;
            if (code === 202) {
                timeout = setTimeout(forceUpdate, 2000);
            }
            storeStatusCode(code);
        }).catch((error: Error) => {
            if (error.name !== "AbortError") {
                storeStatusCode(500);
            }
        });
        return () => {promise.abort(); clearTimeout(timeout);};
    }, [force, address, dispatch, forceUpdate]);

    const noErrors = statusCode === 200 || statusCode === 204;
    const color = noErrors ? "secondary" : "primary";

    if (statusCode === 202) {
        return (
            <Box display="flex" flexDirection="row" mt={2}>
                <Button disabled variant="contained" sx={{mx: 1}}>
                    Operation Pending
                </Button>
            </Box>
        );
    }

    return (
        <Box display="flex" flexDirection="row" mt={2}>
            <Button variant="contained" color={color} onClick={openRemoveDialog} sx={{mx: 1}}>
                {noErrors ? "Uninstall" : "Error " + statusCode}
            </Button>
            <Button variant="contained" color={color} onClick={openUpdateDialog} sx={{mx: 1}}>
                Update
            </Button>
            <Button variant="contained" color={color} onClick={openDetachDialog} sx={{mx: 1}}>
                Detach
            </Button>
            <Dialog
                title="Are you sure?"
                open={Boolean(removeLabel)}
                cancel={{label: "Cancel", action: handleClose}}
                actions={[{label: "OK", action: handleRemove}]}
            >
                <DialogContent>
                    <DialogContentText>
                        Trully {removeLabel} this agent?
                    </DialogContentText>
                </DialogContent>
            </Dialog>
            <UpdateDialog
                open={update}
                onClose={closeUpdateDialog}
                initialValues={{name, address, collector}}
            />
        </Box>
    );
};


interface Props {
    name: string;
    address: string;
    collector: string;
    // Props required to trigger a redraw
    // do not remove unless you can redraw somehow
    reachable?: boolean;
    available?: boolean;
}


export default AgentUninstall;
