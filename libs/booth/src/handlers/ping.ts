import type { RequestHandler } from "express";

export const pingHandler: RequestHandler = (_, res) => {
  res.end("pong");
};
