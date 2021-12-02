import * as React from "react";
import {connect} from "react-redux";

import {Card, CardActions, CardText, CardTitle} from "material-ui/Card";
import RaisedButton from "material-ui/RaisedButton";

import {ILoginCredentials} from "../../interfaces/login.interface";


const cardStyle = {
    display: "inline-block",
    verticalAlign: "top",
};


class ActionCard extends React.Component<IProps & IStoreProps, {}> {
    public render() {
        const cardWidth = this.props.singleCard ? "60%" : "30%";
        const margin = "16px " + (this.props.singleCard ? "20%" : "10%");

        if (!this.props.login.is_user) {
            return <div />;
        }

        return (
            <Card style={{margin, width: cardWidth, ...cardStyle}}>
                <CardTitle title={this.props.title} />
                <CardText>
                    {this.props.children}
                </CardText>
                <CardActions>
                    <RaisedButton
                        secondary={true}
                        disabled={!this.props.actionPossible}
                        onClick={this.props.onAction}
                        label={this.props.actionName}
                    />
                </CardActions>
            </Card>
        );
    }
};


interface IProps {
    actionName: string;
    actionPossible: boolean;
    singleCard?: boolean;
    onAction: () => void;
    title: string;
};


interface IStoreProps {
    login: ILoginCredentials;
};


const mapStoreToProps = (store): IStoreProps => ({
    login: store.login,
});


export default connect<IStoreProps, {}, IProps>(mapStoreToProps)(ActionCard);
