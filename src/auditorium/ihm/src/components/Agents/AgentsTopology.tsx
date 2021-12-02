import * as React from "react";

import {IAgent} from "../../interfaces/agent.interface";
import {IEntity, IProject} from "../../interfaces/project.interface";

import TitledPaper from "../common/TitledPaper";
import {ITopologyLink, ITopologyNode, Topology} from "../common/Topology";


export default class AgentsTopology extends React.Component<IProps, IState> {
    private static buildNodesAndLinks(props: IProps): { nodes: ITopologyNode[]; links: Array<ITopologyLink<ITopologyNode>>; } {
        const nodes: ITopologyNode[] = [];
        const links: Array<ITopologyLink<ITopologyNode>> = [];
        const projects: { [key: string]: ITopologyNode; } = {};

        props.agents.forEach((agent: IAgent) => {
            const projectAssociatedToAgent = props.projects.find((project: IProject) => {
                return project.entity.find((entity: IEntity) => entity.agent && entity.agent.address === agent.address) !== undefined;
            });

            const topologyNode: ITopologyNode = {name: agent.name, nodeID: agent.name, type: "entity"};
            if (projectAssociatedToAgent) {
                topologyNode.color = "#757575";
                if (!projects[projectAssociatedToAgent.name]) {
                    projects[projectAssociatedToAgent.name] = {
                        name: projectAssociatedToAgent.name,
                        nodeID: projectAssociatedToAgent.name,
                        type: "project",
                    };
                    nodes.push(projects[projectAssociatedToAgent.name]);
                }
                links.push({source: topologyNode, target: projects[projectAssociatedToAgent.name], weight: 3});
            }
            nodes.push(topologyNode);
        });

        return { nodes, links };
    }

    constructor(props) {
        super(props);
        this.state = AgentsTopology.buildNodesAndLinks(props);
    }

    public render() {
        const {nodes, links} = this.state;
        return (
            <TitledPaper title="Projects topology" style={{height: "500px"}}>
                <Topology nodes={nodes} links={links}/>
            </TitledPaper>
        );
    }

    public componentWillReceiveProps(nextProps: IProps) {
        if (nextProps.projects !== this.props.projects || ((nextProps.agents || []).length !== (this.props.agents || []).length)) {
            this.setState(AgentsTopology.buildNodesAndLinks(nextProps));
        }
    }
};


interface IState {
    nodes: ITopologyNode[];
    links: Array<ITopologyLink<ITopologyNode>>;
};


interface IProps {
    agents: IAgent[];
    projects: IProject[];
};
