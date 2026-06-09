#!/usr/bin/env node
/**
 * Acuris MCP server — exposes Acuris Address Validation & Geocoding
 * as Model Context Protocol tools.
 *
 * Transports:
 *   - stdio (default): Claude Desktop, Claude Code, Cursor, Codex, …
 *   - http: set TRANSPORT=http to run as a streamable HTTP server
 *
 * Auth: ACURIS_API_KEY environment variable (required).
 * Get a free key at https://api.acuris-geo.com/register.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AcurisClient, AcurisAPIError } from "./api.js";
import {
  validateAddressTool,
  validateAddressInput,
  runValidateAddress,
} from "./tools/validate_address.js";
import {
  postcodeLookupTool,
  postcodeLookupInput,
  runPostcodeLookup,
} from "./tools/postcode_lookup.js";
import { geocodeTool, geocodeInput, runGeocode } from "./tools/geocode.js";
import {
  reverseGeocodeTool,
  reverseGeocodeInput,
  runReverseGeocode,
} from "./tools/reverse_geocode.js";

const SERVER_VERSION = "0.1.1";

function readApiKey(): string {
  const k =
    process.env.ACURIS_API_KEY ||
    process.env.ACURIS_KEY ||
    process.env.X_ACURIS_KEY ||
    "";
  if (!k.trim()) {
    process.stderr.write(
      [
        "",
        "  acuris-mcp-server: ACURIS_API_KEY is not set.",
        "",
        "  Get a free API key (100 free validations + 100 free geocodes,",
        "  7 days, no credit card) at https://api.acuris-geo.com/register.",
        "",
        "  Then set it before running, e.g.:",
        "    export ACURIS_API_KEY=acu_…",
        "    npx @acuris-geo/mcp-server",
        "",
        "  Or, in Claude Desktop's claude_desktop_config.json:",
        '    "acuris": {',
        '      "command": "npx",',
        '      "args": ["-y", "@acuris-geo/mcp-server"],',
        '      "env": { "ACURIS_API_KEY": "acu_…" }',
        "    }",
        "",
      ].join("\n"),
    );
    process.exit(1);
  }
  return k.trim();
}

async function main() {
  const client = new AcurisClient({
    apiKey: readApiKey(),
    userAgent: `acuris-mcp-server/${SERVER_VERSION}`,
  });

  const server = new McpServer(
    {
      name: "acuris-mcp-server",
      version: SERVER_VERSION,
    },
    {
      capabilities: { tools: {} },
      instructions:
        "Acuris Address Validation & Geocoding. Validate addresses in 240+ countries, look up UK postcodes against Royal Mail PAF, and geocode / reverse geocode anywhere. Use `gbr` for the UK PAF dataset.",
    },
  );

  function jsonContent(value: unknown) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    };
  }

  function errContent(e: unknown) {
    const msg =
      e instanceof AcurisAPIError
        ? `Acuris API ${e.status}: ${e.message}`
        : e instanceof Error
          ? e.message
          : String(e);
    return {
      content: [{ type: "text" as const, text: msg }],
      isError: true,
    };
  }

  server.registerTool(
    validateAddressTool.name,
    {
      title: validateAddressTool.title,
      description: validateAddressTool.description,
      inputSchema: validateAddressTool.inputSchema,
    },
    async (args) => {
      try {
        const parsed = validateAddressInput.parse(args);
        return jsonContent(await runValidateAddress(client, parsed));
      } catch (e) {
        return errContent(e);
      }
    },
  );

  server.registerTool(
    postcodeLookupTool.name,
    {
      title: postcodeLookupTool.title,
      description: postcodeLookupTool.description,
      inputSchema: postcodeLookupTool.inputSchema,
    },
    async (args) => {
      try {
        const parsed = postcodeLookupInput.parse(args);
        return jsonContent(await runPostcodeLookup(client, parsed));
      } catch (e) {
        return errContent(e);
      }
    },
  );

  server.registerTool(
    geocodeTool.name,
    {
      title: geocodeTool.title,
      description: geocodeTool.description,
      inputSchema: geocodeTool.inputSchema,
    },
    async (args) => {
      try {
        const parsed = geocodeInput.parse(args);
        return jsonContent(await runGeocode(client, parsed));
      } catch (e) {
        return errContent(e);
      }
    },
  );

  server.registerTool(
    reverseGeocodeTool.name,
    {
      title: reverseGeocodeTool.title,
      description: reverseGeocodeTool.description,
      inputSchema: reverseGeocodeTool.inputSchema,
    },
    async (args) => {
      try {
        const parsed = reverseGeocodeInput.parse(args);
        return jsonContent(await runReverseGeocode(client, parsed));
      } catch (e) {
        return errContent(e);
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(
    `acuris-mcp-server ${SERVER_VERSION} ready on stdio (4 tools)\n`,
  );
}

main().catch((err) => {
  process.stderr.write(
    `acuris-mcp-server: fatal: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
