# CYBERLEEK Contact System — Proof of Concept

A browser-based proof-of-concept that replicates [CYBERLEEK](https://cyberleek.net)'s secure contact system. Demonstrates how three independent privacy layers (PBKDF2, Monero, Session) combine to create anonymous, verifiable communication channels.

## What This Does

The page has two panels:

**Sender Side** — Click "Generate" to create a unique 12-digit ID and derive a Session messenger account (13-word mnemonic + Session ID) from it via PBKDF2. The XMR amount is displayed as `400.{digits}`.

**CYBERLEEK Side** — Input the 12 digits from a Monero payment to derive the same mnemonic and Session ID. This is how CYBERLEEK recovers the sender's Session account to initiate a conversation.

Both panels run the same deterministic derivation — the same 12 digits always produce the same mnemonic and Session ID.

## How It Works

1. **Key Derivation (PBKDF2)** — 12 random digits are fed into PBKDF2 (HMAC-SHA256, 100M iterations) with the password `cyberleek` as the key. This produces a 128-bit seed. The slow iteration count (~10-15s in-browser) prevents brute-force attacks.

2. **Session Account** — The seed is encoded into a 13-word mnemonic using Session.js. From the same seed, an ed25519 keypair is generated and converted to x25519, producing a unique Session ID (`05`-prefixed).

3. **Monero Privacy** — The sender pays `400.{digits}` XMR. Monero's Ring Confidential Transactions hide the amount on-chain. Only CYBERLEEK (who holds the one-time stealth address key) can decrypt the actual amount and extract the 12 digits.

4. **Deterministic Derivation** — CYBERLEEK runs the same PBKDF2 function on the extracted digits. Both sides arrive at the same Session account without ever communicating.

## Tech Stack

- [Vite](https://vitejs.dev/) — build tool
- TypeScript — strict type checking
- [Session.js](https://github.com/oxen-io/session-v2/tree/main/packages/session.js) — mnemonic encoding and keypair derivation
- Web Crypto API — PBKDF2 key derivation (no external crypto dependencies)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
  crypto.ts    — PBKDF2 derivation, mnemonic encoding, Session ID generation
  main.ts      — UI (both panels in a single page)
  style.css    — dark cyberpunk theme
index.html     — entry point
```

## Security Notes

- The PBKDF2 password (`cyberleek`) and iteration count are public — they are hardcoded in the original site's JavaScript bundle.
- The 12 digits are the only secret linking the XMR payment to the Session account.
- Monero's RingCT hides the amount on the blockchain — no observer can see the digits.
- Session provides end-to-end encrypted messaging with no central server.
- This is a proof-of-concept for educational purposes only.

## License

MIT
