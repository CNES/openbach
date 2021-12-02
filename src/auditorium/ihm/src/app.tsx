import * as React from "react";
import {render} from "react-dom";
import {Provider} from "react-redux";
import {browserHistory} from "react-router";
import {syncHistoryWithStore} from "react-router-redux";

import injectTapEventPlugin = require("react-tap-event-plugin");

import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";

import "!style!css!postcss!sass!./app.scss";
import "chartist-plugin-tooltips/dist/chartist-plugin-tooltip.css";
import "chartist/dist/chartist.min.css";
import "flexboxgrid/dist/flexboxgrid.min.css";
import "react-select/dist/react-select.css";

import configureStore from "./utils/configure-store";
import Routes from "./utils/routes";
import muiTheme from "./utils/theme";
require("./assets/favicon.ico");


injectTapEventPlugin();

const store = configureStore({});
const history = syncHistoryWithStore(browserHistory, store);
const app = (
    <MuiThemeProvider muiTheme={muiTheme}>
        <Provider store={store}>
            <Routes history={history} />
        </Provider>
    </MuiThemeProvider>
);


render(app, document.getElementById("app-container"));
