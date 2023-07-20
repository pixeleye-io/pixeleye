import { PingAPI } from "./ping";
import { UserAPI } from "./user";
import { BuildAPI } from "./build";
import { ProjectAPI } from "./project";

export type Services = PingAPI & UserAPI & BuildAPI & ProjectAPI;
