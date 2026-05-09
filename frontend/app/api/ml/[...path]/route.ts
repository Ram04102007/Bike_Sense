import { NextRequest, NextResponse } from "next/server";

const ML_BASE = (process.env.ML_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function proxy(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const path = pathSegments.join("/");
  const search = req.nextUrl.search;
  const url = `${ML_BASE}/api/v1/${path}${search}`;

  try {
    const isPost = req.method === "POST" || req.method === "PUT" || req.method === "PATCH";
    const contentType = req.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    const headers = new Headers();
    req.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Drop hop-by-hop headers that break proxying
      if (lowerKey !== "host" && lowerKey !== "connection" && lowerKey !== "content-length") {
        headers.set(key, value);
      }
    });

    // For JSON requests, ensure Accept header is set.
    // For multipart uploads, do NOT override content-type (it contains the boundary).
    if (!isMultipart) {
      headers.set("Accept", "application/json");
    }

    const fetchOptions: any = {
      method: req.method,
      headers,
      signal: AbortSignal.timeout(180000),
    };

    if (isPost) {
      if (isMultipart) {
        // Next.js App Router parses multipart bodies automatically.
        // We must read via formData() and pass a new FormData object to fetch()
        // so that fetch() generates the correct Content-Type boundary for FastAPI.
        const formData = await req.formData();
        fetchOptions.body = formData;
        // IMPORTANT: Remove content-type so fetch() sets it fresh with the correct boundary
        headers.delete("content-type");
      } else {
        fetchOptions.body = await req.arrayBuffer();
      }
    }

    console.log(`[ML Proxy] ${req.method} ${url} (${isMultipart ? "multipart" : "json"})`);
    const res = await fetch(url, fetchOptions);

    const responseText = await res.text();
    console.log(`[ML Proxy] Response: ${res.status} ${responseText.slice(0, 200)}`);

    let data;
    try { data = JSON.parse(responseText); } catch(e) { data = { error: "Invalid JSON from backend", raw: responseText }; }

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error(`[ML Proxy] ${req.method} ${url} failed:`, err?.message ?? err);
    try { require('fs').writeFileSync('proxy_error.log', String(err?.stack || err?.message || err)); } catch(e){}
    return NextResponse.json(
      { success: false, error: "ML backend unreachable: " + (err?.message || "Unknown"), detail: err?.message },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  const params = await context.params;
  return proxy(req, params.path);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  const params = await context.params;
  return proxy(req, params.path);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  const params = await context.params;
  return proxy(req, params.path);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  const params = await context.params;
  return proxy(req, params.path);
}
