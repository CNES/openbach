import * as React from "react";
import {connect} from "react-redux";

import {getAgents} from "../../actions/agent";
import {notify} from "../../actions/global";
import {getUsersList} from "../../actions/login";
import {changeOwners, refreshTopologyForProject, showNetworksForProject} from "../../actions/project";
import {deleteProject} from "../../api/project";
import {IAgent} from "../../interfaces/agent.interface";
import {IJobStateQuery} from "../../interfaces/job.interface";
import {ILoginCredentials} from "../../interfaces/login.interface";
import {IEntity, INetwork, IProject} from "../../interfaces/project.interface";

import DownloadButton from "../common/DownloadButton";
import JSONEditor from "../common/JSONEditor";
import PaddedContainer from "../common/PaddedContainer";
import TitledPaper from "../common/TitledPaper";
import {ITopologyNode} from "../common/Topology";
import ProjectDelete from "../Projects/ProjectItemDeleteForm";
import EntityCardContainer from "./Entity/EntityCardContainer";
import JobsStatusesInfos from "./Entity/JobsStatusesInfos";
import {miscellaneousActionStyle, ProjectMiscellaneousAction} from "./ProjectMiscellaneousAction";
import ProjectMiscellaneousSelect from "./ProjectMiscellaneousSelect";
import ProjectTopology from "./ProjectTopology";


interface IStyles {
    canvas: React.CSSProperties;
    description: React.CSSProperties;
    entity: React.CSSProperties;
    misc: React.CSSProperties;
    topology: React.CSSProperties;
};


const styles: IStyles = {
    canvas: {
        display: "inline-block",
        height: "800px",
        width: "70%",
    },
    description: {
        marginBottom: "8px",
        paddingBottom: "8px",
    },
    entity: {
        display: "inline-block",
        width: "30%",
    },
    misc: {
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
    },
    topology: {
        alignItems: "flex-start",
        display: "flex",
    },
};


export class ProjectDescription extends React.Component<IProps & IStoreProps & IDispatchProps, IState> {
    private entityContainer: EntityCardContainer;

    constructor(props) {
        super(props);
        this.state = {
            deleteProjectOpen: false,
            jobs: [],
            selectedEntity: undefined,
            selectedNetwork: undefined,
        };

        this.handleSelectedNode = this.handleSelectedNode.bind(this);
        this.handleUnselectNode = this.handleUnselectNode.bind(this);
        this.listenForJobs = this.listenForJobs.bind(this);
        this.setEntityCardContainer = this.setEntityCardContainer.bind(this);
        this.alertEntityOfChangeOnAgent = this.alertEntityOfChangeOnAgent.bind(this);
        this.onShowDeleteProject = this.onShowDeleteProject.bind(this);
        this.onDeleteProject = this.onDeleteProject.bind(this);
        this.onRefreshNTP = this.onRefreshNTP.bind(this);
    }

