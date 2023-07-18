import React from 'react';
import {useFieldArray} from 'react-hook-form';

import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import Add from '@mui/icons-material/Add';

import ListItem from '../common/NestedListItem';

import ScenarioArgumentsItem from './ScenarioArgumentsItem';


const ScenarioArguments: React.FC<Props> = (props) => {
    const {fields, append, remove} = useFieldArray({name: "arguments"});

    const handleEntryDelete = React.useCallback((index: number) => () => {
        remove(index);
    }, [remove]);

    const handleEntryAdd = React.useCallback(() => {
        append({name: "", description: ""});
    }, [append]);

    const items = fields.map((field, index: number) => (
        <ScenarioArgumentsItem
            key={field.id}
            name={`arguments.${index}`}
            label="Description"
            type="Argument"
            onDelete={handleEntryDelete(index)}
        />
    ));

    items.push((
        <ListItemButton key="notAnumber" onClick={handleEntryAdd}>
            <ListItemIcon><Add /></ListItemIcon>
            <ListItemText primary="Add new argument" />
        </ListItemButton>
    ));

    return <ListItem primary="Arguments" nestedItems={items} />;
};


interface Props {
}


export default ScenarioArguments;
