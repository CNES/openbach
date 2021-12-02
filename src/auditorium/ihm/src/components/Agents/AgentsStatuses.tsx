import * as React from "react";
import {connect} from "react-redux";

import {List, ListItem} from "material-ui/List";
import MenuItem from "material-ui/MenuItem";
import Paper from "material-ui/Paper";
import SelectField from "material-ui/SelectField";
import {green500, grey500, orange500, red500} from "material-ui/styles/colors";
import NoDaemonIcon from "material-ui/svg-icons/file/cloud";
import OkIcon from "material-ui/svg-icons/file/cloud-done";
import NoConnectionIcon from "material-ui/svg-icons/file/cloud-off";

import {reserveProject} from "../../actions/agent";
import {IAgent} from "../../interfaces/agent.interface";
import {IProject} from "../../interfaces/project.interface";

import TitledPaper from "../common/TitledPaper";
import AgentUninstall from "./AgentUninstall";


interface IStyle {
    infos: React.CSSProperties;
    issue: React.CSSProperties;
    running: React.CSSProperties;
    section: React.CSSProperties;
    title: React.CSSProperties;
    unknown: React.CSSProperties;
};


const styles: IStyle = {
    infos: {
        fontSize: "0.8em",
    },
    issue: {
        color: red500,
    },
    running: {
        color: green500,
    },
    section: {
        padding: "3px 3%",
    },
    title: {
        margin: "0 -1%",
    },
    unknown: {
        color: grey500,
    },
};


class AgentsStatuses extends React.Component<IProps & IDispatchProps, {}> {
    public render() {
        const projectItems = this.props.projects.map((project: IProject) => (
            <MenuItem value={project.name} key={project.name} primaryText={project.name} />
        ));

        const statuses = (this.props.agents || []).map((agent: IAgent) => {
            let icon = <OkIcon color={green500} />;
            if (!agent.reachable) {
                icon = <NoConnectionIcon color={red500} />;
            } else if (!agent.available) {
                icon = <NoDaemonIcon color={orange500} />;
            }

            const errors = (agent.errors || []).map((error, index: number) => <p key={index}>{error.msg}</p>);
            const errorsRendered = errors.length ? (
                <section style={styles.section}>
                    <h1 style={styles.title}>Error{errors.length > 1 ? "s" : ""}</h1>
                    {errors}
                </section>) : null;

            const ntpResult = (agent.services || {}).hasOwnProperty("ntp.service") ? agent.services["ntp.service"] : undefined;
            const ntp = ntpResult && ntpResult !== "" ? (
                <section style={styles.section}>
                    <h1 style={styles.title}>NTP</h1>
                    <code><pre>{ntpResult}</pre></code>
                </section>) : null;

            const services = agent.services || {};
            const serviceList = [];
            for (const service in services) {
                if (service !== "ntp.service" && services.hasOwnProperty(service)) {
                    const status = services[service];
                    if (status !== undefined && status !== null) {
                        let statusStyle = styles.unknown;
                        if (status) {
                            if (status === "running") {
                                statusStyle = styles.running;
                            } else {
                                statusStyle = styles.issue;
                            }
                        }
                        serviceList.push(<p key={service}>{service} is <span style={statusStyle}>{services[service]}</span></p>);
                    }
                }
            }
            const servicesRendered = serviceList.length ? (
                <section style={styles.section}>
                    <h1 style={styles.title}>Service{serviceList.length > 1 ? "s" : ""}</h1>
                    {serviceList}
                </section>) : null;

            const projectInfo = agent.project ? <p>Associated to project {agent.project}</p> : (
                this.props.isAdmin ? (
                    <div><SelectField
                        hintText="Reserve for project"
                        floatingLabelText="Reserve for project"
                        value={agent.reserved}
                        onChange={this.onReservedProjectChange.bind(this, agent.address)}
                    >
                        <MenuItem value={null} primaryText="" />
                        {projectItems}
                    </SelectField></div>
                ) : (agent.reserved ? <p>Reserved for project {agent.reserved}</p> : <p>Not associated to any project</p>)
            );

            const actionButtons = this.props.isAdmin ? (
                <AgentUninstall
                    name={agent.name}
                    address={agent.address}
                    collector={agent.collector_ip}
                    reachable={agent.reachable}
                    available={agent.available}
                />
            ) : null;
            const infos = (
                <TitledPaper title={agent.name} style={styles.infos}>
                    <section style={styles.section}>
                        <h1 style={styles.title}>General</h1>
                        <p>Address: {agent.address}</p>
                        <p>Collector: {agent.collector_ip}</p>
                        <p>Agent is {this.getNotIfFalse(agent.reachable)} reachable and {this.getNotIfFalse(agent.available)} available</p>
                        {projectInfo}
                        {actionButtons}
                    </section>
                    {errorsRendered}
                    {ntp}
                    {servicesRendered}
                </TitledPaper>
            );

            return (
                <ListItem
                    key={agent.name}
                    primaryText={agent.name}
                    secondaryText={agent.address}
                    leftIcon={icon}
                    primaryTogglesNestedList={true}
                    nestedItems={[<ListItem key="inner" disabled={true}>{infos}</ListItem>]}
                />
            );
        });

        if (!statuses || !statuses.length) {
            return <TitledPaper title="Agents"><div><p>Fetching agents statuses, please wait!</p></div></TitledPaper>;
        }

        return (
            <TitledPaper title="Agents">
                <List>
                    {statuses}
                </List>
            </TitledPaper>
        );
    }

    private getNotIfFalse(status: boolean) {
        if (!status) {
            return <span style={styles.issue}>not</span>;
        }
    }

    private onReservedProjectChange(address: string, event: Object, key: number, payload: string) {
        this.props.reserve(address, payload);
    }
};


interface IProps {
    agents: IAgent[];
    projects: IProject[];
    isAdmin: boolean;
};


interface IDispatchProps {
    reserve: (address: string, project: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    reserve: (address: string, project: string) => dispatch(reserveProject(address, project)),
});


export default connect<{}, IDispatchProps, IProps>(null, mapDispatchToProps)(AgentsStatuses);
