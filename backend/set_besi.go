package main

import (
	"log"
	"os"
	"regexp"

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

	pattern := "%Besi Beton%"
	regex := `ImageURL: "https://placehold\.co/400x300/475569/white\?text=Besi\+Beton[^"]+"`
	url := "http://localhost:8000/images/products/besi_beton.png"

	res := db.Exec("UPDATE products SET image_url = ? WHERE name LIKE ?", url, pattern)
	log.Printf("Updated %d rows in DB for %s", res.RowsAffected, pattern)

	seedPath := "seed/seed.go"
	content, err := os.ReadFile(seedPath)
	if err == nil {
		strContent := string(content)
		re := regexp.MustCompile(regex)
		replacement := `ImageURL: "` + url + `"`
		strContent = re.ReplaceAllString(strContent, replacement)
		os.WriteFile(seedPath, []byte(strContent), 0644)
	}
}
