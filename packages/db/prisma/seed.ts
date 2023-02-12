import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createUsers(names: string[]) {
  return prisma.$transaction(async (tx) => {
    await tx.user.createMany({
      data: names.map((name) => ({
        name,
        email: `${name}@prisma.io`,
      })),
      skipDuplicates: true,
    });
    const users = await tx.user.findMany({
      where: {
        name: {
          in: names,
        },
      },
    });
    await tx.session.createMany({
      data: users.map((user) => ({
        userId: user.id,
        expires: new Date(Date.now() * 2),
        sessionToken: "sessionToken",
      })),
      skipDuplicates: true,
    });
  });
}

const useNames = ["projectAPI"];

async function main() {
  await createUsers(useNames);
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
