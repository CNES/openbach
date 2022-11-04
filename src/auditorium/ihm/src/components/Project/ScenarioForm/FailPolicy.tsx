import * as React from "react";
import {connect} from "react-redux";

import MenuItem from "material-ui/MenuItem";
import {FormField, HiddenFormField, SelectFormField, TextFormField} from "../../common/Form";


const FAIL_POLICIES = [
    <MenuItem key={0} value="Fail" primaryText="Fail"/>,
    <MenuItem key={1} value="Ignore" primaryText="Ignore"/>,
    <MenuItem key={2} value="Retry" primaryText="Retry"/>,
];


class FailPolicy extends React.Component<IProps, {}> {
    public render() {
        const {parameterName, currentPolicy} = this.props;
        const hidden = currentPolicy !== "Retry";

        return (
            <div>
                <div>
                    <FormField
                        name={parameterName + ".policy"}
                        text="Fail Policy"
                        fullWidth={true}
                        component={SelectFormField}
                        children={FAIL_POLICIES}
                    />
                </div>
                <div>
                    <FormField
                        name={parameterName + ".retry"}
                        component={hidden ? HiddenFormField : TextFormField}
                        type="number"
                        text="Retry Limit"
                        fullWidth={true}
                        inputProps={{step: 0.1}}
                    />
                </div>
                <div>
                    <FormField
                        name={parameterName + ".delay"}
                        component={hidden ? HiddenFormField : TextFormField}
                        type="number"
                        text="Retry Delay"
                        fullWidth={true}
                    />
                </div>
            </div>
        );
    }
};


interface IProps {
    parameterName: string;
    currentPolicy?: string;
};


export default FailPolicy;
