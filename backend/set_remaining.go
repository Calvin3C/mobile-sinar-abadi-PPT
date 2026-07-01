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

	base := "http://localhost:8000/images/products/"

	dbMappings := []struct {
		pattern string
		url     string
	}{
		// Kuas Roll Imundex
		{"Kuas Roll Imundex%", base + "kuas_roll_imundex.png"},
		// Kunci Pintu per merek
		{"Kunci Pintu Zeona%", base + "kunci_pintu_zeona.png"},
		{"Kunci Pintu WanLi%", base + "kunci_pintu_wanli.png"},
		{"Kunci Pintu Muller%", base + "kunci_pintu_muller.png"},
		{"Kunci Pintu Kuda%", base + "kunci_pintu.png"},
		// Meteran, Palu (already have images from previous session, re-apply)
		{"Meteran Tukang%", base + "meteran_tukang.png"},
		{"Palu Tukang Supit%", base + "palu_supit.png"},
		{"Palu Tukang Kotak%", base + "palu_kotak.png"},
	}

	totalUpdated := int64(0)
	for _, m := range dbMappings {
		res := db.Exec("UPDATE products SET image_url = ? WHERE name LIKE ?", m.url, m.pattern)
		if res.Error != nil {
			log.Printf("Error updating DB for %s: %v", m.pattern, res.Error)
		} else {
			log.Printf("Updated %d rows for '%s'", res.RowsAffected, m.pattern)
			totalUpdated += res.RowsAffected
		}
	}
	log.Printf("Total DB rows updated: %d", totalUpdated)

	// Update seed.go
	seedPath := "seed/seed.go"
	content, err := os.ReadFile(seedPath)
	if err != nil {
		log.Fatalf("Error reading seed.go: %v", err)
	}

	seedMappings := []struct {
		regex       string
		replacement string
	}{
		{`ImageURL: "[^"]*"(, InitialStock.+Kuas Roll Imundex)`, `ImageURL: "` + base + `kuas_roll_imundex.png"$1`},
		{`ImageURL: "[^"]*"(, InitialStock.+Kunci Pintu Zeona)`, `ImageURL: "` + base + `kunci_pintu_zeona.png"$1`},
		{`ImageURL: "[^"]*"(, InitialStock.+Kunci Pintu WanLi)`, `ImageURL: "` + base + `kunci_pintu_wanli.png"$1`},
		{`ImageURL: "[^"]*"(, InitialStock.+Kunci Pintu Muller)`, `ImageURL: "` + base + `kunci_pintu_muller.png"$1`},
		{`ImageURL: "[^"]*"(, InitialStock.+Kunci Pintu Kuda)`, `ImageURL: "` + base + `kunci_pintu.png"$1`},
	}

	strContent := string(content)
	for _, m := range seedMappings {
		re := regexp.MustCompile(m.regex)
		strContent = re.ReplaceAllString(strContent, m.replacement)
	}

	err = os.WriteFile(seedPath, []byte(strContent), 0644)
	if err != nil {
		log.Fatalf("Error writing seed.go: %v", err)
	}

	log.Println("seed.go successfully updated!")
}
