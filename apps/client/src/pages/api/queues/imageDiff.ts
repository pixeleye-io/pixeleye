import fs from "fs";
import https from "https";
import { prisma } from "@pixeleye/db";
import { generateHash, optimiseImage } from "@pixeleye/node";
import { storage } from "@pixeleye/storage";
import { compare } from "odiff-bin";
import { Queue } from "quirrel/next";
import statusQuery from "./checkStatus";

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

export default Queue<{
  visualDifferenceId: string;
  buildId: string;
}>("api/queues/imageDiff", async ({ visualDifferenceId, buildId }) => {
  const VisualDifference = await prisma.visualDifference.findUnique({
    where: {
      id: visualDifferenceId,
    },
    include: {
      baseImage: true,
      image: true,
    },
  });

  if (!VisualDifference) {
    throw new Error("VisualDifference not found");
  }

  if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp");

  const images = [VisualDifference.baseImage, VisualDifference.image];

  await Promise.all(
    images.map(async ({ url, hash }) => downloadFile(url, `./tmp/${hash}.png`)),
  );

  const diffName = Math.random().toString();

  await compare(
    `./tmp/${images[0]!.hash}.png`,
    `./tmp/${images[1]!.hash}.png`,
    `./tmp/diff-${diffName}.png`,
  )
    .catch((err) => {
      console.log(err);
    })
    .then((res) => {
      console.log(res);
    });

  //TODO upload diff image to s3

  const diffImg = fs.readFileSync(`./tmp/diff-${diffName}.png`);

  const optimised = await optimiseImage(diffImg);
  const hash = generateHash(optimised);

  const { endpoint, ...data } = await storage.getUploadUrl(hash, "diff");

  const formData = new FormData();

  Object.entries(data.fields).forEach(([key, value]) => {
    formData.append(key, value as unknown as string);
  });

  const blob = new Blob([optimised], { type: "image/png" });

  formData.append("file", blob as any, `${hash}.png`);

  await fetch(data.url, {
    method: "POST",
    body: formData,
  });

  await prisma.visualDifference.update({
    where: {
      id: visualDifferenceId,
    },
    data: {
      status: "COMPLETED",
      diffImage: {
        connectOrCreate: {
          where: {
            hash,
          },
          create: {
            hash,
            url: endpoint,
          },
        },
      },
    },
  });

  await statusQuery.enqueue(buildId, {
    id: buildId,
    override: true,
    delay: 5000,
  });
});
