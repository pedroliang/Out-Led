import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { products, categories } from "../../db/schema.js";
import { eq } from "drizzle-orm";

const SEED_CATEGORIES = [
  { id: "ventiladores", label: "Ventiladores", icon: "fan", sortOrder: 0 },
  { id: "fitas", label: "Fitas LED", icon: "strip", sortOrder: 1 },
  { id: "lampadas", label: "Lâmpadas", icon: "bulb", sortOrder: 2 },
  { id: "spots", label: "Spots & Plafons", icon: "plafon", sortOrder: 3 },
  { id: "jardim", label: "Decoração", icon: "spike", sortOrder: 4 },
];

const SEED_PRODUCTS = [
  {
    id: "vent80",
    name: "Luminária LED + Ventilador de Teto 80W E27",
    cat: "ventiladores",
    catLabel: "Ventiladores",
    oldPrice: 62.40,
    price: 39.90,
    condition: "Pequeno arranhão na base. Funcionamento perfeito.",
    desc: "Luminária com ventilador integrado, controle remoto, 3 velocidades, soquete E27. Perfeita para sala e quarto.",
    icon: "fan",
    img: "https://luzsollar.com/lj2/wp-content/uploads/2026/04/LUMINARIA_LED_E_VENTILADOR_80W_PRODUTO.png",
    photos: ["https://luzsollar.com/lj2/wp-content/uploads/2026/04/LUMINARIA_LED_E_VENTILADOR_80W_PRODUTO.png"],
    videos: [],
  },
  {
    id: "fitaled5m",
    name: "Fita LED 2835 240 LEDs 20W 6500K",
    cat: "fitas",
    catLabel: "Fitas LED",
    oldPrice: 89.90,
    price: 54.90,
    condition: "Caixa danificada no transporte. Fita perfeita.",
    desc: "Fita LED autoadesiva alta densidade, branco frio, alta luminosidade.",
    icon: "strip",
    img: "https://luzsollar.com/lj2/wp-content/uploads/2025/10/fita-led-2835-240-leds.jpg",
    photos: ["https://luzsollar.com/lj2/wp-content/uploads/2025/10/fita-led-2835-240-leds.jpg"],
    videos: [],
  },
  {
    id: "fitaneon",
    name: "Fita LED 2835 120 LEDs 3000K",
    cat: "fitas",
    catLabel: "Fitas LED",
    oldPrice: 149.90,
    price: 89.90,
    condition: "Pequeno corte na embalagem. Produto íntegro.",
    desc: "Fita LED branco quente, perfeita para sancas e ambientes aconchegantes.",
    icon: "neon",
    img: "https://luzsollar.com/lj2/wp-content/uploads/2025/10/fita-led-2835-120-leds.jpg",
    photos: ["https://luzsollar.com/lj2/wp-content/uploads/2025/10/fita-led-2835-120-leds.jpg"],
    videos: [],
  },
  {
    id: "lamp9w",
    name: "Lâmpada LED Geladeira Leitosa 3W E14",
    cat: "lampadas",
    catLabel: "Lâmpadas",
    oldPrice: 12.90,
    price: 6.90,
    condition: "Caixa amassada. Lâmpada nova.",
    desc: "Compacta, ideal para geladeira e micro-ambientes. Soquete E14.",
    icon: "bulb",
    img: "https://luzsollar.com/lj2/wp-content/uploads/2026/04/7643-GELADEIRA-LEITOSA-3W-6500K-127-230v_LAMPADA.png",
    photos: ["https://luzsollar.com/lj2/wp-content/uploads/2026/04/7643-GELADEIRA-LEITOSA-3W-6500K-127-230v_LAMPADA.png"],
    videos: [],
  },
  {
    id: "lamp15w",
    name: "Lâmpada LED Geladeira Clara 7W E14",
    cat: "lampadas",
    catLabel: "Lâmpadas",
    oldPrice: 19.90,
    price: 10.90,
    condition: "Sem caixa individual.",
    desc: "Lâmpada clara de alta luminosidade, bivolt.",
    icon: "bulb",
    img: "https://luzsollar.com/lj2/wp-content/uploads/2026/04/7642-GELADEIRA-CLARA-7W-2400K-127-230v_PRODUTO.png",
    photos: ["https://luzsollar.com/lj2/wp-content/uploads/2026/04/7642-GELADEIRA-CLARA-7W-2400K-127-230v_PRODUTO.png"],
    videos: [],
  },
  {
    id: "spotlinear",
    name: "Pendente LED Wave 72W Dourado",
    cat: "spots",
    catLabel: "Spots & Plafons",
    oldPrice: 220.00,
    price: 139.90,
    condition: "Risco visível em uma extremidade.",
    desc: "Pendente moderno design wave, dourado, perfeito para sala de jantar e mesas.",
    icon: "linear",
    img: "https://luzsollar.com/lj2/wp-content/uploads/2026/03/7593.jpg",
    photos: ["https://luzsollar.com/lj2/wp-content/uploads/2026/03/7593.jpg"],
    videos: [],
  },
  {
    id: "plafon24",
    name: "Painel ABS Sobrepor QD 22x22 18W",
    cat: "spots",
    catLabel: "Spots & Plafons",
    oldPrice: 89.00,
    price: 49.90,
    condition: "Marca de dedo no acrílico — limpa fácil.",
    desc: "Plafon quadrado sobrepor, branco neutro 4000K, vida útil 25.000h.",
    icon: "plafon",
    img: "https://luzsollar.com/lj2/wp-content/uploads/2026/04/5476_PAINEL_SOBREPOR_QUADRADO.png",
    photos: ["https://luzsollar.com/lj2/wp-content/uploads/2026/04/5476_PAINEL_SOBREPOR_QUADRADO.png"],
    videos: [],
  },
  {
    id: "espeto20",
    name: "Arandela LED Symphony 12W Dourado",
    cat: "jardim",
    catLabel: "Decoração",
    oldPrice: 65.00,
    price: 34.90,
    condition: "Pintura com micro arranhões.",
    desc: "Arandela decorativa moderna, luz quente, ideal para corredores e salas.",
    icon: "spike",
    img: "https://luzsollar.com/lj2/wp-content/uploads/2026/01/7565-arandela-symphony-12w.jpg",
    photos: ["https://luzsollar.com/lj2/wp-content/uploads/2026/01/7565-arandela-symphony-12w.jpg"],
    videos: [],
  },
  {
    id: "balizador",
    name: "Arandela LED Twist 5W Dourado",
    cat: "jardim",
    catLabel: "Decoração",
    oldPrice: 45.00,
    price: 22.90,
    condition: "Sem caixa.",
    desc: "Design twist moderno, luz indireta, efeito de parede. Acabamento dourado premium.",
    icon: "marker",
    img: "https://luzsollar.com/lj2/wp-content/uploads/2026/01/7558-arandela-twist-dourado.jpg",
    photos: ["https://luzsollar.com/lj2/wp-content/uploads/2026/01/7558-arandela-twist-dourado.jpg"],
    videos: [],
  },
];

