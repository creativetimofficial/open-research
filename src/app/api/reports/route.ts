import { listReports } from "@/lib/reports"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return Response.json({ reports: listReports() })
}
