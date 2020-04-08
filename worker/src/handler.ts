// Copyright 2020 the Deno authors. All rights reserved. MIT license.

const origin = API_ORIGIN + "/api/docs";
const maxAge = 1; // cache request in memory for 1 second

// The quality of data the API provides
enum Quality {
  // serve what is in cache, otherwise get fresh data
  Any = "",
  // only serve from cache, or respond 204 if not in cache
  Cache = "cache",
  // only serve fresh data
  Fresh = "fresh",
}

export async function handleRequest(event: FetchEvent) {
  const { request } = event;
  const url = new URL(request.url);
  const entrypoint = url.searchParams.get("entrypoint");
  if (!entrypoint) {
    return new Response(`{"error": "No entrypoint URL specified."}`, {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `max-age=${maxAge}`,
      },
    });
  }

  const remoteURL = new URL(
    `${origin}?entrypoint=${encodeURIComponent(entrypoint)}`
  );
  const key = await sha256(remoteURL.href);
  const quality = (url.searchParams.get("quality") || "") as Quality;

  if (quality !== Quality.Fresh) {
    const stream = await DOCS_CACHE.get(key, "stream");
    if (stream) {
      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `max-age=${maxAge}`,
        },
      });
    }
    if (quality === Quality.Cache) {
      return new Response(null, {
        status: 204,
      });
    }
  }

  const response = await fetch(remoteURL.href);
  if (!response.ok) {
    const final = new Response(response.body, response);
    final.headers.set("Cache-Control", `max-age=${maxAge}`);
    return final;
  }

  if (response.body) {
    const [toCache, toClient] = response.body.tee();
    event.waitUntil(
      DOCS_CACHE.put(key, toCache, {
        expirationTtl: 86400, // cache for 1 day
      })
    );
    return new Response(toClient, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `max-age=${maxAge}`,
      },
    });
  }

  return new Response(`{"error": "API request failed."}`, {
    status: 400,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `max-age=${maxAge}`,
    },
  });
}

async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => ("00" + b.toString(16)).slice(-2))
    .join("");
  return hashHex;
}
