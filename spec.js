// ===== 要素の取得 =====
const toc = document.getElementById("toc");
const overlay = document.getElementById("overlay");
const menuToggle = document.getElementById("menuToggle");
const toTop = document.getElementById("toTop");
const tocLinks = document.querySelectorAll(".toc a");
const sections = document.querySelectorAll("main section");

// ===== スマホ用目次の開閉 =====
function setMenu(open) {
  toc.classList.toggle("open", open);
  overlay.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "目次を閉じる" : "目次を開く");
}

menuToggle.addEventListener("click", () => {
  setMenu(!toc.classList.contains("open"));
});

overlay.addEventListener("click", () => setMenu(false));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

// ===== 目次クリックでスムーズスクロール =====
tocLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", link.getAttribute("href"));
    setMenu(false);
  });
});

// ===== 表示中の章を目次でハイライト =====
function setActive(id) {
  tocLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  },
  // 画面の上から30%付近を通過した章を「現在の章」とみなす
  { rootMargin: "-30% 0px -65% 0px" }
);

sections.forEach((section) => observer.observe(section));

// ===== 上へ戻るボタン =====
function updateToTop() {
  toTop.classList.toggle("visible", window.scrollY > 400);
}

window.addEventListener("scroll", updateToTop, { passive: true });
updateToTop();

toTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
