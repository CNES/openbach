import * as React from "react";
import {FormProps, reduxForm} from "redux-form";

import RaisedButton from "material-ui/RaisedButton";
import {grey500, red500} from "material-ui/styles/colors";

import {ILoginCredentials} from "../../interfaces/login.interface";
import {FormField, TextFormField} from "../common/Form";
import PaddedContainer from "../common/PaddedContainer";


class Settings extends React.Component<IProps & FormProps<IFields, {}, {}>, {}> {
    constructor(props) {
        super(props);
        this.applyChanges = this.applyChanges.bind(this);
    }

    public render() {
        const {username, name, is_user} = this.props.login;
        let title = "User settings for " + username;
        if (name) {
            title = title + " (" + name + ")";
        }

        return (
            <PaddedContainer>
                <h1>{title}</h1>
                {is_user ? <div /> : <p style={{color: red500}}>Your account is not activated, please contact your administrator</p>}
                <form>
                    <h2 style={{marginTop: "32px"}}>Profile</h2>
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
                    <h2 style={{marginTop: "32px"}}>Change password</h2>
                    <p style={{color: grey500}}>Fill in the following fields only if you want to change your password</p>
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
                </form>
                <div style={{margin: "16px", textAlign: "right"}}>
                    <RaisedButton
                        label="Modify User Settings"
                        secondary={true}
                        disabled={this.props.pristine}
                        onClick={this.applyChanges}
                        style={{margin: "16px"}}
                    />
                </div>
            </PaddedContainer>
        );
    }

    public componentWillMount() {
        this.doInitialize(this.props.defaultValues);
    }

    public componentWillReceiveProps(nextProps: IProps) {
        const {email, firstName, lastName} = this.props.defaultValues;
        if (email !== nextProps.defaultValues.email ||
            firstName !== nextProps.defaultValues.firstName ||
            lastName !== nextProps.defaultValues.lastName
        ) {
            this.doInitialize(nextProps.defaultValues);
        }
    }

    private doInitialize(defaultValues) {
        const fields: IFields = {};
        for (const name in defaultValues) {
            if (defaultValues.hasOwnProperty(name)) {
                const value = defaultValues[name];
                if (value !== undefined) {
                    fields[name] = value.toString();
                }
            }
        }
        this.props.initialize(fields);
    }

    private applyChanges(event) {
        const onSubmit = this.props.onUserUpdate;
        this.props.handleSubmit(onSubmit)(null);
        this.props.reset();
    }
};


interface IProps {
    login: ILoginCredentials;
    onUserUpdate: () => void;
    defaultValues: {
        email: string;
        firstName: string;
        lastName: string;
    };
};


interface IFields {
    password?: string;
    password2?: string;
    email?: string;
    lastName?: string;
    firstName?: string;
};


const validate = (values): IFields => {
    const errors: IFields = {};
    if (values.password && values.password !== values.password2) {
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


export default reduxForm({ form: "settingsuser", validate })(Settings);
