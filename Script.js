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

function showMessage(message, isError = false) {
  let box = document.getElementById("wish-message");
  if (!box) return;
  box.textContent = message;
  box.style.color = isError ? "#b42318" : "#24734b";
}

function createWishForm(wish = null) {
  const old = document.getElementById("wish-form-area");
  if (old) old.remove();

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
    const notice = document.createElement("p");
    notice.textContent = "請使用主辦人提供的專屬許願連結。";
    main.appendChild(notice);
    return;
  }

  try {
    const result = await api("get_result");

    if (result && result.assignment) {
      const box = document.createElement("section");
      box.innerHTML = `
        <h2>🎉 你的抽籤結果</h2>
        <p id="draw-result"></p>
      `;
      box.querySelector("#draw-result").textContent =
        result.assignment.phonetic_hint || "請聯絡主辦人確認結果";
      main.appendChild(box);
      return;
    }
  } catch (error) {
    // 尚未開放抽籤時，繼續載入許願表單
  }

  try {
    const result = await api("get_wish");
    createWishForm(result.wish || null);
  } catch (error) {
    const notice = document.createElement("p");
    notice.textContent = "載入失敗：" + error.message;
    main.appendChild(notice);
  }
}

init();
