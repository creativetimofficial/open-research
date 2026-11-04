import { ResearchApp } from "@/components/research-app"
import { capabilities } from "@/lib/capabilities"

export const dynamic = "force-dynamic"

export default function Page() {
  return <ResearchApp initialCapabilities={capabilities()} />
}
