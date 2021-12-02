import * as React from "react";

import FlatButton from "material-ui/FlatButton";

import muiTheme from "../../utils/theme";


export default class MainTitle extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    public render() {
        return (
            <FlatButton
                style={{color: muiTheme.toolbar.color}}
                label={this.props.label}
                onClick={this.handleClick}
            />
        );
    }

    private handleClick() {
        const {link, onClick} = this.props;
        onClick(link);
    }
};


interface IProps {
    label: string;
    link: string;
    onClick: (url: string) => void;
};
