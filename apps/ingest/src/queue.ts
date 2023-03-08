import crypto from "crypto";
import fs from "fs";
import https from "https";
import { prisma } from "@pixeleye/db";
import { generateHash, optimiseImage } from "@pixeleye/node";
import { storage } from "@pixeleye/storage";
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

      let changes = false;

      await Promise.all(
        build.report.snapshots.map((snapshot) => {
          return Promise.all(
            snapshot.imageSnapshots.map(async (imageSnapshot) => {
              const baseline = snapshot.baseline?.imageSnapshots.find(
                (baseSnap) =>
                  baseSnap.viewport === imageSnapshot.viewport &&
                  baseSnap.browser === imageSnapshot.browser,
              );

              if (!baseline) {
                return;
              }
              const randomName = crypto.randomUUID();
              const fileName = `./tmp/img${randomName}.png`;
              const baselineFileName = `./tmp/base${randomName}.png`;

              await downloadFile(imageSnapshot.image.url, fileName);

              await downloadFile(baseline.image.url, baselineFileName);

              const diffName = `./tmp/diff-${Math.random()
                .toString(36)
                .substring(7)}.png`;
              const { match } = await compare(
                fileName,
                baselineFileName,
                diffName,
              );

              fs.rmSync(fileName);
              fs.rmSync(baselineFileName);

              if (match) {
                return;
              }

              changes = true;

              const diffImg = fs.readFileSync(diffName);

              fs.rmSync(diffName);

              const optimised = await optimiseImage(diffImg);
              const hash = generateHash(optimised);

              const { endpoint, ...data } = await storage.getUploadUrl(
                hash,
                "diff",
              );

              const formData = new FormData();

              Object.entries(data.fields).forEach(([key, value]) => {
                formData.append(key, value);
              });

              const blob = new Blob([optimised], { type: "image/png" });

              formData.append("file", blob as any, `${hash}.png`);

              await fetch(data.url, {
                method: "POST",
                body: formData,
              });

              // TODO don't upload if already exists

              const diffImageId = await prisma.diffImage.upsert({
                create: {
                  hash,
                  url: endpoint,
                },
                where: {
                  hash,
                },
                update: {
                  url: endpoint,
                },
              });

              await prisma.imageSnapshot.update({
                where: {
                  id: imageSnapshot.id,
                },
                data: {
                  diffImage: {
                    connect: {
                      id: diffImageId.id,
                    },
                  },
                },
              });
            }),
          );
        }),
      );

      if (!changes) {
        return;
      }

      await prisma.build.update({
        where: {
          id: build.id,
        },
        data: {
          status: "UNREVIEWED",
        },
      });
    },
    { connection },
  );
};
