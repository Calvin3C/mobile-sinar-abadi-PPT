package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"strings"
	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"
	"sinar-abadi-backend/services"
)

// ---- Request DTOs ----

// CheckoutItemInput represents a single item in the checkout request.
type CheckoutItemInput struct {
	ProductID string `json:"productId" binding:"required"`
	Name      string `json:"name" binding:"required"`
	Qty       int    `json:"qty" binding:"required"`
	Price     int64  `json:"price" binding:"required"`
	Weight    int    `json:"weight"` // weight per unit in grams
	Length    int    `json:"length"` // length in cm
	Width     int    `json:"width"`  // width in cm
	Height    int    `json:"height"` // height in cm
	Color     string `json:"color"`
	VariantID *uint  `json:"variantId"`
}

type CheckoutInput struct {
	Phone              string              `json:"phone" binding:"required"` // WhatsApp number
	Address            string              `json:"address" binding:"required"`
	ShippingMethod     string              `json:"shippingMethod" binding:"required"`
	PaymentMethod      string              `json:"paymentMethod" binding:"required"` // Virtual Account, Credit Card
	BiteshipAreaID     string              `json:"biteshipAreaId"`                   // Can be empty for store pickup
	ShippingCost       int64               `json:"shippingCost"`                     // Provided by frontend from Biteship
	CourierCode        string              `json:"courierCode"`                      // e.g. "jne", "sicepat" from Biteship
	CourierServiceCode string              `json:"courierServiceCode"`               // e.g. "reg", "best", "jtr", "gokil" from Biteship
	DeliveryLocationID *uint               `json:"deliveryLocationId"`               // For Kurir Toko Sinar Abadi
	Items              []CheckoutItemInput `json:"items" binding:"required,min=1"`
	Total              int64               `json:"total" binding:"required"` // Total product cost
}

// StatusUpdateInput represents the request body for updating order status.
type StatusUpdateInput struct {
	Status         string `json:"status"`         // pending | success | refund | cancelled
	ShippingStatus string `json:"shippingStatus"` // shipping status label
}

// ProofUploadInput represents the request body for marking proof as uploaded.
type ProofUploadInput struct {
	ProofUploaded bool   `json:"proofUploaded"`
	ProofUrl      string `json:"proofUrl"`
}

// ---- Helpers ----

// generateOrderID creates an order ID in the format ORD-YYMMDD-XXX.
func generateOrderID() string {
	now := time.Now()
	return fmt.Sprintf("ORD-%s%s%s-%03d",
		fmt.Sprintf("%02d", now.Year()%100),
		fmt.Sprintf("%02d", int(now.Month())),
		fmt.Sprintf("%02d", now.Day()),
		rand.Intn(900)+100,
	)
}

// getPrioritizedWarehouses returns a list of warehouse IDs sorted by deduction priority: Toko, Gudang Y, Gudang M, others.
func getPrioritizedWarehouses() []uint {
	var warehouses []models.Warehouse
	config.DB.Find(&warehouses)

	priority := func(name string) int {
		lower := strings.ToLower(name)
		if strings.Contains(lower, "toko") {
			return 1
		}
		if strings.Contains(lower, "gudang y") {
			return 2
		}
		if strings.Contains(lower, "gudang m") {
			return 3
		}
		return 4
	}

	type whPriority struct {
		ID       uint
		Priority int
	}
	var list []whPriority
	for _, w := range warehouses {
		list = append(list, whPriority{ID: w.ID, Priority: priority(w.Name)})
	}
	
	for i := 0; i < len(list); i++ {
		for j := i + 1; j < len(list); j++ {
			if list[i].Priority > list[j].Priority {
				list[i], list[j] = list[j], list[i]
			}
		}
	}

	var sorted []uint
	for _, w := range list {
		sorted = append(sorted, w.ID)
	}
	return sorted
}

// ---- Handlers ----

