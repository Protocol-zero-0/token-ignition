/* ============================================================================
 *  Token-Ignition  ·  live ledger panel
 * ----------------------------------------------------------------------------
 *  Renders #ledger-table with real verdicts pulled from the public ledger
 *  repo (submissions/*.json). Replaces the localStorage mock in app.js.
 *
 *  Include right before </body>, e.g.
 *     <script src="./assets/ledger.js" defer
 *             data-ledger-repo="Protocol-zero-0/token-ignition-ledger"
 *             data-branch="main"
 *             data-poll-seconds="10"
 *             data-show-recent="10"></script>
 * ========================================================================= */

(() => {
  "use strict";

  const script = document.currentScript;
  const cfg = {
    repo:
      (script && script.dataset.ledgerRepo) ||
      "Protocol-zero-0/token-ignition-ledger",
    branch:
      (script && script.dataset.branch) ||
      "main",
    pollSeconds:
      Number((script && script.dataset.pollSeconds) || 10),
    showRecent:
      Number((script && script.dataset.showRecent) || 10),
  };

  const host = document.getElementById("ledger-table");
  if (!host) return;

  // mark the panel as live — lets app.js know not to seed mock data
  host.dataset.live = "1";

  const rawBase = (path) =>
    `https://raw.githubusercontent.com/${cfg.repo}/${cfg.branch}/${path}`;
  const htmlUrl = (path) =>
    `https://github.com/${cfg.repo}/blob/${cfg.branch}/${path}`;

  const VERDICT_LABELS = {
    pending: "PENDING",
    admitted: "ADMITTED",
    verified: "VERIFIED",
    advanced: "ADVANCED",
    ignited: "IGNITED",
    rejected: "REJECTED",
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function timeAgo(ts) {
    if (!ts) return "—";
    const now = Math.floor(Date.now() / 1000);
    const d = Math.max(0, now - ts);
    if (d < 60) return `T-${d}s`;
    if (d < 3600) return `T-${Math.floor(d / 60)}m`;
    if (d < 86400) return `T-${Math.floor(d / 3600)}h`;
    return `T-${Math.floor(d / 86400)}d`;
  }

  function render(rows) {
    if (!rows.length) {
      host.innerHTML =
        '<div class="ledger-row"><div class="hash">—</div>' +
        '<div class="time">waiting for first submission</div>' +
        '<div class="status">—</div></div>';
      return;
    }
    host.innerHTML = rows
      .slice(0, cfg.showRecent)
      .map((r) => {
        const label = VERDICT_LABELS[r.verdict] || (r.verdict || "unknown").toUpperCase();
        return `<div class="ledger-row">
          <div class="hash">
            <a href="${htmlUrl("submissions/" + r.submission_id + ".json")}"
               target="_blank" rel="noopener">0x${escapeHtml(r.submission_id)}</a>
          </div>
          <div class="time">${escapeHtml(timeAgo(r.ts))}</div>
          <div class="status ${escapeHtml(r.verdict || "pending")}">${escapeHtml(label)}</div>
        </div>`;
      })
      .join("");
  }

  async function fetchViaIndex() {
    const resp = await fetch(rawBase("submissions/index.json"), { cache: "no-store" });
    if (!resp.ok) throw new Error("no index.json");
    const data = await resp.json();
    if (!Array.isArray(data)) throw new Error("index not array");
    return data;
  }

  async function fetchViaContentsApi() {
    const resp = await fetch(
      `https://api.github.com/repos/${cfg.repo}/contents/submissions?ref=${cfg.branch}`,
      { cache: "no-store" },
    );
    if (!resp.ok) return [];
    const files = await resp.json();
    if (!Array.isArray(files)) return [];
    const recent = files
      .filter((f) => f.name && f.name.endsWith(".json"))
      .slice(0, cfg.showRecent);

    const rows = await Promise.all(
      recent.map(async (f) => {
        try {
          const r = await fetch(f.download_url, { cache: "no-store" });
          if (!r.ok) return null;
          const j = await r.json();
          return {
            submission_id: j.submission_id || f.name.replace(".json", ""),
            verdict: j.verdict || "pending",
            ts: j.ts || 0,
          };
        } catch {
          return null;
        }
      }),
    );

    return rows.filter(Boolean).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }

  async function refresh() {
    try {
      let rows = [];
      try {
        rows = await fetchViaIndex();
      } catch {
        rows = await fetchViaContentsApi();
      }
      render(rows);
    } catch (err) {
      console.warn("[ti-ledger] refresh failed:", err);
    }
  }

  refresh();
  setInterval(refresh, cfg.pollSeconds * 1000);
})();
