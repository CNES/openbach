import React from 'react';
import {Controller} from 'react-hook-form';

import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import TextField from '@mui/material/TextField';

import DeleteIcon from '../common/DeleteIcon';


const ScenarioArgumentsItem: React.FC<Props> = (props) => {
    const {type, label, name, onDelete, required} = props;

    return (
        <ListItem>
            <ListItemIcon onClick={onDelete} sx={{cursor: "pointer"}}>
                <DeleteIcon title={"Remove " + type} />
            </ListItemIcon>
            <Box display="flex" flexDirection="column" width="100%">
                <Controller
                    name={`${name}.name` as 'arguments.0.name' | 'constants.0.name'}
                    rules={{required: true}}
                    defaultValue=""
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <TextField
                            margin="dense"
                            variant="standard"
                            label="Name"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            fullWidth
                        />
                    )}
                />
                <Controller
                    name={`${name}.${label.toLowerCase()}` as 'arguments.0.description' | 'constants.0.value'}
                    rules={{required: Boolean(required)}}
                    defaultValue=""
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <TextField
                            margin="dense"
                            variant="standard"
                            label={label}
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            fullWidth
                        />
                    )}
                />
            </Box>
        </ListItem>
    );
};


interface Props {
    type: string;
    label: string;
    name: string;
    onDelete: () => void;
    required?: boolean;
}


export default ScenarioArgumentsItem;
