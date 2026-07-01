package main

import (
	"fmt"
	"time"

	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"
)

func main() {
	config.ConnectDatabase()
	db := config.DB

	// Get first warehouse
	var wh models.Warehouse
	if err := db.First(&wh).Error; err != nil {
		fmt.Println("No warehouse found. Cannot set stock.")
		return
	}

	var variants []models.ProductVariant
	db.Find(&variants)

	count := 0
	for _, v := range variants {
		var ws models.WarehouseStock
		err := db.Where(models.WarehouseStock{
			ProductID:   v.ProductID,
			VariantID:   &v.ID,
			WarehouseID: wh.ID,
		}).FirstOrCreate(&ws).Error

		if err != nil {
			fmt.Println("Error finding/creating warehouse stock for variant", v.ID, ":", err)
			continue
		}

		currentStock := ws.Stock
		if currentStock != 30 {
			diff := 30 - currentStock
			
			// Update warehouse stock
			db.Model(&ws).Update("stock", 30)

			// Add stock log
			changeType := "addition"
			if diff < 0 {
				changeType = "deduction"
			}

			db.Create(&models.StockLog{
				ProductID:   v.ProductID,
				VariantID:   &v.ID,
				WarehouseID: &wh.ID,
				ChangeType:  changeType,
				QtyChanged:  diff,
				FinalStock:  30,
				Description: "Set stock to 30 (Batch)",
				CreatedAt:   time.Now(),
			})
			count++
		}
	}
	fmt.Printf("Successfully updated stock for %d variants to 30.\n", count)
}
