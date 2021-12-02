import * as React from "react";
import {connect} from "react-redux";

import {updateUserCredentials} from "../../actions/login";
import {ILoginCredentials} from "../../interfaces/login.interface";
import Settings from "./Settings";


class SettingsWrapper extends React.Component<IStoreProps & IDispatchProps, {}> {
    public render() {
        const {email, last_name, first_name} = this.props.login;
        const {login, updateSettings} = this.props;

        return (
            <Settings
                login={login}
                defaultValues={{ lastName: last_name, firstName: first_name, email }}
                onUserUpdate={updateSettings}
            />
        );
    }
};


interface IStoreProps {
    login: ILoginCredentials;
};


const mapStoreToProps = (store): IStoreProps => ({
    login: store.login,
});


interface IDispatchProps {
    updateSettings: () => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    updateSettings: () => dispatch(updateUserCredentials()),
});


export default connect<IStoreProps, IDispatchProps, {}>(mapStoreToProps, mapDispatchToProps)(SettingsWrapper);
