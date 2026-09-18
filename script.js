// ===== StyleHer 表示とインタラクション =====
const D = STYLEHER_DATA;
const $ = (sel, root = document) => root.querySelector(sel);

// ---------- ユーティリティ ----------
// Unsplash の画像ID → URL。パス（"/" や "." を含む）の場合はそのまま使う
function img(id, w, h) {
  if (/[/.]/.test(id)) return id;
  const size = h ? `w=${w}&h=${h}&fit=crop` : `w=${w}`;
  return `https://images.unsplash.com/photo-${id}?${size}&auto=format&q=70`;
}

const money = (n) => "¥" + n.toLocaleString("ja-JP");

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// 検索用に正規化（全角/半角をそろえ、カタカナをひらがなに変換）
const plain = (s) =>
  String(s)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

const icon = (name) => `<svg><use href="#i-${name}"/></svg>`;

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
const PRODUCTS = byId(D.products);
const TRENDS = byId(D.trends);
const OUTFITS = byId(D.outfits);
const POSTS = byId(D.posts);
const SCENES = byId(D.scenes);
const CATS = byId(D.categories);

// コーデに使うアイテム（写真の主役アイテム main + サムネイルの items）
const outfitItems = (o) => (o.main ? [o.main, ...o.items] : o.items);
const outfitPrice = (o) => outfitItems(o).reduce((sum, id) => sum + PRODUCTS[id].price, 0);

// そのアイテムを使ったコーデ（F-11 着回し提案）
const outfitsWith = (pid) => D.outfits.filter((o) => outfitItems(o).includes(pid));
const wearCount = (pid) => outfitsWith(pid).length;

const nameOf = (list, id) => list.find((x) => x.id === id).name;

// ブラウザ保存（使えない環境でもエラーにしない）
function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch (e) {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* 何もしない */
  }
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
}

// ---------- 今日の日付と「今日のトレンド」 ----------
const today = new Date();
const dayNumber = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000);
const todayText = today.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
// 日替わりで先頭に表示するトレンドを変える
const todayTrendIndex = dayNumber % D.trends.length;
const trendsToday = [...D.trends.slice(todayTrendIndex), ...D.trends.slice(0, todayTrendIndex)];

// ---------- お気に入り（ブラウザに保存） ----------
const FAV_KEY = "styleher:favorites";
let favs = { trend: [], outfit: [], product: [] };
try {
  const saved = JSON.parse(localStorage.getItem(FAV_KEY));
  if (saved) favs = { ...favs, ...saved };
} catch (e) {
  /* localStorage が使えない環境でも、表示中は利用できる */
}

const isFav = (type, id) => favs[type].includes(id);

function saveFavs() {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  } catch (e) {
    /* 何もしない */
  }
}

function heartBtn(type, id, extra = "") {
  const on = isFav(type, id);
  return `<button class="heart ${extra} ${on ? "on" : ""}" data-fav="${type}:${id}" aria-pressed="${on}" aria-label="${on ? "お気に入りから外す" : "お気に入りに追加"}">${icon(on ? "heart-fill" : "heart")}</button>`;
}

function toggleFav(type, id) {
  const list = favs[type];
  const on = !list.includes(id);
  if (on) list.push(id);
  else list.splice(list.indexOf(id), 1);
  saveFavs();

  document.querySelectorAll(`[data-fav="${type}:${id}"]`).forEach((btn) => {
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", on);
    btn.setAttribute("aria-label", on ? "お気に入りから外す" : "お気に入りに追加");
    const use = btn.querySelector("use");
    if (use) use.setAttribute("href", on ? "#i-heart-fill" : "#i-heart");
    if (btn.classList.contains("btn")) btn.lastChild.textContent = on ? " 保存済み" : " お気に入りに保存";
  });
  updateFavCount();
  toast(on ? "お気に入りに追加しました" : "お気に入りから外しました");
  if (modalKind === "favorites") renderFavorites();
}

function updateFavCount() {
  const n = favs.trend.length + favs.outfit.length + favs.product.length;
  const badge = $("#favCount");
  badge.textContent = n;
  badge.hidden = n === 0;
}

// ---------- Hero ----------
let heroIndex = 0;
let heroTimer;

function renderHero() {
  $("#heroSlides").innerHTML = D.heroSlides
    .map(
      (s, i) =>
        `<img src="${img(s.img, 1800)}" alt="" style="object-position:${s.pos || "center 30%"}" ${i === 0 ? 'class="active"' : 'loading="lazy"'}>`
    )
    .join("");
  $("#heroDots").innerHTML = D.heroSlides
    .map((_, i) => `<button aria-label="画像 ${i + 1}" ${i === 0 ? 'class="active"' : ""}></button>`)
    .join("");
  $("#heroDate").textContent = `${todayText} 更新`;
  showHero(0);

  $("#heroPrev").addEventListener("click", () => showHero(heroIndex - 1, true));
  $("#heroNext").addEventListener("click", () => showHero(heroIndex + 1, true));
  $("#heroDots").addEventListener("click", (e) => {
    const i = [...e.currentTarget.children].indexOf(e.target);
    if (i >= 0) showHero(i, true);
  });
}

