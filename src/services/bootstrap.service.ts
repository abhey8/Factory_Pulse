import { getFactoryMetrics } from "./metrics.service";
import { listWorkers } from "./worker.service";
import { listWorkstations } from "./workstation.service";

export async function getBootstrapData() {
  const [workers, workstations, factoryMetrics] = await Promise.all([
    listWorkers(),
    listWorkstations(),
    getFactoryMetrics({ from: undefined, to: undefined })
  ]);

  return {
    workers,
    workstations,
    factory: factoryMetrics.factory,
    metrics_window: {
      from: factoryMetrics.window.start?.toISOString() ?? null,
      to: factoryMetrics.window.end?.toISOString() ?? null
    }
  };
}
