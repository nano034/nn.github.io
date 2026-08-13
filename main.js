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
   ★ 実際に配信するコードへ差し替えるときは、この
     SCRIPT_DATA の文字列だけ書き換えればOKです。
     key: プルダウンの 1〜5 / value: カード1・2・3 の中身
   --------------------------------------------------------- */
const SCRIPT_DATA = {
  1: ['SC1-1', 'SC1-2', 'SC1-3'],
  2: ['SC2-1', 'SC2-2', 'SC2-3'],
  3: ['SC3-1', 'SC3-2', 'SC3-3'],
  4: ['SC4-1', 'SC4-2', 'SC4-3'],
  5: ['SC5-1', 'SC5-2', 'SC5-3'],
};

function initScriptPage () {
  const select = document.getElementById('scriptSelect');
  if (!select) return; // sc.html 以外では何もしない

  const selectedTag  = document.getElementById('selectedTag');
  const selectedNum  = document.getElementById('selectedNum');
  const cards        = Array.from(document.querySelectorAll('.script-card'));
  const emptyHint    = document.getElementById('emptyHint');

  select.addEventListener('change', () => {
    const value = select.value;

    if (!value) {
      cards.forEach((c) => c.classList.remove('is-show'));
      selectedTag && selectedTag.classList.remove('is-show');
      emptyHint && emptyHint.classList.remove('is-hidden');
      return;
    }

    const codes = SCRIPT_DATA[value] || [];

    // 選択中タグをトップに表示（=プルダウンは閉じたまま選択内容が分かる）
    if (selectedTag && selectedNum) {
      selectedNum.textContent = value;
      selectedTag.classList.add('is-show');
    }

    // カード1・2・3 を表示し、中の枠に sc〇 を差し込む
    cards.forEach((card, i) => {
      const codeEl = card.querySelector('code');
      const copyBtn = card.querySelector('.copy-btn');
      const text = codes[i] || `SC${value}-${i + 1}`;
      // コピーされる内容: Lua用に "--カード◯" の後ろで改行してコードを続ける
      const copyText = `--カード${i + 1}\n${text}`;

      if (codeEl) codeEl.textContent = text;
      if (copyBtn) {
        copyBtn.dataset.copy = copyText;
        copyBtn.classList.remove('is-copied');
        copyBtn.querySelector('.copy-btn__label').textContent = 'コピー';
      }
      card.classList.add('is-show');
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

    const text = btn.dataset.copy || btn.closest('.code-frame')?.querySelector('code')?.textContent || '';
    if (!text) return;

    const displayText = btn.closest('.code-frame')?.querySelector('code')?.textContent || text;

    try {
      await copyToClipboard(text);
      showToast(`「${displayText}」をコピーしました！`);
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
