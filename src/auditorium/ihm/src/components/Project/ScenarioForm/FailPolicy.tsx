import * as React from "react";

import MenuItem from "material-ui/MenuItem";
import {FormField, HiddenFormField, SelectFormField, TextFormField} from "../../common/Form";


const FAIL_POLICIES = [
    <MenuItem key=0 value="Fail" primaryText="Fail"/>,
    <MenuItem key=1 value="Ignore" primaryText="Ignore"/>,
    <MenuItem key=2 value="Retry" primaryText="Retry"/>,
];


class FailPolicy extends React.Component<IProps & IStoreProps, {}> {
    public render() {
        const {formName, reduxForm} = this.props;
        let hidden: boolean = true;
        let form = reduxForm;
        formName.split(".").forEach((part: string) => {if (form) { form = form[part]; } });
        if (form) {
            hidden = form.values.policy === "Retry";
        }

        return (
            <div>
                <div>
                    <FormField
                        name={formName + ".policy"}
                        text="Fail Policy"
                        fullWidth={true}
                        component={SelectFormField}
                        children={FAIL_POLICIES}
                    />
                </div>
                <div>
                    <FormField
                        name={formName + ".retry"}
                        component={hidden ? HiddenFormField : TextFormField}
                        type="number"
                        text="Retry Limit"
                        fullWidth={true}
                        inputProps={{step: 0.1}}
                    />
                </div>
                <div>
                    <FormField
                        name={formName + ".delay"}
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
    formName: string;
};


interface IStoreProps {
    reduxForm: any;
};


const mapStoreToProps = (store): IStoreProps => ({
    reduxForm: store.form,
});


export default connect<IStoreProps, {}, IProps>(mapStoreToProps)(FailPolicy);
