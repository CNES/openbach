import * as React from "react";
import {connect} from "react-redux";

import * as moment from "moment";

import Checkbox from "material-ui/Checkbox";
import IconButton from "material-ui/IconButton";
import {ListItem} from "material-ui/List";

import {notify} from "../../../actions/global";
import {statusScenarioInstance} from "../../../actions/scenario";
import {openURL} from "../../../api/common";
import {getScenarioInstanceFiles, stopScenarioInstance} from "../../../api/scenario";
import {IFilesCount, IScenarioInstance} from "../../../interfaces/scenarioInstance.interface";
import {getIconForScenarioStatus, getScenarioStopIcon} from "../../../utils/theme";

import ScenarioFilesDialog from "./ScenarioFilesDialog";
import ScenarioInstanceDialog from "./ScenarioInstanceDialog";
import ScenarioStatisticsDialog from "./ScenarioStatisticsDialog";


class ScenarioInstanceListItem extends React.Component<IProps & IStoreProps & IDispatchProps, IState> {
    private intervalHandle: any;

    constructor(props) {
        super(props);

        this.state = {
            fileDialogFiles: null,
            instanceDialogOpen: false,
            statisticsDialogOpen: false,
        };

        this.doFetchNewState = this.doFetchNewState.bind(this);
        this.doStopScenarioInstance = this.doStopScenarioInstance.bind(this);
        this.handleOpenDialog = this.handleOpenDialog.bind(this);
        this.handleCloseDialog = this.handleCloseDialog.bind(this);
        this.handleOpenStatistics = this.handleOpenStatistics.bind(this);
        this.handleCloseStatistics = this.handleCloseStatistics.bind(this);
        this.handleRetrieveLogs = this.handleRetrieveLogs.bind(this);
        this.handleOpenCSV = this.handleOpenCSV.bind(this);
        this.handleDownloadArchive = this.handleDownloadArchive.bind(this);
        this.onCheck = this.onCheck.bind(this);
    }

    public render() {
        const {instance, checked} = this.props;

        const rightIconButton = instance.status === "Running" ? (
            <IconButton
                touch={true}
                tooltip="Stop this instance"
                tooltipPosition="top-left"
                onTouchTap={this.doStopScenarioInstance}
            >
                {getScenarioStopIcon()}
            </IconButton>
        ) : undefined;
        const rightCheckbox = instance.status !== "Scheduling" && instance.status !== "Running" ? (
            <Checkbox
                checked={checked}
                onCheck={this.onCheck}
                style={{margin: "12px 0", width: "auto"}}
            />
        ) : undefined;

        return (
            <ListItem
                leftIcon={getIconForScenarioStatus(instance.status)}
                rightIconButton={rightIconButton || rightCheckbox}
                primaryText={instance.scenario_name}
                secondaryText={moment(instance.start_date).format("YYYY-MM-DD HH:mm:ss")}
                onTouchTap={this.handleOpenDialog}
            >
                <ScenarioInstanceDialog
                    instance={instance}
                    dialogOpen={this.state.instanceDialogOpen}
                    handleCloseDialog={this.handleCloseDialog}
                    handleStopInstance={this.doStopScenarioInstance}
                    handleViewLogs={this.handleRetrieveLogs}
                    handleViewStatistics={this.handleOpenStatistics}
                    handleViewCSV={this.handleOpenCSV}
                />
                <ScenarioStatisticsDialog
                    instance={instance}
                    dialogOpen={this.state.statisticsDialogOpen}
                    handleCloseDialog={this.handleCloseStatistics}
                />
                <ScenarioFilesDialog
                    files={this.state.fileDialogFiles}
                    handleCloseDialog={this.handleCloseDialog}
                    handleDownloadArchive={this.handleDownloadArchive}
                />
            </ListItem>
        );
    }

    public componentDidMount() {
        if (this.props.primary) {
            this.intervalHandle = setInterval(this.doFetchNewState, 3000);
        }
    }

    public componentWillReceiveProps() {
        const {instance, instances, primary} = this.props;
        if (!primary) {
            return;
        }

        if (instance.status !== "Running") {
            clearInterval(this.intervalHandle);
        } else {
            instance.sub_scenario_instance_ids.forEach((scenarioID: number) => {
                const sub_instance = instances.find((scenario: IScenarioInstance) => scenario.scenario_instance_id === scenarioID);
                if (!sub_instance) {
                    this.props.fetchNewState(scenarioID, false);
                }
            });
        }
    }

    public componentWillUnmount() {
        clearInterval(this.intervalHandle);
    }

    public shouldComponentUpdate(nextProps: IProps & IStoreProps & IDispatchProps, nextState: IState) {
        const {instance, checked} = this.props;
        return instance !== nextProps.instance || this.state !== nextState || checked !== nextProps.checked;
    }

    private onCheck(event, isInputChecked) {
        const {instance, onInstanceChecked} = this.props;
        onInstanceChecked(instance.scenario_instance_id, isInputChecked);
    }

    private _handleDialog(show: boolean) {
        this.setState({
            fileDialogFiles: null,
            instanceDialogOpen: show,
            statisticsDialogOpen: false,
        });
    }

