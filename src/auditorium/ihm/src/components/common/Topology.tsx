import React from 'react';
import * as D3 from 'd3';


const assets = {
    entity: process.env.PUBLIC_URL + '/assets/server.svg',
    network: process.env.PUBLIC_URL + '/assets/cloud.svg',
    project: process.env.PUBLIC_URL + '/assets/project.svg',
};


// Custom Hook
const useWindowSize = () => {
    const [windowSize, storeWindowSize] = React.useState<Partial<WindowSize>>({
        width: undefined,
        height: undefined,
    });

    React.useEffect(() => {
        const handleResize = () => {storeWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
        });};
        window.addEventListener('resize', handleResize);

        // Store initial size right away
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [/* Run only once */]);

    return windowSize;
};


const Topology: React.FC<Props> = (props) => {
    const {height, nodes, links, selectedNode, unselectNode} = props;
    const windowSize = useWindowSize();
    const svgRef = React.useRef<SVGSVGElement>(null);

    React.useEffect(() => {
        if (!svgRef.current) {
            return;
        }

        while (svgRef.current.children.length > 0) {
            svgRef.current.children[0].remove();
        }

        const height = svgRef.current.clientHeight;
        const width = svgRef.current.clientWidth;

        const simulation = D3.forceSimulation<TopologyNode>(nodes)
            .force("link", D3.forceLink<TopologyNode, TopologyLink>(links).id((d: TopologyNode) => d.id).strength((d: TopologyLink) => d.weight))
            .force("collide", D3.forceCollide<TopologyNode>(30))
            .force("center-x", D3.forceX<TopologyNode>(0))
            .force("center-y", D3.forceY<TopologyNode>(0))
            .on("tick", () => {
                link.attr("x1", (d: TopologyLink) => (d.source as TopologyNode).x as number)
                    .attr("y1", (d: TopologyLink) => (d.source as TopologyNode).y as number)
                    .attr("x2", (d: TopologyLink) => (d.target as TopologyNode).x as number)
                    .attr("y2", (d: TopologyLink) => (d.target as TopologyNode).y as number);
                node.attr("transform", (d: TopologyNode) => `translate(${d.x}, ${d.y})`);
            });

        const svg = D3.select(svgRef.current)
            .attr("viewBox", [-width / 2, -height / 2, width, height])
            .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

        const rect = svg.append("rect")
            .attr("fill", "white")
            .attr("height", height)
            .attr("width", width)
            .attr("x", -width / 2)
            .attr("y", -height / 2);

        const link = svg.append("g")
            .attr("class", "links")
            .selectAll(".link")
            .data<TopologyLink>(links)
            .enter()
            .append("line")
            .attr("stroke", "#AAA")
            .attr("stroke-width", (d: TopologyLink) => Math.sqrt(d.weight));

        const node = svg.append("g")
            .attr("class", "nodes")
            .selectAll(".node")
            .data<TopologyNode>(nodes)
            .enter()
            .append<SVGGElement>("g")
            .on("dblclick", (event, d: TopologyNode) => {d.fx = null; d.fy = null;})
            .call(D3.drag<SVGGElement, TopologyNode>()
                .on("start", (event) => {
                    if (!event.active) {
                        simulation.alphaTarget(0.3).restart();
                    }
                    event.subject.fx = event.subject.x;
                    event.subject.fy = event.subject.y;
                })
                .on("drag", (event) => {
                    event.subject.fx = event.x;
                    event.subject.fy = event.y;
                })
                .on("end", (event) => {
                    if (!event.active) {
                        simulation.alphaTarget(0);
                    }
                }));

        node.append("svg:image")
            .attr("height", 30)
            .attr("width", 30)
            .attr("x", -15)
            .attr("y", -15)
            .attr("xlink:href", (d: TopologyNode) => assets[d.type]);

        node.append("text")
            .text((d: TopologyNode) => d.name)
            .attr("cursor", "pointer")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .style("fill", (d: TopologyNode) => d.color ? d.color : (d.type === "network" ? "#757575" : "black"));

        if (selectedNode) {
            node.on("click", (event, d: TopologyNode) => selectedNode(d));
        }

        if (unselectNode) {
            rect.on("click", unselectNode);
        }

        return () => {simulation.stop();};
    }, [nodes, links, selectedNode, unselectNode, windowSize]);

    return <svg ref={svgRef} height={height} width="100%" />;
};


interface Props {
    height: number | string;
    nodes: TopologyNode[];
    links: TopologyLink[];
    selectedNode?: (node: TopologyNode) => void;
    unselectNode?: () => void;
}


interface WindowSize {
    width: number;
    height: number;
}


export interface TopologyNode extends D3.SimulationNodeDatum {
    name: string;
    id: string;
    type: "entity" | "network" | "project";
    color?: string;
}


export interface TopologyLink extends D3.SimulationLinkDatum<TopologyNode> {
    weight: number;
}


export default Topology;
