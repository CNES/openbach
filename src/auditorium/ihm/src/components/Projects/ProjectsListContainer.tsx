import * as React from "react";
import {connect} from "react-redux";

import {setTitle} from "../../actions/global";
import {getProjects} from "../../actions/project";
import PaddedContainer from "../common/PaddedContainer";
import NewProject from "./ProjectsAdd";
import ProjectList from "./ProjectsList";


class ProjectsListContainer extends React.Component<IDispatchProps, {}> {
    public render() {
        return (
            <PaddedContainer>
                <ProjectList />
                <NewProject />
            </PaddedContainer>
        );
    }

    public componentDidMount() {
        this.props.setTitle("Projects list");
        this.props.loadProjects();
    }
};


interface IDispatchProps {
    loadProjects: () => void;
    setTitle: (title: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    loadProjects: () => dispatch(getProjects()),
    setTitle: (title: string) => dispatch(setTitle(title)),
});


export default connect<{}, IDispatchProps, {}>(null, mapDispatchToProps)(ProjectsListContainer);
