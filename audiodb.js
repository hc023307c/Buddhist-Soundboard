// audiodb.js
// 這個檔案是「法器 DB」，未來只要在這裡新增/調整即可。
// audio 檔案請放在 /audio 資料夾下。

const AUDIO_DB = [
  {
    id: "yinqing",
    name: "引磬",
    subtitle: "一聲清脆 · 提起正念",
    file: "audio/yinqing.WAV"
    // mode: "fade"  // 可省略，預設就是 fade
  },
  {
    id: "yinqingbing",
    name: "引磬柄",
    subtitle: "起落有序 · 開啟儀軌",
    file: "audio/yinqingbing.WAV"
    // mode: "fade"
  },
  {
    id: "xiaoyu",
    name: "小木魚",
    subtitle: "一下一念 · 念念分明",
    file: "audio/xiaoyu.WAV"
    // mode 不寫 → 由 id 判斷含 xiaoyu → overlap（可重疊）
  },
  {
    id: "yaqing",
    name: "壓磬聲",
    subtitle: "壓磬短音 · 回到當下",
    file: "audio/yaqing.WAV",
    // ✅ 連動關係：壓磬一來，要先壓掉「引磬」的聲音
    stopOnPlay: ["yinqing"]
    // 若未來想同時停掉兩個，就寫 ["yinqing", "yinqingbing"] 之類
  }

  // 未來要新增法器，照這樣加就好：
  // {
  //   id: "muyu_big",
  //   name: "大木魚",
  //   subtitle: "・・・（簡短說明）",
  //   file: "audio/muyu_big.WAV",
  //   mode: "overlap" 或 "fade",
  //   stopOnPlay: ["someOtherId", "anotherId"] // 選用
  // }
];
