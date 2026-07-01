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
	
	var toko models.Warehouse
	result := config.DB.Where("LOWER(name) LIKE ?", "%toko%").First(&toko)
	if result.Error != nil {
		toko = models.Warehouse{
			Name:        "Toko",
			Description: "Gudang Utama / Toko",
			IsActive:    true,
		}
		config.DB.Create(&toko)
		log.Println("Toko warehouse created.")
	} else {
		log.Println("Toko already exists.")
	}
}
