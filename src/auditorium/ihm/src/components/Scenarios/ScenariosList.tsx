import React from 'react';
import {useParams, useNavigate} from 'react-router';

import Box from '@mui/material/Box';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';

import CreateScenario from './CreateScenarioCard';
import ImportScenario from './ImportScenarioCard';
import ScenariosListItem from './ScenariosListItem';
import ScenarioLaunchDialog from './ScenarioLaunchDialog';
import Dialog from '../common/ActionDialog';

import {deleteScenario} from '../../api/scenarios';
import {useDispatch, useSelector} from '../../redux';
import {IScenario} from '../../utils/interfaces';


const ScenariosList: React.FC<Props> = (props) => {
    const {scenarioId} = useParams();
    const project = useSelector((state) => state.project.current);
    const favorites = useSelector((state) => state.login.favorites);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [scenarioToDelete, storeScenarioToDelete] = React.useState<string>();
    const [scenarioToLaunch, storeScenarioToLaunch] = React.useState<Launch>();

    const handleOpenLaunch = React.useCallback((scenario: Launch) => {
        storeScenarioToLaunch(scenario);
    }, []);

    const handleCloseLaunch = React.useCallback(() => {
        storeScenarioToLaunch(undefined);
    }, []);

    const handleOpenDelete = React.useCallback((name: string) => {
        storeScenarioToDelete(name);
    }, []);

    const handleCloseDelete = React.useCallback(() => {
        storeScenarioToDelete(undefined);
    }, []);

    const handleDelete = React.useCallback(() => {
        if (project?.name && scenarioToDelete) {
            dispatch(deleteScenario({project: project.name, scenario: scenarioToDelete}))
                .unwrap()
                .then(() => {if (scenarioToDelete === scenarioId) {navigate('/app/project/' + project.name);}});
        }
        handleCloseDelete();
    }, [project, scenarioToDelete, scenarioId, handleCloseDelete, dispatch, navigate]);

    const prefered = React.useMemo(() => {
        const projectKey = project?.name;
        if (!projectKey || !favorites.hasOwnProperty(projectKey)) {
            return {};
        }

        return Object.fromEntries(favorites[projectKey].map((key: string) => ([key, true])))
    }, [favorites, project]);

    const scenarios = React.useMemo(() => {
        const copy = project?.scenario?.slice() || [];
        return copy.sort((scenario: IScenario, other: IScenario) => scenario.name.localeCompare(other.name));
    }, [project]);

    const favoritedScenarios = scenarios.filter(
        (scenario: IScenario) => prefered[scenario.name]
    ).map((scenario: IScenario) => (
        <ScenariosListItem
            key={scenario.name}
            scenario={scenario}
            onLaunch={handleOpenLaunch}
            onDelete={handleOpenDelete}
        />
    ));

    const regularScenarios = scenarios.filter(
        (scenario: IScenario) => !prefered[scenario.name]
    ).map((scenario: IScenario) => (
        <ScenariosListItem
            key={scenario.name}
            scenario={scenario}
            onLaunch={handleOpenLaunch}
            onDelete={handleOpenDelete}
        />
    ));

    const needDivider = favoritedScenarios.length > 0 && 0 < regularScenarios.length;
    
    return (
        <React.Fragment>
            <List>{favoritedScenarios}</List>
            {needDivider && <Divider />}
            <List>{regularScenarios}</List>
            <Box
                display="flex"
                alignItems="flex-start"
                gap="10%"
                pl="10%"
                pr="10%"
                pt={5}
                width="100%"
                boxSizing="border-box"
            >
                <CreateScenario />
                <ImportScenario />
            </Box>
            <Dialog
                title="Really Delete this Scenario?"
                open={Boolean(scenarioToDelete)}
                cancel={{label: "Cancel", action: handleCloseDelete}}
                actions={[{label: "Delete", action: handleDelete}]}
            >
                <DialogContent>
                    <DialogContentText>
                        The scenario "{scenarioToDelete}" will be deleted. This
                        action is unrecoverable. Do you want to continue?
                    </DialogContentText>
                </DialogContent>
            </Dialog>
            {project && scenarioToLaunch && <ScenarioLaunchDialog
                project={project.name}
                scenario={scenarioToLaunch.scenario}
                arguments={scenarioToLaunch.args}
                onClose={handleCloseLaunch}
            />}
        </React.Fragment>
    );
};


interface Props {
}


interface Launch {
    scenario: string;
    args: string[];
}


export default ScenariosList;
