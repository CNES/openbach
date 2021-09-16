import {ILoginCredentials} from "../interfaces/login.interface";
import {IScenario} from "../interfaces/project.interface";
import {IFilesCount, IScenarioInstance} from "../interfaces/scenarioInstance.interface";
import {doApiCall, doApiJsonCall} from "./common";


export function deleteScenario(projectName: string, scenarioName: string): Promise<{project: string, scenario: string}> {
    return doApiCall("/project/" + projectName + "/scenario/" + scenarioName, "DELETE")
        .then((response: Response) => ({project: projectName, scenario: scenarioName}));
};


export function addScenario(projectName: string, scenarioName: string): Promise<IScenario> {
    const scenario: IScenario = {
        arguments: new Map<string, string>(),
        constants: new Map<string, string>(),
        description: "",
        name: scenarioName,
        openbach_functions: [],
    };

    return doApiCall("/project/" + projectName + "/scenario", "POST", scenario)
        .then((response: Response) => response.json<IScenario>());
};


export function importScenario(projectName: string, scenario: File): Promise<IScenario> {
    return doApiJsonCall("/project/" + projectName + "/scenario", scenario)
        .then((response: Response) => response.json<IScenario>());
};


export function updateScenario(projectName: string, scenario: IScenario): Promise<IScenario> {
    return doApiCall("/project/" + projectName + "/scenario/" + scenario.name, "PUT", scenario)
        .then((response: Response) => response.json<IScenario>());
};


export function favoriteScenario(projectName: string, scenarioName: string, favorite: boolean): Promise<ILoginCredentials> {
    const route = `/project/${projectName}/scenario/${scenarioName}/`;
    return doApiCall(route, "POST", {action: "favorite", favorite})
        .then((response: Response) => response.json<ILoginCredentials>());
};


export function launchScenario(projectName: string, scenarioName: string, date: Date, scenarioArguments: any): Promise<IScenarioInstance> {
    const route = "/project/" + projectName + "/scenario/" + scenarioName + "/scenario_instance";
    return doApiCall(route, "POST", {date, arguments: scenarioArguments}, true)
        .then((response: Response) => response.json<IScenarioInstance>());
};


export function getScenarioInstancesFromProject(projectName: string, offset: number): Promise<IScenarioInstance[]> {
    const url = `/project/${projectName}/scenario_instance?quiet&offset=${offset}&limit=15`;
    return doApiCall(url).then((response: Response) => response.json<IScenarioInstance[]>());
};


export function getFilteredScenarioInstancesFromProject(projectName: string, scenarioName: string, offset: number): Promise<IScenarioInstance[]> {
    const url = `/project/${projectName}/scenario/${scenarioName}/scenario_instance?quiet&offset=${offset}&limit=15`;
    return doApiCall(url).then((response: Response) => response.json<IScenarioInstance[]>());
};


export function getScenarioInstanceFromID(instanceID: number, verbose: boolean): Promise<IScenarioInstance> {
    return doApiCall("/scenario_instance/" + instanceID + (verbose ? "" : "?quiet"))
        .then((response: Response) => response.json<IScenarioInstance>());
};


export function stopScenarioInstance(scenarioInstance: IScenarioInstance): Promise<{}> {
    return doApiCall("/scenario_instance/" + scenarioInstance.scenario_instance_id, "POST", {})
        .then((response: Response) => response.bodyUsed ? response.json<{}>() : {});
};


export function deleteScenarioInstance(scenarioInstance: IScenarioInstance): Promise<{scenario_instance_id: number}> {
    const {scenario_instance_id} = scenarioInstance;
    return doApiCall("/scenario_instance/" + scenario_instance_id, "DELETE", {})
        .then((onSuccess) => ({scenario_instance_id}));
};


export function getScenarioInstanceFiles(instanceID: number): Promise<IFilesCount> {
    return doApiCall("/scenario_instance/" + instanceID + "?files_count")
        .then((response: Response) => response.json<IFilesCount>());
};
