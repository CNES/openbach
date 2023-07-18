import React from 'react';

import Topology from '../common/Topology';

import {useSelector} from '../../redux';
import type {IAgent, IEntity, IProject} from '../../utils/interfaces';
import type {TopologyNode, TopologyLink} from '../common/Topology';


const AgentsTopology: React.FC<Props> = (props) => {
    const agents = useSelector((state) => state.openbach.agents);
    const projects = useSelector((state) => state.openbach.projects);

    if (!projects) {
        return <h1>Fetching Projects, please wait!</h1>;
    }

    const projectsNodes = Object.fromEntries(projects.map((p: IProject): [string, TopologyNode] => (
        [p.name, {name: p.name, id: p.name, type: 'project'}]
    )));

    const links: TopologyLink[] = [];
    const nodes = (agents || []).map((agent: IAgent) => {
        const project = projects.find((p: IProject) => {
            const entity = p.entity.find((e: IEntity) => e.agent && e.agent.address === agent.address);
            return entity !== undefined;
        });

        const node: TopologyNode = {name: agent.name, id: agent.name, type: "entity"};
        if (project) {
            node.color = "#757575";
            links.push({source: node, target: projectsNodes[project.name], weight: 3});
        }
        return node;
    });

    return (
        <React.Fragment>
            <h1>Projects Topology</h1>
            <Topology height="500px" nodes={nodes.concat(Object.values(projectsNodes))} links={links} />
        </React.Fragment>
    );
};


interface Props {
}


export default AgentsTopology;
