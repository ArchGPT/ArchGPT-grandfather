import { PrismaClient } from "@prisma/client";

const createUser = async () => {

  const hi = 1
  // ><> init
  const prisma = new PrismaClient();
  // ---

  // ><> create
  await prisma.user.create({
    data: {
      name: "John Dough",
      email: `john-${Math.random()}@example.com`,
    },
  });
  const meow = 1
  // ---

  // ><> show
  const count = await prisma.user.count();
  console.log(`There are ${count} users in the database.`)
}
createUser()