// CreateOrder handles customer checkout.
// POST /api/orders
func CreateOrder(c *gin.Context) {
	var input CheckoutInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data checkout tidak lengkap: " + err.Error()})
		return
	}

	// Get the authenticated user ID and username from JWT context
	userID, _ := c.Get("userId")
	username, _ := c.Get("username")

	var customerNameStr string
	var customer models.Customer
	if err := config.DB.Where("id = ?", userID).First(&customer).Error; err == nil && customer.Name != "" {
		customerNameStr = customer.Name
	} else {
		customerNameStr = username.(string)
	}

	orderID := generateOrderID()

	// Map to keep track of the primary warehouse used for each item
	itemPrimaryWarehouse := make(map[string]uint)
	prioritizedWhIDs := getPrioritizedWarehouses()

	// Validate stock availability and decrement
	tx := config.DB.Begin()
	for _, item := range input.Items {
		var product models.Product
		if result := tx.Where("id = ?", item.ProductID).First(&product); result.Error != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Produk %s tidak ditemukan", item.ProductID)})
			return
		}

		var allStocks []models.WarehouseStock
		query := tx.Where("product_id = ?", item.ProductID)
		if item.VariantID != nil {
			query = query.Where("variant_id = ?", *item.VariantID)
		} else {
			query = query.Where("variant_id IS NULL")
		}
		query.Find(&allStocks)

		totalAvailable := 0
		stockMap := make(map[uint]*models.WarehouseStock)
		for i, ws := range allStocks {
			totalAvailable += ws.Stock
			stockMap[ws.WarehouseID] = &allStocks[i]
		}

		if totalAvailable < item.Qty {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Stok %s tidak mencukupi (tersisa %d)", product.Name, totalAvailable)})
			return
		}

		remainingQty := item.Qty
		var primaryWarehouseID *uint

		for _, whID := range prioritizedWhIDs {
			if remainingQty <= 0 {
				break
			}
			ws, exists := stockMap[whID]
			if !exists || ws.Stock <= 0 {
				continue
			}

			if primaryWarehouseID == nil {
				copyID := whID
				primaryWarehouseID = &copyID
			}

			deduct := remainingQty
			if ws.Stock < remainingQty {
				deduct = ws.Stock
			}

			remainingQty -= deduct
			newStock := ws.Stock - deduct
			ws.Stock = newStock

			tx.Model(ws).Update("stock", newStock)

			// Log stock deduction due to sale
			copyWhID := whID
			tx.Create(&models.StockLog{
				ProductID:   item.ProductID,
				VariantID:   item.VariantID,
				WarehouseID: &copyWhID,
				ChangeType:  "deduction",
				QtyChanged:  -deduct,
				FinalStock:  newStock,
				Description: fmt.Sprintf("Penjualan (Order %s)", orderID),
			})
		}

		if remainingQty > 0 {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Gagal memotong stok %s", product.Name)})
			return
		}

		// Save the primary warehouse for the order items
		itemKey := item.ProductID
		if item.VariantID != nil {
			itemKey = fmt.Sprintf("%s-%d", item.ProductID, *item.VariantID)
		}
		if primaryWarehouseID != nil {
			itemPrimaryWarehouse[itemKey] = *primaryWarehouseID
		}

		// Increase sold count only (global stock is calculated from stock logs)
		tx.Model(&product).Update("sold", product.Sold+item.Qty)
	}

	// Build order items
	var orderItems []models.OrderItem
	for _, item := range input.Items {
		// Look up actual product weight and dimensions if not provided
		itemWeight := item.Weight
		itemLength := item.Length
		itemWidth := item.Width
		itemHeight := item.Height

		var productCopy models.Product
		if itemWeight <= 0 || itemLength <= 0 || itemWidth <= 0 || itemHeight <= 0 || true { // We need it for warehouse logic anyway
			if err := config.DB.Where("id = ?", item.ProductID).First(&productCopy).Error; err == nil {
				if itemWeight <= 0 { itemWeight = productCopy.Weight }
				if itemLength <= 0 { itemLength = productCopy.Length }
				if itemWidth <= 0 { itemWidth = productCopy.Width }
				if itemHeight <= 0 { itemHeight = productCopy.Height }
			}
		}

		// Final safety check
		if itemLength <= 0 { itemLength = 1 }
		if itemWidth <= 0 { itemWidth = 1 }
		if itemHeight <= 0 { itemHeight = 1 }

		itemKey := item.ProductID
		if item.VariantID != nil {
			itemKey = fmt.Sprintf("%s-%d", item.ProductID, *item.VariantID)
		}
		var warehouseIDVal *uint
		if id, ok := itemPrimaryWarehouse[itemKey]; ok {
			copyID := id
			warehouseIDVal = &copyID
		}

		orderItems = append(orderItems, models.OrderItem{
			ProductID: item.ProductID,
			VariantID: item.VariantID,
			WarehouseID: warehouseIDVal,
			Name:      item.Name,
			Qty:       item.Qty,
			Price:     item.Price,
			Weight:    itemWeight,
			Length:    itemLength,
			Width:     itemWidth,
			Height:    itemHeight,
			Color:     item.Color,
		})
	}

	logisticsSvc := services.NewLogisticsService()
	paymentSvc := services.NewPaymentService()

	// We trust the frontend shippingCost if it's Biteship, otherwise calculate standard
	shippingCost := input.ShippingCost
	if input.BiteshipAreaID == "" && input.ShippingMethod != "Ambil Di Toko" && input.ShippingMethod != "Kurir Toko Sinar Abadi" {
		var err error
		shippingCost, err = logisticsSvc.CalculateShippingCost(input.ShippingMethod, input.Address, orderItems)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	} else if input.ShippingMethod == "Kurir Toko Sinar Abadi" {
		// Lookup shipping cost from delivery location
		if input.DeliveryLocationID != nil {
			cost, err := services.LookupDeliveryLocationCost(*input.DeliveryLocationID)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			shippingCost = cost
		} else {
			// Fallback: use the cost provided by frontend
			shippingCost = input.ShippingCost
		}
	}

	paymentMethodStr := input.PaymentMethod
	if strings.HasPrefix(paymentMethodStr, "midtrans_") {
		paymentMethodStr = "Midtrans (" + strings.TrimPrefix(paymentMethodStr, "midtrans_") + ")"
	} else if paymentMethodStr == "midtrans" {
		paymentMethodStr = "Midtrans"
	}

	order := models.Order{
		ID:             orderID,
		Date:           time.Now().Format("2006-01-02"),
		CustomerID:     userID.(uint),
		CustomerName:   customerNameStr,
		Phone:          input.Phone,
		Address:        input.Address,
		ShippingMethod: input.ShippingMethod,
		Total:          input.Total + shippingCost,
		Status:         "pending",
		ShippingStatus: "Menunggu Validasi",
		ProofUploaded:  false,
		Items:          orderItems,
	}

	if result := tx.Create(&order); result.Error != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat pesanan"})
		return
	}

	// Create Shipping record
	shipping := models.Shipping{
		OrderID:            orderID,
		ShippingMethodName: input.ShippingMethod,
		TrackingNumber:     input.Phone, // Use Phone as WhatsApp tracking number
		ShippingCost:       shippingCost,
		DestinationAddress: input.Address,
		BiteshipAreaID:     input.BiteshipAreaID,
		CourierCode:        input.CourierCode,
		CourierServiceCode: input.CourierServiceCode,
		DeliveryLocationID: input.DeliveryLocationID,
		DeliveryStatus:     "Menunggu",
	}

	if result := tx.Create(&shipping); result.Error != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan data logistik"})
		return
	}

	// Build Midtrans item list for Snap
	var snapItems []services.SnapItem
	var sumItems int64 = 0
	for _, item := range input.Items {
		snapItems = append(snapItems, services.SnapItem{
			ID:       item.ProductID,
			Price:    item.Price,
			Quantity: item.Qty,
			Name:     item.Name,
		})
		sumItems += (item.Price * int64(item.Qty))
	}
	
	// Add PPN / Tax difference if applicable
	ppn := input.Total - sumItems
	if ppn > 0 {
		snapItems = append(snapItems, services.SnapItem{
			ID:       "PPN",
			Price:    ppn,
			Quantity: 1,
			Name:     "PPN (11%)",
		})
	}

	// Add shipping cost as an item if applicable
	if shippingCost > 0 {
		snapItems = append(snapItems, services.SnapItem{
			ID:       "SHIPPING",
			Price:    shippingCost,
			Quantity: 1,
			Name:     "Ongkos Kirim",
		})
	}

	// Get customer email if available
	customerEmail := ""
	if customer.Email != "" {
		customerEmail = customer.Email
	}

	// Initiate Payment
	payResult, err := paymentSvc.InitiatePayment(orderID, input.PaymentMethod, order.Total, customerNameStr, customerEmail, input.Phone, input.Address, snapItems)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	payment := models.Payment{
		OrderID:       orderID,
		PaymentMethod: paymentMethodStr,
		AmountPaid:    order.Total,
		PaymentStatus: "Pending",
		SnapToken:     payResult.SnapToken,
	}

	if result := tx.Create(&payment); result.Error != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan data pembayaran"})
		return
	}

	tx.Commit()

	// Reload with items, shipping, and payment for response
	config.DB.Preload("Items").Preload("Shipping").Preload("Payment").First(&order, "id = ?", order.ID)

	// Return order with snapToken for Midtrans
	response := gin.H{
		"id":             order.ID,
		"date":           order.Date,
		"customerId":     order.CustomerID,
		"customer":       order.CustomerName,
		"phone":          order.Phone,
		"address":        order.Address,
		"shippingMethod": order.ShippingMethod,
		"total":          order.Total,
		"status":         order.Status,
		"shippingStatus": order.ShippingStatus,
		"proofUploaded":  order.ProofUploaded,
		"proofUrl":       order.ProofUrl,
		"items":          order.Items,
		"shipping":       order.Shipping,
		"payment":        order.Payment,
		"createdAt":      order.CreatedAt,
		"updatedAt":      order.UpdatedAt,
	}
	if payResult.SnapToken != "" {
		response["snapToken"] = payResult.SnapToken
	}

	c.JSON(http.StatusCreated, response)
}

