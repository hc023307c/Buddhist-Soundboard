// app.js

document.addEventListener("DOMContentLoaded", () => {
  const PAGE_SIZE = 12; // 一頁最多 12 個按鍵

  const gridEl = document.getElementById("padGrid");
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  const pageInfoEl = document.getElementById("pageInfo");

  let currentPage = 1;
  const totalPages = Math.max(1, Math.ceil(AUDIO_BANK.length / PAGE_SIZE));

  // 事先為每個法器建立 Audio 物件
  const audioPlayers = {};
  AUDIO_BANK.forEach((item) => {
    const audio = new Audio(item.src);
    audio.preload = "auto";
    audioPlayers[item.id] = audio;
  });

  function playSoundById(id, padElement) {
    const audio = audioPlayers[id];
    if (!audio) return;

    // 如果正在播，從頭開始
    try {
      audio.currentTime = 0;
    } catch (e) {
      // 某些瀏覽器如果還沒載完會噴錯，忽略即可
    }

    // 加上播放中的外觀效果
    padElement.classList.add("is-playing");

    audio
      .play()
      .catch(() => {
        // 手機若尚未有使用者觸發許可，可能會失敗
      })
      .finally(() => {
        // 約略在 300ms 後拿掉掃光（動畫本身 0.5s）
        setTimeout(() => {
          padElement.classList.remove("is-playing");
        }, 350);
      });
  }

  function renderPage(page) {
    // 保護數值
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPage = page;

    // 更新分頁按鈕狀態
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    pageInfoEl.textContent = `第 ${currentPage} / ${totalPages} 頁`;

    // 清空格子
    gridEl.innerHTML = "";

    const start = (currentPage - 1) * PAGE_SIZE;
    const slice = AUDIO_BANK.slice(start, start + PAGE_SIZE);

    slice.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "audio-pad";
      btn.dataset.audioId = item.id;

      const main = document.createElement("div");
      main.className = "audio-pad-label-main";
      main.textContent = item.name || "法器";

      const sub = document.createElement("div");
      sub.className = "audio-pad-label-sub";
      sub.textContent = item.description || "";

      btn.appendChild(main);
      btn.appendChild(sub);

      btn.addEventListener("click", () => {
        playSoundById(item.id, btn);
      });

      gridEl.appendChild(btn);
    });
  }

  // 分頁按鈕事件
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      renderPage(currentPage - 1);
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      renderPage(currentPage + 1);
    }
  });

  // 初始畫面
  renderPage(1);
});