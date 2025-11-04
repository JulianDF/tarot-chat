export const runtime = "nodejs";
export async function POST(req) {
  const body = await req.json();

  try {
    const res = await fetch("https://n8n-1-114-4-docker-image.onrender.com/webhook/tarot-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    return new Response(text, { status: res.status });
  } catch (err) {
    console.error("❌ Error proxying to n8n:", err);
    return new Response("Proxy error", { status: 500 });
  }
}
