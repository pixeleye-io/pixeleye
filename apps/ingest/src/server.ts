import { IncomingMessage, Server, ServerResponse } from "http";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { FastifyAdapter } from "@bull-board/fastify";
import fastify, { FastifyInstance, FastifyRequest } from "fastify";
import { env } from "./env.js";
import { createQueue, setupBuildQueueProcessor } from "./queue.js";

interface AddJobQueryString {
  buildId: string;
}

export const run = async () => {
  const buildQueue = createQueue("buildQueue");
  await setupBuildQueueProcessor(buildQueue.name);

  const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
    fastify();

  //   server.register(require("@fastify/basic-auth"), { validate, authenticate });

  const serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: [new BullMQAdapter(buildQueue)],
    serverAdapter,
  });
  serverAdapter.setBasePath("/");
  server.register(serverAdapter.registerPlugin(), {
    prefix: "/",
    basePath: "/",
  });

  server.get(
    "/ingest/build",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            buildId: { type: "string" },
          },
        },
      },
    },
    (req: FastifyRequest<{ Querystring: AddJobQueryString }>, reply) => {
      if (req.query == null || req.query.buildId == null) {
        reply
          .status(400)
          .send({ error: "Requests must contain both an id and a email" });

        return;
      }

      const { buildId } = req.query;
      buildQueue.add(`WelcomeEmail-${buildId}`, { buildId });

      reply.send({
        ok: true,
      });
    },
  );

  await server.listen({ port: env.PORT, host: "0.0.0.0" });
  console.log(
    `To populate the queue and demo the UI, run: curl https://${env.RAILWAY_STATIC_URL}/add-job?id=1&email=hello%40world.com`,
  );
};
