import {routerReducer} from "react-router-redux";
import {combineReducers} from "redux";
import {reducer as reduxFormReducer} from "redux-form";

import agent from "./agent";
import editor from "./editor";
import global from "./global";
import job from "./job";
import login from "./login";
import logs from "./logs";
import project from "./project";
import projects from "./projects";
import scenario from "./scenario";
import session from "./session";
import snack from "./snackmessage";
import users from "./users";

const rootReducer = combineReducers({
    agent,
    editor,
    form: reduxFormReducer,
    global,
    job,
    login,
    logs,
    project,
    projects,
    routing: routerReducer,
    scenario,
    session,
    snack,
    users,
});

export default rootReducer;
