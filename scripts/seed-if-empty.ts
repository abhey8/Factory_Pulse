import { connectMongoDB, disconnectMongoDB } from "../src/lib/mongo";
import { AIEventModel } from "../src/models/aiEvent.model";
import { WorkerModel } from "../src/models/worker.model";
import { WorkstationModel } from "../src/models/workstation.model";
import { seedDatabase } from "../src/services/seedData";

async function main() {
  await connectMongoDB();
  const [workerCount, workstationCount, eventCount] = await Promise.all([
    WorkerModel.countDocuments(),
    WorkstationModel.countDocuments(),
    AIEventModel.countDocuments()
  ]);

  if (workerCount >= 6 && workstationCount >= 6 && eventCount > 0) {
    console.log(
      `Seed skipped: found ${workerCount} workers, ${workstationCount} workstations, ${eventCount} events.`
    );
    return;
  }

  const result = await seedDatabase({ reset: false });
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
