import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { start } from "./server";
import { fetch } from "undici";
import { Server, IncomingMessage, ServerResponse } from "http";

describe("booth server", () => {
  let server: {
    close: () => Server<typeof IncomingMessage, typeof ServerResponse>;
  };
  beforeAll(async () => {
    server = await start({
      build: {
        id: "test",
        status: "uploading",
        createdAt: "test",
        updatedAt: "test",
        branch: "test",
        buildNumber: 1,
        errors: [],
        projectID: "test",
        sha: "test",
      },
      endpoint: "http://localhost:5000/v1",
      token: "",
      port: 3003,
    });
  });

  afterAll(() => {
    server?.close();
  });

  test("should ping the server", async () => {
    const res = await fetch("http://localhost:3003/ping");
    expect(res?.status).toBe(200);
  });
});
