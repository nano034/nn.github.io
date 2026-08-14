/* =========================================================
   NN | NaNox サーバー公式サイト — main.js
   ・ボトムナビの現在地ハイライト
   ・スクロールリビール演出
   ・sc.html: プルダウン → スクリプトカード表示 → コピー機能
   ・共通: コピー系ボタン & トースト通知
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initBottomNav();
  initReveal();
  initScriptPage();
  initCopyButtons();
});

/* ---------------------------------------------------------
   ボトムナビ: 現在のページに is-active を付与
   --------------------------------------------------------- */
function initBottomNav () {
  const current = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-item').forEach((item) => {
    const target = item.getAttribute('data-page');
    if (target === current) {
      item.classList.add('is-active');
      item.setAttribute('aria-current', 'page');
    }
  });
}

/* ---------------------------------------------------------
   スクロールで .reveal 要素をふわっと表示
   --------------------------------------------------------- */
function initReveal () {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach((el) => io.observe(el));
}

/* ---------------------------------------------------------
   sc.html: カテゴリを選ぶとスクリプトカードが出てくる仕組み
   ---------------------------------------------------------
   ★ ここを編集するだけで、プルダウンの表示名・カードの名前・
     コピーされるコードのすべてが変わります。他のファイルは
     一切いじらなくてOKです。

   使い方:
   - SCRIPT_DATA のキー(1〜5)がプルダウンの並び順です。
   - label      … プルダウインに表示される名前
   - cards      … そのカテゴリを選んだときに出てくるカード
     - label    … カードの名前（見出し）
     - code     … 白い枠に表示され、コピーされるコード本体
       （コピー時は自動で "--カードの名前" が1行目に付きます）
   - カードは3枚に固定していません。増やしたり減らしたりも
     自由にできます（配列の中身を足し引きするだけ）。
   --------------------------------------------------------- */
const SCRIPT_DATA = {
  1: {
    label: 'UNIVERSAL',
    cards: [
      { label: 'Infinite Yield', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/EdgeIY/infiniteyield/master/source"))()' },
      { label: 'Ghost Hub', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/tienkhanh11/spicy/refs/heads/main/GhostHub.lua"))()' },
      { label: 'Fly Gui V3', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/XNEOFF/FlyGuiV3/main/FlyGuiV3.txt"))()' },
      { label: 'Aim Bot', code: 'loadstring(game:HttpGet("https://rawscripts.net/raw/Universal-Script-Aimbot-Mobile-34677"))()' },
    ],
  },
  2: {
    label: 'TIOLL',
    cards: [
      { label: 'Open Rugger', code: 'loadstring(game:HttpGet("https://gist.githubusercontent.com/totohub-ex/3b5193e9ebcf99ab6460eab9f6dc7852/raw/gistfile1.txt"))()' },
    ],
  },
};

function initScriptPage () {
  const select = document.getElementById('scriptSelect');
  if (!select) return; // sc.html 以外では何もしない

  const selectedTag  = document.getElementById('selectedTag');
  const selectedNum  = document.getElementById('selectedNum');
  const cardsWrap    = document.getElementById('scriptCards');
  const emptyHint    = document.getElementById('emptyHint');

  // プルダウンの選択肢を SCRIPT_DATA から自動で作る
  Object.keys(SCRIPT_DATA).forEach((key) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = SCRIPT_DATA[key].label;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    const value = select.value;
    if (cardsWrap) cardsWrap.innerHTML = ''; // 前の選択肢のカードは一旦クリア

    if (!value) {
      selectedTag && selectedTag.classList.remove('is-show');
      emptyHint && emptyHint.classList.remove('is-hidden');
      return;
    }

    const category = SCRIPT_DATA[value];
    if (!category) return;

    // 選択中タグをトップに表示（=プルダウンは閉じたまま選択内容が分かる）
    if (selectedTag && selectedNum) {
      selectedNum.textContent = category.label;
      selectedTag.classList.add('is-show');
    }

    // カードを1枚ずつ作って、白い枠に code を差し込む
    category.cards.forEach((card) => {
      const copyText = `--${card.label}\n${card.code}`; // Lua用: 1行目コメント→改行→コード

      const el = document.createElement('div');
      el.className = 'script-card is-show';
      el.innerHTML = `
        <div class="script-card__head">
          <span class="script-card__label"></span>
        </div>
        <div class="code-frame">
          <code></code>
        </div>
        <button class="copy-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
          <span class="copy-btn__label">コピー</span>
        </button>
      `;
      el.querySelector('.script-card__label').textContent = card.label;
      el.querySelector('code').textContent = card.code;
      el.querySelector('.copy-btn').dataset.copy = copyText;

      cardsWrap && cardsWrap.appendChild(el);
    });

    emptyHint && emptyHint.classList.add('is-hidden');
  });
}

/* ---------------------------------------------------------
   共通: [data-copy] を持つボタンを押したらクリップボードへコピー
   --------------------------------------------------------- */
function initCopyButtons () {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;

    const card = btn.closest('.script-card');
    const codeText = card?.querySelector('code')?.textContent || '';
    const text = btn.dataset.copy || codeText;
    if (!text) return;

    try {
      await copyToClipboard(text);
      showToast(`「${codeText || text}」をコピーしました！`);
      const label = btn.querySelector('.copy-btn__label');
      btn.classList.add('is-copied');
      if (label) {
        const original = 'コピー';
        label.textContent = 'コピー済み ✓';
        setTimeout(() => {
          label.textContent = original;
          btn.classList.remove('is-copied');
        }, 1600);
      }
    } catch (err) {
      showToast('コピーに失敗しました…');
    }
  });
}

function copyToClipboard (text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  // フォールバック（古いブラウザ / http環境）
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      resolve();
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(ta);
    }
  });
}

/* ---------------------------------------------------------
   トースト通知
   --------------------------------------------------------- */
let toastTimer = null;
function showToast (message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('is-show');
  }, 2000);
}
