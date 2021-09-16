import "whatwg-fetch";


export function doApiCall(route: string, method: string = "GET", body?: { [propName: string]: any; }, cancelError: boolean = false) {
    const fetch_config: RequestInit = {method, credentials: "same-origin"};
    if (body !== undefined) {
        fetch_config.body = JSON.stringify(body);
        fetch_config.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        };
    }

    return apiCall(route, fetch_config, cancelError);
};


export function doApiJsonCall(route: string, json: File) {
    return apiCall(route, {
        body: json,
        credentials: "same-origin",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        method: "POST",
    });
};


export function doApiMultipartCall(route: string, multipart: { [formPart: string]: any; }) {
    const data = new FormData();
    for (const property in multipart) {
        if (multipart.hasOwnProperty(property)) {
            data.append(property, multipart[property]);
        }
    }

    return apiCall(route, {
        body: data,
        credentials: "same-origin",
        headers: {Accept: "application/json"},
        method: "POST",
    });
};


export const checkStatus = (response: Response, cancelError: boolean = false) => {
    if (response.ok) {
        return new Promise<Response>((resolve) => resolve(response));
    } else {
        const errorMessage = response.statusText;
        return response.json().catch((onError) => { throw new Error(errorMessage); }).then((body: any) => {
            if (cancelError) { return new Promise<Response>((resolve, reject) => reject(body)); }
            else if (body.hasOwnProperty("error")) { throw new Error(body.error); }
            else if (body.hasOwnProperty("msg")) { throw new Error(body.msg); }
            else { throw new Error(errorMessage); }
        });
    }
};


function apiCall(route: string, config: RequestInit, cancelError: boolean = false) {
    return fetch(encodeURI("/openbach" + route), config).then((response: Response) => checkStatus(response, cancelError));
};


export function getVersion(): Promise<{openbach_version: string}> {
    return doApiCall("/version").then((response: Response) => response.json<{openbach_version: string}>());
};


export function openURL(route: string, downloadName?: string, contentType?: string) {
    const a = document.createElement("A") as HTMLAnchorElement;
    if (downloadName) {
        a.download = downloadName;

        if (contentType) {
            // Route is actually some data, convert it to Blob URL first
            // See https://stackoverflow.com/a/16762555/5069029 for rationale
            const blob = new Blob([route], {type: contentType});
            a.href = URL.createObjectURL(blob);
        } else {
            a.href = encodeURI(route);
        }
    } else {
        a.href = encodeURI(route);
    }
    a.target = "_blank";
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent("click"));
    document.body.removeChild(a);
};
