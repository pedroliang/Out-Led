// =====================================================================
// OUT LED — Camada de dados (Neon HTTP, 100% navegador)
// =====================================================================
// Este arquivo é o ÚNICO ponto que conversa com o banco. Não usa backend.
// Funciona direto no GitHub Pages, abrindo conexão HTTP com o Neon.
//
// Duas credenciais:
//   - PUBLIC (read-only): embutida aqui — todo visitante usa.
//   - ADMIN (read+write): colada pelo dono no Modo Edição, fica salva
//     no localStorage só do aparelho dele.
//
// API pública (igual antes — não precisa mexer em catalog.js / admin.js):
//   await OutLedStore.init()
//   OutLedStore.isRemote()                 -> bool (sempre true aqui)
//   OutLedStore.hasAdminCredentials()      -> bool
//   OutLedStore.setAdminCredentials(url)   -> Promise<bool>
//   OutLedStore.clearAdminCredentials()
//   await OutLedStore.loadAll()
//   await OutLedStore.saveProduct(p)
//   await OutLedStore.deleteProduct(id)
//   await OutLedStore.saveCategory(c, sortOrder)
//   await OutLedStore.deleteCategory(id)
//   await OutLedStore.uploadPhoto(file)    -> data URL (base64)
//   await OutLedStore.uploadVideo(file)    -> data URL (base64)
// =====================================================================

