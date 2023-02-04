import { NextApiRequest, NextApiResponse } from "next";
import { octokit } from "@pixeleye/github";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log(
    await (
      await octokit(33842202)
    ).request("GET /orgs/{org}/repos", {
      org: "pixeleye-io",
    }),
  );

  res.status(200).json({ name: "John Doe" });
}
