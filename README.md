# Open Research

An open-source research agent. Ask a question; it plans searches, reads the most relevant pages, and answers with numbered citations you can check. Every tool call goes through one tool layer that applies the agent's policies, asks you before anything with side effects, and writes an audit row first.

It runs two ways, from the same app:

| | **Lite** | **Hermes** |
|---|---|---|
| Start | `pnpm dev` | `docker compose up` |
| Where the agent loop runs | in this Next.js server | in a [Hermes Agent](https://github.com/NousResearch/hermes-agent) container |
| Search with citations, page reading, approvals, audit, reports | yes | yes |
| Memory across threads | no | yes |
| Files, terminal, browser in a sandbox | no | available, off by default |
| Scheduled research | no | Hermes cron works; this UI does not manage schedules yet |
| Serverless hosting (Vercel) | yes | no (needs a long-running container) |

The app shows this matrix under **Setup**, with the live status of each search provider.

> **Status: early.** Verified in CI: install, typecheck, unit tests, production build, and Hermes starting with the app's tools loaded. Search providers are marked `implemented-untested` until the live eval has run against them. No model or search call is made in CI without a configured key.

## Quick start (lite)

Needs Node.js 22.13+ (24 recommended; the Docker images use 24) and pnpm. From the repository root:

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open http://localhost:3000. With no model key, it runs a **DEMO**: a scripted turn, clearly labelled, so you can see the flow. Add a key for live research.

## Choose a model

Any OpenAI-compatible `chat.completions` endpoint with tool calling works. Set it in `.env`:

| Route | `OPENAI_BASE_URL` | `MODEL` | Key |
|---|---|---|---|
| **CompanyFabric** (default) | `https://api.companyfabric.com/v1` | `companyfabric/auto` | `sk-cf-…` from [companyfabric.com/dashboard/keys](https://companyfabric.com/dashboard/keys) |
| OpenAI | `https://api.openai.com/v1` | e.g. `gpt-5.5` | an OpenAI key |
| Local (Ollama, LM Studio, vLLM) | your server's `/v1` URL | a model it serves that supports tools | as your server requires |

CompanyFabric gives one key for every major model, billed per token from a prepaid balance (the exact charge of each turn comes back with the answer). `companyfabric/auto` picks a suitable model per request, and new accounts get starter credit for it.

## Choose a search provider

| `SEARCH_PROVIDER` | Needs | Notes |
|---|---|---|
| `parallel` (default) | nothing | Parallel's free, rate-limited Search MCP tier. `PARALLEL_API_KEY` lifts the limits. |
| `exa` | `EXA_API_KEY` | Exa search with page text in each result. |
| `companyfabric` | an `sk-cf-` model key | Not released yet; stays unavailable until it is. |

A provider that cannot run in your deployment is shown as unavailable with the reason, never silently replaced by another.

## Run with Hermes

```bash
cp .env.example .env
# set OPENAI_API_KEY, and generate the two shared secrets:
#   HERMES_API_KEY=$(openssl rand -hex 32)
#   TOOL_TOKEN=$(openssl rand -hex 32)
docker compose up --build
```

Run it from this folder. `docker-compose.yml` builds the app from this repository and runs it with Hermes (pinned to v0.22.5 by digest) on a private network. The app drives Hermes through its Runs API; Hermes calls the app's research tools back over MCP (`/api/mcp`, bearer `TOOL_TOKEN`), so policies, approvals and the audit log are the same as in lite mode. Hermes' model is set in `hermes/config.yaml` (CompanyFabric by default; change `base_url` and `default` for another endpoint).

`hermes/config.yaml` turns Hermes' own terminal, file, browser and web tools off. To give the agent a sandboxed computer, remove them from `disabled_toolsets`; Hermes then asks for your approval on risky commands, and those approvals appear in this app's approval cards.

## How it is built

```
agent.config.ts            identity, instructions, tool policies (allow / approve / deny), limits
src/lib/agent.ts           the app's tools: the kit's search_web and page_read, plus report_save
src/lib/reports.ts         saved reports and the report_save tool
src/lib/runtime/demo.ts    the scripted DEMO turn
src/app/api/               runs (SSE), approvals, threads, audit, reports, capabilities, mcp
packages/kit/src/tools/broker.ts the only way a tool runs: policy → audit row → limit → validate → approval → run → record
packages/kit/src/runtime/        lite.ts (chat.completions loop), hermes.ts (Runs API)
packages/kit/src/search/         one adapter per provider, one result shape
```

Remix the agent by editing `agent.config.ts`: its instructions, which tools it may use and on what terms, and its limits. Policies are enforced by the broker on the server, not by the prompt. `packages/kit` and `packages/ui` are shared with the other starters and come from Creative Tim's agent-starters monorepo (see [CONTRIBUTING.md](CONTRIBUTING.md)); change them there.

**Data:** threads, messages, the audit log, approvals and reports are kept in one SQLite file (`DATA_DIR`, using Node's built-in `node:sqlite`).

## Safety notes

- `page_read` fetches only public http(s) pages on standard ports. It refuses credentials in URLs, localhost and internal names, and private, link-local and metadata addresses, and it re-checks every redirect hop. It does not defend against DNS rebinding; if that matters, run the app where the network blocks internal ranges.
- Page text and search results are treated as data for the model, never as instructions to the tool layer.
- There is no login. The compose file binds the app to `127.0.0.1`; put it behind your own authentication before exposing it.
- No secret is sent to the browser. `/api/capabilities` reports what is configured, never values.

## Tests

```bash
pnpm test        # unit and contract tests, no network
pnpm eval        # live research eval (needs OPENAI_API_KEY; see evals/)
```

The eval runs ten real questions and checks the citations rather than the prose: at least two sources cited, every `[n]` refers to a source a tool actually returned, and the cited URLs resolve.

## License

MIT. See `LICENSE` and `NOTICE` for the services and software this project uses but does not include.

Not affiliated with any company whose AI products offer similar research features.


## More open-source agent starters

| | |
|---|---|
| [Open Coworkers](https://github.com/creativetimofficial/open-coworkers?ref=open-research_readme) | Specialist AI coworkers with their own permissions and hand-offs |
| [Social Autopilot](https://github.com/creativetimofficial/open-social?ref=open-research_readme) | Research, write and schedule posts for your channels |
| [Open Exec](https://github.com/creativetimofficial/open-exec?ref=open-research_readme) | An executive assistant for Gmail and Google Calendar |

Contributing: see [CONTRIBUTING.md](CONTRIBUTING.md). Security: see [SECURITY.md](SECURITY.md).
