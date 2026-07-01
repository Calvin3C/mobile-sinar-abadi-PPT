package models

import "time"

// ProductVariant represents a specific variation of a product (e.g. Color)
type ProductVariant struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ProductID string    `gorm:"size:20;not null;index" json:"productId"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	Price     int64     `gorm:"not null;default:0" json:"price"` // if 0, use base product price
	WarehouseStocks []WarehouseStock `gorm:"foreignKey:VariantID" json:"warehouseStocks"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
