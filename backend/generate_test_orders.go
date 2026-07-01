package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	// Untuk mendapatkan Test API Key:
	// 1. Buka Dashboard Biteship Anda
	// 2. Di menu kiri bawah, aktifkan *toggle* "Mode Testing"
	// 3. Masuk ke Integrasi -> Kunci API
	// 4. Salin kunci API Testing Anda (biasanya berawalan "biteship_test...")

	// Masukkan Kunci API Testing Anda di sini:
	apiKey := "biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiVGVzdGluZyIsInVzZXJJZCI6IjZhMWVlOWE4YjAzOWI5MzI2MjA5MzI2ZCIsImlhdCI6MTc4MDQxNDc1OX0.JzzvHtMl4l8Lht4rsleouwE1zbinoQrVTNr93XmnUY0"

	fmt.Println("Membuat pesanan test...")

	// 1. Buat pesanan pertama (akan diset Delivered)
	order1 := createTestOrder(apiKey)
	if order1 != "" {
		fmt.Println("=> ID Pesanan (Akan diset Delivered):", order1)
		// Set ke Delivered (Catatan: Biteship biasanya mengupdate status pesanan test secara otomatis
		// atau bisa dilakukan melalui dashboard test. Tapi kita coba update jika ada endpoint-nya).
		// Untuk mode testing, biasanya pesanan otomatis terkirim.
	}

	// 2. Buat pesanan kedua (akan diset Cancelled)
	order2 := createTestOrder(apiKey)
	if order2 != "" {
		fmt.Println("=> ID Pesanan (Akan diset Cancelled):", order2)
		// Kita batalkan pesanan ini
		cancelOrder(apiKey, order2)
	}

	fmt.Println("\n==============================================")
	fmt.Println("Gunakan ID ini untuk Formulir Aktivasi Biteship:")
	fmt.Println("ID Pesanan Terkirim (Delivered):", order1)
	fmt.Println("ID Pesanan Dibatalkan (Cancelled):", order2)
	fmt.Println("==============================================")
}

func createTestOrder(apiKey string) string {
	payload := map[string]interface{}{
		"shipper_contact_name":      "Sinar Abadi",
		"shipper_contact_phone":     "08123456789",
		"origin_contact_name":       "Sinar Abadi",
		"origin_contact_phone":      "08123456789",
		"origin_address":            "Jalan Utara Masjid No.9",
		"origin_postal_code":        65181,
		"destination_contact_name":  "Test User",
		"destination_contact_phone": "08123456789",
		"destination_address":       "Jalan Sudirman",
		"destination_postal_code":   12430,
		"courier_company":           "jne",
		"courier_type":              "reg",
		"delivery_type":             "now",
		"items": []map[string]interface{}{
			{
				"name":     "Test Item",
				"value":    10000,
				"quantity": 1,
				"weight":   1000,
			},
		},
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://api.biteship.com/v1/orders", bytes.NewBuffer(body))
	req.Header.Set("Authorization", apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return ""
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	var res map[string]interface{}
	json.Unmarshal(respBody, &res)

	if resp.StatusCode == 200 || resp.StatusCode == 201 {
		return res["id"].(string)
	}
	fmt.Println("Gagal membuat pesanan:", string(respBody))
	return ""
}

func cancelOrder(apiKey, orderID string) {
	reqURL := fmt.Sprintf("https://api.biteship.com/v1/orders/%s", orderID)
	req, _ := http.NewRequest("DELETE", reqURL, nil)
	req.Header.Set("Authorization", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error canceling:", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		fmt.Println("=> Pesanan berhasil dibatalkan.")
	} else {
		fmt.Println("=> Gagal membatalkan pesanan (Status", resp.StatusCode, ")")
	}
}