function showHero(i, manual = false) {
  const n = D.heroSlides.length;
  heroIndex = (i + n) % n;
  const s = D.heroSlides[heroIndex];
  document.querySelectorAll("#heroSlides img").forEach((el, k) => el.classList.toggle("active", k === heroIndex));
  document.querySelectorAll("#heroDots button").forEach((el, k) => el.classList.toggle("active", k === heroIndex));
  $("#heroTitle").innerHTML = s.title;
  $("#heroText").textContent = s.text;
  clearInterval(heroTimer);
  heroTimer = setInterval(() => showHero(heroIndex + 1), manual ? 9000 : 6000);
}

// ---------- トレンド ----------
let trendAge = "all";

function renderTrendFilter() {
  const opts = [{ id: "all", name: "すべての年代" }, ...D.ages];
  $("#trendAgeFilter").innerHTML = opts
    .map((a) => `<button class="chip" data-age="${a.id}" aria-pressed="${a.id === trendAge}">${a.name}</button>`)
    .join("");
}

function trendCard(t) {
  const isToday = t.id === D.trends[todayTrendIndex].id;
  return `
    <article class="trend-card" data-open="trend:${t.id}" tabindex="0" role="button" aria-label="${esc(t.name)}のトレンドを見る">
      <div class="card-img">
        <img src="${img(t.img, 400, 530)}" alt="${esc(t.name)}" loading="lazy">
        ${isToday ? '<span class="today-badge">今日の注目</span>' : ""}
        <span class="hot-meter">${icon("trend")} ${t.hot}%</span>
        ${heartBtn("trend", t.id, "heart-float")}
      </div>
      <div class="trend-body">
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.sub)}</p>
        <small>${t.posts}件のコーデ · ${esc(t.season)}</small>
      </div>
    </article>`;
}

function renderTrends() {
  $("#trendUpdated").textContent = `毎日更新 · ${todayText}`;
  const list = trendsToday.filter((t) => trendAge === "all" || t.ages.includes(trendAge));
  $("#trendGrid").innerHTML = list.length ? list.map(trendCard).join("") : '<p class="empty">条件に合うトレンドがありません。</p>';
}

// ---------- シーン別コーデ ----------
const outfitState = { scene: D.scenes[0].id, age: "all", taste: "all" };

function renderOutfitControls() {
  $("#sceneTabs").innerHTML = D.scenes
    .map(
      (s) =>
        `<button class="scene-tab" role="tab" data-scene="${s.id}" aria-selected="${s.id === outfitState.scene}">${icon(s.icon)}${s.name}</button>`
    )
    .join("");
  const ageOpts = [{ id: "all", name: "すべての年代" }, ...D.ages];
  $("#ageChips").innerHTML = ageOpts
    .map((a) => `<button class="chip" data-age="${a.id}" aria-pressed="${a.id === outfitState.age}">${a.name}</button>`)
    .join("");
  $("#tasteSelect").innerHTML =
    '<option value="all">すべて</option>' + D.tastes.map((t) => `<option value="${t.id}">${t.name}</option>`).join("");
  $("#tasteSelect").value = outfitState.taste;
}

function outfitCard(o) {
  return `
    <article class="outfit-card" data-open="outfit:${o.id}" tabindex="0" role="button" aria-label="コーデ「${esc(o.title)}」を見る">
      <div class="outfit-media">
        <div class="outfit-main"><img src="${img(o.img, 420, 590)}" alt="${esc(o.title)}" loading="lazy"></div>
        <div class="outfit-items">
          ${o.items.map((id) => `<img src="${img(PRODUCTS[id].img, 160, 160)}" alt="${esc(PRODUCTS[id].name)}" loading="lazy">`).join("")}
        </div>
      </div>
      <div class="outfit-body">
        <div>
          <h3>${esc(o.title)}</h3>
          <p>アイテム合計 ${money(outfitPrice(o))}〜</p>
        </div>
        ${heartBtn("outfit", o.id)}
      </div>
    </article>`;
}

function renderOutfits() {
  const { scene, age, taste } = outfitState;
  const list = D.outfits.filter(
    (o) =>
      (scene === "all" || o.scene === scene) &&
      (age === "all" || o.ages.includes(age)) &&
      (taste === "all" || o.tastes.includes(taste))
  );
  $("#outfitGrid").innerHTML = list.length
    ? list.map(outfitCard).join("")
    : '<p class="empty">条件に合うコーデがありません。年代やテイストを変えてみてください。</p>';
}

