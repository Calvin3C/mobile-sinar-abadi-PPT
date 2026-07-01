package main

import (
	"log"
	"os"
	"sinar-abadi-backend/models"
	"sinar-abadi-backend/seed"

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

	log.Println("Dropping all tables...")
	err = db.Migrator().DropTable(
		&models.Customer{},
		&models.Admin{},
		&models.Owner{},
		&models.Product{},
		&models.StockLog{},
		&models.Order{},
		&models.OrderItem{},
		&models.Shipping{},
		&models.Payment{},
		&models.CustomerAddress{},
	)
	if err != nil {
		log.Printf("Error dropping tables: %v", err)
	}

	log.Println("AutoMigrating models...")
	err = db.AutoMigrate(
		&models.Customer{},
		&models.Admin{},
		&models.Owner{},
		&models.Product{},
		&models.StockLog{},
		&models.Order{},
		&models.OrderItem{},
		&models.Shipping{},
		&models.Payment{},
		&models.CustomerAddress{},
	)
	if err != nil {
		log.Printf("Error migrating: %v", err)
	}

	log.Println("Running Seeder...")
	seed.RunSeeder(db)
	
	log.Println("Database completely reset and seeded successfully!")
}
