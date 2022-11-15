import * as React from "react";

import CircularProgress from "material-ui/CircularProgress";

import {cyan500, green500, grey500, indigo500, lightBlue500, lightGreen500, orange500, red500} from "material-ui/styles/colors";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import RunningIcon from "material-ui/svg-icons/action/autorenew";
import RetriedIcon from "material-ui/svg-icons/action/autorenew";
import CheckCircleIcon from "material-ui/svg-icons/action/check-circle";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import UnknownIcon from "material-ui/svg-icons/action/help-outline";
import BadStatusIcon from "material-ui/svg-icons/action/highlight-off";
import ScheduleIcon from "material-ui/svg-icons/action/schedule";
import ErrorIcon from "material-ui/svg-icons/alert/error-outline";
import PlayIcon from "material-ui/svg-icons/av/play-circle-filled";
import StopIcon from "material-ui/svg-icons/av/stop";
import EditIcon from "material-ui/svg-icons/editor/mode-edit";
import Unreachable from "material-ui/svg-icons/file/cloud-off";
import FileDownload from "material-ui/svg-icons/file/file-download";

import {TJobInstanceStatus, TOpenbachFunctionInstanceStatus, TScenarioInstanceStatus} from "../interfaces/scenarioInstance.interface";


export {default as HelpIcon} from "material-ui/svg-icons/action/help";
export {default as ExpandMenuIcon} from "material-ui/svg-icons/navigation/expand-more";
export {default as CloseMenuIcon} from "material-ui/svg-icons/navigation/expand-less";
export {default as Present} from "material-ui/svg-icons/navigation/check";
export {default as Absent} from "material-ui/svg-icons/navigation/close";
export {default as FileUploadIcon} from "material-ui/svg-icons/file/file-upload";
export {default as DeleteIcon} from "material-ui/svg-icons/action/delete";
export {default as SearchIcon} from "material-ui/svg-icons/action/search";
export {default as InfoIcon} from "material-ui/svg-icons/action/info";
export {default as BuildIcon} from "material-ui/svg-icons/action/build";
export {default as ContentAddIcon} from "material-ui/svg-icons/content/add";

export {default as OpenbachFunctionIcon} from "material-ui/svg-icons/action/code";
export {default as ScenarioArgumentIcon} from "material-ui/svg-icons/editor/bubble-chart";
export {default as StartJobInstanceIcon} from "material-ui/svg-icons/notification/event-note";
export {default as StartScenarioInstanceIcon} from "material-ui/svg-icons/av/subscriptions";


export function getLaunchScenarioIcon() {
    return <PlayIcon color={lightGreen500} />;
};

export function getScenarioStopIcon() {
    return <StopIcon color={red500} />;
};


export function getGenericDeleteIcon() {
    return <DeleteIcon color={red500} />;
};


export function getGenericEditIcon() {
    return <EditIcon color="#2A72A9" />;
};


export function getGenericDownloadIcon() {
    return <FileDownload color="#2A72A9" />;
};


export function getIconForJobState(status: any) {
    if (!status) {
        return <UnknownIcon color={grey500} />;
    }

    const code = status.returncode;
    if (!code) {
        return <UnknownIcon color={red500} />;
    }

    if (code === 202) {
        return <RunningIcon color="#2A72A9" />;
    } else if (code < 400) {
        return <CheckCircleIcon color={green500} />;
    } else {
        return <BadStatusIcon color={red500} />;
    }
};


export function getIconForScenarioStatus(status: TScenarioInstanceStatus | "Unknown") {
    switch (status) {
        case "Running":
            return <CircularProgress color={green500} size={24}/>;
        case "Scheduling":
            return <ScheduleIcon color={grey500} />;
        case "Finished Ok":
            return <CheckCircleIcon color={cyan500} />;
        case "Finished Ko":
            return <ErrorIcon color={red500} />;
        case "Stopped":
            return <StopIcon color={indigo500} />;
        case "Agents Unreachable":
            return <Unreachable color={orange500} />;
        default:
            return <UnknownIcon color={grey500} />;
    }
};


