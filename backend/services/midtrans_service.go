package services

import (
	"crypto/sha512"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

// MidtransService handles communication with Midtrans Snap API.
type MidtransService struct {
	ServerKey    string
	ClientKey    string
	IsProduction bool
	BaseURL      string
}

// NewMidtransService creates a new MidtransService with env config.
func NewMidtransService() *MidtransService {
	serverKey := os.Getenv("MIDTRANS_SERVER_KEY")
	clientKey := os.Getenv("MIDTRANS_CLIENT_KEY")
	isProduction := os.Getenv("MIDTRANS_IS_PRODUCTION") == "true"

	baseURL := "https://app.sandbox.midtrans.com"
	if isProduction {
		baseURL = "https://app.midtrans.com"
	}

	return &MidtransService{
		ServerKey:    serverKey,
		ClientKey:    clientKey,
		IsProduction: isProduction,
		BaseURL:      baseURL,
	}
}

// SnapItem represents an item in the Midtrans transaction.
type SnapItem struct {
	ID       string `json:"id"`
	Price    int64  `json:"price"`
	Quantity int    `json:"quantity"`
	Name     string `json:"name"`
}

// SnapResponse represents the response from Midtrans Snap API.
type SnapResponse struct {
	Token       string `json:"token"`
	RedirectURL string `json:"redirect_url"`
}

// CreateSnapTransaction creates a Midtrans Snap transaction and returns the token.
func (s *MidtransService) CreateSnapTransaction(orderID string, amount int64, customerName string, customerEmail string, customerPhone string, shippingAddress string, items []SnapItem, enabledPayments []string) (*SnapResponse, error) {
	if s.ServerKey == "" {
		return nil, fmt.Errorf("MIDTRANS_SERVER_KEY belum dikonfigurasi")
	}

	// If no email provided, use a default
	if customerEmail == "" {
		customerEmail = "customer@sinarabadi.com"
	}
	if customerPhone == "" {
		customerPhone = "08123456789"
	}

	// Build the request payload
	payload := map[string]interface{}{
		"transaction_details": map[string]interface{}{
			"order_id":     orderID,
			"gross_amount": amount,
		},
		"customer_details": map[string]interface{}{
			"first_name": customerName,
			"email":      customerEmail,
			"phone":      customerPhone,
			"shipping_address": map[string]interface{}{
				"first_name": customerName,
				"phone":      customerPhone,
				"address":    shippingAddress,
			},
		},
		"item_details": items,
		"credit_card": map[string]interface{}{
			"secure": true,
		},
	}

	if len(enabledPayments) > 0 {
		payload["enabled_payments"] = enabledPayments
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("gagal marshal payload: %v", err)
	}

	// Call Midtrans Snap API
	url := s.BaseURL + "/snap/v1/transactions"
	req, err := http.NewRequest("POST", url, strings.NewReader(string(jsonPayload)))
	if err != nil {
		return nil, fmt.Errorf("gagal membuat request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	// Basic Auth with Server Key as username, empty password
	req.SetBasicAuth(s.ServerKey, "")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gagal menghubungi Midtrans: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("gagal membaca response: %v", err)
	}

	log.Printf("🔔 Midtrans Snap API Response [%d]: %s", resp.StatusCode, string(body))

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("midtrans error (%d): %s", resp.StatusCode, string(body))
	}

	var snapResp SnapResponse
	if err := json.Unmarshal(body, &snapResp); err != nil {
		return nil, fmt.Errorf("gagal parse response Midtrans: %v", err)
	}

	return &snapResp, nil
}

// VerifySignatureKey verifies the Midtrans notification signature.
// Signature = SHA512(order_id + status_code + gross_amount + server_key)
func (s *MidtransService) VerifySignatureKey(orderID string, statusCode string, grossAmount string, signatureKey string) bool {
	raw := orderID + statusCode + grossAmount + s.ServerKey
	hash := sha512.Sum512([]byte(raw))
	computed := fmt.Sprintf("%x", hash)
	return computed == signatureKey
}
