import React from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';

import Glossary from '../components/Layout/Glossary';
import HomePage from '../components/Layout/HomePage';
import ScenarioIcons from '../components/Layout/ScenarioIcons';
import Projects from '../components/Projects/Projects';
const Agents = React.lazy(() => import('../components/Admin/Agents'));
const Jobs = React.lazy(() => import('../components/Admin/Jobs'));
const Project = React.lazy(() => import('../components/Projects/Project'));
const Scenario = React.lazy(() => import('../components/Scenarios/SelectedScenario'));
const Settings = React.lazy(() => import('../components/Users/Settings'));
const Users = React.lazy(() => import('../components/Users/Manage'));


const AdminRouter = () => (
    <Routes>
        <Route path="agents" element={<React.Suspense><Agents /></React.Suspense>} />
        <Route path="jobs" element={<React.Suspense><Jobs /></React.Suspense>} />
        <Route path="users" element={<React.Suspense><Users /></React.Suspense>} />
        <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
);


const ProjectRouter = () => (
    <Routes>
        <Route path="scenario/:scenarioId" element={<React.Suspense><Project><Scenario /></Project></React.Suspense>} />
        <Route path="/" element={<React.Suspense><Project /></React.Suspense>} />
        <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
);


const ProjectsRouter = () => (
    <Routes>
        <Route path="/" element={<Projects />} />
        <Route path=":projectId/*" element={<ProjectRouter />} />
    </Routes>
);


const AppRouter = () => (
    <HomePage>
        <Routes>
            <Route path="admin/*" element={<AdminRouter />} />
            <Route path="settings" element={<React.Suspense><Settings /></React.Suspense>} />
            <Route path="glossary" element={<Glossary />} />
            <Route path="icons" element={<ScenarioIcons />} />
            <Route path="project/*" element={<ProjectsRouter />} />
            <Route path="/" element={<Projects />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
    </HomePage>
);


const Router = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/app/*" element={<AppRouter />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
    </BrowserRouter>
);


export default Router;
