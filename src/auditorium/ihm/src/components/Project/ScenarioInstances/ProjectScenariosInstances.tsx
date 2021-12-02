import * as React from "react";
import {connect} from "react-redux";

import Checkbox from "material-ui/Checkbox";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import {List, ListItem} from "material-ui/List";

import {deleteScenarioInstance, getScenarioInstancesFromProject, getFilteredScenarioInstancesFromProject} from "../../../actions/scenario";
import {IScenarioInstance} from "../../../interfaces/scenarioInstance.interface";
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
    }

    public render() {
        const {scenarioName, instanceOpened, onInstancePopup} = this.props;
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
};


interface IStoreProps {
    instances: {
        all: IScenarioInstance[];
        current: IScenarioInstance[];
        more: boolean;
        moreCurrent: boolean;
    };
};


const mapStoreToProps = (store): IStoreProps => ({
    instances: store.scenario,
});


interface IDispatchProps {
    deleteInstance: (scenarioInstance: IScenarioInstance) => void;
    loadMore: (project: string, scenario?: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    deleteInstance: (scenarioInstance: IScenarioInstance) => dispatch(deleteScenarioInstance(scenarioInstance)),
    loadMore: (project: string, scenario?: string) => dispatch(scenario == null ?  getScenarioInstancesFromProject(project) :  getFilteredScenarioInstancesFromProject(project, scenario)),
});


export default connect<IStoreProps, IDispatchProps, IProps>(mapStoreToProps, mapDispatchToProps)(ProjectScenariosInstances);
