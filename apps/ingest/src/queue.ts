import fs from "fs";
import https from "https";
import { prisma } from "@pixeleye/db";
import { ConnectionOptions, Queue, Worker } from "bullmq";
import { compare } from "odiff-bin";
import { env } from "./env.js";

const connection: ConnectionOptions = {
  host: env.REDISHOST,
  port: env.REDISPORT,
  username: env.REDISUSER,
  password: env.REDISPASSWORD,
};

export const createQueue = (name: string) => new Queue(name, { connection });

async function downloadFile(url: string | null, targetFile: string) {
  return await new Promise((resolve, reject) => {
    if (!url) {
      return reject(new Error("No url provided"));
    }
    https
      .get(url, (response) => {
        const code = response.statusCode ?? 0;

        if (code >= 400) {
          return reject(new Error(response.statusMessage));
        }

        // handle redirects
        if (code > 300 && code < 400 && !!response.headers.location) {
          return resolve(downloadFile(response.headers.location, targetFile));
        }

        // save the file to disk
        const fileWriter = fs.createWriteStream(targetFile).on("finish", () => {
          resolve({});
        });

        response.pipe(fileWriter);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

export const setupBuildQueueProcessor = (queueName: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  new Worker(
    queueName,
    async (job) => {
      const build = await prisma.build.findUnique({
        where: {
          id: job.data.buildId,
        },
        include: {
          report: {
            include: {
              snapshots: {
                include: {
                  imageSnapshots: {
                    include: {
                      image: true,
                    },
                  },
                  baseline: {
                    include: {
                      imageSnapshots: {
                        include: {
                          image: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!build) {
        throw new Error("Build not found");
      }

      await Promise.all(
        build.report.snapshots.map((snapshot) => {
          return Promise.all(
            snapshot.imageSnapshots.map(async (imageSnapshot) => {
              const fileName = `./tmp/${imageSnapshot.image.id}.png`;
              const baselineFileName = `./tmp/${snapshot.baselineId}.png`;
              const baseline = snapshot.baseline?.imageSnapshots.find(
                (baseSnap) =>
                  baseSnap.viewport === imageSnapshot.viewport &&
                  baseSnap.browser === imageSnapshot.browser,
              );

              if (!baseline) {
                return;
              }

              await downloadFile(imageSnapshot.image.url, fileName);

              await downloadFile(baseline.image.url, baselineFileName);

              const diffName = Math.random().toString();

              await compare(
                fileName,
                baselineFileName,
                `./tmp/diff-${diffName}.png`,
              ).catch((e) => {
                console.log(e);

                fs.rmSync(fileName);
                fs.rmSync(baselineFileName);
              });
            }),
          );
        }),
      );
    },
    { connection },
  );
};
