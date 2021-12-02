import * as React from "react";
import {connect} from "react-redux";

import MenuItem from "material-ui/MenuItem";
import RaisedButton from "material-ui/RaisedButton";
import SelectField from "material-ui/SelectField";
import TextField from "material-ui/TextField";

import {addEntity} from "../../../actions/project";
import {IAgent} from "../../../interfaces/agent.interface";
import {ILoginCredentials} from "../../../interfaces/login.interface";
import {constructAvailableAgentsItems} from "../../../utils/utils";

import EntityCardActionButton from "./EntityCardActionButton";
import EntityCardTemplate from "./EntityCardTemplate";


const image = require("../../../assets/images/project.svg");


class ProjectEntityAdd extends React.Component<IProps & IStoreProps & IDispatchProps, IState> {
    private static initialState(): IState {
        return {
            newEntityAgentIndex: null,
            newEntityDescription: "",
            newEntityName: "",
        };
    }

    constructor(props) {
        super(props);
        this.state = ProjectEntityAdd.initialState();
        this.addEntity = this.addEntity.bind(this);
        this.handleEntityNameChange = this.handleEntityNameChange.bind(this);
        this.handleEntityDescriptionChange = this.handleEntityDescriptionChange.bind(this);
        this.handleEntityAgentChange = this.handleEntityAgentChange.bind(this);
    }

    public render() {
        if (!this.props.login.is_user) {
            return (
                <EntityCardTemplate
                    title="Entity"
                    subtitle="Click on an entity to select it"
                    media={image}
                >
                    No entity selected
                </EntityCardTemplate>
            );
        }

        const agents = constructAvailableAgentsItems(this.props.projectName, this.props.agents);
        const agentsReserved = agents[0].map((entry) => (
            <MenuItem key={entry[0]} value={entry[1]} primaryText={entry[0]} />
        ));
        const agentsChoice = agents[1].map((entry) => (
            <MenuItem key={entry[0]} value={entry[1]} primaryText={entry[0]} />
        ));

        const actions = [(
            <EntityCardActionButton
                key="add"
                label="Add Entity"
                disabled={!this.state.newEntityName}
                onClick={this.addEntity}
            />
        )];

        return (
            <EntityCardTemplate
                title="Add Entity"
                subtitle="Create a new entity for an agent"
                media={image}
                actions={actions}
            >
                <TextField
                    fullWidth={true}
                    hintText="Entity name"
                    floatingLabelText="Entity name"
                    value={this.state.newEntityName}
                    onChange={this.handleEntityNameChange}
                />
                <TextField
                    fullWidth={true}
                    hintText="Entity description"
                    floatingLabelText="Entity description"
                    multiLine={true}
                    rows={3}
                    value={this.state.newEntityDescription}
                    onChange={this.handleEntityDescriptionChange}
                />
                <SelectField
                    fullWidth={true}
                    hintText="Associated Agent"
                    floatingLabelText="Associated Agent"
                    value={this.state.newEntityAgentIndex}
                    onChange={this.handleEntityAgentChange}
                >
                    <MenuItem value={null} primaryText="" />
                    <MenuItem value="" primaryText="--- Agents reserved for this project ---" />
                    {agentsReserved}
                    <MenuItem value="" primaryText="--- Free agents ---" />
                    {agentsChoice}
                </SelectField>
            </EntityCardTemplate>
        );
    }

    private handleEntityNameChange(event, newValue: string) {
        this.setState({ newEntityName: newValue });
    }

    private handleEntityDescriptionChange(event, newValue: string) {
        this.setState({ newEntityDescription: newValue });
    }

    private handleEntityAgentChange(event, key: number, payload: string) {
        const newEntityAgentIndex = payload ? payload : null;
        if (!newEntityAgentIndex || this.state.newEntityName) {
            this.setState({ newEntityAgentIndex });
        } else {
            const agent = this.props.agents[newEntityAgentIndex];
            this.setState({
                newEntityAgentIndex,
                newEntityName: agent.name,
            });
        }
    }

    private addEntity() {
        const {newEntityAgentIndex, newEntityDescription, newEntityName} = this.state;

        if (newEntityName) {
            const newAgent = this.props.agents[newEntityAgentIndex];
            this.props.addEntity(newEntityName, newEntityDescription, newAgent);
            this.setState(ProjectEntityAdd.initialState());
        }
    }
};


interface IState {
    newEntityName: string;
    newEntityDescription: string;
    newEntityAgentIndex: string;
};


interface IProps {
    projectName: string;
};


interface IStoreProps {
    agents: IAgent[];
    login: ILoginCredentials;
};


const mapStoreToProps = (store): IStoreProps => ({
    agents: store.agent,
    login: store.login,
});


interface IDispatchProps {
    addEntity: (name: string, description: string, agent: IAgent) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    addEntity: (name: string, description: string, agent: IAgent) => dispatch(addEntity(name, description, agent)),
});


export default connect<IStoreProps, IDispatchProps, IProps>(mapStoreToProps, mapDispatchToProps)(ProjectEntityAdd);