    public render() {
        const {project, login} = this.props;
        const isPublic = !project.owners || project.owners.length === 0;
        const users = this.props.users.map((user: ILoginCredentials) => user.username);

        const description = project.description.split("\n").map((descr: string, index: number) => (
            <p key={index}>{descr}</p>
        ));

        return (
            <PaddedContainer>
                <TitledPaper title={`Project '${project.name}'`}>
                    <div style={styles.description}>{description}</div>
                    <ProjectMiscellaneousSelect
                        title="Project Owners"
                        label="Share"
                        initial={project.owners}
                        options={users}
                        canDoAction={login.is_admin || (!isPublic && login.is_user)}
                        onClick={this.props.updateOwners}
                    />
                    <ProjectMiscellaneousSelect
                        title="Hidden Networks"
                        label="Show"
                        initial={project.hidden_network}
                        options={project.hidden_network}
                        canDoAction={login.is_user}
                        onClick={this.props.showNetworks}
                    />
                    <div style={styles.misc}>
                        <ProjectMiscellaneousAction
                            label="Refresh Topology"
                            canDoAction={login.is_user}
                            onClick={this.props.refreshTopology}
                        />
                        <ProjectMiscellaneousAction
                            label="Fetch NTP offset"
                            canDoAction={login.is_user}
                            onClick={this.onRefreshNTP}
                        />
                        <DownloadButton
                            route={`/project/${project.name}/`}
                            filename={`${project.name}.json`}
                            type="Project"
                            disabled={false}
                            style={miscellaneousActionStyle}
                        />
                        <JSONEditor
                            route={`/project/${project.name}`}
                            type="Project"
                            disabled={!login.is_user}
                            style={miscellaneousActionStyle}
                        />
                        <ProjectMiscellaneousAction
                            label="Delete Project"
                            canDoAction={login.is_admin || (!isPublic && login.is_user)}
                            onClick={this.onShowDeleteProject}
                        />
                        <ProjectDelete
                            open={this.state.deleteProjectOpen}
                            project={project.name}
                            onRequestClose={this.onDeleteProject}
                        />
                    </div>
                </TitledPaper>
                <TitledPaper title="Topology">
                    <div style={styles.topology}>
                        <ProjectTopology
                            project={project}
                            handleSelectedNode={this.handleSelectedNode}
                            handleUnselectNode={this.handleUnselectNode}
                            style={styles.canvas}
                        />
                        <EntityCardContainer
                            ref={this.setEntityCardContainer}
                            selectedEntity={this.state.selectedEntity}
                            selectedNetwork={this.state.selectedNetwork}
                            projectEntities={this.props.project.entity}
                            projectName={this.props.project.name}
                            jobsListener={this.listenForJobs}
                            unselectNode={this.handleUnselectNode}
                            style={styles.entity}
                        />
                    </div>
                </TitledPaper>
                <JobsStatusesInfos
                    queries={this.state.jobs}
                    onActionDone={this.alertEntityOfChangeOnAgent}
                />
            </PaddedContainer>
        );
    }

    public componentDidMount() {
        this.props.listUsers();
    }

    public listenForJobs(jobs: IJobStateQuery[]) {
        this.setState({ jobs });
    }

    private handleSelectedNetwork(network: INetwork) {
        this.setState({ selectedEntity: undefined, selectedNetwork: network });
    }

    private handleSelectedEntity(entity: IEntity) {
        this.setState({ selectedEntity: entity, selectedNetwork: undefined });
    }

    private handleSelectedNode(node: ITopologyNode) {
        const id = node.nodeID;
        const selectedEntity = this.props.project.entity.find((m: IEntity) => m.name === id);
        const selectedNetwork = this.props.project.network.find((n: INetwork) => n.address === id);
        this.setState({ selectedEntity, selectedNetwork });
    }

    private handleUnselectNode() {
        this.setState({ selectedEntity: undefined, selectedNetwork: undefined });
    }

    private setEntityCardContainer(entityCard: EntityCardContainer) {
        this.entityContainer = entityCard;
    }

    private alertEntityOfChangeOnAgent(agent: IAgent) {
        if (this.entityContainer) {
            this.entityContainer.refreshJobList(agent);
        }
    }

    private onShowDeleteProject() {
        this.setState({ deleteProjectOpen: true });
    }

    private onDeleteProject() {
        this.setState({ deleteProjectOpen: false });
    }

    private onRefreshNTP() {
        this.props.notify("Fetching NTP state on agents. Please wait!");
        this.props.refreshNtp();
    }
};


interface IState {
    deleteProjectOpen: boolean;
    jobs: IJobStateQuery[];
    selectedEntity: IEntity;
    selectedNetwork: INetwork;
};


interface IProps {
    project: IProject;
};


interface IStoreProps {
    login: ILoginCredentials;
    users: ILoginCredentials[];
};


const mapStoreToProps = (store): IStoreProps => ({
    login: store.login,
    users: store.users,
});


interface IDispatchProps {
    listUsers: () => void;
    notify: (message: string) => void;
    refreshNtp: () => void;
    refreshTopology: () => void;
    showNetworks: (networks: string[]) => void;
    updateOwners: (names: string[]) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    listUsers: () => dispatch(getUsersList()),
    notify: (message: string) => dispatch(notify(message)),
    refreshNtp: () => dispatch(getAgents(true, true)),
    refreshTopology: () => dispatch(refreshTopologyForProject()),
    showNetworks: (networks: string[]) => dispatch(showNetworksForProject(networks)),
    updateOwners: (names: string[]) => dispatch(changeOwners(names)),
});


export default connect<IStoreProps, IDispatchProps, IProps>(mapStoreToProps, mapDispatchToProps, null, {withRef: true})(ProjectDescription);
