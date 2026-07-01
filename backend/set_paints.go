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

	mappings := []struct {
		pattern string // For SQL LIKE
		regex   string // For seed.go replacement
		url     string
	}{
		{"%Decolith%", `ImageURL: "https://placehold\.co/400x300/dc2626/white\?text=Decolith[^"]+"`, "http://localhost:8000/images/products/cat_decolith.png"},
		{"%Avitex%", `ImageURL: "https://placehold\.co/400x300/dc2626/white\?text=Avitex[^"]+"`, "http://localhost:8000/images/products/cat_avitex.png"},
		{"%No. Drop%", `ImageURL: "https://placehold\.co/400x300/dc2626/white\?text=No\+Drop[^"]+"`, "http://localhost:8000/images/products/cat_nodrop.png"},
		{"%Aquaproof%", `ImageURL: "https://placehold\.co/400x300/dc2626/white\?text=Aquaproof[^"]+"`, "http://localhost:8000/images/products/cat_aquaproof.png"},
		{"%Aries%", `ImageURL: "https://placehold\.co/400x300/dc2626/white\?text=Aries[^"]+"`, "http://localhost:8000/images/products/cat_aries.png"},
		{"%Emco%", `ImageURL: "https://placehold\.co/400x300/b91c1c/white\?text=Emco[^"]+"`, "http://localhost:8000/images/products/cat_emco.png"},
		{"%Avian%", `ImageURL: "https://placehold\.co/400x300/b91c1c/white\?text=Avian[^"]+"`, "http://localhost:8000/images/products/cat_avian.png"},
	}

	// 1. Update Database
	for _, m := range mappings {
		res := db.Exec("UPDATE products SET image_url = ? WHERE name LIKE ?", m.url, m.pattern)
		if res.Error != nil {
			log.Printf("Error updating DB for %s: %v", m.pattern, res.Error)
		} else {
			log.Printf("Updated %d rows in DB for %s", res.RowsAffected, m.pattern)
		}
	}

	// 2. Update seed.go
	seedPath := "seed/seed.go"
	content, err := os.ReadFile(seedPath)
	if err != nil {
		log.Fatalf("Error reading seed.go: %v", err)
	}

	strContent := string(content)
	for _, m := range mappings {
		re := regexp.MustCompile(m.regex)
		replacement := `ImageURL: "` + m.url + `"`
		strContent = re.ReplaceAllString(strContent, replacement)
	}

	err = os.WriteFile(seedPath, []byte(strContent), 0644)
	if err != nil {
		log.Fatalf("Error writing seed.go: %v", err)
	}
	
	log.Println("seed.go successfully updated.")
}
