package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type WarehouseStock struct {
	ID          uint
	WarehouseID uint
	ProductID   string
	VariantID   *uint
	Stock       int
}

func main() {
	dsn := "host=localhost user=postgres password=December271205 dbname=sinar_abadi port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	var stocks []WarehouseStock
	db.Where("product_id = ?", "P-054").Find(&stocks)

	fmt.Println("WarehouseStocks for P-054:")
	for _, s := range stocks {
		var variantID string
		if s.VariantID != nil {
			variantID = fmt.Sprintf("%d", *s.VariantID)
		} else {
			variantID = "null"
		}
		fmt.Printf("WarehouseID: %d, VariantID: %s, Stock: %d\n", s.WarehouseID, variantID, s.Stock)
	}
}
