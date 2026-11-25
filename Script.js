
const SUPABASE_URL = "https://ojktycjkjoeqskvqzask.supabase.co";
const SUPABASE_KEY = "sb_publishable_OKBRdTpZlGS-nFCXugSSpg_JEtFn4Wu";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/hyper-function`;

const params = new URLSearchParams(location.search);
const token = params.get("token");
const main = document.querySelector("main");

// API 呼叫
async function api(action, data = {}) {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({ action, token, ...data })
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(`伺服器回傳格式錯誤：HTTP ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(
      result.message || result.error || `錯誤：${response.status}`
    );
  }

  return result;
}

// 更新活動狀態
function updateEventStatus(status) {
  const statusBox = document.getElementById("event-status");

  if (!statusBox) return;

  const statusText = {
    preparing: "準備中",
    wishing: "開放許願中",
    closed: "活動已進入抽籤階段",
    drawn: "抽籤已完成"
  };

  statusBox.textContent =
    statusText[status] || "活動狀態確認中";
}

// 顯示通知
function showNotice(title, message) {
  const box = document.createElement("section");
  box.id = "event-notice";

  const heading = document.createElement("h2");
  heading.textContent = title;

  const description = document.createElement("p");
  description.textContent = message;

  box.append(heading, description);
  main.appendChild(box);
}

// 固定顯示交換禮物公告
function showWishRules() {
  if (document.getElementById("wish-rules-announcement")) {
    return;
  }

  const box = document.createElement("section");
  box.id = "wish-rules-announcement";

  box.innerHTML = `
    <h2>🎄 交換禮物活動公告</h2>

    <div class="announcement-budget">
      🎁 禮物預算：NT$300～500
    </div>

    <div class="announcement-rule">
      <h3>① 願望注音線索</h3>
      <p>
        請使用希望收到的物品名稱，
        並提供每個中文字的第一個注音符號。
      </p>

      <div class="announcement-examples">
        <p>衛生紙 → ㄨㄕㄓ</p>
        <p>馬克杯 → ㄇㄎㄅ</p>
        <p>保溫瓶 → ㄅㄨㄆ</p>
      </div>

      <p>只需要每個中文字的第一個注音，不需要完整注音。</p>
    </div>

    <div class="announcement-rule">
      <h3>② 商品價格與購買限制</h3>
      <ul>
        <li>請確認商品在一般通路確實能以 NT$300～500 左右購買。</li>
        <li>請勿許願超出預算太多的商品。</li>
        <li>請勿填寫冷門、停產或難以購買的商品。</li>
        <li>請以市面上實際買得到、價格合理的商品為主。</li>
      </ul>
    </div>

    <div class="announcement-rule">
      <h3>③ 主辦方保留最終決定權</h3>
      <p>
        若願望不符合活動預算、商品難以取得，
        或不適合本次活動，主辦方有權要求修改或調整。
      </p>
    </div>

    <p class="announcement-footer">
      🎅 請大家配合活動規則，讓每個人都能收到合適又有趣的禮物！
    </p>
  `;

  const status = document.querySelector(".status");

  if (status) {
    status.insertAdjacentElement("afterend", box);
  } else {
    main.prepend(box);
  }
}

// 顯示抽籤結果
function showResult(data) {
  const box = document.createElement("section");
  box.id = "draw-result-area";

  const heading = document.createElement("h2");
  heading.textContent = "🎉 你的抽籤結果";

  const participant = document.createElement("p");
  participant.textContent =
    `抽籤編號：${data.participant_no ?? "未提供"}`;

  const phonetic = document.createElement("p");
  phonetic.textContent =
    `注音縮寫線索：${data.result.phonetic_hint || "無"}`;

  const direction = document.createElement("p");
  direction.textContent =
    `方向提示：${data.result.direction_hint || "無"}`;

  box.append(
    heading,
    participant,
    phonetic,
    direction
  );

  main.appendChild(box);
}

