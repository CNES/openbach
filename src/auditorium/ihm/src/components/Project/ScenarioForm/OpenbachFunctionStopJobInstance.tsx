import * as React from "react";

import {IOpenbachFunctionForm} from "../../../interfaces/scenarioForm.interface";
import {ReduxFormMultiSelectField, SelectFormInput} from "../../common/Form";
import TitledPaper from "../../common/TitledPaper";


export default class OpenbachFunctionStopJobInstance extends React.Component<IProps, {}> {
    public render() {
        const references: Array<{label: string, value: number}> = this.props.otherFunctions.filter(
            (openbachFunction) => openbachFunction.kind === "start_job_instance",
        ).map(
            (openbachFunction: IOpenbachFunctionForm) => ({
                label: openbachFunction.label,
                value: openbachFunction.id,
            }),
        );

        return (
            <TitledPaper level={3} title="Stopping jobs">
                <div style={{margin: "0px 16px"}}><ReduxFormMultiSelectField
                    name={`functions[${this.props.index}].jobs`}
                    component={SelectFormInput}
                    multi={true}
                    autosize={true}
                    clearable={false}
                    options={references}
                /></div>
            </TitledPaper>
        );
    }
};


interface IProps {
    index: number;
    otherFunctions: IOpenbachFunctionForm[];
};
