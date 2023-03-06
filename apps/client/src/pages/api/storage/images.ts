import { promises as fs } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File, IncomingForm } from "formidable";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const form = formidable({});
  console.log("HIHIHIHIHOIJDSLIKFJDSLK:FJ:LDSKFJ:LKDSJF:LKSDJ:FLk");
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error", err);
      return res.status(500).json({ error: "Error" });
    }
    if (!files || Array.isArray(files))
      return res.status(400).json({ error: "Bad upload" });

    await sharp(files.filepath as any).toFile(
      __dirname + "/uploads/" + "testsetest" + ".png",
    );

    res.status(200).json({ data: "ok" });
  });
}
