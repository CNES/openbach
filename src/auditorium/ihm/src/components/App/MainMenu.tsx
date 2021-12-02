import * as React from "react";

import FlatButton from "material-ui/FlatButton";
import IconButton from "material-ui/IconButton";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";

import {CloseMenuIcon, ExpandMenuIcon, muiTheme} from "../../utils/theme";


export default class MainMenu extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = { open: false };
        this.handleClick = this.handleClick.bind(this);
        this.handleOpen = this.handleOpen.bind(this);
    }

    public render() {
        const icon = this.state.open ? (
            <CloseMenuIcon color={muiTheme.toolbar.iconColor} />
        ) : (
            <ExpandMenuIcon color={muiTheme.toolbar.iconColor} />
        );

        const button = (
            <FlatButton
                label={this.props.label}
                labelPosition="before"
                icon={icon}
                backgroundColor={this.state.open ? muiTheme.palette.accent2Color : muiTheme.toolbar.backgroundColor}
                labelStyle={{color: muiTheme.toolbar.color}}
            />
        );

        return (
            <IconMenu
                open={this.state.open}
                iconButtonElement={button}
                onChange={this.handleClick}
                onRequestChange={this.handleOpen}
                anchorOrigin={{horizontal: "right", vertical: "bottom"}}
                targetOrigin={{horizontal: "right", vertical: "top"}}
            >
                {this.props.children}
            </IconMenu>
        );
    }

    private handleClick(event, value: string) {
        this.props.onMenuSelected(value);
    }

    private handleOpen(open: boolean) {
        if (this.props.onMenuOpened) {
            this.props.onMenuOpened();
        }
        this.setState({ open });
    }
};


interface IProps {
    label: string;
    onMenuSelected: (value: string) => void;
    onMenuOpened?: () => void;
};


interface IState {
    open: boolean;
};
