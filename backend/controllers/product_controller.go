package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"

	"github.com/gin-gonic/gin"
)

// CreateProductInput represents the request body for creating a new product.
type CreateProductInput struct {
	ID          string `json:"id" binding:"required"`
	Category    string `json:"category" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Brand       string `json:"brand"`
	Weight      int    `json:"weight"`
	Length      int    `json:"length"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	Unit        string `json:"unit"`
	MinPurchase int    `json:"minPurchase"`
	Price       int64  `json:"price" binding:"required"`
	Stock       int    `json:"stock"` // initial stock, recorded in stock_logs
	ImageURL    string `json:"img"`
}

// StockUpdateInput represents the request body for stock adjustment.
type StockUpdateInput struct {
	Amount      int   `json:"amount" binding:"required"` // positive = add, negative = subtract
	WarehouseID *uint `json:"warehouseId"`
	VariantID   *uint `json:"variantId"`
}

// UpdateProductInput represents the request body for updating an existing product.
type UpdateProductInput struct {
	Category    string `json:"category"`
	Name        string `json:"name"`
	Brand       string `json:"brand"`
	Weight      int    `json:"weight"`
	Length      int    `json:"length"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	Unit        string `json:"unit"`
	MinPurchase int    `json:"minPurchase"`
	Price       int64  `json:"price"`
	ImageURL    string `json:"img"`
}

// getStockByProductID calculates the current stock for a product
// by summing all stock entries in warehouse_stocks.
func getStockByProductID(productID string) int {
	var totalStock int
	config.DB.Model(&models.WarehouseStock{}).
		Where("product_id = ?", productID).
		Select("COALESCE(SUM(stock), 0)").
		Scan(&totalStock)
	return totalStock
}

// toProductResponse converts a Product model to a ProductResponse with computed stock.
func toProductResponse(product models.Product) models.ProductResponse {
	return models.ProductResponse{
		ID:          product.ID,
		Category:    product.Category,
		Name:        product.Name,
		Brand:       product.Brand,
		Weight:      product.Weight,
		Length:      product.Length,
		Width:       product.Width,
		Height:      product.Height,
		Unit:        product.Unit,
		MinPurchase: product.MinPurchase,
		Price:       product.Price,
		Stock:       getStockByProductID(product.ID),
		Sold:        product.Sold,
		ImageURL:    product.ImageURL,
		Variants:    product.Variants,
		WarehouseStocks: product.WarehouseStocks,
		CreatedAt:   product.CreatedAt,
		UpdatedAt:   product.UpdatedAt,
	}
}

// GetProducts returns a list of products with optional filtering and sorting.
// GET /api/products?search=xxx&category=xxx&sort=termurah|termahal|az|rekomendasi
func GetProducts(c *gin.Context) {
	var products []models.Product

	query := config.DB.Model(&models.Product{}).Preload("Variants").Preload("WarehouseStocks").Preload("Variants.WarehouseStocks")

	// Search filter (by name)
	if search := c.Query("search"); search != "" {
		search = "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ?", search)
	}

	// Category filter
	if category := c.Query("category"); category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}

	// Sorting
	switch c.Query("sort") {
	case "termurah":
		query = query.Order("price ASC")
	case "termahal":
		query = query.Order("price DESC")
	case "az":
		query = query.Order("name ASC")
	default: // "rekomendasi" — sort by most sold
		query = query.Order("sold DESC")
	}

	if result := query.Find(&products); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data produk"})
		return
	}

	// Convert to responses with computed stock
	responses := make([]models.ProductResponse, len(products))
	for i, p := range products {
		responses[i] = toProductResponse(p)
	}

	c.JSON(http.StatusOK, responses)
}

// CreateProduct creates a new product. Admin/Owner only.
// POST /api/products
func CreateProduct(c *gin.Context) {
	var input CreateProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data produk tidak lengkap"})
		return
	}

	// Check for duplicate ID
	var existing models.Product
	if result := config.DB.Where("id = ?", input.ID).First(&existing); result.RowsAffected > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "ID produk sudah digunakan"})
		return
	}

	l := input.Length
	w := input.Width
	h := input.Height
	if l <= 0 { l = 1 }
	if w <= 0 { w = 1 }
	if h <= 0 { h = 1 }

	product := models.Product{
		ID:          input.ID,
		Category:    input.Category,
		Name:        input.Name,
		Brand:       input.Brand,
		Weight:      input.Weight,
		Length:      l,
		Width:       w,
		Height:      h,
		Unit:        input.Unit,
		MinPurchase: input.MinPurchase,
		Price:       input.Price,
		Sold:        0,
		ImageURL:    input.ImageURL,
	}

	if result := config.DB.Create(&product); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menambah produk"})
		return
	}

	// Log initial stock in stock_logs
	if input.Stock > 0 {
		ownerIDVal, exists := c.Get("userId")
		var ownerIDPtr *uint
		if exists && ownerIDVal != nil {
			id := ownerIDVal.(uint)
			ownerIDPtr = &id
		}

		config.DB.Create(&models.StockLog{
			ProductID:   product.ID,
			OwnerID:     ownerIDPtr,
			ChangeType:  "addition",
			QtyChanged:  input.Stock,
			FinalStock:  input.Stock,
			Description: "Stok Awal Produk Baru",
		})
	}

	c.JSON(http.StatusCreated, toProductResponse(product))
}

// UpdateStock adjusts a product's stock. Owner only.
// PUT /api/products/:id/stock
func UpdateStock(c *gin.Context) {
	productID := c.Param("id")

	var input StockUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Field 'amount' diperlukan (+ untuk tambah, - untuk kurang)"})
		return
	}

	var product models.Product
	if result := config.DB.Where("id = ?", productID).First(&product); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
		return
	}

	// Update or create WarehouseStock if WarehouseID is provided
	var currentStock int
	var ws models.WarehouseStock
	
	if input.WarehouseID != nil {
		err := config.DB.Where(models.WarehouseStock{
			ProductID:   product.ID,
			VariantID:   input.VariantID,
			WarehouseID: *input.WarehouseID,
		}).FirstOrCreate(&ws).Error

		if err == nil {
			currentStock = ws.Stock
		}
	} else {
		// Calculate current stock from stock_logs if no warehouse is specified (legacy behavior fallback)
		currentStock = getStockByProductID(productID)
	}

	newStock := currentStock + input.Amount
	if newStock < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stok di gudang ini tidak mencukupi untuk dikurangi"})
		return
	}

	actualChange := newStock - currentStock

	if actualChange != 0 && input.WarehouseID != nil {
		config.DB.Model(&ws).Update("stock", newStock)
	}

	// Log stock change
	if actualChange != 0 {
		changeType := "addition"
		reason := "Penambahan Manual Owner"
		if actualChange < 0 {
			changeType = "deduction"
			reason = "Pengurangan Manual Owner"
		}

		ownerIDVal, exists := c.Get("userId")
		var ownerIDPtr *uint
		if exists && ownerIDVal != nil {
			id := ownerIDVal.(uint)
			ownerIDPtr = &id
		}

		config.DB.Create(&models.StockLog{
			ProductID:   product.ID,
			VariantID:   input.VariantID,
			WarehouseID: input.WarehouseID,
			OwnerID:     ownerIDPtr,
			ChangeType:  changeType,
			QtyChanged:  actualChange,
			FinalStock:  newStock,
			Description: reason,
		})
	}

	// Reload product with preloads to return complete updated data
	config.DB.Preload("Variants").Preload("WarehouseStocks").Preload("Variants.WarehouseStocks").Where("id = ?", productID).First(&product)


	resp := toProductResponse(product)
	c.JSON(http.StatusOK, gin.H{
		"message": "Stok berhasil diperbarui",
		"product": resp,
	})
}

// UpdateProduct updates an existing product's details. Owner only.
// PUT /api/products/:id
func UpdateProduct(c *gin.Context) {
	productID := c.Param("id")

	var input UpdateProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data produk tidak valid"})
		return
	}

	var product models.Product
	if result := config.DB.Where("id = ?", productID).First(&product); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
		return
	}

	updates := map[string]interface{}{}
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Category != "" {
		updates["category"] = input.Category
	}
	if input.Price > 0 {
		updates["price"] = input.Price
	}
	if input.Brand != "" {
		updates["brand"] = input.Brand
	}
	if input.Weight > 0 {
		updates["weight"] = input.Weight
	}
	if input.Length > 0 {
		updates["length"] = input.Length
	}
	if input.Width > 0 {
		updates["width"] = input.Width
	}
	if input.Height > 0 {
		updates["height"] = input.Height
	}
	if input.Unit != "" {
		updates["unit"] = input.Unit
	}
	if input.MinPurchase > 0 {
		updates["min_purchase"] = input.MinPurchase
	}
	if input.ImageURL != "" {
		updates["image_url"] = input.ImageURL
	}

	config.DB.Model(&product).Updates(updates)

	// Reload
	config.DB.First(&product, "id = ?", productID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Produk berhasil diperbarui",
		"product": toProductResponse(product),
	})
}

// GetProductByID retrieves a single product by its ID.
// GET /api/products/:id
func GetProductByID(c *gin.Context) {
	productID := c.Param("id")

	var product models.Product
	if result := config.DB.Preload("Variants").Preload("WarehouseStocks").Preload("Variants.WarehouseStocks").Where("id = ?", productID).First(&product); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, toProductResponse(product))
}

// UploadProductImage handles image uploads from mobile app. Owner/Admin only.
// POST /api/products/upload
func UploadProductImage(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal membaca file gambar"})
		return
	}

	if err := os.MkdirAll("uploads/products", 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat direktori upload"})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("mobile_product_%d%s", time.Now().UnixNano(), ext)
	filepathStr := fmt.Sprintf("uploads/products/%s", filename)

	if err := c.SaveUploadedFile(file, filepathStr); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan gambar"})
		return
	}

	// Host URL is needed to form the full URL, or just return relative URL
	// Depending on frontend, relative might be better, or absolute based on request host
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	host := c.Request.Host
	imgURL := fmt.Sprintf("%s://%s/storage/products/%s", scheme, host, filename)

	c.JSON(http.StatusOK, gin.H{
		"message": "Gambar berhasil diunggah",
		"image_url": imgURL,
	})
}
