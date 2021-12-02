import * as React from "react";

import MenuItem from "material-ui/MenuItem";

import {IOpenbachFunctionForm} from "../../../interfaces/scenarioForm.interface";
import {FormField, SelectFormField} from "../../common/Form";
import TitledPaper from "../../common/TitledPaper";


export default class OpenbachFunctionStopScenarioInstance extends React.Component<IProps, {}> {
    public render() {
        const options = this.props.otherFunctions.filter(
            (openbachFunction) => openbachFunction.kind === "start_scenario_instance",
        ).map(
            (openbachFunction: IOpenbachFunctionForm) => (
                <MenuItem
                    key={openbachFunction.id.toString()}
                    value={openbachFunction.id}
                    primaryText={openbachFunction.label}
                />
            ),
        );

        return (
            <TitledPaper level={3} title="Stopping scenarios">
                <div style={{margin: "0px 16px"}}><FormField
                    name={`functions[${this.props.index}].scenarioID`}
                    text="Scenario"
                    component={SelectFormField}
                    fullWidth={true}
                >
                    {options}
                </FormField></div>
            </TitledPaper>
        );
    }
};


interface IProps {
    index: number;
    otherFunctions: IOpenbachFunctionForm[];
};
