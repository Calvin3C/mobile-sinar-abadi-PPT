package models

import "time"

// Admin represents an administrative user who manages orders and products.
type Admin struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"uniqueIndex;size:100;not null" json:"username"`
	Email     string    `gorm:"uniqueIndex;size:200" json:"email"`
	Password  string    `gorm:"not null" json:"-"` // never exposed in JSON responses
	Name      string    `gorm:"size:200;not null" json:"name"`
	Phone     string    `gorm:"size:50" json:"phone"`
	Role      string    `gorm:"-" json:"role"` // Computed or hardcoded in response for frontend compatibility
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
