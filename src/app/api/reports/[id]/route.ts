import { getReport } from "@/lib/reports"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/reports/{id}: the report as markdown, ready to download. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const report = getReport((await params).id)
  if (!report) return Response.json({ error: "Report not found." }, { status: 404 })
  const filename = report.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "report"
  return new Response(report.markdown, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}.md"` },
  })
}
