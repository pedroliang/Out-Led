// OUT LED — Admin Panel Logic
// =============================

(function () {
  "use strict";

  // ---------- Simple hash (SHA-256 via SubtleCrypto) ----------
  async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // ---------- Default credentials ----------
  const DEFAULT_USER = "LedADM";
  const DEFAULT_PASS_HASH_PROMISE = sha256("LA321*!");

  // ---------- Storage helpers ----------
  const STORAGE_KEYS = {
    auth: "outled_admin_auth",
    products: "outled_products",
    categories: "outled_categories",
    icons: "outled_icons",
    session: "outled_session",
  };

  function getCredentials() {
    const stored = localStorage.getItem(STORAGE_KEYS.auth);
    if (stored) return JSON.parse(stored);
    return null;
  }

  async function setCredentials(user, pass) {
    const hash = await sha256(pass);
    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify({ user, hash }));
  }

  function getProducts() {
    const stored = localStorage.getItem(STORAGE_KEYS.products);
    return stored ? JSON.parse(stored) : null;
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  }

  function getCategories() {
    const stored = localStorage.getItem(STORAGE_KEYS.categories);
    return stored ? JSON.parse(stored) : null;
  }

  function saveCategories(categories) {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
  }

  function getIcons() {
    const stored = localStorage.getItem(STORAGE_KEYS.icons);
    return stored ? JSON.parse(stored) : null;
  }

  function saveIcons(iconsList) {
    localStorage.setItem(STORAGE_KEYS.icons, JSON.stringify(iconsList));
  }

  function isSessionActive() {
    const s = sessionStorage.getItem(STORAGE_KEYS.session);
    return s === "active";
  }

  function startSession(user) {
    sessionStorage.setItem(STORAGE_KEYS.session, "active");
    sessionStorage.setItem("outled_user", user);
  }

  function endSession() {
    sessionStorage.removeItem(STORAGE_KEYS.session);
    sessionStorage.removeItem("outled_user");
  }

  // ---------- DOM refs ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const loginScreen = $("#login-screen");
  const adminPanel = $("#admin-panel");
  const loginForm = $("#login-form");
  const loginUserInput = $("#login-user");
  const loginPassInput = $("#login-pass");
  const loginError = $("#login-error");
  const togglePassBtn = $("#toggle-pass");
  const logoutBtn = $("#logout-btn");
  const adminUserDisplay = $("#admin-user-display");

  const statsRow = $("#stats-row");
  const productsTbody = $("#products-tbody");
  const productSearch = $("#product-search");
  const addProductBtn = $("#add-product-btn");
  const categoriesGrid = $("#categories-grid");
  const addCategoryBtn = $("#add-category-btn");

  const productModal = $("#product-modal");
  const productForm = $("#product-form");
  const modalTitle = $("#modal-title");
  const modalCloseBtn = $("#modal-close");
  const modalCancelBtn = $("#modal-cancel");

  const categoryModal = $("#category-modal");
  const categoryForm = $("#category-form");
  const catModalTitle = $("#cat-modal-title");
  const catModalCloseBtn = $("#cat-modal-close");
  const catModalCancelBtn = $("#cat-modal-cancel");

  const settingsForm = $("#settings-form");
  const settingsMsg = $("#settings-msg");
  const exportBtn = $("#export-btn");
  const toastEl = $("#admin-toast");

  // ---------- State ----------
  let products = [];
  let categories = [];
  let icons = [];
  let editingProductId = null;
  let editingCategoryId = null;
  let editingIconId = null;
  let pfPhotos = []; // current product form photos: array of strings (urls or dataURLs)
  let pfVideos = []; // current product form videos

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2800);
  }

  // ---------- Init data ----------
  function initData() {
    products = getProducts();
    if (!products) {
      // Load defaults from data.js (they might not exist yet on admin page)
      products = window.OUTLED_PRODUCTS || [];
      saveProducts(products);
    }
    categories = getCategories();
    if (!categories) {
      categories = window.OUTLED_CATEGORIES || [];
      saveCategories(categories);
    }
    icons = getIcons();
    if (!icons) {
      icons = [
        { id: "projector", label: "Projetor" },
        { id: "projector-color", label: "Projetor Colorido" },
        { id: "fan", label: "Ventilador" },
        { id: "strip", label: "Fita LED" },
        { id: "neon", label: "Neon" },
        { id: "bulb", label: "Lâmpada" },
        { id: "linear", label: "Linear" },
        { id: "plafon", label: "Plafon" },
        { id: "spike", label: "Espeto" },
        { id: "marker", label: "Balizador" }
      ];
      saveIcons(icons);
    }
  }

  // ---------- Auth ----------
  async function authenticate(user, pass) {
    const hash = await sha256(pass);
    const creds = getCredentials();
    if (creds) {
      return creds.user === user && creds.hash === hash;
    }
    // Check default credentials
    const defaultHash = await DEFAULT_PASS_HASH_PROMISE;
    return user === DEFAULT_USER && hash === defaultHash;
  }

  function showAdmin(user) {
    loginScreen.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    adminUserDisplay.textContent = user;
    initData();
    renderStats();
    renderProducts();
    renderCategories();
    populateIconSelects();
  }

  function showLogin() {
    loginScreen.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    endSession();
  }

  // ---------- Render stats ----------
  function renderStats() {
    const totalProducts = products.length;
    const totalCats = categories.length;
    const avgDiscount = products.length
      ? Math.round(products.reduce((s, p) => s + (1 - p.price / p.oldPrice) * 100, 0) / products.length)
      : 0;
    const totalValue = products.reduce((s, p) => s + p.price, 0);

    statsRow.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Total de produtos</div>
        <div class="stat-value"><span class="accent">${totalProducts}</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Categorias</div>
        <div class="stat-value">${totalCats}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Desconto médio</div>
        <div class="stat-value"><span class="accent">−${avgDiscount}%</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Valor total estoque</div>
        <div class="stat-value">R$ ${totalValue.toFixed(2).replace(".", ",")}</div>
      </div>
    `;
  }

  // ---------- Render products ----------
  function renderProducts(search = "") {
    const filtered = search
      ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      : products;

    if (filtered.length === 0) {
      productsTbody.innerHTML = `
        <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--ink-300);">
          ${search ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}
        </td></tr>`;
      return;
    }

    productsTbody.innerHTML = filtered.map((p) => {
      const discount = Math.round((1 - p.price / p.oldPrice) * 100);
      const catObj = categories.find((c) => c.id === p.cat);
      return `
        <tr data-id="${p.id}">
          <td>
            <div class="table-img">
              ${p.img
                ? `<img src="${p.img}" alt="${p.name}" />`
                : `<span class="no-img">📦</span>`
              }
            </div>
          </td>
          <td class="product-name-cell">${p.name}</td>
          <td>${catObj ? catObj.label : p.catLabel || p.cat}</td>
          <td>R$ ${p.oldPrice.toFixed(2).replace(".", ",")}</td>
          <td style="font-weight:600;">R$ ${p.price.toFixed(2).replace(".", ",")}</td>
          <td><span class="discount-badge">−${discount}%</span></td>
          <td>
            <div class="table-actions">
              <button class="tbl-btn edit-btn" data-id="${p.id}" title="Editar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="tbl-btn del" data-id="${p.id}" title="Excluir">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
    }).join("");

    // Event listeners for edit/delete
    productsTbody.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openProductModal(btn.dataset.id));
    });
    productsTbody.querySelectorAll(".del").forEach((btn) => {
      btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
    });
  }

  // ---------- Render categories ----------
  function renderCategories() {
    if (categories.length === 0) {
      categoriesGrid.innerHTML = `<p style="color:var(--ink-300);">Nenhuma categoria cadastrada.</p>`;
      return;
    }

    categoriesGrid.innerHTML = categories.map((c) => {
      const count = products.filter((p) => p.cat === c.id).length;
      return `
        <div class="cat-card" data-id="${c.id}">
          <div class="cat-card-info">
            <h4>${c.label}</h4>
            <div class="cat-meta">id: ${c.id} · ${count} produto${count !== 1 ? "s" : ""}</div>
          </div>
          <div class="cat-card-actions">
            <button class="tbl-btn edit-cat-btn" data-id="${c.id}" title="Editar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="tbl-btn del del-cat-btn" data-id="${c.id}" title="Excluir">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
            </button>
          </div>
        </div>`;
    }).join("");

    categoriesGrid.querySelectorAll(".edit-cat-btn").forEach((btn) => {
      btn.addEventListener("click", () => openCategoryModal(btn.dataset.id));
    });
    categoriesGrid.querySelectorAll(".del-cat-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteCategory(btn.dataset.id));
    });
  }

  // ---------- Product modal ----------
  function populateCategorySelect() {
    const sel = $("#pf-cat");
    sel.innerHTML = categories.map((c) => `<option value="${c.id}">${c.label}</option>`).join("");
  }

  function populateIconSelects() {
    const pfIconSel = $("#pf-icon");
    const cfIconSel = $("#cf-icon");
    const optionsHtml = icons.map((icon) => `<option value="${icon.id}">${icon.label}</option>`).join("");
    if (pfIconSel) pfIconSel.innerHTML = optionsHtml;
    if (cfIconSel) cfIconSel.innerHTML = optionsHtml;
  }

  function openProductModal(editId) {
    populateCategorySelect();
    populateIconSelects();
    editingProductId = editId || null;
    pfPhotos = [];
    pfVideos = [];
    if (editId) {
      modalTitle.textContent = "Editar produto";
      const p = products.find((x) => x.id === editId);
      if (!p) return;
      $("#pf-id").value = p.id;
      $("#pf-id").disabled = true;
      $("#pf-name").value = p.name;
      $("#pf-codigo") && ($("#pf-codigo").value = p.codigo || "");
      $("#pf-cat").value = p.cat;
      $("#pf-oldprice").value = p.oldPrice;
      $("#pf-price").value = p.price;
      $("#pf-desc").value = p.desc || "";
      $("#pf-condition").value = p.condition || "";
      $("#pf-icon").value = p.icon || "projector";
      $("#pf-color").value = p.color || "";
      // load media
      pfPhotos = Array.isArray(p.photos) && p.photos.length ? [...p.photos] : (p.img ? [p.img] : []);
      pfVideos = Array.isArray(p.videos) ? [...p.videos] : [];
    } else {
      modalTitle.textContent = "Novo produto";
      productForm.reset();
      $("#pf-id").disabled = false;
    }
    renderMediaGrids();
    productModal.classList.remove("hidden");
  }

  function closeProductModal() {
    productModal.classList.add("hidden");
    editingProductId = null;
    pfPhotos = [];
    pfVideos = [];
    productForm.reset();
    $("#pf-id").disabled = false;
  }

  // ---------- Media handling ----------
  function renderMediaGrids() {
    const photosGrid = $("#pf-photos-grid");
    const videosGrid = $("#pf-videos-grid");
    if (!photosGrid || !videosGrid) return;

    photosGrid.innerHTML = pfPhotos.length === 0
      ? `<div class="media-empty">Nenhuma foto adicionada</div>`
      : pfPhotos.map((src, i) => `
          <div class="media-thumb" data-idx="${i}">
            <img src="${src}" alt="Foto ${i+1}" />
            <button type="button" class="media-remove" data-type="photo" data-idx="${i}" title="Remover">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M6 18 18 6"/></svg>
            </button>
            ${i === 0 ? '<span class="media-cover">CAPA</span>' : ''}
          </div>
        `).join("");

    videosGrid.innerHTML = pfVideos.length === 0
      ? `<div class="media-empty">Nenhum vídeo adicionado</div>`
      : pfVideos.map((src, i) => `
          <div class="media-thumb video" data-idx="${i}">
            <video src="${src}" muted preload="metadata"></video>
            <div class="video-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <button type="button" class="media-remove" data-type="video" data-idx="${i}" title="Remover">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M6 18 18 6"/></svg>
            </button>
          </div>
        `).join("");

    // wire remove
    [photosGrid, videosGrid].forEach(grid => {
      grid.querySelectorAll(".media-remove").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = +btn.dataset.idx;
          if (btn.dataset.type === "photo") pfPhotos.splice(idx, 1);
          else pfVideos.splice(idx, 1);
          renderMediaGrids();
        });
      });
    });
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      try {
        const dataUrl = await fileToDataUrl(f);
        pfPhotos.push(dataUrl);
      } catch (err) { /* ignore */ }
    }
    e.target.value = "";
    renderMediaGrids();
  }

  async function handleVideoUpload(e) {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (!f.type.startsWith("video/")) continue;
      if (f.size > 25 * 1024 * 1024) {
        toast(`Vídeo "${f.name}" maior que 25MB. Use uma URL externa.`);
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(f);
        pfVideos.push(dataUrl);
      } catch (err) { /* ignore */ }
    }
    e.target.value = "";
    renderMediaGrids();
  }

  function addPhotoUrl() {
    const url = prompt("URL da foto:");
    if (url && url.trim()) {
      pfPhotos.push(url.trim());
      renderMediaGrids();
    }
  }

  function addVideoUrl() {
    const url = prompt("URL do vídeo (mp4, webm ou link YouTube):");
    if (url && url.trim()) {
      pfVideos.push(url.trim());
      renderMediaGrids();
    }
  }

  function saveProduct(e) {
    e.preventDefault();
    const catObj = categories.find((c) => c.id === $("#pf-cat").value);
    const data = {
      id: $("#pf-id").value.trim(),
      name: $("#pf-name").value.trim(),
      codigo: $("#pf-codigo") ? $("#pf-codigo").value.trim() : "",
      cat: $("#pf-cat").value,
      catLabel: catObj ? catObj.label : "",
      oldPrice: parseFloat($("#pf-oldprice").value),
      price: parseFloat($("#pf-price").value),
      img: pfPhotos[0] || undefined, // first photo = thumbnail
      photos: [...pfPhotos],
      videos: [...pfVideos],
      desc: $("#pf-desc").value.trim(),
      condition: $("#pf-condition").value.trim(),
      icon: $("#pf-icon").value,
      color: $("#pf-color").value.trim() || undefined,
    };

    if (editingProductId) {
      const idx = products.findIndex((p) => p.id === editingProductId);
      if (idx !== -1) products[idx] = { ...products[idx], ...data };
      toast("Produto atualizado!");
    } else {
      if (products.find((p) => p.id === data.id)) {
        toast("ID já existe!");
        return;
      }
      products.push(data);
      toast("Produto adicionado!");
    }

    saveProducts(products);
    renderProducts(productSearch.value);
    renderStats();
    renderCategories();
    closeProductModal();
  }

  function deleteProduct(id) {
    const p = products.find((x) => x.id === id);
    if (!p || !confirm(`Excluir "${p.name}"?`)) return;
    products = products.filter((x) => x.id !== id);
    saveProducts(products);
    renderProducts(productSearch.value);
    renderStats();
    renderCategories();
    toast("Produto excluído.");
  }

  // ---------- Category modal ----------
  function openCategoryModal(editId, isIcon = false) {
    if (isIcon) {
      editingIconId = editId || null;
      catModalTitle.textContent = editId ? "Editar Ícone" : "Novo Ícone";
      $("#cf-icon").parentElement.style.display = "none";
      if (editId) {
        const icon = icons.find((x) => x.id === editId);
        if (!icon) return;
        $("#cf-id").value = icon.id;
        $("#cf-id").disabled = true;
        $("#cf-label").value = icon.label;
      } else {
        categoryForm.reset();
        $("#cf-id").disabled = false;
      }
    } else {
      editingCategoryId = editId || null;
      catModalTitle.textContent = editId ? "Editar categoria" : "Nova categoria";
      $("#cf-icon").parentElement.style.display = "block";
      if (editId) {
        const c = categories.find((x) => x.id === editId);
        if (!c) return;
        $("#cf-id").value = c.id;
        $("#cf-id").disabled = true;
        $("#cf-label").value = c.label;
        $("#cf-icon").value = c.icon || "projector";
      } else {
        categoryForm.reset();
        $("#cf-id").disabled = false;
      }
    }
    categoryModal.classList.remove("hidden");
  }

  function closeCategoryModal() {
    categoryModal.classList.add("hidden");
    editingCategoryId = null;
    editingIconId = null;
    categoryForm.reset();
    $("#cf-id").disabled = false;
    $("#cf-icon").parentElement.style.display = "block";
  }

  function saveCategory(e) {
    e.preventDefault();
    
    if (editingIconId !== null || catModalTitle.textContent.includes("Ícone")) {
      const data = {
        id: $("#cf-id").value.trim(),
        label: $("#cf-label").value.trim(),
      };
      
      if (editingIconId) {
        const idx = icons.findIndex((i) => i.id === editingIconId);
        if (idx !== -1) icons[idx] = { ...icons[idx], ...data };
        toast("Ícone atualizado!");
      } else {
        if (icons.find((i) => i.id === data.id)) {
          toast("ID já existe!");
          return;
        }
        icons.push(data);
        toast("Ícone adicionado!");
      }
      saveIcons(icons);
      populateIconSelects();
      closeCategoryModal();
      return;
    }

    const data = {
      id: $("#cf-id").value.trim(),
      label: $("#cf-label").value.trim(),
      icon: $("#cf-icon").value,
    };

    if (editingCategoryId) {
      const idx = categories.findIndex((c) => c.id === editingCategoryId);
      if (idx !== -1) categories[idx] = { ...categories[idx], ...data };
      toast("Categoria atualizada!");
    } else {
      if (categories.find((c) => c.id === data.id)) {
        toast("ID já existe!");
        return;
      }
      categories.push(data);
      toast("Categoria adicionada!");
    }

    saveCategories(categories);
    renderCategories();
    populateCategorySelect();
    renderProducts(productSearch.value);
    renderStats();
    closeCategoryModal();
  }

  function deleteCategory(id) {
    const c = categories.find((x) => x.id === id);
    const count = products.filter((p) => p.cat === id).length;
    if (!c || !confirm(`Excluir "${c.label}"? ${count > 0 ? `(${count} produtos vinculados)` : ""}`)) return;
    categories = categories.filter((x) => x.id !== id);
    saveCategories(categories);
    renderCategories();
    populateCategorySelect();
    renderStats();
    toast("Categoria excluída.");
  }

  function deleteIcon(id) {
    const icon = icons.find((x) => x.id === id);
    if (!icon || !confirm(`Excluir ícone "${icon.label}"?`)) return;
    icons = icons.filter((x) => x.id !== id);
    saveIcons(icons);
    populateIconSelects();
    toast("Ícone excluído.");
  }

  // ---------- Settings ----------
  async function handleSettings(e) {
    e.preventDefault();
    const newUser = $("#new-user").value.trim();
    const newPass = $("#new-pass").value;
    const confirmPass = $("#confirm-pass").value;

    if (!newUser || !newPass) {
      settingsMsg.textContent = "Preencha todos os campos.";
      settingsMsg.className = "settings-msg err";
      return;
    }
    if (newPass !== confirmPass) {
      settingsMsg.textContent = "As senhas não conferem.";
      settingsMsg.className = "settings-msg err";
      return;
    }
    if (newPass.length < 4) {
      settingsMsg.textContent = "A senha deve ter pelo menos 4 caracteres.";
      settingsMsg.className = "settings-msg err";
      return;
    }

    await setCredentials(newUser, newPass);
    settingsMsg.textContent = "Credenciais atualizadas com sucesso!";
    settingsMsg.className = "settings-msg ok";
    settingsForm.reset();
    toast("Credenciais salvas!");
  }

  // ---------- Export ----------
  function exportDataJs() {
    const productsStr = JSON.stringify(products, null, 2);
    const categoriesStr = JSON.stringify(categories, null, 2);
    const content = `// OUT LED — product data (generated by admin panel)

window.OUTLED_PRODUCTS = ${productsStr};

window.OUTLED_CATEGORIES = ${categoriesStr};
`;
    const blob = new Blob([content], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.js";
    a.click();
    URL.revokeObjectURL(url);
    toast("data.js exportado!");
  }

  // ---------- Tabs ----------
  function initTabs() {
    $$(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".tab-btn").forEach((b) => b.classList.remove("active"));
        $$(".tab-content").forEach((c) => c.classList.remove("active"));
        btn.classList.add("active");
        $(`#tab-${btn.dataset.tab}`).classList.add("active");
      });
    });
  }

  // ---------- Boot ----------
  async function boot() {
    initTabs();

    // Toggle password visibility
    togglePassBtn.addEventListener("click", () => {
      const type = loginPassInput.type === "password" ? "text" : "password";
      loginPassInput.type = type;
    });

    // Login form
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      loginError.textContent = "";
      const user = loginUserInput.value.trim();
      const pass = loginPassInput.value;

      if (!user || !pass) {
        loginError.textContent = "Preencha todos os campos.";
        return;
      }

      const ok = await authenticate(user, pass);
      if (ok) {
        startSession(user);
        showAdmin(user);
      } else {
        loginError.textContent = "Usuário ou senha incorretos.";
        $(".login-card").classList.add("shake");
        setTimeout(() => $(".login-card").classList.remove("shake"), 500);
      }
    });

    // Logout
    logoutBtn.addEventListener("click", () => {
      showLogin();
    });

    // Product search
    productSearch.addEventListener("input", () => {
      renderProducts(productSearch.value);
    });

    // Product modal
    addProductBtn.addEventListener("click", () => openProductModal());
    modalCloseBtn.addEventListener("click", closeProductModal);
    modalCancelBtn.addEventListener("click", closeProductModal);
    productForm.addEventListener("submit", saveProduct);
    productModal.addEventListener("click", (e) => {
      if (e.target === productModal) closeProductModal();
    });

    // Media handlers
    const photoUploadEl = $("#pf-photo-upload");
    const videoUploadEl = $("#pf-video-upload");
    const addPhotoBtn = $("#add-photo-url-btn");
    const addVideoBtn = $("#add-video-url-btn");
    if (photoUploadEl) photoUploadEl.addEventListener("change", handlePhotoUpload);
    if (videoUploadEl) videoUploadEl.addEventListener("change", handleVideoUpload);
    if (addPhotoBtn) addPhotoBtn.addEventListener("click", addPhotoUrl);
    if (addVideoBtn) addVideoBtn.addEventListener("click", addVideoUrl);

    // Category modal
    addCategoryBtn.addEventListener("click", () => openCategoryModal());
    catModalCloseBtn.addEventListener("click", closeCategoryModal);
    catModalCancelBtn.addEventListener("click", closeCategoryModal);
    categoryForm.addEventListener("submit", saveCategory);
    categoryModal.addEventListener("click", (e) => {
      if (e.target === categoryModal) closeCategoryModal();
    });

    // Inline Category actions in Product Modal
    const addCatInlineBtn = $("#add-cat-inline");
    const editCatInlineBtn = $("#edit-cat-inline");
    const delCatInlineBtn = $("#del-cat-inline");
    
    if (addCatInlineBtn) addCatInlineBtn.addEventListener("click", () => openCategoryModal());
    if (editCatInlineBtn) editCatInlineBtn.addEventListener("click", () => {
      const selectedId = $("#pf-cat").value;
      if (selectedId) openCategoryModal(selectedId);
      else toast("Selecione uma categoria para editar.");
    });
    if (delCatInlineBtn) delCatInlineBtn.addEventListener("click", () => {
      const selectedId = $("#pf-cat").value;
      if (selectedId) deleteCategory(selectedId);
      else toast("Selecione uma categoria para excluir.");
    });

    // Inline Icon actions in Product Modal
    const addIconInlineBtn = $("#add-icon-inline");
    const editIconInlineBtn = $("#edit-icon-inline");
    const delIconInlineBtn = $("#del-icon-inline");
    
    if (addIconInlineBtn) addIconInlineBtn.addEventListener("click", () => openCategoryModal(null, true));
    if (editIconInlineBtn) editIconInlineBtn.addEventListener("click", () => {
      const selectedId = $("#pf-icon").value;
      if (selectedId) openCategoryModal(selectedId, true);
      else toast("Selecione um ícone para editar.");
    });
    if (delIconInlineBtn) delIconInlineBtn.addEventListener("click", () => {
      const selectedId = $("#pf-icon").value;
      if (selectedId) deleteIcon(selectedId);
      else toast("Selecione um ícone para excluir.");
    });

    // Settings
    settingsForm.addEventListener("submit", handleSettings);

    // Export
    exportBtn.addEventListener("click", exportDataJs);

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeProductModal();
        closeCategoryModal();
      }
    });

    // Pular login temporariamente para facilitar o cadastro
    showAdmin("Acesso Direto");
  }

  // Dados vêm do Neon via OutLedStore — sem precisar carregar data.js
  boot();
})();
