"use client"

import { AppShell, SidebarBrand, SidebarSection, StatusChips, ThreadList } from "@agent-starters/ui/agent/app-shell"
import { ChatView } from "@agent-starters/ui/agent/chat-view"
import { Markdown } from "@agent-starters/ui/agent/markdown"
import { AuditPanel, CapabilityTable, Empty, List, Panel, PolicyList, Row, SearchProviders, SourcesPanel } from "@agent-starters/ui/agent/panels"
import { useAgentChat } from "@agent-starters/ui/agent/use-agent-chat"
import { ConfirmationField } from "@agent-starters/ui/elements/confirmation"
import { ConversationEmptyState } from "@agent-starters/ui/elements/conversation"
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from "@agent-starters/ui/elements/prompt-input"
import { Suggestion, Suggestions } from "@agent-starters/ui/elements/suggestion"
import { Download, Telescope } from "lucide-react"
import { useEffect, useState } from "react"

import type { Capabilities } from "@/lib/capabilities"

const TOOL_LABEL: Record<string, string> = { "search.web": "Web search", "page.read": "Read page", "report.save": "Save report" }
const toolLabel = (tool: string) => TOOL_LABEL[tool] ?? tool

export function ResearchApp({ initialCapabilities: caps }: { initialCapabilities: Capabilities }) {
  const [version, setVersion] = useState(0)
  const chat = useAgentChat({ onSettled: () => setVersion((v) => v + 1) })
  const [tab, setTab] = useState("sources")
  const [input, setInput] = useState("")

  const send = (text: string) => {
    setInput("")
    void chat.send(text)
  }
  const sources = [...chat.turns].reverse().find((t) => t.sources.length > 0)?.sources ?? []

  return (
    <AppShell
      sidebar={
        <>
          <SidebarBrand name={caps.agent.name} tagline={caps.agent.tagline} icon={<Telescope />} onNew={chat.reset} newLabel="New research" />
          <SidebarSection title="Research" className="min-h-0 flex-1 overflow-y-auto">
            <ThreadList threads={chat.threads} activeId={chat.threadId} onSelect={(t) => void chat.openThread(t.id)} onDelete={(id) => void chat.deleteThread(id)} />
          </SidebarSection>
        </>
      }
      header={<StatusChips caps={caps} />}
      composer={
        <PromptInput onSubmit={() => send(input)}>
          <PromptInputTextarea value={input} onChange={(e) => setInput(e.target.value)} onSubmit={() => send(input)} placeholder="Ask a research question…" />
          <PromptInputFooter>
            <PromptInputTools>Answers cite the pages they come from.</PromptInputTools>
            <PromptInputSubmit running={chat.running} disabled={!input.trim()} onStop={() => void chat.stop()} />
          </PromptInputFooter>
        </PromptInput>
      }
      tab={tab}
      onTabChange={setTab}
      tabs={[
        { id: "sources", label: "Sources", content: <SourcesPanel sources={sources} /> },
        { id: "activity", label: "Activity", content: <AuditPanel version={version} label={toolLabel} /> },
        {
          id: "setup",
          label: "Setup",
          content: (
            <div className="space-y-6">
              <Panel title="Reports">
                <Reports version={version} />
              </Panel>
              <Panel title="Tool policies" description="Enforced on the server, whichever runtime asks.">
                <PolicyList policies={caps.policies} label={toolLabel} />
              </Panel>
              <Panel title="Search">
                <SearchProviders search={caps.search} />
              </Panel>
              <Panel title="Lite vs Hermes">
                <CapabilityTable matrix={caps.matrix} />
              </Panel>
            </div>
          ),
        },
      ]}
    >
      <ChatView
        turns={chat.turns}
        approvals={chat.approvals}
        onDecide={(id, d) => void chat.decide(id, d)}
        error={chat.error}
        toolLabel={toolLabel}
        workingLabel="Researching…"
        renderApproval={(a) => {
          if (a.tool !== "report.save") return null
          const { title, markdown } = (a.input ?? {}) as { title?: string; markdown?: string }
          return {
            title: "Save this report?",
            approveLabel: "Save report",
            body: (
              <div className="space-y-2">
                <ConfirmationField label="Title">{title}</ConfirmationField>
                <div className="max-h-48 overflow-y-auto rounded-lg bg-muted p-3">
                  <Markdown text={markdown ?? ""} />
                </div>
              </div>
            ),
          }
        }}
        empty={
          <ConversationEmptyState icon={<Telescope className="size-6" />} title="What should I research?" description={caps.agent.tagline}>
            <Suggestions className="mt-4 max-w-2xl">
              {caps.agent.suggestions.map((s) => (
                <Suggestion key={s} suggestion={s} onClick={send} />
              ))}
            </Suggestions>
          </ConversationEmptyState>
        }
      />
    </AppShell>
  )
}

function Reports({ version }: { version: number }) {
  const [reports, setReports] = useState<{ id: string; title: string; created_at: string }[]>([])
  useEffect(() => {
    void fetch("/api/reports")
      .then((r) => (r.ok ? r.json() : { reports: [] }))
      .then((d: { reports: typeof reports }) => setReports(d.reports))
  }, [version])
  if (reports.length === 0) return <Empty>Ask for a report to keep; it is saved after you approve it.</Empty>
  return (
    <List>
      {reports.map((r) => (
        <a key={r.id} href={`/api/reports/${r.id}`} className="block transition-colors hover:bg-foreground/5">
          <Row title={r.title} detail={new Date(r.created_at).toLocaleString()} trailing={<Download className="size-4" />} />
        </a>
      ))}
    </List>
  )
}
