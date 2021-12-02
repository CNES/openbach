import * as React from "react";
import {connect} from "react-redux";

import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";

import {addJob as actionAddJob} from "../../actions/job";

import UploadFileButton from "../common/UploadFileButton.tsx";


class AdminJobCreator extends React.Component<IDispatchProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            newJobFile: null,
            newJobName: "",
        };

        this.handleJobNameChange = this.handleJobNameChange.bind(this);
        this.handleJobFileChange = this.handleJobFileChange.bind(this);
        this.handleAddJob = this.handleAddJob.bind(this);
    }

    public render() {
        const {newJobName, newJobFile} = this.state;

        return (
            <div>
                <div>
                    <p>Please provide a tar.gz file containing the top-level directory of the job's definition files</p>
                    <p>Most likely the tar.gz file should contain a "files" directory, the "install_&lt;job_name&gt;.yml"
                    file and the "uninstall_&lt;job_name&gt;.yml" file; all located at the root of the archive.</p>
                </div>
                <div><TextField
                    hintText="Job Name"
                    floatingLabelText="New Job Name"
                    value={newJobName}
                    fullWidth={true}
                    onChange={this.handleJobNameChange}
                /></div>
                <div><UploadFileButton
                    label={newJobFile ? newJobFile.name : "Definition's File"}
                    id="add-job-upload-button"
                    onChange={this.handleJobFileChange}
                /></div>
                <div><RaisedButton
                    onClick={this.handleAddJob}
                    label="Add job"
                    secondary={true}
                    disabled={!newJobName || !newJobFile}
                    style={{margin: "8px 0px"}}
                /></div>
            </div>
        );
    }

    private handleAddJob() {
        this.props.addJob(this.state.newJobName, this.state.newJobFile);
    }

    private handleJobNameChange(event) {
        this.setState({
            newJobFile: this.state.newJobFile,
            newJobName: event.target.value,
        });
    }

    private handleJobFileChange(event) {
        this.setState({
            newJobFile: event.target.files[0],
            newJobName: this.state.newJobName,
        });
    }
};


interface IDispatchProps {
    addJob: (name: string, file: File) => void;
};


interface IState {
    newJobFile: File;
    newJobName: string;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    addJob: (name: string, file: File) => dispatch(actionAddJob(name, file)),
});


export default connect<{}, IDispatchProps, {}>(null, mapDispatchToProps)(AdminJobCreator);
