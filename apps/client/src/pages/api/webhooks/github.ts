import { createHmac, timingSafeEqual } from "crypto";
import { buffer } from "node:stream/consumers";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

interface Installation {
  action: string;
}
function installation(body: Installation, res: NextApiResponse) {
  return res.status(200);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const sig = Buffer.from(
    (req.headers["x-hub-signature-256"] as string) || "",
    "utf8",
  );

  const rawBody = await buffer(req);
  const body = JSON.parse(rawBody.toString());

  const hmac = createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET!);
  const digest = Buffer.from(
    "sha256=" + hmac.update(rawBody).digest("hex"),
    "utf8",
  );

  if (sig.length !== digest.length || !timingSafeEqual(digest, sig)) {
    console.log("Unauthorized github webhook request", req.headers);
    return res.status(401);
  }

  console.log(req.headers);

  switch (req.headers["x-github-event"]) {
    case "installation":
      return installation(body, res);
    default:
      return res.status(200);
  }
}
