import * as React from "react";

import List from "material-ui/List";

import {IOpenbachFunctionForm} from "../../../interfaces/scenarioForm.interface";
import {ReduxFormMultiSelectField, SelectFormInput} from "../../common/Form";
import TitledPaper from "../../common/TitledPaper";
import OpenbachFunctionConditionSelector from "./OpenbachFunctionConditionSelector";


const styles = {
    condition: {
        margin: "0px 2.5%",
        width: "95%",
    },
    selected: {
        display: "inline-block",
        margin: "0px 2.5%",
        verticalAlign: "top",
        width: "45%",
    },
};


export default class OpenbachFunctionCondition extends React.Component<IProps, {}> {
    public render() {
        const references: Array<{label: string, value: string}> = this.props.otherFunctions.map((openbachFunction: IOpenbachFunctionForm) => ({
            label: openbachFunction.label,
            value: openbachFunction.id.toString(),
        }));

        return (
            <TitledPaper level={3} title={this.props.title}>
                <TitledPaper level={4} title="Condition" style={styles.condition}>
                    <OpenbachFunctionConditionSelector
                        fieldName={`functions[${this.props.index}].condition`}
                        condition={this.props.openbachFunction.condition}
                    />
                </TitledPaper>
                <TitledPaper level={4} title={this.props.textTrue} style={styles.selected}>
                    <ReduxFormMultiSelectField
                        name={`functions[${this.props.index}].conditionTrue`}
                        component={SelectFormInput}
                        multi={true}
                        autosize={true}
                        clearable={false}
                        options={references}
                    />
                </TitledPaper>
                <TitledPaper level={4} title={this.props.textFalse} style={styles.selected}>
                    <ReduxFormMultiSelectField
                        name={`functions[${this.props.index}].conditionFalse`}
                        component={SelectFormInput}
                        multi={true}
                        autosize={true}
                        clearable={false}
                        options={references}
                    />
                </TitledPaper>
            </TitledPaper>
        );
    }
};


interface IProps {
    index: number;
    openbachFunction: IOpenbachFunctionForm;
    otherFunctions: IOpenbachFunctionForm[];
    textFalse: string;
    textTrue: string;
    title: string;
};
