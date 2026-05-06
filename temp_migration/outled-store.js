// =====================================================================
// OUT LED — Camada de dados (data store)
// =====================================================================
// Abstração unificada para admin.js e catalog.js.
// - Se window.OUTLED_SERVER.API_URL está preenchido -> grava/lê via PHP/MySQL.
// - Caso contrário -> grava/lê em localStorage (modo offline).
//
// API pública:
//   await OutLedStore.init()
//   OutLedStore.isRemote()           -> bool
//   await OutLedStore.loadAll()      -> { products, categories }
//   await OutLedStore.saveProduct(p)
//   await OutLedStore.deleteProduct(id)
//   await OutLedStore.saveCategory(c)
//   await OutLedStore.deleteCategory(id)
//   await OutLedStore.uploadPhoto(file)   -> string (URL pública)
//   await OutLedStore.uploadVideo(file)   -> string (URL pública)
// =====================================================================

(function () {
  "use strict";

  const LS_PRODUCTS = "outled_products";
  const LS_CATEGORIES = "outled_categories";
  const LS_LEGACY_STATE = "outled_admin_state_v1";

  // --- Detectar configuração do Servidor ---
  const cfg = window.OUTLED_SERVER || {};
  const API_URL = cfg.API_URL || "";
  const REMOTE = !!API_URL;

  // --- Helpers para localStorage ---
  function lsGet(key) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch (_) { return null; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) { /* quota */ }
  }

  function readLocalProducts() {
    const direct = lsGet(LS_PRODUCTS);
    if (direct && Array.isArray(direct) && direct.length) return direct;
    const legacy = lsGet(LS_LEGACY_STATE);
    if (legacy && Array.isArray(legacy.products) && legacy.products.length) return legacy.products;
    return Array.isArray(window.OUTLED_PRODUCTS) ? window.OUTLED_PRODUCTS.slice() : [];
  }
  function readLocalCategories() {
    const direct = lsGet(LS_CATEGORIES);
    if (direct && Array.isArray(direct) && direct.length) return direct;
    const legacy = lsGet(LS_LEGACY_STATE);
    if (legacy && Array.isArray(legacy.categories) && legacy.categories.length) return legacy.categories;
    return Array.isArray(window.OUTLED_CATEGORIES) ? window.OUTLED_CATEGORIES.slice() : [];
  }
  function writeLocalProducts(arr) {
    lsSet(LS_PRODUCTS, arr);
    const legacy = lsGet(LS_LEGACY_STATE) || {};
    legacy.products = arr;
    lsSet(LS_LEGACY_STATE, legacy);
  }
  function writeLocalCategories(arr) {
    lsSet(LS_CATEGORIES, arr);
    const legacy = lsGet(LS_LEGACY_STATE) || {};
    legacy.categories = arr;
    lsSet(LS_LEGACY_STATE, legacy);
  }

  // --- Mapeamento DB <-> objeto JS ---
  function dbToProduct(row) {
    return {
      id: row.id,
      name: row.name,
      codigo: row.codigo || "",
      cat: row.cat || "",
      catLabel: row.cat_label || "",
      oldPrice: Number(row.old_price) || 0,
      price: Number(row.price) || 0,
      img: row.img || (Array.isArray(row.photos) && row.photos[0]) || null,
      photos: Array.isArray(row.photos) ? row.photos : [],
      videos: Array.isArray(row.videos) ? row.videos : [],
      desc: row.description || "",
      condition: row.condition || "",
      icon: row.icon || "projector",
      color: row.color || "",
    };
  }

  // --- Init ---
  async function init() {
    // Nada especial necessário para a API PHP
    return Promise.resolve();
  }

  // --- API pública ---
  async function loadAll() {
    if (REMOTE) {
      try {
        const res = await fetch(`${API_URL}?action=loadAll`);
        if (!res.ok) throw new Error("Erro ao carregar dados do servidor");
        const data = await res.json();
        return {
          products: (data.products || []).map(dbToProduct),
          categories: (data.categories || []).map(c => ({ id: c.id, label: c.label, icon: c.icon || "projector" })),
        };
      } catch (e) {
        console.error("[OutLedStore] Falha ao conectar com API, usando localStorage.", e);
      }
    }
    return {
      products: readLocalProducts(),
      categories: readLocalCategories(),
    };
  }

  async function saveProduct(p) {
    if (REMOTE) {
      const res = await fetch(`${API_URL}?action=saveProduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: String(p.id),
          name: p.name,
          codigo: p.codigo,
          cat: p.cat,
          catLabel: p.catLabel,
          oldPrice: p.oldPrice,
          price: p.price,
          img: p.img,
          photos: p.photos,
          videos: p.videos,
          description: p.desc,
          condition: p.condition,
          icon: p.icon,
          color: p.color
        })
      });
      if (!res.ok) throw new Error("Erro ao salvar produto no servidor");
      return p;
    }
    const list = readLocalProducts();
    const idx = list.findIndex(x => x.id === p.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...p };
    else list.push(p);
    writeLocalProducts(list);
    return p;
  }

  async function deleteProduct(id) {
    if (REMOTE) {
      const res = await fetch(`${API_URL}?action=deleteProduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error("Erro ao excluir produto no servidor");
      return;
    }
    writeLocalProducts(readLocalProducts().filter(p => p.id !== id));
  }

  async function saveCategory(c, sortOrder) {
    if (REMOTE) {
      const res = await fetch(`${API_URL}?action=saveCategory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: String(c.id),
          label: c.label,
          icon: c.icon,
          sort_order: sortOrder || 0
        })
      });
      if (!res.ok) throw new Error("Erro ao salvar categoria no servidor");
      return c;
    }
    const list = readLocalCategories();
    const idx = list.findIndex(x => x.id === c.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...c };
    else list.push(c);
    writeLocalCategories(list);
    return c;
  }

  async function deleteCategory(id) {
    if (REMOTE) {
      const res = await fetch(`${API_URL}?action=deleteCategory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error("Erro ao excluir categoria no servidor");
      return;
    }
    writeLocalCategories(readLocalCategories().filter(c => c.id !== id));
  }

  async function uploadFile(file, prefix) {
    if (!REMOTE) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("prefix", prefix);

    const res = await fetch(`${API_URL}?action=upload`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("Erro no upload do arquivo");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.url;
  }

  async function uploadPhoto(file) { return uploadFile(file, "photos"); }
  async function uploadVideo(file) { return uploadFile(file, "videos"); }

  window.OutLedStore = {
    init,
    isRemote: () => REMOTE,
    loadAll,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    uploadPhoto,
    uploadVideo,
    // helpers para o legacy code
    _writeLocalProducts: writeLocalProducts,
    _writeLocalCategories: writeLocalCategories,
  };
})();
