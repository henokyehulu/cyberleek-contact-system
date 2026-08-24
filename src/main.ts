import { generateFromDigits, generateRandomDigits } from "./crypto";
import "./style.css";

// ============================================================================
// CYBERLEEK Contact System — Proof of Concept
//
// Two-panel UI:
//   Left:  Sender Side — generate 12 random digits, derive mnemonic + Session ID
//   Right: CYBERLEEK Side — input 12 digits from XMR payment, derive mnemonic + Session ID
//
// Both panels use the same deterministic derivation (generateFromDigits).
// The same 12 digits always produce the same mnemonic and Session ID.
// ============================================================================

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<header class="site-header">
  <div class="header-content">
    <h1 class="header-title">CYBERLEEK</h1>
    <p class="header-subtitle">Secure Contact System — Proof of Concept</p>
  </div>
  <a href="https://github.com/henokyehulu/cyberleek-contact-system" target="_blank" class="github-link">
    <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
    <span>GitHub</span>
  </a>
</header>

<div class="page-grid">

  <!-- ============================================================ -->
  <!-- SENDER SIDE                                                   -->
  <!-- The user clicks "Generate" to create a unique Session account -->
  <!-- and sees the XMR amount they need to send.                    -->
  <!-- ============================================================ -->
  <div class="panel">
    <div class="sec-drop visible">
      <div class="sec-head">◈ SENDER SIDE</div>
      <div class="sec-body">
        <div class="faq-q" style="color: var(--green); margin-top: 0;">Secure Contact &amp; Advertising</div>
        <div class="faq-a">
          <p>CYBERLEEK is raising funds through community support and strategic partnerships. Sending a Monero payment enables secure contact via Session messenger for deal negotiations.</p>
        </div>
        <button class="btn" id="btn-generate" style="width: 100%; margin-top: 10px;">Generate Contact Details</button>

        <!-- Shown while PBKDF2 is running (~10-15 seconds) -->
        <div id="user-loading" style="display: none; text-align: center; padding: 2rem; color: var(--text-dim);">
          <div class="spinner"></div>
          <div>Generating your unique Session account... (Takes ~15 seconds)</div>
        </div>

        <!-- Shown after derivation completes -->
        <div id="user-content" style="display: none;">
          <!-- Step 1: Mnemonic — the 13-word recovery password for Session -->
          <div class="info-box" style="border-color: var(--amber-dim); background: rgba(255,204,0,0.04); color: var(--amber);">
            <div class="label">1. Save Your Recovery Password</div>
            <p style="font-size: 0.9em; color: var(--text-dim);">This is your Session account. If you lose these words, you lose the account and it's impossible for CYBERLEEK to contact you.</p>
            <div id="user-mnemonic" class="mnemonic-box"></div>
            <div style="margin-top:1rem;">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem; color: var(--text-bright);">Log into Session</h3>
              <p>Download <a href="https://getsession.org/download" target="_blank">Session</a>. Open it, tap "I have an account", and paste the words above.</p>
            </div>
          </div>

          <!-- Step 2: Session ID — derived from the mnemonic, this is the account address -->
          <div class="info-box">
            <div class="label">2. Your Session ID</div>
            <p style="font-size: 0.9em; color: var(--text-dim);">When you log into Session with the recovery password above, this will be your account ID. CYBERLEEK will use this to message you.</p>
            <div id="user-session-id" class="session-id-box"></div>
          </div>

          <!-- Step 3: XMR amount — the 12 digits appear after the decimal point -->
          <div class="info-box">
            <div class="label">2. Send Donation</div>
            <p style="font-size: 0.9em; color: var(--text-dim);">The numbers after the decimal point are your unique ID. Don't round them. The number before the decimal is the donation fee.</p>
            <div style="margin: 10px 0;">
              <div class="info-label">Amount (XMR)</div>
              <div id="user-xmr-amount" class="xmr-amount"></div>
            </div>
          </div>


        </div>
      </div>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- CYBERLEEK SIDE                                                -->
  <!-- CYBERLEEK inputs the 12 digits extracted from the XMR payment -->
  <!-- to derive the sender's mnemonic and Session ID.               -->
  <!-- ============================================================ -->
  <div class="panel">
    <div class="sec-drop visible">
      <div class="sec-head">◈ CYBERLEEK SIDE</div>
      <div class="sec-body">
        <div class="faq-q" style="color: var(--green); margin-top: 0;">Derive Session Account from XMR Payment</div>
        <div class="faq-a">
          <p>When a user sends a Monero payment, CYBERLEEK extracts the 12 digits after the decimal point and derives the user's Session account.</p>
        </div>

        <!-- Input field for the 12 digits — only allows numeric input -->
        <div class="info-box" style="margin-top: 15px;">
          <div class="label">Enter the 12 digits from the XMR payment</div>
          <div class="input-row">
            <input type="text" id="digits-input" maxlength="12" placeholder="e.g. 628749495626" autocomplete="off" />
            <button class="btn" id="btn-derive">Derive</button>
          </div>
        </div>

        <!-- Shown while PBKDF2 is running (~10-15 seconds) -->
        <div id="derive-loading" style="display: none; text-align: center; padding: 2rem; color: var(--text-dim);">
          <div class="spinner"></div>
          <div>Running PBKDF2 (100M iterations)... This takes ~15 seconds.</div>
        </div>

        <!-- Shown after derivation completes -->
        <div id="derive-content" style="display: none;">
          <!-- Step 1: Mnemonic — import this into Session to access the account -->
          <div class="info-box" style="border-color: var(--amber-dim); background: rgba(255,204,0,0.04); color: var(--amber);">
            <div class="label">1. Recovery Password (Mnemonic)</div>
            <p style="font-size: 0.9em; color: var(--text-dim);">Import these words into Session to access the account.</p>
            <div id="derived-mnemonic" class="mnemonic-box"></div>
            <div style="margin-top:1rem;">
              <button class="btn" id="copy-mnemonic" style="width: auto;">Copy Mnemonic</button>
            </div>
          </div>

          <!-- Step 2: Session ID — use this to message the sender -->
          <div class="info-box">
            <div class="label">2. Session ID</div>
            <p style="font-size: 0.9em; color: var(--text-dim);">Use this ID to message the user on Session.</p>
            <div id="derived-session-id" class="session-id-box"></div>
            <div style="margin-top:1rem;">
              <button class="btn" id="copy-session" style="width: auto;">Copy Session ID</button>
            </div>
          </div>

          <!-- Step 3: Instructions for what CYBERLEEK does next -->
          <div class="info-box">
            <div class="label">3. What CYBERLEEK Does Next</div>
            <p style="font-size: 0.9em; color: var(--text-dim);">Import the recovery password into Session, then message the user's Session ID to initiate the conversation.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>

