import { encode } from "@session.js/mnemonic";
import { getKeysFromSeed } from "@session.js/keypair";

/**
 * Deterministically derives a Session messenger account from 12 digits.
 * Same input always produces the same mnemonic and Session ID.
 * Used by both the sender (after generating digits) and CYBERLEEK
 * (after extracting digits from the XMR payment amount).
 */
export async function generateFromDigits(digits: string) {
  // PBKDF2: 100M iterations of HMAC-SHA256 → 128-bit seed
  const seed = await deriveSeed(digits);
  const hex = bufferToHex(new Uint8Array(seed));

  // Encode the 16-byte seed as a 13-word mnemonic (base-1626 + CRC-32)
  const mnemonic = encode(hex);

  // Derive x25519 public key from seed → this is the Session ID (05-prefixed)
  const keys = getKeysFromSeed(hex);
  const sessionId = bufferToHex(keys.x25519.publicKey);

  return { digits, mnemonic, sessionId };
}

/**
 * PBKDF2 key derivation using the Web Crypto API.
 * - Password: "cyberleek" (imported as a raw PBKDF2 key)
 * - Salt: the 12-digit string (converted to UTF-8 bytes)
 * - Iterations: 100,000,000 (deliberately slow — ~10-15s in browser)
 * - Hash: SHA-256
 * - Output: 128 bits (16 bytes)
 *
 * The slow iteration count is the system's brute-force protection.
 * Even if an attacker knows the password and algorithm, recovering
 * the digits from the seed requires 100M PBKDF2 evaluations per guess.
 */
async function deriveSeed(digits: string) {
  const key = await importPasswordKey();
  const salt = new TextEncoder().encode(digits);

  return window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000000,
      hash: "SHA-256",
    },
    key,
    128, // 16 bytes = 128 bits
  );
}

/**
 * Imports the fixed password "cyberleek" as a PBKDF2 key material object.
 * This key is used as the base key for the deriveBits call above.
 * The password is public (visible in the original site's JS bundle).
 */
function importPasswordKey() {
  return window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("cyberleek"),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
}

/**
 * Converts a Uint8Array to a lowercase hex string.
 * Each byte becomes two hex characters (e.g., 0xFF → "ff").
 */
function bufferToHex(bytes: Uint8Array) {
  let hex = "";
  bytes.forEach((byte) => {
    hex += byte.toString(16).padStart(2, "0");
  });
  return hex;
}

/**
 * Generates 12 random decimal digits from 6 random bytes.
 * Each byte produces 2 digits: byte % 10 (ones place) and
 * Math.floor(byte / 10) % 10 (tens place).
 * Uses crypto.getRandomValues() for cryptographically secure randomness.
 */
export function generateRandomDigits() {
  let digit = "";
  const array = window.crypto.getRandomValues(new Uint8Array(6));

  array.forEach((byte) => {
    digit += (byte % 10).toString() + (Math.floor(byte / 10) % 10).toString();
  });

  return digit;
}
