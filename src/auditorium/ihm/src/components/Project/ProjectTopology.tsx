import * as React from "react";

import {IEntity, INetwork, IProject} from "../../interfaces/project.interface";

import {IAgent} from "../../interfaces/agent.interface";
import PaddedContainer from "../common/PaddedContainer";
import TitledPaper from "../common/TitledPaper";
import {ITopologyLink, ITopologyNode, Topology} from "../common/Topology";


interface IStyle {
    entity: React.CSSProperties;
    filler: React.CSSProperties;
    topology: React.CSSProperties;
};


const styles: IStyle = {
    entity: {
        display: "inline-block",
        verticalAlign: "top",
        width: "35%",
    },
    filler: {
        borderBottom: "1px dashed rgba(0, 0, 0, 0.27)",
    },
    topology: {
        display: "inline-block",
        height: "600px",
        verticalAlign: "top",
        width: "65%",
    },
};


export default class ProjectTopology extends React.Component<IProps, IState> {
    private static buildNodesAndLinks(props: IProps): { nodes: ITopologyNode[]; links: Array<ITopologyLink<ITopologyNode>>; } {
        const nodes: ITopologyNode[] = [];
        const links: Array<ITopologyLink<ITopologyNode>> = [];

        for (const network of props.project.network) {
            const networkTopology: ITopologyNode = {
                name: network.name,
                nodeID: network.address,
                type: "network",
            };
            if (network.address.startsWith("imported:")) {
                networkTopology.color = "tomato";
            }
            nodes.push(networkTopology);
        }

        for (const entity of props.project.entity) {
            const entityTopology: ITopologyNode = {
                color: entity.agent ? "green" : "black",
                name: entity.name,
                nodeID: entity.name,
                type: "entity",
            };
            nodes.push(entityTopology);

            for (const network of entity.networks) {
               const target = nodes.find((node) => node.nodeID === network.address && node.type === "network");
               links.push({
                    source: entityTopology,
                    target,
                    weight: 3,
              });
            }
        }

        return { nodes, links };
    }

    constructor(props) {
        super(props);
        this.state = ProjectTopology.buildNodesAndLinks(props);
    }

    public render() {
        return (
            <Topology
                nodes={this.state.nodes}
                links={this.state.links}
                selectedNode={this.props.handleSelectedNode}
                unselectNode={this.props.handleUnselectNode}
                style={this.props.style}
            />
        );
    }

    public componentWillReceiveProps(nextProps: IProps) {
        if (nextProps.project && nextProps.project !== this.props.project) {
            this.setState(ProjectTopology.buildNodesAndLinks(nextProps));
        }
    }
};


interface IState {
    nodes: ITopologyNode[];
    links: Array<ITopologyLink<ITopologyNode>>;
};


interface IProps {
    project: IProject;
    handleSelectedNode: (node: ITopologyNode) => void;
    handleUnselectNode: () => void;
    style?: React.CSSProperties;
};
