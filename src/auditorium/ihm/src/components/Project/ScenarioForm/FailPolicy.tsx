import * as React from "react";

import MenuItem from "material-ui/MenuItem";
import {FormField, HiddenFormField, SelectFormField, TextFormField} from "../../common/Form";


const FAIL_POLICIES = [
    <MenuItem key=0 value="Fail" primaryText="Fail"/>,
    <MenuItem key=1 value="Ignore" primaryText="Ignore"/>,
    <MenuItem key=2 value="Retry" primaryText="Retry"/>,
];


export default class FailPolicy extends React.Component<IProps, {}> {
    public render() {
        return (
            <div>
                <div>
                    <FormField
                        name={this.props.formName + ".policy"}
                        text="Fail Policy"
                        fullWidth={true}
                        component={SelectFormField}
                        children={FAIL_POLICIES}
                    />
                </div>
                <div>
                    <FormField
                        name={this.props.formName + ".retry"}
                        component={TextFormField}
                        type="number"
                        text="Retry Limit"
                        fullWidth={true}
                    />
                </div>
                <div>
                    <FormField
                        name={this.props.formName + ".delay"}
                        component={TextFormField}
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
    formName: string;
};
