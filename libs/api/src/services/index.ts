import { PingAPI } from "./ping";
import { UserAPI } from "./user";
import { BuildAPI } from "./build";
import { ProjectAPI } from "./project";
import { SnapAPI } from "./snapshots";
import { GitAPI } from "./git";
import { TeamAPI } from "./team";
import { InviteAPI } from "./invite";

export type Services = PingAPI &
  UserAPI &
  BuildAPI &
  ProjectAPI &
  SnapAPI &
  GitAPI &
  InviteAPI &
  TeamAPI;
