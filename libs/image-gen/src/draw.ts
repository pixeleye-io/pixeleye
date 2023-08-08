import { createCanvas } from "canvas";

interface GenerateImageParams {
  width?: number;
  height?: number;
}

export function generateImage({
  width = 128,
  height = 128,
}: GenerateImageParams = {}) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.fillStyle = "#EFB8C7";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#FFF";
  context.fillText("Pixeleye.io", 0, 0);

  const buffer = canvas.toBuffer("image/png");

  return buffer;
}
