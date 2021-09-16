import * as React from "react";
import {connect} from "react-redux";

import {IJobStateQuery} from "../../interfaces/job.interface";
import {IProject, IScenario} from "../../interfaces/project.interface";
import {IScenarioInstance} from "../../interfaces/scenarioInstance.interface";

import TitledPaper from "../common/TitledPaper";
import ScenarioBuilder from "./ScenarioForm/ScenarioBuilder";
import ScenarioInstances from "./ScenarioInstances/ProjectScenariosInstances";


interface IStyle {
    builder: React.CSSProperties;
    instances: React.CSSProperties;
};


const styles: IStyle = {
    builder: {
        display: "inline-block",
        verticalAlign: "top",
        width: "70%",
    },
    instances: {
        display: "inline-block",
        verticalAlign: "top",
        width: "30%",
    },
};


class ProjectSelectedScenario extends React.Component<IProps & IStoreProps, IState> {
    private static findScenarioFromId(props: IProps & IStoreProps): IScenario {
        const {params, project} = props;
        if (params && project) {
            return project.scenario.find((scenario: IScenario) => scenario.name === params.scenarioId);
        }
    }

    constructor(props) {
        super(props);
        this.state = {currentScenario: ProjectSelectedScenario.findScenarioFromId(props)};
        this.filterInstancesForCurrentScenario = this.filterInstancesForCurrentScenario.bind(this);
    }

    public render() {
        const {projectId, scenarioId} = this.props.params;
        if (!this.props.project) {
            return <p>Loading project {projectId}</p>;
        }

        const {currentScenario} = this.state;
        if (!currentScenario) {
            return <p>Project {projectId} does not contain a scenario named {scenarioId}</p>;
        }

        return (
            <div>
                <TitledPaper title={"Scenario " + scenarioId} style={styles.builder}>
                    <ScenarioBuilder key={scenarioId} scenario={currentScenario} />
                </TitledPaper>
                <TitledPaper title="Instances" style={styles.instances}>
                    <ScenarioInstances
                        projectName={projectId}
                        scenarioName={currentScenario.name}
                        instanceOpened={this.props.instanceOpened}
                        onInstancePopup={this.props.onInstancePopup}
                        jobsListener={this.props.jobsListener}
                    />
                </TitledPaper>
            </div>
        );
    }

    public componentWillReceiveProps(nextProps: IProps & IStoreProps) {
        if (!nextProps.project && !nextProps.params) {
            this.setState({ currentScenario: undefined });
        } else if (nextProps.project !== this.props.project || nextProps.params.scenarioId !== this.props.params.scenarioId) {
            this.setState({ currentScenario: ProjectSelectedScenario.findScenarioFromId(nextProps) });
        }
    }

    private filterInstancesForCurrentScenario(instance: IScenarioInstance): boolean {
        return instance.scenario_name === this.state.currentScenario.name;
    }
};


interface IState {
    currentScenario: IScenario;
};


interface IProps {
    params: {
        projectId: string;
        scenarioId: string;
    };
    onInstancePopup: (id: number) => void;
    instanceOpened: number;
    jobsListener?: (jobs: IJobStateQuery[]) => void;
};


interface IStoreProps {
    project: IProject;
};


const mapStoreToProps = (store): IStoreProps => ({
    project: store.project.current,
});


export default connect<IStoreProps, {}, IProps>(mapStoreToProps)(ProjectSelectedScenario);
