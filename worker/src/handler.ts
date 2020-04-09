// Copyright 2020 the Deno authors. All rights reserved. MIT license.

const apiOrigin = NOW_ORIGIN + "/api/docs";
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

export async function handleRequest(event: FetchEvent): Promise<Response> {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/https/")) {
    return handleFrontend(event);
  } else if (url.pathname === "/api/docs") {
    return handleAPI(event);
  }
  return fetch(event.request);
}

async function handleFrontend(event: FetchEvent): Promise<Response> {
  const url = new URL(event.request.url);
  const entrypoint = url.pathname.replace(/^\/https\//, "https://");
  const hash = await sha256(entrypoint);
  const key = hash + "_html";
  const stream = await DOCS_CACHE.get(key, "stream");
  if (stream) {
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": `max-age=${maxAge}`,
        "X-Deno-Cache": "HIT",
      },
    });
  }
  const remoteURL = new URL(`${NOW_ORIGIN}${url.pathname}`);
  const response = await fetch(remoteURL.href);
  if (!response.ok) {
    const final = new Response(response.body, response);
    final.headers.set("Cache-Control", `max-age=${maxAge}`);
    return final;
  }

  if (response.body) {
    const [toCache, toClient] = response.body.tee();
    event.waitUntil(
      (async () => {
        const data = await DOCS_CACHE.get<{ timestamp: string }>(
          hash + "_api_docs",
          "json"
        );
        const html = await new Response(toCache).text();
        if (data && data.timestamp && html.includes(data.timestamp)) {
          await DOCS_CACHE.put(key, html, {
            expirationTtl: 86400, // cache for 1 day
          });
        }
      })()
    );
    return new Response(toClient, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": `max-age=${maxAge}`,
        "X-Deno-Cache": "MISS",
      },
    });
  }

  return new Response(`Failed to get rendered page.`, {
    status: 500,
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": `max-age=${maxAge}`,
    },
  });
}

async function handleAPI(event: FetchEvent): Promise<Response> {
  const url = new URL(event.request.url);
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

  const hash = await sha256(entrypoint);
  const key = hash + "_api_docs";
  const quality = (url.searchParams.get("quality") || "") as Quality;

  if (quality !== Quality.Fresh) {
    const stream = await DOCS_CACHE.get(key, "stream");
    if (stream) {
      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `max-age=${maxAge}`,
          "X-Deno-Cache": "HIT",
        },
      });
    }
    if (quality === Quality.Cache) {
      return new Response(null, {
        status: 204,
      });
    }
  }
  const remoteURL = new URL(
    `${apiOrigin}?entrypoint=${encodeURIComponent(entrypoint)}`
  );
  const response = await fetch(remoteURL.href);
  if (!response.ok) {
    const final = new Response(response.body, response);
    final.headers.set("Cache-Control", `max-age=${maxAge}`);
    return final;
  }

  if (response.body) {
    const [toCache, toClient] = response.body.tee();
    event.waitUntil(
      Promise.allSettled([
        DOCS_CACHE.delete(hash + "_html"),
        DOCS_CACHE.put(key, toCache, {
          expirationTtl: 86400, // cache for 1 day
        }),
      ])
    );
    return new Response(toClient, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `max-age=${maxAge}`,
        "X-Deno-Cache": "MISS",
      },
    });
  }

  return new Response(`{"error": "API request failed."}`, {
    status: 500,
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
