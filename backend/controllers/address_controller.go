package controllers

import (
	"net/http"

	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"

	"github.com/gin-gonic/gin"
)

// GetCustomerAddresses returns all addresses for the logged-in customer
func GetCustomerAddresses(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var addresses []models.CustomerAddress
	if err := config.DB.Where("customer_id = ?", userID).Order("is_primary desc, id desc").Find(&addresses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch addresses"})
		return
	}

	c.JSON(http.StatusOK, addresses)
}

// CreateCustomerAddress adds a new address for the logged-in customer
func CreateCustomerAddress(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Label          string `json:"label" binding:"required"`
		RecipientName  string `json:"name" binding:"required"`
		PhoneNumber    string `json:"phone" binding:"required"`
		City           string `json:"kota"`
		FullAddress    string `json:"address" binding:"required"`
		Notes          string `json:"catatan"`
		PostalCode     string `json:"postalCode"`
		BiteshipAreaID string `json:"biteshipAreaId"`
		IsPrimary      bool   `json:"isMain"`
		Pinpoint       bool   `json:"pinpoint"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If marked as primary, reset others
	if req.IsPrimary {
		config.DB.Model(&models.CustomerAddress{}).Where("customer_id = ?", userID).Update("is_primary", false)
	}

	address := models.CustomerAddress{
		CustomerID:     userID.(uint),
		Label:          req.Label,
		RecipientName:  req.RecipientName,
		PhoneNumber:    req.PhoneNumber,
		City:           req.City,
		FullAddress:    req.FullAddress,
		Notes:          req.Notes,
		PostalCode:     req.PostalCode,
		BiteshipAreaID: req.BiteshipAreaID,
		IsPrimary:      req.IsPrimary,
		Pinpoint:       req.Pinpoint,
	}

	if err := config.DB.Create(&address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create address"})
		return
	}

	// If it's the first address, make it primary automatically
	var count int64
	config.DB.Model(&models.CustomerAddress{}).Where("customer_id = ?", userID).Count(&count)
	if count == 1 && !address.IsPrimary {
		address.IsPrimary = true
		config.DB.Save(&address)
	}

	c.JSON(http.StatusCreated, address)
}

// UpdateCustomerAddress updates an existing address
func UpdateCustomerAddress(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	addressID := c.Param("id")
	var address models.CustomerAddress
	if err := config.DB.Where("id = ? AND customer_id = ?", addressID, userID).First(&address).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
		return
	}

	var req struct {
		Label          string `json:"label"`
		RecipientName  string `json:"name"`
		PhoneNumber    string `json:"phone"`
		City           string `json:"kota"`
		FullAddress    string `json:"address"`
		Notes          string `json:"catatan"`
		PostalCode     string `json:"postalCode"`
		BiteshipAreaID string `json:"biteshipAreaId"`
		IsPrimary      bool   `json:"isMain"`
		Pinpoint       bool   `json:"pinpoint"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.IsPrimary && !address.IsPrimary {
		config.DB.Model(&models.CustomerAddress{}).Where("customer_id = ?", userID).Update("is_primary", false)
	}

	// Update fields
	if req.Label != "" { address.Label = req.Label }
	if req.RecipientName != "" { address.RecipientName = req.RecipientName }
	if req.PhoneNumber != "" { address.PhoneNumber = req.PhoneNumber }
	if req.City != "" { address.City = req.City }
	if req.FullAddress != "" { address.FullAddress = req.FullAddress }
	if req.Notes != "" { address.Notes = req.Notes }
	if req.PostalCode != "" { address.PostalCode = req.PostalCode }
	if req.BiteshipAreaID != "" { address.BiteshipAreaID = req.BiteshipAreaID }
	address.IsPrimary = req.IsPrimary
	address.Pinpoint = req.Pinpoint

	if err := config.DB.Save(&address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update address"})
		return
	}

	c.JSON(http.StatusOK, address)
}

// DeleteCustomerAddress deletes an address
func DeleteCustomerAddress(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	addressID := c.Param("id")
	var address models.CustomerAddress
	if err := config.DB.Where("id = ? AND customer_id = ?", addressID, userID).First(&address).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
		return
	}

	if err := config.DB.Delete(&address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete address"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Address deleted successfully"})
}
