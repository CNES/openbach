import * as React from "react";
import {connect} from "react-redux";

import {List, ListItem} from "material-ui/List";

import {notify} from "../../../actions/global";
import {getStatisticsNames} from "../../../api/influx";
import {IInfluxNames, IJobsDisplay} from "../../../interfaces/influx.interface";

import UnitsSelector from "./UnitsSelector";


class InfluxDBStatisticsDisplay extends React.Component<IProps & IStoreProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = { statistics: {} };
    }

    public render() {
        const jobsItems = this.props.jobs.map((job: IJobsDisplay, index: number) => {
            const {name, id, agent} = job;
            const label = name + " (id " + id + " on " + agent + ")";
            const statisticsNames = this.state.statistics[name];

            const stats = (statisticsNames || []).map((statName: string, i: number) => (
                <UnitsSelector
                    key={i}
                    name={statName}
                    onChange={this.props.onStatisticSelected.bind(this, name, id, agent, statName)}
                />
            ));

            return (
                <ListItem
                    key={index}
                    primaryText={label}
                    nestedItems={stats}
                    initiallyOpen={true}
                    primaryTogglesNestedList={true}
                />
            );
        });

        return <List>{jobsItems}</List>;
    }

    public componentWillMount() {
        getStatisticsNames(this.props.projectName).then((APIResult: IInfluxNames) => {
            this.setState({ statistics: APIResult });
        }).catch((error: Error) => this.props.notify("Statistics names could not be fetched: " + error.message));
    }
};


interface IState {
    statistics: { [job: string]: string[]; };
};


interface IProps {
    jobs: IJobsDisplay[];
    onStatisticSelected: (job: string, id: number, agent: string, name: string, unit: string) => void;
};


interface IStoreProps {
    projectName: string;
};


const mapStoreToProps = (store): IStoreProps => ({
    projectName: store.project.current.name,
});


interface IDispatchProps {
    notify: (message: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    notify: (message: string) => dispatch(notify(message)),
});


export default connect<IStoreProps, IDispatchProps, IProps>(mapStoreToProps, mapDispatchToProps)(InfluxDBStatisticsDisplay);
