package models

import "time"

type InboundOrder struct {
	ID           uint               `gorm:"primaryKey" json:"id"`
	SupplierName string             `gorm:"size:100;not null" json:"supplierName"`
	ExpectedDate time.Time          `json:"expectedDate"`
	TotalCost    int64              `json:"totalCost"`
	Status       string             `gorm:"size:20;default:'pending'" json:"status"`
	OwnerID      *uint              `json:"ownerId"`
	Items        []InboundOrderItem `json:"items"`
	CreatedAt    time.Time          `json:"createdAt"`
	UpdatedAt    time.Time          `json:"updatedAt"`
}

type InboundOrderItem struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	InboundOrderID uint      `json:"inboundOrderId"`
	ProductID      string    `gorm:"size:50;not null" json:"productId"`
	VariantID      *uint     `json:"variantId"`
	WarehouseID    uint      `json:"warehouseId"`
	Qty            int       `json:"qty"`
	UnitCost       int64     `json:"unitCost"`
	Subtotal       int64     `json:"subtotal"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
