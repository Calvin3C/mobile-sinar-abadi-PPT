package models

type WarehouseStock struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	ProductID   string `gorm:"size:50;not null" json:"productId"`
	VariantID   *uint  `json:"variantId"`
	WarehouseID uint   `json:"warehouseId"`
	Stock       int    `gorm:"default:0" json:"stock"`
}
