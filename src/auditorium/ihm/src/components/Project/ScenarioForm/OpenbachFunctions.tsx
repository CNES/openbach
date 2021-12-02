import * as React from "react";

import IconButton from "material-ui/IconButton";
import {List, ListItem} from "material-ui/List";
import TextField from "material-ui/TextField";

import {IOpenbachFunctionForm} from "../../../interfaces/scenarioForm.interface";
import {ContentAddIcon, DeleteIcon} from "../../../utils/theme";
import {IFieldArrayProps, IFieldsProps} from "../../../utils/types";

import OpenbachFunction from "./OpenbachFunction";


interface IStyle {
    container: React.CSSProperties;
    defaultContainer: React.CSSProperties;
    newSection: React.CSSProperties;
    removeSection: React.CSSProperties;
    removeSectionIcon: React.CSSProperties;
};


const styles: IStyle = {
    container: {
        borderBottom: "1px silver solid",
        position: "relative",
    },
    defaultContainer: {
        position: "relative",
    },
    newSection: {
        left: -36,
        position: "absolute",
        top: 12,
    },
    removeSection: {
        bottom: 0,
        height: 16,
        margin: 0,
        padding: 0,
        position: "absolute",
        right: 0,
        width: 16,
    },
    removeSectionIcon: {
        height: 16,
        margin: 0,
        padding: 0,
        width: 16,
    },
};


export default class OpenbachFunctions extends React.Component<IProps & IFieldArrayProps<IOpenbachFunctionForm>, IState> {
    constructor(props) {
        super(props);
        this.state = { newSection: "", sections: [...props.initialSections] };
        this.addOpenBachFunction = this.addOpenBachFunction.bind(this);
        this.onNewSectionChange = this.onNewSectionChange.bind(this);
        this.addSection = this.addSection.bind(this);
        this.changeSection = this.changeSection.bind(this);
    }

    public render() {
        const {sections, newSection} = this.state;

        const openbachFunctions = [];
        let lastSection: string = null;
        let knownSectionIndex: number = 0;

        this.props.fields.forEach((fieldName: string, index: number, fields: IFieldsProps<IOpenbachFunctionForm>) => {
            const section = fields.get(index).section;
            if (section !== lastSection) {
                lastSection = section;
                const sectionKey: string = `section_${section}_${index}`;
                while (knownSectionIndex < sections.length && sections[knownSectionIndex] !== section) {
                    openbachFunctions.push(this.buildSectionDelimiter(sections[knownSectionIndex], sectionKey + "_" + knownSectionIndex));
                    ++knownSectionIndex;
                }
                if (section || knownSectionIndex !== sections.length) {
                    openbachFunctions.push(this.buildSectionDelimiter(section, sectionKey));
                } else {
                    openbachFunctions.push((
                        <div key={sectionKey} style={styles.defaultContainer}>
                            <TextField
                                floatingLabelText="New Section"
                                value={newSection}
                                fullWidth={true}
                                onChange={this.onNewSectionChange}
                            />
                            <IconButton
                                tooltip="Add a new section with the given name"
                                touch={true}
                                tooltipPosition="top-right"
                                onClick={this.addSection}
                                style={styles.newSection}
                            >
                                <ContentAddIcon />
                            </IconButton>
                        </div>
                    ));
                }
                if (knownSectionIndex < sections.length) {
                    ++knownSectionIndex;
                }
            }
            openbachFunctions.push((
                <OpenbachFunction
                    key={`${fieldName}_${index}`}
                    formIndex={index}
                    formName={this.props.formName}
                    remove={this.removeOpenBachFunction.bind(this, index)}
                    sections={sections}
                    onSectionChange={this.changeSection}
                />
            ));
        });

        return (
            <List>
                {openbachFunctions}
                <ListItem
                    primaryText="Add new OpenBACH function"
                    leftIcon={<ContentAddIcon />}
                    onTouchTap={this.addOpenBachFunction}
                />
            </List>
        );
    }

    public componentWillReceiveProps(nextProps: IProps) {
        if (nextProps.formName !== this.props.formName) {
            this.props.fields.removeAll();
        }
        if (nextProps.initialSections !== this.props.initialSections) {
            const sections = [...nextProps.initialSections];
            this.setState({ sections });
        }
    }

