import * as moment from "moment";
import * as React from "react";
import {connect} from "react-redux";

import {List, ListItem} from "material-ui/List";

import {deleteScenarioInstance} from "../../../actions/scenario";
import {
    extractOpenbachFunctionName,
    IOpenbachFunctionInstance,
    IScenarioInstance,
    isStartJobInstance,
    isStartScenarioInstance,
    isStopJobInstances,
    isStopScenarioInstance,
} from "../../../interfaces/scenarioInstance.interface";
import {
    getIconForFunctionStatus,
    getIconForJobStatus,
    getIconForScenarioStatus,
    OpenbachFunctionIcon,
    ScenarioArgumentIcon,
    StartJobInstanceIcon,
    StartScenarioInstanceIcon,
} from "../../../utils/theme";
import {idToLabel, titleFromLabel} from "../../../utils/utils";

import ActionDialog from "../../common/ActionDialog";
import {IActionForDialog} from "../../common/ActionDialog";


class ScenarioInstanceDialog extends React.Component<IProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = { deleteOpen: false };
        this.doDeleteInstance = this.doDeleteInstance.bind(this);
        this.showDeleteInstance = this.showDeleteInstance.bind(this);
        this.hideDeleteInstance = this.hideDeleteInstance.bind(this);
    }

    public render() {
        const {
            dialogOpen,
            instance,
            handleCloseDialog,
            handleStopInstance,
            handleViewCSV,
            handleViewLogs,
            handleViewStatistics,
        } = this.props;
        const elements = instance.openbach_functions ? this.displayScenarioInstance(instance) : [(
            <ListItem key="auto" primaryText="Fetching full instance, please wait!" />
        )];
        const elapsedTime = this.formatScenarioDuration(instance);

        const actions: IActionForDialog[] = [
            {label: "Show logs", action: handleViewLogs},
            {label: "Show statistics", action: handleViewStatistics},
        ];
        if (instance.status === "Running") {
            actions.splice(0, 0, {label: "Stop Instance", action: handleStopInstance});
        } else if (instance.status !== "Scheduling") {
            actions.splice(
                0, 0,
                {label: "Delete", action: this.showDeleteInstance},
                {label: "Export to CSV", action: handleViewCSV},
            );
        }

        return (
            <ActionDialog
                title={instance.scenario_name}
                modal={false}
                open={dialogOpen}
                auto={true}
                cancel={{label: "OK", action: handleCloseDialog}}
                actions={actions}
            >
                <List>
                    <ListItem
                        initiallyOpen={true}
                        primaryText={<b>{instance.scenario_name}</b>}
                        secondaryText={elapsedTime}
                        rightIcon={getIconForScenarioStatus(instance.status)}
                        nestedItems={elements}
                    />
                </List>
                <ActionDialog
                    title="Delete scenario instance"
                    modal={false}
                    open={this.state.deleteOpen}
                    auto={false}
                    cancel={{label: "No", action: this.hideDeleteInstance}}
                    actions={[{label: "Yes", action: this.doDeleteInstance}]}
                >
                    <p>The informations of this scenario instance will be removed
                    from the database. You will not be able to recover them.</p>
                    <p>Proceed?</p>
                </ActionDialog>
            </ActionDialog>
        );
    }

    private displayScenarioInstance(instance: IScenarioInstance): JSX.Element[] {
        const functions = instance.openbach_functions;
        const description = functions.map((openbachFunction: IOpenbachFunctionInstance, index: number) => {
            const nestedItems = [];
            let primaryText: string = "unknown";
            let secondaryText = "";
            if (isStartJobInstance(openbachFunction)) {
                primaryText = titleFromLabel("Start job instance", openbachFunction);
                if (openbachFunction.job) {
                    const {id, name, agent, entity, status} = openbachFunction.job;
                    nestedItems.push((
                        <ListItem
                            key={"job_" + id}
                            primaryText={`${name} on ${entity} (${agent})`}
                            secondaryText={`(job instance id: ${id})`}
                            rightIcon={getIconForJobStatus(status)}
                            leftIcon={<StartJobInstanceIcon />}
                        />
                    ));
                }
            } else if (isStartScenarioInstance(openbachFunction)) {
                primaryText = titleFromLabel("Start scenario instance", openbachFunction);
                if (openbachFunction.scenario) {
                    nestedItems.push((
                        <ListItem
                            key={"scenario_" + openbachFunction.scenario.scenario_instance_id}
                            primaryText={openbachFunction.scenario.scenario_name}
                            secondaryText={this.formatScenarioDuration(openbachFunction.scenario)}
                            rightIcon={getIconForScenarioStatus(openbachFunction.scenario.status)}
                            leftIcon={<StartScenarioInstanceIcon />}
                            initiallyOpen={true}
                            primaryTogglesNestedList={true}
                            nestedItems={this.displayScenarioInstance(openbachFunction.scenario)}
                        />
                    ));
                }
            } else if (isStopJobInstances(openbachFunction)) {
                const ids = openbachFunction.stop_job_instances.openbach_function_ids;
                primaryText = titleFromLabel("Stop job instance", openbachFunction);
                secondaryText = "Stopping jobs " + ids.map((id: number) => idToLabel(id, functions)).join(", ");
            } else if (isStopScenarioInstance(openbachFunction)) {
                const id = openbachFunction.stop_scenario_instance.openbach_function_id;
                primaryText = titleFromLabel("Stop scenario instance", openbachFunction);
                secondaryText = "Stopping scenario " + idToLabel(id, functions);
            } else {
                primaryText = titleFromLabel(extractOpenbachFunctionName(openbachFunction), openbachFunction);
            }

            return (
                <ListItem
                    key={index}
                    primaryText={primaryText}
                    secondaryText={secondaryText}
                    rightIcon={getIconForFunctionStatus(openbachFunction.status)}
                    leftIcon={<OpenbachFunctionIcon />}
                    initiallyOpen={true}
                    primaryTogglesNestedList={true}
                    nestedItems={nestedItems}
                />
            );
        });
        if (instance.arguments && instance.arguments.length) {
            const args = instance.arguments.map((argument: {name: string, value: string}, index: number) => (
                <ListItem
                    key={index}
                    primaryText={argument.name}
                    secondaryText={argument.value}
                />
            ));
            description.unshift((
                <ListItem
                    key={null}
                    primaryText="Arguments"
                    primaryTogglesNestedList={true}
                    nestedItems={args}
                    leftIcon={<ScenarioArgumentIcon />}
                />
            ));
        }
        return description;
    }

    private formatScenarioDuration(scenario: IScenarioInstance): string {
        const format = "YYYY-MM-DD HH:mm:ss";
        const startDate = moment(scenario.start_date);
        const header = `(scenario instance id: ${scenario.scenario_instance_id})`;
        if (!scenario.stop_date) {
            return `${header} Ongoing [started ${startDate.format(format)}]`;
        }

        const stopDate = moment(scenario.stop_date);
        const seconds = this.normalizeBy60(stopDate.diff(startDate, "seconds"));
        const minutes = this.normalizeBy60(stopDate.diff(startDate, "minutes"));
        const hours = stopDate.diff(startDate, "hours");
        return `${header} ${startDate.format(format)} --> ${stopDate.format(format)} [Duration of ${hours}:${minutes}:${seconds}]`;
    }

    private normalizeBy60(amount: number): string {
        const value = amount % 60;
        return (value > 9 ? "" : "0") + value;
    }

    private showDeleteInstance() {
        this.setState({ deleteOpen: true });
    }

    private hideDeleteInstance() {
        this.setState({ deleteOpen: false });
    }

    private doDeleteInstance() {
        this.hideDeleteInstance();
        this.props.deleteInstance(this.props.instance);
        this.props.handleCloseDialog();
    }
};


interface IState {
    deleteOpen: boolean;
};


interface IProps {
    dialogOpen: boolean;
    handleCloseDialog: () => void;
    handleStopInstance: () => void;
    handleViewCSV: () => void;
    handleViewLogs: () => void;
    handleViewStatistics: () => void;
    instance: IScenarioInstance;
};


interface IDispatchProps {
    deleteInstance: (scenarioInstance: IScenarioInstance) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    deleteInstance: (scenarioInstance: IScenarioInstance) => dispatch(deleteScenarioInstance(scenarioInstance)),
});


export default connect<{}, IDispatchProps, IProps>(null, mapDispatchToProps)(ScenarioInstanceDialog);