// GetOrders returns orders based on the user's role.
// - Customer: only their own orders
// - Admin/Owner: all orders (with optional status filter)
// GET /api/orders?status=pending|success|refund|cancelled
func GetOrders(c *gin.Context) {
	role, _ := c.Get("role")
	userID, _ := c.Get("userId")

	var orders []models.Order
	query := config.DB.Preload("Items").Preload("Shipping").Preload("Payment").Order("created_at DESC")

	// Customers only see their own orders
	if role.(string) == "customer" {
		query = query.Where("customer_id = ?", userID.(uint))
	}

	// Optional status filter (for Admin/Owner dashboard)
	if statusFilter := c.Query("status"); statusFilter != "" && statusFilter != "all" {
		query = query.Where("status = ?", statusFilter)
	}

	if result := query.Find(&orders); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pesanan"})
		return
	}

	c.JSON(http.StatusOK, orders)
}

// GetOrderByID retrieves a single order by its ID for tracking.
// GET /api/orders/:id
func GetOrderByID(c *gin.Context) {
	orderID := c.Param("id")

	var order models.Order
	if result := config.DB.Preload("Items").Preload("Shipping").Preload("Payment").Where("id = ?", orderID).First(&order); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	// If the requester is a customer, ensure they can only view their own orders
	role, _ := c.Get("role")
	userID, _ := c.Get("userId")
	if role.(string) == "customer" && order.CustomerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki akses ke pesanan ini"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// UpdateOrderStatus handles payment validation (Admin) and shipping status updates (Owner).
// PUT /api/orders/:id/status
func UpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")

	var input StatusUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data status tidak valid"})
		return
	}

	var order models.Order
	if result := config.DB.Preload("Items").Preload("Shipping").Where("id = ?", orderID).First(&order); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	updates := map[string]interface{}{}
	if input.Status != "" {
		updates["status"] = input.Status
	}
	if input.ShippingStatus != "" {
		updates["shipping_status"] = input.ShippingStatus
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tidak ada perubahan yang dikirim"})
		return
	}

	// Restore stock if the order is being cancelled
	if input.Status == "cancelled" && order.Status != "cancelled" {
		for _, item := range order.Items {
			var product models.Product
			if err := config.DB.Where("id = ?", item.ProductID).First(&product).Error; err == nil {
				config.DB.Model(&product).Update("sold", product.Sold-item.Qty)
			}
			
			// Return to warehouse stock
			var whStock models.WarehouseStock
			if item.WarehouseID != nil {
				query := config.DB.Where("product_id = ? AND warehouse_id = ?", item.ProductID, *item.WarehouseID)
				if item.VariantID != nil {
					query = query.Where("variant_id = ?", *item.VariantID)
				} else {
					query = query.Where("variant_id IS NULL")
				}
				if err := query.First(&whStock).Error; err == nil {
					config.DB.Model(&whStock).Update("stock", whStock.Stock+item.Qty)
				}
			}

			var currentStock int
			if whStock.ID != 0 {
				currentStock = whStock.Stock + item.Qty
			} else {
				// Fallback to global stock check if warehouse stock not found
				config.DB.Model(&models.StockLog{}).
					Where("product_id = ?", item.ProductID).
					Select("COALESCE(SUM(qty_changed), 0)").
					Scan(&currentStock)
				currentStock += item.Qty
			}
			
			config.DB.Create(&models.StockLog{
				ProductID:   item.ProductID,
				VariantID:   item.VariantID,
				WarehouseID: item.WarehouseID,
				ChangeType:  "addition",
				QtyChanged:  item.Qty,
				FinalStock:  currentStock,
				Description: fmt.Sprintf("Pembatalan Pesanan (Order %s)", order.ID),
			})
		}
	}

	config.DB.Model(&order).Updates(updates)

	// If payment is successful, create an order in Biteship
	if input.Status == "success" {
		processBiteshipOrderCreation(&order)
	}

	// Reload for response
	config.DB.Preload("Items").Preload("Shipping").Preload("Payment").First(&order, "id = ?", order.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Status pesanan berhasil diperbarui",
		"order":   order,
	})
}

