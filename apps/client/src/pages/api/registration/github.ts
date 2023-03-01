import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { serverApi } from "~/lib/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // console.log(session);

  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const installationId = z.coerce.number().safeParse(req.query.installation_id);

  const action = z.string().safeParse(req.query.setup_action);

  if (!installationId.success)
    return res
      .status(400)
      .json({ error: "Missing or invalid installation_id" });

  if (!action.success)
    return res.status(400).json({ error: "Missing or invalid setup_action" });

  const id = await serverApi({} as any).github.updateInstallation({
    installationId: installationId.data,
  });

  return res.redirect(302, `/add?team=${id}`);
}
