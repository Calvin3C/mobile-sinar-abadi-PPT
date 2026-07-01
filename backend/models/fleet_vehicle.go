package models

// FleetVehicle represents a delivery vehicle owned by Toko Sinar Abadi.
// The store has 2 vehicles: L300 and Mitsubishi Canter.
type FleetVehicle struct {
	ID             uint    `gorm:"primaryKey" json:"id"`
	Name           string  `gorm:"size:100;not null" json:"name"`                   // "L300", "Mitsubishi Canter"
	Plate          string  `gorm:"size:20" json:"plate"`                             // Plat nomor (opsional)
	Status         string  `gorm:"size:30;not null;default:'Tersedia'" json:"status"` // Tersedia / Sedang Mengantar
	CurrentOrderID *string `gorm:"size:30" json:"currentOrderId"`                    // Order ID yang sedang diantar (nullable)
}
