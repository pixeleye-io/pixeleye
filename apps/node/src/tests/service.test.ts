import { createUpload, uploadImage } from "../service";

describe("Service", () => {
  it("should create upload", async () => {
    const img = Buffer.from("test");
    console.log(process.env.PIXELEYE_URL);

    const result = await createUpload(img);
    expect(result).toEqual({
      exists: false,
      url: "http://localhost:3000/api/storage/image/9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    });
  });

  it("should upload", async () => {
    const img = Buffer.from("testtest");

    const result = await uploadImage(img);
    expect(result).toEqual(undefined);
  });
});
