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
	var warehouses []models.Warehouse
	config.DB.Find(&warehouses)
	for _, w := range warehouses {
		log.Printf("Warehouse: %d - %s", w.ID, w.Name)
	}
}
