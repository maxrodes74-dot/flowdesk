import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWeeklyTimeSummaryEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all freelancers
    const { data: freelancerRows, error: freelancerError } = await supabase
      .from("freelancers")
      .select("*");

    if (freelancerError || !freelancerRows) {
      return NextResponse.json(
        { error: "Failed to fetch freelancers" },
        { status: 500 }
      );
    }

    let sentCount = 0;
    let failedCount = 0;
    const results: Array<Record<string, unknown>> = [];

    for (const freelancer of freelancerRows) {
      try {
        // Fetch time entries for the past 7 days
        const { data: timeEntries } = await supabase
          .from("time_entries")
          .select("*")
          .eq("freelancer_id", freelancer.id)
          .gte("date", sevenDaysAgo.toISOString().split("T")[0])
          .lte("date", now.toISOString().split("T")[0]);

        if (!timeEntries || timeEntries.length === 0) continue;

        // Fetch clients for names
        const { data: clients } = await supabase
          .from("clients")
          .select("id, name")
          .eq("freelancer_id", freelancer.id);

        const clientMap = new Map(
          (clients || []).map((c: Record<string, string>) => [c.id, c.name])
        );

        // Aggregate hours by client
        const hoursByClientMap = new Map<
          string,
          { clientName: string; hours: number }
        >();
        for (const entry of timeEntries) {
          const clientId = entry.client_id || "unknown";
          const clientName = clientMap.get(clientId) || "Unnamed Client";
          const hours = (entry.duration_minutes || 0) / 60;
          const existing = hoursByClientMap.get(clientId);
          if (existing) {
            existing.hours += hours;
          } else {
            hoursByClientMap.set(clientId, { clientName, hours });
          }
        }

        const hoursByClient = Array.from(hoursByClientMap.values()).sort(
          (a, b) => b.hours - a.hours
        );
        const totalHours = hoursByClient.reduce(
          (sum, c) => sum + c.hours,
          0
        );

        if (totalHours === 0) continue;

        // Send email
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const freelancerObj = {
          id: freelancer.id,
          name: freelancer.name || "",
          hourlyRate: freelancer.hourly_rate || 0,
          brandColor: freelancer.brand_color || "#3B82F6",
        } as any;

        const emailSent = await sendWeeklyTimeSummaryEmail(
          freelancer.email || "",
          freelancer.name || "",
          freelancerObj,
          { totalHours, hoursByClient }
        );

        if (emailSent) {
          sentCount++;
          results.push({
            freelancerId: freelancer.id,
            status: "sent",
            totalHours,
          });
        } else {
          failedCount++;
          results.push({ freelancerId: freelancer.id, status: "failed" });
        }
      } catch (error) {
        failedCount++;
        console.error(
          `Error processing weekly summary for ${freelancer.id}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalFreelancers: freelancerRows.length,
        sentCount,
        failedCount,
        timestamp: now.toISOString(),
      },
      results,
    });
  } catch (error) {
    console.error("Weekly summary automation error:", error);
    return NextResponse.json(
      { error: "Failed to process weekly summaries" },
      { status: 500 }
    );
  }
}
