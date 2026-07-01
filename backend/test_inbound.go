package main

import (
	"fmt"
	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"
)

func main() {
	config.ConnectDatabase()
	db := config.DB

	var inbound models.InboundOrder
	if err := db.Preload("Items").First(&inbound, 5).Error; err != nil {
		fmt.Println("Error fetching inbound:", err)
		return
	}

	fmt.Printf("Inbound: %+v\n", inbound)
	for _, item := range inbound.Items {
		fmt.Printf("Item: %+v\n", item)
		var ws models.WarehouseStock
		var variantIdStr string
		if item.VariantID == nil {
			variantIdStr = "nil"
		} else {
			variantIdStr = fmt.Sprintf("%d", *item.VariantID)
		}
		fmt.Printf("WarehouseStock query: ProductID=%s, VariantID=%s, WarehouseID=%d\n", item.ProductID, variantIdStr, item.WarehouseID)
		
		err := db.Where(models.WarehouseStock{
			ProductID:   item.ProductID,
			VariantID:   item.VariantID,
			WarehouseID: item.WarehouseID,
		}).FirstOrCreate(&ws).Error
		
		if err != nil {
			fmt.Println("FirstOrCreate Error:", err)
		} else {
			fmt.Printf("FirstOrCreate Success: %+v\n", ws)
			
			// Try update stock
			if err := db.Model(&ws).Update("stock", ws.Stock+item.Qty).Error; err != nil {
				fmt.Println("Update Stock Error:", err)
			} else {
				fmt.Println("Update Stock Success")
			}
			
			// Try create stock log
			var warehouseID *uint
			if item.WarehouseID != 0 {
				wID := item.WarehouseID
				warehouseID = &wID
			}
			stockLog := models.StockLog{
				ProductID:   item.ProductID,
				VariantID:   item.VariantID,
				WarehouseID: warehouseID,
				ChangeType:  "addition",
				QtyChanged:  item.Qty,
				FinalStock:  ws.Stock + item.Qty,
				Description: "INBOUND_RECEIVE PO-5",
			}
			if err := db.Create(&stockLog).Error; err != nil {
				fmt.Println("Create StockLog Error:", err)
			} else {
				fmt.Println("Create StockLog Success")
			}
		}
	}
}