async function seedIfEmpty() {
  const existingCats = await db.select().from(categories);
  if (existingCats.length === 0) {
    await db.insert(categories).values(SEED_CATEGORIES);
    await db.insert(products).values(
      SEED_PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        cat: p.cat,
        catLabel: p.catLabel,
        oldPrice: p.oldPrice,
        price: p.price,
        img: p.img,
        photos: p.photos,
        videos: p.videos,
        desc: p.desc,
        condition: p.condition,
        icon: p.icon,
      }))
    );
  }
}

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "loadAll") {
      await seedIfEmpty();
      const allProducts = await db.select().from(products);
      const allCategories = await db.select().from(categories);
      return new Response(
        JSON.stringify({ products: allProducts, categories: allCategories }),
        { headers }
      );
    }

    if (action === "saveProduct" && req.method === "POST") {
      const body = await req.json();
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.id, body.id));

      const data = {
        id: String(body.id),
        name: body.name,
        cat: body.cat,
        catLabel: body.catLabel || "",
        oldPrice: Number(body.oldPrice) || 0,
        price: Number(body.price) || 0,
        img: body.img || null,
        photos: body.photos || [],
        videos: body.videos || [],
        desc: body.description || body.desc || "",
        condition: body.condition || "",
        icon: body.icon || "projector",
        color: body.color || null,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        await db.update(products).set(data).where(eq(products.id, body.id));
      } else {
        await db.insert(products).values(data);
      }

      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    if (action === "deleteProduct" && req.method === "POST") {
      const body = await req.json();
      await db.delete(products).where(eq(products.id, body.id));
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    if (action === "saveCategory" && req.method === "POST") {
      const body = await req.json();
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.id, body.id));

      const data = {
        id: String(body.id),
        label: body.label,
        icon: body.icon || "projector",
        sortOrder: body.sort_order || 0,
      };

      if (existing.length > 0) {
        await db
          .update(categories)
          .set(data)
          .where(eq(categories.id, body.id));
      } else {
        await db.insert(categories).values(data);
      }

      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    if (action === "deleteCategory" && req.method === "POST") {
      const body = await req.json();
      await db.delete(categories).where(eq(categories.id, body.id));
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    return new Response(
      JSON.stringify({ error: "Unknown action: " + action }),
      { status: 400, headers }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers,
    });
  }
};

export const config: Config = {
  path: "/api/store",
};
