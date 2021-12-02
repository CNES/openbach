import {ILoginCredentials, ILoginForm, IProfileForm, IProfilePermissions} from "../interfaces/login.interface";
import {doApiCall} from "./common";


export function getUser(): Promise<ILoginCredentials> {
    return doApiCall("/login").then((response: Response) => response.json<ILoginCredentials>());
};


export function createUser(profile: IProfileForm): Promise<ILoginCredentials> {
    const {login, password, email, first_name, last_name} = profile;
    const loginForm: ILoginForm = { login, password };
    const request = {action: "create", login, password, email, first_name, last_name};
    return doApiCall("/login", "POST", request)
        .then((response: Response) => new Promise<ILoginCredentials>(
          (resolve) => resolve(authenticateUser(loginForm)),
        ));
};


export function authenticateUser(credentials: ILoginForm): Promise<ILoginCredentials> {
    return doApiCall("/login", "POST", credentials)
        .then((response: Response) => response.json<ILoginCredentials>());
};


export function updateUser(settings: IProfileForm): Promise<ILoginCredentials> {
    return doApiCall("/login", "PUT", settings)
        .then((response: Response) => response.json<ILoginCredentials>());
};


export function deAuthenticateUser(): Promise<{}> {
    return doApiCall("/login", "DELETE", {});
};


export function listUsers(): Promise<ILoginCredentials[]> {
    return doApiCall("/login/users")
        .then((response: Response) => response.json<ILoginCredentials[]>());
};


export function deleteUsers(usernames: string[]): Promise<{}> {
    return doApiCall("/login/users", "DELETE", {usernames});
};


export function updateUsers(permissions: IProfilePermissions[]): Promise<{}> {
    return doApiCall("/login/users", "PUT", {permissions});
};
