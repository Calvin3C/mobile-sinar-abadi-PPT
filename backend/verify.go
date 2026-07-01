package main

import (
	"fmt"
	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"
)

func main() {
	config.ConnectDatabase()
	var product models.Product
	config.DB.Where("id = ?", "P-002").First(&product)
	
	fmt.Printf("Before update: Brand=%s, MinPurchase=%d\n", product.Brand, product.MinPurchase)

	updates := map[string]interface{}{}
	updates["brand"] = "Merah Putih"
	updates["min_purchase"] = 10
	
	if err := config.DB.Model(&product).Updates(updates).Error; err != nil {
		fmt.Printf("Error updating: %v\n", err)
	}
	
	var check models.Product
	config.DB.Where("id = ?", "P-002").First(&check)
	fmt.Printf("After update: Brand=%s, MinPurchase=%d\n", check.Brand, check.MinPurchase)
}
