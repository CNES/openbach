import * as React from "react";

import {ListItem} from "material-ui/List";

import {stateJob} from "../../../api/job";
import {IAgent} from "../../../interfaces/agent.interface";
import {getIconForJobState} from "../../../utils/theme";


export default class JobsStatusesQuery extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = { status: undefined, intervalId: undefined };
        this.refreshStatus = this.refreshStatus.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    public componentDidMount() {
        this.setState({ intervalId: setInterval(this.refreshStatus, 1000) });
    }

    public componentWillUnmount() {
        const {intervalId} = this.state;
        if (intervalId) {
            clearInterval(intervalId);
        }
    }

    public render() {
        return (
            <ListItem
                primaryText={this.makeTitle()}
                leftIcon={getIconForJobState(this.state.status)}
                onClick={this.handleClick}
            />
        );
    }

    private makeTitle() {
        const {operation, jobName, agent} = this.props;
        return `${operation}ing ${jobName} on ${agent.name}`;
    }

    private refreshStatus() {
        const {operation, jobName, agent} = this.props;
        stateJob(jobName, agent.address).then((result) => {
            const status = result[operation];
            let {intervalId} = this.state;
            if (status && status.returncode !== 202) {
                clearInterval(intervalId);
                intervalId = undefined;
                this.props.onActionDone(this.props.agent);
            }
            this.setState({ status, intervalId });
        });
    }

    private handleClick() {
        const {status} = this.state;
        let content = "Operation not started yet!";

        if (status) {
            if (status.response) {
                if (status.response.state) {
                    content = "Operation " + status.response.state;
                } else if (status.response.response) {
                    content = JSON.stringify(status.response.response);
                } else {
                    content = "Format of the response is unknown. Return code was " + status.response.returncode;
                }
            } else {
                content = "Operation successful!";
            }
        }

        this.props.onClick(this.makeTitle(), content);
    }
};


interface IProps {
    agent: IAgent;
    jobName: string;
    operation: string;
    onActionDone: (agent: IAgent) => void;
    onClick: (title: string, status: string) => void;
};


interface IState {
    status: any;
    intervalId: any;
};