// ---------- アイテム ----------
const productState = { cat: "all", color: "all", price: "all", sort: "recommend" };
const PRODUCT_PAGE = 10;
let productLimit = PRODUCT_PAGE;

function renderProductControls() {
  $("#catChips").innerHTML = D.categories
    .map((c) => `<button class="chip" data-cat="${c.id}" aria-pressed="${c.id === productState.cat}">${c.name}</button>`)
    .join("");
  const colors = [...new Set(D.products.map((p) => p.color))];
  $("#colorSelect").innerHTML =
    '<option value="all">すべて</option>' + colors.map((c) => `<option value="${c}">${c}</option>`).join("");
  $("#colorSelect").value = productState.color;
  $("#priceSelect").value = productState.price;
  $("#sortSelect").value = productState.sort;
}

function productCard(p) {
  const wear = wearCount(p.id);
  return `
    <article class="product-card">
      <button class="card-img" data-open="product:${p.id}" aria-label="${esc(p.name)}の詳細を見る">
        <img src="${img(p.img, 400, 440)}" alt="${esc(p.name)}" loading="lazy">
        ${wear ? `<span class="wear-badge">着回し ${wear}コーデ</span>` : ""}
      </button>
      <div class="product-body">
        <h3><button class="text-btn" data-open="product:${p.id}">${esc(p.name)}</button></h3>
        <p class="product-shop">${CATS[p.cat].name} · ${esc(p.color)} · ${p.shop}</p>
        <div class="product-foot">
          <span class="price">${money(p.price)}</span>
          ${heartBtn("product", p.id)}
        </div>
        <a class="buy-btn" href="${p.url}" target="_blank" rel="noopener">購入する ${icon("external")}</a>
      </div>
    </article>`;
}

function renderProducts() {
  const { cat, color, price } = productState;
  const [min, max] = price === "all" ? [0, Infinity] : price.split("-").map(Number);
  const list = D.products.filter(
    (p) => (cat === "all" || p.cat === cat) && (color === "all" || p.color === color) && p.price >= min && p.price <= max
  );
  // 並び替え（F-08）
  const sorters = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    wear: (a, b) => wearCount(b.id) - wearCount(a.id),
  };
  if (sorters[productState.sort]) list.sort(sorters[productState.sort]);
  $("#productGrid").innerHTML = list.length
    ? list.slice(0, productLimit).map(productCard).join("")
    : '<p class="empty">条件に合うアイテムがありません。</p>';
  const more = $("#productMore");
  more.hidden = list.length <= productLimit;
  more.textContent = `もっと見る（残り${list.length - productLimit}件）`;
}

// ---------- ショップ・コラム・コミュニティ ----------
function renderShops() {
  $("#shopList").innerHTML = D.shops
    .map(
      (s) => `
      <li><a href="${s.url}" target="_blank" rel="noopener" aria-label="${esc(s.name)}（公式サイトを開く）">
        <span class="shop-logo">${esc(s.name)}</span>
        <span class="shop-type">${esc(s.type)}</span>
      </a></li>`
    )
    .join("");
}

const dateJa = (iso) => new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

function renderPosts() {
  $("#postGrid").innerHTML = D.posts
    .map(
      (p) => `
      <article class="post-card" data-open="post:${p.id}" tabindex="0" role="button" aria-label="コラム「${esc(p.title)}」を読む">
        <div class="card-img"><img src="${img(p.img, 520, 360)}" alt="" loading="lazy"></div>
        <div class="post-body">
          <h3>${esc(p.title)}</h3>
          <div class="post-meta"><span>${dateJa(p.date)}</span><span class="tag">${esc(p.tag)}</span></div>
        </div>
      </article>`
    )
    .join("");
}

function renderCommunity() {
  $("#communityGallery").innerHTML = D.community
    .map((id) => `<img src="${img(id, 240, 280)}" alt="StyleHerコミュニティのコーデ" loading="lazy">`)
    .join("");
}

// ---------- Modal ----------
let modalKind = null;
let lastFocus = null;

function openModal(html, kind) {
  lastFocus = document.activeElement;
  modalKind = kind;
  $("#modalBody").innerHTML = html;
  $("#modal").hidden = false;
  $(".modal-panel").scrollTop = 0;
  document.body.classList.add("no-scroll");
  const input = $("#modalBody input");
  (input || $(".modal-close")).focus();
}

function closeModal() {
  $("#modal").hidden = true;
  modalKind = null;
  document.body.classList.remove("no-scroll");
  if (lastFocus) lastFocus.focus();
}

