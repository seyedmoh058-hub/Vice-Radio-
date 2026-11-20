export default async (request, context) => {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url");
  if (!target) return new Response("Missing url", { status: 400 });

  let parsed;
  try { parsed = new URL(target); } catch {
    return new Response("Invalid url", { status: 400 });
  }

  // Only allow Apple's preview audio host; this is not an open proxy.
  if (parsed.protocol !== "https:" || parsed.hostname !== "audio-ssl.itunes.apple.com") {
    return new Response("Preview host not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: { "User-Agent": "ViceRadio/1.0" }
    });
    if (!upstream.ok) return new Response("Preview unavailable", { status: upstream.status });

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("Content-Type") || "audio/mp4");
    headers.set("Cache-Control", "public, max-age=86400");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(upstream.body, { status: 200, headers });
  } catch {
    return new Response("Could not retrieve preview", { status: 502 });
  }
};
