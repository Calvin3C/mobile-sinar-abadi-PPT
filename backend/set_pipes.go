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
		{"%Maspion%AW%", `ImageURL: "https://placehold\.co/400x300/0284c7/white\?text=Maspion\+[^"]+AW"`, "http://localhost:8000/images/products/pipa_maspion_aw.png"},
		{"%Maspion%C%", `ImageURL: "https://placehold\.co/400x300/0284c7/white\?text=Maspion\+[^"]+C"`, "http://localhost:8000/images/products/pipa_maspion_c.png"},
		{"%Maspion%D%", `ImageURL: "https://placehold\.co/400x300/0284c7/white\?text=Maspion\+[^"]+D"`, "http://localhost:8000/images/products/pipa_maspion_d.png"},
		{"%Rucika%AW%", `ImageURL: "https://placehold\.co/400x300/0284c7/white\?text=Rucika\+[^"]+AW"`, "http://localhost:8000/images/products/pipa_rucika_aw.png"},
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
