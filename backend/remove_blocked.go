package main

import (
	"log"

	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"
)

func main() {
	config.ConnectDatabase()
	db := config.DB

	log.Println("Dropping is_blocked column from customers and admins...")

	if db.Migrator().HasColumn(&models.Customer{}, "is_blocked") {
		if err := db.Migrator().DropColumn(&models.Customer{}, "is_blocked"); err != nil {
			log.Fatalf("Failed to drop column from customers: %v", err)
		}
	}

	if db.Migrator().HasColumn(&models.Admin{}, "is_blocked") {
		if err := db.Migrator().DropColumn(&models.Admin{}, "is_blocked"); err != nil {
			log.Fatalf("Failed to drop column from admins: %v", err)
		}
	}

	log.Println("Success dropping columns.")
}
