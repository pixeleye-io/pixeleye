import { EndpointTypes } from './method';

export type PathParams<
  T extends Record<string, EndpointTypes>,
  U extends keyof T
> = U extends `${infer _V}{${infer W}}${infer X}`
  ? W extends `?${infer Y}`
    ? Partial<Record<Y, string>> | PathParams<T, X>
    : Record<W, string> | PathParams<T, X>
  : never;