    private addOpenBachFunction() {
        const newGuid = parseInt("xxxxxxx".replace(/[x]/g, (c) => {
            // tslint:disable:no-bitwise
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }), 16);
        this.props.fields.push({
            id: newGuid,
            kind: undefined,
            label: undefined,
            parameters: {},
            wait: undefined,
        });
    }

    private buildSectionDelimiter(section, key) {
        return (
            <div key={key} style={styles.container}>
                {section}
                <IconButton
                    tooltip="Remove this section and move its openbach functions into the unnamed section"
                    touch={true}
                    tooltipPosition="top-center"
                    onClick={this.removeSection.bind(this, section)}
                    style={styles.removeSection}
                    iconStyle={styles.removeSectionIcon}
                >
                    <DeleteIcon />
                </IconButton>
            </div>
        );
    }

    private removeOpenBachFunction(index: number) {
        const removedId = this.props.fields.get(index).id;
        const excludeRemoved = (id: number) => id !== removedId;
        this.props.fields.forEach((fieldName: string, i: number, fields: IFieldsProps<IOpenbachFunctionForm>) => {
            if (i !== index) {
                const openbachFunction = fields.get(i);
                const {wait, jobs, conditionTrue, conditionFalse} = openbachFunction;
                if (wait) {
                    const {launched_ids, finished_ids} = wait;
                    if (launched_ids) {
                        openbachFunction.wait.launched_ids = launched_ids.filter(excludeRemoved);
                    }
                    if (finished_ids) {
                        openbachFunction.wait.finished_ids = finished_ids.filter(excludeRemoved);
                    }
                }
                if (jobs) {
                    openbachFunction.jobs = jobs.filter(excludeRemoved);
                }
                if (conditionTrue) {
                    openbachFunction.conditionTrue = conditionTrue.filter(excludeRemoved);
                }
                if (conditionFalse) {
                    openbachFunction.conditionFalse = conditionFalse.filter(excludeRemoved);
                }
            }
        });
        this.props.fields.remove(index);
    }

    private onNewSectionChange(event, newSection: string) {
        this.setState({ newSection });
    }

    private addSection() {
        const {newSection} = this.state;
        if (newSection && !this.state.sections.includes(newSection)) {
            const sections = [...this.state.sections, newSection];
            this.setState({ newSection: "", sections });
        } else {
            this.setState({ newSection: "" });
        }
    }

    private removeSection(sectionName: string) {
        const {fields} = this.props;
        const sections = this.state.sections.filter((name: string) => name !== sectionName);

        if (sections.length !== this.state.sections.length) {
            this.setState({ sections });
            const movedFunctions = [];
            for (let i = fields.length - 1; i >= 0; --i) {
                const openbachFunction = fields.get(i);
                if (openbachFunction.section === sectionName) {
                    openbachFunction.section = undefined;
                    fields.remove(i);
                    movedFunctions.unshift(openbachFunction);
                }
            }
            movedFunctions.forEach((func) => fields.push(func));
        }
    }

    private changeSection(sectionName: string, index: number) {
        const {fields} = this.props;
        const name = sectionName ? sectionName : undefined;

        const sectionIndex = name ? this.state.sections.indexOf(name) : this.state.sections.length;
        let firstOfItsKind = 0;
        for (; firstOfItsKind < fields.length; ++firstOfItsKind) {
            const functionIndex = this.state.sections.indexOf(fields.get(firstOfItsKind).section);
            if (functionIndex === -1 || functionIndex >= sectionIndex) {
                break;
            }
        }
        while (firstOfItsKind !== fields.length && fields.get(firstOfItsKind).section === name) {
            ++firstOfItsKind;
        }

        if (index < firstOfItsKind) {
            --firstOfItsKind;
        }
        const openbachFunction = fields.get(index);
        openbachFunction.section = name;
        fields.remove(index);
        if (firstOfItsKind === fields.length - 1) {
            fields.push(openbachFunction);
        } else {
            fields.insert(firstOfItsKind, openbachFunction);
        }
    }
};


interface IState {
    newSection: string;
    sections: string[];
};


interface IProps {
    formName: string;
    initialSections: string[];
};
