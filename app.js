// app.js

document.addEventListener("DOMContentLoaded", () => {
  const gridEl = document.getElementById("padGrid");
  const STORAGE_KEY = "dharmaAudioPadOrder";

  // 讀取排序設定（localStorage）
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

  // 儲存排序設定
  function saveOrder(order) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch (e) {
      console.warn("Save order failed", e);
    }
  }

  // 根據目前 DB + order，建立實際渲染順序
  function getOrderedList() {
    const map = new Map();
    AUDIO_DB.forEach((item) => map.set(item.id, item));

    const savedOrder = loadOrder();
    let result = [];

    if (savedOrder && savedOrder.length > 0) {
      // 先依照已存順序放入
      savedOrder.forEach((id) => {
        if (map.has(id)) {
          result.push(map.get(id));
          map.delete(id);
        }
      });
    }

    // 有新增法器但 order 沒記錄到的，補在後面
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

    // 建立 Audio 實例
    const audio = new Audio(meta.file);
    audio.preload = "auto";

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

    // 播放邏輯
    function playSound() {
      try {
        audio.currentTime = 0;
        audio.play();
        playBtn.classList.add("is-playing");
      } catch (e) {
        console.warn("play failed", e);
      }
    }

    function stopSound() {
      try {
        audio.pause();
        audio.currentTime = 0;
        playBtn.classList.remove("is-playing");
      } catch (e) {
        console.warn("stop failed", e);
      }
    }

    playBtn.addEventListener("click", playSound);
    stopBtn.addEventListener("click", stopSound);

    audio.addEventListener("ended", () => {
      playBtn.classList.remove("is-playing");
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

    // 渲染完再掛拖曳事件
    initDragAndDrop();
  }

  // 拖曳排序邏輯（簡易版：桌機一定可用，手機看瀏覽器支援度）
  function initDragAndDrop() {
    const items = Array.from(gridEl.querySelectorAll(".pad-item"));
    let dragSrcId = null;

    items.forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        dragSrcId = item.dataset.id;
        item.classList.add("dragging");

        // 有些瀏覽器需要 setData 才會啟用 DnD
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

        // 移動元素：fromIndex → toIndex
        currentOrder.splice(toIndex, 0, currentOrder.splice(fromIndex, 1)[0]);
        saveOrder(currentOrder);
        renderPads();
      });
    });
  }

  // ===== 啟動 =====
  renderPads();
});
