import React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import type {SelectChangeEvent} from '@mui/material/Select';


const ProjectMiscellaneousSelect: React.FC<Props> = (props) => {
    const {title, label, initial, options, canDoAction, onAction} = props;
    const [selected, storeSelected] = React.useState<string[]>([]);

    const handleChange = React.useCallback((event: SelectChangeEvent<typeof selected>) => {
        const {value} = event.target;
        storeSelected(typeof value === 'string' ? [] : value);
    }, []);

    const handleClick = React.useCallback(() => {
        onAction(selected);
    }, [selected, onAction]);

    React.useEffect(() => {
        storeSelected(initial);
    }, [initial]);

    return (
        <Box display="flex" alignItems="center">
            <p>{title}</p>
            <FormControl size="small" sx={{flexGrow: 1, margin: "0 5px"}}>
                <Select
                    multiple
                    fullWidth
                    value={selected}
                    onChange={handleChange}
                    renderValue={(values) => (
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                            {values.map((value) => (
                                <Chip key={value} label={value} />
                            ))}
                        </Box>
                    )}
                >
                    {options.map((value) => (
                        <MenuItem key={value} value={value}>{value}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Button
                variant="contained"
                color="secondary"
                disabled={!canDoAction}
                onClick={handleClick}
            >
                {label}
            </Button>
        </Box>
    );
};


interface Props {
    title: string;
    label: string;
    initial: string[];
    options: string[];
    canDoAction: boolean;
    onAction: (values: string[]) => void;
}


export default ProjectMiscellaneousSelect;
