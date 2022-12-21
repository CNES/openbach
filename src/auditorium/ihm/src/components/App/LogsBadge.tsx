import * as React from "react";
import {connect} from "react-redux";

import Badge from "material-ui/Badge";
import MenuItem from "material-ui/MenuItem";

import {fetchLogs} from "../../actions/global";
import {ILog} from "../../interfaces/log.interface";
import {DeleteIcon} from "../../utils/theme";
import ActionDialog from "../common/ActionDialog";
import MainMenu from "./MainMenu";


const notAnID = "__THIS_IS_NOT_AN_ID__";


class LogsBadge extends React.Component<IStoreProps & IDispatchProps, IState> {
    private intervalID: any;

    constructor(props) {
        super(props);
        this.state = { logs: [], shownID: null, newLogs: 0 };
        this.showLog = this.showLog.bind(this);
        this.hideLog = this.hideLog.bind(this);
        this.removeLog = this.removeLog.bind(this);
        this.resetLogsCounter = this.resetLogsCounter.bind(this);
    }

    public componentDidMount() {
        this.props.doFetchLogs();
        this.intervalID = setInterval(this.props.doFetchLogs, 5000);
    }

    public componentWillUnmount() {
        if (this.intervalID) {
            clearInterval(this.intervalID);
        }
    }

    public componentWillReceiveProps(nextProps: IStoreProps) {
        if (nextProps.incommingLogs && nextProps.incommingLogs !== this.props.incommingLogs) {
            let count = this.state.newLogs;
            const previousLogs = this.props.incommingLogs;

            const newLogs = nextProps.incommingLogs
                .filter((currentLog: [string, number, string, string, string]): boolean => {  // remove elements that were fetched the last time
                    for (const oldLog of previousLogs) {
                        if (oldLog[0] === currentLog[0]) {
                            return false;
                        }
                    }
                    return true;
                })
                .map((currentLog: [string, number, string, string, string]): ILog => ({
                    checked: false,
                    id: currentLog[0],
                    message: currentLog[4],
                    severity: currentLog[2],
                    source: currentLog[3],
                    timestamp: currentLog[1],
                }))
                .sort((a: ILog, b: ILog) => b.timestamp - a.timestamp);
            count += newLogs.length;

            this.setState({ logs: newLogs.concat(this.state.logs), newLogs: count });
        }
    }

    public render() {
        const logsCount = this.state.newLogs;
        const logs = this.state.logs.map((l: ILog) => (
            <MenuItem key={l.id} value={l.id} primaryText={this.formatLog(l)} checked={l.checked} />
        ));

        const showLog = this.state.logs.find((l: ILog) => l.id === this.state.shownID);
        const dialog = showLog === undefined ? <div /> : (
            <ActionDialog
                title={this.formatLog(showLog)}
                open={true}
                modal={false}
                auto={true}
                cancel={{label: "OK", action: this.hideLog}}
                actions={[{label: "Dismiss", action: this.removeLog}]}
            >
                <pre>{showLog.message}</pre>
            </ActionDialog>
        );

        return (
            <Badge
                badgeContent={logsCount}
                badgeStyle={{top: "-10px", right: "-5px", zIndex: 10}}
                style={{padding: "0px"}}
                secondary={!!logsCount}
            >
                <MainMenu label="Latest Logs" onMenuSelected={this.showLog} onMenuOpened={this.resetLogsCounter}>
                    <MenuItem key={notAnID} value={notAnID} primaryText="Dismiss all" leftIcon={<DeleteIcon />} />
                    {logs}
                </MainMenu>
                {dialog}
            </Badge>
        );
    }

    private formatLog(log: ILog) {
        const date = new Date(log.timestamp);
        const time = date.toLocaleTimeString();
        return `[${time}] ${log.severity} on ${log.source}`;
    }

    private showLog(logId: string) {
        if (logId === notAnID) {
            this.setState({ logs: [], shownID: null, newLogs: 0 });
        } else {
            this.setState({ shownID: logId });
        }
    }

    private hideLog() {
        const {logs, shownID} = this.state;
        if (shownID) {
            const log = logs.find((l: ILog) => l.id === shownID);
            if (log !== undefined) {
                log.checked = true;
            }
        }
        this.setState({ shownID: null });
    }

    private removeLog() {
        const logId = this.state.shownID;
        this.setState({ logs: this.state.logs.filter((x) => (x.id !== logId)), shownID: null });
    }

    private resetLogsCounter() {
        this.setState({ newLogs: 0 });
    }
};


interface IStoreProps {
    incommingLogs: Array<[string, number, string, string, string]>;
};


interface IDispatchProps {
    doFetchLogs: () => void;
};


interface IState {
    logs: ILog[];
    shownID: string;
    newLogs: number;
};


const mapStoreToProps = (store): IStoreProps => ({
    incommingLogs: store.logs,
});


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    doFetchLogs: () => dispatch(fetchLogs(10000)),
});


export default connect<IStoreProps, IDispatchProps, {}>(mapStoreToProps, mapDispatchToProps)(LogsBadge);
