import * as React from "react";

import {ListItem} from "material-ui/List";


export default class JobDescription extends React.Component<IProps, {}> {
    public render() {
        const {description} = this.props;
        if (!description) {
            return null;
        }

        return (
            <ListItem
                primaryText="Description"
                nestedItems={[<ListItem key="unique" primaryText={description} disabled={true} />]}
                autoGenerateNestedIndicator={false}
                initiallyOpen={true}
                disabled={true}
            />
        );
    }
};


interface IProps {
    description: string;
};
