import * as React from "react";
import {connect} from "react-redux";

import {TouchTapEvent} from "material-ui";
import MenuItem from "material-ui/MenuItem";
import {green500, red500} from "material-ui/styles/colors";

import {getJobs} from "../../../api/agent";
import {IJob} from "../../../interfaces/job.interface";
import {IEntity} from "../../../interfaces/project.interface";
import {IOpenbachFunctionForm} from "../../../interfaces/scenarioForm.interface";
import {Absent, Present} from "../../../utils/theme";

import {FormField, SelectFormField, TextFormField} from "../../common/Form";
import TitledPaper from "../../common/TitledPaper";
import JobParameters from "./JobParameters";
import ScenarioDivider from "./ScenarioDivider";


interface IStyles {
    container: React.CSSProperties;
    scheduling: React.CSSProperties;
    select: React.CSSProperties;
    text: React.CSSProperties;
    wrapper: React.CSSProperties;
};


const styles: IStyles = {
    container: {
        display: "inline-block",
        margin: "0px 2.5%",
        verticalAlign: "top",
        width: "45%",
    },
    scheduling: {
        display: "inline-block",
        verticalAlign: "bottom",
        width: "100%",
    },
    select: {
        margin: "0 5px 0 0",
        padding: 0,
        verticalAlign: "bottom",
    },
    text: {
        display: "inline",
        fontSize: "1em",
        margin: "0 10px",
        padding: 0,
    },
    wrapper: {
        margin: "0 3%",
    },
};


class OpenbachFunctionStartJobInstance extends React.Component<IProps & IStoreProps, IState> {
    constructor(props) {
        super(props);
        this.state = { availableJobsOnEntity: [] };

        const {entities} = props;
        if (entities) {
            const entity = entities.find((e: IEntity) => e.name === props.openbachFunction.entity);
            if (entity && entity.agent) {
                this.refreshJobList(entity.agent.address);
            }
        }
    }

    public render() {
        const {entities, jobs, index, openbachFunction, otherFunctions} = this.props;
        const {availableJobsOnEntity} = this.state;

        const entitiesOptions = entities.map((entity: IEntity) =>
            <MenuItem key={entity.name} value={entity.name} primaryText={entity.name} />,
        );

        const jobsOnAgent = {};
        jobs.forEach((job: IJob) => { jobsOnAgent[job.general.name] = false; });
        availableJobsOnEntity.forEach((job: string) => { jobsOnAgent[job] = true; });
        const jobOptions = jobs.map((job: IJob) => (
            <MenuItem
                key={job.general.name}
                value={job.general.name}
                primaryText={job.general.name}
                style={{color: jobsOnAgent[job.general.name] ? "black" : "gray"}}
                leftIcon={jobsOnAgent[job.general.name] ? <Present color={green500}/> : <Absent color={red500}/>}
            />
        ));

        const selectedJob = openbachFunction.job;
        const parameters = openbachFunction.parameters;
        const subcommands = openbachFunction.subcommands;

        return (
            <TitledPaper level={3} title="Starting job">
                <div style={styles.container}>
                    <FormField
                        name={`functions[${index}].entity`}
                        component={SelectFormField}
                        text="Entity name"
                        fullWidth={true}
                        children={entitiesOptions}
                    />
                </div>
                <div style={styles.container}>
                    <FormField
                        name={`functions[${index}].job`}
                        text="Job"
                        component={SelectFormField}
                        fullWidth={true}
                        children={jobOptions}
                    />
                </div>
                <div style={styles.scheduling}>
                    <div style={styles.wrapper}>
                        <p style={styles.text}>Optionally, the agent will run the job after</p>
                        <FormField
                            name={`functions[${index}].offset`}
                            component={TextFormField}
                            text="Offset"
                        />
                        <p style={styles.text}>seconds when the function is started. It will also reschedule it every</p>
                        <FormField
                            name={`functions[${index}].interval`}
                            component={TextFormField}
                            text="Interval"
                        />
                        <p style={styles.text}>seconds after the beginning of its first run.</p>
                    </div>
                </div>
                <ScenarioDivider />
                <JobParameters
                    formBase={`functions[${index}]`}
                    jobs={jobs}
                    otherFunctions={otherFunctions}
                    selected={selectedJob}
                    parameters={parameters && parameters[selectedJob] || {}}
                    subcommands={subcommands && subcommands[selectedJob] || {}}
                />
            </TitledPaper>
        );
    }

    public componentWillReceiveProps(nextProps: IProps & IStoreProps) {
        const {entities} = nextProps;
        if (!entities || entities.length === 0) {
            return;
        }

        const nextEntityName = nextProps.openbachFunction.entity;
        const curEntityName = this.props.openbachFunction.entity;
        if (nextEntityName === curEntityName) {
            return;
        }

        const nextEntity = entities.find((entity: IEntity) => entity.name === nextEntityName);
        const curEntity = entities.find((entity: IEntity) => entity.name === curEntityName);
        if (!nextEntity || !nextEntity.agent) {
            this.setState({ availableJobsOnEntity: [] });
        } else {
            this.refreshJobList(nextEntity.agent.address);
        }
    }

    private refreshJobList(agent_ip: string) {
        getJobs(agent_ip).then((jobs: string[]) => { this.setState({ availableJobsOnEntity: jobs }); });
    }
};


interface IProps {
    index: number;
    openbachFunction: IOpenbachFunctionForm;
    otherFunctions: IOpenbachFunctionForm[];
};


interface IStoreProps {
    entities: IEntity[];
    jobs: IJob[];
};


interface IState {
    availableJobsOnEntity: string[];
};


const mapStoreToProps = (store): IStoreProps => ({
    entities: store.project.current.entity,
    jobs: store.job,
});


export default connect<IStoreProps, {}, IProps>(mapStoreToProps)(OpenbachFunctionStartJobInstance);
