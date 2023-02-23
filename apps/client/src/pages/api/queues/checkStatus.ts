import { prisma } from "@pixeleye/db";
import { Queue } from "quirrel/next";

export default Queue<string>("api/queues/checkStatus", async (id) => {
  const build = await prisma.build.findUnique({
    where: {
      id,
    },
    select: {
      status: true,
      Snapshots: {
        select: {
          visualSnapshots: {
            include: {
              VisualDifference: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!build) {
    throw new Error("Build not found");
  }

  if (build.status !== "PENDING") return;

  const finished = build.Snapshots.every((snapshot) => {
    return snapshot.visualSnapshots.every((visualSnapshot) => {
      if (!visualSnapshot.VisualDifference) return true;
      return visualSnapshot.VisualDifference.status !== "PENDING";
    });
  });

  if (finished) {
    await prisma.build.update({
      where: {
        id,
      },
      data: {
        status: "UNREVIEWED",
      },
    });
  }
});
