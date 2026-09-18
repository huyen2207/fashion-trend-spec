// ===== StyleHer – hiển thị dữ liệu & tương tác =====
const D = STYLEHER_DATA;
const $ = (sel, root = document) => root.querySelector(sel);

// ---------- Tiện ích ----------
// id Unsplash -> URL ảnh; nếu là đường dẫn (có "/" hoặc ".") thì dùng nguyên
function img(id, w, h) {
  if (/[/.]/.test(id)) return id;
  const size = h ? `w=${w}&h=${h}&fit=crop` : `w=${w}`;
  return `https://images.unsplash.com/photo-${id}?${size}&auto=format&q=70`;
}

const money = (n) => n.toLocaleString("vi-VN") + "đ";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu
const plain = (s) =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();

const icon = (name) => `<svg><use href="#i-${name}"/></svg>`;

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
const PRODUCTS = byId(D.products);
const TRENDS = byId(D.trends);
const OUTFITS = byId(D.outfits);
const POSTS = byId(D.posts);
const SCENES = byId(D.scenes);
const CATS = byId(D.categories);

const outfitPrice = (o) => o.items.reduce((sum, id) => sum + PRODUCTS[id].price, 0);

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
}

// ---------- Ngày hôm nay & xu hướng của ngày ----------
const today = new Date();
const dayNumber = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000);
const todayText = today.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
// Mỗi ngày một xu hướng khác được đưa lên đầu
const todayTrendIndex = dayNumber % D.trends.length;
const trendsToday = [...D.trends.slice(todayTrendIndex), ...D.trends.slice(0, todayTrendIndex)];

// ---------- Yêu thích (lưu trong trình duyệt) ----------
const FAV_KEY = "styleher:favorites";
let favs = { trend: [], outfit: [], product: [] };
try {
  const saved = JSON.parse(localStorage.getItem(FAV_KEY));
  if (saved) favs = { ...favs, ...saved };
} catch (e) {
  /* trình duyệt chặn localStorage: vẫn dùng được trong phiên hiện tại */
}

const isFav = (type, id) => favs[type].includes(id);

function saveFavs() {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  } catch (e) {
    /* bỏ qua */
  }
}

function heartBtn(type, id, extra = "") {
  const on = isFav(type, id);
  return `<button class="heart ${extra} ${on ? "on" : ""}" data-fav="${type}:${id}" aria-pressed="${on}" aria-label="${on ? "Bỏ yêu thích" : "Thêm vào yêu thích"}">${icon(on ? "heart-fill" : "heart")}</button>`;
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
    btn.setAttribute("aria-label", on ? "Bỏ yêu thích" : "Thêm vào yêu thích");
    const use = btn.querySelector("use");
    if (use) use.setAttribute("href", on ? "#i-heart-fill" : "#i-heart");
    if (btn.classList.contains("btn")) btn.lastChild.textContent = on ? " Đã lưu" : " Lưu vào yêu thích";
  });
  updateFavCount();
  toast(on ? "Đã thêm vào danh sách yêu thích" : "Đã bỏ khỏi danh sách yêu thích");
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
    .map((_, i) => `<button aria-label="Ảnh ${i + 1}" ${i === 0 ? 'class="active"' : ""}></button>`)
    .join("");
  $("#heroDate").textContent = `Cập nhật ${todayText}`;
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

// ---------- Xu hướng ----------
let trendAge = "all";

function renderTrendFilter() {
  const opts = [{ id: "all", name: "Mọi độ tuổi" }, ...D.ages];
  $("#trendAgeFilter").innerHTML = opts
    .map((a) => `<button class="chip" data-age="${a.id}" aria-pressed="${a.id === trendAge}">${a.name}</button>`)
    .join("");
}

function trendCard(t) {
  const isToday = t.id === D.trends[todayTrendIndex].id;
  return `
    <article class="trend-card" data-open="trend:${t.id}" tabindex="0" role="button" aria-label="Xem xu hướng ${esc(t.name)}">
      <div class="card-img">
        <img src="${img(t.img, 400, 530)}" alt="${esc(t.name)}" loading="lazy">
        ${isToday ? '<span class="today-badge">Hot hôm nay</span>' : ""}
        <span class="hot-meter">${icon("trend")} ${t.hot}%</span>
        ${heartBtn("trend", t.id, "heart-float")}
      </div>
      <div class="trend-body">
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.sub)}</p>
        <small>${t.posts} bài viết · ${esc(t.season)}</small>
      </div>
    </article>`;
}