// UploadProof marks the proof of payment as uploaded.
// PUT /api/orders/:id/proof
func UploadProof(c *gin.Context) {
	orderID := c.Param("id")

	var order models.Order
	if result := config.DB.Where("id = ?", orderID).First(&order); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	// Verify ownership if customer
	role, _ := c.Get("role")
	userID, _ := c.Get("userId")
	if role.(string) == "customer" && order.CustomerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki akses ke pesanan ini"})
		return
	}

	var proofUrl string
	contentType := c.GetHeader("Content-Type")

	if strings.Contains(contentType, "multipart/form-data") {
		file, err := c.FormFile("proof")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal membaca file bukti pembayaran"})
			return
		}

		if err := os.MkdirAll("uploads/proofs", 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat direktori upload"})
			return
		}

		filename := fmt.Sprintf("%s-%d.jpg", orderID, time.Now().Unix())
		filepath := fmt.Sprintf("uploads/proofs/%s", filename)
		if err := c.SaveUploadedFile(file, filepath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan file"})
			return
		}
		
		// The API serves ./uploads via /images
		proofUrl = fmt.Sprintf("/images/proofs/%s", filename)
	} else {
		var input ProofUploadInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		proofUrl = input.ProofUrl
	}

	config.DB.Model(&order).Updates(map[string]interface{}{
		"proof_uploaded": true,
		"proof_url":      proofUrl,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Bukti pembayaran berhasil diunggah",
	})
}

