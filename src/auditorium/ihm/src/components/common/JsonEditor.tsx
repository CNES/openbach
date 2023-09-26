import React from 'react';

import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';

import Dialog from '../common/ActionDialog';

import type {Theme} from '@mui/material/styles';
import type {SxProps} from '@mui/system';


const JsonEditor: React.FC<Props> = (props) => {
    const {initial, onUpdate, label, disabled, sx} = props;
    const [open, storeOpen] = React.useState<boolean>(false);
    const [data, storeData] = React.useState<string>("");

    const handleOpen = React.useCallback(() => {
        storeOpen(true);
    }, [])

    const handleClose = React.useCallback(() => {
        storeOpen(false);
    }, [])

    const handleSubmit = React.useCallback((event: React.FormEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onUpdate(data);
        handleClose();
    }, [data, onUpdate, handleClose]);

    const handleDataChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        storeData(event.target.value);
    }, []);

    React.useEffect(() => {
        storeData(JSON.stringify(initial, null, 4));
    }, [initial]);

    return (
        <React.Fragment>
            <Button
                variant="contained"
                color="secondary"
                disabled={disabled}
                onClick={handleOpen}
                sx={sx}
            >
                Edit {label}
            </Button>
            <Dialog
                title="JSON Editor"
                modal
                open={open}
                onSubmit={handleSubmit}
                cancel={{label: "Cancel", action: handleClose}}
                actions={[{label: "Submit", action: "submit"}]}
            >
                <DialogContent sx={{width: 550}} dividers>
                    <TextField
                        margin="dense"
                        variant="standard"
                        label="Content"
                        value={data}
                        onChange={handleDataChange}
                        fullWidth
                        multiline
                        rows={25}
                    />
                </DialogContent>
            </Dialog>
        </React.Fragment>
    );
};


interface Props {
    label: string;
    initial: object;
    onUpdate: (json: string) => void;
    disabled?: boolean;
    sx?: SxProps<Theme>;
}


export default JsonEditor;
