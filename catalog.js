// OUT LED — Catálogo público com modo admin
(function () {
  "use strict";

  const STORAGE_KEY = "outled_admin_state_v1";
  const FILTER_KEY = "outled_catalog_filter";
  const ADMIN_KEY = "outled_catalog_admin";

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

  let products = [];
  let categories = [];
  let activeFilter = "all";
  let activeSort = "discount";
  let searchTerm = "";
  let currentDetail = null;
  let galleryIndex = 0;
  let adminMode = false;

  // Edit form state
  let editingId = null;
  let efPhotos = [];
  let efVideos = [];

  // ---------- Storage / Data ----------
async function loadData() {
  const data = await OutLedStore.loadAll();
  products = data.products || [];
  categories = data.categories || [];
}

async function syncSaveProduct(p) {
  await OutLedStore.saveProduct(p);
  // Re-load to ensure sync
  const data = await OutLedStore.loadAll();
  products = data.products;
  categories = data.categories;
}

async function syncDeleteProduct(id) {
  await OutLedStore.deleteProduct(id);
  const data = await OutLedStore.loadAll();
  products = data.products;
  categories = data.categories;
}

  // ---------- Helpers ----------
  function fmt(n) { return Number(n || 0).toFixed(2).replace(".", ","); }
  function discount(p) {
    if (!p.oldPrice || p.oldPrice <= p.price) return 0;
    return Math.round((1 - p.price / p.oldPrice) * 100);
  }
  function getMedia(p) {
    const photos = Array.isArray(p.photos) && p.photos.length ? p.photos : (p.img ? [p.img] : []);
    const videos = Array.isArray(p.videos) ? p.videos : [];
    return { photos, videos, all: [...photos.map(s => ({ type: "photo", src: s })), ...videos.map(s => ({ type: "video", src: s }))] };
  }
  function thumbOf(p) { return getMedia(p).photos[0] || null; }
  function escapeHtml(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }

  // Generate a simple sequential numeric ID — easy to read & say
  function generateId() {
    let max = 0;
    products.forEach(p => {
      const n = parseInt(String(p.id).replace(/\D/g, ""), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    let next = max + 1;
    let id = String(next).padStart(4, "0");
    while (products.some(p => p.id === id)) {
      next++;
      id = String(next).padStart(4, "0");
    }
    return id;
  }

  // ---------- Toast ----------
  function toast(msg, isError) {
    const el = $("#cat-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("error", !!isError);
    el.classList.add("show");
    clearTimeout(window.__catToast);
    window.__catToast = setTimeout(() => el.classList.remove("show"), 2400);
  }

  // ---------- Stats ----------
  function renderStats() {
    const total = products.length;
    const totalSaved = products.reduce((s, p) => s + Math.max(0, (p.oldPrice || 0) - (p.price || 0)), 0);
    const avgDisc = products.length
      ? Math.round(products.reduce((s, p) => s + discount(p), 0) / products.length) : 0;
    const cats = categories.length;
    $("#cat-stats").innerHTML = `
      <div class="cat-stat"><div class="v">${total}</div><div class="l">Produtos</div></div>
      <div class="cat-stat"><div class="v">${cats}</div><div class="l">Categorias</div></div>
      <div class="cat-stat"><div class="v led">−${avgDisc}%</div><div class="l">Desconto médio</div></div>
      <div class="cat-stat"><div class="v led">R$ ${fmt(totalSaved)}</div><div class="l">Economia total</div></div>
    `;
  }

  // ---------- Filters ----------
  function renderFilters() {
    const filters = [
      { id: "all", label: "Todos", count: products.length },
      ...categories.map(c => ({
        id: c.id, label: c.label,
        count: products.filter(p => p.cat === c.id).length,
      })).filter(f => f.count > 0),
    ];
    $("#filters").innerHTML = filters.map(f => `
      <button class="f-btn ${f.id === activeFilter ? "active" : ""}" data-id="${f.id}">
        ${f.label} <span style="opacity:.55">(${f.count})</span>
      </button>
    `).join("");
    $$(".f-btn", $("#filters")).forEach(btn => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.id;
        try { localStorage.setItem(FILTER_KEY, activeFilter); } catch (e) {}
        renderFilters();
        renderGrid();
      });
    });
  }

  // ---------- Grid ----------
  function getFiltered() {
    let arr = products.slice();
    if (activeFilter !== "all") arr = arr.filter(p => p.cat === activeFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      arr = arr.filter(p =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.id || "").toLowerCase().includes(q) ||
        (p.desc || "").toLowerCase().includes(q) ||
        (p.condition || "").toLowerCase().includes(q) ||
        (p.catLabel || "").toLowerCase().includes(q)
      );
    }
    switch (activeSort) {
      case "price-asc":  arr.sort((a, b) => a.price - b.price); break;
      case "price-desc": arr.sort((a, b) => b.price - a.price); break;
      case "name":       arr.sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
      default:           arr.sort((a, b) => discount(b) - discount(a));
    }
    return arr;
  }

  function renderGrid() {
    const arr = getFiltered();
    const grid = $("#catalog-grid");
    const empty = $("#empty-state");
    if (arr.length === 0) {
      grid.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    grid.innerHTML = arr.map(p => {
      const m = getMedia(p);
      const t = thumbOf(p);
      const disc = discount(p);
      const photoCount = m.photos.length;
      const videoCount = m.videos.length;
      const codigo = "";
      const idBig = `<div class="cat-card-id-big">
        <span class="id-label">ID</span>
        <span class="id-value">#${escapeHtml(p.id)}</span>
      </div>`;
      const adminActions = adminMode ? `
        <div class="card-actions">
          <button class="card-action-btn" data-edit="${escapeAttr(p.id)}" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
          <button class="card-action-btn danger" data-delete="${escapeAttr(p.id)}" title="Excluir">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>` : "";
      return `
        <article class="cat-card ${adminMode ? "admin-mode" : ""}" data-id="${escapeAttr(p.id)}">
          <div class="cat-card-img">
            ${t ? `<img src="${escapeAttr(t)}" alt="${escapeAttr(p.name)}" loading="lazy" decoding="async" />`
                : `<span class="nophoto">Sem foto</span>`}
            <div class="cat-badges">
              ${disc > 0 ? `<span class="cat-badge discount">−${disc}%</span>` : ""}
              <span class="cat-badge condition">Outlet</span>
            </div>
            ${(photoCount > 1 || videoCount > 0) ? `
              <div class="cat-media-count">
                ${photoCount > 1 ? `<span class="media-pill">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
                  ${photoCount}
                </span>` : ""}
                ${videoCount > 0 ? `<span class="media-pill" style="color:var(--led)">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  ${videoCount}
                </span>` : ""}
              </div>` : ""}
            ${adminActions}
          </div>
          <div class="cat-card-body">
            ${idBig}
            <div class="cat-card-cat">${escapeHtml(p.catLabel || "")}</div>
            <h3 class="cat-card-name">${escapeHtml(p.name)}</h3>
            <div class="cat-card-prices">
              ${p.oldPrice && p.oldPrice > p.price ? `<span class="cat-price-old">R$ ${fmt(p.oldPrice)}</span>` : ""}
              <span class="cat-price-now"><span class="cur">R$</span>${fmt(p.price)}</span>
            </div>
          </div>
        </article>
      `;
    }).join("");

    $$(".cat-card", grid).forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".card-action-btn")) return;
        if (adminMode) {
          openEdit(card.dataset.id);
        } else {
          openDetail(card.dataset.id);
        }
      });
    });
    $$("[data-edit]", grid).forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openEdit(btn.dataset.edit);
      });
    });
    $$("[data-delete]", grid).forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.delete;
        const p = products.find(x => x.id === id);
        if (!p) return;
        if (!confirm(`Excluir "${p.name}" (#${p.id})? Esta ação não pode ser desfeita.`)) return;
        
        await syncDeleteProduct(id);
        
        renderStats();
        renderFilters();
        renderGrid();
        toast("Produto excluído · #" + id);
      });
    });
  }

  // ---------- Detail modal ----------
  function openDetail(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    currentDetail = p;
    galleryIndex = 0;
    renderDetail();
    $("#detail-modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeDetail() {
    $("#detail-modal").classList.add("hidden");
    document.body.style.overflow = "";
    currentDetail = null;
    const v = $("#modal-body video");
    if (v) v.pause();
  }
  function renderDetail() {
    const p = currentDetail;
    if (!p) return;
    const m = getMedia(p);
    const disc = discount(p);
    const codigo = "";
    let mainMedia = "";
    if (m.all.length === 0) mainMedia = `<div class="gallery-empty">Sem foto disponível</div>`;
    else {
      const cur = m.all[galleryIndex];
      mainMedia = cur.type === "video"
        ? `<video src="${escapeAttr(cur.src)}" controls autoplay></video>`
        : `<img src="${escapeAttr(cur.src)}" alt="${escapeAttr(p.name)}" decoding="async" />`;
    }
    const navBtns = m.all.length > 1 ? `
      <button class="gallery-nav prev" id="gal-prev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
      <button class="gallery-nav next" id="gal-next"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>` : "";
    const thumbs = m.all.length > 1 ? `
      <div class="gallery-thumbs">
        ${m.all.map((it, i) => `
          <button class="gallery-thumb ${i === galleryIndex ? "active" : ""}" data-idx="${i}">
            ${it.type === "video"
              ? `<video src="${escapeAttr(it.src)}" muted preload="metadata"></video>
                 <span class="play-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>`
              : `<img src="${escapeAttr(it.src)}" alt="" loading="lazy" decoding="async" />`}
          </button>`).join("")}
      </div>` : "";

    $("#modal-body").innerHTML = `
      <div class="modal-gallery">
        <div class="gallery-main" id="gallery-main">${mainMedia}${navBtns}</div>
        ${thumbs}
      </div>
      <div class="modal-info">
        <div class="modal-cat">${escapeHtml(p.catLabel || "")}</div>
        <h2>${escapeHtml(p.name)}</h2>
        <div class="modal-id-pill">${escapeHtml(p.id)}</div>
        <div class="modal-prices">
          ${p.oldPrice && p.oldPrice > p.price ? `<span class="modal-price-old">R$ ${fmt(p.oldPrice)}</span>` : ""}
          <span class="modal-price-now">R$ ${fmt(p.price)}</span>
          ${disc > 0 ? `<span class="modal-discount">−${disc}%</span>` : ""}
        </div>
        ${p.condition ? `<div class="condition-card"><div class="ttl">Por que está em outlet</div><p>${escapeHtml(p.condition)}</p></div>` : ""}
        ${p.desc ? `<div class="info-block"><h4>Descrição</h4><p>${escapeHtml(p.desc)}</p></div>` : ""}
      </div>`;
    $$(".gallery-thumb", $("#modal-body")).forEach(t => t.addEventListener("click", () => { galleryIndex = +t.dataset.idx; renderDetail(); }));
    const prev = $("#gal-prev"); const next = $("#gal-next");
    if (prev) prev.addEventListener("click", (e) => { e.stopPropagation(); galleryIndex = (galleryIndex - 1 + m.all.length) % m.all.length; renderDetail(); });
    if (next) next.addEventListener("click", (e) => { e.stopPropagation(); galleryIndex = (galleryIndex + 1) % m.all.length; renderDetail(); });
    // Click main media to open lightbox
    const mainEl = $("#gallery-main");
    if (mainEl && m.all.length > 0) {
      mainEl.addEventListener("click", (e) => {
        if (e.target.closest(".gallery-nav")) return;
        if (e.target.tagName === "VIDEO") return; // let video controls work
        openLightbox(m.all, galleryIndex);
      });
    }
  }

  // ---------- Lightbox (fullscreen image/video viewer) ----------
  let lightboxItems = [];
  let lightboxIdx = 0;
  function openLightbox(items, idx) {
    lightboxItems = items;
    lightboxIdx = idx || 0;
    let lb = $("#cat-lightbox");
    if (!lb) {
      lb = document.createElement("div");
      lb.id = "cat-lightbox";
      lb.className = "cat-lightbox";
      lb.innerHTML = `
        <button class="lightbox-close" id="lb-close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M6 18 18 6"/></svg></button>
        <button class="lightbox-nav prev" id="lb-prev"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
        <button class="lightbox-nav next" id="lb-next"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>
        <div id="lb-content"></div>
        <div class="lightbox-counter" id="lb-counter"></div>`;
      document.body.appendChild(lb);
      $("#lb-close").addEventListener("click", closeLightbox);
      $("#lb-prev").addEventListener("click", () => { lightboxIdx = (lightboxIdx - 1 + lightboxItems.length) % lightboxItems.length; renderLightbox(); });
      $("#lb-next").addEventListener("click", () => { lightboxIdx = (lightboxIdx + 1) % lightboxItems.length; renderLightbox(); });
      lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
    }
    renderLightbox();
    lb.classList.add("show");
  }
  function renderLightbox() {
    const c = $("#lb-content");
    if (!c) return;
    const cur = lightboxItems[lightboxIdx];
    c.innerHTML = cur.type === "video"
      ? `<video src="${escapeAttr(cur.src)}" controls autoplay></video>`
      : `<img src="${escapeAttr(cur.src)}" alt="" />`;
    const counter = $("#lb-counter");
    if (counter) counter.textContent = `${lightboxIdx + 1} / ${lightboxItems.length}`;
    const nav = lightboxItems.length > 1;
    $("#lb-prev").style.display = nav ? "" : "none";
    $("#lb-next").style.display = nav ? "" : "none";
    if (counter) counter.style.display = nav ? "" : "none";
  }
  function closeLightbox() {
    const lb = $("#cat-lightbox");
    if (lb) {
      lb.classList.remove("show");
      const v = lb.querySelector("video");
      if (v) v.pause();
    }
  }

  // ---------- ADMIN MODE ----------
  async function ensureAdminCredentials() {
    if (OutLedStore.hasAdminCredentials && OutLedStore.hasAdminCredentials()) return true;
    if (!OutLedStore.setAdminCredentials) return true; // store antigo, ignora
    const url = prompt(
      "Modo Edição\n\n" +
      "Cole a connection string admin do Neon (postgresql://neondb_owner:...).\n" +
      "Ela fica salva só neste aparelho (localStorage) e não vai pra ninguém.\n\n" +
      "Você só precisa colar uma vez."
    );
    if (!url) return false;
    try {
      await OutLedStore.setAdminCredentials(url.trim());
      toast("Credencial admin salva neste aparelho.");
      return true;
    } catch (e) {
      toast("Erro: " + (e.message || e), true);
      return false;
    }
  }

  async function setAdminMode(on) {
    if (on && OutLedStore.hasAdminCredentials && !OutLedStore.hasAdminCredentials()) {
      const ok = await ensureAdminCredentials();
      if (!ok) return; // cancelou — não ativa
    }
    adminMode = !!on;
    document.body.classList.toggle("admin-mode", adminMode);
    try { localStorage.setItem(ADMIN_KEY, adminMode ? "1" : "0"); } catch (e) {}
    $("#admin-toggle-label").textContent = adminMode ? "Sair do modo edição" : "Modo edição";
    $("#add-product-btn").classList.toggle("hidden", !adminMode);
    renderGrid();
  }

  function openLogin() {
    $("#login-modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
    $("#lf-user").focus();
  }

  function closeLogin() {
    $("#login-modal").classList.add("hidden");
    document.body.style.overflow = "";
    $("#login-form").reset();
  }

  // ---------- Edit / Create ----------
  function populateCatSelect() {
    const sel = $("#ef-cat");
    sel.innerHTML = categories.map(c => `<option value="${escapeAttr(c.id)}">${escapeHtml(c.label)}</option>`).join("");
  }
  function openEdit(id) {
    populateCatSelect();
    editingId = id || null;
    efPhotos = [];
    efVideos = [];
    if (id) {
      const p = products.find(x => x.id === id);
      if (!p) return;
      $("#edit-title").textContent = "Editar produto · #" + p.id;
      $("#ef-id").value = p.id;
      $("#ef-id").disabled = true;
      $("#ef-name").value = p.name || "";
      $("#ef-cat").value = p.cat || (categories[0] && categories[0].id) || "";
      $("#ef-icon").value = p.icon || "projector";
      $("#ef-oldprice").value = p.oldPrice || "";
      $("#ef-price").value = p.price || "";
      $("#ef-desc").value = p.desc || "";
      $("#ef-condition").value = p.condition || "";
      efPhotos = Array.isArray(p.photos) && p.photos.length ? [...p.photos] : (p.img ? [p.img] : []);
      efVideos = Array.isArray(p.videos) ? [...p.videos] : [];
      $("#ef-delete").style.display = "";
    } else {
      $("#edit-title").textContent = "Novo produto";
      $("#edit-form").reset();
      const newId = generateId();
      $("#ef-id").value = newId;
      $("#ef-id").disabled = false;
      $("#ef-cat").value = (categories[0] && categories[0].id) || "";
      $("#ef-delete").style.display = "none";
    }
    renderEfMedia();
    $("#edit-modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeEdit() {
    $("#edit-modal").classList.add("hidden");
    document.body.style.overflow = "";
    editingId = null;
    efPhotos = [];
    efVideos = [];
  }
  function renderEfMedia() {
    const ph = $("#ef-photos-grid");
    const vd = $("#ef-videos-grid");
    ph.innerHTML = efPhotos.length === 0
      ? `<div class="media-empty">Nenhuma foto</div>`
      : efPhotos.map((src, i) => `
          <div class="media-thumb">
            <img src="${escapeAttr(src)}" alt="" />
            ${i === 0 ? `<span class="media-cover">CAPA</span>` : ""}
            <button type="button" class="media-remove" data-type="photo" data-i="${i}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M6 18 18 6"/></svg>
            </button>
          </div>`).join("");
    vd.innerHTML = efVideos.length === 0
      ? `<div class="media-empty">Nenhum vídeo</div>`
      : efVideos.map((src, i) => `
          <div class="media-thumb">
            <video src="${escapeAttr(src)}" muted preload="metadata"></video>
            <span class="video-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
            <button type="button" class="media-remove" data-type="video" data-i="${i}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M6 18 18 6"/></svg>
            </button>
          </div>`).join("");
    $$(".media-remove", ph.parentElement).forEach(b => {});
    [ph, vd].forEach(g => g.querySelectorAll(".media-remove").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = +btn.dataset.i;
        if (btn.dataset.type === "photo") efPhotos.splice(i, 1);
        else efVideos.splice(i, 1);
        renderEfMedia();
      });
    }));
  }
  function fileToDataUrl(f) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  }
  async function handlePhotoFile(e) {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      try { efPhotos.push(await fileToDataUrl(f)); } catch (er) {}
    }
    e.target.value = "";
    renderEfMedia();
  }
  async function handleVideoFile(e) {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (!f.type.startsWith("video/")) continue;
      if (f.size > 25 * 1024 * 1024) {
        toast(`"${f.name}" passa de 25MB. Use URL.`, true);
        continue;
      }
      try { efVideos.push(await fileToDataUrl(f)); } catch (er) {}
    }
    e.target.value = "";
    renderEfMedia();
  }
  function addUrl(type) {
    const url = prompt(type === "photo" ? "URL da foto:" : "URL do vídeo:");
    if (url && url.trim()) {
      if (type === "photo") efPhotos.push(url.trim());
      else efVideos.push(url.trim());
      renderEfMedia();
    }
  }
  async function saveProduct(e) {
    e.preventDefault();
    const id = $("#ef-id").value.trim();
    if (!id) { toast("ID obrigatório", true); return; }
    // ID unique check (always — must never repeat)
    if (products.some(p => p.id === id && p.id !== editingId)) {
      toast("Já existe produto com o ID #" + id, true);
      return;
    }
    const catObj = categories.find(c => c.id === $("#ef-cat").value);
    const data = {
      id,
      name: $("#ef-name").value.trim(),
      cat: $("#ef-cat").value,
      catLabel: catObj ? catObj.label : "",
      icon: $("#ef-icon").value,
      oldPrice: parseFloat($("#ef-oldprice").value) || 0,
      price: parseFloat($("#ef-price").value) || 0,
      desc: $("#ef-desc").value.trim(),
      condition: $("#ef-condition").value.trim(),
      photos: [...efPhotos],
      videos: [...efVideos],
      img: efPhotos[0] || undefined,
      createdAt: editingId ? (products.find(p => p.id === editingId) || {}).createdAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
    };
    try {
      if (editingId) {
        toast("Salvando alterações...");
        await syncSaveProduct(data);
        toast("Produto atualizado · " + data.id);
      } else {
        toast("Criando produto...");
        await syncSaveProduct(data);
        toast("Produto criado · " + data.id);
      }
      renderStats();
      renderFilters();
      renderGrid();
      closeEdit();
    } catch (err) {
      console.error("[saveProduct]", err);
      toast("Erro ao salvar: " + (err.message || err), true);
    }
  }
  async function deleteProduct() {
    if (!editingId) return;
    const p = products.find(x => x.id === editingId);
    if (!confirm(`Excluir produto "${p && p.name}"? Esta ação não pode ser desfeita.`)) return;
    
    await syncDeleteProduct(editingId);
    
    renderStats();
    renderFilters();
    renderGrid();
    closeEdit();
    toast("Produto excluído");
  }

  // ---------- Init ----------
  async function init() {
    await loadData();
    try { activeFilter = localStorage.getItem(FILTER_KEY) || "all"; } catch (e) {}
    try { adminMode = localStorage.getItem(ADMIN_KEY) === "1"; } catch (e) {}

    // Se admin mode estava ativo mas a credencial não está presente,
    // desliga silenciosamente (sem prompt de credencial no carregamento).
    if (adminMode && OutLedStore.hasAdminCredentials && !OutLedStore.hasAdminCredentials()) {
      adminMode = false;
      try { localStorage.setItem(ADMIN_KEY, "0"); } catch (e) {}
    }

    // Aplicação do estado inicial sem disparar o prompt
    document.body.classList.toggle("admin-mode", adminMode);
    $("#admin-toggle-label").textContent = adminMode ? "Sair do modo edição" : "Modo edição";
    $("#add-product-btn").classList.toggle("hidden", !adminMode);

    renderStats();
    renderFilters();
    renderGrid();

    $("#search").addEventListener("input", e => { searchTerm = e.target.value.trim(); renderGrid(); });
    $("#sort").addEventListener("change", e => { activeSort = e.target.value; renderGrid(); });
    $("#modal-close").addEventListener("click", closeDetail);
    $("#modal-backdrop").addEventListener("click", closeDetail);

    $("#admin-toggle").addEventListener("click", () => {
      if (!adminMode) {
        openLogin();
      } else {
        setAdminMode(false);
      }
    });
    $("#add-product-btn").addEventListener("click", () => openEdit(null));

    // ID lookup
    const idForm = $("#id-lookup-form");
    if (idForm) {
      idForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const raw = ($("#id-lookup-input").value || "").trim().replace(/^#/, "");
        if (!raw) return;
        
        // Use as general search
        searchTerm = raw;
        $("#search").value = raw; // sync with the other input
        activeFilter = "all"; // clear category filter
        try { localStorage.setItem(FILTER_KEY, "all"); } catch (e) {}
        
        renderFilters();
        renderGrid();
        
        // Scroll to grid to show results
        const grid = $("#catalog-grid");
        if (grid) {
          grid.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    // login modal wiring
    $("#login-close").addEventListener("click", closeLogin);
    $("#login-backdrop").addEventListener("click", closeLogin);
    $("#login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = $("#lf-user").value.trim();
      const pass = $("#lf-pass").value.trim();
      if (user === "LedADM" && pass === "LA321*!") {
        closeLogin();
        await setAdminMode(true);
        toast("Login realizado com sucesso!");
      } else {
        toast("Usuário ou senha incorretos", true);
      }
    });

    // edit modal wiring
    $("#edit-close").addEventListener("click", closeEdit);
    $("#edit-backdrop").addEventListener("click", closeEdit);
    $("#ef-cancel").addEventListener("click", closeEdit);
    $("#ef-delete").addEventListener("click", deleteProduct);
    $("#edit-form").addEventListener("submit", saveProduct);
    $("#ef-photo-upload").addEventListener("change", handlePhotoFile);
    $("#ef-video-upload").addEventListener("change", handleVideoFile);
    $("#ef-add-photo-url").addEventListener("click", () => addUrl("photo"));
    $("#ef-add-video-url").addEventListener("click", () => addUrl("video"));

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        const lb = $("#cat-lightbox");
        if (lb && lb.classList.contains("show")) { closeLightbox(); return; }
        if (!$("#edit-modal").classList.contains("hidden")) closeEdit();
        else if (!$("#login-modal").classList.contains("hidden")) closeLogin();
        else if (currentDetail) closeDetail();
      }
      const lb = $("#cat-lightbox");
      if (lb && lb.classList.contains("show") && lightboxItems.length > 1) {
        if (e.key === "ArrowLeft") { lightboxIdx = (lightboxIdx - 1 + lightboxItems.length) % lightboxItems.length; renderLightbox(); }
        if (e.key === "ArrowRight") { lightboxIdx = (lightboxIdx + 1) % lightboxItems.length; renderLightbox(); }
        return;
      }
      if (currentDetail && $("#edit-modal").classList.contains("hidden")) {
        const m = getMedia(currentDetail);
        if (m.all.length > 1) {
          if (e.key === "ArrowLeft") { galleryIndex = (galleryIndex - 1 + m.all.length) % m.all.length; renderDetail(); }
          if (e.key === "ArrowRight") { galleryIndex = (galleryIndex + 1) % m.all.length; renderDetail(); }
        }
      }
    });

    // deep link
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("p");
    if (pid) setTimeout(() => openDetail(pid), 100);

    window.addEventListener("storage", e => {
      if (e.key === STORAGE_KEY) {
        loadData();
        renderStats();
        renderFilters();
        renderGrid();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