// CompleteOrderCustomer allows a customer to mark their own shipping order as completed
// PUT /api/orders/:id/complete
func CompleteOrderCustomer(c *gin.Context) {
	orderID := c.Param("id")
	
	// Get userId from token/middleware
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var order models.Order
	if result := config.DB.Where("id = ? AND customer_id = ?", orderID, userID).First(&order); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan atau Anda tidak memiliki akses"})
		return
	}

	if order.Status != "shipping" && order.Status != "SHIPPING" && order.Status != "success" && order.Status != "SUCCESS" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pesanan tidak dapat diselesaikan pada status ini (" + order.Status + ")"})
		return
	}

	config.DB.Model(&order).Update("status", "completed")

	c.JSON(http.StatusOK, gin.H{"message": "Pesanan berhasil diselesaikan"})
}

// CancelOrderCustomer allows a customer to cancel their own pending order.
// This is used when the user closes the Midtrans popup without completing payment.
// PUT /api/orders/:id/cancel
func CancelOrderCustomer(c *gin.Context) {
	orderID := c.Param("id")

	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var order models.Order
	if result := config.DB.Preload("Items").Where("id = ? AND customer_id = ?", orderID, userID).First(&order); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan atau Anda tidak memiliki akses"})
		return
	}

	// Only allow cancellation of pending orders
	if order.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Hanya pesanan dengan status pending yang dapat dibatalkan"})
		return
	}

	// Restore stock
	for _, item := range order.Items {
		var product models.Product
		if err := config.DB.Where("id = ?", item.ProductID).First(&product).Error; err == nil {
			config.DB.Model(&product).Update("sold", product.Sold-item.Qty)
		}

		// Return to warehouse stock
		var whStock models.WarehouseStock
		if item.WarehouseID != nil {
			query := config.DB.Where("product_id = ? AND warehouse_id = ?", item.ProductID, *item.WarehouseID)
			if item.VariantID != nil {
				query = query.Where("variant_id = ?", *item.VariantID)
			} else {
				query = query.Where("variant_id IS NULL")
			}
			if err := query.First(&whStock).Error; err == nil {
				config.DB.Model(&whStock).Update("stock", whStock.Stock+item.Qty)
			}
		}

		var currentStock int
		if whStock.ID != 0 {
			currentStock = whStock.Stock + item.Qty
		} else {
			// Fallback to global stock check if warehouse stock not found
			config.DB.Model(&models.StockLog{}).
				Where("product_id = ?", item.ProductID).
				Select("COALESCE(SUM(qty_changed), 0)").
				Scan(&currentStock)
			currentStock += item.Qty
		}

		config.DB.Create(&models.StockLog{
			ProductID:   item.ProductID,
			VariantID:   item.VariantID,
			WarehouseID: item.WarehouseID,
			ChangeType:  "addition",
			QtyChanged:  item.Qty,
			FinalStock:  currentStock,
			Description: fmt.Sprintf("Pembatalan oleh Customer (Order %s)", order.ID),
		})
	}

	config.DB.Model(&order).Update("status", "cancelled")

	log.Printf("🚫 Order %s cancelled by customer (Midtrans popup closed)", orderID)

	c.JSON(http.StatusOK, gin.H{"message": "Pesanan berhasil dibatalkan"})
}