<!-- ============================================================ -->
<!-- HOW DOES THIS ACTUALLY WORK? SECTION                          -->
<!-- Full-width explanation of the 5-step pipeline below the       -->
<!-- two panels. Explains PBKDF2, Session.js, Monero RingCT,      -->
<!-- deterministic derivation, and why the 3-layer system works.   -->
<!-- ============================================================ -->
<div class="sec-drop visible" style="margin-top: 16px;">
  <div class="sec-head">◈ HOW DOES THIS ACTUALLY WORK?</div>
  <div class="sec-body">
    <div class="steps-grid">

      <div class="step">
        <div class="step-num">01</div>
        <div class="step-body">
          <h3>Key Derivation (PBKDF2)</h3>
          <p>When you click "Generate", this page creates 12 random digits and feeds them into PBKDF2 &mdash; a standard key derivation function defined in <a href="https://datatracker.ietf.org/doc/html/rfc8018" target="_blank">RFC 8018</a>. PBKDF2 applies a password-based keyed derivation using HMAC-SHA256, running <strong>100 million iterations</strong> to produce a 128-bit seed. The password is the fixed string <code>cyberleek</code> and the salt is the 12-digit number. This process is deliberately slow to prevent brute-force attacks, taking roughly 10&ndash;15 seconds in a browser.</p>
        </div>
      </div>

      <div class="step">
        <div class="step-num">02</div>
        <div class="step-body">
          <h3>Session Account Generation</h3>
          <p>The 128-bit seed is converted to a 13-word mnemonic using the <a href="https://github.com/oxen-io/session-v2/tree/main/packages/session.js" target="_blank">Session.js</a> library. This mnemonic encodes the seed using a custom base-1626 wordlist with a CRC-32 checksum. From the same seed, an ed25519 keypair is generated and converted to an x25519 keypair, producing your unique <strong>Session ID</strong> (prefixed with <code>05</code>). This entire derivation is deterministic &mdash; the same 12 digits always produce the same mnemonic and Session ID.</p>
        </div>
      </div>

      <div class="step">
        <div class="step-num">03</div>
        <div class="step-body">
          <h3>Monero's Privacy Layer</h3>
          <p>You send exactly <code>400.{digits}</code> XMR to CYBERLEEK's address. Monero uses <strong>Ring Confidential Transactions (RingCT)</strong> to hide transaction amounts on the blockchain. Every observer sees the same encrypted amount &mdash; no one can see the 12 digits you sent. Only CYBERLEEK, who knows the one-time stealth address key, can decrypt the actual amount and extract your digits. This is enforced by the Monero protocol itself, not by any application-level encryption.</p>
        </div>
      </div>

      <div class="step">
        <div class="step-num">04</div>
        <div class="step-body">
          <h3>CYBERLEEK Derives Your Account</h3>
          <p>When CYBERLEEK detects the payment, they extract the 12 digits from the decrypted amount and run the same PBKDF2 function you just ran. This produces the exact same seed, the exact same mnemonic, and the exact same Session ID. CYBERLEEK imports the mnemonic into Session and messages your Session ID. Because the derivation is deterministic, both sides arrive at the same account &mdash; without ever communicating.</p>
        </div>
      </div>

      <div class="step">
        <div class="step-num">05</div>
        <div class="step-body">
          <h3>Why This Is Secure</h3>
          <p>The 12 digits are the <em>only</em> link between your XMR payment and your Session account. Monero hides them on the blockchain. PBKDF2 makes them computationally expensive to guess. Session provides end-to-end encrypted messaging with no central server storing messages. The system uses three independent privacy layers: Monero for payment privacy, PBKDF2 for key derivation, and Session for communication privacy. No single layer's compromise breaks the others.</p>
        </div>
      </div>

    </div>
  </div>
