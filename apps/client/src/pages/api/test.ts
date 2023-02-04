import { NextApiRequest, NextApiResponse } from "next";
import { githubApp } from "@pixeleye/github";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // const test = (await githubApp.getInstallationOctokit(596110341)).request(
  //   "GET /users/{user}/repos",
  //   {
  //     org: "pixeleye-io",
  //   },
  // );

  console.log(
    await (
      await githubApp.getInstallationOctokit(33842202)
    ).request("GET /orgs/{org}/repos", {
      org: "pixeleye-io",
    }),
  );

  // console.log(test);

  await githubApp.eachInstallation(({ installation }) => {
    console.log(installation.id);
  });
  res.status(200).json({ name: "John Doe" });
}
