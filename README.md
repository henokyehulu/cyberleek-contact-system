# CYBERLEEK Contact System

A proof of concept showing how CYBERLEEK's secure contact system works. I reverse-engineered the contact mechanism from their website's JavaScript bundle and rebuilt it from scratch using Vite and TypeScript.

**Live Demo:** https://henokyehulu.github.io/cyberleek-contact-system/

## What is this?

So basically CYBERLEEK has this system where people can contact him privately through Session messenger. The way it works is you generate some digits, send him Monero with those digits in the amount, and he uses those same digits to find your Session account and message you. I thought that was pretty cool so I tried to understand how it all works and built this.

## How it works (in simple terms)

1. You click "Generate" and it creates 12 random digits
2. Those digits go through something called PBKDF2 which is basically a really slow math function (100 million iterations) that turns the digits into a Session account
3. You get a 13-word recovery password and a Session ID
4. You send exactly `400.{digits}` XMR to CYBERLEEK's address
5. Monero hides the amount you sent so nobody else can see those 12 digits
6. CYBERLEEK takes the digits from your payment, runs the same math, and gets your Session account
7. He messages you on Session

The whole thing is deterministic which means the same 12 digits always give you the same Session account. That's how both sides end up on the same account without ever talking to each other.

## The two panels

**Sender Side** — This is what you see. Click generate, get your mnemonic, Session ID, and XMR amount.

**CYBERLEEK Side** — This is what CYBERLEEK does on his end. He puts in the 12 digits from your payment and derives your account.

## Running it yourself

```bash
pnpm install
pnpm dev
```

That's it. Open the localhost URL it gives you.

## What I learned building this

- How PBKDF2 key derivation works (and why 100 million iterations takes 15 seconds)
- How Monero hides transaction amounts using RingCT
- How Session generates accounts from a seed using ed25519/x25519 keypairs
- How to reverse-engineer minified JavaScript

## FAQ

There's a FAQ section on the page itself with 10 common questions I had while building this. Things like "can someone see my digits on the blockchain" and "what if I send from an exchange."

## License

MIT
