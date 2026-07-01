package main

import (
	"fmt"
	"strings"

	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"
)

func main() {
	config.ConnectDatabase()
	db := config.DB

	avianColors := []string{
		"110 Natural White", "SW Super White", "100 M White", "370 Broken White",
		"461 Pearl White", "462 Lunar Cream", "466 Golden Yellow", "199 Sunkist",
		"470 Banana", "480 Lemonade", "465 Medium Yellow", "179 Pumpkin Orange",
		"160 Carrot", "190 Flame Orange", "178 Chile Red", "192 Vermillion",
		"191 Sunrise", "310 Mocha", "334 Light Mahogany", "194 Maroon",
		"335 Red Cherrywood", "329 Golden Brown", "330 Copra Brown", "313 Mahogany Brown",
		"328 Golden Honey", "333 Caramel Apple", "301 Candy Brown", "309 Cinnamon",
		"630 Kiwi", "662 Lime Green", "671 Bud Green", "670 Spring Green",
		"660 Aloe Vera", "650 Evergreen", "652 Pandan Green", "657 Laurel",
		"631 Mint", "642 Cobalt Green", "651 Salem Green", "645 Light Green",
		"732 Diamond Blue", "753 Lake Blue", "733 Ocean Blue", "648 Dark Green",
		"755 Bright Blue", "752 Sea Blue", "750 Deep Ocean", "754 Blue Royal",
		"193 Light Pink", "198 Candy Pink", "197 Orchid Violet", "189 Grape",
		"731 Twilight Blue", "924 Dover Grey", "911 Dove Grey", "915 Dark Grey",
		"303 Suede", "305 Leather", "306 Saddle Brown", "SB Super Black",
	}

	avitexColors := []string{
		"651 Carnation Pink", "601 Blue Romance", "PS-7 Eclatatic", "896 M White",
		"650 Sweet Pink", "600 Blue Harmony", "602 Skyway", "260 Green Bay",
		"720 Candy Pink", "760 Azure Blue", "710 Moon Glow", "818 French Mint",
		"725 Cherry Pink", "660 Lilac Frost", "712 Telur Bebek", "776 Telur Asin",
		"735 Bright Red", "661 Royal Purple", "711 Aqua Marine", "771 Kiwi Gold",
		"622 Fresh Green", "900 Brilliant White", "SW Super White", "AT-1 Barley White",
		"621 Cool Lime", "752 Champagne", "AT-4 Rose White", "812 Flamingo",
		"760 Fresh Mint", "751 Lemon Burst", "740 Lemon Yellow", "730 Orange Juice",
		"620 Apple Green", "775 Tropical", "750 Sunny Yellow", "630 Tangerine",
		"Emerald", "772 Temptation", "755 Golden Yellow", "745 Fiesta",
		"050 Soft Yellow", "AT-5 Lily White", "892 Magnolia", "893 Powder Violet",
		"816 Illusion", "831 Light Cream", "093 Ash Grey", "670 Artic Silver",
		"PS-8 Smiley", "040 Cream", "246 Pearl White", "671 Midnight",
		"610 Earth Yellow", "615 Sunset", "522 Apricot", "675 Modern Grey",
		"765 Sun Flower", "731 Sunshine", "680 Safari", "SB Super Black",
	}

	emcoStandarColors := []string{
		"48 Kuning Krem", "39 Putih", "54 Merah Muda Pucat",
		"51 Kuning", "69 Peach", "86 Ungu Muda",
		"59 Kuning Terang", "52 Jingga Muda", "77 Ungu",
		"117 Kuning", "53 Cokelat Kekuningan", "139 Ungu",
		"118 Kuning Telur", "61 Jingga", "127 Pink Flamingo",
		"119 Kuning Terang", "68 Jingga Tua", "141 Ungu Tua",
		"67 Kuning Emas", "116 Jingga Kemerahan", "78 Merah Ruby",
		"65 Cokelat Muda", "133 Merah", "132 Merah Delima",
		"140 Cokelat Emas", "131 Cokelat Manis", "85 Merah Tua",
		"91 Cokelat", "29 Merah Bata", "92 Cokelat Tua",
		"40 Cokelat Sawo", "31 Cokelat Gelap", "41 Cokelat Kopi",
		"111 Bata", "33 Cokelat Kakao",
	}

	emcoGunungColors := []string{
		"113 Kuning Gading", "93 Abu-abu Kehijauan", "36 Kuning Pucat",
		"79 Hijau Nuri", "120 Abu-abu Hijau", "90 Hijau Zaitun Muda",
		"55 Hijau Zaitun", "121 Biru Kehijauan", "46 Hijau Muda",
		"110 Cokelat Susu", "107 Biru Abu-abu", "81 Biru Tosca",
		"62 Cokelat", "73 Abu-abu Gelap", "105 Biru Abu-abu Muda",
		"108 Hijau Zaitun Gelap", "32 Biru Keabu-abuan", "96 Biru Terang",
		"37 Cokelat Tua", "80 Abu-abu Tua", "88 Biru Tua",
		"76 Cokelat Kemerahan", "44 Hijau Tua", "102 Biru Gelap",
		"111 Cokelat Gelap", "84 Merah Hati", "75 Biru Gelap",
		"87 Cokelat Kopi", "42 Hitam", "82 Biru Dongker",
		"128 Biru Malam", "83 Cokelat Kopra",
	}

	emcoBintangColors := []string{
		"104 Hijau Pucat", "38 Hijau Muda", "56 Hijau Tosca",
		"45 Hijau Zaitun Muda", "58 Hijau Zaitun", "136 Hijau Lemon",
		"34 Hijau", "66 Hijau Daun", "35 Hijau Tua",
		"106 Biru Muda", "49 Hijau Zamrud", "135 Hijau Gelap",
		"109 Biru Terang", "99 Biru Cerah", "27 Hijau Rimba",
		"102 Biru Laut", "70 Biru Sedang", "57 Hijau Gelap",
		"28 Biru Dongker", "63 Biru Tua", "64 Hijau Sangat Gelap",
		"89 Biru Sangat Gelap", "71 Hijau Army",
	}

	aquaproofColors := []string{
		"041 Merah", "101 Coklat", "091 Hijau", "021 Hitam",
		"042 Terakota", "102 Coklat Muda", "092 Hijau Daun", "064 Abu Grafit",
		"045 Merah Delima", "105 Mocca", "093 Hijau Limau", "061 Abu-Abu",
		"071 Orange", "104 Beige", "094 Hijau Muda", "063 Abu Lava",
		"072 Markisa", "081 Cream", "031 Biru", "062 Abu Muda",
		"051 Kuning Tua", "001 Transparan", "032 Biru Muda", "011 Putih",
	}

	decolithColors := []string{
		"273 Misty Morning", "294 Yellow Stone", "2207 Soft Linen", "2208 Salmon", "2209 Ballerina",
		"206 Broken White", "215 Buckskin", "2107 Cherry Wafel", "205 Blush", "2109 Barbecue",
		"218 Silver Grey", "213 Pearl White", "2206 Similarity", "2114 Vulcano", "2112 Magnolia",
		"226 Platinum Grey", "214 Off White", "252 Lemon", "200 Sahara", "2113 Violetta",
		"2201 Cement", "212 Rich Cream", "251 Milky", "286 Yellow Ocker", "2376 Passion",
		"2210 Malibu", "2116 Buffer Blue", "218 Crescendo", "292 Sky Blue", "259 Mediterranean",
		"2211 Wasabi", "225 Seafoam Blue", "220 Crest Blue", "229 Dark Teal",
		"2212 Safari", "219 Alabaster", "203 Pastel Green", "204 Jungle Green", "2217 Sea Green",
		"244 Cendana", "245 Lumut", "241 Monas", "248 Borobudur", "2203 Smoke Grey", "237 Terrakota",
		"286 Apple Green", "2182 Soft Green", "2103 Ice Green", "286 Light Green",
		"274 Light Yellow", "287 Cempaka", "285 Melati", "208 Buttermilk", "284 Light Cream", "2110 Holy Skin",
		"2108 Golden Eye", "253 Nugget", "2162 Orange", "255 Bright Red", "228 Oxide Red", "2111 Red Star",
		"2104 Melon Fiesta", "2123 Green Peace", "2105 Madagascar", "296 Brinjal", "2117 Midnight Blue", "249 Orchid",
	}

	noDropColors := []string{
		"054 Sayur Bening", "042 Santan Kelapa", "044 Gulai Tunjang", "045 Kentang Balado",
		"043 Opor Ayam", "048 Semur Jengkol", "049 Rendang", "050 Dendeng Balado",
		"046 Bubble Gum", "051 Lontong", "052 Sambel Ijo", "053 Pepes Tahu",
		"047 Tumpeng Kapuranto", "039 Tongkol Cue", "040 Teri Jengki", "041 Rawon",
		"068 Sambal Merah",
	}

	var products []models.Product
	db.Find(&products)

	for _, p := range products {
		name := strings.ToLower(p.Name)
		var colors []string

		if strings.Contains(name, "avian") {
			colors = avianColors
		} else if strings.Contains(name, "avitex") {
			colors = avitexColors
		} else if strings.Contains(name, "emco") {
			if strings.Contains(name, "bintang") {
				colors = emcoBintangColors
			} else if strings.Contains(name, "gunung") {
				colors = emcoGunungColors
			} else {
				colors = emcoStandarColors
			}
		} else if strings.Contains(name, "aquaproof") {
			colors = aquaproofColors
		} else if strings.Contains(name, "decolith") {
			colors = decolithColors
		} else if strings.Contains(name, "no drop") {
			colors = noDropColors
		}

		if len(colors) > 0 {
			count := 0
			for _, color := range colors {
				var existing models.ProductVariant
				err := db.Where("product_id = ? AND name = ?", p.ID, color).First(&existing).Error
				if err != nil { // not found
					variant := models.ProductVariant{
						ProductID: p.ID,
						Name:      color,
						Price:     0,
					}
					db.Create(&variant)
					count++
				}
			}
			if count > 0 {
				fmt.Printf("Created %d variants for product %s (%s)\n", count, p.ID, p.Name)
			}
		}
	}
	fmt.Println("Done seeding variants.")
}
