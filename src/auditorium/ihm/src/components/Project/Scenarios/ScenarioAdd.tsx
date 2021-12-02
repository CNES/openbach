import * as React from "react";
import {connect} from "react-redux";

import TextField from "material-ui/TextField";

import {newImportedScenario, newScenario} from "../../../actions/scenario";
import {IScenario} from "../../../interfaces/project.interface";

import ActionCard from "../../common/ActionCard";
import UploadFileButton from "../../common/UploadFileButton";


const initialState: IState = {
    newScenarioFile: null,
    newScenarioName: "",
};


class ScenarioAdd extends React.Component<IProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = initialState;
        this.addScenario = this.addScenario.bind(this);
        this.handleScenarioNameChange = this.handleScenarioNameChange.bind(this);
        this.importScenario = this.importScenario.bind(this);
        this.handleScenarioFileChange = this.handleScenarioFileChange.bind(this);
    }

    public render() {
        let name = "Scenario's file";
        if (this.state.newScenarioFile !== null) {
            name = this.state.newScenarioFile.name;
        }

        return (
            <div>
                <ActionCard
                    title="Create Scenario"
                    actionName="New Scenario"
                    actionPossible={this.state.newScenarioName !== ""}
                    onAction={this.addScenario}
                >
                    <TextField
                        hintText="Scenario name"
                        floatingLabelText="Scenario name"
                        value={this.state.newScenarioName}
                        fullWidth={true}
                        onChange={this.handleScenarioNameChange}
                    />
                </ActionCard>
                <ActionCard
                    title="Import Scenario"
                    actionName="Import Scenario"
                    actionPossible={this.state.newScenarioFile !== null}
                    onAction={this.importScenario}
                >
                    <UploadFileButton
                        label={name}
                        id="upload-project-button"
                        onChange={this.handleScenarioFileChange}
                    />
                </ActionCard>
            </div>
        );
    }

    private handleScenarioNameChange(event) {
        this.setState({
            newScenarioFile: this.state.newScenarioFile,
            newScenarioName: event.target.value,
        });
    }

    private handleScenarioFileChange(event) {
        this.setState({
            newScenarioFile: event.target.files[0],
            newScenarioName: this.state.newScenarioName,
        });
    }

    private addScenario() {
        const {newScenarioName} = this.state;
        if (newScenarioName !== "") {
            this.props.addScenario(newScenarioName);
            this.setState(initialState);
            this.props.onScenarioAdd(newScenarioName);
        }
    }

    private importScenario() {
        const {newScenarioFile} = this.state;
        if (newScenarioFile) {
            this.props.importScenario(newScenarioFile);
            this.setState(initialState);
        }
    }
};


interface IState {
    newScenarioName: string;
    newScenarioFile: File;
};


interface IProps {
    onScenarioAdd: (scenarioName: string) => void;
};


interface IDispatchProps {
    addScenario: (name: string) => void;
    importScenario: (scenario: File) => void;
};


const mapDispatchToProps = (dispatch) => ({
    addScenario: (name: string) => dispatch(newScenario(name)),
    importScenario: (scenario: File) => dispatch(newImportedScenario(scenario)),
});


export default connect<{}, IDispatchProps, IProps>(null, mapDispatchToProps)(ScenarioAdd);
