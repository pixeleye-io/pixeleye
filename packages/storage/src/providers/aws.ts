import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { StorageProvider } from "./types";

const REGION = "eu-west-2";

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

async function getUploadUrl(hash: string, projectId: string) {
  const post = await createPresignedPost(s3Client, {
    Bucket: "pixeleye-images-dev",
    Key: `${projectId}/${hash}`,
    Fields: {
      acl: "public-read",
      "Content-Type": "png",
    },
    Expires: 600, // seconds
    Conditions: [
      ["content-length-range", 0, 1048576], // up to 1 MB
    ],
  });

  return {
    ...post,
    endpoint: `https://pixeleye-images-dev.s3.eu-west-2.amazonaws.com/${projectId}/${hash}`,
  };
}

export default {
  getUploadUrl,
} as StorageProvider;
