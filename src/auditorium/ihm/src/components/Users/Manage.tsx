import * as React from "react";
import {connect} from "react-redux";

import List from "material-ui/List";
import RaisedButton from "material-ui/RaisedButton";

import {notify} from "../../actions/global";
import {getUsersList} from "../../actions/login";
import {deleteUsers, updateUsers} from "../../api/login";
import {ILoginCredentials, IProfilePermissions} from "../../interfaces/login.interface";
import PaddedContainer from "../common/PaddedContainer";
import UserManager from "./UserManager";


class Manage extends React.Component<IStoreProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = { permissions: [], pristine: true, usersToDelete: [] };
        this.applyChanges = this.applyChanges.bind(this);
        this.deleteUsers = this.deleteUsers.bind(this);
        this.updateUsersToDelete = this.updateUsersToDelete.bind(this);
    }

    public render() {
        const permissions = this.state.permissions.map((permission: IProfilePermissions, idx: number) => (
            <UserManager
                key={permission.login}
                permissions={permission}
                onUserActiveChange={this.changeUserActive.bind(this, idx)}
                onUserAdminChange={this.changeUserAdmin.bind(this, idx)}
                onDeleteSelected={this.updateUsersToDelete}
            />
        ));

        return (
            <PaddedContainer>
                <List>{permissions}</List>
                <div style={{margin: "16px", textAlign: "right"}}>
                    <RaisedButton
                        label="Delete Selected Users"
                        secondary={true}
                        disabled={this.state.usersToDelete.length === 0}
                        onClick={this.deleteUsers}
                        style={{margin: "16px"}}
                    />
                    <RaisedButton
                        label="Apply Modifications"
                        secondary={true}
                        disabled={this.state.pristine}
                        onClick={this.applyChanges}
                        style={{margin: "16px"}}
                    />
                </div>
            </PaddedContainer>
        );
    }

    public componentWillMount() {
        this.props.listUsers();
    }

    public componentWillReceiveProps(nextProps: IStoreProps & IDispatchProps) {
        if (nextProps.users && nextProps.users !== this.props.users) {
            const permissions: IProfilePermissions[] = nextProps.users.map((user: ILoginCredentials) => (
                { login: user.username, active: user.is_user, admin: user.is_admin }
            ));
            this.setState({ permissions, pristine: true });
        }
    }

    private changeUserActive(idx: number, checked: boolean) {
        this.state.permissions[idx].active = checked;
        this.setState({ pristine: false });
    }

    private changeUserAdmin(idx: number, checked: boolean) {
        this.state.permissions[idx].admin = checked;
        if (checked) {
            this.state.permissions[idx].active = true;
        }
        this.setState({ pristine: false });
    }

    private updateUsersToDelete(name: string, shouldDelete: boolean) {
        if (shouldDelete) {
            const {usersToDelete} = this.state;
            usersToDelete.push(name);
            this.setState({ usersToDelete });
        } else {
            const usersToDelete = this.state.usersToDelete.filter((username: string) => username !== name);
            this.setState({ usersToDelete });
        }
    }

    private applyChanges(event) {
        updateUsers(this.state.permissions).then((onSuccess) => {
            this.props.notify("Users successfully modified");
            this.props.listUsers();
        }).catch((error: Error) => this.props.notify("Users could not be modified: " + error.message));
    }

    private deleteUsers(event) {
        deleteUsers(this.state.usersToDelete).then((onSuccess) => {
            this.props.notify("Users successfully deleted");
            this.setState({ usersToDelete: [] });
            this.props.listUsers();
        }).catch((error: Error) => this.props.notify("Could not delete users: " + error.message));
    }
};


interface IState {
    permissions: IProfilePermissions[];
    pristine: boolean;
    usersToDelete: string[];
};


interface IStoreProps {
    users: ILoginCredentials[];
};


const mapStoreToProps = (store): IStoreProps => ({
    users: store.users,
});


interface IDispatchProps {
    listUsers: () => void;
    notify: (message: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    listUsers: () => dispatch(getUsersList()),
    notify: (message: string) => dispatch(notify(message)),
});


export default connect<IStoreProps, IDispatchProps, {}>(mapStoreToProps, mapDispatchToProps)(Manage);
