package controllers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"
)

type StockTransferInput struct {
	FromWarehouseID uint   `json:"fromWarehouseId" binding:"required"`
	ToWarehouseID   uint   `json:"toWarehouseId" binding:"required"`
	Quantity        int    `json:"quantity" binding:"required,min=1"`
	VariantID       *uint  `json:"variantId"`
}

// TransferStock handles moving stock from one warehouse to another
// POST /api/products/:id/transfer
func TransferStock(c *gin.Context) {
	productID := c.Param("id")

	var input StockTransferInput
	if err := c.ShouldBindJSON(&input); err != nil {
        log.Printf("TransferStock Bind Error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data transfer tidak valid"})
		return
	}
    log.Printf("TransferStock Input: %+v", input)

	if input.FromWarehouseID == input.ToWarehouseID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gudang asal dan tujuan tidak boleh sama"})
		return
	}

	tx := config.DB.Begin()

	var product models.Product
	if result := tx.Where("id = ?", productID).First(&product); result.Error != nil {
        log.Printf("TransferStock Product Error: %v", result.Error)
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
		return
	}

	// 1. Check and deduct stock from FromWarehouse
	var fromStock models.WarehouseStock
	queryFrom := tx.Where("product_id = ? AND warehouse_id = ?", productID, input.FromWarehouseID)
	if input.VariantID != nil {
		queryFrom = queryFrom.Where("variant_id = ?", *input.VariantID)
	} else {
		queryFrom = queryFrom.Where("variant_id IS NULL")
	}

	if err := queryFrom.First(&fromStock).Error; err != nil || fromStock.Stock < input.Quantity {
        log.Printf("TransferStock Stock Error: err=%v, stock=%d, requested=%d", err, fromStock.Stock, input.Quantity)
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stok di gudang asal tidak mencukupi"})
		return
	}

	newFromStock := fromStock.Stock - input.Quantity
	tx.Model(&fromStock).Update("stock", newFromStock)

	// Log deduction
	copyFromID := input.FromWarehouseID
	tx.Create(&models.StockLog{
		ProductID:   productID,
		VariantID:   input.VariantID,
		WarehouseID: &copyFromID,
		ChangeType:  "transfer_out",
		QtyChanged:  -input.Quantity,
		FinalStock:  newFromStock,
		Description: fmt.Sprintf("Transfer ke Gudang ID %d", input.ToWarehouseID),
	})

	// 2. Add stock to ToWarehouse
	var toStock models.WarehouseStock
	queryTo := tx.Where("product_id = ? AND warehouse_id = ?", productID, input.ToWarehouseID)
	if input.VariantID != nil {
		queryTo = queryTo.Where("variant_id = ?", *input.VariantID)
	} else {
		queryTo = queryTo.Where("variant_id IS NULL")
	}

	var newToStock int
	if err := queryTo.First(&toStock).Error; err != nil {
		// Create new stock record
		toStock = models.WarehouseStock{
			ProductID:   productID,
			VariantID:   input.VariantID,
			WarehouseID: input.ToWarehouseID,
			Stock:       input.Quantity,
		}
		tx.Create(&toStock)
		newToStock = input.Quantity
	} else {
		newToStock = toStock.Stock + input.Quantity
		tx.Model(&toStock).Update("stock", newToStock)
	}

	// Log addition
	copyToID := input.ToWarehouseID
	tx.Create(&models.StockLog{
		ProductID:   productID,
		VariantID:   input.VariantID,
		WarehouseID: &copyToID,
		ChangeType:  "transfer_in",
		QtyChanged:  input.Quantity,
		FinalStock:  newToStock,
		Description: fmt.Sprintf("Transfer dari Gudang ID %d", input.FromWarehouseID),
	})

	// 3. Record the transfer
	transfer := models.StockTransfer{
		ProductID:       productID,
		VariantID:       input.VariantID,
		FromWarehouseID: input.FromWarehouseID,
		ToWarehouseID:   input.ToWarehouseID,
		Quantity:        input.Quantity,
		Notes:           fmt.Sprintf("Transfer %d unit", input.Quantity),
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
	
	if err := tx.Create(&transfer).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mencatat transfer stok"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "Transfer stok berhasil",
		"data":    transfer,
	})
}

// GetStockTransfers retrieves a list of all stock transfers.
// GET /api/stock-transfers
func GetStockTransfers(c *gin.Context) {
	var transfers []models.StockTransfer

	query := config.DB.Preload("Product").Preload("FromWarehouse").Preload("ToWarehouse").Order("created_at desc")

	if result := query.Find(&transfers); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data transfer stok"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    transfers,
	})
}