const miniProduct = (p) => `
  <div class="mini-product">
    <button class="mini-img" data-open="product:${p.id}" aria-label="${esc(p.name)}の詳細を見る"><img src="${img(p.img, 120, 140)}" alt="" loading="lazy"></button>
    <div>
      <b><button class="text-btn" data-open="product:${p.id}">${esc(p.name)}</button></b>
      <span>${money(p.price)}</span><br>
      <a href="${p.url}" target="_blank" rel="noopener">${p.shop}で見る ${icon("external")}</a>
    </div>
  </div>`;

function favButtonLarge(type, id) {
  const on = isFav(type, id);
  return `<button class="btn btn-outline ${on ? "on" : ""}" data-fav="${type}:${id}" aria-pressed="${on}">${icon(on ? "heart-fill" : "heart")}<span> ${on ? "保存済み" : "お気に入りに保存"}</span></button>`;
}

function openTrend(id) {
  const t = TRENDS[id];
  const ageNames = t.ages.map((a) => nameOf(D.ages, a)).join("・");
  const related = D.outfits.filter((o) => o.tastes.some((x) => t.tastes.includes(x))).slice(0, 3);
  openModal(
    `
    <div class="detail">
      <div class="detail-gallery">
        ${[t.img, ...t.gallery].slice(0, 4).map((g, i) => `<img src="${img(g, i ? 300 : 700, i ? 400 : 630)}" alt="${esc(t.name)}">`).join("")}
      </div>
      <div>
        <p class="detail-kicker">TREND ${t.id === D.trends[todayTrendIndex].id ? "· 今日の注目" : ""}</p>
        <h2 id="modalTitle">${esc(t.name)}</h2>
        <p class="section-sub">${esc(t.sub)}</p>
        <p class="detail-lead">${esc(t.desc)}</p>
        <div class="stats">
          <div class="stat"><small>注目度</small><b>${t.hot}%</b><div class="meter"><span style="width:${t.hot}%"></span></div></div>
          <div class="stat"><small>シーズン</small><b>${esc(t.season)}</b></div>
          <div class="stat"><small>おすすめ年代</small><b>${ageNames}</b></div>
        </div>
        <h4>ポイント</h4>
        <ul>${t.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <h4>着こなしと着回しのコツ</h4>
        <ul>${t.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <div class="modal-actions">${favButtonLarge("trend", t.id)}</div>
      </div>
    </div>
    <div class="result-group"><h3>このトレンドのアイテム</h3></div>
    <div class="mini-products">${t.products.map((p) => miniProduct(PRODUCTS[p])).join("")}</div>
    ${
      related.length
        ? `<div class="result-group"><h3>おすすめコーデ</h3><div class="result-list">${related.map(outfitResult).join("")}</div></div>`
        : ""
    }`,
    "trend"
  );
}

function openOutfit(id) {
  const o = OUTFITS[id];
  const tasteNames = o.tastes.map((x) => nameOf(D.tastes, x)).join("・");
  const ageNames = o.ages.map((a) => nameOf(D.ages, a)).join("・");
  openModal(
    `
    <div class="detail">
      <div class="detail-gallery">
        <img src="${img(o.img, 700, 630)}" alt="${esc(o.title)}">
        ${o.items.map((id) => `<img src="${img(PRODUCTS[id].img, 300, 400)}" alt="${esc(PRODUCTS[id].name)}">`).join("")}
      </div>
      <div>
        <p class="detail-kicker">COORDINATE · ${SCENES[o.scene].name}</p>
        <h2 id="modalTitle">${esc(o.title)}</h2>
        <p class="detail-lead">${esc(o.desc)}</p>
        <div class="stats">
          <div class="stat"><small>アイテム合計</small><b>${money(outfitPrice(o))}</b></div>
          <div class="stat"><small>テイスト</small><b>${tasteNames}</b></div>
          <div class="stat"><small>おすすめ年代</small><b>${ageNames}</b></div>
        </div>
        <h4>着こなしのコツ</h4>
        <ul>${o.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <h4>コーデのアイテム</h4>
        <div class="mini-products" style="margin-top:0">${outfitItems(o).map((p) => miniProduct(PRODUCTS[p])).join("")}</div>
        <div class="modal-actions">${favButtonLarge("outfit", o.id)}</div>
      </div>
    </div>`,
    "outfit"
  );
}

