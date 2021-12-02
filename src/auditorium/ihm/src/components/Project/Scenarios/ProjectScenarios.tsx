import * as React from "react";
import {connect} from "react-redux";
import {browserHistory} from "react-router";

import Divider from "material-ui/Divider";
import {List} from "material-ui/List";

import {ILoginCredentials} from "../../../interfaces/login.interface";
import {IProject, IScenario} from "../../../interfaces/project.interface";

import PaddedContainer from "../../common/PaddedContainer";
import ScenarioAdd from "./ScenarioAdd";
import ScenarioListItem from "./ScenarioListItem";


class ProjectScenarios extends React.Component<IProps & IStoreProps, {}> {
    constructor(props) {
        super(props);
        this.onScenarioSelected = this.onScenarioSelected.bind(this);
    }

    public render() {
        const {login, project} = this.props;
        const favorites = {};
        (login.favorites[project.name] || []).forEach((scenario: string) => { favorites[scenario] = true; });

        const scenarios = project.scenario.sort((scenario: IScenario, other: IScenario) => scenario.name.localeCompare(other.name));
        const favoritedScenarios = scenarios.filter((scenario: IScenario) => favorites.hasOwnProperty(scenario.name));
        const regularScenarios = scenarios.filter((scenario: IScenario) => !favorites.hasOwnProperty(scenario.name));

        const divider = favoritedScenarios.length ? <Divider /> : null;
        return (
            <PaddedContainer>
                <List>{this.buildScenarioListItems(favoritedScenarios)}</List>
                {divider}
                <List>{this.buildScenarioListItems(regularScenarios)}</List>
                <ScenarioAdd onScenarioAdd={this.onScenarioSelected} />
            </PaddedContainer>
        );
    }

    private buildScenarioListItems(scenarios: IScenario[]) {
        return scenarios.map((scenario: IScenario) => (
            <ScenarioListItem
                key={scenario.name}
                scenario={scenario}
                onScenarioClick={this.onScenarioSelected}
            />
        ));
    }

    private onScenarioSelected(scenarioName: string) {
        browserHistory.push(`/app/project/${this.props.project.name}/scenario/${scenarioName}`);
        this.props.onScenarioClick();
    }
};


interface IProps {
    project: IProject;
    onScenarioClick: () => void;
};


interface IStoreProps {
    login: ILoginCredentials;
};


const mapStoreToProps = (store): IStoreProps => ({
    login: store.login,
});


export default connect<IStoreProps, {}, IProps>(mapStoreToProps)(ProjectScenarios);
