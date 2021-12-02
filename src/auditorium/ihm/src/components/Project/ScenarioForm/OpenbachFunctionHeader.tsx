import * as React from "react";

import MenuItem from "material-ui/MenuItem";

import {OpenbachFunctionsList, TOpenbachFunctions} from "../../../interfaces/project.interface";
import {FormField, HiddenFormField, SelectFormField, TextFormField} from "../../common/Form";
import WaitFor from "./WaitFor";


interface IStyles {
    container: React.CSSProperties;
    hidden: React.CSSProperties;
    text: React.CSSProperties;
    wait: React.CSSProperties;
    wrapper: React.CSSProperties;
};


const styles: IStyles = {
    container: {
        display: "inline-block",
        margin: "0px 2%",
        verticalAlign: "top",
        width: "29.333333333333%",
    },
    hidden: {
        display: "none",
    },
    text: {
        display: "inline",
        fontSize: "1em",
        margin: "0 10px",
        padding: 0,
    },
    wait: {
        margin: "5px 0 15px 0",
    },
    wrapper: {
        margin: "0 3%",
    },
};


export default class OpenbachFunctionHeader extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
        this.onSectionChange = this.onSectionChange.bind(this);
    }

    public render() {
        const openbachFunctions = OpenbachFunctionsList.map((openbachFunction) => (
            <MenuItem key={openbachFunction} value={openbachFunction} primaryText={openbachFunction} />
        ));

        const sections = this.props.sections.map((name: string, index: number) => (
            <MenuItem key={index} value={name} primaryText={name} />
        ));
        sections.unshift(<MenuItem key={-1} value={null} primaryText="" />);

        return (
            <div>
                <div style={styles.container}>
                    <FormField
                        name={`functions[${this.props.index}].label`}
                        component={TextFormField}
                        type="string"
                        text="label"
                        fullWidth={true}
                    />
                </div>
                <div style={styles.container}>
                    <FormField
                        name={`functions[${this.props.index}].section`}
                        text="Section"
                        fullWidth={true}
                        component={SelectFormField}
                        children={sections}
                        onSelectionChange={this.onSectionChange}
                    />
                </div>
                <div style={styles.container}>
                    <FormField
                        name={`functions[${this.props.index}].kind`}
                        text="Openbach function"
                        fullWidth={true}
                        component={SelectFormField}
                        children={openbachFunctions}
                    />
                </div>
                <div style={styles.wrapper}>
                    <p style={styles.text}>The controller will start this function</p>
                    <FormField
                        name={`functions[${this.props.index}].wait.time`}
                        component={TextFormField}
                        fullWidth={false}
                        text="Waiting time"
                    />
                    <p style={styles.text}>seconds after</p>
                </div>
                <div style={styles.wait}>
                    <WaitFor
                        text="are started and"
                        formName={`functions[${this.props.index}].wait.launched_ids`}
                        ids={this.props.ids}
                    />
                    <WaitFor
                        text="are finished."
                        formName={`functions[${this.props.index}].wait.finished_ids`}
                        ids={this.props.ids}
                    />
                </div>
            </div>
        );
    }

    private onSectionChange(sectionName: string) {
        this.props.onSectionChange(sectionName, this.props.index);
    }
};


interface IProps {
    index: number;
    ids: Array<{value: number, label: string}>;
    sections: string[];
    onSectionChange: (name: string, index: number) => void;
};