// アイテム詳細（F-09）・ショップ比較（F-10）・着回し提案（F-11）
function openProduct(id) {
  const p = PRODUCTS[id];
  const outfits = outfitsWith(p.id);
  const trends = D.trends.filter((t) => t.products.includes(p.id));
  openModal(
    `
    <div class="detail">
      <div class="detail-gallery single">
        <img src="${img(p.img, 700, 800)}" alt="${esc(p.name)}">
      </div>
      <div>
        <p class="detail-kicker">ITEM · ${CATS[p.cat].name}</p>
        <h2 id="modalTitle">${esc(p.name)}</h2>
        <p class="detail-price">${money(p.price)}<small>（参考価格）</small></p>
        <div class="stats">
          <div class="stat"><small>カラー</small><b>${esc(p.color)}</b></div>
          <div class="stat"><small>カテゴリー</small><b>${CATS[p.cat].name}</b></div>
          <div class="stat"><small>着回し</small><b>${outfits.length}コーデ</b></div>
        </div>
        <h4>ショップを比べて購入する</h4>
        <div class="shop-links">
          ${p.links
            .map(
              (l, i) =>
                `<a class="btn ${i === 0 ? "btn-dark" : "btn-outline"}" href="${l.url}" target="_blank" rel="noopener">${esc(l.shop)}で探す ${icon("external")}</a>`
            )
            .join("")}
        </div>
        <p class="note">各ショップの検索結果ページが開きます。価格や在庫はショップでご確認ください。</p>
        ${trends.length ? `<h4>このアイテムが入っているトレンド</h4><div class="tag-list">${trends.map((t) => `<button class="tag" data-open="trend:${t.id}">${esc(t.name)}</button>`).join("")}</div>` : ""}
        <div class="modal-actions">${favButtonLarge("product", p.id)}</div>
      </div>
    </div>
    <div class="result-group">
      <h3>このアイテムを使ったコーデ（${outfits.length}）</h3>
      ${
        outfits.length
          ? `<p class="list-sub">1着で${outfits.length}通りの着こなしができます。</p><div class="result-list">${outfits.map(outfitResult).join("")}</div>`
          : '<p class="list-sub">このアイテムを使ったコーデは準備中です。</p>'
      }
    </div>`,
    "product"
  );
}

function openPost(id) {
  const p = POSTS[id];
  openModal(
    `
    <article class="article">
      <p class="detail-kicker">${esc(p.tag)} · ${dateJa(p.date)}</p>
      <h2 id="modalTitle">${esc(p.title)}</h2>
      <img src="${img(p.img, 1100, 620)}" alt="">
      <p><b>${esc(p.excerpt)}</b></p>
      ${p.body.map((x) => `<p>${esc(x)}</p>`).join("")}
    </article>`,
    "post"
  );
}

// ---------- 検索 ----------
const trendResult = (t) =>
  `<button class="result-item" data-open="trend:${t.id}"><img src="${img(t.img, 110, 130)}" alt=""><span>${esc(t.name)}<small>トレンド · ${esc(t.sub)}</small></span></button>`;
const outfitResult = (o) =>
  `<button class="result-item" data-open="outfit:${o.id}"><img src="${img(o.img, 110, 130)}" alt=""><span>${esc(o.title)}<small>${SCENES[o.scene].name} · ${money(outfitPrice(o))}〜</small></span></button>`;
const productResult = (p) =>
  `<button class="result-item" data-open="product:${p.id}"><img src="${img(p.img, 110, 130)}" alt=""><span>${esc(p.name)}<small>アイテム · ${money(p.price)}</small></span></button>`;
const postResult = (p) =>
  `<button class="result-item" data-open="post:${p.id}"><img src="${img(p.img, 110, 130)}" alt=""><span>${esc(p.title)}<small>コラム · ${esc(p.tag)}</small></span></button>`;
const shopResult = (s) =>
  `<a class="result-item" href="${s.url}" target="_blank" rel="noopener"><span class="shop-logo" style="width:52px;height:52px;font-size:11px">${esc(s.name)}</span><span>${esc(s.name)}<small>ショップ · ${esc(s.type)}</small></span></a>`;

function search(query) {
  const words = plain(query).split(/\s+/).filter(Boolean);
  const match = (...fields) => {
    const text = plain(fields.flat().join(" "));
    return words.every((w) => text.includes(w));
  };
  if (!words.length) return null;
  return {
    トレンド: D.trends.filter((t) => match(t.name, t.sub, t.desc, t.points, t.season)).map(trendResult),
    コーデ: D.outfits
      .filter((o) => match(o.title, o.desc, SCENES[o.scene].name, o.tastes.map((x) => nameOf(D.tastes, x))))
      .map(outfitResult),
    アイテム: D.products.filter((p) => match(p.name, p.color, CATS[p.cat].name, p.shop)).map(productResult),
    コラム: D.posts.filter((p) => match(p.title, p.excerpt, p.tag, p.body)).map(postResult),
    ショップ: D.shops.filter((s) => match(s.name, s.type)).map(shopResult),
  };
}

