// Tiny MCP smoke test: spawn the server, do a JSON-RPC initialize +
// tools/list + tools/call(postcode_lookup), check we got real data back.

import { spawn } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";

const SERVER = new URL("../dist/index.js", import.meta.url).pathname;

function rpc(child, msg) {
  return new Promise((resolve, reject) => {
    const id = msg.id;
    let buf = "";
    const onData = (chunk) => {
      buf += chunk.toString("utf8");
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        try {
          const obj = JSON.parse(line);
          if (obj.id === id) {
            child.stdout.off("data", onData);
            resolve(obj);
            return;
          }
        } catch {}
      }
    };
    child.stdout.on("data", onData);
    setTimeout(() => {
      child.stdout.off("data", onData);
      reject(new Error("timeout waiting for id=" + id));
    }, 12000);
    child.stdin.write(JSON.stringify(msg) + "\n");
  });
}

function notify(child, msg) {
  child.stdin.write(JSON.stringify(msg) + "\n");
}

test("MCP server boots and responds to JSON-RPC", { timeout: 20000 }, async () => {
  const child = spawn("node", [SERVER], {
    env: { ...process.env, ACURIS_API_KEY: "test" },
    stdio: ["pipe", "pipe", "inherit"],
  });
  try {
    const init = await rpc(child, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "smoke", version: "0.0.0" },
      },
    });
    assert.equal(init.result?.serverInfo?.name, "acuris-mcp-server");

    notify(child, { jsonrpc: "2.0", method: "notifications/initialized" });

    const list = await rpc(child, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });
    const toolNames = (list.result?.tools || []).map((t) => t.name).sort();
    assert.deepEqual(toolNames, [
      "geocode",
      "postcode_lookup",
      "reverse_geocode",
      "validate_address",
    ]);

    const call = await rpc(child, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "postcode_lookup", arguments: { postcode: "SW1A 2AA" } },
    });
    const text = call.result?.content?.[0]?.text || "";
    const payload = JSON.parse(text);
    assert.equal(payload.country, "gbr");
    assert.ok(payload.count > 0, "expected addresses");
    assert.ok(payload.addresses[0].udprn, "expected udprn");
  } finally {
    child.kill();
  }
});
