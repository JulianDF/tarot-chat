export const runtime = "nodejs";
import { getClientsMap } from "../../push/route.js";

export async function GET(request, { params }) {
  const { sessionId } = params;
  const clients = getClientsMap();

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  clients.set(sessionId, {
    write: (data) => writer.write(encoder.encode(data)),
  });

  writer.write(encoder.encode(`data: {"status":"connected"}\n\n`));

  const close = () => {
    clients.delete(sessionId);
    writer.close();
  };
  request.signal.addEventListener("abort", close);

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
