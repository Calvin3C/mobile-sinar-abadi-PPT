package main

import (
	"fmt"
	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"
)

func main() {
	config.ConnectDatabase()
	var stocks []models.WarehouseStock
	config.DB.Find(&stocks)
	for _, s := range stocks {
		vid := "NULL"
		if s.VariantID != nil {
			vid = fmt.Sprintf("%d", *s.VariantID)
		}
		fmt.Printf("Stock ID: %d, Product: %s, Warehouse: %d, Variant: %s, Stock: %d\n", s.ID, s.ProductID, s.WarehouseID, vid, s.Stock)
	}
}
