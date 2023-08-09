import { cookies } from "next/headers";
import { createAPI } from "./api";

export const sAPI = createAPI({
  cookie: cookies().toString(),
});
