import React from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';


const ActionDialog: React.FC<React.PropsWithChildren<Props>> = (props) => {
    const {title, open, modal, cancel, actions, onSubmit, children} = props;

    const handleClose = React.useCallback((event: React.FormEvent, reason: string) => {
        if (!modal || (reason !== "escapeKeyDown" && reason !== "backdropClick")) {
            cancel.action();
        }
    }, [modal, cancel]);

    const buttons = actions.map((action: ActionButton, index: number) => action.action === "submit" ? (
        <Button key={index} type="submit" color="primary">
            {action.label}
        </Button>
    ) : (
        <Button key={index} onClick={action.action} color="primary">
            {action.label}
        </Button>
    ));
    buttons.push((
        <Button key={actions.length} onClick={cancel.action} color="secondary">
            {cancel.label}
        </Button>
    ));

    if (onSubmit) {
        return (
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{title}</DialogTitle>
                <form onSubmit={onSubmit}>
                    {children}
                    <DialogActions>{buttons}</DialogActions>
                </form>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{title}</DialogTitle>
            {children}
            <DialogActions>{buttons}</DialogActions>
        </Dialog>
    );
};


interface CancelButton {
    label: string;
    action: () => void;
}


interface ActionButton {
    label: string;
    action: "submit" | (() => void);
}


interface Props {
    title: string;
    open: boolean;
    modal?: boolean;
    onSubmit?: (event: React.FormEvent) => void;
    cancel: CancelButton;
    actions: ActionButton[];
}


export default ActionDialog;
