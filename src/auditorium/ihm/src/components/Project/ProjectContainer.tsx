import * as React from "react";
import {connect} from "react-redux";

import {Tab, Tabs} from "material-ui/Tabs";

import {getAgents} from "../../actions/agent";
import {clearCurrentScenarioInstances, clearScenarioInstances, setTitle} from "../../actions/global";
import {getSingleProject} from "../../actions/project";
import {getFilteredScenarioInstancesFromProject, getScenarioInstancesFromProject} from "../../actions/scenario";
import {IJobStateQuery} from "../../interfaces/job.interface";
import {IProject} from "../../interfaces/project.interface";
import {IScenarioInstance} from "../../interfaces/scenarioInstance.interface";
import muiTheme from "../../utils/theme";

import PaddedContainer from "../common/PaddedContainer";
import ProjectDescription from "./ProjectDescription";
import ProjectScenariosInstances from "./ScenarioInstances/ProjectScenariosInstances";
import ProjectScenarios from "./Scenarios/ProjectScenarios";


const selectedStyle: React.CSSProperties = {
    background: `linear-gradient(to right, ${muiTheme.tabs.backgroundColor}, ${muiTheme.palette.primary2Color}`,
};


class ProjectContainer extends React.Component<IProps & IStoreProps & IDispatchProps, IState> {
    private projectPage;  // TODO: Fix typing
    private changeToBuilderTab: () => void;

    constructor(props) {
        super(props);
        this.state = { currentTab: "project", currentInstanceOpened: null };
        this.changeToBuilderTab = this.changeTab.bind(this, "builder");
        this.changeTab = this.changeTab.bind(this);
        this.onScenarioInstanceDialogChange = this.onScenarioInstanceDialogChange.bind(this);
        this.setProjectPage = this.setProjectPage.bind(this);
        this.jobsListener = this.jobsListener.bind(this);
    }

    public render() {
        const {params, project} = this.props;
        if (!project) {
            return (
                <Tabs value="loading">
                    <Tab value="loading" label="Loading">
                        <PaddedContainer>
                            <p>Loading project {params.projectId}</p>
                        </PaddedContainer>
                    </Tab>
                </Tabs>
            );
        }

        const noScenario = "No scenario selected";
        const id = params.scenarioId;
        const extraProps = {
            instanceOpened: this.state.currentInstanceOpened,
            jobsListener: this.jobsListener,
            onInstancePopup: this.onScenarioInstanceDialogChange,
        };
        const currentScenario = id ? (
            <Tab value="builder" label={id} style={selectedStyle}>
                <PaddedContainer>
                    {React.Children.map(this.props.children, (child) => React.cloneElement(child as React.ReactElement<any>, extraProps))}
                </PaddedContainer>
            </Tab>
        ) : (
            <Tab value="builder" label={noScenario} style={selectedStyle}>
                <PaddedContainer>
                    <p>{noScenario}</p>
                </PaddedContainer>
            </Tab>
        );

        return (
            <Tabs value={this.state.currentTab} onChange={this.changeTab}>
                <Tab value="project" label="Project">
                    <ProjectDescription ref={this.setProjectPage} project={project} />
                </Tab>
                <Tab value="scenarios" label="Scenarios">
                    <ProjectScenarios project={project} onScenarioClick={this.changeToBuilderTab} />
                </Tab>
                <Tab value="instances" label="Instances">
                    <ProjectScenariosInstances
                        projectName={params.projectId}
                        instanceOpened={this.state.currentInstanceOpened}
                        onInstancePopup={this.onScenarioInstanceDialogChange}
                    />
                </Tab>
                {currentScenario}
            </Tabs>
        );
    }

    public componentDidMount() {
        const name = this.props.params.projectId;
        this.props.setTitle(`'${name}' Project`);
        this.props.loadAgents();
        this.props.loadProject(name);
        this.props.loadScenarioInstances(name);

        const scenario = this.props.params.scenarioId;
        this.props.clearCurrentInstances(scenario);
        if (scenario != null) {
            this.props.loadCurrentInstances(name, scenario);
        }
    }

    public componentDidUpdate(previousProps: IProps & IStoreProps & IDispatchProps) {
        const {projectId, scenarioId} = this.props.params;
        if (projectId !== previousProps.params.projectId) {
            this.props.clearAllInstances();
            this.props.loadScenarioInstances(projectId);
            this.props.clearCurrentInstances(scenarioId);
            if (scenarioId != null) { this.props.loadCurrentInstances(projectId, scenarioId); }
        } else if (scenarioId !== previousProps.params.scenarioId) {
            this.props.clearCurrentInstances(scenarioId);
            if (scenarioId != null) { this.props.loadCurrentInstances(projectId, scenarioId); }
        }
    }

    private changeTab(newTab: string) {
        this.setState({ currentTab: newTab });
    }

    private onScenarioInstanceDialogChange(id: number) {
        this.setState({ currentInstanceOpened: id });
    }

    private setProjectPage(page) {
        this.projectPage = page;
    }

    private jobsListener(jobs: IJobStateQuery[]) {
        if (this.projectPage != null) {
            this.projectPage.getWrappedInstance().listenForJobs(jobs);
        }
    }
};


interface IState {
    currentTab: string;
    currentInstanceOpened: number;
};


interface IProps {
    params: {
        projectId: string;
        scenarioId?: string;
    };
};


interface IStoreProps {
    project: IProject;
};


const mapStoreToProps = (store): IStoreProps => ({
    project: store.project.current,
});


interface IDispatchProps {
    loadAgents: () => void;
    loadProject: (name: string) => void;
    loadScenarioInstances: (project: string) => void;
    clearAllInstances: () => void;
    clearCurrentInstances: (scenario?: string) => void;
    loadCurrentInstances: (project: string, name: string) => void;
    setTitle: (title: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    clearAllInstances: () => dispatch(clearScenarioInstances()),
    clearCurrentInstances: (scenario?: string) => dispatch(clearCurrentScenarioInstances(scenario)),
    loadAgents: () => dispatch(getAgents(false)),
    loadCurrentInstances: (project: string, name: string) => dispatch(getFilteredScenarioInstancesFromProject(project, name)),
    loadProject: (name: string) => dispatch(getSingleProject(name)),
    loadScenarioInstances: (project: string) => dispatch(getScenarioInstancesFromProject(project)),
    setTitle: (title: string) => dispatch(setTitle(title)),
});


export default connect<IStoreProps, IDispatchProps, IProps>(mapStoreToProps, mapDispatchToProps)(ProjectContainer);
