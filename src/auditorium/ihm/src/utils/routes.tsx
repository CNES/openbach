import * as React from "react";
import {IndexRoute, Redirect, Route, Router} from "react-router";
import {ReactRouterReduxHistory} from "react-router-redux";

import Agents from "../components/Agents/AgentsDisplay";
import App from "../components/App/App";
import Empty from "../components/common/EmptyComponent";
import Glossary from "../components/Help/Glossary";
import ScenarioIcons from "../components/Help/ScenarioIcons";
import Jobs from "../components/Jobs/JobsDisplay";
import ProjectContainer from "../components/Project/ProjectContainer";
import Scenario from "../components/Project/ProjectSelectedScenario";
import Projects from "../components/Projects/ProjectsListContainer";
import Manage from "../components/Users/Manage";
import Settings from "../components/Users/SettingsWrapper";


export default class Routes extends React.Component<IProps, {}> {
    public render() {
        return (
            <Router history={this.props.history}>
                <Route path="/app" component={App}>
                    <IndexRoute component={Projects} />
                    <Route path="project" component={Projects} />
                    <Route path="project/:projectId" component={ProjectContainer}>
                        <Route path="scenario/:scenarioId" component={Scenario} />
                    </Route>
                    <Route path="admin" component={Empty}>
                        <IndexRoute component={Agents} />
                        <Route path="agents" component={Agents} />
                        <Route path="jobs" component={Jobs} />
                        <Route path="users" component={Manage} />
                    </Route>
                    <Route path="glossary" component={Glossary} />
                    <Route path="icons" component={ScenarioIcons} />
                    <Route path="settings" component={Settings} />
                </Route>
                <Redirect from="*" to="/app"/>
            </Router>
        );
    }
};


interface IProps {
    history: ReactRouterReduxHistory;
};
