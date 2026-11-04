import { getDb, now, registerSchema } from "@agent-starters/kit/db"
import type { ToolDefinition } from "@agent-starters/kit/tools/types"
import { z } from "zod"

registerSchema(`
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  thread_id TEXT,
  title TEXT NOT NULL,
  markdown TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`)

export function saveReport(threadId: string | null, title: string, markdown: string): string {
  const id = crypto.randomUUID()
  getDb()
    .prepare("INSERT INTO reports (id, thread_id, title, markdown, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, threadId, title.slice(0, 200), markdown, now())
  return id
}

export function listReports(): Array<{ id: string; title: string; created_at: string }> {
  return getDb().prepare("SELECT id, title, created_at FROM reports ORDER BY created_at DESC").all() as unknown as Array<{
    id: string
    title: string
    created_at: string
  }>
}

export function getReport(id: string): { id: string; title: string; markdown: string; created_at: string } | undefined {
  return getDb().prepare("SELECT id, title, markdown, created_at FROM reports WHERE id = ?").get(id) as unknown as
    | { id: string; title: string; markdown: string; created_at: string }
    | undefined
}

export const reportSave = {
  id: "report.save",
  name: "report_save",
  description: "Save a finished research report (markdown, with its numbered sources) to the user's reports. Requires the user's approval.",
  input: z.object({
    title: z.string().min(3).max(200),
    markdown: z.string().min(20).max(200_000),
  }),
  sideEffect: true,
  async execute({ title, markdown }, ctx) {
    const sources = ctx.sources.list()
    const withSources = sources.length
      ? `${markdown}\n\n## Sources\n\n${sources.map((s) => `${s.n}. [${s.title}](${s.url})`).join("\n")}\n`
      : markdown
    const id = saveReport(ctx.threadId, title, withSources)
    return { content: `Saved report "${title}" (id ${id}).`, summary: `Saved report "${title.slice(0, 80)}"` }
  },
} satisfies ToolDefinition<{ title: string; markdown: string }> as unknown as ToolDefinition<unknown>
