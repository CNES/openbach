import * as React from "react";
import {connect} from "react-redux";

import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";

import {clearJSON, downloadJSON, submitJSON} from "../../actions/global";

import ActionDialog from "./ActionDialog";


class JSONEditor extends React.Component<IProps & IStoreProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = { content: "", open: false, error: undefined };
        this.doEdit = this.doEdit.bind(this);
        this.handleContentChange = this.handleContentChange.bind(this);
        this.handleCloseDialog = this.handleCloseDialog.bind(this);
        this.submitModifications = this.submitModifications.bind(this);
    }

    public render() {
        const title = this.props.type ? "Edit " + this.props.type : "Edit";

        return (
            <RaisedButton
                label={title}
                style={this.props.style}
                disabled={this.props.disabled}
                onTouchTap={this.doEdit}
                secondary={true}
            >
                <ActionDialog
                    title="JSON Editor"
                    modal={true}
                    open={this.state.open}
                    auto={true}
                    cancel={{label: "Cancel", action: this.handleCloseDialog}}
                    actions={[{label: "Submit", action: this.submitModifications}]}
                >
                    <TextField
                        floatingLabelText="Content"
                        multiLine={true}
                        value={this.state.content}
                        fullWidth={true}
                        errorText={this.state.error}
                        onChange={this.handleContentChange}
                    />
                </ActionDialog>
            </RaisedButton>
        );
    }

    public componentWillUnmount() {
        this.props.doClear();
    }

    public componentWillReceiveProps(nextProps: IStoreProps) {
        if (nextProps.content && !this.state.content) {
            this.setState({
                content: JSON.stringify(nextProps.content, null, 2),
                error: undefined,
                open: this.state.open,
            });
        }
    }

    private doEdit(event) {
        event.stopPropagation();
        this.setState({ content: "", open: true, error: undefined });
        this.props.doEdit(this.props.route);
    }

    private handleCloseDialog() {
        this.props.doClear();
        this.setState({ content: "", open: false, error: undefined });
    }

    private submitModifications() {
        try {
            const newContent = JSON.parse(this.state.content);
            this.props.doSubmit(this.props.route, newContent, this.props.projectName);
            this.handleCloseDialog();
        } catch (e) {
            this.setState({ content: this.state.content, open: true, error: e.message });
        }
    }

    private handleContentChange(event) {
        this.setState({ content: event.target.value, open: true, error: undefined });
    }
};


interface IState {
    content: string;
    error: string;
    open: boolean;
};


interface IProps {
    route: string;
    type?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
    projectName?: string;
};


interface IStoreProps {
    content: any;
};


interface IDispatchProps {
    doClear: () => void;
    doEdit: (route: string) => void;
    doSubmit: (route: string, data: { [propName: string]: any; }, project: string) => void;
};


const mapStoreToProps = (store): IStoreProps => ({
    content: store.editor,
});


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    doClear: () => dispatch(clearJSON()),
    doEdit: (route: string) => dispatch(downloadJSON(route)),
    doSubmit: (route: string, data: { [propName: string]: any; }, project: string) => dispatch(submitJSON(route, data, project)),
});


export default connect<IStoreProps, IDispatchProps, IProps>(mapStoreToProps, mapDispatchToProps)(JSONEditor);