// processBiteshipOrderCreation connects to Biteship and creates an order 
// when the order status becomes success.
func processBiteshipOrderCreation(order *models.Order) {
	var shipping models.Shipping
	if err := config.DB.Where("order_id = ?", order.ID).First(&shipping).Error; err == nil {
		// Check if shipping method uses Biteship
		if shipping.BiteshipAreaID != "" && !strings.Contains(shipping.ShippingMethodName, "Ambil Di Toko") && !strings.Contains(shipping.ShippingMethodName, "Kurir Toko Sinar Abadi") {
			
			// Use stored courier codes from Biteship (courier_code & courier_service_code)
			courierCompany := shipping.CourierCode
			courierType := shipping.CourierServiceCode
			
			// Fallback: if codes are empty (legacy orders), try to parse from display name
			if courierCompany == "" {
				parts := strings.SplitN(shipping.ShippingMethodName, " ", 2)
				courierCompany = strings.ToLower(parts[0])
				if len(parts) > 1 {
					courierType = strings.ToLower(parts[1])
				}
			}

			// Build Items
			var bItems []map[string]interface{}
			config.DB.Preload("Items").First(order, "id = ?", order.ID)
			for _, it := range order.Items {
				itemWeight := it.Weight
				itemLength := it.Length
				itemWidth := it.Width
				itemHeight := it.Height

				if itemWeight <= 0 || itemLength <= 0 || itemWidth <= 0 || itemHeight <= 0 {
					// Fallback: look up product details from DB
					var prod models.Product
					if err := config.DB.Where("id = ?", it.ProductID).First(&prod).Error; err == nil {
						if itemWeight <= 0 { itemWeight = prod.Weight }
						if itemLength <= 0 { itemLength = prod.Length }
						if itemWidth <= 0 { itemWidth = prod.Width }
						if itemHeight <= 0 { itemHeight = prod.Height }
					}
				}
				
				if itemWeight <= 0 { itemWeight = 1000 } // fallback 1kg if still unknown
				if itemLength <= 0 { itemLength = 1 }
				if itemWidth <= 0 { itemWidth = 1 }
				if itemHeight <= 0 { itemHeight = 1 }

				bItems = append(bItems, map[string]interface{}{
					"name":     it.Name,
					"value":    it.Price,
					"quantity": it.Qty,
					"weight":   itemWeight,
					"length":   itemLength,
					"width":    itemWidth,
					"height":   itemHeight,
				})
			}

			originAreaID := "IDNP11IDNC250IDND2604IDZ65181" // Hardcoded Dampit area
			biteshipResp, err := services.CreateOrder(
				order.ID,
				originAreaID,
				shipping.BiteshipAreaID,
				courierCompany,
				courierType,
				bItems,
				order.CustomerName,
				order.Phone,
				shipping.DestinationAddress,
			)
			if err == nil && biteshipResp != nil {
				// Extract IDs
				biteshipOrderID, _ := biteshipResp["id"].(string)
				
				waybillID := ""
				if courierObj, ok := biteshipResp["courier"].(map[string]interface{}); ok {
					waybillID, _ = courierObj["waybill_id"].(string)
				}

				// Update tracking status
				config.DB.Model(&shipping).Updates(map[string]interface{}{
					"biteship_order_id": biteshipOrderID,
					"waybill_id":        waybillID,
				})
				config.DB.Model(order).Update("shipping_status", "Kurir Sedang Dijadwalkan")
			} else if err != nil {
				log.Printf("❌ Failed to create Biteship order for %s: %v", order.ID, err)
			}
		}
	}
}

