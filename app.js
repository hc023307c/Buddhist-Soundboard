// app.js（法器演音板）
// 功能重點：
// 1. 使用 Web Audio API 預先解碼，減少延遲
// 2. 小木魚（id 含 "xiaoyu"）→ 重疊播放（overlap 模式）
// 3. 其他法器（如 yinqing / yinqingbing）→ 新聲來時舊聲淡出（fade 模式）

document.addEventListener("DOMContentLoaded", () => {
  const gridEl = document.getElementById("padGrid");
  const STORAGE_KEY = "dharmaAudioPadOrder";

  // === 檢查 DB ===
  if (typeof AUDIO_DB === "undefined") {
    console.error("AUDIO_DB 未定義，請先在 audiodb.js 定義。");
    return;
  }

  // === Web Audio Engine ===
  let audioCtx = null;
  const audioBuffers = new Map();        // id -> AudioBuffer
  const activeSources = new Map();       // id -> [{ source, gainNode }]

  function getAudioContext() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
    return audioCtx;
  }

  // 推斷播放模式：小木魚重疊，其它淡出
  function getPlayMode(meta) {
    if (meta.mode) return meta.mode;
    if (meta.id && meta.id.toLowerCase().includes("xiaoyu")) {
      return "overlap";
    }
    return "fade";
  }

  async function loadBuffer(meta) {
    if (audioBuffers.has(meta.id)) return;

    const ctx = getAudioContext();
    try {
      const resp = await fetch(meta.file);
      const arrBuf = await resp.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrBuf);
      audioBuffers.set(meta.id, audioBuf);
    } catch (err) {
      console.error("載入音檔失敗：", meta.file, err);
    }
  }

  async function ensureBufferLoaded(meta) {
    if (audioBuffers.has(meta.id)) return;
    await loadBuffer(meta);
  }

  function playInstrument(meta, playBtn) {
    const ctx = getAudioContext();
    const buffer = audioBuffers.get(meta.id);
    if (!buffer) {
      console.warn("音檔尚未載入或 id 不存在：", meta.id);
      return;
    }

    const mode = getPlayMode(meta);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(1.0, ctx.currentTime);

    source.connect(gainNode).connect(ctx.destination);

    let list = activeSources.get(meta.id) || [];

    if (mode === "fade") {
      // 新聲來 → 舊聲淡出
      const now = ctx.currentTime;
      list.forEach(({ source: oldSrc, gainNode: oldGain }) => {
        try {
          const g = oldGain.gain;
          g.cancelScheduledValues(now);
          g.setValueAtTime(g.value, now);
          g.linearRampToValueAtTime(0, now + 0.25); // 0.25s 淡出
          oldSrc.stop(now + 0.3);
        } catch (_) {}
      });
      list = []; // 清掉舊的
    }

    const entry = { source, gainNode };
    list.push(entry);
    activeSources.set(meta.id, list);

    playBtn.classList.add("is-playing");

    source.onended = () => {
      const arr = activeSources.get(meta.id) || [];
      const idx = arr.indexOf(entry);
      if (idx !== -1) arr.splice(idx, 1);
      if (arr.length === 0) {
        activeSources.delete(meta.id);
        playBtn.classList.remove("is-playing");
      } else {
        activeSources.set(meta.id, arr);
      }
    };

    try {
      source.start();
    } catch (e) {
      console.warn("source start failed", e);
    }
  }

  function stopInstrument(meta, playBtn) {
    if (!audioCtx) {
      playBtn.classList.remove("is-playing");
      return;
    }
    const ctx = audioCtx;
    const list = activeSources.get(meta.id);
    if (!list || !list.length) {
      playBtn.classList.remove("is-playing");
      return;
    }

    const now = ctx.currentTime;
    list.forEach(({ source, gainNode }) => {
      try {
        const g = gainNode.gain;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(0, now + 0.15);
        source.stop(now + 0.2);
      } catch (_) {}
    });

    playBtn.classList.remove("is-playing");
    // onended 觸發後會真正清掉 activeSources
  }

  // === 原本的排序邏輯 ===

  function loadOrder() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return null;
      return arr;
    } catch (e) {
      console.warn("Load order failed", e);
      return null;
    }
  }

  function saveOrder(order) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch (e) {
      console.warn("Save order failed", e);
    }
  }

  function getOrderedList() {
    const map = new Map();
    AUDIO_DB.forEach((item) => map.set(item.id, item));

    const savedOrder = loadOrder();
    let result = [];

    if (savedOrder && savedOrder.length > 0) {
      savedOrder.forEach((id) => {
        if (map.has(id)) {
          result.push(map.get(id));
          map.delete(id);
        }
      });
    }

    map.forEach((item) => {
      result.push(item);
    });

    return result;
  }

  // 建立單一 pad 模組（播放＋停止）
  function createPadItem(meta) {
    const padItem = document.createElement("div");
    padItem.className = "pad-item";
    padItem.dataset.id = meta.id;
    padItem.setAttribute("draggable", "true");

    // 上方：播放按鍵
    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "audio-pad";

    const mainLabel = document.createElement("div");
    mainLabel.className = "audio-pad-label-main";
    mainLabel.textContent = meta.name;

    const subLabel = document.createElement("div");
    subLabel.className = "audio-pad-label-sub";
    subLabel.textContent = meta.subtitle || "";

    playBtn.appendChild(mainLabel);
    playBtn.appendChild(subLabel);

    // 下方：停止按鍵
    const stopBtn = document.createElement("button");
    stopBtn.type = "button";
    stopBtn.className = "audio-pad-stop";
    stopBtn.textContent = "停止此法器";

    // 播放邏輯（使用 Web Audio）
    playBtn.addEventListener("click", async () => {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch (e) {
          console.warn("AudioContext resume failed", e);
        }
      }

      await ensureBufferLoaded(meta);
      playInstrument(meta, playBtn);
    });

    // 停止此法器
    stopBtn.addEventListener("click", () => {
      stopInstrument(meta, playBtn);
    });

    // 組合模組
    padItem.appendChild(playBtn);
    padItem.appendChild(stopBtn);

    return padItem;
  }

  // 渲染全部法器
  function renderPads() {
    const list = getOrderedList();
    gridEl.innerHTML = "";
    list.forEach((meta) => {
      const padItem = createPadItem(meta);
      gridEl.appendChild(padItem);
    });

    initDragAndDrop();
    // 順便偷偷預載所有音檔（不等，也不阻塞 UI）
    list.forEach((meta) => {
      loadBuffer(meta);
    });
  }

  // 拖曳排序
  function initDragAndDrop() {
    const items = Array.from(gridEl.querySelectorAll(".pad-item"));
    let dragSrcId = null;

    items.forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        dragSrcId = item.dataset.id;
        item.classList.add("dragging");
        try {
          e.dataTransfer.setData("text/plain", dragSrcId);
        } catch (_) {}
        e.dataTransfer.effectAllowed = "move";
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        dragSrcId = null;
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        const targetId = item.dataset.id;
        if (!dragSrcId || !targetId || dragSrcId === targetId) return;

        const currentOrder = getOrderedList().map((it) => it.id);
        const fromIndex = currentOrder.indexOf(dragSrcId);
        const toIndex = currentOrder.indexOf(targetId);
        if (fromIndex === -1 || toIndex === -1) return;

        currentOrder.splice(toIndex, 0, currentOrder.splice(fromIndex, 1)[0]);
        saveOrder(currentOrder);
        renderPads();
      });
    });
  }

  // ===== 啟動 =====
  renderPads();
});