</div>

<!-- ============================================================ -->
<!-- FAQ SECTION                                                    -->
<!-- Common questions about the secure contact system.             -->
<!-- ============================================================ -->
<div class="sec-drop visible" style="margin-top: 16px;">
  <div class="sec-head">◈ FREQUENTLY ASKED QUESTIONS</div>
  <div class="sec-body">

    <details class="faq-item">
      <summary class="faq-question">How does CYBERLEEK know my Session ID if I never told them?</summary>
      <div class="faq-answer">
        <p>You never share your Session ID directly. By sending the exact XMR amount (<code>400.{digits}</code>), you are effectively embedding the 12 digits into the blockchain transaction. CYBERLEEK decrypts the amount (which only they can do), extracts the 12 digits, and runs the same derivation you just ran. Since the process is deterministic, both sides arrive at the same Session ID independently.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary class="faq-question">Can someone else on the blockchain see my 12 digits?</summary>
      <div class="faq-answer">
        <p>No. Monero uses Ring Confidential Transactions (RingCT), which encrypts transaction amounts on the blockchain. Every observer sees the same obfuscated value — no one can determine the actual amount you sent. Only the recipient (CYBERLEEK), who holds the private key to the one-time stealth address, can decrypt the real amount. This is a protocol-level guarantee, not an application-level trick.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary class="faq-question">What happens if I send from an exchange like KuCoin or Kraken?</summary>
      <div class="faq-answer">
        <p>Exchanges often round or modify the decimal amount during withdrawal. If the 12 digits after the decimal point change at all, CYBERLEEK will derive a completely different Session ID and will not be able to contact you. You <strong>must</strong> send from a personal wallet (Cake Wallet, Feather Wallet, etc.) where you control the exact amount down to 12 decimal places.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary class="faq-question">What if I lose the 13-word recovery password?</summary>
      <div class="faq-answer">
        <p>The account is gone. There is no central server, no email recovery, no "forgot password" link. The 13 words <em>are</em> the account. If you lose them, CYBERLEEK can still derive the Session ID from your XMR payment, but they will be messaging an account you can no longer access. Write the words down on paper and store them somewhere safe.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary class="faq-question">Can I verify the Session message is really from CYBERLEEK?</summary>
      <div class="faq-answer">
        <p>Yes. CYBERLEEK will message your Session ID — an ID that only you and CYBERLEEK know (since Monero hides it from everyone else). If someone messages you on Session claiming to be CYBERLEEK, but they don't know your Session ID, they are lying. The system is designed so that only the person who received your XMR payment can derive your account.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary class="faq-question">Why does the derivation take ~15 seconds? Is something wrong?</summary>
      <div class="faq-answer">
        <p>Nothing is wrong. PBKDF2 is deliberately slow — it runs 100 million iterations of HMAC-SHA256. This is the system's brute-force protection. If it were instant, an attacker could try billions of digit combinations per second. At 15 seconds per guess, even a powerful machine would need thousands of years to brute-force all possible 12-digit combinations (10<sup>12</sup> possibilities).</p>
      </div>
    </details>

    <details class="faq-item">
      <summary class="faq-question">Could someone guess my 12 digits?</summary>
      <div class="faq-answer">
        <p>There are 10<sup>12</sup> (one trillion) possible 12-digit combinations. Even if an attacker knew the password ("cyberleek") and the algorithm, each guess requires 100 million PBKDF2 iterations. At ~15 seconds per guess, brute-forcing all combinations would take roughly 475,000 years on a single CPU core. The digits are safe.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary class="faq-question">Why "400" XMR? Can I send a different amount?</summary>
      <div class="faq-answer">
        <p>The integer part (400) is just a fixed contact fee set by CYBERLEEK. The important part is the 12 digits after the decimal point — those are your unique identifier. If you send a different integer amount, CYBERLEEK can still read the decimal digits and derive your Session ID. But the convention is 400 XMR as the standard contact fee.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary class="faq-question">Is this a scam? How do I know CYBERLEEK will actually contact me?</summary>
      <div class="faq-answer">
        <p>You are sending a real XMR payment to a real address. Whether CYBERLEEK responds is a trust question that this proof-of-concept cannot answer. What this PoC demonstrates is the <em>mechanism</em> — the cryptographic pipeline that makes anonymous, verifiable contact possible. The privacy guarantees (Monero hiding the amount, PBKDF2 making brute-force infeasible, Session providing E2EE) are all mathematically verifiable. Whether CYBERLEEK honors the deal is a separate question entirely.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary class="faq-question">Can I use this system to contact someone else?</summary>
      <div class="faq-answer">
        <p>Technically yes. You could modify this system for any use case where anonymous, verifiable contact is needed. The core idea — embed a secret in an XMR payment, derive a Session account from it — is a general-purpose anonymous contact protocol. This PoC just shows how CYBERLEEK implemented it.</p>
      </div>
    </details>

  </div>
