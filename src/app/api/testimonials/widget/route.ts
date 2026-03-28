import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const freelancerId = searchParams.get("id");

    if (!freelancerId) {
      return NextResponse.json(
        { error: "Missing freelancer_id parameter" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch approved testimonials for the freelancer
    const { data: testimonials, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .eq("permission_to_use", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching testimonials:", error);
      return NextResponse.json(
        { error: "Failed to fetch testimonials" },
        { status: 500 }
      );
    }

    // Generate JavaScript widget code
    const widgetScript = generateWidgetScript(testimonials || []);

    return new NextResponse(widgetScript, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Widget error:", error);
    return NextResponse.json(
      { error: "Failed to generate widget" },
      { status: 500 }
    );
  }
}

function generateWidgetScript(testimonials: any[]): string {
  const testimonialsList = testimonials
    .slice(0, 3)
    .map(
      (t) => `
    {
      name: "${escapeJs(t.client_name)}",
      rating: ${t.rating},
      text: "${escapeJs(t.text)}"
    }`
    )
    .join(",");

  return `
(function() {
  const testimonials = [${testimonialsList}];

  function initWidget() {
    const container = document.getElementById('scopepad-testimonials');
    if (!container) return;

    const html = \`
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
          \${testimonials.map(t => \`
            <div style="
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            ">
              <div style="display: flex; gap: 4px; margin-bottom: 12px;">
                \${Array(5).fill(0).map((_, i) => \`
                  <span style="
                    color: \${i < t.rating ? '#fbbf24' : '#d1d5db'};
                    font-size: 16px;
                  ">★</span>
                \`).join('')}
              </div>
              <p style="
                margin: 0 0 12px 0;
                font-size: 14px;
                color: #374151;
                line-height: 1.6;
              ">\${t.text}</p>
              <p style="
                margin: 0;
                font-weight: 600;
                color: #111827;
                font-size: 14px;
              ">— \${t.name}</p>
            </div>
          \`).join('')}
        </div>
        <div style="
          text-align: center;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
        ">
          Powered by <a href="https://scopepad.io" style="color: #2563eb; text-decoration: none;">ScopePad</a>
        </div>
      </div>
    \`;

    container.innerHTML = html;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
`;
}

function escapeJs(str: string): string {
  return str
    .replace(/\\\\/g, "\\\\\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}
