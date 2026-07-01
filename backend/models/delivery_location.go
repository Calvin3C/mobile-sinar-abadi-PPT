package models

// DeliveryLocation represents a village/area served by Kurir Toko Sinar Abadi
// with its distance from the store and the corresponding shipping cost.
type DeliveryLocation struct {
	ID           uint    `gorm:"primaryKey" json:"id"`
	Name         string  `gorm:"size:100;not null;uniqueIndex" json:"name"` // Nama desa/lokasi
	DistanceKm   float64 `gorm:"not null" json:"distanceKm"`               // Jarak dari toko (km)
	ShippingCost int64   `gorm:"not null" json:"shippingCost"`              // Ongkos kirim (Rp)
	IsActive     bool    `gorm:"default:true" json:"isActive"`
}
