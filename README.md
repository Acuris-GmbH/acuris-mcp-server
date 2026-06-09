# Acuris MCP Server

[Model Context Protocol](https://modelcontextprotocol.io) server for the Acuris Address Validation & Geocoding API. Plug Acuris into Claude Desktop, Claude Code, Cursor, or any MCP-aware client and your agent gains four address tools:

| Tool | What it does |
|---|---|
| `validate_address` | Validate any postal address in 240+ countries. Returns standardised address, rooftop coordinates, confidence score (A-F), UDPRN + UPRN for UK. |
| `postcode_lookup` | Given a UK postcode, return every Royal Mail PAF delivery point at it. |
| `geocode` | Convert an address into latitude + longitude. |
| `reverse_geocode` | Convert a lat/lng into the nearest known address. |

## Quick start

Get a free API key (100 free validations, 100 free geocodes, 7 days, no credit card) at [api.acuris-geo.com/register](https://api.acuris-geo.com/register).

### Claude Desktop

Add this to `claude_desktop_config.json`:

```jsonc
{
  "mcpServers": {
    "acuris": {
      "command": "npx",
      "args": ["-y", "@acuris-geo/mcp-server"],
      "env": { "ACURIS_API_KEY": "acu_…" }
    }
  }
}
```

Restart Claude Desktop. The four tools appear under the "Acuris" server.

### Claude Code

```bash
claude mcp add acuris -e ACURIS_API_KEY=acu_… -- npx -y @acuris-geo/mcp-server
```

### Cursor / Codex / any MCP client

The server speaks plain stdio MCP. Point your client at:

```bash
ACURIS_API_KEY=acu_… npx -y @acuris-geo/mcp-server
```

## Example prompts

After installing, try:

> *Validate this address: 10 Downing Street, London, SW1A 2AA*
>
> *Look up every address at the UK postcode M1 1AD*
>
> *What's the rooftop coordinate for the Reichstag, Berlin?*
>
> *What address is at 51.5036, -0.1277?*

The agent picks the right tool, calls it, and reads the JSON back to you.

## Why an MCP server?

No other UK / EU address-validation provider (Ideal Postcodes, Loqate, Smarty, postcoder, getaddress.io) ships an MCP server today. If your team builds with agentic IDEs, Acuris is the only AV provider that hands you a first-class integration.

## API surface

The server talks to:
- `POST https://api.acuris-geo.com/validate`
- `POST https://api.acuris-geo.com/postcode-lookup` *(GBR — proxied to `paf.acuris-geo.com` internally)*
- `GET  https://api.acuris-geo.com/geocode`
- `GET  https://api.acuris-geo.com/reverse`

UK requests are automatically routed to our PAF satellite (`paf.acuris-geo.com`) where the licensed Royal Mail PAF dataset lives. The caller doesn't need to know this.

## Development

```bash
npm install
npm run build
ACURIS_API_KEY=test node dist/index.js   # smoke-test with the public test key
```

## License

MIT. Source: <https://github.com/Acuris-GmbH/acuris-mcp-server>.
