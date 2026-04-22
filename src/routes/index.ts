import { Router } from "express";
import { adminRouter } from "./admin.routes";
import { bootstrapRouter } from "./bootstrap.routes";
import { eventRouter } from "./event.routes";
import { metricsRouter } from "./metrics.routes";
import { workerRouter } from "./worker.routes";
import { workstationRouter } from "./workstation.routes";

export const apiRouter = Router();

apiRouter.use(bootstrapRouter);
apiRouter.use(workerRouter);
apiRouter.use(workstationRouter);
apiRouter.use(eventRouter);
apiRouter.use(metricsRouter);
apiRouter.use(adminRouter);
