import * as React from "react";
import {FieldArray, FormProps, reduxForm} from "redux-form";

import FlatButton from "material-ui/FlatButton";

import {IJob} from "../../../interfaces/job.interface";
import {IScenarioForm} from "../../../interfaces/scenarioForm.interface";

import OpenbachFunctions from "./OpenbachFunctions";
import ScenarioArguments from "./ScenarioArguments";
import ScenarioHeader from "./ScenarioHeader";


const FormFieldArray = FieldArray as new () => FieldArray;


interface IStyles {
    header: React.CSSProperties;
    inArgs: React.CSSProperties;
    save: React.CSSProperties;
};


const styles: IStyles = {
    header: {
        margin: "0px 8px",
    },
    inArgs: {
        display: "inline-block",
        verticalAlign: "top",
        width: "50%",
    },
    save: {
        marginTop: "5px",
        textAlign: "center",
    },
};


class ScenarioForm extends React.Component<IProps & FormProps<{}, {}, {}>, {}> {
    public render() {
        const {scenario} = this.props;

        return (
            <form onSubmit={this.props.handleSubmit}>
                <ScenarioHeader
                    scenario={scenario.name}
                    scenarioArguments={scenario.arguments}
                    editing={this.props.dirty}
                    style={styles.header}
                />
                <div>
                    <FormFieldArray
                        name="arguments"
                        component={ScenarioArguments}
                        formName={this.props.form}
                        firstFieldName="Argument"
                        secondFieldName="Description"
                        style={styles.inArgs}
                    />
                    <FormFieldArray
                        name="constants"
                        component={ScenarioArguments}
                        formName={this.props.form}
                        firstFieldName="Constant"
                        secondFieldName="Value"
                        style={styles.inArgs}
                    />
                </div>
                <FormFieldArray
                    name="functions"
                    component={OpenbachFunctions}
                    formName={this.props.form}
                />
                <div style={styles.save}>
                    <FlatButton disabled={this.props.pristine} label="Save" type="submit" secondary={true} />
                </div>
            </form>
        );
    }

    public componentWillReceiveProps(nextProps: IProps) {
        if (this.props.scenario !== nextProps.scenario) {
            this.props.initialize(nextProps.scenario);
        }
    }
};


interface IProps {
    scenario: IScenarioForm;
    form: string;
    onSubmit: () => void;
    initialValues: IScenarioForm;
};


export default reduxForm({ form: "scenario" })(ScenarioForm);
