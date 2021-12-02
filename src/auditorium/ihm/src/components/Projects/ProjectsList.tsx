import * as React from "react";
import {connect} from "react-redux";

import {List, ListItem} from "material-ui/List";

import {IProject} from "../../interfaces/project.interface";

import ProjectItem from "./ProjectItem";


class ProjectList extends React.Component<IStoreProps, {}> {
    public render() {
        if (!this.props.projects || this.props.projects.length === 0) {
            return (
                <List>
                    <ListItem
                        disabled={true}
                        primaryText="No project yet..."
                        secondaryText="Please add a new project"
                    />
                </List>
            );
        }

        const projects = [];
        this.buildFilteredList(projects, "Private", (project: IProject) => project.owners.indexOf(this.props.username) >= 0);
        this.buildFilteredList(projects, "Owned", (project: IProject) => project.owners.length !== 0 && project.owners.indexOf(this.props.username) < 0);
        this.buildFilteredList(projects, "Public", (project: IProject) => project.owners.length === 0);

        return <List>{projects}</List>;
    }

    private buildFilteredList(aggregator: JSX.Element[], name: string, filterFunc: (project: IProject) => boolean) {
        const filtered = this.props.projects.filter(filterFunc).map((project: IProject) => (
            <ProjectItem key={project.name} name={project.name} description={project.description} />
        ));

        if (filtered.length !== 0) {
            aggregator.push((
                <ListItem
                    key={name.toLowerCase()}
                    primaryText={`${name} Projects`}
                    nestedItems={filtered}
                    initiallyOpen={true}
                    primaryTogglesNestedList={true}
                />
            ));
        }
    }
};


interface IStoreProps {
    projects: IProject[];
    username: string;
};


const mapStoreToProps = (store): IStoreProps => ({
    projects: store.projects,
    username: store.login.username,
});


export default connect<IStoreProps, {}, {}>(mapStoreToProps)(ProjectList);
