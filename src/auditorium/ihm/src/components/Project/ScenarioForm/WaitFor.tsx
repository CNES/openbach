import * as React from "react";

import {ReduxFormMultiSelectField, SelectFormInput} from "../../common/Form";
import TitledPaper from "../../common/TitledPaper";

import muiTheme from "../../../utils/theme";


interface IStyles {
    container: React.CSSProperties;
    wrappedSelect: React.CSSProperties;
    wrappedText: React.CSSProperties;
};

const styles: IStyles = {
    container: {
        display: "flex",
        margin: "2px 4%",
    },
    wrappedSelect: {
        flexGrow: 70,
    },
    wrappedText: {
        flexGrow: 30,
        fontSize: "1em",
        margin: "10px 5px",
        padding: 0,
    },
};


export default class WaitFor extends React.Component<IProps, {}> {
    public render() {
        return (
            <div style={styles.container}>
                <div style={styles.wrappedSelect}>
                    <ReduxFormMultiSelectField
                        name={this.props.parameterName}
                        component={SelectFormInput}
                        multi={true}
                        autosize={true}
                        clearable={false}
                        options={this.props.ids}
                    />
                </div><p style={styles.wrappedText}>{this.props.text}</p>
            </div>
        );
    }
};


interface IProps {
    ids: Array<{value: number, label: string}>;
    text: string;
    parameterName: string;
};
