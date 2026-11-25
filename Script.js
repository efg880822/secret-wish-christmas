
const SUPABASE_URL = "https://ojktycjkjoeqskvqzask.supabase.co";
const SUPABASE_KEY = "sb_publishable_OKBRdTpZlGS-nFCXugSSpg_JEtFn4Wu";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/hyper-function`;

const params = new URLSearchParams(location.search);
const token = params.get("token");
const main = document.querySelector("main");

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

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || result.error || `錯誤：${response.status}`);
  }

  return result;
}

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

function showResult(assignment) {
  const box = document.createElement("section");
  box.innerHTML = `
    <h2>🎉 你的抽籤結果</h2>
    <p id="draw-result"></p>
  `;

  box.querySelector("#draw-result").textContent =
    assignment.phonetic_hint || "請聯絡主辦人確認結果";

  main.appendChild(box);
}

function showMessage(message, isError = false) {
  const box = document.getElementById("wish-message");
  if (!box) return;

  box.textContent = message;
  box.style.color = isError ? "#b42318" : "#24734b";
}

function createWishForm(wish = null) {
  const area = document.createElement("section");
  area.id = "wish-form-area";

  area.innerHTML = `
    <h2>🎁 寫下你的聖誕願望</h2>
    <p>請留下兩個線索，讓抽到你的人猜猜你的願望。</p>

    <form id="wish-form">
      <label for="phonetic">注音縮寫線索</label>
      <input id="phonetic" maxlength="100"
        placeholder="例如：ㄌㄅㄉ" required>

      <label for="direction">方向提示</label>
      <textarea id="direction" maxlength="300"
        placeholder="例如：生活用品、實用的小物..." required></textarea>

      <button type="submit">儲存願望</button>
    </form>

    <p id="wish-message" role="status"></p>
  `;

  main.appendChild(area);

  if (wish) {
    document.getElementById("phonetic").value =
      wish.phonetic_hint || "";
    document.getElementById("direction").value =
      wish.direction_hint || "";
  }

  document.getElementById("wish-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const phonetic_hint = document.getElementById("phonetic").value.trim();
    const direction_hint = document.getElementById("direction").value.trim();

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
  });
}

async function init() {
  if (!token) {
    showNotice(
      "請使用專屬許願連結",
      "請使用主辦人提供的專屬許願連結。"
    );
    return;
  }

  try {
    const result = await api("get_result");

    if (result && result.assignment) {
      showResult(result.assignment);
      return;
    }
  } catch (error) {
    // 尚未抽籤時，繼續確認活動狀態
  }

  try {
    const result = await api("get_wish");

    if (result.event_status === "closed") {
      showNotice(
        "活動已進入抽籤階段",
        "許願已截止，請等待主辦人完成抽籤。"
      );
      return;
    }

    if (result.event_status === "drawn") {
      showNotice(
        "抽籤已完成",
        "暫時無法讀取結果，請聯絡主辦人。"
      );
      return;
    }

    if (result.event_status === "preparing") {
      showNotice(
        "活動尚未開放許願",
        "請稍後再來。"
      );
      return;
    }

    if (result.event_status !== "wishing") {
      showNotice(
        "目前無法載入活動",
        "請聯絡主辦人確認活動狀態。"
      );
      return;
    }

    createWishForm(result.wish || null);

  } catch (error) {
    showNotice("載入失敗", error.message);
  }
}

init();
