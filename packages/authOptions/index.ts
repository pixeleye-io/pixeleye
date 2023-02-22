import { authOptions } from "@pixeleye/auth";
import { AuthOptions } from "next-auth";
import _authEvents from "./src/auth";

export const authEvents = _authEvents;

export const options: AuthOptions = {
  ...authOptions,
  events: authEvents,
};
