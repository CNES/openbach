import * as React from "react";

import FloatingActionButton from "material-ui/FloatingActionButton";
import ContentClear from "material-ui/svg-icons/content/clear";

import {IAgent} from "../../../interfaces/agent.interface";
import {IJobStateQuery} from "../../../interfaces/job.interface";
import {IEntity, INetwork} from "../../../interfaces/project.interface";

import EntityAdd from "./EntityAdd";
import EntityCard from "./EntityCard";
import NetworkCard from "./NetworkCard";


export default class ProjectEntityCardContainer extends React.Component<IProps, IState> {
    private clearAgent: () => void;

    constructor(props) {
        super(props);
        this.state = { modifiedAgent: null };
        this.clearAgent = this.refreshJobList.bind(this, null);
    }

    public render() {
        const {jobsListener, projectName, selectedEntity, selectedNetwork, unselectNode} = this.props;

        const card = selectedEntity ? (
            <EntityCard
                entity={selectedEntity}
                jobsListener={jobsListener}
                projectName={projectName}
                refreshAgent={this.state.modifiedAgent}
                clearAgent={this.clearAgent}
                onRemove={unselectNode}
            />
        ) : (selectedNetwork ? <NetworkCard network={selectedNetwork} onChange={unselectNode} /> : <EntityAdd projectName={projectName} />);

        const close = selectedEntity || selectedNetwork ? (
            <FloatingActionButton
                mini={true}
                onClick={unselectNode}
                style={{position: "absolute", top: "-16px", right: "-16px", zIndex: 1}}
            >
                <ContentClear />
            </FloatingActionButton>
        ) : null;

        return <div style={{position: "relative", ...this.props.style}}>{close}{card}</div>;
    }

    public refreshJobList(agent: IAgent) {
        this.setState({ modifiedAgent: agent });
    }
};


interface IState {
    modifiedAgent: IAgent;
};


interface IProps {
    selectedEntity: IEntity;
    selectedNetwork: INetwork;
    projectEntities: IEntity[];
    projectName: string;
    jobsListener: (jobs: IJobStateQuery[]) => void;
    unselectNode: () => void;
    style?: React.CSSProperties;
};
