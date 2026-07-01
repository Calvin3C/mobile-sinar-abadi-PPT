package main

import (
	"log"
	"os"
	"strings"

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

	renames := map[string]string{
		"Plumbing":   "Perpipaan",
		"Tools":      "Perkakas",
		"Electrical": "Listrik",
	}

	// 1. Update Database
	for old, new_ := range renames {
		res := db.Exec("UPDATE products SET category = ? WHERE category = ?", new_, old)
		if res.Error != nil {
			log.Printf("Error renaming %s -> %s: %v", old, new_, res.Error)
		} else {
			log.Printf("Renamed '%s' -> '%s' (%d rows)", old, new_, res.RowsAffected)
		}
	}

	// 2. Update seed.go
	seedPath := "seed/seed.go"
	content, err := os.ReadFile(seedPath)
	if err != nil {
		log.Fatalf("Error reading seed.go: %v", err)
	}
	strContent := string(content)
	for old, new_ := range renames {
		strContent = strings.ReplaceAll(strContent, `Category: "`+old+`"`, `Category: "`+new_+`"`)
	}
	err = os.WriteFile(seedPath, []byte(strContent), 0644)
	if err != nil {
		log.Fatalf("Error writing seed.go: %v", err)
	}
	log.Println("seed.go categories updated!")
}