function renderSearchResults(query) {
  const res = search(query);
  const box = $("#searchResults");
  if (!res) {
    box.innerHTML = `<p class="list-sub">人気のキーワード: ${["きれいめ", "通勤", "ワンピース", "ブラウン", "ニット", "お呼ばれ"]
      .map((w) => `<button class="chip" data-suggest="${w}">${w}</button>`)
      .join(" ")}</p>`;
    return;
  }
  const groups = Object.entries(res).filter(([, items]) => items.length);
  const total = groups.reduce((n, [, items]) => n + items.length, 0);
  box.innerHTML = total
    ? `<p class="list-sub">「${esc(query)}」の検索結果：${total}件</p>` +
      groups.map(([name, items]) => `<div class="result-group"><h3>${name} (${items.length})</h3><div class="result-list">${items.join("")}</div></div>`).join("")
    : `<p class="empty">「${esc(query)}」に一致する結果がありません。別のキーワードでお試しください。</p>`;
}

function openSearch(query = "") {
  openModal(
    `
    <h2 class="list-title" id="modalTitle">検索</h2>
    <div class="modal-search">
      ${icon("search")}
      <input type="search" id="modalSearchInput" placeholder="トレンド・コーデ・アイテム・ショップを検索" value="${esc(query)}" aria-label="検索キーワード" autocomplete="off">
    </div>
    <div id="searchResults"></div>`,
    "search"
  );
  renderSearchResults(query);
  const input = $("#modalSearchInput");
  input.setSelectionRange(query.length, query.length);
  input.addEventListener("input", () => renderSearchResults(input.value));
}

// ---------- お気に入り一覧 ----------
function renderFavorites() {
  const groups = [
    ["トレンド", favs.trend.filter((id) => TRENDS[id]).map((id) => TRENDS[id]), trendResult, "trend"],
    ["コーデ", favs.outfit.filter((id) => OUTFITS[id]).map((id) => OUTFITS[id]), outfitResult, "outfit"],
    ["アイテム", favs.product.filter((id) => PRODUCTS[id]).map((id) => PRODUCTS[id]), productResult, "product"],
  ];
  const total = groups.reduce((n, g) => n + g[1].length, 0);
  $("#modalBody").innerHTML = `
    <h2 class="list-title" id="modalTitle">お気に入り</h2>
    <p class="list-sub">${total ? `${total}件を保存しています（このブラウザに保存されます）。` : "トレンド・コーデ・アイテムのハートを押すと、ここに保存されます。"}</p>
    ${groups
      .filter((g) => g[1].length)
      .map(
        ([name, items, render, type]) => `
        <div class="result-group"><h3>${name} (${items.length})</h3>
          <div class="result-list">${items
            .map((x) => `<div style="display:flex;align-items:center;gap:4px">${render(x)}${heartBtn(type, x.id)}</div>`)
            .join("")}</div>
        </div>`
      )
      .join("")}`;
}

function openFavorites() {
  openModal("", "favorites");
  renderFavorites();
  $(".modal-close").focus();
}

// ---------- イベント ----------
function openFromData(value) {
  const [type, id] = value.split(":");
  if (type === "trend") openTrend(id);
  if (type === "outfit") openOutfit(id);
  if (type === "product") openProduct(id);
  if (type === "post") openPost(id);
  if (type !== "post") addRecent(type, id);
}

// ---------- 最近見たもの（F-19） ----------
const RECENT_KEY = "styleher:recent";
const RECENT_MAX = 8;
let recent = load(RECENT_KEY, []);

function addRecent(type, id) {
  const key = `${type}:${id}`;
  recent = [key, ...recent.filter((k) => k !== key)].slice(0, RECENT_MAX);
  save(RECENT_KEY, recent);
  renderRecent();
}

function renderRecent() {
  const items = recent
    .map((key) => {
      const [type, id] = key.split(":");
      if (type === "trend" && TRENDS[id]) return trendResult(TRENDS[id]);
      if (type === "outfit" && OUTFITS[id]) return outfitResult(OUTFITS[id]);
      if (type === "product" && PRODUCTS[id]) return productResult(PRODUCTS[id]);
      return "";
    })
    .filter(Boolean);
  $("#recent").hidden = items.length === 0;
  $("#recentList").innerHTML = items.join("");
}

// ---------- かんたんスタイル診断（F-16） ----------
const PROFILE_KEY = "styleher:profile";
const TASTE_TYPES = {
  kireime: "上品でちゃんと見える服が好きなあなた。ベーシックカラーと、きれいなシルエットを意識すると、さらに素敵に。",
  casual: "動きやすさと自分らしさを大切にするあなた。定番アイテムに、旬の色をひとつ足すのがおすすめ。",
  feminine: "やわらかく女性らしい雰囲気が似合うあなた。甘いアイテムは一点だけにすると、大人っぽくまとまります。",
  natural: "心地よさを大切にするあなた。リネンやニットなど、素材感のあるアイテムがよく似合います。",
  simple: "無駄のないすっきりした服が好きなあなた。モノトーンに素材感で奥行きを出すと、洗練された印象に。",
};
const answer = { age: null, tastes: [], scene: null };

