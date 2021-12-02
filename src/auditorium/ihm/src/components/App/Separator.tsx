import * as React from "react";

import {ToolbarSeparator} from "material-ui/Toolbar";


export default class Separator extends React.Component<{}, {}> {
    public render() {
        return <ToolbarSeparator style={{margin: "0px 16px"}} />;
    }
};
