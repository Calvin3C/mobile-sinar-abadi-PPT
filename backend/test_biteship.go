package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

func main() {
	apiKey := "biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiU2luYXIgQWJhZGkiLCJ1c2VySWQiOiI2YTFlZTlhOGIwMzliOTMyNjIwOTMyNmQiLCJpYXQiOjE3ODA0MTEwMDV9.nLt_EleNxyRwrEatn5NwQPTbQl0lgQc6w0nqJbGQY1k"
	
	payload := map[string]interface{}{
		"origin_area_id":      "IDNP11IDNC250IDND2604IDZ65181",
		"destination_area_id": "IDNP11IDNC250IDND2615IDZ65116",
		"couriers":            "jne,sicepat,jnt",
		"items": []map[string]interface{}{
			{
				"name": "Bata",
				"value": 1000,
				"quantity": 1,
				"weight": 2000,
			},
		},
	}

	jsonPayload, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://api.biteship.com/v1/rates/couriers", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Authorization", apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	fmt.Println("Status:", resp.StatusCode)
	fmt.Println("Body:", string(bodyBytes))
}
