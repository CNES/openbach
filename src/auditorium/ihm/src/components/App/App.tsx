import * as React from "react";
import {connect} from "react-redux";
import {browserHistory} from "react-router";

import Divider from "material-ui/Divider";
import MenuItem from "material-ui/MenuItem";
import {Toolbar, ToolbarGroup, ToolbarSeparator} from "material-ui/Toolbar";

import {getVersion} from "../../api/common";
import {ILoginCredentials} from "../../interfaces/login.interface";
import UserMenu from "../Users/UserMenu";
import LogsBadge from "./LogsBadge";
import MainButton from "./MainButton";
import MainLogo from "./MainLogo";
import MainMenu from "./MainMenu";
import MainSnackbar from "./MainSnackbar";
import MainTitle from "./MainTitle";
import Separator from "./Separator";


const wikiURL = "https://github.com/CNES/openbach";


class App extends React.Component<IStoreProps, IState> {
    constructor(props) {
        super(props);
        this.state = { firstTime: true, openbachVersion: "Querying version" };
        this.openLink = this.openLink.bind(this);
    }

    public render() {
        return (
            <div key={this.props.login.username}>
                <Toolbar>
                    <ToolbarGroup firstChild={true} style={{paddingLeft: "5%"}}>
                        <MainLogo src={require("../../assets/images/openbach.png")} />
                        <MainTitle />
                    </ToolbarGroup>
                    <ToolbarGroup lastChild={true} style={{paddingRight: "5%"}}>
                        <MainButton
                            label="Logs"
                            link="/kibana"
                            onClick={this.openLink}
                        />
                        <MainButton
                            label="Statistics"
                            link="/chronograf/"
                            onClick={this.openLink}
                        />
                        <Separator />
                        <MainMenu label="Help" onMenuSelected={this.openLink}>
                            <MenuItem value={wikiURL} primaryText="Wiki" />
                            <MenuItem value="/app/glossary" primaryText="Glossary" />
                            <MenuItem value="/app/icons" primaryText="Scenario Instance Icons" />
                            <Divider />
                            <MenuItem primaryText={this.state.openbachVersion} disabled={true} />
                        </MainMenu>
                        <Separator />
                        <LogsBadge />
                        <Separator />
                        <UserMenu firstTime={this.state.firstTime} onMenuSelected={this.openLink} />
                    </ToolbarGroup>
                </Toolbar>
                {this.props.children}
                <MainSnackbar />
            </div>
        );
    }

    public componentDidMount() {
        getVersion().then((response) => {
            this.setState({ openbachVersion: "OpenBACH version: " + response.openbach_version });
        }).catch((error) => {
            this.setState({ openbachVersion: "Unknown OpenBACH version" });
        });
    }

    public componentWillReceiveProps(nextProps: IStoreProps) {
        const {username} = this.props.login;
        if (username !== undefined && nextProps.login.username !== username) {
            this.setState({ firstTime: false });
        }
    }

    private openLink(url: string) {
        if (!url.startsWith("/app")) {
            window.open(url, "_blank");
        } else {
            browserHistory.push(url);
        }
    }
};


interface IState {
    firstTime: boolean;
    openbachVersion: string;
};


interface IStoreProps {
    login: ILoginCredentials;
};


const mapStoreToProps = (store): IStoreProps => ({
    login: store.login,
});


export default connect<IStoreProps, {}, {}>(mapStoreToProps)(App);
