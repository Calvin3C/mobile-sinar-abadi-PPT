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
		"P-084": "http://localhost:8000/images/products/P-084.png",
		"P-085": "http://localhost:8000/images/products/P-085.png",
		"P-086": "http://localhost:8000/images/products/P-086.png",
		"P-087": "http://localhost:8000/images/products/P-087.png",
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
