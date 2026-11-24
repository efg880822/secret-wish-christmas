
const wishButton = document.getElementById("wish-button");
const drawButton = document.getElementById("draw-button");
const statusText = document.getElementById("event-status");

// 目前先做介面測試，正式功能之後連接資料庫
wishButton.addEventListener("click", () => {
  alert("🎄 許願功能即將開放！");
});

drawButton.addEventListener("click", () => {
  alert("🎁 抽籤功能將於活動截止後開放！");
});

// 顯示目前活動狀態
statusText.textContent = "準備中";
