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

	// DB mappings: SQL LIKE pattern -> image file
	dbMappings := []struct {
		pattern string
		url     string
	}{
		{"Kloset Jongkok%", base + "kloset_jongkok.png"},
		{"Monoblok%", base + "monoblok.png"},
		{"Kuas Eterna%", base + "kuas_eterna.png"},
		{"Kuas Roll%", base + "kuas_roll.png"},
		{"Engsel Pintu%", base + "engsel_pintu.png"},
		{"Engsel Lemari%", base + "engsel_lemari.png"},
		{"Keramik Lantai%", base + "keramik_lantai.png"},
		{"Keramik Dinding%", base + "keramik_dinding.png"},
		{"Granite%", base + "granite_tile.png"},
		{"Meteran Tukang%", base + "meteran_tukang.png"},
		{"Palu Tukang Supit%", base + "palu_supit.png"},
		{"Palu Tukang Kotak%", base + "palu_kotak.png"},
		{"Kunci Pintu%", base + "kunci_pintu.png"},
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

	// Update seed.go with regex replacements
	seedPath := "seed/seed.go"
	content, err := os.ReadFile(seedPath)
	if err != nil {
		log.Fatalf("Error reading seed.go: %v", err)
	}

	seedMappings := []struct {
		regex       string
		replacement string
	}{
		{`ImageURL: "https://placehold\.co/400x300/[^/]+/white\?text=Kloset\+Jongkok[^"]+"`, `ImageURL: "` + base + `kloset_jongkok.png"`},
		{`ImageURL: "https://placehold\.co/400x300/[^/]+/white\?text=Monoblok[^"]+"`, `ImageURL: "` + base + `monoblok.png"`},
		{`ImageURL: "https://placehold\.co/400x300/[^/]+/white\?text=Kuas\+Eterna[^"]+"`, `ImageURL: "` + base + `kuas_eterna.png"`},
		{`ImageURL: "https://placehold\.co/400x300/[^/]+/white\?text=Kuas\+Roll[^"]+"`, `ImageURL: "` + base + `kuas_roll.png"`},
		{`ImageURL: "https://placehold\.co/400x300/[^/]+/white\?text=Engsel\+Pintu[^"]+"`, `ImageURL: "` + base + `engsel_pintu.png"`},
		{`ImageURL: "https://placehold\.co/400x300/[^/]+/white\?text=Engsel\+Lemari[^"]+"`, `ImageURL: "` + base + `engsel_lemari.png"`},
		{`ImageURL: "https://placehold\.co/400x300/[^/]+/white\?text=Keramik\+Lantai[^"]+"`, `ImageURL: "` + base + `keramik_lantai.png"`},
		{`ImageURL: "https://placehold\.co/400x300/[^/]+/white\?text=Keramik\+Dinding[^"]+"`, `ImageURL: "` + base + `keramik_dinding.png"`},
		{`ImageURL: "https://placehold\.co/400x300/[^/]+/white\?text=Granite[^"]+"`, `ImageURL: "` + base + `granite_tile.png"`},
		{`ImageURL: "https://placehold\.co/400x300/[^/]+/white\?text=Meteran[^"]+"`, `ImageURL: "` + base + `meteran_tukang.png"`},
		{`ImageURL: "https://placehold\.co/400x300/[^/]+/white\?text=Palu\+Supit[^"]+"`, `ImageURL: "` + base + `palu_supit.png"`},
		{`ImageURL: "https://placehold\.co/400x300/[^/]+/white\?text=Palu\+Kotak[^"]+"`, `ImageURL: "` + base + `palu_kotak.png"`},
		{`ImageURL: "https://placehold\.co/400x300/[^/]+/white\?text=Kunci\+Pintu[^"]+"`, `ImageURL: "` + base + `kunci_pintu.png"`},
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
