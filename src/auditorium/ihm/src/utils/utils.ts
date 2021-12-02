import {IAgent} from "../interfaces/agent.interface";
import {IOpenbachFunctionForm} from "../interfaces/scenarioForm.interface";
import {IOpenbachFunctionInstance} from "../interfaces/scenarioInstance.interface";


type TOpenbachFunction = IOpenbachFunctionForm | IOpenbachFunctionInstance;


export function isPromise(value) {
    if (value !== null && typeof value === "object") {
        return value.promise && typeof value.promise.then === "function";
    }
}


export const isNumber = (value): value is number => value - 0 === value;


export const scientificNotation = (value): string => isNumber(value) ? value.toExponential(2) : value;


export const idToLabel = (openbachFunctionId: number, functions: TOpenbachFunction[]): string => {
    const found = functions.find((f: TOpenbachFunction) => f.id === openbachFunctionId);
    return found ? found.label : String(openbachFunctionId);
};


export const titleFromLabel = (title: string, openbachFunction: TOpenbachFunction): string => {
    if (openbachFunction.label) {
        return `[${openbachFunction.label}] ${title}`;
    } else {
        return title;
    }
};


export const constructAvailableAgentsItems = (project: string, agents: IAgent[], selected?: string) => {
    let selectedIndex = null;
    const reserved = [];
    const choices = [];

    agents.forEach((agent: IAgent, index: number) => {
        if (!agent.project || agent.address === selected) {
            const id = String(index);
            if (agent.reserved === project) {
                reserved.push([agent.name, id]);
            } else if (!agent.reserved) {
                choices.push([agent.name, id]);
            }
            if (agent.address === selected) {
                selectedIndex = id;
            }
        }
    });

    return [reserved, choices, selectedIndex];
};
