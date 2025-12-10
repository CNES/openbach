import React from 'react';

import List from '@mui/material/List';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import Dialog from '../common/ActionDialog';
import DialogItem from './ScenarioInstanceDialogItem';
import DialogExport from './ScenarioInstanceExportDialog';
import DialogStatistics from './ScenarioInstanceStatisticsDialog';
import ListItem from '../common/NestedListItem';
import ScenarioInstanceStatusIcon from '../common/ScenarioInstanceStatusIcon';

import {downloadURL} from '../../api/base';
import {getScenarioInstanceFilesCount, stopScenarioInstance, deleteScenarioInstance} from '../../api/scenarios';
import {createChronografDashboard} from '../../api/influx';
import {useDispatch} from '../../redux';
import {formatScenarioDuration} from '../../utils/openbach-functions';
import type {IScenarioInstance, IFilesCount, IChronografStatistic} from '../../utils/interfaces';


const ScenarioInstanceDialog: React.FC<Props> = (props) => {
    const {instance, onClose} = props;
    const {project_name, scenario_instance_id: id, owner_scenario_instance_id: owner, scenario_name, status, start_date, stop_date} = instance;
    const dispatch = useDispatch();
    const [screen, storeScreen] = React.useState<"stats" | "export" | "delete">();
    const [files, storeFiles] = React.useState<IFilesCount>({});
    const [exported, storeExported] = React.useState<[boolean, string, string, number][]>([]);
    const [chronografData, storeChronografData] = React.useState<ChronografQuery>({grouped: false, statistics: []});
    const [chronografError, storeChronografError] = React.useState<string>();

    const handleOpenStatistics = React.useCallback(() => {
        storeScreen("stats");
    }, []);

    const handleOpenExport = React.useCallback(() => {
        const promise = dispatch(getScenarioInstanceFilesCount({instance: id}));
        promise.unwrap().then((payload) => {
            storeFiles(payload);
            if (Object.keys(payload).length === 0) {
                downloadURL("/openbach/scenario_instance/" + id + "/csv/");
            } else {
                storeScreen("export");
            }
        });
    }, [dispatch, id]);

    const handleOpenDelete = React.useCallback(() => {
        storeScreen("delete");
    }, []);

    const handleShowLogs = React.useCallback(() => {
        let display = "display:Off,pause:!f,value:0";
        let stopDate = "now";
        if (!stop_date) {
            display = "display:'5 seconds',pause:!f,section:1,value:5000";
        } else {
            const _stopDate = new Date(stop_date);
            _stopDate.setSeconds(_stopDate.getSeconds() + 1);
            _stopDate.setMilliseconds(0);
            stopDate = "'" + _stopDate.toISOString() + "'";
        }

        const startDate = new Date(start_date);
        startDate.setMilliseconds(0);
        const url = [
            "/kibana/app/dashboards#/view/default_dashboard?_g=(refreshInterval:(",
            display,
            "),time:(from:'",
            startDate.toISOString(),
            "',mode:absolute,to:",
            stopDate,
            "))&_a=(columns:!(),dataSource:(dataViewId:default_logstash_index,type:dataView),filters:!(),",
            "interval:auto,query:(language:kuery,query:'owner_scenario_instance_id:",
            owner,
            "'),sort:!(!('@timestamp',desc)))",
        ];
        downloadURL(url.join(""));
        onClose();
    }, [owner, start_date, stop_date, onClose]);

    const handleShowStatistics = React.useCallback(() => {
        const {grouped, statistics} = chronografData;
        if (statistics.length > 0) {
            const promise = dispatch(createChronografDashboard({instance, grouped, statistics}));
            promise.unwrap().then(({id}) => {
                downloadURL("/chronograf/sources/0/dashboards/" + id);
                onClose();
            }).catch((error: Error) => {
                storeChronografData({grouped, statistics: []});
                storeChronografError(error.message);
            });
        } else {
            downloadURL("/chronograf/");
            onClose();
        }
    }, [instance, chronografData, onClose, dispatch]);

    const handleStopInstance = React.useCallback(() => {
        dispatch(stopScenarioInstance({instance: id}));
    }, [id, dispatch]);

    const handleDeleteInstance = React.useCallback(() => {
        dispatch(deleteScenarioInstance({instance: id}));
        onClose();
    }, [id, onClose, dispatch]);

    const handleExportInstance = React.useCallback(() => {
        const files = exported.filter((row) => row[0]).map(
            (row) => encodeURIComponent(row[1]) + "=" + encodeURIComponent(row[2])
        ).join("&");
        const url = "/openbach/scenario_instance/" + id + "/";
        downloadURL(files ? url + "archive?" + files : "csv");
        onClose();
    }, [id, exported, onClose]);

    const body = React.useMemo(() => {
        switch (screen) {
            case "stats":
                return (
                    <DialogStatistics
                        onChange={storeChronografData}
                        instance={instance}
                        project={project_name}
                        error={chronografError}
                    />
                );
            case "export":
                return <DialogExport onChange={storeExported} files={files} />;
            case "delete":
                return (
                    <React.Fragment>
                        <DialogContentText>
                            The informations of this scenario instance will be
                            removed from the database. You will not be able to
                            recover them.
                        </DialogContentText>
                        <DialogContentText>
                            Proceed?
                        </DialogContentText>
                    </React.Fragment>
                );
            default:
                const elapsed = formatScenarioDuration(instance);
                return (
                    <List>
                        <ListItem
                            primary={instance.scenario_name}
                            secondary={elapsed}
                            rightIcon={<ScenarioInstanceStatusIcon status={instance.status} />}
                            initiallyOpen
                            inset
                            nestedItems={<DialogItem instance={instance} />}
                        />
                    </List>
                );
        }
    }, [screen, instance, project_name, chronografError, files]);

    const actions = React.useMemo(() => {
        switch (screen) {
            case "stats":
                return [{label: "Show statistics", action: handleShowStatistics}];
            case "export":
                return [{label: "Download", action: handleExportInstance}];
            case "delete":
                return [{label: "Yes", action: handleDeleteInstance}];
            default:
                const actions = [
                    {label: "Show logs", action: handleShowLogs},
                    {label: "Show statistics", action: handleOpenStatistics},
                ];

                if (status === "Running") {
                    actions.splice(0, 0, {label: "Stop Instance", action: handleStopInstance});
                } else if (status !== "Scheduling") {
                    actions.splice(
                        0, 0,
                        {label: "Delete", action: handleOpenDelete},
                        {label: "Export to CSV", action: handleOpenExport},
                    );
                }
                return actions;
        }
    }, [
        screen, status,
        handleDeleteInstance, handleExportInstance, handleStopInstance,
        handleOpenDelete, handleOpenExport, handleOpenStatistics,
        handleShowLogs, handleShowStatistics,
    ]);

    return (
        <Dialog
            open
            title={scenario_name}
            cancel={{label: screen === "delete" ? "No" : screen == null ? "OK" : "Cancel", action: onClose}}
            actions={actions}
        >
            <DialogContent>
                {body}
            </DialogContent>
        </Dialog>
    );
};


interface Props {
    instance: IScenarioInstance;
    onClose: () => void;
}


interface ChronografQuery {
    grouped: boolean;
    statistics: IChronografStatistic[];
}


export default ScenarioInstanceDialog;
