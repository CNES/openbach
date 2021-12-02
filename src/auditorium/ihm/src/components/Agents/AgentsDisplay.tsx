import * as React from "react";
import {connect} from "react-redux";

import {getAgents} from "../../actions/agent";
import {setTitle} from "../../actions/global";
import {getProjects} from "../../actions/project";
import {IAgent} from "../../interfaces/agent.interface";
import {ILoginCredentials} from "../../interfaces/login.interface";
import {IProject} from "../../interfaces/project.interface";

import PaddedContainer from "../common/PaddedContainer";
import NewAgent from "./AgentsAdd";
import Status from "./AgentsStatuses";
import Hierarchy from "./AgentsTopology";


interface IStyles {
    add: React.CSSProperties;
    display: React.CSSProperties;
};


const styles: IStyles = {
    add: {
        display: "inline-block",
        marginLeft: "2%",
        verticalAlign: "top",
        width: "28%",
    },
    display: {
        display: "inline-block",
        width: "70%",
    },
};


class AgentsDisplay extends React.Component<IStoreProps & IDispatchProps, {}> {
    public render() {
        const {agents, login, projects} = this.props;
        const isAdmin = login && login.is_admin;

        const content = [(
            <div key="display" style={isAdmin ? styles.display : undefined}>
                <Status agents={agents} projects={projects} isAdmin={isAdmin}/>
                <Hierarchy agents={agents} projects={projects} />
            </div>
        )];
        if (isAdmin) {
            content.push(<div key="add" style={styles.add}><NewAgent /></div>);
        }

        return <PaddedContainer>{content}</PaddedContainer>;
    }

    public componentWillMount() {
        this.props.setTitle("OpenBach Administration");
        this.props.loadAgents();
        this.props.loadProjects();
    }

    public componentWillReceiveProps(nextProps: IStoreProps & IDispatchProps) {
        if (nextProps.agents && this.props.agents !== nextProps.agents) {
            this.props.loadAgents();
        }
    }
};


interface IStoreProps {
    agents: IAgent[];
    login: ILoginCredentials;
    projects: IProject[];
};


const mapStoreToProps = (store): IStoreProps => ({
    agents: store.agent,
    login: store.login,
    projects: store.projects,
});


interface IDispatchProps {
    setTitle: (title: string) => void;
    loadAgents: () => void;
    loadProjects: () => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    loadAgents: () => dispatch(getAgents(true)),
    loadProjects: () => dispatch(getProjects()),
    setTitle: (title: string): void => dispatch(setTitle(title)),
});


export default connect<IStoreProps, IDispatchProps, {}>(mapStoreToProps, mapDispatchToProps)(AgentsDisplay);
