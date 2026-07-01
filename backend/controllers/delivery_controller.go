package controllers

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"
)

// ---- Request DTOs ----

// DeliveryStatusInput is the request body for updating delivery status.
type DeliveryStatusInput struct {
	DeliveryStatus string `json:"deliveryStatus" binding:"required"` // Menunggu / Diproses / Dikirim / Selesai
	FleetVehicleID *uint  `json:"fleetVehicleId"`                    // Required when status is "Dikirim"
}

// ---- Handlers ----

// GetDeliveryLocations returns the list of delivery locations served by Kurir Toko Sinar Abadi.
// GET /api/delivery/locations
func GetDeliveryLocations(c *gin.Context) {
	var locations []models.DeliveryLocation
	if err := config.DB.Where("is_active = ?", true).Order("distance_km ASC").Find(&locations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data lokasi pengiriman"})
		return
	}

	c.JSON(http.StatusOK, locations)
}

// GetFleetStatus returns the current status of all fleet vehicles.
// GET /api/delivery/fleet
func GetFleetStatus(c *gin.Context) {
	var vehicles []models.FleetVehicle
	if err := config.DB.Find(&vehicles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data armada"})
		return
	}

	// Enrich each vehicle with order details if currently delivering
	type VehicleResponse struct {
		models.FleetVehicle
		CurrentOrder *models.Order `json:"currentOrder,omitempty"`
	}

	var response []VehicleResponse
	for _, v := range vehicles {
		vr := VehicleResponse{FleetVehicle: v}
		if v.CurrentOrderID != nil && *v.CurrentOrderID != "" {
			var order models.Order
			if err := config.DB.Preload("Items").Preload("Shipping").Where("id = ?", *v.CurrentOrderID).First(&order).Error; err == nil {
				vr.CurrentOrder = &order
			}
		}
		response = append(response, vr)
	}

	c.JSON(http.StatusOK, response)
}

// UpdateDeliveryStatus updates the delivery status for a Kurir Toko Sinar Abadi order.
// Only valid transitions: Menunggu → Diproses → Dikirim → Selesai
// When transitioning to "Dikirim", a fleet vehicle must be assigned.
// When transitioning to "Selesai", the assigned vehicle is released.
// PUT /api/delivery/:orderId/status
func UpdateDeliveryStatus(c *gin.Context) {
	orderID := c.Param("orderId")

	var input DeliveryStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data status tidak valid: " + err.Error()})
		return
	}

	// Validate status value
	validStatuses := map[string]bool{
		"Menunggu":  true,
		"Diproses":  true,
		"Dikirim":   true,
		"Selesai":   true,
	}
	if !validStatuses[input.DeliveryStatus] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status pengiriman tidak valid. Pilihan: Menunggu, Diproses, Dikirim, Selesai"})
		return
	}

	// Find the order and its shipping record
	var order models.Order
	if err := config.DB.Preload("Shipping").Where("id = ?", orderID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	// Ensure this is a Kurir Toko Sinar Abadi order
	if !strings.Contains(order.ShippingMethod, "Kurir Toko Sinar Abadi") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pesanan ini bukan pengiriman Kurir Toko Sinar Abadi"})
		return
	}

	if order.Shipping == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data pengiriman tidak ditemukan untuk pesanan ini"})
		return
	}

	shipping := order.Shipping

	// Validate status transition
	currentStatus := shipping.DeliveryStatus
	validTransition := false
	switch input.DeliveryStatus {
	case "Diproses":
		validTransition = currentStatus == "Menunggu"
	case "Dikirim":
		validTransition = currentStatus == "Diproses"
	case "Selesai":
		validTransition = currentStatus == "Dikirim"
	case "Menunggu":
		validTransition = true // Allow reset
	}

	if !validTransition {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Transisi status tidak valid: " + currentStatus + " → " + input.DeliveryStatus,
		})
		return
	}

	tx := config.DB.Begin()

	// Handle vehicle assignment when status moves to "Dikirim"
	if input.DeliveryStatus == "Dikirim" {
		if input.FleetVehicleID == nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Harus memilih mobil untuk pengiriman"})
			return
		}

		var vehicle models.FleetVehicle
		if err := tx.Where("id = ?", *input.FleetVehicleID).First(&vehicle).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Mobil tidak ditemukan"})
			return
		}

		if vehicle.Status == "Sedang Mengantar" {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Mobil " + vehicle.Name + " sedang dalam pengiriman lain. Gunakan mobil yang tersedia.",
			})
			return
		}

		// Assign vehicle to this order
		tx.Model(&vehicle).Updates(map[string]interface{}{
			"status":           "Sedang Mengantar",
			"current_order_id": orderID,
		})

		// Save vehicle ID on shipping record
		tx.Model(shipping).Update("fleet_vehicle_id", *input.FleetVehicleID)

		log.Printf("🚚 Vehicle %s assigned to order %s", vehicle.Name, orderID)
	}

	// Handle vehicle release when status moves to "Selesai"
	if input.DeliveryStatus == "Selesai" {
		if shipping.FleetVehicleID != nil {
			tx.Model(&models.FleetVehicle{}).Where("id = ?", *shipping.FleetVehicleID).Updates(map[string]interface{}{
				"status":           "Tersedia",
				"current_order_id": nil,
			})
			log.Printf("✅ Vehicle ID %d released from order %s", *shipping.FleetVehicleID, orderID)
		}

		// Also update the main order status to completed
		tx.Model(&order).Update("status", "completed")
	}

	// Update delivery status
	tx.Model(shipping).Update("delivery_status", input.DeliveryStatus)

	// Update the order's shipping_status to reflect delivery progress
	shippingStatusMap := map[string]string{
		"Menunggu":  "Menunggu Pengiriman",
		"Diproses":  "Sedang Diproses",
		"Dikirim":   "Dalam Pengiriman",
		"Selesai":   "Pengiriman Selesai",
	}
	if newShippingStatus, ok := shippingStatusMap[input.DeliveryStatus]; ok {
		tx.Model(&order).Update("shipping_status", newShippingStatus)
	}

	// If moving to "Dikirim", also update order status to "shipping"
	if input.DeliveryStatus == "Dikirim" {
		tx.Model(&order).Update("status", "shipping")
	}

	tx.Commit()

	// Reload for response
	config.DB.Preload("Items").Preload("Shipping").First(&order, "id = ?", order.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Status pengiriman berhasil diperbarui ke " + input.DeliveryStatus,
		"order":   order,
	})
}
