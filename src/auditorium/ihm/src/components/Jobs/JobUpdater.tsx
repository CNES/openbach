import * as React from "react";
import {connect} from "react-redux";

import {ListItem} from "material-ui/List";
import RaisedButton from "material-ui/RaisedButton";

import {addExternalJob, addInternalJob} from "../../actions/job";
import {IExternalJobInfos, IJob} from "../../interfaces/job.interface";


class JobUpdater extends React.Component<IProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = { clicked: false };
        this.handleUpdate = this.handleUpdate.bind(this);
    }

    public render() {
        const {job_version} = this.props.job.general;
        const {updateAvailable} = this.props;
        const versionText = `Version: ${job_version}`;

        if (!updateAvailable) {
            return (
                <ListItem
                    primaryText={versionText}
                    disabled={true}
                />
            );
        }

        if (updateAvailable.version && updateAvailable.version !== job_version) {
            const updateButton = (
                <RaisedButton
                    label={`Update to version ${updateAvailable.version}`}
                    secondary={true}
                    disabled={this.state.clicked}
                    onClick={this.handleUpdate}
                />
            );

            return (
                <ListItem
                    primaryText={versionText}
                    rightIconButton={updateButton}
                    disabled={true}
                />
            );
        }

        return (
            <ListItem
                primaryText={versionText}
                secondaryText="This is the lattest version available"
                disabled={true}
            />
        );
    }

    private handleUpdate() {
        this.setState({ clicked: true });
        if (this.props.updateInternal) {
            this.props.installInternal(this.props.job.general.name);
        } else {
            this.props.installExternal(this.props.job.general.name);
        }
    }
};


interface IState {
    clicked: boolean;
};


interface IProps {
    job: IJob;
    updateInternal: boolean;
    updateAvailable: IExternalJobInfos;
};


interface IDispatchProps {
    installExternal: (jobName: string) => void;
    installInternal: (jobName: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    installExternal: (jobName: string) => dispatch(addExternalJob(jobName)),
    installInternal: (jobName: string) => dispatch(addInternalJob(jobName)),
});


export default connect<{}, IDispatchProps, IProps>(null, mapDispatchToProps)(JobUpdater);
