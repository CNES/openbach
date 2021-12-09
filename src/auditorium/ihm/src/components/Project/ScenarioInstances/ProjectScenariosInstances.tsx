import * as React from "react";
import {connect} from "react-redux";

import Checkbox from "material-ui/Checkbox";
import IconButton from "material-ui/IconButton";
import {List, ListItem} from "material-ui/List";
import RaisedButton from "material-ui/RaisedButton";

import {clearStartScenarioInstanceError, notify} from "../../../actions/global";
import {deleteScenarioInstance, getFilteredScenarioInstancesFromProject, getScenarioInstancesFromProject} from "../../../actions/scenario";
import {installJobs} from "../../../api/agent";
import {IJobStateQuery} from "../../../interfaces/job.interface";
import {IMissingJobEntities, IScenarioInstance, IScenarioInstanceState} from "../../../interfaces/scenarioInstance.interface";
import {getGenericDeleteIcon} from "../../../utils/theme";

import ActionDialog from "../../common/ActionDialog";
import PaddedContainer from "../../common/PaddedContainer";
import ScenarioInstanceListItem from "./ScenarioInstanceListItem";


interface IStyle {
    checkbox: React.CSSProperties;
    delete: React.CSSProperties;
};


const styles: IStyle = {
    checkbox: {
        margin: "12px 0",
        width: "auto",
    },
    delete: {
        margin: "-12px 0",
        padding: 0,
    },
};


class ProjectScenariosInstances extends React.Component<IProps & IStoreProps & IDispatchProps, IState> {
    private static buildInstancesSelection(instances: IScenarioInstance[], allSelected: boolean) {
        return instances.map((instance: IScenarioInstance) => (
            instance.status === "Scheduling" || instance.status === "Running" ? false : allSelected));
    }

    private static checkAllSelected(instances: IScenarioInstance[], selected: boolean[]) {
        for (let i = 0; i < instances.length; ++i) {
            const instance = instances[i];
            const checked = selected[i];
            if (!checked && instance.status !== "Scheduling" && instance.status !== "Running") {
                return false;
            }
        }
        return true;
    }

    constructor(props) {
        super(props);
        const instances = props.scenarioName != null ? props.instances.current : props.instances.all;
        const selected = ProjectScenariosInstances.buildInstancesSelection(instances, false);
        this.state = { allSelected: false, deleteOpen: false, instances, selected };

        this.onSelectAll = this.onSelectAll.bind(this);
        this.onSelectInstance = this.onSelectInstance.bind(this);
        this.onDeleteInstances = this.onDeleteInstances.bind(this);
        this.showDeleteInstances = this.showDeleteInstances.bind(this);
        this.hideDeleteInstances = this.hideDeleteInstances.bind(this);
        this.onLoadMore = this.onLoadMore.bind(this);
        this.clearStartError = this.clearStartError.bind(this);
        this.doInstallJobs = this.doInstallJobs.bind(this);
    }

    public render() {
        const {scenarioName, instanceOpened, onInstancePopup} = this.props;
        const {startError} = this.props.instances;
        const {instances, allSelected, selected, deleteOpen} = this.state;
        const items = instances.map((scenarioInstance: IScenarioInstance, index: number) => (
            <ScenarioInstanceListItem
                key={scenarioInstance.scenario_instance_id}
                instance={scenarioInstance}
                primary={scenarioName == null}
                verbose={scenarioInstance.scenario_instance_id === instanceOpened}
                onInstancePopup={onInstancePopup}
                checked={selected[index]}
                onInstanceChecked={this.onSelectInstance}
            />
        ));

        const deleteIcon = (
            <IconButton
                tooltip="Delete selected instances"
                tooltipPosition="top-right"
                touch={true}
                onClick={this.showDeleteInstances}
                style={styles.delete}
            >
                {getGenericDeleteIcon()}
            </IconButton>
        );
        const deleteCheckbox = (
            <Checkbox
                checked={allSelected}
                onCheck={this.onSelectAll}
                style={styles.checkbox}
            />
        );

        const selectedCount = selected.reduce((accumulator, element) => element ? accumulator + 1 : accumulator, 0);
        const moreEnabled = scenarioName == null ? this.props.instances.more : this.props.instances.moreCurrent;

        return (
            <PaddedContainer>
                <List>
                    <ListItem
                        leftCheckbox={deleteIcon}
                        rightIconButton={deleteCheckbox}
                        primaryText="Select All"
                    />
                    {items}
                </List>
                <RaisedButton
                    label="Load More"
                    secondary={true}
                    disabled={!moreEnabled}
                    onTouchTap={this.onLoadMore}
                />
                <ActionDialog
                    title="Delete scenario instances"
                    modal={false}
                    open={deleteOpen}
                    auto={false}
                    cancel={{label: "No", action: this.hideDeleteInstances}}
                    actions={[{label: "Yes", action: this.onDeleteInstances}]}
                >
                    <p>The informations of {selectedCount} scenario
                    instance{selectedCount > 1 ? "s" : ""} will be
                    removed from the database. You will not be able
                    to recover them.</p>
                    <p>Proceed?</p>
                </ActionDialog>
                <ActionDialog
                    title="Missing jobs on agents"
                    modal={false}
                    open={startError != null}
                    auto={false}
                    cancel={{label: "No", action: this.clearStartError}}
                    actions={[{label: "Yes", action: this.doInstallJobs}]}
                >
                    <p>{startError && startError.error}</p>
                    <p><ul>{this.missingJobs(startError && startError.entities)}</ul></p>
                    <p>Would you like to install them?</p>
                </ActionDialog>
            </PaddedContainer>
        );
    }