function renderTrends() {
  $("#trendUpdated").textContent = `Cập nhật mỗi ngày · ${todayText}`;
  const list = trendsToday.filter((t) => trendAge === "all" || t.ages.includes(trendAge));
  $("#trendGrid").innerHTML = list.length ? list.map(trendCard).join("") : '<p class="empty">Chưa có xu hướng phù hợp.</p>';
}

// ---------- Gợi ý phối đồ ----------
const outfitState = { scene: "dilam", age: "all", taste: "all" };

function renderOutfitControls() {
  $("#sceneTabs").innerHTML = D.scenes
    .map(
      (s) =>
        `<button class="scene-tab" role="tab" data-scene="${s.id}" aria-selected="${s.id === outfitState.scene}">${icon(s.icon)}${s.name}</button>`
    )
    .join("");
  const ageOpts = [{ id: "all", name: "Mọi độ tuổi" }, ...D.ages];
  $("#ageChips").innerHTML = ageOpts
    .map((a) => `<button class="chip" data-age="${a.id}" aria-pressed="${a.id === outfitState.age}">${a.name}</button>`)
    .join("");
  $("#tasteSelect").innerHTML =
    '<option value="all">Tất cả</option>' + D.tastes.map((t) => `<option value="${t.id}">${t.name}</option>`).join("");
  $("#tasteSelect").value = outfitState.taste;
}

