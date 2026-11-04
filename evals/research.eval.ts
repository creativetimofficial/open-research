/**
 * Live source-coverage eval: run real research questions through the lite
 * runtime and check the citations, not the prose. Needs OPENAI_API_KEY (and
 * whatever SEARCH_PROVIDER needs); skipped otherwise. Run with `pnpm eval`.
 *
 * Checks per question:
 *   - an answer came back, citing at least two retrieved sources;
 *   - every [n] in the answer refers to a source a tool actually returned
 *     (no invented citations);
 *   - the cited URLs answer (2xx/3xx) when fetched.
 */

import { describe, expect, it } from "vitest"

import { loadSettings } from "@agent-starters/kit/config"
import { openDb, useDb } from "@agent-starters/kit/db"
import { runLite } from "@agent-starters/kit/runtime/lite"
import { SourceLedger } from "@agent-starters/kit/tools/types"

import questions from "./questions.json"
import { agent, app, broker } from "@/lib/agent"

const settings = loadSettings()
const live = Boolean(settings.model.apiKey)

describe.skipIf(!live)("research eval", () => {
  useDb(openDb(":memory:"))

  for (const q of questions) {
    it(q.id, async () => {
      const sources = new SourceLedger()
      const outcome = await runLite({
        runId: `eval-${q.id}`,
        threadId: `eval-${q.id}`,
        agent,
        broker,
        app,
        toolCalls: { count: 0 },
        history: [],
        message: q.question,
        settings,
        signal: AbortSignal.timeout(170_000),
        emit: () => {},
        sources,
      })
      const retrieved = new Map(sources.list().map((s) => [s.n, s.url]))
      const cited = [...new Set([...outcome.text.matchAll(/\[(\d{1,3})\](?!\()/g)].map((m) => Number(m[1])))]

      expect(outcome.text.length).toBeGreaterThan(200)
      expect(cited.length).toBeGreaterThanOrEqual(2)
      for (const n of cited) expect(retrieved.has(n), `[${n}] cites a source no tool returned`).toBe(true)

      for (const n of cited.slice(0, 3)) {
        const res = await fetch(retrieved.get(n)!, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(15_000) }).catch(() => null)
        expect(res && res.status < 400, `[${n}] ${retrieved.get(n)} did not resolve`).toBe(true)
      }
    })
  }
})
