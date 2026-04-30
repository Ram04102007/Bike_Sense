import { NextRequest, NextResponse } from "next/server";

const ML_BASE = (process.env.ML_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function proxy(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const path = pathSegments.join("/");
  const search = req.nextUrl.search;
  const url = `${ML_BASE}/api/v1/${path}${search}`;

  try {
    const isPost = req.method === "POST" || req.method === "PUT" || req.method === "PATCH";
    const body = isPost ? await req.text() : undefined;

    const res = await fetch(url, {
      method: req.method,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body,
      signal: AbortSignal.timeout(20000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error(`[ML Proxy] ${req.method} ${url} failed:`, err?.message ?? err);
    return NextResponse.json(
      { success: false, error: "ML backend unreachable", detail: err?.message },
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
