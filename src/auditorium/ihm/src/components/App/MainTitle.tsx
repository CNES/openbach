import * as React from "react";
import {connect} from "react-redux";

import {ToolbarTitle} from "material-ui/Toolbar";

import muiTheme from "../../utils/theme";


class MainTitle extends React.Component<IStoreProps, {}> {
    public render() {
        return <ToolbarTitle style={{color: muiTheme.toolbar.color}} text={this.props.name}/>;
    }
};


interface IStoreProps {
    name: string;
};


const mapStoreToProps = (store): IStoreProps => ({
    name: store.global.title,
});


export default connect<IStoreProps, {}, {}>(mapStoreToProps)(MainTitle);