</div>

<!-- ============================================================ -->
<!-- MY FINAL TAKE                                                  -->
<!-- A personal note from the creator about the project.           -->
<!-- ============================================================ -->
<div class="sec-drop visible" style="margin-top: 16px;">
  <div class="sec-head">◈ MY FINAL TAKE</div>
  <div class="sec-body">
    <div class="final-take">
      <p>Ok so here is the thing. I have been playing games since i was like 7 years old and when i saw GTA 6 through the leaks man i dont know how to feel. On one side this game looks insane, like the graphics and everything its what i always dreamed about since i was a kid. But on the other side its sad that this is how we had to see it. Through a leak. Not an official trailer or nothing.</p>

      <p>But thats not even the craziest part. I went to CYBERLEEK website out of curiosity and i was like wait how does this guy even contact people privately? Like nobody knows who he is. So i started digging into the javascript code and thats when i fell into a rabbit hole. Monero, Session, PBKDF2, mnemonic seeds, key derivation... i didnt know any of this stuff before.</p>

      <p>The way people on this side of the internet use cryptography to stay hidden is honestly impressive. I'm not saying leaking games is right but the way the whole contact system works? Thats some serious engineering. Three layers of privacy working together and you dont even need to trust anyone because the math does all the work.</p>

      <p>This whole project is basically me trying to understand how it works. I built most of it with AI help but i made sure i actually understand what each part does. The PBKDF2 stuff, how monero hides the amounts, how session keys are generated from a seed. I even made an FAQ section up there because those were literally the questions i had when i first checked out the site.</p>

      <p>I'm still learning how to code so this project probably needs improvements. If you see something wrong or have ideas feel free to open an issue or whatever. I'm happy to learn.</p>

      <p style="color: var(--green); margin-top: 16px;">Peace</p>
    </div>
  </div>
