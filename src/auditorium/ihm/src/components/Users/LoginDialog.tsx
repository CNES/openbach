import * as React from "react";
import {FormProps, reduxForm} from "redux-form";

import ActionDialog from "../common/ActionDialog";
import {FormField, TextFormField} from "../common/Form";


class LoginDialog extends React.Component<IProps & FormProps<IFields, {}, {}>, {}> {
    constructor(props) {
        super(props);
        this.doAuthenticate = this.doAuthenticate.bind(this);
    }

    public render() {
        return (
            <ActionDialog
                title="Connect as"
                open={this.props.open}
                modal={false}
                cancel={{label: "Stay Anonymous", action: this.props.onRequestClose}}
                actions={[{label: "Authenticate", action: this.doAuthenticate}]}
            >
                <form onSubmit={this.doAuthenticate}>
                    <div><FormField name="username" component={TextFormField} fullWidth={true} text="Username" /></div>
                    <div><FormField name="password" component={TextFormField} fullWidth={true} text="Password" type="password" /></div>
                    <div style={{display: "none"}}><button type="submit" /></div>
                </form>
            </ActionDialog>
        );
    }

    private doAuthenticate(event?) {
        if (event) { event.preventDefault(); }
        const onSubmit = this.props.onLoginRequired;
        this.props.handleSubmit(onSubmit)(null);
        if (this.props.valid) {
            this.props.reset();
            this.props.onRequestClose();
        }
    }
};


interface IProps {
    open: boolean;
    onRequestClose: () => void;
    onLoginRequired: () => void;
};


interface IFields {
    username?: string;
    password?: string;
};


const validate = (values): IFields => {
    const errors: IFields = {};
    ["username", "password"].forEach((key: string) => {
        if (!values[key]) {
            errors[key] = "Field is required";
        }
    });
    return errors;
};


export default reduxForm({ form: "login", validate })(LoginDialog);
