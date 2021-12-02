export interface ILoginCredentials {
    username: string;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    is_user: boolean;
    is_admin: boolean;
    favorites: {[project: string]: string[]};
};


export interface ILoginForm {
    login: string;
    password: string;
};


export interface IProfileForm {
    login: string;
    password?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
};


export interface IProfilePermissions {
    login: string;
    active: boolean;
    admin: boolean;
};
