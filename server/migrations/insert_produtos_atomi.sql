-- ================================================================
-- Produtos ATOMI — Catálogo março 2026
-- Execute no SQL Editor do Neon
-- Usa o primeiro catálogo encontrado (Pack Showroom)
-- ================================================================

DO $$
DECLARE
  v_cat INTEGER;
BEGIN
  -- Pega o ID do catálogo (Pack Showroom ou o primeiro disponível)
  SELECT id INTO v_cat FROM catalogs ORDER BY id LIMIT 1;

  IF v_cat IS NULL THEN
    RAISE EXCEPTION 'Nenhum catálogo encontrado. Crie um catálogo antes.';
  END IF;

  -- 1. patinete C1
  INSERT INTO products (catalog_id, tipo, modelo, velocidade_max, autonomia, motor, bateria, estoque)
  SELECT v_cat, 'patinete', 'C1', 30, '40 km', '650w', '36v 7.6ah', 0
  WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE catalog_id = v_cat AND modelo = 'C1');

  -- 2. patinete L10
  INSERT INTO products (catalog_id, tipo, modelo, velocidade_max, autonomia, motor, bateria, estoque)
  SELECT v_cat, 'patinete', 'L10', 40, '50 km', '1000w', '48v 12.6ah', 0
  WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE catalog_id = v_cat AND modelo = 'L10');

  -- 3. bicicleta ZX-161
  INSERT INTO products (catalog_id, tipo, modelo, velocidade_max, autonomia, motor, bateria, estoque)
  SELECT v_cat, 'bicicleta', 'ZX-161', 32, '40 km', '650w', '36v 7.8ah', 0
  WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE catalog_id = v_cat AND modelo = 'ZX-161');

  -- 4. bicicleta ZX-201
  INSERT INTO products (catalog_id, tipo, modelo, velocidade_max, autonomia, motor, bateria, estoque)
  SELECT v_cat, 'bicicleta', 'ZX-201', 50, '80 km', '1000w', '48v 13ah', 0
  WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE catalog_id = v_cat AND modelo = 'ZX-201');

  -- 5. bicicleta ZX202
  INSERT INTO products (catalog_id, tipo, modelo, velocidade_max, autonomia, motor, bateria, estoque)
  SELECT v_cat, 'bicicleta', 'ZX202', 50, '80 km', '750W-1000W', '48V 13Ah', 0
  WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE catalog_id = v_cat AND modelo = 'ZX202');

  -- 6. bicicleta M-201
  INSERT INTO products (catalog_id, tipo, modelo, velocidade_max, autonomia, motor, bateria, estoque)
  SELECT v_cat, 'bicicleta', 'M-201', 50, '80 km', '1000w', '48v 13ah', 0
  WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE catalog_id = v_cat AND modelo = 'M-201');

  RAISE NOTICE 'Produtos inseridos com sucesso no catálogo ID=%', v_cat;
END $$;
