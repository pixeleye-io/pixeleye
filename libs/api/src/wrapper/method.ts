export interface EndpointTypes {
  req: unknown;
  res: unknown;
}

export type Method<T extends Record<string, EndpointTypes> = {}> = T;
