package controllers

import (
	"net/http"
	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"

	"github.com/gin-gonic/gin"
)

type VariantInput struct {
	Name        string `json:"name" binding:"required"`
	Price       int64  `json:"price"`
	Stock       int    `json:"stock"`
	WarehouseID *uint  `json:"warehouseId"`
}

// CreateVariant handles creating a new variant for a product.
// POST /api/products/:id/variants
func CreateVariant(c *gin.Context) {
	productID := c.Param("id")
	var input VariantInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Input tidak valid"})
		return
	}

	// Verify product exists
	var product models.Product
	if err := config.DB.Where("id = ?", productID).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
		return
	}

	variant := models.ProductVariant{
		ProductID: productID,
		Name:      input.Name,
		Price:     input.Price,
	}

	if err := config.DB.Create(&variant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan varian"})
		return
	}

	if input.Stock > 0 {
		var whID uint
		if input.WarehouseID != nil && *input.WarehouseID > 0 {
			whID = *input.WarehouseID
		} else {
			var firstWh models.Warehouse
			config.DB.First(&firstWh)
			whID = firstWh.ID
		}

		if whID > 0 {
			ws := models.WarehouseStock{
				ProductID:   productID,
				VariantID:   &variant.ID,
				WarehouseID: whID,
				Stock:       input.Stock,
			}
			config.DB.Create(&ws)

			ownerIDVal, _ := c.Get("userId")
			var ownerIDPtr *uint
			if ownerIDVal != nil {
				id := ownerIDVal.(uint)
				ownerIDPtr = &id
			}
			config.DB.Create(&models.StockLog{
				ProductID:   productID,
				VariantID:   &variant.ID,
				WarehouseID: &whID,
				OwnerID:     ownerIDPtr,
				ChangeType:  "addition",
				QtyChanged:  input.Stock,
				FinalStock:  input.Stock,
				Description: "Stok awal varian baru",
			})
		}
	}

	// Reload variant with warehouseStocks if needed, or just return variant
	config.DB.Preload("WarehouseStocks").Where("id = ?", variant.ID).First(&variant)

	c.JSON(http.StatusCreated, variant)
}

// DeleteVariant handles removing a variant.
// DELETE /api/products/:id/variants/:variantId
func DeleteVariant(c *gin.Context) {
	productID := c.Param("id")
	variantID := c.Param("variantId")

	result := config.DB.Where("id = ? AND product_id = ?", variantID, productID).Delete(&models.ProductVariant{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus varian"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Varian tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Varian berhasil dihapus"})
}
