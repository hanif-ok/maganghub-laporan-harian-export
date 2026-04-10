// ==UserScript==
// @name         MagangHub Daily Log Exporter
// @namespace    https://github.com/your-username/maganghub-daily-export
// @version      1.2.0
// @description  Export daily report MagangHub — bypass CORS via GM_xmlhttpRequest
// @author       You
// @match        https://monev.maganghub.kemnaker.go.id/*
// @grant        GM_xmlhttpRequest
// @grant        GM_cookie
// @connect      monev-api.maganghub.kemnaker.go.id
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  const API_BASE    = "https://monev-api.maganghub.kemnaker.go.id/api/v1";
  const MAGANG_START = "2025-10-01";
  const MAGANG_END   = "2026-04-01";
  const DELAY_MS     = 800;

  // ── Ambil token dari cookie / Nuxt state ────────────────────────────────
  function getAuthToken() {
    // Coba dari cookie dulu (common pattern: token=..., access_token=...)
    const cookieMatch = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
    if (cookieMatch) return decodeURIComponent(cookieMatch[1]);

    // Coba dari localStorage
    const keys = ["token", "access_token", "auth_token", "_token"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }

    // Coba dari Nuxt payload / pinia state yang ada di window
    try {
      const nuxtData = window.__NUXT__;
      if (nuxtData?.state?.token) return nuxtData.state.token;
      if (nuxtData?.pinia) {
        const pinia = JSON.parse(JSON.stringify(nuxtData.pinia));
        const found = JSON.stringify(pinia).match(/"(?:token|access_token)":"([^"]+)"/);
        if (found) return found[1];
      }
    } catch (_) {}

    return null;
  }

  // ── GM_xmlhttpRequest wrapper (bypass CORS) ─────────────────────────────
  function gmFetch(url, headers = {}) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        headers: {
          "Accept": "application/json",
          ...headers,
        },
        withCredentials: true,   // kirim cookie sesi
        onload(res) {
          if (res.status >= 200 && res.status < 300) {
            try { resolve(JSON.parse(res.responseText)); }
            catch (e) { reject(new Error("Bukan JSON: " + res.responseText.slice(0, 100))); }
          } else {
            reject(new Error(`HTTP ${res.status} — ${res.responseText.slice(0, 200)}`));
          }
        },
        onerror(e) { reject(new Error("Network error: " + JSON.stringify(e))); },
        ontimeout()  { reject(new Error("Timeout")); },
      });
    });
  }

  async function fetchMonth(dateStr) {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const url = `${API_BASE}/daily-logs?date=${dateStr}`;
    const json = await gmFetch(url, headers);
    return json.data ?? json.items ?? json.logs ?? (Array.isArray(json) ? json : []);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function getMonths(start, end) {
    const months = [];
    const d = new Date(start + "T00:00:00");
    const e = new Date(end   + "T00:00:00");
    while (d <= e) {
      months.push(d.toISOString().slice(0, 10));
      d.setMonth(d.getMonth() + 1);
    }
    return months;
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ── Export Formats ───────────────────────────────────────────────────────
  function toJSON(logs) {
    return JSON.stringify({ total: logs.length, exported_at: new Date().toISOString(), logs }, null, 2);
  }

  function toCSV(logs) {
    const esc = s => `"${String(s ?? "").replace(/"/g, '""').replace(/\n/g, "\\n")}"`;
    const rows = logs.map(l =>
      [l.date, esc(l.activity_log), esc(l.lesson_learned), esc(l.obstacles), l.state].join(",")
    );
    return "date,activity_log,lesson_learned,obstacles,state\n" + rows.join("\n");
  }

  function toMarkdown(logs) {
    let md = `# Daily Report Magang\n\nTotal: ${logs.length} hari | Exported: ${new Date().toLocaleDateString("id-ID")}\n\n---\n\n`;
    for (const l of logs) {
      md += `## ${l.date}\n\n### Aktivitas\n${l.activity_log || "-"}\n\n### Pelajaran\n${l.lesson_learned || "-"}\n\n### Kendala\n${l.obstacles || "-"}\n\n---\n\n`;
    }
    return md;
  }

  function toAIPrompt(logs) {
    let text = `Berikut adalah ${logs.length} daily report selama program magang saya.\nPeriode: ${logs[0]?.date ?? "?"} s/d ${logs[logs.length - 1]?.date ?? "?"}\n\n`;
    for (const l of logs) {
      text += `[${l.date}]\nAktivitas: ${(l.activity_log || "-").replace(/\n/g, "; ")}\nPelajaran: ${(l.lesson_learned || "-").replace(/\n/g, "; ")}\nKendala: ${(l.obstacles || "-").replace(/\n/g, "; ")}\n\n`;
    }
    text += `---\nBerdasarkan daily report di atas, buatkan ringkasan portfolio magang yang mencakup pencapaian utama, skill yang berkembang, kontribusi ke perusahaan, dan timeline perkembangan.`;
    return text;
  }

  function download(content, filename, type) {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  function createUI() {
    if (document.getElementById("mh-exporter")) return;

    const container = document.createElement("div");
    container.id = "mh-exporter";
    container.innerHTML = `
      <style>
        #mh-exporter { position:fixed;bottom:20px;right:20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px; }
        #mh-panel { background:#fff;border:1px solid #d1d5db;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.12);padding:16px;width:288px;display:none;margin-bottom:10px; }
        #mh-panel.open { display:block; }
        .mh-title { font-weight:600;font-size:15px;margin-bottom:12px; }
        .mh-row { margin-bottom:8px; }
        .mh-row label { font-size:12px;color:#6b7280;display:block;margin-bottom:2px; }
        .mh-row input { width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box; }
        .mh-token-row { margin-bottom:8px;font-size:12px; }
        .mh-token-row label { color:#6b7280;display:block;margin-bottom:2px; }
        .mh-token-row input { width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:11px;box-sizing:border-box;font-family:monospace; }
        .mh-btns { display:flex;flex-wrap:wrap;gap:6px;margin-top:12px; }
        .mh-btn { padding:7px 12px;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;color:#fff;flex:1;min-width:70px;text-align:center; }
        .mh-btn.json { background:#2563eb; } .mh-btn.csv { background:#059669; }
        .mh-btn.md { background:#7c3aed; }   .mh-btn.ai { background:#ea580c; }
        .mh-btn:disabled { opacity:.5;cursor:wait; }
        .mh-status { font-size:12px;color:#6b7280;margin-top:8px;min-height:18px;word-break:break-all; }
        .mh-toggle { width:50px;height:50px;border-radius:50%;border:none;background:#2563eb;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 2px 12px rgba(37,99,235,.45);display:flex;align-items:center;justify-content:center; }
      </style>
      <div id="mh-panel">
        <div class="mh-title">📋 Daily Log Exporter</div>
        <div class="mh-row"><label>Mulai</label><input type="text" id="mh-start" value="${MAGANG_START}"></div>
        <div class="mh-row"><label>Akhir</label><input type="text" id="mh-end" value="${MAGANG_END}"></div>
        <div class="mh-token-row">
          <label>Bearer Token (kosongkan = pakai cookie)</label>
          <input type="text" id="mh-token" placeholder="Paste token dari DevTools jika perlu">
        </div>
        <div class="mh-btns">
          <button class="mh-btn json" data-fmt="json">JSON</button>
          <button class="mh-btn csv"  data-fmt="csv">CSV</button>
          <button class="mh-btn md"   data-fmt="md">Markdown</button>
          <button class="mh-btn ai"   data-fmt="ai">AI Prompt</button>
        </div>
        <div class="mh-status" id="mh-status"></div>
      </div>
      <button class="mh-toggle" id="mh-toggle" title="Daily Log Exporter">📋</button>
    `;
    document.body.appendChild(container);

    // Auto-isi token jika ketemu
    const autoToken = getAuthToken();
    if (autoToken) {
      document.getElementById("mh-token").value = autoToken;
      console.log("[MH Exporter] Token ditemukan otomatis");
    } else {
      console.log("[MH Exporter] Token tidak ditemukan, coba paste manual");
    }

    document.getElementById("mh-toggle").addEventListener("click", () => {
      document.getElementById("mh-panel").classList.toggle("open");
    });

    container.querySelectorAll(".mh-btn").forEach(btn => {
      btn.addEventListener("click", () => runExport(btn.dataset.fmt));
    });
  }

  async function runExport(fmt) {
    const status = document.getElementById("mh-status");
    const btns   = document.querySelectorAll("#mh-exporter .mh-btn");
    btns.forEach(b => b.disabled = true);

    try {
      const months = getMonths(
        document.getElementById("mh-start").value.trim(),
        document.getElementById("mh-end").value.trim()
      );
      status.textContent = `Fetching ${months.length} bulan via GM_xmlhttpRequest…`;

      let allLogs = [];
      for (let i = 0; i < months.length; i++) {
        status.textContent = `Bulan ${i+1}/${months.length}: ${months[i]}…`;
        try {
          const logs = await fetchMonthWithToken(months[i]);
          allLogs = allLogs.concat(logs);
        } catch (e) {
          console.warn("[MH Exporter] skip", months[i], e.message);
          status.textContent = `⚠️ ${months[i]} gagal: ${e.message}`;
        }
        if (i < months.length - 1) await sleep(DELAY_MS);
      }

      allLogs.sort((a, b) => String(a.date).localeCompare(String(b.date)));
      const seen = new Set();
      allLogs = allLogs.filter(l => { const k = l.id ?? l.date; return seen.has(k) ? false : seen.add(k); });

      status.textContent = `${allLogs.length} entri. Membuat ${fmt.toUpperCase()}…`;
      const ts = new Date().toISOString().slice(0, 10);
      switch (fmt) {
        case "json": download(toJSON(allLogs),     `daily-logs-${ts}.json`,    "application/json"); break;
        case "csv":  download(toCSV(allLogs),      `daily-logs-${ts}.csv`,     "text/csv");         break;
        case "md":   download(toMarkdown(allLogs), `daily-logs-${ts}.md`,      "text/markdown");    break;
        case "ai":   download(toAIPrompt(allLogs), `daily-logs-ai-${ts}.txt`,  "text/plain");       break;
      }
      status.textContent = `✅ ${allLogs.length} entri berhasil diekspor!`;
    } catch (err) {
      status.textContent = `❌ ${err.message}`;
    } finally {
      btns.forEach(b => b.disabled = false);
    }
  }

  // pakai token dari input field saat export
  async function fetchMonthWithToken(dateStr) {
    const manualToken = document.getElementById("mh-token")?.value?.trim();
    const token = manualToken || getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const url = `${API_BASE}/daily-logs?date=${dateStr}`;
    const json = await gmFetch(url, headers);
    return json.data ?? json.items ?? json.logs ?? (Array.isArray(json) ? json : []);
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createUI);
  } else {
    createUI();
  }
})();