import * as React from "react";
import {connect} from "react-redux";

import Checkbox from "material-ui/Checkbox";
import TextField from "material-ui/TextField";

import {newImportedProject, newProject} from "../../actions/project";
import {ILoginCredentials} from "../../interfaces/login.interface";

import ActionCard from "../common/ActionCard";
import UploadFileButton from "../common/UploadFileButton";


const initialState: IState = {
    importProject: { projectFile: null, ignoreTopology: false },
    newProject: { description: "", name: "", isPublic: false },
};


class NewProject extends React.Component<IDispatchProps & IStoreProps, IState> {
    constructor(props) {
        super(props);
        this.state = initialState;
        this.addProject = this.addProject.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleIsPublicChange = this.handleIsPublicChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.importProject = this.importProject.bind(this);
        this.handleProjectFileChange = this.handleProjectFileChange.bind(this);
        this.handleIgnoreTopologyChange = this.handleIgnoreTopologyChange.bind(this);
    }

    public render() {
        const {name, description, isPublic} = this.state.newProject;
        const {projectFile, ignoreTopology} = this.state.importProject;
        const fileName = projectFile !== null ? projectFile.name : "Project's file";

        return (
            <div>
                <ActionCard
                    title="Create Project"
                    actionName="New Project"
                    actionPossible={name !== ""}
                    onAction={this.addProject}
                >
                    <div><TextField
                        hintText="Project name"
                        floatingLabelText="Project name"
                        value={name}
                        onChange={this.handleNameChange}
                        fullWidth={true}
                    /></div>
                    <div><TextField
                        hintText="Project description"
                        floatingLabelText="Project description"
                        value={description}
                        onChange={this.handleDescriptionChange}
                        fullWidth={true}
                        multiLine={true}
                        rows={3}
                        rowsMax={10}
                    /></div>
                    <div><Checkbox
                        label="Keep project public"
                        checked={isPublic}
                        onCheck={this.handleIsPublicChange}
                        style={{marginBottom: "16px", marginTop: "24px"}}
                    /></div>
                </ActionCard>
                <ActionCard
                    title="Import Project"
                    actionName="Import Project"
                    actionPossible={projectFile !== null}
                    onAction={this.importProject}
                >
                    <UploadFileButton
                        label={fileName}
                        id="upload-project-button"
                        onChange={this.handleProjectFileChange}
                    />
                    <div><Checkbox
                        label="Ignore network topology"
                        checked={ignoreTopology}
                        onCheck={this.handleIgnoreTopologyChange}
                        style={{marginBottom: "16px", marginTop: "24px"}}
                    /></div>
                </ActionCard>
            </div>
        );
    }

    private handleIgnoreTopologyChange(event, checked: boolean) {
        const {projectFile} = this.state.importProject;
        this.setState({
            importProject: {
                projectFile,
                ignoreTopology: checked,
            },
        });
    }

    private handleProjectFileChange(event) {
        const {ignoreTopology} = this.state.importProject;
        this.setState({
            importProject: {
                ignoreTopology,
                projectFile: event.target.files[0],
            },
        });
    }

    private handleNameChange(event) {
        const {isPublic, description} = this.state.newProject;
        this.setState({
            newProject: {
                description,
                isPublic,
                name: event.target.value,
            },
        });
    }

    private handleIsPublicChange(event, checked: boolean) {
        const {name, description} = this.state.newProject;
        this.setState({
            newProject: {
                description,
                name,
                isPublic: checked,
            },
        });
    }

    private handleDescriptionChange(event) {
        const {isPublic, name} = this.state.newProject;
        this.setState({
            newProject: {
                name,
                isPublic,
                description: event.target.value,
            },
        });
    }

    private addProject() {
        const {name, description, isPublic} = this.state.newProject;
        if (name !== "") {
            const owners: string[] = [];
            if (!isPublic) {
                owners.push(this.props.login.username);
            }
            this.props.addProject(name, description, owners);
            this.setState(initialState);
        }
    }

    private importProject() {
        const {projectFile, ignoreTopology} = this.state.importProject;
        if (projectFile !== null) {
            this.props.importProject(projectFile, ignoreTopology);
            this.setState(initialState);
        }
    }
};


interface IState {
    newProject: {
        name: string;
        description: string;
        isPublic: boolean;
    };
    importProject: {
        projectFile: File;
        ignoreTopology: boolean;
    };
};


interface IStoreProps {
    login: ILoginCredentials;
};


const mapStoreToProps = (store): IStoreProps => ({
    login: store.login,
});


interface IDispatchProps {
    addProject: (name: string, description: string, owners: string[]) => void;
    importProject: (project: File, ignoreTopology: boolean) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    addProject: (name: string, description: string, owners: string[]) => dispatch(newProject(name, description, owners)),
    importProject: (project: File, ignoreTopology: boolean) => dispatch(newImportedProject(project, ignoreTopology)),
});


export default connect<IStoreProps, IDispatchProps, {}>(mapStoreToProps, mapDispatchToProps)(NewProject);
