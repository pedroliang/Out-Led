import { pgTable, text, doublePrecision, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  icon: text("icon").notNull().default("projector"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cat: text("cat").notNull().references(() => categories.id, { onDelete: "set null" }),
  catLabel: text("cat_label").notNull().default(""),
  oldPrice: doublePrecision("old_price").notNull().default(0),
  price: doublePrecision("price").notNull().default(0),
  img: text("img"),
  photos: jsonb("photos").$type<string[]>().default([]),
  videos: jsonb("videos").$type<string[]>().default([]),
  desc: text("description").default(""),
  condition: text("condition").default(""),
  icon: text("icon").default("projector"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
