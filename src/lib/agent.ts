import type { AppInfo } from "@agent-starters/kit/agent"
import { createBroker } from "@agent-starters/kit/tools/broker"
import { webTools } from "@agent-starters/kit/tools/web"

import { agent } from "../../agent.config"
import { reportSave } from "@/lib/reports"

export const app: AppInfo = { id: "open-research", version: "0.1.0" }

/** Every tool this app can run; agent.config.ts decides which the agent may use. */
export const broker = createBroker([...webTools(app), reportSave])

export { agent }
