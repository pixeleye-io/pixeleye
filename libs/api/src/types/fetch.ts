import { StandardError } from "./error";
import { EndpointTypes, Method } from "./method";
import { PathParams } from "./parameters";

type ExtractRes<T extends EndpointTypes> = T["res"];

type ExtractReq<T extends EndpointTypes> = T extends undefined
  ? undefined
  : T["req"];

export interface BaseFetchProps extends Omit<RequestInit, "body" | "method"> {
  suppressError?: boolean;
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type OptionalParams<
  T extends Record<string, EndpointTypes>,
  U extends keyof T,
> = PathParams<T, U> extends never
  ? { params?: undefined }
  : { params: UnionToIntersection<PathParams<T, U>> };

type OptionalBody<
  T extends Record<string, EndpointTypes>,
  U extends keyof T,
> = ExtractReq<T[U]> extends undefined
  ? { body?: undefined }
  : { body: ExtractReq<T[U]> };

export function replaceParams(
  url: string,
  params: Record<string, string> = {}
) {
  let parsedUrl = url;
  for (const key in params) {
    const value = params[key];

    const regex = new RegExp(`{\\??${key}}`, "g");
    parsedUrl = parsedUrl.replaceAll(regex, value);
  }
  return parsedUrl;
}

export const fetchWrapper =
  <Error extends Record<string, any> = StandardError>(baseEndpoint: string) =>
  <T extends Method<Record<string, EndpointTypes>>>(
    method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH"
  ) =>
  <U extends keyof T>(
    url: U,
    {
      params,
      suppressError,
      ...rest
    }: BaseFetchProps & OptionalParams<T, U> & OptionalBody<T, U>
  ): Promise<ExtractRes<T[U]>> => {
    const fullUrl = `${baseEndpoint}${replaceParams(
      url as string,
      params as Record<string, string>
    )}`;
    return fetch(fullUrl, { ...rest, method } as RequestInit).then(
      async (res) => {
        if (!res.ok) {
          const err = (await res.json()) as Error;
          return Promise.reject(err);
        }
        return res.json();
      }
    );
  };
