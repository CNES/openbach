import * as React from "react";
import {connect} from "react-redux";
import {browserHistory} from "react-router";

import {notify} from "../../actions/global";
import {getProjects} from "../../actions/project";
import {deleteProject} from "../../api/project";

import ActionDialog from "../common/ActionDialog";


class ProjectItemDeleteForm extends React.Component<IProps & IDispatchProps, {}> {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    public render() {
        return (
            <ActionDialog
                title="Delete project?"
                modal={false}
                open={this.props.open}
                cancel={{label: "Cancel", action: this.props.onRequestClose}}
                actions={[{label: "Delete", action: this.handleSubmit}]}
            >
                <p>Deleting the project "{this.props.project}" is irreversible</p>
            </ActionDialog>
        );
    }

    private handleSubmit() {
        deleteProject(this.props.project).then((onSuccess) => {
            this.props.notify("Project successfully deleted");
            this.props.loadProjects();
            browserHistory.push("/app");
        }).catch((ex) => this.props.notify("Project could not be deleted " + ex));
        this.props.onRequestClose();
    }
};


interface IProps {
    open: boolean;
    project: string;
    onRequestClose: () => void;
};


interface IDispatchProps {
    loadProjects: () => void;
    notify: (message: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    loadProjects: () => dispatch(getProjects()),
    notify: (message: string) => dispatch(notify(message)),
});


export default connect<{}, IDispatchProps, IProps>(null, mapDispatchToProps)(ProjectItemDeleteForm);
