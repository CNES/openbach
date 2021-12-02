import * as React from "react";

import MenuItem from "material-ui/MenuItem";

import {IScenario} from "../../../interfaces/project.interface";
import {FormField, SelectFormField, TextFormField} from "../../common/Form";
import TitledPaper from "../../common/TitledPaper";


export default class OpenbachFunctionStartScenarioInstance extends React.Component<IProps, {}> {
    public render() {
        const {index, scenarioList, launchedScenario} = this.props;

        const options = scenarioList.map((scenario: IScenario) =>
            <MenuItem key={scenario.name} value={scenario.name} primaryText={scenario.name}/>,
        );

        const args: Array<{ name: string; description: string; }> = [];
        if (launchedScenario) {
            for (const argumentName in launchedScenario.arguments) {
                if (launchedScenario.arguments.hasOwnProperty(argumentName)) {
                    args.push({ name: argumentName, description: launchedScenario.arguments[argumentName] });
                }
            }
        }
        const argumentsForm = args.map((arg: { name: string; description: string; }) => (
            <div key={arg.name} style={{margin: "0px 16px"}}>
                <FormField
                    name={`functions[${index}].scenarioArguments.${launchedScenario.name}.${arg.name}`}
                    text={arg.name}
                    component={TextFormField}
                    fullWidth={true}
                    hintText={arg.description}
                />
            </div>
        ));

        return (
            <TitledPaper level={3} title="Starting scenario">
                <div style={{margin: "0px 16px"}}><FormField
                    name={`functions[${index}].scenario`}
                    text="Scenario"
                    component={SelectFormField}
                    fullWidth={true}
                >
                    {options}
                </FormField></div>
                {argumentsForm}
            </TitledPaper>
        );
    }
};


interface IProps {
    index: number;
    launchedScenario: IScenario;
    scenarioList: IScenario[];
};
