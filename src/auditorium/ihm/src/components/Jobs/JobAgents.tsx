import * as React from "react";
import {connect} from "react-redux";
import {Creatable as ReactSelect, Option as ReactSelectOption} from "react-select";

import {ListItem} from "material-ui/List";
import RaisedButton from "material-ui/RaisedButton";

import {listAgents} from "../../api/job";
import {IAgent} from "../../interfaces/agent.interface";
import {IJob, IJobAgentsList} from "../../interfaces/job.interface";


class JobAgents extends React.Component<IProps & IStoreProps, IState> {
    constructor(props) {
        super(props);
        this.state = { agents: [], initial: {} };
        this.onSelectionChange = this.onSelectionChange.bind(this);
        this.onUpdateClick = this.onUpdateClick.bind(this);
    }

    public render() {
        const jobName = this.props.job.general.name;
        const availableAgents = this.props.agents.map((agent: IAgent) => ({
            label: `${agent.name} (${agent.address})`,
            value: agent.address,
        }));

        const nested = [(
            <div key="unique" style={{display: "flex", alignItems: "center"}}>
                <div style={{flexGrow: 1, margin: "0 5px"}}>
                    <ReactSelect
                        multi={true}
                        name={`power-tool-for-job-${jobName}`}
                        value={this.state.agents}
                        options={availableAgents}
                        onChange={this.onSelectionChange}
                    />
                </div>
                <RaisedButton
                    label="Update"
                    secondary={true}
                    onClick={this.onUpdateClick}
                />
            </div>
        )];

        return (
            <ListItem
                primaryText="Installed on"
                disabled={true}
                nestedItems={nested}
                autoGenerateNestedIndicator={false}
                initiallyOpen={true}
            />
        );
    }

    public componentDidMount() {
        listAgents(this.props.job.general.name)
        .then((infos: IJobAgentsList) => {
            const agents = infos.installed_on.map((info) => ({
                label: `${info.agent__name} (${info.agent__address})`,
                value: info.agent__address,
            }));
            const initial = {};
            infos.installed_on.forEach((info) => { initial[info.agent__address] = info.agent__name; });
            this.setState({agents, initial});
        })
        .catch((error) => this.setState({ agents: ["Could not fetch agents list: " + error], initial: {} }));
    }

    private onSelectionChange(selected: ReactSelectOption[]) {
        this.setState({ agents: selected });
    }

    private onUpdateClick() {
        const {agents, initial} = this.state;
        const usedAddresses = {};

        const updates = agents.filter((agent: ReactSelectOption) => initial.hasOwnProperty(agent.value) && (usedAddresses[agent.value] = true));
        const installs = agents.filter((agent: ReactSelectOption) => !initial.hasOwnProperty(agent.value) && (usedAddresses[agent.value] = true));
        const removes = this.props.agents
                        .filter((agent: IAgent) => initial.hasOwnProperty(agent.address) && !usedAddresses.hasOwnProperty(agent.address))
                        .map((agent: IAgent) => ({ label: `${agent.name} (${agent.address})`, value: agent.address }));

        this.props.onJobUpdate(this.props.job.general.name, updates, installs, removes);
    }
};


interface IState {
    agents: ReactSelectOption[];
    initial: {[name: string]: string};
};


interface IProps {
    job: IJob;
    onJobUpdate: (jobName: string, updates: ReactSelectOption[], installs: ReactSelectOption[], removes: ReactSelectOption[]) => void;
};


interface IStoreProps {
    agents: IAgent[];
};


const mapStoreToProps = (store): IStoreProps => ({
    agents: store.agent,
});


export default connect<IStoreProps, {}, IProps>(mapStoreToProps)(JobAgents);
