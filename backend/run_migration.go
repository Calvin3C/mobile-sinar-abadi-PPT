package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load(".env")
	
	dsn := "host=" + os.Getenv("DB_HOST") + " user=" + os.Getenv("DB_USER") + " password=" + os.Getenv("DB_PASS") + " dbname=" + os.Getenv("DB_NAME") + " port=" + os.Getenv("DB_PORT") + " sslmode=" + os.Getenv("DB_SSLMODE")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 1. Migrate stock to stock_logs
	err = db.Exec(`
		INSERT INTO stock_logs (product_id, change_type, qty_changed, final_stock, description, created_at)
		SELECT id, 'addition', stock, stock, 'Migrasi Stok dari Tabel Products', NOW()
		FROM products 
		WHERE stock > 0 
		AND id NOT IN (SELECT DISTINCT product_id FROM stock_logs);
	`).Error
	if err != nil {
		log.Printf("Migration step 1 error: %v", err)
	}

	// 2. Drop stock column
	err = db.Exec(`ALTER TABLE products DROP COLUMN IF EXISTS stock;`).Error
	if err != nil {
		log.Printf("Migration step 2 error: %v", err)
	}

	// 3. Set all sold to 0
	err = db.Exec(`UPDATE products SET sold = 0;`).Error
	if err != nil {
		log.Printf("Migration step 3 error: %v", err)
	}

	log.Println("Database successfully updated!")
}
