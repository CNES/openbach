import * as React from "react";
import {connect} from "react-redux";

import RaisedButton from "material-ui/RaisedButton";
import Toggle from "material-ui/Toggle";

import {favoriteScenario} from "../../../actions/scenario";
import {ILoginCredentials} from "../../../interfaces/login.interface";
import {IOpenbachArgumentForm, IScenarioForm} from "../../../interfaces/scenarioForm.interface";

import DownloadButton from "../../common/DownloadButton";
import {FormField, HiddenFormField, TextFormField} from "../../common/Form";
import JSONEditor from "../../common/JSONEditor";
import ScenarioInstanceLaunchDialog from "../Scenarios/ScenarioLaunchDialog";


interface IStyle {
    actions: React.CSSProperties;
    default: React.CSSProperties;
    favorites: React.CSSProperties;
    hidden: React.CSSProperties;
};


const styles: IStyle = {
    actions: {
        margin: "30px 0",
        textAlign: "center",
    },
    default: {
        display: "inline-block",
        margin: "0px 8px",
        verticalAlign: "middle",
    },
    favorites: {
        fontSize: "1.2em",
    },
    hidden: {
        display: "none",
    },
};


class ScenarioHeader extends React.Component<IProps & IStoreProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = { open: false };
        this.showLaunchDialog = this.showLaunchDialog.bind(this);
        this.hideLaunchDialog = this.hideLaunchDialog.bind(this);
        this.onFavoriteChanged = this.onFavoriteChanged.bind(this);
    }

    public render() {
        const {editing, login, project, scenario, scenarioArguments, style} = this.props;
        const favorites = login.favorites[project] || [];

        return (
            <div style={style}>
                <FormField name="name" component={HiddenFormField} style={styles.hidden} />
                <FormField
                    name="description"
                    component={TextFormField}
                    text="Description"
                    fullWidth={true}
                    multiLine={true}
                />
                <div style={styles.actions}>
                    <div style={styles.default}>
                        <Toggle
                            label="Favorite"
                            defaultToggled={favorites.includes(scenario)}
                            labelPosition="right"
                            labelStyle={styles.favorites}
                            onToggle={this.onFavoriteChanged}
                        />
                    </div>
                    <div style={styles.default}>
                        <JSONEditor
                            route={`/project/${project}/scenario/${scenario}`}
                            type="Scenario"
                            disabled={editing}
                            projectName={project}
                        />
                    </div>
                    <div style={styles.default}>
                        <DownloadButton
                            route={`/project/${project}/scenario/${scenario}`}
                            filename={`${scenario}.json`}
                            type="Scenario"
                            disabled={editing}
                        />
                    </div>
                    <div style={styles.default}>
                        <RaisedButton disabled={!editing} label="Save" type="submit" secondary={true}/>
                    </div>
                    <div style={styles.default}>
                        <RaisedButton
                            disabled={editing}
                            onClick={this.showLaunchDialog}
                            label="Launch"
                            secondary={true}
                        />
                        <ScenarioInstanceLaunchDialog
                            scenario={scenario}
                            open={this.state.open}
                            scenarioArguments={scenarioArguments}
                            onRequestClose={this.hideLaunchDialog}
                        />
                    </div>
                </div>
            </div>
        );
    }

    private showLaunchDialog() {
        this.setState({ open: true });
    }

    private hideLaunchDialog() {
        this.setState({ open: false });
    }

    private onFavoriteChanged(event, isFavorite: boolean) {
        const {project, scenario} = this.props;
        this.props.favoriteScenario(scenario, isFavorite);
    }
};


interface IState {
    open: boolean;
};


interface IProps {
    scenario: string;
    scenarioArguments: IOpenbachArgumentForm[];
    editing: boolean;
    style?: React.CSSProperties;
};


interface IStoreProps {
    login: ILoginCredentials;
    project: string;
};


const mapStoreToProps = (store): IStoreProps => ({
    login: store.login,
    project: store.project.current.name,
});


interface IDispatchProps {
    favoriteScenario: (scenario: string, favorite: boolean) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    favoriteScenario: (scenario: string, favorite: boolean) => dispatch(favoriteScenario(scenario, favorite)),
});


export default connect<IStoreProps, IDispatchProps, IProps>(mapStoreToProps, mapDispatchToProps)(ScenarioHeader);
