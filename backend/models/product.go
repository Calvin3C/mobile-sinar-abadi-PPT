package models

import "time"

// Product represents a building material item in the catalog.
// Stock is NOT stored here — it is computed from the stock_logs table.
type Product struct {
	ID          string    `gorm:"primaryKey;size:20" json:"id"`   // e.g. "P-001"
	Category    string    `gorm:"size:100;not null" json:"category"`
	Name        string    `gorm:"size:300;not null" json:"name"`
	Brand       string    `gorm:"size:100" json:"brand"`          // Merek
	Weight      int       `gorm:"default:0" json:"weight"`        // Berat dalam Gram
	Length      int       `gorm:"default:1" json:"length"`        // Panjang dalam cm
	Width       int       `gorm:"default:1" json:"width"`         // Lebar dalam cm
	Height      int       `gorm:"default:1" json:"height"`        // Tinggi dalam cm
	Unit        string    `gorm:"size:50" json:"unit"`            // Satuan (misal: Sak, Kg)
	MinPurchase int       `gorm:"default:1" json:"minPurchase"`   // Pembelian Minimal
	Price       int64     `gorm:"not null" json:"price"`          // in Rupiah (integer, no floating point)
	Sold        int       `gorm:"not null;default:0" json:"sold"` // popularity counter
	ImageURL    string           `gorm:"size:500" json:"img"`            // JSON key "img" matches frontend
	Variants    []ProductVariant `gorm:"foreignKey:ProductID" json:"variants"`
	WarehouseStocks []WarehouseStock `gorm:"foreignKey:ProductID" json:"warehouseStocks"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// ProductResponse is the API response struct that includes the computed stock.
// Stock is calculated dynamically from SUM(qty_changed) in stock_logs.
type ProductResponse struct {
	ID          string    `json:"id"`
	Category    string    `json:"category"`
	Name        string    `json:"name"`
	Brand       string    `json:"brand"`
	Weight      int       `json:"weight"`
	Length      int       `json:"length"`
	Width       int       `json:"width"`
	Height      int       `json:"height"`
	Unit        string    `json:"unit"`
	MinPurchase int       `json:"minPurchase"`
	Price       int64     `json:"price"`
	Stock       int       `json:"stock"` // computed from stock_logs
	Sold        int       `json:"sold"`
	ImageURL    string           `json:"img"`
	Variants    []ProductVariant `json:"variants"`
	WarehouseStocks []WarehouseStock `json:"warehouseStocks"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
