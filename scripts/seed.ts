import { connectMongoDB, disconnectMongoDB } from "../src/lib/mongo";
import { seedDatabase } from "../src/services/seedData";

async function main() {
  await connectMongoDB();
  const result = await seedDatabase({ reset: true });
  console.log(
    `Seed complete: ${result.workers} workers, ${result.workstations} workstations, ${result.events} events.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMongoDB();
  });
