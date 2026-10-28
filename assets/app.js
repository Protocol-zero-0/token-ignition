/* ============================================================
   TOKEN-IGNITION — front-end v3 (GPU applications)
   - directions, quotas and limits come from /config/program.json
   - apply form (7 fields) -> /api/apply, status + AI review -> /api/my
   - bilingual ZH / EN, procedural ASCII hero, background topology
   ============================================================ */

(() => {
  "use strict";

  const I18N = {
    zh: {
      brand: "TOKEN-IGNITION // RSI 算力资助",
      heroLead: "RSI 研究的算力资助。你出想法和基线，我们出 GPU。",
      heroDef: "RSI（recursive self-improvement，递归自我改进）：让 AI 研究 agent 去改进 AI 系统本身，包括评测、harness、训练和科研流程。",
      heroStats: (L, gpu) => [
        ["RTX 5090", gpu.zh.replace(/^RTX 5090 /, "")],
        [`${L.trial_gpu_hours_max} 卡时`, `试跑 · ${L.trial_days} 天出结果`],
        [`${L.full_gpu_hours_max} 卡时`, `完整 · ${L.full_days / 7} 周交付`],
        ["~15 分钟", "申请 · AI 结构化评审"],
      ],
      heroCTA: "↓ 申请算力",
      heroCTA2: "看方向",

      dirLabel: "方向",
      dirTitle: "资助五类 RSI 研究",
      dirIntro: "你的基线就是考卷：从一个公开、可复现的结果出发，用程序算出的指标证明你超过了它。不需要自带 GPU。",
      pathsTitle: "两种入口",
      paths: [
        ["A · 带来你参与过的项目", "一个你参与构建、完全开源的项目。它的开放问题和刷分漏洞，你比任何人都清楚。"],
        ["B · 从领域知名项目出发", "选一个和你专长相关的知名开源项目，围绕它的一个实验设计 RSI 任务。"],
      ],

      flowLabel: "流程",
      flowTitle: "五步，短周期",
      flowItems: [
        ["申请", "GitHub 登录，填 7 项，约 15 分钟。"],
        ["AI 评审", "证据核查、7 道硬门槛、质量评审，通常 24 小时内出报告。可在原申请上修改，最多 3 次。"],
        ["试跑", "通过即发 RTX 5090 容器账号，3 天内跑通最小实验。"],
        ["交成果", "公开仓库、一次完整运行的记录、与基线对比的数字。"],
        ["完整额度", "成果复审通过，按计划给卡，2 周内交付。"],
      ],
      tierKeys: ["T1 · 试跑", "T2 · 完整", "T3 · 研究组"],

      reviewLabel: "评审",
      reviewTitle: "结构化评审",
      reviewIntro: "每份申请收到一份格式固定的评审报告，逐项写明证据和改法，显示在你的申请状态里。",
      reportOutline: [
        ["提案复述", "用一段话复述你要验证什么，确认理解一致。"],
        ["证据核查", "申请人公开作品、基线仓库与版本、相关工作。"],
        ["硬门槛", "7 道，逐项 Pass / Fail，附证据和改法。任何一道 Fail 即需修改。"],
        ["算力估算", "按你的计划估算卡时，判断试跑是否放得进额度。"],
        ["质量评审", "前沿相关性、科学价值、迭代可行性、统计解释力。"],
        ["结论", "通过 / 需修改 / 不通过。"],
      ],
      gatesTitle: "7 道硬门槛",
      failTitle: "常见不通过原因",
      sampleTitle: "报告示例",
      sampleIntro: "下面是一份示例申请收到的完整报告，申请内容为虚构。",
      sampleSummary: "展开示例报告",

      applyLabel: "申请",
      applyTitle: "申请算力",
      applyIntro: "先用 GitHub 登录。注册不满 30 天的账号暂不接收。",
      authLogin: "用 GitHub 登录",
      authLogout: "退出",
      authRequired: "提交前需要先用 GitHub 登录。",
      authSignedIn: (login) => `已登录：${login}`,
      authUnavailable: "登录服务暂时不可用，请稍后再试。",

      helperSummary: "不想自己写？用你自己的 AI 帮你起草",
      helperIntro: "把下面这段复制到 ChatGPT、Claude 或任何你常用的 AI 里，回答它的追问，再把结果填进表单。",
      helperCopy: "复制提示词",
      helperCopied: "已复制",
      helperPrompt: (dirs) => `你是我的 RSI 研究申请助手。我要申请 Token Ignition 的 GPU（RTX 5090），做 RSI（递归自我改进）方向的研究。
可选方向：${dirs}。
请一次问我一个问题，帮我把想法整理成下面 7 项，最后按顺序输出：
1. 方向：从上面选一个
2. 研究问题：一句话说清要验证什么
3. 基线：公开仓库链接 + 固定 commit 或版本 + 已报告的数字
4. 指标与防作弊：在什么数据上、用什么指标、由哪个程序算；测试集怎么隔离；agent 有没有办法伪造分数
5. 实验设计：agent 能改什么、什么冻结、和谁对照；试跑 3 天内跑什么；成功和失败各会看到什么
6. 算力：试跑多少卡时（上限 24），完整多少卡时（上限 200）
7. 代表作：一个论文、仓库或比赛的链接
评审会逐项检查：RSI 范围、申请人能力、基线可追溯、问题与指标、动作空间、评测完整性、算力与周期。
如果哪一项过不了，请直接指出并帮我改。`,

      f1Label: "方向",
      f1Hint: "选一个最接近的。",
      f2Label: "研究问题",
      f2Hint: "一句话说清你想验证什么。",
      f2Ph: "例：自动改写工具调用流程，能否让同一个 7B 模型在 SWE 类任务上的通过率提升 5 个点以上？",
      f3Label: "基线",
      f3Hint: "从哪个公开项目、模型或结果出发。给链接和版本。",
      f3Ph: "例：https://github.com/... @ commit abc123，原论文报告的分数 41.0%",
      f4Label: "指标与防作弊",
      f4Hint: "在什么数据上、用什么指标、由哪个程序算。测试集怎么隔离，agent 有没有办法伪造分数。",
      f4Ph: "例：在 100 题留出集上算 pass@1，评分进程独立于候选代码运行；测试集在评分前对 agent 不可见。",
      f5Label: "实验设计",
      f5Hint: "agent 能改什么、什么冻结、和谁对照。试跑 3 天内跑什么；成功和失败各会看到什么。",
      f5Ph: "冻结 Qwen2.5-7B 权重，只改工具调用流程；对照为原始 harness。试跑：……成功：……失败：……",
      f6Label: "算力",
      f6Hint: "RTX 5090 卡时。试跑上限 24，完整上限 200。",
      f6Trial: "试跑（卡时）",
      f6Full: "完整（卡时）",
      f7Label: "你是谁",
      f7Hint: "GitHub 账号会自动带上。再给一个代表作，和一个我们能联系到你的方式。",
      f7Portfolio: "代表作链接（论文、仓库或比赛）",
      f7PortfolioPh: "https://...",
      f7Contact: "联系方式（只用于发容器账号，不公开）",
      f7ContactPh: "邮箱 / 微信 / 小红书号",
      applyButton: "提交申请",
      reviseButton: "提交修改",

      resultTitle: "交成果，申请完整额度",
      r1Label: "公开仓库",
      r2Label: "运行记录",
      r2Hint: "一份完整运行的日志或报告链接。",
      r3Label: "关键数字",
      r3Hint: "和基线对比的结果，写清在什么数据上、怎么算的。",
      r4Label: "补充说明（可选）",
      resultButton: "提交成果",

      statusTitle: "我的申请",
      statusLabels: {
        pending: "评审中",
        revise: "需修改",
        pass: "已通过 · 试跑",
        reject: "未通过",
        result_pending: "成果评审中",
        result_revise: "成果需修改",
        full: "已通过 · 完整额度",
        result_reject: "成果未通过",
      },
      statusNext: {
        pending: "AI 评审通常在 24 小时内完成，结果会显示在这里。",
        revise: (left) => `按下面的意见修改后重新提交，还可以改 ${left} 次。`,
        pass: "我们会按你留的联系方式发试跑用的容器账号。跑完后在下面交成果。",
        reject: "这次没有通过。7 天后可以提交新的申请。",
        result_pending: "成果评审中，结果会显示在这里。",
        result_revise: (left) => `按意见修改成果后重新提交，还可以改 ${left} 次。`,
        full: "我们会联系你发放完整额度。",
        result_reject: "这次成果没有通过。7 天后可以提交新的申请。",
      },
      verdictLabels: { pass: "通过", revise: "需修改", reject: "未通过" },
      valueLabels: { high: "高", medium: "中", low: "低" },
      reviewOf: (stage) => (stage === "result" ? "成果评审" : "申请评审"),
      gatePass: "Pass",
      gateFail: "Fail",
      rp: { summary: "提案复述", evidence: "证据核查", gates: "硬门槛", compute: "算力估算", quality: "质量评审", decision: "结论", value: "价值" },

      sending: "提交中……",
      okSent: "已提交，进入评审队列。",
      errors: {
        "github sign-in required": "请先用 GitHub 登录。",
        github_account_too_new: "GitHub 账号注册不满 30 天，暂不接收。",
        github_lookup_failed: "暂时查不到你的 GitHub 信息，请稍后再试。",
        already_in_review: "你已有一份申请在评审中。",
        submit_results_instead: "你的申请已通过，请在下方交成果。",
        too_soon: "7 天内只能提交一次新申请。",
        revision_limit_reached: "修改次数已用完。",
        daily_intake_full: "今天的申请名额满了，请明天再来。",
        no_passed_application: "需要先有一份通过的申请。",
        "rate limit exceeded": "提交太频繁，请稍后再试。",
        invalid: "有几项没填好，请检查标红的地方。",
      },
      fieldErrors: {
        direction: "请选方向", question: "研究问题 10–300 字", baseline: "基线需要带链接",
        evaluation: "评测 10–600 字", plan: "计划 20–1000 字", gpu_trial: "试跑卡时不在范围内",
        gpu_full: "完整卡时需不少于试跑、且在上限内", portfolio: "代表作需要是链接", contact: "请留联系方式",
        repo: "需要 GitHub 仓库链接", log: "运行记录需要是链接", numbers: "关键数字 10–800 字", note: "补充说明过长",
      },

      ledgerLabel: "公开账本",
      ledgerTitle: "评审记录",
      ledgerIntro: "每份申请的编号、方向和评审状态都公开记录在 GitHub 上，申请内容和个人信息不公开。",
      footLeft: "TOKEN-IGNITION // RSI 算力资助 // v4",
      footRight: "RESEARCH HOST: JOULE RESEARCH",
    },

    en: {
      brand: "TOKEN-IGNITION // RSI COMPUTE GRANTS",
      heroLead: "Compute grants for RSI research. You bring the idea and the baseline; we bring the GPUs.",
      heroDef: "RSI (recursive self-improvement): AI research agents improving AI systems themselves, from evaluation and harnesses to training and the research loop.",
      heroStats: (L, gpu) => [
        ["RTX 5090", gpu.en.replace(/^RTX 5090 /, "")],
        [`${L.trial_gpu_hours_max} GPU-h`, `trial · results in ${L.trial_days} days`],
        [`${L.full_gpu_hours_max} GPU-h`, `full · delivered in ${L.full_days / 7} weeks`],
        ["~15 min", "to apply · structured AI review"],
      ],
      heroCTA: "↓ apply for compute",
      heroCTA2: "see directions",

      dirLabel: "directions",
      dirTitle: "Five areas of RSI research",
      dirIntro: "Your baseline becomes the exam: start from a public, reproducible result and show, with a program-computed metric, that you beat it. No GPUs of your own needed.",
      pathsTitle: "Two ways in",
      paths: [
        ["A · Bring a project you helped build", "A fully open project you co-built. You know its open questions and its reward-hacking risks better than anyone."],
        ["B · Start from a well-known project", "Pick an influential open project close to your expertise and design an RSI task around one of its experiments."],
      ],

      flowLabel: "flow",
      flowTitle: "Five steps, short cycles",
      flowItems: [
        ["Apply", "Sign in with GitHub and fill 7 fields, about 15 minutes."],
        ["AI review", "Evidence check, 7 hard gates and a quality review, usually within 24 hours. Revise in place, up to 3 times."],
        ["Trial", "Pass and get an RTX 5090 container account; run the smallest experiment within 3 days."],
        ["Results", "A public repo, the record of one complete run, and numbers against the baseline."],
        ["Full quota", "Pass the results review and get compute for the full plan, delivered within 2 weeks."],
      ],
      tierKeys: ["T1 · trial", "T2 · full", "T3 · research group"],

      reviewLabel: "review",
      reviewTitle: "Structured review",
      reviewIntro: "Every application gets a review report in a fixed format, with evidence and a fix for each item, shown in your application status.",
      reportOutline: [
        ["Proposal summary", "One paragraph restating what you want to test, to confirm we read it the same way."],
        ["Evidence", "Your public work, the baseline repository and version, related work."],
        ["Hard gates", "Seven, each Pass / Fail with evidence and a fix. Any Fail means revise."],
        ["Compute note", "GPU-hours estimated from your plan; does the trial fit the quota."],
        ["Quality review", "Frontier relevance, scientific value, iteration practicality, statistical interpretation."],
        ["Decision", "Pass / Revise / Reject."],
      ],
      gatesTitle: "Seven hard gates",
      failTitle: "Common reasons for Fail",
      sampleTitle: "Sample report",
      sampleIntro: "The full report one sample application received. The application is fictional.",
      sampleSummary: "show sample report",

      applyLabel: "apply",
      applyTitle: "Apply for compute",
      applyIntro: "Sign in with GitHub first. Accounts younger than 30 days are not accepted yet.",
      authLogin: "sign in with GitHub",
      authLogout: "sign out",
      authRequired: "GitHub sign-in is required before you apply.",
      authSignedIn: (login) => `signed in as ${login}`,
      authUnavailable: "Sign-in is temporarily unavailable. Please try again later.",

      helperSummary: "Prefer not to write it yourself? Draft it with your own AI",
      helperIntro: "Paste this into ChatGPT, Claude or any assistant you use, answer its questions, then copy the result into the form.",
      helperCopy: "copy prompt",
      helperCopied: "copied",
      helperPrompt: (dirs) => `You are my RSI research application assistant. I am applying for GPUs (RTX 5090) from Token Ignition for recursive self-improvement (RSI) research.
Directions: ${dirs}.
Ask me one question at a time and turn my idea into these 7 items, then print them in order:
1. Direction: pick one from the list
2. Research question: one sentence on what I want to test
3. Baseline: public repo link + pinned commit or version + a reported number
4. Metric and integrity: which data, which metric, computed by which program; how the test set is isolated; whether the agent could forge the score
5. Experiment design: what the agent may change, what stays frozen, what it is compared against; what the 3-day trial runs; what success and failure look like
6. Compute: trial GPU-hours (max 24) and full GPU-hours (max 200)
7. Portfolio: one link to a paper, repo or competition result
The review checks: RSI scope, applicant fit, traceable baseline, question and metric, action space, evaluation integrity, compute and timeline.
If any item would fail, tell me and help me fix it.`,

      f1Label: "direction",
      f1Hint: "Pick the closest one.",
      f2Label: "research question",
      f2Hint: "One sentence on what you want to test.",
      f2Ph: "e.g. Can automatically rewriting the tool-calling flow raise a 7B model's pass rate on SWE-style tasks by 5+ points?",
      f3Label: "baseline",
      f3Hint: "Which public project, model or result you start from. Link and version.",
      f3Ph: "e.g. https://github.com/... @ commit abc123, paper reports 41.0%",
      f4Label: "metric and integrity",
      f4Hint: "Which data, which metric, computed by which program. How the test set is isolated; whether the agent could forge the score.",
      f4Ph: "e.g. pass@1 on a 100-task held-out split; the scorer runs separately from candidate code; the test set is hidden from the agent until scoring.",
      f5Label: "experiment design",
      f5Hint: "What the agent may change, what stays frozen, what it is compared against. What the 3-day trial runs; what success and failure look like.",
      f5Ph: "Frozen Qwen2.5-7B weights; only the tool-calling flow changes; control is the original harness. Trial: ... Success: ... Failure: ...",
      f6Label: "compute",
      f6Hint: "RTX 5090 GPU-hours. Trial max 24, full max 200.",
      f6Trial: "trial (GPU hours)",
      f6Full: "full (GPU hours)",
      f7Label: "about you",
      f7Hint: "Your GitHub account is attached automatically. Add one piece of work and a way to reach you.",
      f7Portfolio: "portfolio link (paper, repo or competition)",
      f7PortfolioPh: "https://...",
      f7Contact: "contact (only used to send your container account, never published)",
      f7ContactPh: "email / WeChat / X",
      applyButton: "submit application",
      reviseButton: "submit revision",

      resultTitle: "Submit results for full quota",
      r1Label: "public repository",
      r2Label: "run log",
      r2Hint: "A link to the log or report of one complete run.",
      r3Label: "key numbers",
      r3Hint: "Results against the baseline, with the data and how they were computed.",
      r4Label: "notes (optional)",
      resultButton: "submit results",

      statusTitle: "my application",
      statusLabels: {
        pending: "in review",
        revise: "needs changes",
        pass: "passed · trial",
        reject: "not passed",
        result_pending: "results in review",
        result_revise: "results need changes",
        full: "passed · full quota",
        result_reject: "results not passed",
      },
      statusNext: {
        pending: "AI review usually finishes within 24 hours. The result will show up here.",
        revise: (left) => `Revise using the notes below and resubmit. ${left} revision(s) left.`,
        pass: "We will send a trial container account to your contact. When done, submit results below.",
        reject: "Not passed this time. You can submit a new application after 7 days.",
        result_pending: "Results in review. The outcome will show up here.",
        result_revise: (left) => `Revise your results and resubmit. ${left} revision(s) left.`,
        full: "We will contact you about the full quota.",
        result_reject: "Results not passed this time. You can submit a new application after 7 days.",
      },
      verdictLabels: { pass: "pass", revise: "needs changes", reject: "not passed" },
      valueLabels: { high: "high", medium: "medium", low: "low" },
      reviewOf: (stage) => (stage === "result" ? "results review" : "application review"),
      gatePass: "Pass",
      gateFail: "Fail",
      rp: { summary: "Proposal summary", evidence: "Evidence reviewed", gates: "Hard gates", compute: "Compute note", quality: "Quality review", decision: "Decision", value: "value" },

      sending: "submitting...",
      okSent: "Submitted. You are in the review queue.",
      errors: {
        "github sign-in required": "Please sign in with GitHub first.",
        github_account_too_new: "GitHub accounts younger than 30 days are not accepted yet.",
        github_lookup_failed: "Could not look up your GitHub account. Please try again later.",
        already_in_review: "You already have an application in review.",
        submit_results_instead: "Your application passed. Submit results below.",
        too_soon: "One new application per 7 days.",
        revision_limit_reached: "No revisions left.",
        daily_intake_full: "Today's intake is full. Please come back tomorrow.",
        no_passed_application: "You need a passed application first.",
        "rate limit exceeded": "Too many attempts. Please try again later.",
        invalid: "Some fields need attention. Check the highlighted ones.",
      },
      fieldErrors: {
        direction: "pick a direction", question: "10–300 characters", baseline: "include a link",
        evaluation: "10–600 characters", plan: "20–1000 characters", gpu_trial: "trial hours out of range",
        gpu_full: "full hours must be ≥ trial and within the cap", portfolio: "must be a link", contact: "leave a contact",
        repo: "must be a GitHub repo link", log: "must be a link", numbers: "10–800 characters", note: "too long",
      },

      ledgerLabel: "public ledger",
      ledgerTitle: "Review record",
      ledgerIntro: "The id, direction and review status of every application are recorded publicly on GitHub. Application text and personal data are never published.",
      footLeft: "TOKEN-IGNITION // RSI COMPUTE GRANTS // v4",
      footRight: "RESEARCH HOST: JOULE RESEARCH",
    },
  };

  /* --------------------------------------------------------------
     state
     -------------------------------------------------------------- */

  const languageEntry = new URL(location.href);
  const requestedLanguage = languageEntry.searchParams.get("lang");
  let savedLanguage;
  try { savedLanguage = localStorage.getItem("ti.lang"); } catch (_) {}
  const incomingLanguage = requestedLanguage === "en" ? "en" :
    (requestedLanguage === "zh" || requestedLanguage === "zh-CN" ? "zh" : null);
  let LANG = incomingLanguage || (savedLanguage === "en" ? "en" : "zh");
  if (incomingLanguage) {
    try { localStorage.setItem("ti.lang", LANG); } catch (_) {}
    languageEntry.searchParams.delete("lang");
    try { history.replaceState(null, "", languageEntry.pathname + languageEntry.search + languageEntry.hash); } catch (_) {}
  }

  let PROGRAM = null;
  let SAMPLE = null; // sample review report shown in the review section
  let AUTH = { loaded: false, configured: false, user: null };
  let APP = null; // current user's application record

  const $ = (id) => document.getElementById(id);

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function activeDirections() {
    return PROGRAM ? PROGRAM.directions.filter((d) => d.active) : [];
  }

  /* --------------------------------------------------------------
     render
     -------------------------------------------------------------- */

  function render() {
    const t = I18N[LANG];
    document.documentElement.lang = LANG === "zh" ? "zh-CN" : "en";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const val = t[el.getAttribute("data-i18n")];
      if (typeof val === "string") el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      const val = t[el.getAttribute("data-i18n-ph")];
      if (typeof val === "string") el.setAttribute("placeholder", val);
    });
    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.setAttribute("aria-current", b.getAttribute("data-lang") === LANG ? "true" : "false");
    });

    $("paths").innerHTML = t.paths
      .map(([k, v]) => `<div class="path"><div class="path-k">${escapeHtml(k)}</div><p>${escapeHtml(v)}</p></div>`).join("");
    $("report-outline").innerHTML = t.reportOutline
      .map(([k, v], i) => `<li><span class="flow-step">${String(i + 1).padStart(2, "0")}</span><span class="flow-k">${escapeHtml(k)}</span><span class="flow-v">${escapeHtml(v)}</span></li>`).join("");
    $("flow-list").innerHTML = t.flowItems
      .map(([k, v], i) => `<li><span class="flow-step">${String(i + 1).padStart(2, "0")}</span><span class="flow-k">${escapeHtml(k)}</span><span class="flow-v">${escapeHtml(v)}</span></li>`)
      .join("");

    if (PROGRAM) {
      $("hero-stats").innerHTML = t.heroStats(PROGRAM.limits, PROGRAM.gpu)
        .map(([k, v]) => `<div class="stat"><div class="stat-k">${escapeHtml(k)}</div><div class="stat-v">${escapeHtml(v)}</div></div>`).join("");
      $("fail-list").innerHTML = PROGRAM.review.common_failures[LANG].map((x) => `<li>${escapeHtml(x)}</li>`).join("");
      $("dir-grid").innerHTML = activeDirections().map((d) => {
        const c = d[LANG];
        const ex = (c.examples || []).map((e) => `<li>${escapeHtml(e)}</li>`).join("");
        return `<article class="dir-card"><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.desc)}</p>${ex ? `<ul>${ex}</ul>` : ""}</article>`;
      }).join("");

      const q = PROGRAM.quota;
      $("tier-grid").innerHTML = [q.trial, q.full, q.research].map((x, i) => `
        <div class="allocation-cell">
          <div class="allocation-key">${escapeHtml(t.tierKeys[i])}</div>
          <div class="allocation-note">${escapeHtml(x[LANG])}</div>
        </div>`).join("");

      $("gate-list").innerHTML = PROGRAM.review_gates
        .map((g, i) => `<li><span class="flow-step">${String(i + 1).padStart(2, "0")}</span><span class="flow-k">${escapeHtml(g[LANG])}</span><span class="flow-v">${escapeHtml(g["desc_" + LANG])}</span></li>`)
        .join("");
      if (SAMPLE) $("sample-report").innerHTML = reportHtml(SAMPLE[LANG]);

      const sel = $("f-direction");
      const current = sel.value;
      sel.innerHTML = activeDirections().map((d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d[LANG].title)}</option>`).join("");
      if (current) sel.value = current;

      const L = PROGRAM.limits;
      $("f-gpu-trial").max = L.trial_gpu_hours_max;
      $("f-gpu-full").max = L.full_gpu_hours_max;

      $("helper-prompt").textContent = t.helperPrompt(activeDirections().map((d) => d[LANG].title).join(LANG === "zh" ? "、" : ", "));
    }

    renderAuth();
    renderStatus();
  }

  function renderAuth() {
    const t = I18N[LANG];
    const gate = $("auth-gate");
    const copy = $("auth-gate-copy");
    $("github-login").hidden = true;
    $("github-logout").hidden = true;
    if (!AUTH.loaded) {
      gate.dataset.state = "loading";
      copy.textContent = "...";
      return;
    }
    if (!AUTH.configured) {
      gate.dataset.state = "required";
      copy.textContent = t.authUnavailable;
      return;
    }
    if (AUTH.user) {
      gate.dataset.state = "signed-in";
      copy.textContent = t.authSignedIn(AUTH.user.login);
      $("github-logout").hidden = false;
      return;
    }
    gate.dataset.state = "required";
    copy.textContent = t.authRequired;
    $("github-login").hidden = false;
  }

  function leftRevisions(used) {
    return PROGRAM ? Math.max(0, PROGRAM.limits.max_revisions - used) : 0;
  }

  function renderStatus() {
    const t = I18N[LANG];
    const panel = $("status-panel");
    const applyForm = $("apply-form");
    const resultForm = $("result-form");
    const signedIn = Boolean(AUTH.user);

    applyForm.hidden = !signedIn;
    resultForm.hidden = true;
    panel.hidden = true;
    if (!signedIn || !APP) {
      $("apply-button-label").textContent = t.applyButton;
      return;
    }

    const s = APP.status;
    const next = t.statusNext[s];
    const nextText = typeof next === "function"
      ? next(leftRevisions(s === "result_revise" ? APP.result_revisions : APP.revisions))
      : next;
    const reviews = (APP.reviews || []).slice().reverse();
    const reviewHtml = reviews.map(reportHtml).join("");

    panel.hidden = false;
    panel.innerHTML = `
      <div class="status-head">
        <span class="status-title">${escapeHtml(t.statusTitle)} · 0x${escapeHtml(APP.id)}</span>
        <span class="status-badge ${escapeHtml(s)}">${escapeHtml(t.statusLabels[s] || s)}</span>
      </div>
      <p class="status-next">${escapeHtml(nextText || "")}</p>
      ${reviewHtml}`;

    const canRevise = s === "revise" && leftRevisions(APP.revisions) > 0;
    const canNew = ["reject", "result_reject", "full"].includes(s);
    applyForm.hidden = !(canRevise || canNew);
    $("apply-button-label").textContent = canRevise ? t.reviseButton : t.applyButton;
    if (canRevise) fillProposal(APP.proposal);

    const canResult = s === "pass" || (s === "result_revise" && leftRevisions(APP.result_revisions) > 0);
    resultForm.hidden = !canResult;
    if (canResult && APP.result) fillResult(APP.result);
  }

  function labelOf(list, id) {
    const x = PROGRAM && (list || []).find((g) => g.id === id);
    return x ? x[LANG] : id;
  }

  // One review report: summary, evidence, hard gates, compute, quality, decision.
  // Reviews written before v4 only have summary + gates and render the same way.
  function reportHtml(r) {
    const t = I18N[LANG];
    const R = (PROGRAM && PROGRAM.review) || {};
    const row = (name, body) => `<tr><td class="g-name">${escapeHtml(name)}</td><td class="g-text" colspan="2">${escapeHtml(body)}</td></tr>`;
    const block = (title, inner) => `<div class="rp-block"><div class="rp-title">${escapeHtml(title)}</div>${inner}</div>`;
    const gates = (r.gates || []).map((g) => `
      <tr class="${g.status === "pass" ? "ok" : "bad"}">
        <td class="g-name">${escapeHtml(labelOf(PROGRAM && PROGRAM.review_gates, g.id))}</td>
        <td class="g-status">${g.status === "pass" ? t.gatePass : t.gateFail}</td>
        <td class="g-text">${escapeHtml(g.evidence)}${g.status !== "pass" && g.fix ? `<div class="g-fix">→ ${escapeHtml(g.fix)}</div>` : ""}</td>
      </tr>`).join("");
    const verdict = `<span class="verdict ${escapeHtml(r.verdict)}">${escapeHtml(t.verdictLabels[r.verdict] || r.verdict)}</span>`;
    return `
      <div class="review-block">
        <div class="review-head">
          <span>${escapeHtml(t.reviewOf(r.stage))}${r.at ? " · " + new Date(r.at * 1000).toISOString().slice(0, 10) : ""}</span>
          ${verdict}
        </div>
        ${r.summary ? block(t.rp.summary, `<p class="review-summary">${escapeHtml(r.summary)}</p>`) : ""}
        ${(r.evidence || []).length ? block(t.rp.evidence, `<table class="gate-table"><tbody>${r.evidence.map((e) => row(labelOf(R.evidence, e.id), e.finding)).join("")}</tbody></table>`) : ""}
        ${block(t.rp.gates, `<table class="gate-table"><tbody>${gates}</tbody></table>`)}
        ${r.compute_note ? block(t.rp.compute, `<p class="review-summary">${escapeHtml(r.compute_note)}</p>`) : ""}
        ${(r.quality || []).length ? block(t.rp.quality, `<table class="gate-table"><tbody>${r.quality.map((q) => row(labelOf(R.quality, q.id), q.note)).join("")}</tbody></table>`) : ""}
        ${block(t.rp.decision, `<p class="review-summary">${verdict}${r.value ? ` · ${escapeHtml(t.rp.value)} ${escapeHtml(t.valueLabels[r.value] || r.value)}` : ""}</p>`)}
      </div>`;
  }

  function fillProposal(p) {
    if (!p || $("f-question").dataset.filled === APP.id) return;
    $("f-direction").value = p.direction;
    $("f-question").value = p.question;
    $("f-baseline").value = p.baseline;
    $("f-evaluation").value = p.evaluation;
    $("f-plan").value = p.plan;
    $("f-gpu-trial").value = p.gpu_trial;
    $("f-gpu-full").value = p.gpu_full;
    $("f-portfolio").value = p.portfolio;
    $("f-contact").value = p.contact;
    $("f-question").dataset.filled = APP.id;
  }

  function fillResult(r) {
    if ($("r-repo").dataset.filled === APP.id) return;
    $("r-repo").value = r.repo;
    $("r-log").value = r.log;
    $("r-numbers").value = r.numbers;
    $("r-note").value = r.note || "";
    $("r-repo").dataset.filled = APP.id;
  }

  /* --------------------------------------------------------------
     data
     -------------------------------------------------------------- */

  async function loadProgram() {
    try {
      const resp = await fetch("/config/program.json", { cache: "no-store" });
      PROGRAM = await resp.json();
      SAMPLE = await fetch("/config/sample-review.json", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    } catch (err) {
      console.error("[program]", err);
    }
  }

  async function loadAuth() {
    try {
      const resp = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await resp.json();
      AUTH = { loaded: true, configured: Boolean(data.configured), user: data.user || null };
    } catch {
      AUTH = { loaded: true, configured: false, user: null };
    }
  }

  async function loadMine() {
    APP = null;
    if (!AUTH.user) return;
    try {
      const resp = await fetch("/api/my", { cache: "no-store" });
      const data = await resp.json();
      APP = data.application || null;
    } catch (err) {
      console.error("[my]", err);
    }
  }

  /* --------------------------------------------------------------
     forms
     -------------------------------------------------------------- */

  const FIELD_IDS = {
    direction: "f-direction", question: "f-question", baseline: "f-baseline", evaluation: "f-evaluation",
    plan: "f-plan", gpu_trial: "f-gpu-trial", gpu_full: "f-gpu-full", portfolio: "f-portfolio", contact: "f-contact",
    repo: "r-repo", log: "r-log", numbers: "r-numbers", note: "r-note",
  };

  function clearFieldErrors(form) {
    form.querySelectorAll(".field-error").forEach((el) => el.remove());
    form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  }

  function showFieldErrors(details) {
    const t = I18N[LANG];
    (details || []).forEach((k) => {
      const el = $(FIELD_IDS[k]);
      if (!el) return;
      el.classList.add("invalid");
      const msg = document.createElement("div");
      msg.className = "field-error";
      msg.textContent = t.fieldErrors[k] || k;
      el.insertAdjacentElement("afterend", msg);
    });
  }

  async function post(form, feedbackId, payload) {
    const t = I18N[LANG];
    const fb = $(feedbackId);
    const btn = form.querySelector("button[type=submit]");
    clearFieldErrors(form);
    fb.className = "submit-feedback visible";
    fb.textContent = t.sending;
    btn.disabled = true;
    try {
      const resp = await fetch("/api/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) {
        fb.className = "submit-feedback visible error";
        fb.textContent = t.errors[data.error] || `[${resp.status}] ${data.error || "error"}`;
        showFieldErrors(data.details);
        return;
      }
      fb.textContent = t.okSent;
      await loadMine();
      renderStatus();
      $("status-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      fb.className = "submit-feedback visible error";
      fb.textContent = "[network] " + (err && err.message ? err.message : "unreachable");
    } finally {
      btn.disabled = false;
    }
  }

  function wireForms() {
    const val = (id) => $(id).value.trim();
    $("apply-form").addEventListener("submit", (e) => {
      e.preventDefault();
      post($("apply-form"), "apply-feedback", {
        kind: "proposal",
        direction: val("f-direction"),
        question: val("f-question"),
        baseline: val("f-baseline"),
        evaluation: val("f-evaluation"),
        plan: val("f-plan"),
        gpu_trial: Number(val("f-gpu-trial")),
        gpu_full: Number(val("f-gpu-full")),
        portfolio: val("f-portfolio"),
        contact: val("f-contact"),
      });
    });
    $("result-form").addEventListener("submit", (e) => {
      e.preventDefault();
      post($("result-form"), "result-feedback", {
        kind: "result",
        repo: val("r-repo"),
        log: val("r-log"),
        numbers: val("r-numbers"),
        note: val("r-note"),
      });
    });
    $("github-logout").addEventListener("click", async () => {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      AUTH.user = null;
      APP = null;
      render();
    });
    $("helper-copy").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText($("helper-prompt").textContent);
        $("helper-copy").textContent = I18N[LANG].helperCopied;
        setTimeout(() => ($("helper-copy").textContent = I18N[LANG].helperCopy), 1500);
      } catch (_) {}
    });
    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.addEventListener("click", () => {
        LANG = b.getAttribute("data-lang");
        try { localStorage.setItem("ti.lang", LANG); } catch (_) {}
        render();
      });
    });
  }

  /* --------------------------------------------------------------
     visuals
     -------------------------------------------------------------- */

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
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
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
     boot
     -------------------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", async () => {
    const boot = (name, fn) => {
      try { fn(); } catch (err) { console.error(`[boot:${name}]`, err); }
    };
    boot("ascii", renderAsciiArt);
    boot("topology", startTopology);
    boot("forms", wireForms);
    boot("render", render);
    await Promise.all([loadProgram(), loadAuth()]);
    await loadMine();
    boot("render", render);
  });
})();
