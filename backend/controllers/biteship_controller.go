package controllers

import (
	"net/http"

	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"
	"sinar-abadi-backend/services"

	"github.com/gin-gonic/gin"
)

// SearchBiteshipAreas handles the request to search areas via Biteship Maps API
func SearchBiteshipAreas(c *gin.Context) {
	input := c.Query("input")
	if input == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "input query parameter is required (e.g., postal code or subdistrict)"})
		return
	}

	result, err := services.SearchAreas(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch areas from Biteship: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// CalculateRates handles the POST request to fetch shipping rates from Biteship
func CalculateRates(c *gin.Context) {
	var req struct {
		DestinationAreaID string                   `json:"destinationAreaId" binding:"required"`
		Couriers          string                   `json:"couriers" binding:"required"`
		Items             []map[string]interface{} `json:"items" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hardcode Sinar Abadi's Origin Area ID (Dampit, Malang)
	// You should use the actual Biteship Area ID for Sinar Abadi's location.
	originAreaID := "IDNP11IDNC250IDND2604IDZ65181" // ID for Dampit, Malang. 65181

	result, err := services.GetRates(originAreaID, req.DestinationAreaID, req.Couriers, req.Items)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate rates: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// BiteshipWebhook handles status updates from Biteship
func BiteshipWebhook(c *gin.Context) {
	// Biteship sends a payload with order status
	var payload struct {
		Event       string `json:"event"`
		OrderID     string `json:"order_id"`
		Status      string `json:"status"`
		ReferenceID string `json:"reference_id"` // This is our order_id
		Courier     struct {
			WaybillID string `json:"waybill_id"`
		} `json:"courier"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Webhook received with bad payload"})
		return
	}

	// Update waybill_id and shipping status if order_id is present
	if payload.ReferenceID != "" || payload.OrderID != "" {
		updates := map[string]interface{}{}
		if payload.Courier.WaybillID != "" {
			updates["waybill_id"] = payload.Courier.WaybillID
		}
		
		// Map Biteship status to Sinar Abadi status if needed
		orderUpdates := map[string]interface{}{}
		if payload.Status == "dropped" || payload.Status == "shipping" {
			orderUpdates["shipping_status"] = "Sedang Dikirim"
		} else if payload.Status == "delivered" {
			orderUpdates["status"] = "completed"
			orderUpdates["shipping_status"] = "Pesanan Selesai"
		}

		if len(updates) > 0 {
			if payload.ReferenceID != "" {
				config.DB.Model(&models.Shipping{}).Where("order_id = ?", payload.ReferenceID).Updates(updates)
			} else {
				config.DB.Model(&models.Shipping{}).Where("biteship_order_id = ?", payload.OrderID).Updates(updates)
			}
		}

		if len(orderUpdates) > 0 {
			if payload.ReferenceID != "" {
				config.DB.Model(&models.Order{}).Where("id = ?", payload.ReferenceID).Updates(orderUpdates)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Webhook received successfully"})
}

// GetTracking handles frontend requests for tracking information
func GetTracking(c *gin.Context) {
	orderID := c.Param("id")

	var shipping models.Shipping
	if err := config.DB.Where("order_id = ?", orderID).First(&shipping).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengiriman tidak ditemukan"})
		return
	}

	if shipping.BiteshipOrderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pesanan ini tidak menggunakan resi otomatis Biteship"})
		return
	}

	result, err := services.TrackOrder(shipping.BiteshipOrderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal melacak pesanan: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
