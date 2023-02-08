import { appRouter } from "@pixeleye/api";
import { Session } from "@pixeleye/auth";
import { prisma } from "@pixeleye/db";

export function serverApi(session: Session | null) {
  return appRouter.createCaller({
    session,
    prisma,
  });
}