export function getIconForFunctionStatus(status: TOpenbachFunctionInstanceStatus | "Unknown") {
    switch (status) {
        case "Scheduled":
            return <ScheduleIcon color={grey500} />;
        case "Running":
            return <CircularProgress color={green500} size={24}/>;
        case "Finished":
            return <CheckCircleIcon color={cyan500} />;
        case "Stopped":
            return <ErrorIcon color={indigo500} />;
        case "Error":
            return <ErrorIcon color={red500} />;
        case "Retried":
            return <RetriedIcon color={orange500} />;
        default:
            return <UnknownIcon color={grey500} />;
    }
};


export function getIconForJobStatus(status: TJobInstanceStatus | "Unknown") {
    switch (status) {
        case "Not Scheduled":
            return <CheckCircleIcon color={grey500}/>;
        case "Scheduled":
            return <ScheduleIcon color={grey500}/>;
        case "Running":
            return <CircularProgress color={green500} size={24}/>;
        case "Not Running":
            return <CheckCircleIcon color={grey500}/>;
        case "Error":
            return <ErrorIcon color={red500}/>;
        case "Stopped":
            return <StopIcon color={indigo500}/>;
        case "Agent Unreachable":
            return <Unreachable color={orange500} />;
        default:
            return <UnknownIcon color={grey500} />;
    }
};


export const muiTheme = getMuiTheme({
    drawer: {
        color: "rgb(55, 71, 79)",
    },
    palette: {
        accent1Color: "#F48C00",
        accent2Color: "#888",
        primary1Color: "#2A72A9",
        primary2Color: "#4B89B8",
    },
    tabs: {
        backgroundColor: "rgb(10, 93, 157)",
    },
    textField: {
        floatingLabelColor: "#F48C00",
    },
    toolbar: {
        backgroundColor: "#222",
        color: "rgba(255, 255, 255, 0.75)",
        height: 64,
        iconColor: "rgba(255, 255, 255, 0.75)",
        separatorColor: "rgba(255, 255, 255, 0.75)",
    },
});


export default muiTheme;