function renderShindanQuestions() {
  const chip = (q, item, on) => `<button type="button" class="chip" data-q="${q}" data-v="${item.id}" aria-pressed="${on}">${item.name}</button>`;
  $("#qAge").innerHTML = D.ages.map((a) => chip("age", a, answer.age === a.id)).join("");
  $("#qTaste").innerHTML = D.tastes.map((t) => chip("taste", t, answer.tastes.includes(t.id))).join("");
  $("#qScene").innerHTML = D.scenes.map((sc) => chip("scene", sc, answer.scene === sc.id)).join("");
}

// 年代・テイスト・シーンの一致度で並べる（1つ目に選んだテイストを重視）
function recommend(profile) {
  const [main, sub] = profile.tastes;
  const tasteScore = (list, w) => (list.includes(main) ? w : 0) + (sub && list.includes(sub) ? w / 2 : 0);
  const trends = [...D.trends]
    .map((t) => ({ t, score: (t.ages.includes(profile.age) ? 2 : 0) + tasteScore(t.tastes, 4) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((x) => x.t);
  const outfits = [...D.outfits]
    .map((o) => ({ o, score: (o.scene === profile.scene ? 4 : 0) + (o.ages.includes(profile.age) ? 2 : 0) + tasteScore(o.tastes, 2) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.o);
  return { trends, outfits };
}

function showShindanResult(profile) {
  const { trends, outfits } = recommend(profile);
  const tasteNames = profile.tastes.map((t) => nameOf(D.tastes, t));
  $("#shindanForm").hidden = true;
  const box = $("#shindanResult");
  box.hidden = false;
  box.innerHTML = `
    <p class="detail-kicker">RESULT · ${nameOf(D.ages, profile.age)} · ${SCENES[profile.scene].name}</p>
    <h3 class="result-type">あなたは「${tasteNames.join("×")}」タイプ</h3>
    <p class="result-text">${TASTE_TYPES[profile.tastes[0]]}</p>
    <div class="result-group"><h3>あなたにおすすめのトレンド</h3><div class="result-list">${trends.map(trendResult).join("")}</div></div>
    <div class="result-group"><h3>あなたにおすすめのコーデ</h3><div class="result-list">${outfits.map(outfitResult).join("")}</div></div>
    <div class="modal-actions">
      <button class="btn btn-dark" id="shindanApply">この条件でコーデを見る ${icon("arrow")}</button>
      <button class="btn btn-outline" id="shindanRetry">もう一度診断する</button>
    </div>`;
}

function resetShindan() {
  Object.assign(answer, { age: null, tastes: [], scene: null });
  save(PROFILE_KEY, null);
  $("#shindanResult").hidden = true;
  $("#shindanForm").hidden = false;
  renderShindanQuestions();
}

document.addEventListener("click", (e) => {
  const fav = e.target.closest("[data-fav]");
  if (fav) {
    e.preventDefault();
    e.stopPropagation();
    const [type, id] = fav.dataset.fav.split(":");
    toggleFav(type, id);
    return;
  }
  if (e.target.closest("[data-close]")) return closeModal();

  const suggest = e.target.closest("[data-suggest]");
  if (suggest) {
    const input = $("#modalSearchInput");
    input.value = suggest.dataset.suggest;
    renderSearchResults(input.value);
    return;
  }

  const open = e.target.closest("[data-open]");
  if (open) return openFromData(open.dataset.open);

  if (e.target.closest("[data-open-favs]")) {
    e.preventDefault();
    openFavorites();
  }
});

// キーボード（Enter / Space）でカードを開く
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#modal").hidden) return closeModal();
  const card = e.target.closest?.("[data-open][role='button']");
  if (card && (e.key === "Enter" || e.key === " ") && e.target === card) {
    e.preventDefault();
    openFromData(card.dataset.open);
  }
});

$("#trendAgeFilter").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-age]");
  if (!chip) return;
  trendAge = chip.dataset.age;
  renderTrendFilter();
  renderTrends();
});

$("#sceneTabs").addEventListener("click", (e) => {
  const tab = e.target.closest("[data-scene]");
  if (!tab) return;
  outfitState.scene = tab.dataset.scene;
  renderOutfitControls();
  renderOutfits();
});

$("#ageChips").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-age]");
  if (!chip) return;
  outfitState.age = chip.dataset.age;
  renderOutfitControls();
  renderOutfits();
});

$("#tasteSelect").addEventListener("change", (e) => {
  outfitState.taste = e.target.value;
  renderOutfits();
});

$("#outfitReset").addEventListener("click", () => {
  Object.assign(outfitState, { scene: "all", age: "all", taste: "all" });
  renderOutfitControls();
  renderOutfits();
});

$("#catChips").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-cat]");
  if (!chip) return;
  productState.cat = chip.dataset.cat;
  productLimit = PRODUCT_PAGE;
  renderProductControls();
  renderProducts();
});

