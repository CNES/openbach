import * as React from "react";
import {connect} from "react-redux";
import {Creatable as ReactSelect, Option as ReactSelectOption} from "react-select";

import {getJobs as actionGetJobs} from "../../../actions/job";
import {changeEntity, removeEntity} from "../../../actions/project";
import {getJobs, installJobs, uninstallJobs} from "../../../api/agent";
import {IAgent} from "../../../interfaces/agent.interface";
import {IJob, IJobStateQuery} from "../../../interfaces/job.interface";
import {IEntity, INetwork} from "../../../interfaces/project.interface";

import EntityAgent from "./EntityAgent";
import EntityCardActionButton from "./EntityCardActionButton";
import EntityCardTemplate from "./EntityCardTemplate";
import JobActionSelector from "./JobActionSelector";


const image = require("../../../assets/images/server.svg");


class EntityCard extends React.Component<IProps & IStoreProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = { installedJobs: [], entityChange: false };
        this.handleEntityChange = this.handleEntityChange.bind(this);
        this.handleRemoveEntity = this.handleRemoveEntity.bind(this);
    }

    public render() {
        const {entity, jobs, jobsListener} = this.props;
        const { entityChange, installedJobs } = this.state;
        const linkedNetworks = (entity.networks || []).map((network: INetwork) => (
            <li key={network.interface}>{network.interface}: {network.ip} (network {network.name})</li>
        ));

        const actions = [(
            <EntityCardActionButton
                key="remove"
                label="Remove Entity"
                onClick={this.handleRemoveEntity}
            />
        )];

        if (entity.agent) {
            const remainingJobs = jobs.filter((job: IJob) => (
                installedJobs.find((name: string) => name === job.general.name) === undefined
            )).map((job: IJob) => job.general.name);
            actions.splice(0, 0,
                <JobActionSelector
                    key="install"
                    agent={entity.agent}
                    name="install"
                    options={remainingJobs}
                    action={installJobs}
                    listener={jobsListener}
                />,
                <JobActionSelector
                    key="uninstall"
                    agent={entity.agent}
                    name="uninstall"
                    options={installedJobs}
                    action={uninstallJobs}
                    listener={jobsListener}
                />,
            );
        }

        return (
            <EntityCardTemplate
                title={entity.name}
                subtitle={entity.description}
                media={image}
                actions={actions}
            >
                <ul>
                    <li>Description: <b>{entity.description}</b></li>
                    <li>OS: <b>Linux</b></li>
                    <li>Interfaces: <ul>{linkedNetworks}</ul></li>
                    <li>Agent:
                        <EntityAgent
                            jobs={installedJobs}
                            agent={entity.agent}
                            projectName={this.props.projectName}
                            modificationOngoing={entityChange}
                            changeAgent={this.handleEntityChange}
                        />
                    </li>
                </ul>
            </EntityCardTemplate>
        );
    }

    public componentDidMount() {
        this.props.loadJobs();
        const {agent} = this.props.entity;
        if (agent) {
            this.refreshJobList(agent);
        }
    }

    public componentWillReceiveProps(nextProps: IProps & IStoreProps & IDispatchProps) {
        const thisAgent = this.props.entity.agent;
        const nextAgent = nextProps.entity.agent;
        const thisModifiedAgent = this.props.refreshAgent;
        const nextModifiedAgent = nextProps.refreshAgent;
        const agentModified = nextModifiedAgent && !thisModifiedAgent;
        this.setState({ entityChange: this.state.entityChange && agentModified });
        if ((nextAgent && (!thisAgent || thisAgent.address !== nextAgent.address)) || (agentModified && (nextModifiedAgent.address === thisAgent.address))) {
            this.refreshJobList(nextAgent);
        } else if (agentModified) {
            this.props.clearAgent();
        }
    }

    private refreshJobList(agent: IAgent) {
        getJobs(agent.address).then((jobs_list: string[]) => {
            const installedJobs = jobs_list.map((job_name: string) => job_name);
            installedJobs.sort();
            this.setState({installedJobs});
            this.props.clearAgent();
        });
    }

    private handleEntityChange(newAgent: IAgent) {
        const {changeEntity, entity} = this.props;
        this.setState({ entityChange: true });
        changeEntity(entity, newAgent);
    }

    private handleRemoveEntity() {
        const {entity, onRemove, removeEntity} = this.props;
        onRemove();
        removeEntity(entity);
    }
};


interface IState {
    installedJobs: string[];
    entityChange: boolean;
};


interface IProps {
    entity: IEntity;
    projectName: string;
    refreshAgent: IAgent;
    clearAgent: () => void;
    jobsListener: (jobs: IJobStateQuery[]) => void;
    onRemove: () => void;
};


interface IStoreProps {
    jobs: IJob[];
};


const mapStoreToProps = (store): IStoreProps => ({
    jobs: store.job,
});


interface IDispatchProps {
    changeEntity: (entity: IEntity, agent: IAgent) => void;
    loadJobs: () => void;
    removeEntity: (entity: IEntity) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    changeEntity: (entity: IEntity, agent: IAgent) => dispatch(changeEntity(entity, agent)),
    loadJobs: () => dispatch(actionGetJobs()),
    removeEntity: (entity: IEntity) => dispatch(removeEntity(entity)),
});


export default connect<IStoreProps, IDispatchProps, IProps>(mapStoreToProps, mapDispatchToProps)(EntityCard);
