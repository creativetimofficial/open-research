import { baseCapabilities, type CapabilityRow } from "@agent-starters/kit/capabilities"

import { suggestions, tagline } from "../../agent.config"
import { agent, app } from "@/lib/agent"

/** The lite-vs-Hermes matrix shown under Setup, for this agent. */
export const MATRIX: CapabilityRow[] = [
  { capability: "Web search with numbered citations", lite: "yes", hermes: "yes" },
  { capability: "Read web pages (SSRF-guarded)", lite: "yes", hermes: "yes" },
  { capability: "Approval before side effects", lite: "yes", hermes: "yes" },
  { capability: "Audit row before every tool call", lite: "yes", hermes: "yes" },
  { capability: "Save reports", lite: "yes", hermes: "yes" },
  { capability: "Memory across threads", lite: "no", hermes: "yes", note: "Hermes memory toolset" },
  { capability: "Files and terminal in a sandbox", lite: "no", hermes: "off-by-default", note: "Enable the file / terminal toolsets in hermes/config.yaml" },
  { capability: "Browser for JavaScript-heavy pages", lite: "no", hermes: "off-by-default", note: "Hermes browser_exec; needs the terminal toolset" },
  { capability: "Scheduled research (cron)", lite: "no", hermes: "not-in-ui-yet", note: "Hermes cron works; this UI does not manage schedules yet" },
  { capability: "Runs on serverless hosting (Vercel)", lite: "yes", hermes: "no", note: "Hermes needs a long-running container" },
]

export function capabilities() {
  return {
    ...baseCapabilities(app, MATRIX),
    agent: { id: agent.id, name: agent.name, tagline, suggestions },
    policies: agent.tools,
  }
}

export type Capabilities = ReturnType<typeof capabilities>
