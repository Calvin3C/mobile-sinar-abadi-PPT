package models

import "time"

// Shipping represents the logistics details for an order.
type Shipping struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	OrderID            string    `gorm:"size:30;not null;uniqueIndex" json:"orderId"`
	ShippingMethodID   uint      `json:"shippingMethodId"`
	ShippingMethodName string    `gorm:"size:100;not null" json:"shippingMethodName"` // Ambil di Toko, Kurir Toko Sinar Abadi, Ekspedisi JNE
	AdminID            *uint     `json:"adminId"` // References Admin who processed the shipment
	TrackingNumber     string    `gorm:"size:30" json:"trackingNumber"`               // Used for WhatsApp number
	ShippingCost       int64     `gorm:"not null;default:0" json:"shippingCost"`
	DestinationAddress string    `gorm:"type:text;not null" json:"destinationAddress"`
	BiteshipAreaID     string    `json:"biteshipAreaId"` // Added for Biteship integration
	CourierCode        string    `gorm:"size:50" json:"courierCode"`        // e.g. "jne", "sicepat"
	CourierServiceCode string    `gorm:"size:50" json:"courierServiceCode"` // e.g. "reg", "best", "jtr", "gokil"
	BiteshipOrderID    string    `gorm:"size:100" json:"biteshipOrderId"`
	WaybillID          string    `gorm:"size:100" json:"waybillId"`

	// Kurir Toko Sinar Abadi specific fields
	DeliveryLocationID *uint  `json:"deliveryLocationId"`                                         // FK to delivery_locations table
	FleetVehicleID     *uint  `json:"fleetVehicleId"`                                             // FK to fleet_vehicles table (assigned vehicle)
	DeliveryStatus     string `gorm:"size:30;not null;default:'Menunggu'" json:"deliveryStatus"` // Menunggu / Diproses / Dikirim / Selesai

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
