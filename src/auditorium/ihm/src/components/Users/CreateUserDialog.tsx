import * as React from "react";
import {browserHistory} from "react-router";
import {FormProps, reduxForm} from "redux-form";

import ActionDialog from "../common/ActionDialog";
import {FormField, TextFormField} from "../common/Form";


class CreateUserDialog extends React.Component<IProps & FormProps<IFields, {}, {}>, {}> {
    constructor(props) {
        super(props);
        this.doCreateUser = this.doCreateUser.bind(this);
    }

    public render() {
        return (
            <ActionDialog
                title="Create New User"
                open={this.props.open}
                modal={false}
                auto={true}
                cancel={{label: "Cancel", action: this.props.onRequestClose}}
                actions={[{label: "Create User", action: this.doCreateUser}]}
            >
                <form>
                    <div><p>Required fields</p></div>
                    <div><FormField
                        name="username"
                        component={TextFormField}
                        fullWidth={true}
                        text="Username"
                    /></div>
                    <div><FormField
                        name="password"
                        component={TextFormField}
                        fullWidth={true}
                        text="Password"
                        type="password"
                    /></div>
                    <div><FormField
                        name="password2"
                        component={TextFormField}
                        fullWidth={true}
                        text="Confirm Password"
                        type="password"
                    /></div>
                    <div><p>Optional fields</p></div>
                    <div><FormField
                        name="email"
                        component={TextFormField}
                        fullWidth={true}
                        text="Email"
                    /></div>
                    <div><FormField
                        name="firstName"
                        component={TextFormField}
                        fullWidth={true}
                        text="First Name"
                    /></div>
                    <div><FormField
                        name="lastName"
                        component={TextFormField}
                        fullWidth={true}
                        text="Last Name"
                    /></div>
                </form>
            </ActionDialog>
        );
    }

    private doCreateUser() {
        const onSubmit = this.props.onNewUserRequired;
        this.props.handleSubmit(onSubmit)(null);
        if (this.props.valid) {
            this.props.reset();
            this.props.onRequestClose();
            browserHistory.push("/app/settings");
        }
    }
};


interface IProps {
    open: boolean;
    onRequestClose: () => void;
    onNewUserRequired: () => void;
};


interface IFields {
    username?: string;
    password?: string;
    password2?: string;
    email?: string;
    lastName?: string;
    firstName?: string;
};


const validate = (values): IFields => {
    const errors: IFields = {};
    if (!values.username) {
        errors.username = "Field is required";
    } else if (values.username.length > 30) {
        errors.username = "Length is limited to 30 characters";
    }
    if (!values.password) {
        errors.password = "Field is required";
    }
    if (values.password !== values.password2) {
        errors.password2 = "The two passwords do not match";
    }
    if (values.firstName && values.firstName.length > 30) {
        errors.firstName = "Length is limited to 30 characters";
    }
    if (values.lastName && values.lastName.length > 30) {
        errors.lastName = "Length is limited to 30 characters";
    }
    return errors;
};


export default reduxForm({ form: "newuser", validate })(CreateUserDialog);
