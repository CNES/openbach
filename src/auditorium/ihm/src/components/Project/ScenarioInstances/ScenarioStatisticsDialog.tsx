import * as React from "react";
import {connect} from "react-redux";

import Checkbox from "material-ui/Checkbox";

import {notify} from "../../../actions/global";
import {openURL} from "../../../api/common";
import {postGrafanaDashboard} from "../../../api/influx";
import {IChronografDashboardResult, IGrafanaStatistic, IJobsDisplay} from "../../../interfaces/influx.interface";
import {IScenarioInstance, isStartJobInstance, isStartScenarioInstance} from "../../../interfaces/scenarioInstance.interface";

import ActionDialog from "../../common/ActionDialog";
import InfluxDBStatisticsDisplay from "./InfluxDBStatisticsDisplay";


class ScenarioStatisticsDialog extends React.Component<IProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = { groupTogether: false, selected: [], errorMessage: null };
        this.onGroupedChange = this.onGroupedChange.bind(this);
        this.addStatistic = this.addStatistic.bind(this);
        this.showInGrafana = this.showInGrafana.bind(this);
        this.openGrafana = this.openGrafana.bind(this);
        this.connectToGrafana = this.connectToGrafana.bind(this);
        this.doCloseDialog = this.doCloseDialog.bind(this);
    }

    public render() {
        if (this.state.errorMessage !== null) {
            return (
                <ActionDialog
                    title="Cannot create Chronograf Dashboard"
                    modal={false}
                    open={this.props.dialogOpen}
                    cancel={{label: "Cancel", action: this.doCloseDialog}}
                    actions={[{label: "Open Chronograf", action: this.connectToGrafana}]}
                >
                    <p>Chronograf returned the error {this.state.errorMessage} when trying to create the dashboard for the selected statistics.</p>
                    <p>Would you like to open Chronograf to further understand the problem?</p>
                </ActionDialog>
            );
        }

        const jobs = this.getJobNames(this.props.instance);
        if (!jobs) {
            return (
                <ActionDialog
                    title="Select statistics to display"
                    modal={false}
                    open={this.props.dialogOpen}
                    cancel={{label: "Cancel", action: this.doCloseDialog}}
                    actions={[{label: "Open Chronograf anyway", action: this.openGrafana}]}
                >
                    <p>No jobs were launched by this scenario. Unable to build statistics graphs</p>
                </ActionDialog>
            );
        }

        const form = (
            <InfluxDBStatisticsDisplay
                jobs={jobs}
                onStatisticSelected={this.addStatistic}
            />
        );

        return (
            <ActionDialog
                title="Select statistics to display"
                modal={false}
                open={this.props.dialogOpen}
                auto={true}
                cancel={{label: "Cancel", action: this.doCloseDialog}}
                actions={[{label: "Display selected statistics in Chronograf", action: this.showInGrafana}]}
            >
                {form}
                <div><Checkbox
                    label="Select this option to group in the same graph the statistics of a single job that share the same units"
                    onCheck={this.onGroupedChange}
                /></div>
            </ActionDialog>
        );
    }

    public componentWillReceiveProps(nextProps: IProps & IDispatchProps) {
        if (nextProps.instance.stop_date && !this.props.instance.stop_date) {
            this.setState({ selected: [] });
        }
    }

    private onGroupedChange(event, isChecked: boolean) {
        this.setState({ groupTogether: isChecked });
    }

    private addStatistic(job: string, id: number, agent: string, name: string, unit: string) {
        const {groupTogether, selected} = this.state;
        const oldUnitRemoved = selected.filter((s) => (s.jobId !== id || s.statName !== name));
        if (unit !== null) {
            oldUnitRemoved.push({ jobAgent: agent, jobName: job, jobId: id, statName: name, unit });
        }
        this.setState({ groupTogether, selected: oldUnitRemoved });
    }

    private doCloseDialog() {
        this.setState({ errorMessage: null });
        this.props.handleCloseDialog();
    }

    private showInGrafana() {
        const {groupTogether, selected} = this.state;
        const instance = this.props.instance;
        postGrafanaDashboard(instance, selected, groupTogether).then((APIResult: IChronografDashboardResult) => {
            openURL("/chronograf/sources/0/dashboards/" + APIResult.id);
            this.props.handleCloseDialog();
            this.setState({ groupTogether: false, selected: [], errorMessage: null });
        }).catch((error: Error) => {
            this.props.notify("Cannot create Chronograf Dashboard: " + error.message);
            this.setState({ errorMessage: error.message });
        });
    }

    private openGrafana() {
        openURL("/chronograf/");
    }

    private connectToGrafana() {
        this.setState({ errorMessage: null });
        this.openGrafana();
    }

    private getJobNames(scenario: IScenarioInstance): IJobsDisplay[] {
        if (!scenario || !scenario.openbach_functions) {
            return [];
        }

        let jobs = [];
        for (const obFunction of scenario.openbach_functions) {
            if (isStartJobInstance(obFunction)) {
                if (obFunction.job) {
                    const {name, id, agent} = obFunction.job;
                    jobs.push({ name, id, agent });
                }
            } else if (isStartScenarioInstance(obFunction)) {
                if (obFunction.scenario) {
                    jobs = jobs.concat(this.getJobNames(obFunction.scenario));
                }
            }
        }
        return jobs;
    }
};


interface IProps {
    dialogOpen: boolean;
    handleCloseDialog: () => void;
    instance: IScenarioInstance;
};


interface IState {
    selected: IGrafanaStatistic[];
    groupTogether: boolean;
    errorMessage: string;
};


interface IDispatchProps {
    notify: (message: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    notify: (message: string) => dispatch(notify(message)),
});


export default connect<{}, IDispatchProps, IProps>(null, mapDispatchToProps)(ScenarioStatisticsDialog);
