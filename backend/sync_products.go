package main

import (
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"

	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"
)

func main() {
	config.ConnectDatabase()
	
	var products []models.Product
	if err := config.DB.Find(&products).Error; err != nil {
		log.Fatalf("Failed to fetch products: %v", err)
	}

	weightRegex := regexp.MustCompile(`(?i)(\d+(?:\.\d+)?)\s*kg`)

	for _, p := range products {
		catLower := strings.ToLower(p.Category)
		nameLower := strings.ToLower(p.Name)

		isSemen := p.Category == "Semen"
		isCat := strings.Contains(catLower, "cat")
		isBesi := strings.Contains(catLower, "besi") || strings.Contains(nameLower, "besi beton")
		isKloset := strings.Contains(catLower, "kloset") || strings.Contains(nameLower, "kloset")
		isKeramikGranite := strings.Contains(catLower, "keramik") || strings.Contains(nameLower, "keramik") || strings.Contains(catLower, "granit") || strings.Contains(nameLower, "granit")
		isPipa := strings.Contains(catLower, "pipa") || strings.Contains(nameLower, "pipa")
		isBuahGroup := strings.Contains(catLower, "engsel") || strings.Contains(nameLower, "engsel") ||
			strings.Contains(catLower, "kuas") || strings.Contains(nameLower, "kuas") ||
			strings.Contains(catLower, "kunci pintu") || strings.Contains(nameLower, "kunci pintu") ||
			strings.Contains(catLower, "lampu") || strings.Contains(nameLower, "lampu")
		isPerkakas := strings.Contains(catLower, "perkakas")

		weightKg := 0.0
		if matches := weightRegex.FindStringSubmatch(p.Name); len(matches) > 1 {
			weightKg, _ = strconv.ParseFloat(matches[1], 64)
		}

		minPurchase := 1
		unit := "Pcs"

		if isSemen {
			minPurchase = 10
			unit = "Sak"
		} else if isCat {
			if weightKg >= 1 && weightKg <= 5 {
				unit = "Galon"
			} else if weightKg >= 20 && weightKg <= 25 {
				unit = "Pail"
			}
		} else if isBesi {
			unit = "Batang"
		} else if isKloset {
			unit = "Buah"
		} else if isKeramikGranite {
			unit = "Dus"
		} else if isPipa {
			unit = "Batang"
		} else if isBuahGroup {
			unit = "Buah"
		} else if isPerkakas {
			unit = "Unit"
		}

		// Calculate weight in grams
		weightGrams := int(weightKg * 1000)
		if weightGrams == 0 {
			weightGrams = 2000 // 2kg default
		}

		// Extract Brand from first word of name
		brand := strings.Split(p.Name, " ")[0]

		// Update product
		updates := map[string]interface{}{
			"unit":         unit,
			"min_purchase": minPurchase,
			"weight":       weightGrams,
			"brand":        brand,
		}

		if err := config.DB.Model(&p).Updates(updates).Error; err != nil {
			log.Printf("Failed to update product %s: %v", p.ID, err)
		} else {
			fmt.Printf("Updated %s - Unit: %s, Min: %d, Weight: %d, Brand: %s\n", p.ID, unit, minPurchase, weightGrams, brand)
		}
	}
	fmt.Println("Done updating all products!")
}
