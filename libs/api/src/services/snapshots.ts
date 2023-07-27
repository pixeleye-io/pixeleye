import { Method, Routes } from "api-typify";
import { SnapImage, PresignedURL } from "../models";

type POST = Method<{
  "/snapshots/upload/{hash}": {
    res: SnapImage & Partial<PresignedURL>;
  };
}>;

export interface SnapAPI {
  POST: POST;
}
