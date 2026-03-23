-- ================================================================
-- Inserção de clientes MS/PR — sem duplicar por (nome, uf)
-- Execute no console SQL do Neon
-- ================================================================

DO $$
DECLARE
  v_status  INTEGER;
  v_s_ms    INTEGER;
  v_s_pr    INTEGER;
BEGIN
  -- Status "Contatado"
  SELECT id INTO v_status FROM status WHERE LOWER(nome) = 'contatado' LIMIT 1;

  -- Vendedor responsável por MS e PR (Thiago)
  SELECT s.id INTO v_s_ms
    FROM sellers s JOIN seller_ufs su ON s.id = su.seller_id
    WHERE su.uf = 'MS' LIMIT 1;

  SELECT s.id INTO v_s_pr
    FROM sellers s JOIN seller_ufs su ON s.id = su.seller_id
    WHERE su.uf = 'PR' LIMIT 1;

  -- 1. santanabikeshopms (nota 2, tem WA)
  INSERT INTO clients (nome, cidade, uf, whatsapp, site, nota, status_id, seller_id)
  SELECT 'santanabikeshopms','Campo Grande','MS','6730268643',
         'https://www.santanabikeshop.com.br/', 2, v_status, v_s_ms
  WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE LOWER(TRIM(nome)) = 'santanabikeshopms' AND uf = 'MS');

  -- 2. ciclotonims (sem contato)
  INSERT INTO clients (nome, cidade, uf, nota, status_id, seller_id)
  SELECT 'ciclotonims','Campo Grande','MS', 1, v_status, v_s_ms
  WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE LOWER(TRIM(nome)) = 'ciclotonims' AND uf = 'MS');

  -- 3. Gilmar Bicicletas
  INSERT INTO clients (nome, cidade, uf, whatsapp, site, nota, status_id, seller_id)
  SELECT 'Gilmar Bicicletas','Campo Grande','MS','6733841118',
         'http://www.gilmarbicicletas.com.br/', 1, v_status, v_s_ms
  WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE LOWER(TRIM(nome)) = 'gilmar bicicletas' AND uf = 'MS');

  -- 4. arcanjosbikeshop
  INSERT INTO clients (nome, cidade, uf, whatsapp, nota, status_id, seller_id)
  SELECT 'arcanjosbikeshop','Campo Grande','MS','67992869245', 1, v_status, v_s_ms
  WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE LOWER(TRIM(nome)) = 'arcanjosbikeshop' AND uf = 'MS');

  -- 5. Alex Ribeiro Sports (PR, WA=celular, instagram)
  INSERT INTO clients (nome, cidade, uf, whatsapp, instagram, nota, status_id, seller_id)
  SELECT 'Alex Ribeiro Sports','Curitiba','PR','41992676838',
         'alexribeiro.sports', 1, v_status, v_s_pr
  WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE LOWER(TRIM(nome)) = 'alex ribeiro sports' AND uf = 'PR');

  -- 6. Concept Bike Shop (WA do Concept é diferente do telefone — usando só o tel fixo)
  INSERT INTO clients (nome, cidade, uf, nota, status_id, seller_id)
  SELECT 'Concept Bike Shop','Campo Grande','MS', 1, v_status, v_s_ms
  WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE LOWER(TRIM(nome)) = 'concept bike shop' AND uf = 'MS');

  -- 7. iuri.wb (WA 6791855440)
  INSERT INTO clients (nome, cidade, uf, whatsapp, nota, status_id, seller_id)
  SELECT 'iuri.wb','Campo Grande','MS','6791855440', 1, v_status, v_s_ms
  WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE LOWER(TRIM(nome)) = 'iuri.wb' AND uf = 'MS');

  -- 8. ciclo_mar (WA via link)
  INSERT INTO clients (nome, cidade, uf, whatsapp, nota, status_id, seller_id)
  SELECT 'ciclo_mar','Campo Grande','MS','6799533282', 1, v_status, v_s_ms
  WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE LOWER(TRIM(nome)) = 'ciclo_mar' AND uf = 'MS');

  -- 9. gino_bikesz0
  INSERT INTO clients (nome, cidade, uf, whatsapp, nota, status_id, seller_id)
  SELECT 'gino_bikesz0','Campo Grande','MS','6792901038', 1, v_status, v_s_ms
  WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE LOWER(TRIM(nome)) = 'gino_bikesz0' AND uf = 'MS');

  -- 10. luanbikeof_
  INSERT INTO clients (nome, cidade, uf, nota, status_id, seller_id)
  SELECT 'luanbikeof_','Campo Grande','MS', 1, v_status, v_s_ms
  WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE LOWER(TRIM(nome)) = 'luanbikeof_' AND uf = 'MS');

  -- 11. lucas_bikecg
  INSERT INTO clients (nome, cidade, uf, nota, status_id, seller_id)
  SELECT 'lucas_bikecg','Campo Grande','MS', 1, v_status, v_s_ms
  WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE LOWER(TRIM(nome)) = 'lucas_bikecg' AND uf = 'MS');

  -- 12. bikeeletricasaad (nota 2, WA)
  INSERT INTO clients (nome, cidade, uf, whatsapp, nota, status_id, seller_id)
  SELECT 'bikeeletricasaad','Campo Grande','MS','6791775923', 2, v_status, v_s_ms
  WHERE NOT EXISTS (
    SELECT 1 FROM clients WHERE LOWER(TRIM(nome)) = 'bikeeletricasaad' AND uf = 'MS');

  RAISE NOTICE 'Inserção concluída. Clientes já existentes foram ignorados.';
END $$;
