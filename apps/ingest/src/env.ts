import { envsafe, port, str } from "envsafe";

export const env = envsafe({
  REDISHOST: str(),
  REDISPORT: port(),
  REDISUSER: str(),
  REDISPASSWORD: str(),
  PORT: port({
    devDefault: 3005,
  }),
  RAILWAY_STATIC_URL: str({
    devDefault: "http://localhost:3005",
  }),
});
