package services

import (
	"fmt"
	"math/rand"
	"strings"
	"time"
)

type PaymentService struct{}

func NewPaymentService() *PaymentService {
	return &PaymentService{}
}

// InitiatePaymentResult holds the result of a payment initiation.
type InitiatePaymentResult struct {
	Reference string // VA number or token for manual transfers
	SnapToken string // Midtrans Snap token (only for Midtrans payments)
}

// InitiatePayment handles payment initiation for both manual and Midtrans methods.
func (s *PaymentService) InitiatePayment(orderID string, method string, amount int64, customerName string, customerEmail string, customerPhone string, shippingAddress string, items []SnapItem) (*InitiatePaymentResult, error) {
	methodLower := strings.ToLower(method)

	// ── Midtrans Online Payment ──
	if strings.Contains(methodLower, "midtrans") || strings.Contains(methodLower, "online") {
		var enabledPayments []string
		
		// If specific method passed (e.g. "midtrans_gopay")
		if strings.HasPrefix(methodLower, "midtrans_") {
			specificMethod := strings.TrimPrefix(methodLower, "midtrans_")
			enabledPayments = append(enabledPayments, specificMethod)
		}

		midtrans := NewMidtransService()
		snapResp, err := midtrans.CreateSnapTransaction(orderID, amount, customerName, customerEmail, customerPhone, shippingAddress, items, enabledPayments)
		if err != nil {
			return nil, fmt.Errorf("gagal membuat transaksi Midtrans: %v", err)
		}
		return &InitiatePaymentResult{
			Reference: "MIDTRANS",
			SnapToken: snapResp.Token,
		}, nil
	}

	// ── Transfer Bank Manual ──
	if strings.Contains(methodLower, "transfer") || strings.Contains(methodLower, "bank") {
		return &InitiatePaymentResult{
			Reference: "MANUAL-TRANSFER",
		}, nil
	}

	// ── Legacy: Virtual Account (fallback) ──
	if strings.Contains(methodLower, "virtual account") || strings.Contains(methodLower, "va") {
		rng := rand.New(rand.NewSource(time.Now().UnixNano()))
		vaNumber := fmt.Sprintf("88000%d", rng.Intn(90000000)+10000000)
		return &InitiatePaymentResult{
			Reference: vaNumber,
		}, nil
	}

	// ── Legacy: Credit Card (fallback) ──
	if strings.Contains(methodLower, "credit") {
		return &InitiatePaymentResult{
			Reference: "CC-TOKEN-MOCK-FOR-" + orderID,
		}, nil
	}

	return nil, fmt.Errorf("metode pembayaran %s belum didukung", method)
}
