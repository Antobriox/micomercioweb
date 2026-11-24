import "server-only";

import { createCommercialService } from "./service";
import { createSimulatedAdapter } from "./simulated-adapter";

export const commercial = createCommercialService(createSimulatedAdapter());