function outfitCard(o) {
  return `
    <article class="outfit-card" data-open="outfit:${o.id}" tabindex="0" role="button" aria-label="Xem bộ phối ${esc(o.title)}">
      <div class="outfit-media">
        <div class="outfit-main"><img src="${img(o.img, 420, 590)}" alt="${esc(o.title)}" loading="lazy"></div>
        <div class="outfit-items">
          ${o.items.map((id) => `<img src="${img(PRODUCTS[id].img, 160, 160)}" alt="${esc(PRODUCTS[id].name)}" loading="lazy">`).join("")}
        </div>
      </div>
      <div class="outfit-body">
        <div>
          <h3>${esc(o.title)}</h3>
          <p>Trọn bộ từ ${money(outfitPrice(o))}</p>
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
    : '<p class="empty">Chưa có bộ phối phù hợp. Thử chọn độ tuổi hoặc phong cách khác nhé!</p>';
}

// ---------- Sản phẩm ----------
const productState = { cat: "all", color: "all", price: "all" };
const PRODUCT_PAGE = 10;
let productLimit = PRODUCT_PAGE;

function renderProductControls() {
  $("#catChips").innerHTML = D.categories
    .map((c) => `<button class="chip" data-cat="${c.id}" aria-pressed="${c.id === productState.cat}">${c.name}</button>`)
    .join("");
  const colors = [...new Set(D.products.map((p) => p.color))];
  $("#colorSelect").innerHTML =
    '<option value="all">Tất cả</option>' + colors.map((c) => `<option value="${c}">${c}</option>`).join("");
  $("#colorSelect").value = productState.color;
  $("#priceSelect").value = productState.price;
}

function productCard(p) {
  return `
    <article class="product-card">
      <a class="card-img" href="${p.url}" target="_blank" rel="noopener" aria-label="Mua ${esc(p.name)} trên ${p.shop}">
        <img src="${img(p.img, 400, 440)}" alt="${esc(p.name)}" loading="lazy">
      </a>
      <div class="product-body">
        <h3>${esc(p.name)}</h3>
        <p class="product-shop">${CATS[p.cat].name} · ${esc(p.color)} · ${p.shop}</p>
        <div class="product-foot">
          <span class="price">${money(p.price)}</span>
          ${heartBtn("product", p.id)}
        </div>
        <a class="buy-btn" href="${p.url}" target="_blank" rel="noopener">Mua ngay ${icon("external")}</a>
      </div>
    </article>`;
}

function renderProducts() {
  const { cat, color, price } = productState;
  const [min, max] = price === "all" ? [0, Infinity] : price.split("-").map(Number);
  const list = D.products.filter(
    (p) => (cat === "all" || p.cat === cat) && (color === "all" || p.color === color) && p.price >= min && p.price <= max
  );
  $("#productGrid").innerHTML = list.length
    ? list.slice(0, productLimit).map(productCard).join("")
    : '<p class="empty">Không có sản phẩm phù hợp với bộ lọc.</p>';
  const more = $("#productMore");
  more.hidden = list.length <= productLimit;
  more.textContent = `Xem thêm ${list.length - productLimit} sản phẩm`;
}

// ---------- Shop, bài viết, cộng đồng ----------
function renderShops() {
  $("#shopList").innerHTML = D.shops
    .map(
      (s) => `
      <li><a href="${s.url}" target="_blank" rel="noopener" aria-label="${esc(s.name)} (mở trang web của shop)">
        <span class="shop-logo">${esc(s.name)}</span>
        <span class="shop-type">${esc(s.type)}</span>
      </a></li>`
    )
    .join("");
}

const dateVi = (iso) => new Date(iso).toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" });

function renderPosts() {
  $("#postGrid").innerHTML = D.posts
    .map(
      (p) => `
      <article class="post-card" data-open="post:${p.id}" tabindex="0" role="button" aria-label="Đọc bài ${esc(p.title)}">
        <div class="card-img"><img src="${img(p.img, 520, 360)}" alt="" loading="lazy"></div>
        <div class="post-body">
          <h3>${esc(p.title)}</h3>
          <div class="post-meta"><span>${dateVi(p.date)}</span><span class="tag">${esc(p.tag)}</span></div>
        </div>
      </article>`
    )
    .join("");
}

function renderCommunity() {
  $("#communityGallery").innerHTML = D.community
    .map((id) => `<img src="${img(id, 240, 280)}" alt="Outfit từ cộng đồng StyleHer" loading="lazy">`)
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
    <img src="${img(p.img, 120, 140)}" alt="" loading="lazy">
    <div>
      <b>${esc(p.name)}</b>
      <span>${money(p.price)}</span><br>
      <a href="${p.url}" target="_blank" rel="noopener">Mua trên ${p.shop} ${icon("external")}</a>
    </div>
  </div>`;

function favButtonLarge(type, id) {
  const on = isFav(type, id);
  return `<button class="btn btn-outline ${on ? "on" : ""}" data-fav="${type}:${id}" aria-pressed="${on}">${icon(on ? "heart-fill" : "heart")}<span> ${on ? "Đã lưu" : "Lưu vào yêu thích"}</span></button>`;
}

function openTrend(id) {
  const t = TRENDS[id];
  const ageNames = t.ages.map((a) => D.ages.find((x) => x.id === a).name).join(", ");
  const related = D.outfits.filter((o) => o.tastes.some((x) => t.tastes.includes(x))).slice(0, 3);
  openModal(
    `
    <div class="detail">
      <div class="detail-gallery">
        ${[t.img, ...t.gallery].slice(0, 4).map((g, i) => `<img src="${img(g, i ? 300 : 700, i ? 400 : 630)}" alt="${esc(t.name)}">`).join("")}
      </div>
      <div>
        <p class="detail-kicker">Xu hướng ${t.id === D.trends[todayTrendIndex].id ? "· Hot hôm nay" : ""}</p>
        <h2 id="modalTitle">${esc(t.name)}</h2>
        <p class="section-sub">${esc(t.sub)}</p>
        <p class="detail-lead">${esc(t.desc)}</p>
        <div class="stats">
          <div class="stat"><small>Độ hot</small><b>${t.hot}%</b><div class="meter"><span style="width:${t.hot}%"></span></div></div>
          <div class="stat"><small>Thời điểm</small><b>${esc(t.season)}</b></div>
          <div class="stat"><small>Hợp độ tuổi</small><b>${ageNames}</b></div>
        </div>
        <h4>Điểm nổi bật</h4>
        <ul>${t.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <h4>Mẹo phối &amp; mặc được nhiều lần</h4>
        <ul>${t.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <div class="modal-actions">${favButtonLarge("trend", t.id)}</div>
      </div>
    </div>
    <div class="result-group"><h3>Món đồ bắt trend này</h3></div>
    <div class="mini-products">${t.products.map((p) => miniProduct(PRODUCTS[p])).join("")}</div>
    ${
      related.length
        ? `<div class="result-group"><h3>Bộ phối gợi ý</h3><div class="result-list">${related.map(outfitResult).join("")}</div></div>`
        : ""
    }`,
    "trend"
  );
}

function openOutfit(id) {
  const o = OUTFITS[id];
  const tasteNames = o.tastes.map((x) => D.tastes.find((t) => t.id === x).name).join(", ");
  const ageNames = o.ages.map((a) => D.ages.find((x) => x.id === a).name).join(", ");
  openModal(
    `
    <div class="detail">
      <div class="detail-gallery">
        <img src="${img(o.img, 700, 630)}" alt="${esc(o.title)}">
        ${o.items.map((id) => `<img src="${img(PRODUCTS[id].img, 300, 400)}" alt="${esc(PRODUCTS[id].name)}">`).join("")}
      </div>
      <div>
        <p class="detail-kicker">Gợi ý phối đồ · ${SCENES[o.scene].name}</p>
        <h2 id="modalTitle">${esc(o.title)}</h2>
        <p class="detail-lead">${esc(o.desc)}</p>
        <div class="stats">
          <div class="stat"><small>Trọn bộ từ</small><b>${money(outfitPrice(o))}</b></div>
          <div class="stat"><small>Phong cách</small><b>${tasteNames}</b></div>
          <div class="stat"><small>Hợp độ tuổi</small><b>${ageNames}</b></div>
        </div>
        <h4>Mẹo mặc đẹp hơn</h4>
        <ul>${o.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <h4>Các món trong bộ phối</h4>
        <div class="mini-products" style="margin-top:0">${o.items.map((p) => miniProduct(PRODUCTS[p])).join("")}</div>
        <div class="modal-actions">${favButtonLarge("outfit", o.id)}</div>
      </div>
    </div>`,
    "outfit"
  );
}

function openPost(id) {
  const p = POSTS[id];
  openModal(
    `
    <article class="article">
      <p class="detail-kicker">${esc(p.tag)} · ${dateVi(p.date)}</p>
      <h2 id="modalTitle">${esc(p.title)}</h2>
      <img src="${img(p.img, 1100, 620)}" alt="">
      <p><b>${esc(p.excerpt)}</b></p>
      ${p.body.map((x) => `<p>${esc(x)}</p>`).join("")}
    </article>`,
    "post"
  );
}

// ---------- Tìm kiếm ----------
const trendResult = (t) =>
  `<button class="result-item" data-open="trend:${t.id}"><img src="${img(t.img, 110, 130)}" alt=""><span>${esc(t.name)}<small>Xu hướng · ${esc(t.sub)}</small></span></button>`;
const outfitResult = (o) =>
  `<button class="result-item" data-open="outfit:${o.id}"><img src="${img(o.img, 110, 130)}" alt=""><span>${esc(o.title)}<small>${SCENES[o.scene].name} · từ ${money(outfitPrice(o))}</small></span></button>`;
const productResult = (p) =>
  `<a class="result-item" href="${p.url}" target="_blank" rel="noopener"><img src="${img(p.img, 110, 130)}" alt=""><span>${esc(p.name)}<small>${money(p.price)} · Mua trên ${p.shop}</small></span></a>`;
const postResult = (p) =>
  `<button class="result-item" data-open="post:${p.id}"><img src="${img(p.img, 110, 130)}" alt=""><span>${esc(p.title)}<small>Bài viết · ${esc(p.tag)}</small></span></button>`;
const shopResult = (s) =>
  `<a class="result-item" href="${s.url}" target="_blank" rel="noopener"><span class="shop-logo" style="width:52px;height:52px;font-size:11px">${esc(s.name)}</span><span>${esc(s.name)}<small>Shop · ${esc(s.type)}</small></span></a>`;

function search(query) {
  const words = plain(query).split(/\s+/).filter(Boolean);
  const match = (...fields) => {
    const text = plain(fields.flat().join(" "));
    return words.every((w) => text.includes(w));
  };
  if (!words.length) return null;
  return {
    "Xu hướng": D.trends.filter((t) => match(t.name, t.sub, t.desc, t.points, t.season)).map(trendResult),
    "Gợi ý phối đồ": D.outfits
      .filter((o) => match(o.title, o.desc, SCENES[o.scene].name, o.tastes.map((x) => D.tastes.find((t) => t.id === x).name)))
      .map(outfitResult),
    "Sản phẩm": D.products.filter((p) => match(p.name, p.color, CATS[p.cat].name, p.shop)).map(productResult),
    "Bài viết": D.posts.filter((p) => match(p.title, p.excerpt, p.tag, p.body)).map(postResult),
    Shop: D.shops.filter((s) => match(s.name, s.type)).map(shopResult),
  };
}

function renderSearchResults(query) {
  const res = search(query);
  const box = $("#searchResults");
  if (!res) {
    box.innerHTML = `<p class="list-sub">Gợi ý: ${["quiet luxury", "đi làm", "váy", "jeans", "hồng", "túi xách"]
      .map((w) => `<button class="chip" data-suggest="${w}">${w}</button>`)
      .join(" ")}</p>`;
    return;
  }
  const groups = Object.entries(res).filter(([, items]) => items.length);
  const total = groups.reduce((n, [, items]) => n + items.length, 0);
  box.innerHTML = total
    ? `<p class="list-sub">${total} kết quả cho “${esc(query)}”</p>` +
      groups.map(([name, items]) => `<div class="result-group"><h3>${name} (${items.length})</h3><div class="result-list">${items.join("")}</div></div>`).join("")
    : `<p class="empty">Không tìm thấy kết quả cho “${esc(query)}”. Thử từ khoá khác nhé!</p>`;
}

function openSearch(query = "") {
  openModal(
    `
    <h2 class="list-title" id="modalTitle">Tìm kiếm</h2>
    <div class="modal-search">
      ${icon("search")}
      <input type="search" id="modalSearchInput" placeholder="Tìm xu hướng, bộ phối, sản phẩm, shop..." value="${esc(query)}" aria-label="Từ khoá tìm kiếm" autocomplete="off">
    </div>
    <div id="searchResults"></div>`,
    "search"
  );
  renderSearchResults(query);
  const input = $("#modalSearchInput");
  input.setSelectionRange(query.length, query.length);
  input.addEventListener("input", () => renderSearchResults(input.value));
}

// ---------- Danh sách yêu thích ----------
function renderFavorites() {
  const groups = [
    ["Xu hướng", favs.trend.filter((id) => TRENDS[id]).map((id) => TRENDS[id]), trendResult, "trend"],
    ["Bộ phối", favs.outfit.filter((id) => OUTFITS[id]).map((id) => OUTFITS[id]), outfitResult, "outfit"],
    ["Sản phẩm", favs.product.filter((id) => PRODUCTS[id]).map((id) => PRODUCTS[id]), productResult, "product"],
  ];
  const total = groups.reduce((n, g) => n + g[1].length, 0);
  $("#modalBody").innerHTML = `
    <h2 class="list-title" id="modalTitle">Danh sách yêu thích</h2>
    <p class="list-sub">${total ? `Bạn đã lưu ${total} mục. Dữ liệu được lưu trên trình duyệt này.` : "Bấm vào biểu tượng trái tim ở xu hướng, bộ phối hoặc sản phẩm để lưu lại xem sau."}</p>
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

// ---------- Sự kiện ----------
function openFromData(value) {
  const [type, id] = value.split(":");
  if (type === "trend") openTrend(id);
  if (type === "outfit") openOutfit(id);
  if (type === "post") openPost(id);
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

// Mở thẻ bằng bàn phím (Enter / Space)
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

$("#priceSelect").addEventListener("change", (e) => {
  productState.price = e.target.value;
  productLimit = PRODUCT_PAGE;
  renderProducts();
});

$("#productReset").addEventListener("click", () => {
  Object.assign(productState, { cat: "all", color: "all", price: "all" });
  productLimit = PRODUCT_PAGE;
  renderProductControls();
  renderProducts();
});

$("#productMore").addEventListener("click", () => {
  productLimit += PRODUCT_PAGE;
  renderProducts();
});

// Tìm kiếm ở header
$("#searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  openSearch($("#searchInput").value.trim());
  $("#searchInput").value = "";
});
$("#searchToggle").addEventListener("click", () => openSearch(""));
$("#favBtn").addEventListener("click", openFavorites);

// Menu điện thoại
const nav = $("#mainNav");
const menuBtn = $("#menuBtn");
function setMenu(open) {
  nav.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
  menuBtn.querySelector("use").setAttribute("href", open ? "#i-close" : "#i-menu");
}
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
nav.addEventListener("click", (e) => {
  if (e.target.closest("a")) setMenu(false);
});

// Tô đậm mục menu theo phần đang xem
const navLinks = [...nav.querySelectorAll("a")];
const sectionIds = ["trends", "outfits", "products", "blog", "community"];
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

// Cộng đồng: tính năng mở rộng trong tương lai (ngoài phạm vi MVP)
$("#joinBtn").addEventListener("click", () =>
  toast("Cộng đồng StyleHer sắp ra mắt – đăng ký email ở cuối trang để nhận thông báo nhé!")
);

// Đăng ký nhận tin (demo: chỉ kiểm tra email, không gửi đi đâu)
$("#newsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("#newsEmail").value.trim();
  const msg = $("#newsMsg");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.textContent = "Email chưa đúng định dạng, bạn kiểm tra lại nhé.";
    msg.className = "news-msg err";
    return;
  }
  msg.textContent = "Cảm ơn bạn! (Bản demo: email chưa được gửi đi.)";
  msg.className = "news-msg ok";
  $("#newsEmail").value = "";
});

// ---------- Khởi động ----------
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
updateFavCount();
