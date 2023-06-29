import React from 'react';
import {useParams} from 'react-router';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import ProjectDetails from './ProjectDetails';
import ScenariosList from '../Scenarios/ScenariosList';
import ScenarioInstancesList from '../Scenarios/ScenarioInstancesList';

import {getAgents} from '../../api/agents';
import {getJobs} from '../../api/jobs';
import {getProject} from '../../api/projects';
import {useDispatch} from '../../redux';
import {selectNewScenario} from '../../redux/project';
import {setTitle} from '../../redux/message';


const TabPanel: React.FC<React.PropsWithChildren<TabProps>> = (props) => {
    const {value, selected, children} = props;
    const hidden = value !== selected;

    return (
        <div role="tabpanel" hidden={hidden}>
            {!hidden && children}
        </div>
    );
};


const Project: React.FC<React.PropsWithChildren<Props>> = (props) => {
    const {projectId, scenarioId} = useParams();
    const dispatch = useDispatch();
    const [selectedTab, storeTab] = React.useState<TabKeys>('project');

    const handleTabChange = React.useCallback((event: React.SyntheticEvent, value: TabKeys) => {
        storeTab(value);
    }, []);

    React.useEffect(() => {
        dispatch(setTitle(`Project '${projectId}'`));
        if (projectId) {
            const promise = dispatch(getProject({name: projectId}));
            return () => {promise.abort();};
        }
    }, [dispatch, projectId]);

    React.useEffect(() => {
        dispatch(selectNewScenario());
        if (scenarioId) {
            storeTab("selected");
        }
    }, [scenarioId, dispatch]);

    React.useEffect(() => {
        const promises = [
            dispatch(getAgents({services: false})),
            dispatch(getJobs()),
        ];
        return () => {promises.forEach((promise) => {promise.abort();});};
    }, [dispatch]);

    return (
        <React.Fragment>
            <Tabs value={selectedTab} onChange={handleTabChange} centered variant="fullWidth">
                <Tab label="Project" value="project" />
                <Tab label="Scenarios" value="scenarios" />
                <Tab label="Instances" value="instances" />
                <Tab label={scenarioId || "No Scenario Selected"} value="selected" disabled={!scenarioId} />
            </Tabs>
            <TabPanel value="project" selected={selectedTab}>
                <ProjectDetails />
            </TabPanel>
            <TabPanel value="scenarios" selected={selectedTab}>
                <ScenariosList />
            </TabPanel>
            <TabPanel value="instances" selected={selectedTab}>
                {projectId && <ScenarioInstancesList project={projectId} />}
            </TabPanel>
            <TabPanel value="selected" selected={selectedTab}>
                {props.children}
            </TabPanel>
        </React.Fragment>
    );
};


interface Props {
}


interface TabProps {
    value: TabKeys;
    selected: TabKeys;
}


type TabKeys = "project" | "scenarios" | "instances" | "selected";


export default Project;
