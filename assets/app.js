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

      heroSubtitle: "The entry gate to the Ladder Plan",
      heroHook: "Token is to cognition what joule is to energy. The bottleneck is no longer the model. It is architecture.",
      heroTagline:
        "We are looking for people who can bind 10^9-10^12 tokens to one complex goal. Submit a scaffold that evolves itself, beats its own ablation, and turns larger token budgets into reliable cognitive work.",
      heroCTA: "↓  enter the gate",
      scrollHint: "scroll to read how selection works",

      manifestoLabel: "manifesto",
      manifestoTitle: "THE LADDER PLAN",
      manifestoBody: `
        <p>Most AI agents still operate around 10^4-10^6 tokens. The Ladder Plan studies how to constrain 10^9-10^12 tokens toward a single complex objective: weeks or months of ordered execution with minimal human intervention, verification, and rollback.</p>
        <p class="dim">Token-Ignition is the selection gate for that work. We do not screen for legibility. We ask for an artifact: a scaffold that can evolve across runs and prove its delta against a minimal ablation.</p>
      `,

      protocolLabel: "protocol",
      protocolTitle: "META-RULES",
      protocolItems: [
        ["R1", "You define a long-horizon task that requires a scaffold, not a one-shot prompt."],
        ["R2", "You define the evaluation criterion. It must be reproducible and machine-verifiable."],
        ["R3", "You build the scaffold. The scaffold — not you — produces the final output."],
        ["R4", "All submissions are AI-judged. Human audit is random and post-hoc."],
        ["R5", "Identity is irrelevant. Submissions are accepted under pseudonym."],
        ["R6", "Selection is gated. Pass a gate, unlock more resources. Pass the final gate, join the research."],
        ["R7", "Ablation is required: same model, same task, minimal scaffold. The delta is the evidence."],
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
        "Seven fields. No account. Your entry is hashed and appended to a public ledger. Review starts from pending and can advance through the gates.",
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
      field3Label: "evolution.axes",
      field3Hint: "Which axis changes across runs without human edits? Scaffold-level evolution carries the highest weight.",
      field3OptBehavior: "behavior",
      field3OptKnowledge: "knowledge",
      field3OptScaffold: "scaffold",
      field4Label: "execution.plan",
      field4Hint: "How does the scaffold evolve itself? What loop, signal, memory, or toolchain changes?",
      field4Ph: "Describe what the scaffold observes, how it updates itself, how it decides to stop, and what is different in the next run.",
      field5Label: "scaffold.artifact",
      field5Hint: "A live endpoint an AI can hit now, plus a public GitHub repository.",
      field5Ph: "https://…/benchmark",
      field5Repo: "scaffold.repo",
      field5RepoPh: "https://github.com/owner/scaffold",
      field6Label: "ablation.artifact",
      field6Hint: "Same model, same task, minimal scaffold. This is how we measure the delta.",
      field6Ph: "https://…/baseline",
      field6Repo: "ablation.repo",
      field6RepoPh: "https://github.com/owner/baseline",
      field7Label: "contact.handle",
      field7Hint:
        "A pseudonym is fine. We only use it to notify you when a gate opens.",
      field7Ph: "e.g. @handle on X, discord username, or email",

      consent:
        "I confirm my submission is my own work, both endpoints are live, and I accept AI-judged, non-negotiable evaluation.",
      submitButton: "submit",

      footLeft: "TOKEN-IGNITION  //  RESEARCH SELECTION  //  v0.1",
      footRight: "RESEARCH HOST: JOULE RESEARCH",

      ledgerLabel: "ledger",
      ledgerTitle: "RECENT APPLICATIONS",
      ledgerIntro:
        "Every application is stored as a hash on a public repository. No personal data is published.",

      feedback: {
        missing: "[reject] missing required fields. check highlighted items.",
        noAxis: "[reject] evolution.axes must have at least one selected.",
        badUrl:
          "[reject] scaffold endpoint must be a valid URL — our auditor has to crawl it.",
        badBaseline: "[reject] ablation endpoint must be a valid URL.",
        badRepo: "[reject] scaffold.repo must be a public github.com URL.",
        badBaselineRepo: "[reject] ablation.repo must be a public github.com URL.",
        ok: (hash) =>
          `[accept] entry ${hash} queued.\nAI audit window: 24h.\nYou will not receive a confirmation email. Watch the ledger.`,
      },
    },

    zh: {
      brand: "TOKEN-IGNITION // 研究员筛选",

      heroSubtitle: "天梯计划的入口",
      heroHook: "Token 之于认知,正如焦耳之于能量。瓶颈不再只是模型,而是架构。",
      heroTagline:
        "我们在寻找能把 10^9-10^12 量级 Token 约束到单一复杂目标上的人。提交一个会自我进化的脚手架,证明它能打过自己的消融基线,把更大 Token 预算转化为可靠的认知工作。",
      heroCTA: "↓  进入申请",
      scrollHint: "向下滚动,了解筛选机制",

      manifestoLabel: "宣言",
      manifestoTitle: "天梯计划",
      manifestoBody: `
        <p>绝大多数 AI Agent 仍运行在 10^4-10^6 Token 量级。天梯计划研究如何把 10^9-10^12 量级 Token 有效约束于单一复杂目标:数周、数月、极少人工干预、可验证、可回滚的有序执行。</p>
        <p class="dim">Token-Ignition 是进入这项工作的筛选门。我们不筛选简历的可读性,我们筛选产物:一个能跨运行自我进化,并能相对最小消融基线证明增量的脚手架。</p>
      `,

      protocolLabel: "协议",
      protocolTitle: "元规则",
      protocolItems: [
        ["R1", "你定义一个长跨度任务。它必须要求脚手架,而不是一次性 prompt。"],
        ["R2", "你定义评估标准。标准必须可复现、可被机器验证。"],
        ["R3", "你构建脚手架。最终产出来自脚手架,不是来自你。"],
        ["R4", "所有提交由 AI 评判。人工审计是随机抽查,事后进行。"],
        ["R5", "身份无关。允许使用化名提交。"],
        ["R6", "筛选分档。通过一档,解锁更多资源;通过最终档,进入研究组。"],
        ["R7", "必须提供消融对照:同模型、同任务、最小脚手架。差值即证据。"],
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
        "七个字段。不用注册账号。提交会被哈希后写入公开账本,先进入 pending,再沿着门槛推进。",
      field1Label: "task.definition",
      field1Hint: "系统要做什么?一段话。必须可测试。",
      field1Ph:
        "例:给定一串无标注的数值序列,系统需自主发现一种压缩方案,并在误差 ε 内重建原序列。",
      field2Label: "verification.criterion",
      field2Hint: "AI 审计怎么判断你通过了?给出确切的校验方式。",
      field2Ph:
        "例:审计器访问 /benchmark → 返回 JSON { inputs[], outputs[] }。若在全部留出输入上 L2 误差 < 0.01 且压缩比 > 8x,即为通过。",
      field3Label: "evolution.axes",
      field3Hint: "你的脚手架在哪条轴上跨运行改变?脚手架层级的自我修改权重最高。",
      field3OptBehavior: "行为",
      field3OptKnowledge: "知识",
      field3OptScaffold: "脚手架",
      field4Label: "execution.plan",
      field4Hint: "脚手架如何自我进化?循环、信号、记忆、工具链分别如何变化?",
      field4Ph:
        "描述脚手架观察什么、如何更新自己、如何停止,以及下一次运行具体哪里不同。",
      field5Label: "scaffold.artifact",
      field5Hint: "一个 AI 现在就能访问的端点,加一个公开 GitHub 仓库。",
      field5Ph: "https://…/benchmark",
      field5Repo: "scaffold.repo",
      field5RepoPh: "https://github.com/owner/scaffold",
      field6Label: "ablation.artifact",
      field6Hint: "同模型、同任务、最小脚手架。我们用它衡量你的增量。",
      field6Ph: "https://…/baseline",
      field6Repo: "ablation.repo",
      field6RepoPh: "https://github.com/owner/baseline",
      field7Label: "contact.handle",
      field7Hint: "化名也可以。仅用于在门槛解锁时通知你。",
      field7Ph: "例:X 上的 @handle、Discord 用户名或邮箱",

      consent:
        "我确认这是我本人的作品,两个端点当前可访问,并接受由 AI 评判、不可申诉的评估结果。",
      submitButton: "提交",

      footLeft: "TOKEN-IGNITION  //  研究员筛选  //  v0.1",
      footRight: "研究承载方:JOULE RESEARCH",

      ledgerLabel: "账本",
      ledgerTitle: "近期申请",
      ledgerIntro: "每条申请以哈希形式写入公开仓库,不发布任何个人信息。",

      feedback: {
        missing: "[reject] 必填字段缺失。请检查标红项。",
        noAxis: "[reject] evolution.axes 至少选择一项。",
        badUrl: "[reject] scaffold endpoint 必须是有效 URL——审计器需要抓取它。",
        badBaseline: "[reject] ablation endpoint 必须是有效 URL。",
        badRepo: "[reject] scaffold.repo 必须是公开 GitHub URL。",
        badBaselineRepo: "[reject] ablation.repo 必须是公开 GitHub URL。",
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
      const repo = form.repo.value.trim();
      const baselineEndpoint = form.baselineEndpoint.value.trim();
      const baselineRepo = form.baselineRepo.value.trim();
      const contact = form.contact.value.trim();
      const consent = document.getElementById("f-consent").checked;
      const axes = Array.from(form.querySelectorAll('input[name="axis"]:checked')).map((el) => el.value);

      if (!task || !criterion || !plan || !endpoint || !repo || !baselineEndpoint || !baselineRepo || !contact || !consent) {
        fb.className = "submit-feedback visible error";
        fb.textContent = t.feedback.missing;
        return;
      }
      if (!axes.length) {
        fb.className = "submit-feedback visible error";
        fb.textContent = t.feedback.noAxis;
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
      try {
        const u = new URL(baselineEndpoint);
        if (!/^https?:$/.test(u.protocol)) throw new Error("bad");
      } catch {
        fb.className = "submit-feedback visible error";
        fb.textContent = t.feedback.badBaseline;
        return;
      }
      if (!/^https:\/\/(www\.)?github\.com\//.test(repo)) {
        fb.className = "submit-feedback visible error";
        fb.textContent = t.feedback.badRepo;
        return;
      }
      if (!/^https:\/\/(www\.)?github\.com\//.test(baselineRepo)) {
        fb.className = "submit-feedback visible error";
        fb.textContent = t.feedback.badBaselineRepo;
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
          body: JSON.stringify({ task, criterion, axes, plan, endpoint, repo, baselineEndpoint, baselineRepo, contact }),
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
