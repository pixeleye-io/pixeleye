import { Method } from "api-typify";
import { SnapImage, PresignedURL } from "../models";

type POST = Method<{
  "/v1/client/snapshots/upload": {
    res: Record<string, SnapImage & Partial<PresignedURL>>;
    req: {
      snapshots: {
        height: number;
        width: number;
        format: string;
        hash: string;
      }[];
    };
  };
}>;

export interface SnapAPI {
  POST: POST;
}