/* MuiTheme as defined in node_modules/@types/material-ui/index.d.ts
        interface MuiTheme {
            spacing?: Spacing;
            fontFamily?: string;
            palette?: ThemePalette;
            isRtl?: boolean;
            userAgent?: string | boolean;
            zIndex?: zIndex;
            baseTheme?: RawTheme;
            rawTheme?: RawTheme;
            appBar?: {
                color?: string;
                textColor?: string;
                height?: number;
                titleFontWeight?: number;
                padding?: number;
            };
            avatar?: {
                color?: string;
                backgroundColor?: string;
                borderColor?: string;
            };
            badge?: {
                color?: string;
                textColor?: string;
                primaryColor?: string;
                primaryTextColor?: string;
                secondaryColor?: string;
                secondaryTextColor?: string;
                fontWeight?: number;
            };
            button?: {
                height?: number;
                minWidth?: number;
                iconButtonSize?: number;
                textTransform?: string;
            };
            card?: {
                titleColor?: string;
                subtitleColor?: string;
                fontWeight?: number;
            };
            cardMedia?: {
                color?: string;
                overlayContentBackground?: string;
                titleColor?: string;
                subtitleColor?: string;
            };
            cardText?: {
                textColor?: string;
            };
            checkbox?: {
                boxColor?: string;
                checkedColor?: string;
                requiredColor?: string;
                disabledColor?: string;
                labelColor?: string;
                labelDisabledColor?: string;
            };
            chip?: {
                backgroundColor?: string;
                deleteIconColor?: string;
                textColor?: string;
                fontSize?: number;
                fontWeight?: number;
                shadow?: string;
            };
            datePicker?: {
                color?: string;
                textColor?: string;
                calendarTextColor?: string;
                selectColor?: string;
                selectTextColor?: string;
                calendarYearBackgroundColor?: string;
            };
            dialog?: {
                titleFontSize?: number;
                bodyFontSize?: number;
                bodyColor?: string;
            };
            dropDownMenu?: {
                accentColor?: string;
            };
            enhancedButton?: {
                tapHighlightColor?: string;
            };
            flatButton?: {
                color?: string;
                buttonFilterColor?: string;
                disabledTextColor?: string;
                textColor?: string;
                primaryTextColor?: string;
                secondaryTextColor?: string;
                fontSize?: number;
                fontWeight?: number;
            };
            floatingActionButton?: {
                buttonSize?: number;
                miniSize?: number;
                color?: string;
                iconColor?: string;
                secondaryColor?: string;
                secondaryIconColor?: string;
                disabledTextColor?: string;
                disabledColor?: string;
            };
            gridTile?: {
                textColor?: string;
            };
            icon?: {
                color?: string;
                backgroundColor?: string;
            };
            inkBar?: {
                backgroundColor?: string;
            };
            drawer?: {
                width?: number;
                color?: string;
            };
            listItem?: {
                nestedLevelDepth?: number;
                secondaryTextColor?: string;
                leftIconColor?: string;
                rightIconColor?: string;
            };
            menu?: {
                backgroundColor?: string;
                containerBackgroundColor?: string;
            };
            menuItem?: {
                dataHeight?: number;
                height?: number;
                hoverColor?: string;
                padding?: number;
                selectedTextColor?: string;
                rightIconDesktopFill?: string;
            };
            menuSubheader?: {
                padding?: number;
                borderColor?: string;
                textColor?: string;
            };
            overlay?: {
                backgroundColor?: string;
            };
            paper?: {
                color?: string;
                backgroundColor?: string;
                zDepthShadows?: string[];
            };
            radioButton?: {
                borderColor?: string;
                backgroundColor?: string;
                checkedColor?: string;
                requiredColor?: string;
                disabledColor?: string;
                size?: number;
                labelColor?: string;
                labelDisabledColor?: string;
            };
            raisedButton?: {
                color?: string;
                textColor?: string;
                primaryColor?: string;
                primaryTextColor?: string;
                secondaryColor?: string;
                secondaryTextColor?: string;
                disabledColor?: string;
                disabledTextColor?: string;
                fontSize?: number;
                fontWeight?: number;
            };
            refreshIndicator?: {
                strokeColor?: string;
                loadingStrokeColor?: string;
            };
            ripple?: {
                color?: string;
            };
            slider?: {
                trackSize?: number;
                trackColor?: string;
                trackColorSelected?: string;
                handleSize?: number;
                handleSizeDisabled?: number;
                handleSizeActive?: number;
                handleColorZero?: string;
                handleFillColor?: string;
                selectionColor?: string;
                rippleColor?: string;
            };
            snackbar?: {
                textColor?: string;
                backgroundColor?: string;
                actionColor?: string;
            };
            subheader?: {
                color?: string;
                fontWeight?: number;
            };
            stepper?: {
                backgroundColor?: string;
                hoverBackgroundColor?: string;
                iconColor?: string;
                hoveredIconColor?: string;
                inactiveIconColor?: string;
                textColor?: string;
                disabledTextColor?: string;
                connectorLineColor?: string;
            };
            svgIcon?: {
                color?: string,
            };
            table?: {
                backgroundColor?: string;
            };
            tableFooter?: {
                borderColor?: string;
                textColor?: string;
            };
            tableHeader?: {
                borderColor?: string;
            };
            tableHeaderColumn?: {
                textColor?: string;
                height?: number;
                spacing?: number;
            };
            tableRow?: {
                hoverColor?: string;
                stripeColor?: string;
                selectedColor?: string;
                textColor?: string;
                borderColor?: string;
                height?: number;
            };
            tableRowColumn?: {
                height?: number;
                spacing?: number;
            };
            tabs?: {
                backgroundColor?: string;
                textColor?: string;
                selectedTextColor?: string;
            };
            textField?: {
                textColor?: string;
                hintColor?: string;
                floatingLabelColor?: string;
                disabledTextColor?: string;
                errorColor?: string;
                focusColor?: string;
                backgroundColor?: string;
                borderColor?: string;
            };
            timePicker?: {
                color?: string;
                textColor?: string;
                accentColor?: string;
                clockColor?: string;
                clockCircleColor?: string;
                headerColor?: string;
                selectColor?: string;
                selectTextColor?: string;
            };
            toggle?: {
                thumbOnColor?: string;
                thumbOffColor?: string;
                thumbDisabledColor?: string;
                thumbRequiredColor?: string;
                trackOnColor?: string;
                trackOffColor?: string;
                trackDisabledColor?: string;
                labelColor?: string;
                labelDisabledColor?: string;
                trackRequiredColor?: string;
            };
            toolbar?: {
                color?: string;
                hoverColor?: string;
                backgroundColor?: string;
                height?: number;
                titleFontSize?: number;
                iconColor?: string;
                separatorColor?: string;
                menuHoverColor?: string;
            };
            tooltip?: {
                color?: string;
                rippleBackgroundColor?: string;
            };
        }
*/
