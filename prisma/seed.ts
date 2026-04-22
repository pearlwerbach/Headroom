import { ensureDemoUser } from "../src/lib/demo-user";
import { disconnectPrisma } from "../src/lib/prisma";

async function main() {
  await ensureDemoUser(new Date());
}

main()
  .then(async () => {
    await disconnectPrisma();
  })
  .catch(async (error) => {
    console.error(error);
    await disconnectPrisma();
    process.exit(1);
  });
