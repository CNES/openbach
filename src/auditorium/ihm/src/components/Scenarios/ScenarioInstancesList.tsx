import React from 'react';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import DeleteIcon from '../common/DeleteIcon';
import Dialog from '../common/ActionDialog';
import ScenarioInstance from './ScenarioInstancesListItem';
import ScenarioInstanceDialog from './ScenarioInstanceDialog';

import {getScenariosInstances, getScenarioInstances, deleteScenarioInstance} from '../../api/scenarios';
import {useDispatch, useSelector} from '../../redux';
import type {IScenarioInstance} from '../../utils/interfaces';


const ScenarioInstancesList: React.FC<Props> = (props) => {
    const {project, scenario} = props;
    const instances = useSelector((state) => scenario
        ? state.project.currentScenarioInstances
        : state.project.scenarioInstances);
    const hasMoreInstances = useSelector((state) => scenario
        ? state.project.moreCurrentInstances
        : state.project.moreInstances);
    const dispatch = useDispatch();
    const [selectedInstance, storeSelectedInstance] = React.useState<number>();
    const [checked, storeChecked] = React.useState<{[id: number]: boolean;}>({});
    const [remove, storeRemove] = React.useState<number[]>([]);

    const handleOpenRemove = React.useCallback(() => {
        const remove = instances.filter(({status, scenario_instance_id}: IScenarioInstance) => (
            status !== "Scheduling" && status !== "Running" && checked[scenario_instance_id]
        ));
        storeRemove(remove.map(({scenario_instance_id}: IScenarioInstance) => scenario_instance_id));
    }, [instances, checked]);

    const handleCloseRemove = React.useCallback(() => {
        storeRemove([]);
    }, []);

    const handleRemove = React.useCallback(() => {
        remove.forEach((instance: number) => dispatch(deleteScenarioInstance({instance})));
        handleCloseRemove();
    }, [remove, handleCloseRemove, dispatch]);

    const handleCheckInstance = React.useCallback((id: number, checked: boolean) => {
        storeChecked((c) => ({...c, [id]: checked}));
    }, []);

    const handleCheckInstances = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const {checked} = event.target;
        storeChecked((c) => Object.fromEntries(Object.keys(c).map((k) => [k, checked])));
    }, []);

    const handleSelectInstance = React.useCallback((instanceId: number) => {
        storeSelectedInstance(instanceId);
    }, []);

    const handleClearInstance = React.useCallback(() => {
        storeSelectedInstance(undefined);
    }, []);

    const loadMoreInstances = React.useCallback(() => {
        if (hasMoreInstances) {
            const promise = scenario
                            ? dispatch(getScenarioInstances({project, scenario}))
                            : dispatch(getScenariosInstances({project}));
            promise.unwrap().then((payload) => {
                const updates = payload.map((s: IScenarioInstance) => (
                    [s.scenario_instance_id, false]
                ));
                storeChecked((c) => ({...c, ...Object.fromEntries(updates)}));
            });
            return promise;
        }
    }, [project, scenario, hasMoreInstances, dispatch]);

    React.useEffect(() => {
        if (!instances.length) {
            const promise = loadMoreInstances();
            if (promise) {
                return () => {promise.abort();};
            }
        }
    }, [instances, loadMoreInstances]);

    const amountChecked = Object.values(checked).reduce(({t, f}, value) => value ? {t: t + 1, f} : {f: f + 1, t}, {t: 0, f: 0})
    const indeterminate = amountChecked.t !== 0 && amountChecked.f !== 0;

    const scenarioInstance = instances.find((instance: IScenarioInstance) => instance.scenario_instance_id === selectedInstance);

    return (
        <React.Fragment>
            <List>
                <ListItem disablePadding secondaryAction={
                    <Checkbox
                        edge="end"
                        disableRipple
                        checked={!indeterminate && amountChecked.t !== 0} 
                        indeterminate={indeterminate}
                        onChange={handleCheckInstances}
                    />
                }>
                    <ListItemButton onClick={handleOpenRemove}>
                        <ListItemIcon>
                            <DeleteIcon title="Delete Selected Instances" />
                        </ListItemIcon>
                        <ListItemText primary="Delete Selected Instances" />
                    </ListItemButton>
                </ListItem>
                {instances.map((instance: IScenarioInstance) => (
                    <ScenarioInstance
                        key={instance.scenario_instance_id}
                        instance={instance}
                        checked={Boolean(checked[instance.scenario_instance_id])}
                        onSelect={handleSelectInstance}
                        onCheck={handleCheckInstance}
                    />
                ))}
            </List>
            <Button variant="contained" color="secondary" onClick={loadMoreInstances} sx={{mb: 2}}>
                Load More
            </Button>
            {scenarioInstance && <ScenarioInstanceDialog instance={scenarioInstance} onClose={handleClearInstance} />}
            {remove.length > 0 && <Dialog
                open
                title="Delete Scenario Instances"
                cancel={{label: "No", action: handleCloseRemove}}
                actions={[{label: "Yes", action: handleRemove}]}
            >
                <DialogContent>
                    <DialogContentText>
                        The informations of {remove.length} scenario
                        instance{remove.length > 1 ? "s" : ""} will be
                        removed from the database. You will not be able
                        to recover them.
                    </DialogContentText>
                    <DialogContentText>
                        Proceed?
                    </DialogContentText>
                </DialogContent>
            </Dialog>}
        </React.Fragment>
    );
};


interface Props {
    project: string;
    scenario?: string;
}


export default ScenarioInstancesList;
