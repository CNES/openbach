import * as React from "react";

import Dialog from "material-ui/Dialog";
import List from "material-ui/List";
import RaisedButton from "material-ui/RaisedButton";

import {IAgent} from "../../../interfaces/agent.interface";
import {IJobStateQuery} from "../../../interfaces/job.interface";
import JobsStatusesQuery from "./JobsStatusesQuery";


export default class JobsStatusesInfos extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = { queries: props.queries, open: false, title: "", content: "" };
        this.handleShowStatus = this.handleShowStatus.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    public componentWillReceiveProps(nextProps: IProps) {
        if (nextProps.queries !== this.props.queries) {
            this.setState({ queries: this.state.queries.concat(nextProps.queries) });
        }
    }

    public render() {
        const {queries, open, title, content} = this.state;
        const query_elements = queries.map((query: IJobStateQuery, idx: number) => (
            <JobsStatusesQuery
                key={idx}
                agent={query.agent}
                jobName={query.jobName}
                operation={query.operation}
                onClick={this.handleShowStatus}
                onActionDone={this.props.onActionDone}
            />
        ));

        return (
            <div>
                <List style={{marginTop: "15px"}}>{query_elements}</List>
                <Dialog
                    title={title}
                    actions={[<RaisedButton label="OK" primary={true} onClick={this.handleClose} />]}
                    modal={false}
                    open={open}
                    onRequestClose={this.handleClose}
                >
                    {content}
                </Dialog>
            </div>
        );
    }

    private handleShowStatus(title: string, content: string) {
        this.setState({ open: true, title, content });
    }

    private handleClose() {
        this.setState({ open: false });
    }
};


interface IProps {
    queries: IJobStateQuery[];
    onActionDone: (agent: IAgent) => void;
};


interface IState {
    queries: IJobStateQuery[];
    open: boolean;
    title: string;
    content: string;
};
