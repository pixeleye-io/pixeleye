import { fetchWrapper } from "./types/fetch";
import { Services } from "./services";

const wrapper = fetchWrapper("http://localhost:3000/api/v1");

export const API = {
  get: wrapper<Services["get"]>("GET"),
};

export default API;
