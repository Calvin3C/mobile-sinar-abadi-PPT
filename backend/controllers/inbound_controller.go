package controllers

import (
	"net/http"
	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetInbounds(c *gin.Context) {
	var inbounds []models.InboundOrder
	if err := config.DB.Preload("Items").Order("created_at desc").Find(&inbounds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch inbounds"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": inbounds})
}

func CreateInbound(c *gin.Context) {
	var input struct {
		SupplierName string    `json:"supplierName" binding:"required"`
		ExpectedDate time.Time `json:"expectedDate" binding:"required"`
		TotalCost    int64     `json:"totalCost"`
		Items        []struct {
			ProductID   string `json:"productId" binding:"required"`
			VariantID   *uint  `json:"variantId"`
			WarehouseID uint   `json:"warehouseId" binding:"required"`
			Qty         int    `json:"qty" binding:"required"`
			UnitCost    int64  `json:"unitCost"`
		} `json:"items" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid input"})
		return
	}

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		inbound := models.InboundOrder{
			SupplierName: input.SupplierName,
			ExpectedDate: input.ExpectedDate,
			TotalCost:    input.TotalCost,
			Status:       "pending",
		}

		if err := tx.Create(&inbound).Error; err != nil {
			return err
		}

		for _, item := range input.Items {
			inboundItem := models.InboundOrderItem{
				InboundOrderID: inbound.ID,
				ProductID:      item.ProductID,
				VariantID:      item.VariantID,
				WarehouseID:    item.WarehouseID,
				Qty:            item.Qty,
				UnitCost:       item.UnitCost,
				Subtotal:       int64(item.Qty) * item.UnitCost,
			}
			if err := tx.Create(&inboundItem).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to create inbound"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "message": "Inbound created successfully"})
}

func UpdateInboundStatus(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid input"})
		return
	}

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var inbound models.InboundOrder
		if err := tx.Preload("Items").First(&inbound, id).Error; err != nil {
			return err
		}

		if inbound.Status == "received" || inbound.Status == "cancelled" {
			return nil // Already processed
		}

		if err := tx.Model(&inbound).Update("status", input.Status).Error; err != nil {
			return err
		}

		// If received, augment stock
		if input.Status == "received" {
			for _, item := range inbound.Items {
				// Find or create warehouse stock
				var ws models.WarehouseStock
				err := tx.Where(models.WarehouseStock{
					ProductID:   item.ProductID,
					VariantID:   item.VariantID,
					WarehouseID: item.WarehouseID,
				}).FirstOrCreate(&ws).Error
				if err != nil {
					return err
				}

				// Update stock
				if err := tx.Model(&ws).Update("stock", ws.Stock+item.Qty).Error; err != nil {
					return err
				}

				// Create stock log
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
					Description: "INBOUND_RECEIVE PO-" + id,
				}
				if err := tx.Create(&stockLog).Error; err != nil {
					return err
				}

			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update inbound status: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Inbound status updated"})
}
