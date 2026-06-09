# Security Policy

## Reporting a vulnerability

If you discover a security issue in `@acuris-geo/mcp-server`, please report it
privately — **do not** open a public GitHub issue.

- Email: **support@acuris-geo.com** (subject line: `SECURITY`)
- Please include: affected version, a description, and reproduction steps.

We aim to acknowledge reports within **3 business days** and to ship a fix or
mitigation for confirmed issues as quickly as is practical. We're happy to
credit reporters who follow coordinated disclosure.

## Scope

This repository is the MCP server only — a thin client that forwards tool calls
to the Acuris API. Vulnerabilities in the Acuris API itself (api.acuris-geo.com /
paf.acuris-geo.com) should also be sent to the address above.

## Security model & design notes

The server is intentionally minimal and follows least-surprise defaults:

- **No outbound-host control (SSRF-safe).** The only hosts the server ever
  contacts are a hardcoded allowlist — `api.acuris-geo.com` and, for UK (`gbr`)
  traffic, `paf.acuris-geo.com`. Tool arguments cannot redirect requests to an
  arbitrary host; they only ever become URL-encoded query/body parameters.
- **No secrets in the package.** The Acuris API key is read **only** from the
  `ACURIS_API_KEY` environment variable at runtime. Nothing is hardcoded, and
  the published npm tarball ships only `dist/`, `README.md`, and `LICENSE`.
- **Validated input.** Every tool validates its arguments with `zod` before use.
- **Bounded requests.** Outbound calls use an `AbortController` timeout (15s).
- **No key leakage.** API errors surface the upstream status/message only; the
  API key is never echoed in tool output or logs.
- **Transport.** Runs over stdio (local, per-client). It does not open a
  listening network socket.

## Supported versions

The latest published `0.x` release receives security fixes. Pre-1.0, only the
most recent minor is supported.

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |
| < 0.1   | ❌        |

## Handling of user data

The server does not store, log, or transmit address inputs anywhere except to
the Acuris API to fulfil the request. See the Acuris privacy policy at
https://www.acuris-geo.com/legal/privacy for how the API handles data.
