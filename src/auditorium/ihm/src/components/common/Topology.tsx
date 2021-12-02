import * as D3 from "d3";
import {cloneDeep} from "lodash";
import * as React from "react";


const assets = {
      entity: require("../../assets/images/server.svg"),
      network: require("../../assets/images/cloud.svg"),
      project: require("../../assets/images/project.svg"),
};


export class Topology extends React.Component<ITopologyData, {}> {
    private chart: HTMLDivElement;
    private __force;

    constructor(props) {
        super(props);
        this.changeDimensions = this.changeDimensions.bind(this);
        this.setChartDOMNode = this.setChartDOMNode.bind(this);
    }

    public render() {
        const style = {height: "100%", ...this.props.style};
        return <div style={style} ref={this.setChartDOMNode} />;
    }

    public componentDidMount() {
        this.redraw(cloneDeep(this.props));
        this.changeDimensions();
        window.addEventListener("resize", this.changeDimensions, false);
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.changeDimensions);
    }

    public componentWillReceiveProps(nextProps: ITopologyData) {
        if ((nextProps.nodes && nextProps.nodes !== this.props.nodes) || (nextProps.links && nextProps.links !== this.props.links)) {
            this.redraw(cloneDeep(nextProps));
        }
    }

    private setChartDOMNode(chart: HTMLDivElement) {
        this.chart = chart;
    }

    private changeDimensions() {
        if (this.chart && this.chart.children.length > 0) {
            const svg = this.chart.children[0];
            const {offsetWidth, offsetHeight} = this.chart;
            svg.setAttribute("width", String(offsetWidth));
            svg.setAttribute("height", String(offsetHeight));
            this.__force.size([offsetWidth, offsetHeight]).start();
        }
    }

    private redraw(topologyData: ITopologyData) {
        while (this.chart.children.length > 0) {
            this.chart.children[0].remove();
        }

        const height = this.chart.clientHeight;
        const width = this.chart.clientWidth;

        const svg = D3.select(this.chart).append("svg").attr({ height, width });
        const rect = svg.append("rect").attr({
            fill: "white",
            height,
            width,
            x: 0,
            y: 0,
        });

        this.__force = D3.layout.force()
            .linkDistance(100)
            .charge(-400)
            .size([width, height]);

        function dblclick(d) {
            D3.select(this).classed("fixed", d.fixed = false);
        }

        function dragstart(d) {
            D3.select(this).classed("fixed", d.fixed = true);
        }

        this.__force
            .nodes(topologyData.nodes)
            .links(topologyData.links)
            .start();
        this.__force.drag().on("dragstart", dragstart);

        const link = svg.selectAll(".link")
            .data(topologyData.links)
            .enter().append("line")
            .attr({
                "stroke": "#AAA",
                "stroke-width": (d) => Math.sqrt(d.weight),
            });

        const node = svg.selectAll(".node")
            .data(topologyData.nodes)
            .enter().append("g")
            .on("dblclick", dblclick)
            .call(this.__force.drag);

        const server = node.append("svg:image");
        server.attr({
            "height": "30",
            "width": "30",
            "x": "-15",
            "xlink:href": (d: ITopologyNode) => assets[d.type],
            "y": "-15",
        });

        const text = node.append("text");
        text.text((d: ITopologyNode) => d.name)
            .attr({
                cursor: "pointer",
                dx: "12",
                dy: ".35em",
                fill: (d: ITopologyNode) => (
                    d.color ? d.color : (d.type === "network" ? "#757575" : "black")
                ),
            });

        if (topologyData.selectedNode) {
            text.on("click", topologyData.selectedNode);
            server.on("click", topologyData.selectedNode);
        }

        if (topologyData.unselectNode) {
            rect.on("click", topologyData.unselectNode);
        }

        this.__force.on("tick", () => {
            link.attr({
                x1: (d) => d.source.x,
                x2: (d) => d.target.x,
                y1: (d) => d.source.y,
                y2: (d) => d.target.y,
            });

            node.attr("transform", (d) => `translate(${d.x},${d.y})`);
        });
    }
};


interface ITopologyData {
    nodes: ITopologyNode[];
    links: Array<ITopologyLink<ITopologyNode>>;
    selectedNode?: (node: ITopologyNode) => void;
    unselectNode?: () => void;
    style?: React.CSSProperties;
};


export interface ITopologyNode extends D3.layout.force.Node {
    name: string;
    nodeID: string;
    type: "entity" | "network" | "project";
    color?: string;
};


export interface ITopologyLink<T extends D3.layout.force.Node> extends D3.layout.force.Link<T> {
    weight: number;
};


export default Topology;
