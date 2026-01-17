// app.js

document.addEventListener("DOMContentLoaded", () => {
  const gridEl = document.getElementById("instrumentGrid");

  if (!window.INSTRUMENTS || !window.VELOCITY_LEVELS) {
    console.error("INSTRUMENTS 或 VELOCITY_LEVELS 未定義，請確認 audiodb.js 已正確載入。");
    return;
  }

  // 為每個法器準備 base Audio + 正在播放中的 clone 清單
  const instrumentPlayers = {};

  window.INSTRUMENTS.forEach((inst) => {
    const audio = new Audio(inst.file);
    audio.preload = "auto";

    instrumentPlayers[inst.id] = {
      baseAudio: audio,
      activeNodes: [] // 存放正在播放的 clone
    };
  });

  // 建立法器卡片
  function renderInstruments() {
    gridEl.innerHTML = "";

    window.INSTRUMENTS.forEach((inst) => {
      const card = document.createElement("div");
      card.className = "instrument-card";

      // Header
      const header = document.createElement("div");
      header.className = "instrument-header";

      const titleGroup = document.createElement("div");
      titleGroup.className = "instrument-title-group";

      const nameEl = document.createElement("h2");
      nameEl.className = "instrument-name";
      nameEl.textContent = inst.name;

      const descEl = document.createElement("p");
      descEl.className = "instrument-desc";
      descEl.textContent = inst.description || "";

      titleGroup.appendChild(nameEl);
      titleGroup.appendChild(descEl);

      const icon = document.createElement("div");
      icon.className = "instrument-icon";

      header.appendChild(titleGroup);
      header.appendChild(icon);

      // Velocity Bar（一顆內的五段）
      const bar = document.createElement("div");
      bar.className = "velocity-bar";

      window.VELOCITY_LEVELS.forEach((level) => {
        const btn = document.createElement("button");
        btn.className = `velocity-step level-${level.id}`;
        btn.textContent = level.label;

        btn.addEventListener("click", () => {
          playInstrumentLevel(inst.id, level);
        });

        bar.appendChild(btn);
      });

      // Stop row（單一法器停止）
      const stopRow = document.createElement("div");
      stopRow.className = "stop-row";

      const stopBtn = document.createElement("button");
      stopBtn.className = "stop-button";
      stopBtn.innerHTML = `<span class="icon"></span><span>停止本法器</span>`;

      stopBtn.addEventListener("click", () => {
        stopInstrument(inst.id);
      });

      stopRow.appendChild(stopBtn);

      // 組合卡片
      card.appendChild(header);
      card.appendChild(bar);
      card.appendChild(stopRow);

      gridEl.appendChild(card);
    });
  }

  // 播放某一個法器的某一個力度
  function playInstrumentLevel(instrumentId, level) {
    const player = instrumentPlayers[instrumentId];
    if (!player) return;

    const base = player.baseAudio;

    // 建立 clone，避免快速連打被截斷
    const node = base.cloneNode(true);
    node.volume = level.gain;

    // 加入 active 清單，方便停止
    player.activeNodes.push(node);

    node.addEventListener("ended", () => {
      const idx = player.activeNodes.indexOf(node);
      if (idx !== -1) {
        player.activeNodes.splice(idx, 1);
      }
    });

    // 播放
    node.play().catch((err) => {
      console.warn("播放失敗（可能是瀏覽器尚未允許音訊互動）:", err);
    });
  }

  // 停止某一個法器目前所有正在響的聲音
  function stopInstrument(instrumentId) {
    const player = instrumentPlayers[instrumentId];
    if (!player) return;

    player.activeNodes.forEach((node) => {
      try {
        node.pause();
        node.currentTime = 0;
      } catch (e) {
        // ignore
      }
    });
    player.activeNodes.length = 0;
  }

  // 初始 render
  renderInstruments();
});