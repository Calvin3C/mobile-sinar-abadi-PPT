package models

import "time"

// StockTransfer represents an internal transfer of stock between warehouses.
type StockTransfer struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	ProductID       string     `json:"productId" gorm:"index"`
	VariantID       *uint      `json:"variantId"`
	FromWarehouseID uint       `json:"fromWarehouseId"`
	ToWarehouseID   uint       `json:"toWarehouseId"`
	Quantity        int        `gorm:"column:qty;not null" json:"quantity"`
	Notes           string     `json:"notes"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`

	// Relationships
	Product       *Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	FromWarehouse *Warehouse `gorm:"foreignKey:FromWarehouseID" json:"fromWarehouse,omitempty"`
	ToWarehouse   *Warehouse `gorm:"foreignKey:ToWarehouseID" json:"toWarehouse,omitempty"`
}
