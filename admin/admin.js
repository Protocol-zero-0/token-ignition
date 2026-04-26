(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const state = { items: [], filter: "all" };

  async function api(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: {
        "accept": "application/json",
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  }

  function showApp(show) {
    $("#login").hidden = show;
    $("#app").hidden = !show;
  }

  async function load() {
    const r = await api("/api/admin/submissions");
    if (!r.ok) {
      showApp(false);
      return;
    }
    state.items = r.json.items || [];
    showApp(true);
    render();
  }

  function render() {
    const rows = state.filter === "all"
      ? state.items
      : state.items.filter((x) => x.status === state.filter || x.verdict === state.filter);
    $("#count").textContent = `${rows.length} / ${state.items.length} submissions`;
    $("#list").innerHTML = rows.length
      ? rows.map(renderItem).join("")
      : `<div class="item"><div class="item-head"><span class="task">No submissions.</span></div></div>`;
    document.querySelectorAll(".item-head").forEach((head) => {
      head.addEventListener("click", () => {
        const detail = head.parentElement.querySelector(".detail");
        detail.hidden = !detail.hidden;
      });
    });
    document.querySelectorAll("[data-save]").forEach((btn) => {
      btn.addEventListener("click", () => save(btn.getAttribute("data-save")));
    });
  }

  function renderItem(s) {
    const id = s.id || s.submission_id;
    return `<article class="item">
      <div class="item-head">
        <span class="hash">${esc(s.hash || ("0x" + id))}</span>
        <span class="status">${esc(s.status || s.verdict || "pending")}</span>
        <span class="task">${esc(s.task_excerpt || s.task || "")}</span>
        <span class="axes">${esc((s.axes || []).join("+") || "-")}</span>
      </div>
      <div class="detail" hidden>
        ${kv("contact", s.contact || "(not decryptable; set ADMIN_TOKEN/CONTACT_ENCRYPTION_SECRET consistently)")}
        ${kv("task", s.task, "muted")}
        ${kv("criterion", s.criterion, "muted")}
        ${kv("plan", s.plan, "muted")}
        ${kv("scaffold.endpoint", link(s.endpoint))}
        ${kv("scaffold.repo", link(s.repo))}
        ${kv("ablation.endpoint", link(s.baselineEndpoint))}
        ${kv("ablation.repo", link(s.baselineRepo))}
        ${kv("reasoning", s.reasoning || "", "muted")}
        <div class="actions">
          <select id="status-${esc(id)}">
            ${["pending", "admitted", "verified", "ignited", "rejected"].map((x) =>
              `<option value="${x}" ${x === (s.status || s.verdict) ? "selected" : ""}>${x}</option>`
            ).join("")}
          </select>
          <input id="note-${esc(id)}" placeholder="manual note" />
          <button data-save="${esc(id)}">save status</button>
        </div>
      </div>
    </article>`;
  }

  function kv(k, v, cls = "") {
    return `<div class="kv"><span class="k">${esc(k)}</span><span class="v ${esc(cls)}">${v || "—"}</span></div>`;
  }

  function link(url) {
    if (!url) return "";
    return `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>`;
  }

  async function save(id) {
    const status = $(`#status-${CSS.escape(id)}`).value;
    const note = $(`#note-${CSS.escape(id)}`).value;
    const r = await api("/api/admin/update", {
      method: "POST",
      body: JSON.stringify({ id, status, note }),
    });
    if (!r.ok) {
      alert(r.json.error || "save failed");
      return;
    }
    await load();
  }

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#login-error").textContent = "";
    const token = $("#token").value.trim();
    const r = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    if (!r.ok) {
      $("#login-error").textContent = r.json.error || "login failed";
      return;
    }
    await load();
  });

  $("#refresh").addEventListener("click", load);
  document.querySelector(".filters").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-status]");
    if (!btn) return;
    document.querySelectorAll(".filters button").forEach((x) => x.classList.toggle("active", x === btn));
    state.filter = btn.dataset.status;
    render();
  });

  load();
})();
