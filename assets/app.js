/* ============================================================
   TOKEN-IGNITION — front-end v2
   - scrollable academic layout
   - hybrid terminal aesthetic + real form inputs
   - bilingual EN / ZH
   - procedural ASCII hero art
   - background node topology
   ============================================================ */

(() => {
  "use strict";

  /* --------------------------------------------------------------
     i18n
     -------------------------------------------------------------- */

  const I18N = {
    en: {
      brand: "TOKEN-IGNITION // RESEARCH SELECTION",

      heroSubtitle: "A selection gate for AI-native researchers",
      heroHook: "The task is the interview. Pass it, and you join the research.",
      heroTagline:
        "You define the task. You build the system. The system must evolve itself. If it clears the AI-audited gate, you're invited into the research group. Tokens are how we make that possible — not why we do it.",
      heroCTA: "↓  enter the gate",
      scrollHint: "scroll to read how selection works",

      manifestoLabel: "manifesto",
      manifestoTitle: "HOW WE SELECT",
      manifestoBody: `
        <p>Hiring in frontier AI is broken. The legible names get the interviews, the compute, the role. The people who would actually have moved the field rarely pass the filters.</p>
        <p class="dim">CVs measure legibility, not ability. Pitch decks measure articulation, not craft. Interviews measure composure under pressure. None of these measure whether you can build a system that evolves itself.</p>
        <p>So we inverted the interview. Give us a task you defined, and a system you built. If the system can clear the AI-audited gate by evolving itself, you're in the research group.</p>
        <p class="dim">No CVs. No pitch decks. No intro calls. The artifact is the application. Passing is the offer.</p>
      `,

      protocolLabel: "protocol",
      protocolTitle: "META-RULES",
      protocolItems: [
        ["R1", "You define the task. The task must require a system that evolves itself."],
        ["R2", "You define the evaluation criterion. It must be reproducible and machine-verifiable."],
        ["R3", "You build the system. The system — not you — produces the final output."],
        ["R4", "All submissions are AI-judged. Human audit is random and post-hoc."],
        ["R5", "Identity is irrelevant. Submissions are accepted under pseudonym."],
        ["R6", "Selection is gated. Pass a gate, unlock more resources. Pass the final gate, join the research."],
      ],

      rulesLabel: "submission requirements",
      rulesTitle: "WHAT COUNTS AS A VALID SUBMISSION",
      rulesItems: [
        {
          head: "01 // Self-evolution, not prompt-engineering.",
          body: [
            "The system must modify its own behavior across iterations",
            "without human edits to prompts, weights, or code between runs.",
          ],
        },
        {
          head: "02 // Machine-verifiable output.",
          body: [
            "The evaluation criterion must be checkable by an AI auditor",
            "with no proprietary access — public endpoint, public artifact.",
          ],
        },
        {
          head: "03 // Live, AI-readable endpoint.",
          body: [
            "You must provide a URL an AI can crawl. HTML is fine.",
            "JSON / OpenAPI / plain text are better. Logins, captchas, GUIs are not accepted.",
          ],
        },
        {
          head: "04 // Reproducibility micro-run.",
          body: [
            "Attach at least one log of a full run: inputs, intermediate state,",
            "final artifact hash. Our auditor re-runs a randomly sampled slice.",
          ],
        },
      ],
      rulesCalloutHead: "// AUDIT NOTE",
      rulesCalloutBody:
        "If the AI auditor cannot independently verify your artifact, the submission is rejected. We do not email you for clarifications. The endpoint is the application.",

      allocationLabel: "the three gates",
      allocationTitle: "HOW SELECTION WORKS",
      allocation1Note:
        "Admission tier. Any well-formed submission receives a 1M token budget to run and prove its system.",
      allocation2Note:
        "Verified tier. Unlocked when the AI auditor confirms reproducible self-evolution on your gate.1 artifact.",
      allocation3Note:
        "Research tier. Unlocked when emergent behavior — absent in the initial system — is verified by consensus of ≥3 independent models. Gate.3 clearance is a standing invitation to join the research group.",

      submitLabel: "submission",
      submitTitle: "APPLY BY SUBMITTING",
      submitIntro:
        "Five fields. No account. Your entry is hashed and appended to a public ledger. AI audit starts within 24h. Clear the final gate and we reach out to talk about joining the research.",
      field1Label: "task.definition",
      field1Hint:
        "What does the system have to do? One paragraph. Must be testable.",
      field1Ph:
        "e.g. Given a stream of unlabeled numerical sequences, the system must autonomously discover a compression scheme and reconstruct the originals within tolerance ε.",
      field2Label: "verification.criterion",
      field2Hint:
        "How will an AI auditor know you passed? Give the exact check.",
      field2Ph:
        "e.g. Auditor fetches /benchmark → receives JSON { inputs[], outputs[] }. Passes if L2 error < 0.01 on all held-out inputs and compression ratio > 8x.",
      field3Label: "execution.plan",
      field3Hint:
        "How does the system evolve itself? What loop, what signal, what memory?",
      field3Ph:
        "Describe the self-modification loop — what the system observes, how it updates itself, how it decides to stop. Write as you would write it to a peer reviewer, not to a VC.",
      field4Label: "live.endpoint",
      field4Hint:
        "A URL an AI can hit right now and get a machine-readable result.",
      field4Ph: "https://…",
      field4Artifact:
        "attach run log (optional, ≤1MB, txt/md/json/log/yaml/jsonl/csv)",
      field5Label: "contact.handle",
      field5Hint:
        "A pseudonym is fine. We only use it to notify you when a gate opens.",
      field5Ph: "e.g. @handle on X, discord username, or email",

      consent:
        "I confirm my submission is my own work, the endpoint is live, and I accept AI-judged, non-negotiable evaluation.",
      submitButton: "submit",

      footLeft: "TOKEN-IGNITION  //  RESEARCH SELECTION  //  v0.1",
      footRight: "RESEARCH HOST: JOULE RESEARCH",

      ledgerLabel: "ledger",
      ledgerTitle: "RECENT APPLICATIONS",
      ledgerIntro:
        "Every application is stored as a hash on a public repository. No personal data is published.",

      feedback: {
        missing: "[reject] missing required fields. check highlighted items.",
        badUrl:
          "[reject] live.endpoint must be a valid URL — our auditor has to crawl it.",
        ok: (hash) =>
          `[accept] entry ${hash} queued.\nAI audit window: 24h.\nYou will not receive a confirmation email. Watch the ledger.`,
      },
    },

    zh: {
      brand: "TOKEN-IGNITION // 研究员筛选",

      heroSubtitle: "面向 AI 原生研究员的筛选入口",
      heroHook: "任务本身就是申请书。通过了,就进研究组。",
      heroTagline:
        "你定义任务。你构建系统。系统必须自我进化。通过 AI 审计的门槛后,你会被邀请进入研究组。token 只是我们让这件事成为可能的方式,不是它的目的。",
      heroCTA: "↓  进入申请",
      scrollHint: "向下滚动,了解筛选机制",

      manifestoLabel: "宣言",
      manifestoTitle: "我们怎么选人",
      manifestoBody: `
        <p>前沿 AI 领域的招聘机制是坏的。能被看见的名字拿到面试、拿到算力、拿到位置。真正可能推动这个行业的人,往往过不了筛子。</p>
        <p class="dim">简历衡量的是可读性,不是能力。Pitch 衡量的是表达,不是手艺。面试衡量的是临场镇定。没有一项,真正衡量你能不能造出一个会自我进化的系统。</p>
        <p>所以我们把面试反过来。你给我们一个你自己定义的任务,和一个你自己造的系统。如果这个系统能靠自我进化通过 AI 审计,你就进入研究组。</p>
        <p class="dim">不看简历。不看 pitch。不做 intro call。作品本身就是申请。通过,就是 offer。</p>
      `,

      protocolLabel: "协议",
      protocolTitle: "元规则",
      protocolItems: [
        ["R1", "你定义任务。该任务必须要求一个会自我进化的系统来完成。"],
        ["R2", "你定义评估标准。标准必须可复现、可被机器验证。"],
        ["R3", "你构建系统。最终产出来自系统,不是来自你。"],
        ["R4", "所有提交由 AI 评判。人工审计是随机抽查,事后进行。"],
        ["R5", "身份无关。允许使用化名提交。"],
        ["R6", "筛选分档。通过一档,解锁更多资源;通过最终档,进入研究组。"],
      ],

      rulesLabel: "提交要求",
      rulesTitle: "怎样才算一个有效提交",
      rulesItems: [
        {
          head: "01 // 必须是自我进化,而不是 prompt 工程。",
          body: [
            "系统在多轮迭代间必须自行修改自身行为,",
            "而非由人手动改 prompt、改权重或改代码。",
          ],
        },
        {
          head: "02 // 机器可验证的输出。",
          body: [
            "评估标准必须允许 AI 审计在无专有接口的情况下独立核对——",
            "公开端点,公开产物。",
          ],
        },
        {
          head: "03 // 活的、AI 可读的端点。",
          body: [
            "你必须提供一个 AI 能直接访问的 URL。HTML 也可以,",
            "JSON / OpenAPI / 纯文本更好。登录、验证码、纯图形界面不接受。",
          ],
        },
        {
          head: "04 // 可复现的最小运行记录。",
          body: [
            "至少附一段完整运行日志:输入、中间状态、最终产物哈希。",
            "我们的审计器会随机抽一小段重跑。",
          ],
        },
      ],
      rulesCalloutHead: "// 审计说明",
      rulesCalloutBody:
        "如果 AI 审计无法独立验证你的产物,提交将被驳回。我们不会发邮件追问——端点本身就是申请书。",

      allocationLabel: "三道门",
      allocationTitle: "筛选机制",
      allocation1Note:
        "入围档。任何合规提交即获得 1M token 预算,用于让系统跑起来、自证能力。",
      allocation2Note:
        "验证档。当 AI 审计确认 gate.1 的产物具备可复现的自我进化,解锁。",
      allocation3Note:
        "研究档。当产物出现初始系统所不具备的涌现行为,并由 ≥3 个独立模型共识验证,解锁。通过 gate.3,就是进入研究组的长期邀请。",

      submitLabel: "申请",
      submitTitle: "提交即申请",
      submitIntro:
        "五个字段。不用注册账号。提交会被哈希后写入公开账本,AI 审计将在 24 小时内开始。通过最终门槛,我们会主动联系你,谈加入研究组的事。",
      field1Label: "task.definition",
      field1Hint: "系统要做什么?一段话。必须可测试。",
      field1Ph:
        "例:给定一串无标注的数值序列,系统需自主发现一种压缩方案,并在误差 ε 内重建原序列。",
      field2Label: "verification.criterion",
      field2Hint: "AI 审计怎么判断你通过了?给出确切的校验方式。",
      field2Ph:
        "例:审计器访问 /benchmark → 返回 JSON { inputs[], outputs[] }。若在全部留出输入上 L2 误差 < 0.01 且压缩比 > 8x,即为通过。",
      field3Label: "execution.plan",
      field3Hint: "系统如何自我进化?哪条循环、哪个信号、哪块记忆?",
      field3Ph:
        "描述自我修改的循环——系统观察什么,如何更新自身,如何判断停止。写给同行,不是写给投资人。",
      field4Label: "live.endpoint",
      field4Hint: "一个现在就能被 AI 访问、拿到机器可读结果的 URL。",
      field4Ph: "https://…",
      field4Artifact:
        "附运行日志(可选,≤1MB,支持 txt/md/json/log/yaml/jsonl/csv)",
      field5Label: "contact.handle",
      field5Hint: "化名也可以。仅用于在门槛解锁时通知你。",
      field5Ph: "例:X 上的 @handle、Discord 用户名或邮箱",

      consent:
        "我确认这是我本人的作品,端点当前可访问,并接受由 AI 评判、不可申诉的评估结果。",
      submitButton: "提交",

      footLeft: "TOKEN-IGNITION  //  研究员筛选  //  v0.1",
      footRight: "研究承载方:JOULE RESEARCH",

      ledgerLabel: "账本",
      ledgerTitle: "近期申请",
      ledgerIntro: "每条申请以哈希形式写入公开仓库,不发布任何个人信息。",

      feedback: {
        missing: "[reject] 必填字段缺失。请检查标红项。",
        badUrl: "[reject] live.endpoint 必须是有效 URL——审计器需要抓取它。",
        ok: (hash) =>
          `[accept] 条目 ${hash} 已入队。\nAI 审计窗口:24 小时。\n我们不会发确认邮件,请关注账本。`,
      },
    },
  };

  let LANG = localStorage.getItem("ti.lang") || "en";

  /* --------------------------------------------------------------
     i18n renderer
     -------------------------------------------------------------- */

  function applyI18n() {
    const t = I18N[LANG];
    document.documentElement.lang = LANG === "zh" ? "zh-CN" : "en";

    // text content
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (t[key] !== undefined) {
        const val = t[key];
        if (typeof val === "string") {
          if (val.trim().startsWith("<")) {
            el.innerHTML = val;
          } else {
            el.textContent = val;
          }
        }
      }
    });

    // placeholders
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      const key = el.getAttribute("data-i18n-ph");
      if (t[key] !== undefined) el.setAttribute("placeholder", t[key]);
    });

    // protocol list
    const pList = document.getElementById("protocol-list");
    if (pList) {
      pList.innerHTML = t.protocolItems
        .map(
          ([k, v]) =>
            `<li><span class="k">${k}</span><span class="v">${escapeHtml(v)}</span></li>`
        )
        .join("");
    }

    // rules list
    const rList = document.getElementById("rules-list");
    if (rList) {
      rList.innerHTML = t.rulesItems
        .map(
          (r) =>
            `<li>
               <div class="rule-head">${escapeHtml(r.head)}</div>
               <div class="rule-body">
                 ${r.body.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}
               </div>
             </li>`
        )
        .join("");
    }

    // lang buttons aria-current
    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.setAttribute(
        "aria-current",
        b.getAttribute("data-lang") === LANG ? "true" : "false"
      );
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* --------------------------------------------------------------
     ascii hero art — procedural noise field
     characters form a soft "emerging" pattern
     -------------------------------------------------------------- */

  function renderAsciiArt() {
    const el = document.getElementById("ascii-art");
    if (!el) return;

    const cols = window.innerWidth < 700 ? 56 : 88;
    const rows = 22;
    const chars = " ...::--==++**#@".split("");
    // We'll animate a slow t over time.
    let t = 0;

    function cell(x, y, t) {
      // Normalize to [-1, 1] centered
      const nx = (x / cols) * 2 - 1;
      const ny = (y / rows) * 2 - 1;
      // Radial falloff (sphere-ish intensity)
      const r = Math.sqrt(nx * nx + ny * ny * 2.2);
      const radial = Math.max(0, 1 - r * 1.05);
      // Pseudo-noise via multi-frequency sin
      const n =
        Math.sin(x * 0.22 + y * 0.17 + t * 0.6) * 0.5 +
        Math.sin(x * 0.09 - y * 0.28 + t * 0.4) * 0.3 +
        Math.sin((x + y) * 0.35 + t * 0.9) * 0.2;
      const v = radial * 0.85 + n * 0.25;
      const idx = Math.max(0, Math.min(chars.length - 1, Math.round(v * (chars.length - 1))));
      return chars[idx];
    }

    function frame() {
      let out = "";
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          out += cell(x, y, t);
        }
        out += "\n";
      }
      el.textContent = out;
    }

    frame();
    // slow animate
    setInterval(() => {
      t += 0.06;
      frame();
    }, 220);

    // redraw on resize
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        location.reload(); // simplest: re-layout cols
      }, 300);
    });
  }

  /* --------------------------------------------------------------
     background node topology (subtle)
     -------------------------------------------------------------- */

  function startTopology() {
    const canvas = document.getElementById("topology");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 0,
      h = 0,
      dpr = 1;

    const nodes = [];
    const N = 44;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth = window.innerWidth;
      h = canvas.clientHeight = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      nodes.length = 0;
      for (let i = 0; i < N; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      const maxDist = 180;
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            const alpha = (1 - d / maxDist) * 0.22;
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(frame);
    }

    window.addEventListener("resize", () => {
      resize();
    });
    resize();
    seed();
    requestAnimationFrame(frame);
  }

  /* --------------------------------------------------------------
     mock ledger (local, for visual only until backend is wired)
     -------------------------------------------------------------- */

  function renderLedger() {
    // The live ledger panel is owned by ledger.js (pulls from the public
    // ledger repo). If that script has taken over (data-live=1) we do
    // nothing. Otherwise we render a neutral placeholder — never the old
    // localStorage mock, which would mislead real users.
    const el = document.getElementById("ledger-table");
    if (!el) return;
    if (el.dataset.live === "1") return;
    el.innerHTML =
      '<div class="ledger-row">' +
      '<div class="hash">—</div>' +
      '<div class="time">ledger loading</div>' +
      '<div class="status">—</div></div>';
  }

  /* --------------------------------------------------------------
     submit form
     -------------------------------------------------------------- */

  function hashString(s) {
    // quick, non-crypto hash just for a local visual receipt
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return "0x" + (h >>> 0).toString(16).padStart(8, "0").slice(0, 4) + "…" +
      (h >>> 0).toString(16).padStart(8, "0").slice(4, 8);
  }

  function wireForm() {
    const form = document.getElementById("submit-form");
    if (!form) return;
    const fb = document.getElementById("submit-feedback");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const t = I18N[LANG];

      const task = form.task.value.trim();
      const criterion = form.criterion.value.trim();
      const plan = form.plan.value.trim();
      const endpoint = form.endpoint.value.trim();
      const contact = form.contact.value.trim();
      const consent = document.getElementById("f-consent").checked;

      if (!task || !criterion || !plan || !endpoint || !contact || !consent) {
        fb.className = "submit-feedback visible error";
        fb.textContent = t.feedback.missing;
        return;
      }

      try {
        const u = new URL(endpoint);
        if (!/^https?:$/.test(u.protocol)) throw new Error("bad");
      } catch {
        fb.className = "submit-feedback visible error";
        fb.textContent = t.feedback.badUrl;
        return;
      }

      // submitting state
      fb.className = "submit-feedback visible";
      fb.textContent = "> submitting to audit queue…";
      const btn = form.querySelector(".submit-btn");
      if (btn) btn.setAttribute("disabled", "true");

      try {
        const resp = await fetch("/api/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ task, criterion, plan, endpoint, contact }),
        });
        const data = await resp.json().catch(() => ({}));

        if (!resp.ok || !data.ok) {
          fb.className = "submit-feedback visible error";
          fb.textContent = "[reject] " + (data.error || `http ${resp.status}`);
          return;
        }

        const shortHash =
          "0x" + String(data.submission_id || "").padEnd(12, "·").slice(0, 4) +
          "…" + String(data.submission_id || "").slice(-4);

        fb.className = "submit-feedback visible";
        fb.textContent = t.feedback.ok(shortHash);
        form.reset();
      } catch (err) {
        fb.className = "submit-feedback visible error";
        fb.textContent = "[network] " + (err && err.message ? err.message : "unreachable");
      } finally {
        if (btn) btn.removeAttribute("disabled");
      }
    });
  }

  /* --------------------------------------------------------------
     lang toggle
     -------------------------------------------------------------- */

  function wireLang() {
    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.addEventListener("click", () => {
        LANG = b.getAttribute("data-lang");
        localStorage.setItem("ti.lang", LANG);
        applyI18n();
      });
    });
  }

  /* --------------------------------------------------------------
     boot
     -------------------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", () => {
    applyI18n();
    wireLang();
    renderAsciiArt();
    startTopology();
    renderLedger();
    wireForm();
  });
})();
