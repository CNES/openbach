import * as React from "react";
import {connect} from "react-redux";

import {Card, CardActions, CardMedia, CardText, CardTitle} from "material-ui/Card";

import {ILoginCredentials} from "../../../interfaces/login.interface";


class EntityCardTemplate extends React.Component<IProps & IStoreProps, {}> {
    public render() {
        const {actions, login, media, subtitle, title} = this.props;
        const cardActions = login.is_user && actions && actions.length ? (
            <CardActions>{actions}</CardActions>
        ) : null;

        return (
            <Card>
                <CardMedia
                    overlay={<CardTitle title={title} subtitle={subtitle || " "} />}
                >
                    <div style={{height: "96px", position: "relative"}}>
                        <img style={{height: "100%", position: "absolute", top: "0px", right: "0px"}} src={media}/>
                    </div>
                </CardMedia>
                <CardText style={{overflow: "visible"}}>
                    {this.props.children}
                </CardText>
                {cardActions}
            </Card>
        );
    }
};


interface IProps {
    title: string;
    subtitle?: string;
    media: any;
    actions?: JSX.Element[];
}


interface IStoreProps {
    login: ILoginCredentials;
};


const mapStoreToProps = (store): IStoreProps => ({
    login: store.login,
});


export default connect<IStoreProps, {}, IProps>(mapStoreToProps)(EntityCardTemplate);
