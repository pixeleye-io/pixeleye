import aws from "./providers/aws";
import local from "./providers/local";

const interfaces = {
  local,
  aws,
} as const;

export default interfaces[
  process.env.STORAGE_PROVIDER as keyof typeof interfaces
];
