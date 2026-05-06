-- =====================================================================
-- OUT LED — MySQL schema
-- =====================================================================
-- Como usar:
--   1. Acesse o phpMyAdmin em https://177.95.115.5:2087/pma/
--   2. Selecione o banco de dados 'exp_test'
--   3. Vá na aba "SQL" e cole este conteúdo
--   4. Clique em "Executar"
-- =====================================================================

-- 1. Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(100) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  icon VARCHAR(100),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  codigo VARCHAR(100),
  cat VARCHAR(100),
  cat_label VARCHAR(255),
  old_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  img TEXT,                   -- foto principal (URL pública)
  photos JSON,                -- Array de URLs em formato JSON
  videos JSON,                -- Array de URLs em formato JSON
  description TEXT,
  `condition` VARCHAR(100),
  icon VARCHAR(100),
  color VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_category FOREIGN KEY (cat) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_products_cat ON products(cat);