(function () {
  "use strict";

  // ---------- Credencial pública (read-only) ----------
  // Esta connection string só pode SELECT em products/categories.
  // Tentativas de INSERT/UPDATE/DELETE são rejeitadas pelo Postgres.
  const PUBLIC_RO_URL =
    "postgresql://public_ro:DphLXPru9KybTuYicnpj" +
    "@ep-flat-moon-ac4ya8nv-pooler.sa-east-1.aws.neon.tech" +
    "/neondb?sslmode=require";

  // ---------- Credencial admin ----------
  const LS_ADMIN_URL = "outled_admin_db_url";
  function getAdminUrl() {
    try { return localStorage.getItem(LS_ADMIN_URL) || ""; }
    catch (_) { return ""; }
  }
  function setAdminUrl(url) {
    try { localStorage.setItem(LS_ADMIN_URL, url || ""); } catch (_) {}
  }
  function clearAdminUrl() {
    try { localStorage.removeItem(LS_ADMIN_URL); } catch (_) {}
  }

  // ---------- Driver Neon HTTP (carregado via ESM dinâmico) ----------
  // Faz fetch para o endpoint /sql do Neon. O driver é único globalmente.
  let neonDriverPromise = null;
  function loadDriver() {
    if (!neonDriverPromise) {
      neonDriverPromise = import(
        "https://esm.sh/@neondatabase/serverless@0.9.5"
      );
    }
    return neonDriverPromise;
  }

  async function sqlClient(connStr) {
    const mod = await loadDriver();
    return mod.neon(connStr);
  }

  // ---------- Helpers ----------
  function toBool(v) { return !!(v && String(v).trim()); }

  function dbToProduct(row) {
    return {
      id: row.id,
      name: row.name || "",
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
  function dbToCategory(row) {
    return {
      id: row.id,
      label: row.label || "",
      icon: row.icon || "projector",
    };
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // ---------- API pública ----------
  async function init() {
    // pré-aquece o driver
    try { await loadDriver(); } catch (_) {}
  }

  function isRemote() { return true; }

  function hasAdminCredentials() { return toBool(getAdminUrl()); }

  async function setAdminCredentials(url) {
    if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
      throw new Error("Connection string inválida. Cole a string que começa com postgresql:// fornecida pelo Neon.");
    }
    // Testa: precisa conseguir um INSERT/DELETE (vamos validar com um SELECT
    // simples e uma operação que role-write conseguiria — sem alterar nada).
    const sql = await sqlClient(url);
    try {
      // Validação leve: a role precisa ter permissão pra escrever
      // em products. Usamos has_table_privilege.
      const rows = await sql`
        SELECT has_table_privilege(current_user, 'products', 'INSERT') AS can_write
      `;
      if (!rows[0] || !rows[0].can_write) {
        throw new Error("Esta credencial não tem permissão de escrita. Use a connection string da role 'neondb_owner' (admin).");
      }
    } catch (e) {
      throw new Error("Falha ao validar credencial: " + (e.message || e));
    }
    setAdminUrl(url);
    return true;
  }

  function clearAdminCredentials() { clearAdminUrl(); }

  async function getReadClient() { return sqlClient(PUBLIC_RO_URL); }

  async function getWriteClient() {
    const url = getAdminUrl();
    if (!url) throw new Error("Credencial admin não configurada. Entre em Modo Edição e cole a connection string.");
    return sqlClient(url);
  }

  // ---------- loadAll ----------
  async function loadAll() {
    try {
      const sql = await getReadClient();
      const products = await sql`SELECT * FROM products ORDER BY created_at ASC`;
      const categories = await sql`SELECT * FROM categories ORDER BY sort_order ASC`;
      return {
        products: products.map(dbToProduct),
        categories: categories.map(dbToCategory),
      };
    } catch (e) {
      console.error("[OutLedStore.loadAll] falha:", e);
      throw new Error("Não consegui ler do banco Neon: " + (e.message || e));
    }
  }

  // ---------- saveProduct (upsert) ----------
  async function saveProduct(p) {
    const sql = await getWriteClient();
    // Casts explícitos para o Postgres conseguir inferir o tipo
    // mesmo quando o valor é null.
    await sql`
      INSERT INTO products (
        id, name, codigo, cat, cat_label, old_price, price,
        img, photos, videos, description, condition, icon, color, updated_at
      ) VALUES (
        ${String(p.id)}::varchar,
        ${p.name || ""}::varchar,
        ${p.codigo || null}::varchar,
        ${p.cat || null}::varchar,
        ${p.catLabel || null}::varchar,
        ${Number(p.oldPrice) || 0}::numeric,
        ${Number(p.price) || 0}::numeric,
        ${p.img || null}::text,
        ${JSON.stringify(p.photos || [])}::jsonb,
        ${JSON.stringify(p.videos || [])}::jsonb,
        ${p.desc || null}::text,
        ${p.condition || null}::varchar,
        ${p.icon || null}::varchar,
        ${p.color || null}::varchar,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        codigo = EXCLUDED.codigo,
        cat = EXCLUDED.cat,
        cat_label = EXCLUDED.cat_label,
        old_price = EXCLUDED.old_price,
        price = EXCLUDED.price,
        img = EXCLUDED.img,
        photos = EXCLUDED.photos,
        videos = EXCLUDED.videos,
        description = EXCLUDED.description,
        condition = EXCLUDED.condition,
        icon = EXCLUDED.icon,
        color = EXCLUDED.color,
        updated_at = NOW()
    `;
    return p;
  }

  async function deleteProduct(id) {
    const sql = await getWriteClient();
    await sql`DELETE FROM products WHERE id = ${String(id)}::varchar`;
  }

  // ---------- saveCategory ----------
  async function saveCategory(c, sortOrder) {
    const sql = await getWriteClient();
    await sql`
      INSERT INTO categories (id, label, icon, sort_order, updated_at)
      VALUES (
        ${String(c.id)}::varchar,
        ${c.label || ""}::varchar,
        ${c.icon || null}::varchar,
        ${Number(sortOrder) || 0}::int,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label,
        icon = EXCLUDED.icon,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `;
    return c;
  }

  async function deleteCategory(id) {
    const sql = await getWriteClient();
    await sql`DELETE FROM categories WHERE id = ${String(id)}::varchar`;
  }

  // ---------- Upload (mantém base64 — não tem servidor) ----------
  async function uploadPhoto(file) { return fileToDataUrl(file); }
  async function uploadVideo(file) { return fileToDataUrl(file); }

  // ---------- Exposição global ----------
  window.OutLedStore = {
    init,
    isRemote,
    hasAdminCredentials,
    setAdminCredentials,
    clearAdminCredentials,
    loadAll,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    uploadPhoto,
    uploadVideo,
  };
})();