    private _handleStatistics(show: boolean) {
        this.setState({
            fileDialogFiles: null,
            instanceDialogOpen: false,
            statisticsDialogOpen: show,
        });
    }

    private handleOpenDialog() {
        const {fetchNewState, instance, onInstancePopup} = this.props;
        const {scenario_instance_id} = instance;
        fetchNewState(scenario_instance_id, true);
        this._handleDialog(true);
        onInstancePopup(scenario_instance_id);
    }

    private handleCloseDialog() {
        this._handleDialog(false);
        this.props.onInstancePopup(null);
    }

    private handleOpenStatistics() {
        const {fetchNewState, instance, onInstancePopup} = this.props;
        const {scenario_instance_id} = instance;
        fetchNewState(scenario_instance_id, true);
        this._handleStatistics(true);
        onInstancePopup(scenario_instance_id);
    }

    private handleCloseStatistics() {
        this._handleStatistics(false);
        this.props.onInstancePopup(null);
    }

    private doStopScenarioInstance() {
        stopScenarioInstance(this.props.instance)
            .then(() => this.props.notify("Successfully stopped scenario instance"))
            .catch((error: Error) => this.props.notify("Something went wrong: " + error.message));
    }

    private doFetchNewState() {
        const {fetchNewState, instance, verbose} = this.props;
        fetchNewState(instance.scenario_instance_id, verbose);
    }

    private handleOpenCSV() {
        const {scenario_instance_id} = this.props.instance;
        getScenarioInstanceFiles(scenario_instance_id).then((result) => {
            if (Object.keys(result).length === 0 && result.constructor === Object) {
                openURL("/openbach/scenario_instance/" + scenario_instance_id + "/csv/");
            } else {
                this.setState({
                    fileDialogFiles: result,
                    instanceDialogOpen: false,
                    statisticsDialogOpen: false,
                });
            }
        }).catch((error) => { this.props.notify("Error: " + error.message); });
    }

    private handleDownloadArchive(files: string) {
        const {scenario_instance_id} = this.props.instance;
        const url = "/openbach/scenario_instance/" + scenario_instance_id + "/";
        if (files) {
            openURL(url + "archive?" + files);
        } else {
            openURL(url + "csv");
        }
        this.handleCloseDialog();
    }

    private handleRetrieveLogs() {
        const {stop_date, start_date, owner_scenario_instance_id} = this.props.instance;

        let display = "display:Off,pause:!f,value:0";
        let stopDate = "now";
        if (!stop_date) {
            display = "display:'5 seconds',pause:!f,section:1,value:5000";
        } else {
            const _stopDate = new Date(stop_date);
            _stopDate.setSeconds(_stopDate.getSeconds() + 1);
            _stopDate.setMilliseconds(0);
            stopDate = "'" + _stopDate.toISOString() + "'";
        }

        const startDate = new Date(start_date);
        startDate.setMilliseconds(0);
        const url = [
            "/kibana/app/kibana#/dashboard/default_dashboard?_g=(refreshInterval:(",
            display,
            "),time:(from:'",
            startDate.toISOString(),
            "',mode:absolute,to:",
            stopDate,
            "))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(darkTheme:!f,useMargins:!f),",
            "panels:!((gridData:(h:3,i:'2',w:6,x:6,y:0),id:vertical_bar,panelIndex:'2',",
            "type:visualization,version:'6.2.4'),(columns:!(_source),gridData:(h:8,i:'6',w:12,x:0,y:3),",
            "id:log_search,panelIndex:'6',sort:!('@timestamp',desc),type:search,version:'6.2.4'),",
            "(gridData:(h:3,i:'7',w:6,x:0,y:0),id:pie,panelIndex:'7',type:visualization,version:'6.2.4')),",
            "query:(language:lucene,query:'owner_scenario_instance_id:",
            owner_scenario_instance_id,
            "'),timeRestore:!f,title:openbach_dashboard,uiState:(),viewMode:view)",
        ];
        openURL(url.join(""));
    }
};


interface IState {
    fileDialogFiles: IFilesCount;
    instanceDialogOpen: boolean;
    statisticsDialogOpen: boolean;
};


interface IProps {
    instance: IScenarioInstance;
    primary: boolean;
    verbose: boolean;
    onInstancePopup: (id: number) => void;
    checked: boolean;
    onInstanceChecked: (instanceId: number, checked: boolean) => void;
};


interface IStoreProps {
    instances: IScenarioInstance[];
};


const mapStoreToProps = (store): IStoreProps => ({
    instances: store.scenario.all,
});


interface IDispatchProps {
    fetchNewState: (instanceID: number, verbose: boolean) => void;
    notify: (message: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    fetchNewState: (instanceID: number, verbose: boolean) => dispatch(statusScenarioInstance(instanceID, verbose)),
    notify: (message: string) => dispatch(notify(message)),
});


export default connect<IStoreProps, IDispatchProps, IProps>(mapStoreToProps, mapDispatchToProps)(ScenarioInstanceListItem);