// 顯示許願表單訊息
function showMessage(message, isError = false) {
  const box = document.getElementById("wish-message");

  if (!box) return;

  box.textContent = message;
  box.style.color = isError ? "#b42318" : "#24734b";
}

// 建立許願表單
function createWishForm(wish = null) {
  const area = document.createElement("section");
  area.id = "wish-form-area";

  area.innerHTML = `
    <h2>🎁 寫下你的聖誕願望</h2>
    <p>請留下兩個線索，讓抽到你的人猜猜你的願望。</p>

    <form id="wish-form">
      <label for="phonetic">注音縮寫線索</label>

      <input
        id="phonetic"
        maxlength="100"
        placeholder="例如：ㄨㄕㄓ"
        required
      >

      <label for="direction">方向提示</label>

      <textarea
        id="direction"
        maxlength="300"
        placeholder="例如：生活用品、實用的小物..."
        required
      ></textarea>

      <button type="submit">儲存願望</button>
    </form>

    <p id="wish-message" role="status"></p>
  `;

  main.appendChild(area);

  // 載入已儲存的願望
  if (wish) {
    document.getElementById("phonetic").value =
      wish.phonetic_hint || "";

    document.getElementById("direction").value =
      wish.direction_hint || "";
  }

  // 儲存願望
  document.getElementById("wish-form").addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const phonetic_hint =
        document.getElementById("phonetic").value.trim();

      const direction_hint =
        document.getElementById("direction").value.trim();

      if (!phonetic_hint || !direction_hint) {
        showMessage("請填寫兩個欄位。", true);
        return;
      }

      const button = event.target.querySelector("button");

      button.disabled = true;
      button.textContent = "儲存中...";

      try {
        const result = await api("save_wish", {
          phonetic_hint,
          direction_hint
        });

        showMessage(result.message || "願望已儲存！");
      } catch (error) {
        showMessage(error.message, true);
      } finally {
        button.disabled = false;
        button.textContent = "儲存願望";
      }
    }
  );
}

// 主程式
async function init() {
  if (!token) {
    showNotice(
      "請使用專屬許願連結",
      "請使用主辦人提供的專屬許願連結。"
    );
    return;
  }

  // 有有效參加者連結時，先顯示公告
  showWishRules();

  try {
    // 取得願望及活動狀態
    const result = await api("get_wish");

    updateEventStatus(result.event_status);

    if (!result.event_status) {
      showNotice(
        "無法確認活動狀態",
        "請重新整理頁面，若問題持續請聯絡主辦人。"
      );
      return;
    }

    // 尚未開放許願
    if (result.event_status === "preparing") {
      showNotice(
        "活動尚未開放許願",
        "請稍後再來。"
      );
      return;
    }

    // 已關閉許願
    if (result.event_status === "closed") {
      showNotice(
        "活動已進入抽籤階段",
        "許願已截止，請等待主辦人完成抽籤。"
      );
      return;
    }

    // 抽籤完成
    if (result.event_status === "drawn") {
      try {
        const drawResult = await api("get_result");

        if (
          drawResult &&
          drawResult.result &&
          typeof drawResult.result === "object"
        ) {
          showResult(drawResult);
        } else {
          showNotice(
            "抽籤結果讀取失敗",
            "找不到抽籤結果：" + JSON.stringify(drawResult)
          );
        }

      } catch (error) {
        showNotice(
          "抽籤結果讀取失敗",
          "錯誤原因：" + error.message
        );
      }

      return;
    }

    // 開放許願
    if (result.event_status === "wishing") {
      createWishForm(result.wish || null);
      return;
    }

    // 未知狀態
    showNotice(
      "目前無法載入活動",
      "請聯絡主辦人確認活動狀態。"
    );

  } catch (error) {
    showNotice(
      "載入失敗",
      error.message
    );
  }
}

init();
