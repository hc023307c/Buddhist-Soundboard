// audiodb.js
// 定義有哪些法器，以及每一顆法器使用哪個音檔

// 五段力度設定（由輕到止靜）
const VELOCITY_LEVELS = [
  { id: 1, label: "輕 1", gain: 0.25 },
  { id: 2, label: "輕 2", gain: 0.4 },
  { id: 3, label: "中 3", gain: 0.6 },
  { id: 4, label: "強 4", gain: 0.8 },
  { id: 5, label: "止靜 5", gain: 1.0 }
];

// 法器清單：先用你給的三個
const INSTRUMENTS = [
  {
    id: "yinqing",
    name: "引磬",
    description: "止靜用引磬，適合段落開始與收攝。",
    file: "audio/yinqing.mp4"
  },
  {
    id: "yinqingbing",
    name: "引磬柄",
    description: "金屬敲擊，引導出境。",
    file: "audio/yinqingbing.mp4"
  },
  {
    id: "xiaoyu",
    name: "小木魚",
    description: "念佛、持咒時的節奏與攝心。",
    file: "audio/xiaoyu.mp4"
  }
];

// 給 app.js 用的匯出（如果不用 bundler，這樣直接掛在 window 上也可）
window.VELOCITY_LEVELS = VELOCITY_LEVELS;
window.INSTRUMENTS = INSTRUMENTS;