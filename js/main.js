/* ===================================================
   Crypto Nova LP — Bright & Rich
   =================================================== */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 画像プレースホルダ ----------
     images/ に data-src と同名のファイルを置くと自動で表示される。
     無い間は「ファイル名＋サイズ」のプレースホルダが表示される。 */
  document.querySelectorAll(".ph").forEach((ph) => {
    const name = ph.dataset.src;
    if (!name) return;
    const img = new Image();
    img.alt = ph.dataset.alt || "";
    img.onload = () => {
      ph.classList.add("loaded");
      ph.prepend(img);
    };
    img.onerror = () => { /* 画像未設置：プレースホルダ表示のまま */ };
    img.src = "images/" + name;
  });

  /* ---------- ナビの背景切替 ---------- */
  const nav = document.querySelector(".topnav");
  const onScrollNav = () => nav.classList.toggle("scrolled", window.scrollY > 60);
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- 進捗バー ---------- */
  const progress = document.querySelector(".progress-bar i");
  const onScrollProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${(window.scrollY / max) * 100}%`;
  };
  window.addEventListener("scroll", onScrollProgress, { passive: true });
  onScrollProgress();

  /* ---------- スクロール出現 ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- 疑似乱数（シード付き・見た目再現用） ---------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* 成長曲線っぽい点列を作る（装飾用） */
  function growthCurve(seed, n, lift) {
    const rnd = mulberry32(seed);
    const pts = [];
    let v = 0.15 + rnd() * 0.1;
    for (let i = 0; i < n; i++) {
      const p = i / (n - 1);
      v += (rnd() - 0.42) * 0.06 + p * p * lift;
      v = Math.max(0.05, Math.min(0.98, v));
      pts.push(v);
    }
    return pts;
  }

  function pathFrom(pts, w, h, pad = 2) {
    return pts.map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = pad + (1 - v) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }

  /* ---------- コインチップのスパークライン ---------- */
  document.querySelectorAll(".coin-chips .spark").forEach((svg) => {
    const seed = Number(svg.dataset.seed || 1);
    const pts = growthCurve(seed * 97 + 11, 26, 0.05);
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", pathFrom(pts, 64, 24));
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#1B6FD0");
    p.setAttribute("stroke-width", "1.4");
    svg.appendChild(p);
  });

  /* ---------- ヒーロー：アプリデモ（曲線ロックオン＋結果） ---------- */
  const heroChart = document.getElementById("hero-chart");
  if (heroChart) {
    const ctx = heroChart.getContext("2d");
    const simEl = document.getElementById("hero-sim");
    let w = 0, h = 0;
    const base = growthCurve(42, 60, 0.05);
    const match = base.map((v, i) => {
      const r = mulberry32(i * 13 + 5)();
      return Math.max(0.05, Math.min(0.98, v + (r - 0.5) * 0.06));
    });

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = heroChart.clientWidth; h = heroChart.clientHeight;
      heroChart.width = w * dpr; heroChart.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const CYCLE = 5200;
    const stroke = (pts, prog, color, width, glow, fill) => {
      const n = Math.max(2, Math.floor(pts.length * prog));
      if (fill) {
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const x = (i / (pts.length - 1)) * w;
          const y = 16 + (1 - pts[i]) * (h - 32);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const xEnd = ((n - 1) / (pts.length - 1)) * w;
        ctx.lineTo(xEnd, h); ctx.lineTo(0, h); ctx.closePath();
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, fill); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.fill();
      }
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = (i / (pts.length - 1)) * w;
        const y = 16 + (1 - pts[i]) * (h - 32);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.shadowColor = glow || "transparent"; ctx.shadowBlur = glow ? 10 : 0;
      ctx.stroke(); ctx.shadowBlur = 0;
    };

    const frame = (t) => {
      const p = (t % CYCLE) / CYCLE;
      ctx.clearRect(0, 0, w, h);
      stroke(base, Math.min(1, p / 0.4), "rgba(200,154,43,.9)", 2, "rgba(200,154,43,.35)", "rgba(229,185,78,.16)");
      if (p > 0.45) {
        const mp = Math.min(1, (p - 0.45) / 0.35);
        stroke(match, mp, "rgba(23,168,123,.95)", 2, "rgba(23,168,123,.4)");
        const idx = Math.max(1, Math.floor(match.length * mp) - 1);
        const x = (idx / (match.length - 1)) * w;
        const y = 16 + (1 - match[idx]) * (h - 32);
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = "#17A87B"; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.strokeStyle = "rgba(23,168,123,.5)"; ctx.lineWidth = 1.5; ctx.stroke();
        if (simEl) simEl.textContent = (mp * 97.4).toFixed(1);
      } else if (simEl) { simEl.textContent = "0.0"; }
      requestAnimationFrame(frame);
    };

    if (reduceMotion) {
      stroke(base, 1, "rgba(200,154,43,.9)", 2, null, "rgba(229,185,78,.16)");
      stroke(match, 1, "rgba(23,168,123,.95)", 2, null);
      if (simEl) simEl.textContent = "97.4";
    } else {
      requestAnimationFrame(frame);
    }

    // 類似率順の結果リスト（イメージ）
    const resWrap = document.getElementById("hero-results");
    if (resWrap) {
      const rows = [
        { rank: "No.01", sim: "96.4", warn: false, seed: 3 },
        { rank: "No.02", sim: "94.1", warn: false, seed: 9 },
        { rank: "No.03", sim: "91.7", warn: true, seed: 15 },
        { rank: "No.04", sim: "89.2", warn: false, seed: 21 },
      ];
      rows.forEach((r, i) => {
        const pts = growthCurve(r.seed * 31 + 7, 20, 0.045);
        const li = document.createElement("li");
        if (r.warn) li.classList.add("warn");
        li.innerHTML =
          `<span class="r-rank">${r.rank}</span>` +
          `<svg class="r-spark" viewBox="0 0 80 16"><path d="${pathFrom(pts, 80, 16)}" fill="none" stroke="${r.warn ? "#E8833A" : "#4FA3E8"}" stroke-width="1.4"/></svg>` +
          `<span class="r-sim">${r.warn ? "⚠ " : ""}類似 ${r.sim}%</span>`;
        resWrap.appendChild(li);
        setTimeout(() => li.classList.add("show"), reduceMotion ? 0 : 600 + i * 180);
      });
    }
  }

  /* ---------- S3：30銘柄の結果パネル（イメージ表示） ---------- */
  const top3Wrap = document.getElementById("result-top3");
  const grid = document.getElementById("result-grid");
  if (top3Wrap && grid) {
    const rnd = mulberry32(20260709);
    const warnedIdx = [2, 9, 17, 25]; // 警告マークのサンプル位置（No.03含む）
    const items = [];
    let sim = 97.8;
    for (let i = 0; i < 30; i++) {
      sim -= rnd() * 1.6 + 0.15;
      items.push({ sim: sim.toFixed(1), warn: warnedIdx.includes(i) });
    }

    const cells = [];

    // 上位3銘柄：大きなカード（類似率バー付き）
    items.slice(0, 3).forEach((it, i) => {
      const pts = growthCurve(i * 31 + 7, 26, 0.05);
      const el = document.createElement("div");
      el.className = `t3-card${it.warn ? " warned" : ""}`;
      el.innerHTML =
        `<div class="t3-head"><span class="t3-rank">No.0${i + 1}</span>` +
        (it.warn ? `<span class="t3-warn">⚠<em> 注意</em></span>` : "") +
        `</div>` +
        `<svg viewBox="0 0 120 34"><path d="${pathFrom(pts, 120, 34)}" fill="none" stroke="${it.warn ? "#F0A05C" : "#6FB9F0"}" stroke-width="1.6" stroke-linecap="round"/></svg>` +
        `<div class="t3-sim"><span>類似率</span><b>${it.sim}%</b></div>` +
        `<div class="t3-bar"><i style="--w:${it.sim}%"></i></div>`;
      top3Wrap.appendChild(el);
      cells.push(el);
    });

    // No.04〜30：コンパクトセル
    items.slice(3).forEach((it, idx) => {
      const i = idx + 3;
      const pts = growthCurve(i * 31 + 7, 22, 0.045);
      const el = document.createElement("div");
      el.className = `result-cell${it.warn ? " warned" : ""}`;
      el.innerHTML =
        `<div class="cell-rank"><span>No.${String(i + 1).padStart(2, "0")}</span>` +
        (it.warn ? `<span class="cell-warn">⚠</span>` : "") +
        `</div>` +
        `<svg viewBox="0 0 64 20"><path d="${pathFrom(pts, 64, 20)}" fill="none" stroke="${it.warn ? "#F0A05C" : "#6FB9F0"}" stroke-width="1.2" opacity=".85"/></svg>` +
        `<div class="cell-sim">類似 ${it.sim}%</div>`;
      grid.appendChild(el);
      cells.push(el);
    });

    // パネルが見えたら順番にポップ
    const panel = document.querySelector(".mech-result");
    const gio = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        cells.forEach((c, i) => {
          setTimeout(() => c.classList.add("pop"), reduceMotion ? 0 : i * 40);
        });
        gio.disconnect();
      }
    }, { threshold: 0.12 });
    gio.observe(panel);
  }

  /* ---------- FAQ：開いたら他を閉じる ---------- */
  const faqs = [...document.querySelectorAll(".faq-item")];
  faqs.forEach((d) => {
    d.addEventListener("toggle", () => {
      if (d.open) faqs.forEach((o) => { if (o !== d) o.open = false; });
    });
  });
})();
