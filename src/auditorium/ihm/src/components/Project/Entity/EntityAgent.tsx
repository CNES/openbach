import * as React from "react";
import {connect} from "react-redux";

import MenuItem from "material-ui/MenuItem";
import SelectField from "material-ui/SelectField";

import {IAgent} from "../../../interfaces/agent.interface";
import {constructAvailableAgentsItems} from "../../../utils/utils";


class EntityAgent extends React.Component<IProps & IStoreProps, {}> {
    constructor(props) {
        super(props);
        this.handleAgentChange = this.handleAgentChange.bind(this);
    }

    public render() {
        const selectedAgent = !this.props.agent ? null : this.props.agent.address;
        const agents = constructAvailableAgentsItems(this.props.projectName, this.props.agents, selectedAgent);

        const selectedIndex = agents[2];
        const agentsReserved = agents[0].map((entry) => (
            <MenuItem key={entry[0]} value={entry[1]} primaryText={entry[0]} />
        ));
        const agentsChoice = agents[1].map((entry) => (
            <MenuItem key={entry[0]} value={entry[1]} primaryText={entry[0]} />
        ));

        const selector = (
            <SelectField
                fullWidth={true}
                disabled={this.props.modificationOngoing}
                value={selectedIndex}
                onChange={this.handleAgentChange}
                floatingLabelText={selectedAgent ? "Name" : "No associated agent"}
            >
                <MenuItem value={null} primaryText="" />
                <MenuItem value="" primaryText="--- Agents reserved for this project ---" />
                {agentsReserved}
                <MenuItem value="" primaryText="--- Free agents ---" />
                {agentsChoice}
            </SelectField>
        );

        if (!this.props.agent) {
            return selector;
        }

        const jobs = this.props.jobs.map((job: string) => <li key={job}>{job}</li>);

        const services = this.props.agents[selectedIndex].services || {};
        const ntpResult = services.hasOwnProperty("ntp.service") ? services["ntp.service"] : "";
        const ntpSource = ntpResult.split(/\r?\n/).find((s: string) => s.startsWith("*"));
        const ntpOffset = "NTP offset: " + (ntpSource ? ntpSource.split(/\s+/)[8] + " ms" : "not synchronized");

        const errors = this.props.agents[selectedIndex].errors || [];
        const errorsList = errors.map((error, index: number) => <li key={index}>{error.msg}</li>);
        const errorsItem = errorsList.length ? <li><ul>{errorsList}</ul></li> : undefined;

        return (
            <ul>
                <li>{selector}</li>
                <li>IP used for installation: <b>{this.props.agent.address}</b></li>
                <li>Collector: <b>{this.props.agent.collector_ip}</b></li>
                <li>Installed jobs: {jobs.length ? <ul>{jobs}</ul> : "No jobs installed"}</li>
                <li>{ntpResult === "" ? "NTP status not fetched" : ntpOffset}</li>
                {errorsItem}
            </ul>
        );
    }

    private handleAgentChange(event, key: number, payload: string) {
        const {agent, changeAgent} = this.props;
        const newAgent = payload ? this.props.agents[payload] : null;
        if ((!agent && newAgent !== null) || (agent && newAgent === null) || (agent && newAgent.address !== agent.address)) {
            changeAgent(newAgent);
        }
    }
};


interface IProps {
    agent: IAgent;
    jobs: string[];
    projectName: string;
    modificationOngoing: boolean;
    changeAgent: (agent: IAgent) => void;
};


interface IStoreProps {
    agents: IAgent[];
};


const mapStoreToProps = (store): IStoreProps => ({
    agents: store.agent,
});


export default connect<IStoreProps, {}, IProps>(mapStoreToProps)(EntityAgent);
