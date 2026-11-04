import type { Runtime } from "@agent-starters/kit/runtime/types"

/**
 * DEMO: a scripted turn for a fresh clone with no model key. No model and no
 * search provider is called; the sources are real, stable pages, but the
 * excerpts and the answer are written here. Every demo answer opens with a
 * DEMO line, and the run is flagged demo, so the UI badges it.
 */

const SOURCES = [
  {
    title: "Large language model",
    url: "https://en.wikipedia.org/wiki/Large_language_model",
    snippet: "A large language model is a language model trained with self-supervised learning on a vast amount of text.",
  },
  {
    title: "Model Context Protocol",
    url: "https://modelcontextprotocol.io/",
    snippet: "MCP is an open protocol that standardizes how applications provide context and tools to LLMs.",
  },
]

const ANSWER = `**DEMO: scripted answer. No model or search provider was called.** Add a model key in \`.env\` (see README) for live research.

A research agent like this one plans a few focused searches, reads the most relevant pages, and answers with numbered citations. Large language models generate the text [1], and tools such as search are exposed to them through protocols like MCP [2].

Every tool call you see in the activity panel went through the tool layer, which checks the agent's policy and writes an audit row before anything runs.`

const pause = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener("abort", () => (clearTimeout(t), reject(new Error("cancelled"))), { once: true })
  })

export const runDemo: Runtime = async (turn) => {
  const callId = "demo_search"
  turn.emit({ type: "tool_requested", callId, tool: "search.web", input: { query: turn.message.slice(0, 120) } })
  await pause(600, turn.signal)
  for (const s of SOURCES) turn.sources.add({ ...s, provider: "demo" })
  turn.emit({ type: "tool_result", callId, tool: "search.web", ok: true, summary: `DEMO: ${SOURCES.length} fixture sources` })
  turn.emit({ type: "sources", sources: turn.sources.list() })
  for (const word of ANSWER.split(/(?<=\s)/)) {
    turn.emit({ type: "message_delta", text: word })
    await pause(15, turn.signal)
  }
  const usage = { inputTokens: 0, outputTokens: 0 }
  turn.emit({ type: "usage", ...usage })
  return { text: ANSWER, usage }
}
