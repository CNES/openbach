import * as React from "react";
import {connect} from "react-redux";

import Divider from "material-ui/Divider";

import {setTitle} from "../../actions/global";
import {getJobs} from "../../actions/job";
import {getExternalJobs, getInternalJobs} from "../../api/job";
import {IExternalJobInfos, IJob} from "../../interfaces/job.interface";
import {ILoginCredentials} from "../../interfaces/login.interface";

import PaddedContainer from "../common/PaddedContainer";
import TitledPaper from "../common/TitledPaper";
import AdminJobCreator from "./AdminJobCreator";
import AdminJobList from "./AdminJobList";
import ExternalJobsInstaller from "./ExternalJobsInstaller";


interface IStyles {
    add: React.CSSProperties;
    display: React.CSSProperties;
    divider: React.CSSProperties;
};


const styles: IStyles = {
    add: {
        display: "inline-block",
        marginLeft: "8px",
        marginRight: "8%",
        verticalAlign: "top",
        width: "20%",
    },
    display: {
        display: "inline-block",
        width: "70%",
    },
    divider: {
        marginBottom: "24px",
        marginTop: "24px",
    },
};


class JobsDisplay extends React.Component<IStoreProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = { externalJobs: [], internalJobs: [] };
    }

    public render() {
        const isAdmin = this.props.login && this.props.login.is_admin;

        const content = [];
        const jobVersions = {externalJobs: [], internalJobs: []};
        if (isAdmin) {
            const {externalJobs, internalJobs} = this.state;
            content.push((
                <TitledPaper key="add" level={2} title="Add a new job" style={styles.add}>
                    <AdminJobCreator />
                    <Divider style={styles.divider} />
                    <TitledPaper level={2} title="Install a supported external job">
                        <ExternalJobsInstaller jobs={externalJobs} />
                    </TitledPaper>
                </TitledPaper>
            ));
            jobVersions.internalJobs = internalJobs;
            jobVersions.externalJobs = externalJobs;
        }
        content.push((
            <div key="display" style={isAdmin ? styles.display : undefined}>
                <AdminJobList jobs={this.props.jobs} availableJobs={jobVersions} />
            </div>
        ));

        return (
            <PaddedContainer>
                <TitledPaper title="Available jobs">
                    {content}
                </TitledPaper>
            </PaddedContainer>
        );
    }

    public componentWillMount() {
        this.props.setTitle("OpenBach Administration");
        this.props.loadJobs();
    }

    public componentDidMount() {
        getExternalJobs().then((response: IExternalJobInfos[]) => {
            this.setState({ externalJobs: response });
        }).catch((error) => { this.setState({ externalJobs: [] }); });
        getInternalJobs().then((response: IExternalJobInfos[]) => {
            this.setState({ internalJobs: response });
        }).catch((error) => { this.setState({ internalJobs: [] }); });
    }
};


interface IState {
    externalJobs: IExternalJobInfos[];
    internalJobs: IExternalJobInfos[];
};


interface IStoreProps {
    jobs: IJob[];
    login: ILoginCredentials;
};


const mapStoreToProps = (store): IStoreProps => ({
    jobs: store.job,
    login: store.login,
});


interface IDispatchProps {
    setTitle: (title: string) => void;
    loadJobs: () => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    loadJobs: () => dispatch(getJobs()),
    setTitle: (title: string): void => dispatch(setTitle(title)),
});


export default connect<IStoreProps, IDispatchProps, {}>(mapStoreToProps, mapDispatchToProps)(JobsDisplay);
