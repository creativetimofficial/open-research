import { openDb, useDb } from "@agent-starters/kit/db"
import { SourceLedger } from "@agent-starters/kit/tools/types"
import { beforeEach, describe, expect, it } from "vitest"

import { agent, broker } from "@/lib/agent"
import { getReport, listReports } from "@/lib/reports"

beforeEach(() => useDb(openDb(":memory:")))

const ctx = (sources = new SourceLedger()) => ({
  agent,
  runId: "r1",
  threadId: null,
  initiator: "lite" as const,
  signal: new AbortController().signal,
  emit: () => {},
  sources,
  toolCalls: { count: 0 },
})

describe("Open Research tools", () => {
  it("offers search, page reading and report saving", () => {
    expect(broker.offeredTools(agent).map((t) => t.name).sort()).toEqual(["page_read", "report_save", "search_web"])
  })

  it("saves a report only after approval, with its numbered sources appended", async () => {
    const sources = new SourceLedger()
    sources.add({ title: "MCP", url: "https://modelcontextprotocol.io/", snippet: "", provider: "test" })
    const input = { title: "MCP overview", markdown: "MCP is an open protocol for tools [1]." }

    const declined = await broker.runTool("report_save", input, "c1", ctx(sources), async () => "denied")
    expect(declined.ok).toBe(false)
    expect(listReports()).toEqual([])

    const approved = await broker.runTool("report_save", input, "c2", ctx(sources), async () => "approved")
    expect(approved.ok).toBe(true)
    const [row] = listReports()
    expect(getReport(row.id)?.markdown).toContain("1. [MCP](https://modelcontextprotocol.io/)")
  })
})
