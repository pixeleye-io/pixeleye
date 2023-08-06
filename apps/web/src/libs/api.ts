import { Services } from "@pixeleye/api";
import { getAPI } from "api-typify"

const endpoint = "http://localhost:5000/v1"

interface CustomProps {
    headers?: Record<string, string>;
    next?: {
        revalidate?: number | false;
        tags?: string[];
    };
}

export const API = getAPI<Services, CustomProps>(endpoint, (url, options) =>
    fetch(url, {
        ...options,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...options?.headers,
        },
        credentials: "include",
    }).then((res) => {
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(res);
    })
);

