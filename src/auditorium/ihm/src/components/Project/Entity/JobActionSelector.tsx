import * as React from "react";
import {Creatable as ReactSelect, Option as ReactSelectOption} from "react-select";

import RaisedButton from "material-ui/RaisedButton";

import {IAgent} from "../../../interfaces/agent.interface";
import {IJobStateQuery} from "../../../interfaces/job.interface";


export default class JobActionSelector extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = { selected: [] };
        this.onAction = this.onAction.bind(this);
        this.onItemSelected = this.onItemSelected.bind(this);
    }

    public render() {
        const {name, options} = this.props;
        const availableOptions = options.map((s: string) => ({label: s, value: s}));

        return (
            <div className="row" style={{margin: "8px 0px"}}>
                <div className="col-xs-4">
                    <RaisedButton
                        label={`${name} Jobs`}
                        onClick={this.onAction}
                        secondary={true}
                    />
                </div>
                <div className="col-xs-8">
                    <ReactSelect
                        multi={true}
                        name={`project-entity-card-${name}-form`}
                        value={this.state.selected}
                        options={availableOptions}
                        onChange={this.onItemSelected}
                    />
                </div>
            </div>
        );
    }

    private onItemSelected(selected: ReactSelectOption[]) {
        this.setState({ selected });
    }

    private onAction() {
        const {selected} = this.state;
        const {action, agent, name} = this.props;

        if (agent && selected.length > 0) {
            const selectedJobs: string[] = selected.map((option: ReactSelectOption) => option.label);
            const queries: IJobStateQuery[] = selectedJobs.map((jobName: string) => ({ agent, jobName, operation: name }));
            this.props.listener(queries);
            action(agent.address, selectedJobs).then((onSuccess) => {
                this.setState({ selected: [] });
                window.scrollTo({ top: document.body.scrollHeight, left: 0, behavior: "smooth" });
            });
        }
    }
};


interface IState {
    selected: ReactSelectOption[];
};


interface IProps {
    agent: IAgent;
    name: "install" | "uninstall";
    options: string[];
    action: (address: string, jobs: string[]) => Promise<{}>;
    listener: (jobs: IJobStateQuery[]) => void;
};