// MidtransWebhook handles payment notification callbacks from Midtrans.
// POST /api/midtrans/webhook
func MidtransWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("❌ Midtrans Webhook: gagal membaca body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	log.Printf("🔔 Midtrans Webhook received: %s", string(body))

	var notification map[string]interface{}
	if err := json.Unmarshal(body, &notification); err != nil {
		log.Printf("❌ Midtrans Webhook: gagal parse JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	orderID, _ := notification["order_id"].(string)
	statusCode, _ := notification["status_code"].(string)
	grossAmount, _ := notification["gross_amount"].(string)
	signatureKey, _ := notification["signature_key"].(string)
	transactionStatus, _ := notification["transaction_status"].(string)
	fraudStatus, _ := notification["fraud_status"].(string)
	transactionID, _ := notification["transaction_id"].(string)
	paymentType, _ := notification["payment_type"].(string)

	// Verify signature
	midtransSvc := services.NewMidtransService()
	if !midtransSvc.VerifySignatureKey(orderID, statusCode, grossAmount, signatureKey) {
		log.Printf("❌ Midtrans Webhook: signature tidak valid untuk order %s", orderID)
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid signature"})
		return
	}

	log.Printf("✅ Midtrans Webhook verified: order=%s status=%s fraud=%s payment=%s", orderID, transactionStatus, fraudStatus, paymentType)

	// Find the order
	var order models.Order
	if result := config.DB.Where("id = ?", orderID).First(&order); result.Error != nil {
		log.Printf("❌ Midtrans Webhook: order %s tidak ditemukan", orderID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Find the payment
	var payment models.Payment
	if result := config.DB.Where("order_id = ?", orderID).First(&payment); result.Error != nil {
		log.Printf("❌ Midtrans Webhook: payment untuk order %s tidak ditemukan", orderID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// Update payment method info
	paymentUpdates := map[string]interface{}{
		"midtrans_trans_id": transactionID,
		"payment_method":    "Midtrans (" + paymentType + ")",
	}

	// Map Midtrans transaction status to our order/payment status
	switch transactionStatus {
	case "capture":
		if fraudStatus == "accept" {
			now := time.Now()
			paymentUpdates["payment_status"] = "Success"
			paymentUpdates["paid_at"] = &now
			config.DB.Model(&order).Updates(map[string]interface{}{
				"status":      "success",
				"proof_uploaded": true,
			})
			log.Printf("✅ Order %s: pembayaran berhasil (capture/accept)", orderID)
			processBiteshipOrderCreation(&order)
		}
	case "settlement":
		now := time.Now()
		paymentUpdates["payment_status"] = "Success"
		paymentUpdates["paid_at"] = &now

		// If order was cancelled (user closed popup but actually paid), re-deduct stock
		if order.Status == "cancelled" {
			log.Printf("🔄 Order %s: reactivating cancelled order (payment received via webhook)", orderID)
			var orderItems []models.OrderItem
			config.DB.Where("order_id = ?", orderID).Find(&orderItems)
			for _, item := range orderItems {
				var product models.Product
				if err := config.DB.Where("id = ?", item.ProductID).First(&product).Error; err == nil {
					config.DB.Model(&product).Update("sold", product.Sold+item.Qty)
				}
				
				// Deduct from warehouse stock
				var whStock models.WarehouseStock
				if item.WarehouseID != nil {
					query := config.DB.Where("product_id = ? AND warehouse_id = ?", item.ProductID, *item.WarehouseID)
					if item.VariantID != nil {
						query = query.Where("variant_id = ?", *item.VariantID)
					} else {
						query = query.Where("variant_id IS NULL")
					}
					if err := query.First(&whStock).Error; err == nil {
						config.DB.Model(&whStock).Update("stock", whStock.Stock-item.Qty)
					}
				}

				var currentStock int
				if whStock.ID != 0 {
					currentStock = whStock.Stock - item.Qty
				} else {
					config.DB.Model(&models.StockLog{}).
						Where("product_id = ?", item.ProductID).
						Select("COALESCE(SUM(qty_changed), 0)").
						Scan(&currentStock)
					currentStock -= item.Qty
				}

				config.DB.Create(&models.StockLog{
					ProductID:   item.ProductID,
					VariantID:   item.VariantID,
					WarehouseID: item.WarehouseID,
					ChangeType:  "deduction",
					QtyChanged:  -item.Qty,
					FinalStock:  currentStock,
					Description: fmt.Sprintf("Reaktivasi Pembayaran Midtrans (Order %s)", orderID),
				})
			}
		}

		config.DB.Model(&order).Updates(map[string]interface{}{
			"status":      "success",
			"proof_uploaded": true,
		})
		log.Printf("✅ Order %s: pembayaran settlement berhasil", orderID)
		processBiteshipOrderCreation(&order)
	case "pending":
		// Don't process pending webhook if order was already cancelled by customer
		if order.Status == "cancelled" {
			log.Printf("⏭️  Order %s: ignoring pending webhook (order already cancelled)", orderID)
			c.JSON(http.StatusOK, gin.H{"status": "ok"})
			return
		}
		paymentUpdates["payment_status"] = "Pending"
		log.Printf("⏳ Order %s: pembayaran pending", orderID)
	case "deny", "cancel", "expire":
		paymentUpdates["payment_status"] = "Failed"
		// Restore stock if order was not yet cancelled
		if order.Status != "cancelled" {
			config.DB.Model(&order).Update("status", "cancelled")
			// Restore stock for cancelled orders
			var orderItems []models.OrderItem
			config.DB.Where("order_id = ?", orderID).Find(&orderItems)
			for _, item := range orderItems {
				var product models.Product
				if err := config.DB.Where("id = ?", item.ProductID).First(&product).Error; err == nil {
					config.DB.Model(&product).Update("sold", product.Sold-item.Qty)
				}
				var currentStock int
				config.DB.Model(&models.StockLog{}).
					Where("product_id = ?", item.ProductID).
					Select("COALESCE(SUM(qty_changed), 0)").
					Scan(&currentStock)

				config.DB.Create(&models.StockLog{
					ProductID:   item.ProductID,
					ChangeType:  "addition",
					QtyChanged:  item.Qty,
					FinalStock:  currentStock + item.Qty,
					Description: fmt.Sprintf("Pembatalan Midtrans (Order %s - %s)", orderID, transactionStatus),
				})
			}
		}
		log.Printf("❌ Order %s: pembayaran %s", orderID, transactionStatus)
	case "refund", "partial_refund":
		paymentUpdates["payment_status"] = "Refund"
		config.DB.Model(&order).Update("status", "refund")
		log.Printf("💰 Order %s: refund diproses", orderID)
	}

	config.DB.Model(&payment).Updates(paymentUpdates)

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
