import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
  SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("OAuth proxy worker", () => {
  it("GET ruta desconocida devuelve 404 Not Found", async () => {
    const request = new IncomingRequest("http://example.com/");
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not Found");
  });

  it("OPTIONS devuelve 204 CORS", async () => {
    const request = new IncomingRequest("http://example.com/api/auth/token", {
      method: "OPTIONS",
      headers: { Origin: "https://app.example.com" },
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://app.example.com"
    );
  });

  it("POST /api/auth/token sin body devuelve 400 missing_params", async () => {
    const request = new IncomingRequest("http://example.com/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(400);
    const data = (await response.json()) as { error?: string };
    expect(data.error).toBe("missing_params");
  });

  it("POST /api/auth/token con code pero sin code_verifier devuelve 400", async () => {
    const request = new IncomingRequest("http://example.com/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "abc",
        redirect_uri: "https://app.example.com/callback",
      }),
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(400);
    const data = (await response.json()) as { error?: string };
    expect(data.error).toBe("missing_params");
  });
});
