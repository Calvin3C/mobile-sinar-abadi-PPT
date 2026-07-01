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
		"P-120": "http://localhost:8000/images/products/engsel_muller.png",
		"P-121": "http://localhost:8000/images/products/engsel_muller.png",
		"P-122": "http://localhost:8000/images/products/engsel_muller.png",
		"P-123": "http://localhost:8000/images/products/engsel_nishio.png",
		"P-124": "http://localhost:8000/images/products/engsel_nishio.png",
		"P-125": "http://localhost:8000/images/products/engsel_nishio.png",
		"P-126": "http://localhost:8000/images/products/engsel_lemari.png",
		"P-127": "http://localhost:8000/images/products/engsel_lemari.png",
		"P-128": "http://localhost:8000/images/products/engsel_lemari.png",
		"P-075": "http://localhost:8000/images/products/kloset_ina.png",
		"P-076": "http://localhost:8000/images/products/kloset_triliun.png",
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