</div>

`;

// ============================================================================
// SENDER SIDE — DOM event wiring
// ============================================================================

const generateBtn = document.getElementById("btn-generate")! as HTMLButtonElement;
const userLoading = document.getElementById("user-loading")!;
const userContent = document.getElementById("user-content")!;
const userMnemonicEl = document.getElementById("user-mnemonic")!;
const userXmrAmountEl = document.getElementById("user-xmr-amount")!;
const userSessionEl = document.getElementById("user-session-id")!;

/**
 * Sender-side click handler:
 * 1. Generates 12 random cryptographically secure digits
 * 2. Runs PBKDF2 (100M iterations) to derive the mnemonic and Session ID
 * 3. Displays the mnemonic, Session ID, and XMR amount (400.{digits})
 */
generateBtn.addEventListener("click", async () => {
  generateBtn.disabled = true;
  userLoading.style.display = "block";
  userContent.style.display = "none";

  const digits = generateRandomDigits();
  const { mnemonic, sessionId } = await generateFromDigits(digits);

  userMnemonicEl.textContent = mnemonic;
  userXmrAmountEl.textContent = `400.${digits}`;
  userSessionEl.textContent = sessionId;

  userLoading.style.display = "none";
  userContent.style.display = "block";
  generateBtn.textContent = "Regenerate";
  generateBtn.disabled = false;
});

// ============================================================================
// CYBERLEEK SIDE — DOM event wiring
// ============================================================================

const digitsInput = document.getElementById("digits-input") as HTMLInputElement;
const deriveBtn = document.getElementById("btn-derive")! as HTMLButtonElement;
const deriveLoading = document.getElementById("derive-loading")!;
const deriveContent = document.getElementById("derive-content")!;
const derivedMnemonicEl = document.getElementById("derived-mnemonic")!;
const derivedSessionEl = document.getElementById("derived-session-id")!;
const copyMnemonicBtn = document.getElementById("copy-mnemonic")! as HTMLButtonElement;
const copySessionBtn = document.getElementById("copy-session")! as HTMLButtonElement;

/** Strips non-numeric characters and enforces 12-digit max length */
digitsInput.addEventListener("input", () => {
  digitsInput.value = digitsInput.value.replace(/[^0-9]/g, "").slice(0, 12);
});

/**
 * CYBERLEEK-side click handler:
 * 1. Validates exactly 12 digits were entered
 * 2. Runs the same PBKDF2 derivation as the sender side
 * 3. Displays the derived mnemonic and Session ID
 * 4. CYBERLEEK can now import the mnemonic into Session
 */
deriveBtn.addEventListener("click", async () => {
  const digits = digitsInput.value.trim();
  if (digits.length !== 12) {
    digitsInput.style.borderColor = "var(--red)";
    return;
  }
  digitsInput.style.borderColor = "";

  deriveBtn.disabled = true;
  deriveLoading.style.display = "block";
  deriveContent.style.display = "none";

  const { mnemonic, sessionId } = await generateFromDigits(digits);

  derivedMnemonicEl.textContent = mnemonic;
  derivedSessionEl.textContent = sessionId;

  deriveLoading.style.display = "none";
  deriveContent.style.display = "block";
  deriveBtn.disabled = false;
});

/** Copies the derived mnemonic to the clipboard */
copyMnemonicBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(derivedMnemonicEl.textContent || "");
  copyMnemonicBtn.textContent = "Copied!";
  setTimeout(() => (copyMnemonicBtn.textContent = "Copy Mnemonic"), 1500);
});

/** Copies the derived Session ID to the clipboard */
copySessionBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(derivedSessionEl.textContent || "");
  copySessionBtn.textContent = "Copied!";
  setTimeout(() => (copySessionBtn.textContent = "Copy Session ID"), 1500);
});
