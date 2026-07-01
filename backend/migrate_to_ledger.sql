-- ============================================================================
-- Migrasi: Pindahkan kolom stock dari tabel products ke stock_logs
-- 
-- Tabel products hanya untuk data produk, 
-- sedangkan stock_logs berfokus untuk pencatatan stok.
-- ============================================================================

-- 1. Migrasikan stok yang ada dari products ke stock_logs (untuk produk yang belum punya log)
INSERT INTO stock_logs (product_id, change_type, qty_changed, final_stock, description, created_at)
SELECT id, 'addition', stock, stock, 'Migrasi Stok dari Tabel Products', NOW()
FROM products 
WHERE stock > 0 
AND id NOT IN (SELECT DISTINCT product_id FROM stock_logs);

-- 2. Hapus kolom stock dari tabel products
ALTER TABLE products DROP COLUMN IF EXISTS stock;

-- 3. (Opsional) Buat View untuk melihat stok terkini setiap produk
CREATE OR REPLACE VIEW v_product_stocks AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    COALESCE(SUM(sl.qty_changed), 0) AS current_stock
FROM 
    products p
LEFT JOIN 
    stock_logs sl ON p.id = sl.product_id
GROUP BY 
    p.id, p.name;
