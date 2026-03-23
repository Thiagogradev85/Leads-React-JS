-- Migration: renomeia nome → tipo e remove o NOT NULL
-- Se a coluna nome existe, renomeia para tipo
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='products' AND column_name='nome') THEN
    ALTER TABLE products RENAME COLUMN nome TO tipo;
    ALTER TABLE products ALTER COLUMN tipo DROP NOT NULL;
  END IF;
  -- Garante que tipo existe (caso já tenha sido adicionada antes)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='tipo') THEN
    ALTER TABLE products ADD COLUMN tipo VARCHAR(100);
  END IF;
END $$;