    public componentWillReceiveProps(nextProps: IProps & IStoreProps & IDispatchProps) {
        const instances = nextProps.scenarioName != null ? nextProps.instances.current : nextProps.instances.all;
        if (instances.length === 0) {
            // Changing selected scenario => reset selection
            const selected = ProjectScenariosInstances.buildInstancesSelection(instances, false);
            this.setState({ allSelected: false, instances, selected });
        } else if (instances !== this.state.instances) {
            // New/deleted instances => update selected array
            const previouslySelected = {};
            this.state.instances.filter((i, index: number) => this.state.selected[index]).forEach((instance: IScenarioInstance) => {
                previouslySelected[instance.scenario_instance_id] = true;
            });
            const selected = ProjectScenariosInstances.buildInstancesSelection(instances, false);
            instances.forEach((instance: IScenarioInstance, index: number) => {
                if (previouslySelected.hasOwnProperty(instance.scenario_instance_id)) {
                    selected[index] = true;
                }
            });
            const allSelected = ProjectScenariosInstances.checkAllSelected(instances, selected);
            this.setState({ allSelected, instances, selected });
        }
    }

    private onSelectAll(event, isInputChecked: boolean) {
        const selected = ProjectScenariosInstances.buildInstancesSelection(this.state.instances, isInputChecked);
        this.setState({ allSelected: isInputChecked, selected });
    }

    private onSelectInstance(instanceId: number, checked: boolean) {
        const {instances, selected} = this.state;
        const index: number = instances.findIndex((instance: IScenarioInstance) => instance.scenario_instance_id === instanceId);
        if (index >= 0) {
            selected[index] = checked;
            const allSelected = ProjectScenariosInstances.checkAllSelected(instances, selected);
            if (allSelected !== this.state.allSelected) {
                this.setState({ allSelected });
            } else {
                this.setState({ selected });
            }
        }
    }

    private showDeleteInstances() {
        if (this.state.selected.reduce((accumulator, element) => element ? accumulator + 1 : accumulator, 0)) {
            this.setState({ deleteOpen: true });
        }
    }

    private hideDeleteInstances() {
        this.setState({ deleteOpen: false });
    }

    private onDeleteInstances() {
        const {instances, selected} = this.state;
        const remove = instances.filter((instance, index: number) => selected[index]);
        this.setState({ allSelected: false, deleteOpen: false, selected: instances.map(() => false) });
        remove.forEach((instance: IScenarioInstance) => this.props.deleteInstance(instance));
    }

    private onLoadMore() {
        const {projectName, scenarioName, loadMore} = this.props;
        loadMore(projectName, scenarioName);
    }

    private clearStartError() {
        this.props.clearStartScenarioError();
    }

    private doInstallJobs() {
        const {startError} = this.props.instances;
        if (startError != null) {
            const {entities} = startError;
            Object.keys(entities).forEach((entity_name: string) => {
                const entity = Reflect.get(entities, entity_name);
                const {address} = entity.agent;
                installJobs(address, entity.jobs).then((onSuccess) => {
                    this.props.notify("Installation of jobs on " + entity_name + " started");
                    if (this.props.jobsListener != null) {
                        this.props.jobsListener(entity.jobs.map((n) => ({ agent: entity.agent, jobName: n, operation: "install" })));
                    }
                }).catch((error) => {
                    this.props.notify("Failed installing jobs on " + entity_name + ": " + error);
                });
            });
        }
        this.clearStartError();
    }

    private missingJobs(entities?: IMissingJobEntities) {
        if (entities == null) { return []; }

        return Object.keys(entities).map((entity_name: string, i: number) => (
            <li key={i}>Entity {entity_name}:<ul>
            {Reflect.get(entities, entity_name).jobs.map((job: string, idx: number) => <li key={idx}>{job}</li>)}
            </ul></li>
        ));
    }
};


interface IState {
    allSelected: boolean;
    deleteOpen: boolean;
    selected: boolean[];
    instances: IScenarioInstance[];
};


interface IProps {
    projectName: string;
    scenarioName?: string;
    onInstancePopup: (id: number) => void;
    instanceOpened: number;
    jobsListener?: (jobs: IJobStateQuery[]) => void;
};


interface IStoreProps {
    instances: IScenarioInstanceState;
};


const mapStoreToProps = (store): IStoreProps => ({
    instances: store.scenario,
});


interface IDispatchProps {
    deleteInstance: (scenarioInstance: IScenarioInstance) => void;
    loadMore: (project: string, scenario?: string) => void;
    clearStartScenarioError: () => void;
    notify: (message: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    clearStartScenarioError: () => dispatch(clearStartScenarioInstanceError()),
    deleteInstance: (scenarioInstance: IScenarioInstance) => dispatch(deleteScenarioInstance(scenarioInstance)),
    loadMore: (project: string, scenario?: string) => dispatch(
        scenario == null ? getScenarioInstancesFromProject(project) : getFilteredScenarioInstancesFromProject(project, scenario)),
    notify: (message: string) => dispatch(notify(message)),
});


export default connect<IStoreProps, IDispatchProps, IProps>(mapStoreToProps, mapDispatchToProps)(ProjectScenariosInstances);
