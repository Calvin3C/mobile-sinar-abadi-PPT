package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"

	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"

	"github.com/gin-gonic/gin"
)

type ChatMessage struct {
	Role string `json:"role"`
	Text string `json:"text"`
}

type ChatbotRequest struct {
	History []ChatMessage `json:"history"`
}

// Gemini request structures
type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiContent struct {
	Role  string       `json:"role"`
	Parts []GeminiPart `json:"parts"`
}

type GeminiSystemInstruction struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiRequest struct {
	Contents          []GeminiContent         `json:"contents"`
	SystemInstruction GeminiSystemInstruction `json:"systemInstruction"`
}

// Gemini response structures
type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func HandleChatbot(c *gin.Context) {
	var req ChatbotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// 1. Fetch all active products
	var products []models.Product
	if err := config.DB.Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data produk"})
		return
	}

	// 2. Build product context
	productText := "Berikut adalah daftar barang/produk yang dijual di Toko Bangunan Sinar Abadi beserta harganya:\n"
	for _, p := range products {
		productText += fmt.Sprintf("- %s (Harga: Rp %d)\n", p.Name, p.Price)
	}

	// 3. Build System Instruction
	systemPrompt := `Anda adalah Asisten Virtual (Konsultan Proyek) untuk "Toko Bangunan Sinar Abadi".
Tugas Anda adalah membantu pelanggan menghitung kebutuhan material bangunan dan merekomendasikan produk yang tepat.
Gunakan bahasa Indonesia yang sopan, ramah, dan solutif.
Saat merekomendasikan produk, PASTIKAN Anda HANYA merekomendasikan produk yang ada di daftar berikut. Jangan mengarang harga atau merekomendasikan barang yang tidak ada di daftar.
Beri format jawaban yang rapi. Jangan ragu menyarankan jumlah yang perlu dibeli sesuai perhitungan proyek (misal ukuran luas x kubikasi).

` + productText

	// 4. Build Gemini Request payload
	geminiReq := GeminiRequest{
		SystemInstruction: GeminiSystemInstruction{
			Parts: []GeminiPart{{Text: systemPrompt}},
		},
		Contents: []GeminiContent{},
	}

	// Map history to Gemini contents
	for _, msg := range req.History {
		role := msg.Role
		if role == "assistant" {
			role = "model" // Gemini uses "model" instead of "assistant"
		}
		if role != "user" && role != "model" {
			role = "user"
		}
		geminiReq.Contents = append(geminiReq.Contents, GeminiContent{
			Role:  role,
			Parts: []GeminiPart{{Text: msg.Text}},
		})
	}

	// 5. Send Request to Gemini API
	apiKey := os.Getenv("GEMINI_API_KEY")
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=%s", apiKey)

	reqBodyBytes, err := json.Marshal(geminiReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encode request"})
		return
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(reqBodyBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal terhubung ke AI server"})
		return
	}
	defer resp.Body.Close()

	respBodyBytes, _ := ioutil.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI error", "details": string(respBodyBytes)})
		return
	}

	var geminiResp GeminiResponse
	if err := json.Unmarshal(respBodyBytes, &geminiResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membaca respons AI"})
		return
	}

	if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
		aiReply := geminiResp.Candidates[0].Content.Parts[0].Text
		c.JSON(http.StatusOK, gin.H{"reply": aiReply})
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI tidak memberikan jawaban yang valid"})
	}
}