$("#colorSelect").addEventListener("change", (e) => {
  productState.color = e.target.value;
  productLimit = PRODUCT_PAGE;
  renderProducts();
});

$("#sortSelect").addEventListener("change", (e) => {
  productState.sort = e.target.value;
  productLimit = PRODUCT_PAGE;
  renderProducts();
});

$("#priceSelect").addEventListener("change", (e) => {
  productState.price = e.target.value;
  productLimit = PRODUCT_PAGE;
  renderProducts();
});

$("#productReset").addEventListener("click", () => {
  Object.assign(productState, { cat: "all", color: "all", price: "all", sort: "recommend" });
  productLimit = PRODUCT_PAGE;
  renderProductControls();
  renderProducts();
});

$("#productMore").addEventListener("click", () => {
  productLimit += PRODUCT_PAGE;
  renderProducts();
});

// 最近見たもの
$("#recentClear").addEventListener("click", () => {
  recent = [];
  save(RECENT_KEY, recent);
  renderRecent();
});

// スタイル診断
$("#shindanForm").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-q]");
  if (!chip) return;
  const { q, v } = chip.dataset;
  if (q === "age") answer.age = v;
  if (q === "scene") answer.scene = v;
  if (q === "taste") {
    if (answer.tastes.includes(v)) answer.tastes = answer.tastes.filter((x) => x !== v);
    else if (answer.tastes.length < 2) answer.tastes = [...answer.tastes, v];
    else toast("テイストは2つまで選べます");
  }
  renderShindanQuestions();
});

$("#shindanForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!answer.age || !answer.tastes.length || !answer.scene) {
    toast("3つの質問すべてに答えてください");
    return;
  }
  const profile = { age: answer.age, tastes: [...answer.tastes], scene: answer.scene };
  save(PROFILE_KEY, profile);
  showShindanResult(profile);
});

$("#shindanResult").addEventListener("click", (e) => {
  if (e.target.closest("#shindanRetry")) return resetShindan();
  if (e.target.closest("#shindanApply")) {
    const profile = load(PROFILE_KEY, null);
    if (!profile) return;
    // 結果が0件にならないテイストを選ぶ（なければテイストは「すべて」）
    const fits = (taste) =>
      D.outfits.some((o) => o.scene === profile.scene && o.ages.includes(profile.age) && o.tastes.includes(taste));
    const taste = profile.tastes.find(fits) || "all";
    Object.assign(outfitState, { scene: profile.scene, age: profile.age, taste });
    renderOutfitControls();
    renderOutfits();
    document.getElementById("outfits").scrollIntoView({ behavior: "smooth" });
  }
});

// ヘッダーの検索
$("#searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  openSearch($("#searchInput").value.trim());
  $("#searchInput").value = "";
});
$("#searchToggle").addEventListener("click", () => openSearch(""));
$("#favBtn").addEventListener("click", openFavorites);

// スマホ用メニュー
const nav = $("#mainNav");
const menuBtn = $("#menuBtn");
function setMenu(open) {
  nav.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  menuBtn.querySelector("use").setAttribute("href", open ? "#i-close" : "#i-menu");
}
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
nav.addEventListener("click", (e) => {
  if (e.target.closest("a")) setMenu(false);
});

// 表示中のセクションに合わせてメニューを強調
const navLinks = [...nav.querySelectorAll("a")];
const sectionIds = ["trends", "shindan", "outfits", "products", "blog", "community"];
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
sectionIds.forEach((id) => observer.observe(document.getElementById(id)));
window.addEventListener(
  "scroll",
  () => {
    if (window.scrollY < 300) navLinks.forEach((a, i) => a.classList.toggle("active", i === 0));
  },
  { passive: true }
);

// コミュニティ：今後の拡張機能（今回のMVPの対象外）
$("#joinBtn").addEventListener("click", () =>
  toast("コミュニティ機能は近日公開予定です。ページ下部のメール登録でお知らせします！")
);

// メール登録（デモ：形式チェックのみで、送信はしない）
$("#newsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("#newsEmail").value.trim();
  const msg = $("#newsMsg");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.textContent = "メールアドレスの形式が正しくありません。";
    msg.className = "news-msg err";
    return;
  }
  msg.textContent = "ご登録ありがとうございます！（デモ版のため実際には送信されません）";
  msg.className = "news-msg ok";
  $("#newsEmail").value = "";
});

// ---------- 初期化 ----------
renderHero();
renderTrendFilter();
renderTrends();
renderOutfitControls();
renderOutfits();
renderProductControls();
renderProducts();
renderShops();
renderPosts();
renderCommunity();
renderShindanQuestions();
const savedProfile = load(PROFILE_KEY, null);
if (savedProfile && D.ages.some((a) => a.id === savedProfile.age) && SCENES[savedProfile.scene]) showShindanResult(savedProfile);
renderRecent();
updateFavCount();
