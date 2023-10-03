import { mergeQueryKeys } from "@lukemorales/query-key-factory";
import { userKeys } from "./user.queries";
import { teamKeys } from "./teams.queries";
import { projectKeys } from "./project.queries";
import { buildKeys } from "./build.queries";
import { inviteKeys } from "./invite.queries";

export const queries = mergeQueryKeys(
  userKeys,
  teamKeys,
  projectKeys,
  buildKeys,
  inviteKeys
);

export * from "./getQueryClient";
