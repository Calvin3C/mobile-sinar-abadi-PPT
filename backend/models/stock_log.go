package models

import "time"

// StockLog tracks history of product stock changes.
type StockLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ProductID   string    `gorm:"size:20;not null;index" json:"productId"`
	Product     Product   `gorm:"foreignKey:ProductID" json:"-"`
	OwnerID     *uint     `json:"ownerId"`
	Owner       *Owner    `gorm:"foreignKey:OwnerID" json:"-"`
	ChangeType  string    `gorm:"size:20;not null" json:"changeType"` // 'addition', 'deduction', 'adjustment'
	QtyChanged  int       `gorm:"not null" json:"qtyChanged"`
	FinalStock  int       `gorm:"not null" json:"finalStock"`
	Description string    `gorm:"type:text" json:"description"`
	WarehouseID *uint     `json:"warehouseId"`
	VariantID   *uint     `json:"variantId"`
	CreatedAt   time.Time `json:"createdAt"`
}
