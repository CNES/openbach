import * as React from "react";
import {connect} from "react-redux";

import IconButton from "material-ui/IconButton";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";
import RaisedButton from "material-ui/RaisedButton";

import {createNewUser, getUserCredentials, logIn, logOut} from "../../actions/login";
import {ILoginCredentials} from "../../interfaces/login.interface";
import {CloseMenuIcon, ExpandMenuIcon, muiTheme} from "../../utils/theme";
import CreateUserDialog from "./CreateUserDialog";
import LoginDialog from "./LoginDialog";


const styles: React.CSSProperties = {
    marginRight: "16px",
};


class MainMenu extends React.Component<IProps & IStoreProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = { open: false, dialogOpen: false, dialogIsCreate: false };
        this.handleClick = this.handleClick.bind(this);
        this.handleOpen = this.handleOpen.bind(this);
        this.closeForm = this.closeForm.bind(this);
    }

    public componentDidMount() {
        this.props.getUser();
    }

    public render() {
        const icon = this.state.open ? (
            <CloseMenuIcon color={muiTheme.toolbar.iconColor} />
        ) : (
            <ExpandMenuIcon color={muiTheme.toolbar.iconColor} />
        );

        const style = this.state.open ? {secondary: true} : {primary: true};
        const {username, is_user, is_admin} = this.props.login;

        const button = (
            <RaisedButton
                label={username ? username : "Anonymous"}
                labelPosition="before"
                icon={icon}
                {...style}
                style={styles}
            />
        );

        let menu = null;
        if (!username) {
            menu = this.buildAnonymousMenu();
        } else if (!is_user) {
            menu = this.buildUntrustedMenu();
        } else if (!is_admin) {
            menu = this.buildUserMenu();
        } else {
            menu = this.buildAdminMenu();
        }

        const dialog = this.state.dialogIsCreate ? (
            <CreateUserDialog
                open={this.state.dialogOpen}
                onRequestClose={this.closeForm}
                onNewUserRequired={this.props.create}
            />
        ) : (
            <LoginDialog
                open={this.state.dialogOpen}
                onRequestClose={this.closeForm}
                onLoginRequired={this.props.authenticate}
            />
        );

        return (
            <div>
                <IconMenu
                    open={this.state.open}
                    iconButtonElement={button}
                    onChange={this.handleClick}
                    onRequestChange={this.handleOpen}
                    anchorOrigin={{horizontal: "left", vertical: "bottom"}}
                    targetOrigin={{horizontal: "left", vertical: "top"}}
                >
                    {menu}
                </IconMenu>
                {dialog}
            </div>
        );
    }

    public componentWillReceiveProps(nextProps: IProps & IStoreProps & IDispatchProps) {
        if (nextProps.firstTime && !nextProps.login.username) {
            this.setState({ dialogOpen: true, dialogIsCreate: false });
        }
    }

    private buildAnonymousMenu() {
        return [
            <MenuItem key="login" value="login" primaryText="Authenticate" />,
            <MenuItem key="create" value="create" primaryText="Create User" />,
        ];
    }

    private buildUntrustedMenu() {
        return [
            <MenuItem key="settings" value="/app/settings" primaryText="User Settings" />,
            <MenuItem key="logout" value="logout" primaryText="Disconnect" />,
        ];
    }

    private buildUserMenu() {
        return [
            <MenuItem key="agents" value="/app/admin/agents" primaryText="Agents" />,
            <MenuItem key="jobs" value="/app/admin/jobs" primaryText="Jobs" />,
            <MenuItem key="settings" value="/app/settings" primaryText="User Settings" />,
            <MenuItem key="logout" value="logout" primaryText="Disconnect" />,
        ];
    }

    private buildAdminMenu() {
        return [
            <MenuItem key="agents" value="/app/admin/agents" primaryText="Agents" />,
            <MenuItem key="jobs" value="/app/admin/jobs" primaryText="Jobs" />,
            <MenuItem key="manage" value="/app/admin/users" primaryText="Manage Users" />,
            <MenuItem key="settings" value="/app/settings" primaryText="User Settings" />,
            <MenuItem key="logout" value="logout" primaryText="Disconnect" />,
        ];
    }

    private handleClick(event, value: string) {
        switch (value) {
            case "login":
                this.setState({ dialogOpen: true, dialogIsCreate: false });
                break;
            case "create":
                this.setState({ dialogOpen: true, dialogIsCreate: true });
                break;
            case "logout":
                this.props.deAuthenticate();
                this.props.onMenuSelected("/app");
                break;
            default:
                this.props.onMenuSelected(value);
                break;
        }
    }

    private handleOpen(open: boolean) {
        this.setState({ open });
    }

    private closeForm() {
        this.setState({ dialogOpen: false });
    }
};


interface IState {
    open: boolean;
    dialogOpen: boolean;
    dialogIsCreate: boolean;
};


interface IProps {
    firstTime: boolean;
    onMenuSelected: (value: string) => void;
};


interface IStoreProps {
    login: ILoginCredentials;
};


const mapStoreToProps = (store): IStoreProps => ({
    login: store.login,
});


interface IDispatchProps {
    create: () => void;
    getUser: () => void;
    authenticate: () => void;
    deAuthenticate: () => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    authenticate: () => dispatch(logIn()),
    create: () => dispatch(createNewUser()),
    deAuthenticate: () => dispatch(logOut()),
    getUser: () => dispatch(getUserCredentials()),
});


export default connect<IStoreProps, IDispatchProps, IProps>(mapStoreToProps, mapDispatchToProps)(MainMenu);
