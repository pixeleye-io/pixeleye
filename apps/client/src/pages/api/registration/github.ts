import { NextApiRequest, NextApiResponse } from "next";
import { authOptions, getServerSession } from "@pixeleye/auth";
import { prisma } from "@pixeleye/db";
import { getOctokit, getUserOctokit } from "@pixeleye/github";
import { useSession } from "next-auth/react";
import { z } from "zod";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // console.log(session);

  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const installId = z.coerce.number().safeParse(req.query.installation_id);

  const action = z.string().safeParse(req.query.setup_action);

  if (!installId.success)
    return res
      .status(400)
      .json({ error: "Missing or invalid installation_id" });

  if (!action.success)
    return res.status(400).json({ error: "Missing or invalid setup_action" });

  const installation_id = installId.data;
  const setup_action = action.data;

  const session = await getServerSession({ req, res });

  try {
    const octokit = await getOctokit(installId.data);

    const installData = await octokit.request(
      "GET /app/installations/{installation_id}",
      {
        installation_id,
      },
    );

    if (installData.status !== 200)
      return res.status(500).json({ error: "Internal server error" });

    // console.log(
    //   await octokit.request("GET /users/{username}/installation", {
    //     username: "AlfieJones",
    //   }),
    // );

    // console.log(installData.data);

    const source = await prisma.source.findUnique({
      where: {
        githubInstallId: installation_id,
      },
    });

    const account = await prisma.account.findFirst({
      where: { provider: "github", userId: session?.user.id },
    });

    console.log(source, account);

    if (
      (setup_action !== "install" && source) ||
      (setup_action !== "update" && !source) ||
      !account
    )
      return res.status(400).json({ error: "Invalid args" });

    // if (setup_action === "install") {
    //   await prisma.source.create({
    //     data: {
    //       githubInstallId: installation_id,
    //       type: "GITHUB",

    // console.log(installData.data);
  } catch (error) {
    // console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.status(200).json({ success: true });
}
