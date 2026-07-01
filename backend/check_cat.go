package main

import (
	"log"
	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	config.ConnectDatabase()
	var categories []string
	config.DB.Model(&models.Product{}).Distinct("category").Pluck("category", &categories)
	log.Println("Categories:", categories)
}
