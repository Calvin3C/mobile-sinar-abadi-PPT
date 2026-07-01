package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	godotenv.Load(".env")
	dsn := "host=" + os.Getenv("DB_HOST") + " user=" + os.Getenv("DB_USER") + " password=" + os.Getenv("DB_PASS") + " dbname=" + os.Getenv("DB_NAME") + " port=" + os.Getenv("DB_PORT") + " sslmode=" + os.Getenv("DB_SSLMODE")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Error connecting: %v", err)
	}

	urls := map[string]string{
		"P-077": "http://localhost:8000/images/products/kloset_duty.png",
		"P-078": "http://localhost:8000/images/products/monoblok_ina.png",
		"P-079": "http://localhost:8000/images/products/monoblok_triliun.png",
		"P-080": "http://localhost:8000/images/products/monoblok_volk.png",
		"P-057": "http://localhost:8000/images/products/cat_aquaproof.png",
		"P-058": "http://localhost:8000/images/products/cat_aquaproof.png",
	}

	for id, url := range urls {
		err = db.Exec("UPDATE products SET image_url = ? WHERE id = ?", url, id).Error
		if err != nil {
			log.Printf("Error updating %s: %v", id, err)
		} else {
			log.Printf("Updated %s to %s", id, url)
		}
	}
}
