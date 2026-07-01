package models

import "time"

// Payment represents a payment transaction for an order.
type Payment struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	OrderID         string     `gorm:"size:30;not null;uniqueIndex" json:"orderId"`

	PaymentMethod   string     `gorm:"size:50" json:"paymentMethod"`                                     // VA, CC, Transfer Bank, Midtrans, dll.
	AmountPaid      int64      `gorm:"not null" json:"amountPaid"`
	PaymentStatus   string     `gorm:"size:20;not null;default:'Pending'" json:"paymentStatus"`          // Pending, Success, Failed
	SnapToken       string     `gorm:"size:255" json:"snapToken"`                                        // Midtrans Snap token
	MidtransTransID string     `gorm:"size:100" json:"midtransTransId"`                                  // Midtrans transaction ID
	PaidAt          *time.Time `json:"paidAt"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}
