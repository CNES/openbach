import * as React from "react";
import {connect} from "react-redux";

import RaisedButton from "material-ui/RaisedButton";

import {removeAgent, updateAgent} from "../../actions/agent";
import {status} from "../../api/agent";
import {IAgentState} from "../../interfaces/agent.interface";

import ActionDialog from "../common/ActionDialog";
import AgentUpdateForm from "./AgentUpdateForm";


interface IStyle {
    default: React.CSSProperties;
};


const styles: IStyle = {
    default: {
        marginLeft: "5px",
        marginRight: "5px",
    },
};


class AgentUninstall extends React.Component<IProps & IDispatchProps, IState> {
    private onUninstallShow;
    private onDetachShow;
    private onConfirmHide;

    constructor(props) {
        super(props);
        this.state = { confirmLabel: null, open: false, statusCode: 202, timeoutId: null };
        this.onUninstallShow = this.onConfirmChange.bind(this, "uninstall");
        this.onDetachShow = this.onConfirmChange.bind(this, "detach");
        this.onConfirmHide = this.onConfirmChange.bind(this, null);
        this.onUpdateShow = this.onUpdateShow.bind(this);
        this.onUpdateHide = this.onUpdateHide.bind(this);
        this.handleUninstall = this.handleUninstall.bind(this);
        this.handleUpdate = this.handleUpdate.bind(this);
        this.refreshStatus = this.refreshStatus.bind(this);
    }

    public render() {
        const {open, confirmLabel, statusCode} = this.state;
        const operationOngoing = statusCode === 202;
        const noErrors = statusCode === 200 || statusCode === 204;

        const buttons = [(
            <RaisedButton
                key="uninstall"
                onTouchTap={this.onUninstallShow}
                disabled={operationOngoing}
                primary={!noErrors}
                secondary={noErrors}
                label={this.buttonLabel()}
                style={styles.default}
            />
        )];
        if (!operationOngoing) {
            buttons.push((
                <RaisedButton
                    key="update"
                    onTouchTap={this.onUpdateShow}
                    primary={!noErrors}
                    secondary={noErrors}
                    label="Update"
                    style={styles.default}
                />
            ));
            buttons.push((
                <RaisedButton
                    key="detach"
                    onTouchTap={this.onDetachShow}
                    primary={!noErrors}
                    secondary={noErrors}
                    label="Detach"
                    style={styles.default}
                />
            ));
        }

        const {name, address, collector} = this.props;
        return (
            <div>
                {buttons}
                <ActionDialog
                    title="Are you sure?"
                    modal={false}
                    open={Boolean(confirmLabel)}
                    cancel={{label: "Cancel", action: this.onConfirmHide}}
                    actions={[{label: "OK", action: this.handleUninstall}]}
                >
                    Trully {confirmLabel} this agent?
                </ActionDialog>
                <AgentUpdateForm
                    open={open}
                    onClose={this.onUpdateHide}
                    onSubmit={this.handleUpdate}
                    initialValues={{name, address, collector}}
                />
            </div>
        );
    }

    public componentDidMount() {
        this.refreshStatus();
    }

    public componentWillUnmount() {
        clearTimeout(this.state.timeoutId);
    }

    public componentWillReceiveProps() {
        if (this.state.timeoutId === null) {
            this.refreshStatus();
        }
    }

    private onConfirmChange(confirmLabel: string) {
        this.setState({ confirmLabel });
    }

    private onUpdateShow() {
        this.setState({ open: true });
    }

    private onUpdateHide() {
        this.setState({ open: false });
    }

    private handleUninstall() {
        switch (this.state.confirmLabel) {
            case "uninstall":
                this.props.onUninstall(this.props.address);
                break;
            case "detach":
                this.props.onDetach(this.props.address);
                break;
            default:
                break;
        }
        this.setState({ confirmLabel: null, statusCode: 202 });
        window.setTimeout(this.refreshStatus, 2000);
    }

    private handleUpdate() {
        this.props.onUpdate(this.props.address);
        this.onUpdateHide();
    }

    private refreshStatus() {
        status(this.props.address).then((agentStatus: IAgentState) => {
            if (!agentStatus) {  // Agents installed by ansible lead to a 204
                this.setState({ statusCode: 200 });
            } else {
                const {install, uninstall} = agentStatus;
                const lastInstallDate = new Date(install ? install.last_operation_date : 0);
                const lastUnInstallDate = new Date(uninstall ? uninstall.last_operation_date : 0);
                const operation = lastInstallDate < lastUnInstallDate ? uninstall : install;
                const statusCode = operation ? operation.returncode : 202;
                const timeoutId = statusCode === 202 ? window.setTimeout(this.refreshStatus, 2000) : null;
                this.setState({ statusCode, timeoutId });
            }
        }).catch((error: Error) => { this.setState({ statusCode: 500 }); });
    }

    private buttonLabel() {
        switch (this.state.statusCode) {
            case 202:
                return "Operation Pending";
            case 204:
            case 200:
               return "Uninstall";
            default:
                return "Error " + this.state.statusCode;
        }
    }
};


interface IState {
    open: boolean;
    confirmLabel: string;
    statusCode: number;
    timeoutId: number;
};


interface IProps {
    name: string;
    address: string;
    collector: string;
    // Props required to trigger a redraw
    // do not remove unless you can call
    // refreshStatus on a re-install somehow
    reachable: boolean;
    available: boolean;
};


interface IDispatchProps {
    onDetach: (address: string) => void;
    onUninstall: (address: string) => void;
    onUpdate: (address: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    onDetach: (address: string) => dispatch(removeAgent(address, true)),
    onUninstall: (address: string) => dispatch(removeAgent(address)),
    onUpdate: (address: string) => dispatch(updateAgent(address)),
});


export default connect<{}, IDispatchProps, IProps>(null, mapDispatchToProps)(AgentUninstall);
