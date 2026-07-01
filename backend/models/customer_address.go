package models

import "time"

// CustomerAddress represents an address belonging to a customer
type CustomerAddress struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	CustomerID     uint      `gorm:"not null" json:"customerId"`
	Label          string    `gorm:"size:100;not null" json:"label"`          // e.g. "Rumah", "Kantor"
	RecipientName  string    `gorm:"size:200;not null" json:"name"`           // Recipient name
	PhoneNumber    string    `gorm:"size:50;not null" json:"phone"`           // Phone number
	City           string    `gorm:"size:200" json:"kota"`                    // City/district display name
	FullAddress    string    `gorm:"type:text;not null" json:"address"`       // Full address text
	Notes          string    `gorm:"size:200" json:"catatan"`                 // Notes for courier
	PostalCode     string    `gorm:"size:20" json:"postalCode"`
	BiteshipAreaID string    `gorm:"size:100" json:"biteshipAreaId"`          // Important for Biteship API
	IsPrimary      bool      `gorm:"default:false" json:"isMain"`            // Is this the main address?
	Pinpoint       bool      `gorm:"default:false" json:"pinpoint"`          // Pinpoint set?
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
