import { mergeQueryKeys } from "@lukemorales/query-key-factory";
import { userKeys } from "./user.queries";
import { teamKeys } from "./teams.queries";

export const queries = mergeQueryKeys(userKeys, teamKeys);
