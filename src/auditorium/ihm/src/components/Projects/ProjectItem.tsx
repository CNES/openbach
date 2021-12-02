import * as React from "react";
import {browserHistory} from "react-router";

import IconButton from "material-ui/IconButton";
import {ListItem} from "material-ui/List";

import {openURL} from "../../api/common";
import {getGenericDeleteIcon, getGenericDownloadIcon} from "../../utils/theme";

import DownloadButton from "../common/DownloadButton";
import ProjectItemDeleteForm from "./ProjectItemDeleteForm";


export default class ProjectItem extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = { openDialog: false };
        this.handleOpenDialog = this.handleOpenDialog.bind(this);
        this.handleCloseDialog = this.handleCloseDialog.bind(this);
        this.goToProject = this.goToProject.bind(this);
        this.doDownload = this.doDownload.bind(this);
    }

    public render() {
        const {name, description} = this.props;

        /* We need to define the button here so that
        material-ui doesn't apply weird styles
        (namely position absolute and display block)
        to the wrapper. */
        const deleteButton = (
            <IconButton
                touch={true}
                tooltip="Delete"
                tooltipPosition="top-left"
                onTouchTap={this.handleOpenDialog}
            >
                {getGenericDeleteIcon()}
                <ProjectItemDeleteForm
                    open={this.state.openDialog}
                    project={name}
                    onRequestClose={this.handleCloseDialog}
                />
            </IconButton>
        );

        const exportButton = (
            <IconButton
                touch={true}
                tooltip="Download Project"
                tooltipPosition="top-right"
                style={{marginLeft: "16px", padding: "0px"}}
                disabled={false}
                onTouchTap={this.doDownload}
            >
                {getGenericDownloadIcon()}
            </IconButton>
        );

        return (
            <ListItem
                primaryText={name}
                secondaryText={this.shorten(description)}
                leftIcon={exportButton}
                rightIconButton={deleteButton}
                onTouchTap={this.goToProject}
            />
        );
    }

    private handleOpenDialog() {
        this.setState({ openDialog: true });
    }

    private handleCloseDialog() {
        this.setState({ openDialog: false });
    }

    private doDownload(event) {
        event.stopPropagation();
        const {name} = this.props;
        openURL(`/openbach/project/${name}/`, `${name}.json`);
    }

    private goToProject() {
        browserHistory.push("/app/project/" + this.props.name);
    }

    private shorten(description: string) {
        const newLinePos = description.indexOf("\n");
        return newLinePos === -1 ? description : description.substr(0, newLinePos);
    }
};


interface IProps {
    name: string;
    description: string;
};


interface IState {
    openDialog: boolean;
};
