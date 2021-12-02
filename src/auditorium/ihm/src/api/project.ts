import {IAgent} from "../interfaces/agent.interface";
import {IEntity, INetwork, IProject} from "../interfaces/project.interface";
import {doApiCall, doApiJsonCall} from "./common";


export function get(): Promise<IProject[]> {
    return doApiCall("/project")
        .then((response: Response) => response.json<IProject[]>());
};


export function deleteProject(projectName: string): Promise<Response> {
    return doApiCall("/project/" + projectName, "DELETE");
};


export function getProject(projectName: string): Promise<IProject> {
    return doApiCall("/project/" + projectName)
        .then((response: Response) => response.json<IProject>());
};


export function addProject(projectName: string, projectDescription: string, owners: string[]): Promise<IProject> {
    const project: IProject = {
        description: projectDescription,
        entity: [],
        hidden_network: [],
        name: projectName,
        network: [],
        scenario: [],
        owners,
    };

    return doApiCall("/project", "POST", project)
        .then((response: Response) => response.json<IProject>());
};


export function importProject(project: File, ignoreTopology: boolean): Promise<IProject> {
    return doApiJsonCall(ignoreTopology ? "/project?ignore_topology" : "/project", project)
        .then((response: Response) => response.json<IProject>());
};


export function changeOwnersOfProject(project: IProject, owners: string[]): Promise<IProject> {
    const {description, entity, name, network, scenario, hidden_network} = project;
    const newProject: IProject = {
        description,
        entity,
        hidden_network,
        name,
        network,
        owners,
        scenario,
    };

    return doApiCall("/project/" + name, "PUT", newProject)
        .then((response: Response) => response.json<IProject>());
};


export function addEntityToProject(project: IProject, name: string, description: string, agent: IAgent): Promise<IProject> {
    const newEntity: IEntity = { name, description, agent };

    return doApiCall("/project/" + project.name + "/entity/", "POST", newEntity)
        .then((response: Response) => response.json<IProject>());
};


export function removeEntityFromProject(project: IProject, entity: IEntity): Promise<IProject> {
    return doApiCall("/project/" + project.name + "/entity/" + entity.name, "DELETE")
        .then((response: Response) => response.json<IProject>());
};


export function changeAgentOfEntity(project: IProject, entity: IEntity, newAgent: IAgent): Promise<IProject> {
    const {name, description, networks} = entity;
    const newEntity: IEntity = { name, description, networks, agent: newAgent };

    return doApiCall(`/project/${project.name}/entity/${name}/`, "PUT", newEntity)
        .then((response: Response) => response.json<IProject>());
};


export function changeHiddenNetwork(project: IProject, newHiddenNetworks: string[], removedHiddenNetworks: string[]): Promise<IProject> {
    const {description, entity, name, network, scenario, hidden_network, owners} = project;
    const newHidden: string[] = newHiddenNetworks.map((network_name: string) => network_name);
    hidden_network.forEach((network_name: string) => {
        if (removedHiddenNetworks.indexOf(network_name) < 0) {
            newHidden.push(network_name);
        }
    });
    const newProject: IProject = {
        hidden_network: newHidden,
        description,
        entity,
        name,
        network,
        owners,
        scenario,
    };
    return doApiCall("/project/" + name, "PUT", newProject)
        .then((response: Response) => response.json<IProject>());
};


export function refreshTopology(project: IProject, newName?: INetwork): Promise<IProject> {
    const payload = newName ? {networks: [newName]} : {};
    return doApiCall("/project/" + project.name, "POST", payload)
        .then((response: Response) => response.json<IProject>());
};
