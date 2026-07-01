package seed

import (
	"log"

	"sinar-abadi-backend/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// RunSeeder populates the database with initial data if tables are empty.
func RunSeeder(db *gorm.DB) {
	seedUsers(db)
	seedProducts(db)
	seedOrders(db)
	seedAddresses(db)
	seedDeliveryLocations(db)
	seedFleetVehicles(db)
}

// ---- CUSTOMERS, ADMINS, OWNERS ----
func seedUsers(db *gorm.DB) {
	hashPw := func(pw string) string {
		h, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
		return string(h)
	}

	// Update existing admin and owner emails and passwords
	db.Exec("UPDATE admins SET email = 'admin123@gmail.com', password = ? WHERE username = 'admin' AND (email IS NULL OR email = '')", hashPw("admin123"))
	db.Exec("UPDATE owners SET email = 'prihatini.duvaltina@gmail.com', password = ? WHERE username = 'owner' AND (email IS NULL OR email = '')", hashPw("Anthony271205"))

	var customerCount, adminCount, ownerCount int64
	db.Model(&models.Customer{}).Count(&customerCount)
	db.Model(&models.Admin{}).Count(&adminCount)
	db.Model(&models.Owner{}).Count(&ownerCount)

	if customerCount > 0 && adminCount > 0 && ownerCount > 0 {
		log.Println("⏭️  Users tables already seeded, skipping...")
		return
	}

	customers := []models.Customer{
		{Username: "budi", Password: hashPw("123"), Name: "Budi Santoso"},
	}
	for _, c := range customers {
		if err := db.Create(&c).Error; err != nil {
			log.Printf("⚠️  Failed to seed customer: %v", err)
		}
	}

	admins := []models.Admin{
		{Username: "admin", Email: "admin123@gmail.com", Password: hashPw("admin123"), Name: "Admin Operasional"},
	}
	for _, a := range admins {
		if err := db.Create(&a).Error; err != nil {
			log.Printf("⚠️  Failed to seed admin: %v", err)
		}
	}

	owners := []models.Owner{
		{Username: "owner", Email: "prihatini.duvaltina@gmail.com", Password: hashPw("Anthony271205"), Name: "Dewan Direksi"},
	}
	for _, o := range owners {
		if err := db.Create(&o).Error; err != nil {
			log.Printf("⚠️  Failed to seed owner: %v", err)
		}
	}

	log.Println("✅ Seeded default customer, admin, and owner")
}

// productWithInitialStock holds product data and its initial stock for seeding.
type productWithInitialStock struct {
	Product      models.Product
	InitialStock int
}

// ---- PRODUCTS ----
func seedProducts(db *gorm.DB) {
	var count int64
	db.Model(&models.Product{}).Count(&count)
	if count > 0 {
		log.Println("⏭️  Products table already seeded, skipping...")
		return
	}

	items := []productWithInitialStock{
		// =====================================================================
		// SEMEN (IsLarge = true)
		// =====================================================================
		{Product: models.Product{ID: "P-001", Category: "Semen", Name: "Semen Gresik 40 kg", Weight: 40000, Price: 59000, Sold: 70, ImageURL: "http://localhost:8000/images/products/semen_gresik.png"}, InitialStock: 30},
		{Product: models.Product{ID: "P-002", Category: "Semen", Name: "Semen Gresik 50 kg", Weight: 50000, Price: 72000, Sold: 40, ImageURL: "http://localhost:8000/images/products/semen_gresik.png"}, InitialStock: 25},
		{Product: models.Product{ID: "P-003", Category: "Semen", Name: "Semen Merah Putih 40 kg", Weight: 40000, Price: 47000, Sold: 113, ImageURL: "http://localhost:8000/images/products/semen_merah_putih.webp"}, InitialStock: 7},
		{Product: models.Product{ID: "P-004", Category: "Semen", Name: "Semen Merah Putih 50 kg", Weight: 50000, Price: 57000, Sold: 90, ImageURL: "http://localhost:8000/images/products/semen_merah_putih.webp"}, InitialStock: 20},
		{Product: models.Product{ID: "P-005", Category: "Semen", Name: "Semen Putih Panda 40 kg", Weight: 40000, Price: 65000, Sold: 0, ImageURL: "http://localhost:8000/images/products/semen_panda.png"}, InitialStock: 80},
		{Product: models.Product{ID: "P-006", Category: "Semen", Name: "Semen Putih Tiga Roda 40 kg", Weight: 40000, Price: 120000, Sold: 81, ImageURL: "http://localhost:8000/images/products/semen_tiga_roda.png"}, InitialStock: 18},
		{Product: models.Product{ID: "P-007", Category: "Semen", Name: "Semen Singa Merah 40 kg", Weight: 40000, Price: 45000, Sold: 30, ImageURL: "http://localhost:8000/images/products/semen_singa_merah.jpg"}, InitialStock: 70},
		{Product: models.Product{ID: "P-008", Category: "Semen", Name: "Semen Singa Merah 50 kg", Weight: 50000, Price: 56000, Sold: 15, ImageURL: "http://localhost:8000/images/products/semen_singa_merah.jpg"}, InitialStock: 40},
		{Product: models.Product{ID: "P-009", Category: "Semen", Name: "Semen Perekat Bata Ringan Eco 20 kg", Weight: 20000, Price: 65000, Sold: 0, ImageURL: "http://localhost:8000/images/products/semen_perekat_eco.jpg"}, InitialStock: 70},
		{Product: models.Product{ID: "P-010", Category: "Semen", Name: "Semen Perekat Bata Ringan Drymix 20 kg", Weight: 20000, Price: 75000, Sold: 0, ImageURL: "http://localhost:8000/images/products/semen_drymix.png"}, InitialStock: 70},
		{Product: models.Product{ID: "P-011", Category: "Semen", Name: "Semen Sika Perekat Granit 20 kg", Weight: 20000, Price: 110000, Sold: 0, ImageURL: "http://localhost:8000/images/products/semen_sika_granit.png"}, InitialStock: 50},

		// =====================================================================
		// PLUMBING — Maspion AW (IsLarge = false)
		// =====================================================================
		{Product: models.Product{ID: "P-009", Category: "Perpipaan", Name: "Pipa Maspion 1/2 AW", Weight: 1000, Price: 35000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_aw.png"}, InitialStock: 200},
		{Product: models.Product{ID: "P-010", Category: "Perpipaan", Name: "Pipa Maspion 3/4 AW", Weight: 1200, Price: 42000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_aw.png"}, InitialStock: 200},
		{Product: models.Product{ID: "P-011", Category: "Perpipaan", Name: "Pipa Maspion 1 AW", Weight: 1800, Price: 56000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_aw.png"}, InitialStock: 150},
		{Product: models.Product{ID: "P-012", Category: "Perpipaan", Name: "Pipa Maspion 1 1/4 AW", Weight: 2400, Price: 74000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_aw.png"}, InitialStock: 100},
		{Product: models.Product{ID: "P-013", Category: "Perpipaan", Name: "Pipa Maspion 1 1/2 AW", Weight: 3100, Price: 98000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_aw.png"}, InitialStock: 100},
		{Product: models.Product{ID: "P-014", Category: "Perpipaan", Name: "Pipa Maspion 2 AW", Weight: 4500, Price: 138000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_aw.png"}, InitialStock: 80},
		{Product: models.Product{ID: "P-015", Category: "Perpipaan", Name: "Pipa Maspion 2 1/2 AW", Weight: 5700, Price: 185000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_aw.png"}, InitialStock: 60},
		{Product: models.Product{ID: "P-016", Category: "Perpipaan", Name: "Pipa Maspion 3 AW", Weight: 8800, Price: 255000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_aw.png"}, InitialStock: 50},
		{Product: models.Product{ID: "P-017", Category: "Perpipaan", Name: "Pipa Maspion 4 AW", Weight: 13600, Price: 385000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_aw.png"}, InitialStock: 40},
		{Product: models.Product{ID: "P-018", Category: "Perpipaan", Name: "Pipa Maspion 5 AW", Weight: 17800, Price: 575000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_aw.png"}, InitialStock: 30},
		{Product: models.Product{ID: "P-019", Category: "Perpipaan", Name: "Pipa Maspion 6 AW", Weight: 26800, Price: 765000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_aw.png"}, InitialStock: 20},
		{Product: models.Product{ID: "P-020", Category: "Perpipaan", Name: "Pipa Maspion 8 AW", Weight: 40500, Price: 1275000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_aw.png"}, InitialStock: 15},

		// Maspion C
		{Product: models.Product{ID: "P-021", Category: "Perpipaan", Name: "Pipa Maspion 5/8 C", Weight: 900, Price: 9000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_c.png"}, InitialStock: 300},
		{Product: models.Product{ID: "P-022", Category: "Perpipaan", Name: "Pipa Maspion 3/4 C", Weight: 1600, Price: 16000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_c.png"}, InitialStock: 250},
		{Product: models.Product{ID: "P-023", Category: "Perpipaan", Name: "Pipa Maspion 1 C", Weight: 2200, Price: 26000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_c.png"}, InitialStock: 200},
		{Product: models.Product{ID: "P-024", Category: "Perpipaan", Name: "Pipa Maspion 1 1/4 C", Weight: 3200, Price: 31000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_c.png"}, InitialStock: 150},
		{Product: models.Product{ID: "P-025", Category: "Perpipaan", Name: "Pipa Maspion 1 1/2 C", Weight: 4000, Price: 37000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_c.png"}, InitialStock: 150},
		{Product: models.Product{ID: "P-026", Category: "Perpipaan", Name: "Pipa Maspion 2 C", Weight: 5200, Price: 58000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_c.png"}, InitialStock: 100},
		{Product: models.Product{ID: "P-027", Category: "Perpipaan", Name: "Pipa Maspion 2 1/2 C", Weight: 6500, Price: 69000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_c.png"}, InitialStock: 80},
		{Product: models.Product{ID: "P-028", Category: "Perpipaan", Name: "Pipa Maspion 3 C", Weight: 8000, Price: 79000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_c.png"}, InitialStock: 60},
		{Product: models.Product{ID: "P-029", Category: "Perpipaan", Name: "Pipa Maspion 4 C", Weight: 13200, Price: 102000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_c.png"}, InitialStock: 50},

		// Maspion D
		{Product: models.Product{ID: "P-030", Category: "Perpipaan", Name: "Pipa Maspion 1 1/4 D", Weight: 1200, Price: 45000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_d.png"}, InitialStock: 100},
		{Product: models.Product{ID: "P-031", Category: "Perpipaan", Name: "Pipa Maspion 1 1/2 D", Weight: 1700, Price: 55000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_d.png"}, InitialStock: 100},
		{Product: models.Product{ID: "P-032", Category: "Perpipaan", Name: "Pipa Maspion 2 D", Weight: 2100, Price: 68000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_d.png"}, InitialStock: 80},
		{Product: models.Product{ID: "P-033", Category: "Perpipaan", Name: "Pipa Maspion 2 1/2 D", Weight: 3300, Price: 98000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_d.png"}, InitialStock: 60},
		{Product: models.Product{ID: "P-034", Category: "Perpipaan", Name: "Pipa Maspion 3 D", Weight: 4600, Price: 137000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_d.png"}, InitialStock: 50},
		{Product: models.Product{ID: "P-035", Category: "Perpipaan", Name: "Pipa Maspion 4 D", Weight: 7000, Price: 189000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_d.png"}, InitialStock: 40},
		{Product: models.Product{ID: "P-036", Category: "Perpipaan", Name: "Pipa Maspion 5 D", Weight: 10900, Price: 320000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_d.png"}, InitialStock: 30},
		{Product: models.Product{ID: "P-037", Category: "Perpipaan", Name: "Pipa Maspion 6 D", Weight: 15700, Price: 410000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_d.png"}, InitialStock: 20},
		{Product: models.Product{ID: "P-038", Category: "Perpipaan", Name: "Pipa Maspion 8 D", Weight: 25000, Price: 730000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_maspion_d.png"}, InitialStock: 15},

		// Rucika AW
		{Product: models.Product{ID: "P-039", Category: "Perpipaan", Name: "Pipa Rucika 1/2 AW", Weight: 1020, Price: 32000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_rucika_aw.png"}, InitialStock: 200},
		{Product: models.Product{ID: "P-040", Category: "Perpipaan", Name: "Pipa Rucika 3/4 AW", Weight: 1240, Price: 42000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_rucika_aw.png"}, InitialStock: 200},
		{Product: models.Product{ID: "P-041", Category: "Perpipaan", Name: "Pipa Rucika 1 AW", Weight: 1790, Price: 55000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_rucika_aw.png"}, InitialStock: 150},
		{Product: models.Product{ID: "P-042", Category: "Perpipaan", Name: "Pipa Rucika 1 1/4 AW", Weight: 2420, Price: 74000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_rucika_aw.png"}, InitialStock: 100},
		{Product: models.Product{ID: "P-043", Category: "Perpipaan", Name: "Pipa Rucika 1 1/2 AW", Weight: 3160, Price: 92000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_rucika_aw.png"}, InitialStock: 100},
		{Product: models.Product{ID: "P-044", Category: "Perpipaan", Name: "Pipa Rucika 2 AW", Weight: 4490, Price: 128000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_rucika_aw.png"}, InitialStock: 80},
		{Product: models.Product{ID: "P-045", Category: "Perpipaan", Name: "Pipa Rucika 2 1/2 AW", Weight: 5780, Price: 175000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_rucika_aw.png"}, InitialStock: 60},
		{Product: models.Product{ID: "P-046", Category: "Perpipaan", Name: "Pipa Rucika 3 AW", Weight: 8810, Price: 255000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_rucika_aw.png"}, InitialStock: 50},
		{Product: models.Product{ID: "P-047", Category: "Perpipaan", Name: "Pipa Rucika 4 AW", Weight: 13630, Price: 385000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_rucika_aw.png"}, InitialStock: 40},
		{Product: models.Product{ID: "P-048", Category: "Perpipaan", Name: "Pipa Rucika 5 AW", Weight: 17850, Price: 595000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_rucika_aw.png"}, InitialStock: 25},
		{Product: models.Product{ID: "P-049", Category: "Perpipaan", Name: "Pipa Rucika 6 AW", Weight: 26800, Price: 775000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_rucika_aw.png"}, InitialStock: 20},
		{Product: models.Product{ID: "P-050", Category: "Perpipaan", Name: "Pipa Rucika 8 AW", Weight: 40500, Price: 1325000, Sold: 0, ImageURL: "http://localhost:8000/images/products/pipa_rucika_aw.png"}, InitialStock: 10},

		// =====================================================================
		// CAT TEMBOK / PAINT (IsLarge = false)
		// =====================================================================
		{Product: models.Product{ID: "P-051", Category: "Cat Tembok", Name: "Decolith 5 kg", Price: 145000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_decolith.png"}, InitialStock: 100},
		{Product: models.Product{ID: "P-052", Category: "Cat Tembok", Name: "Decolith 25 kg", Price: 725000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_decolith.png"}, InitialStock: 40},
		{Product: models.Product{ID: "P-053", Category: "Cat Tembok", Name: "Avitex 5 kg", Price: 155000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_avitex.png"}, InitialStock: 100},
		{Product: models.Product{ID: "P-054", Category: "Cat Tembok", Name: "Avitex 25 kg", Price: 775000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_avitex.png"}, InitialStock: 35},
		{Product: models.Product{ID: "P-055", Category: "Cat Tembok", Name: "No. Drop 4 kg", Price: 245000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_nodrop.png"}, InitialStock: 60},
		{Product: models.Product{ID: "P-056", Category: "Cat Tembok", Name: "No. Drop 20 kg", Price: 1225000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_nodrop.png"}, InitialStock: 20},
		{Product: models.Product{ID: "P-057", Category: "Cat Tembok", Name: "Aquaproof 4 kg", Price: 265000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_aquaproof.png"}, InitialStock: 50},
		{Product: models.Product{ID: "P-058", Category: "Cat Tembok", Name: "Aquaproof 20 kg", Price: 1275000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_aquaproof.png"}, InitialStock: 15},
		{Product: models.Product{ID: "P-059", Category: "Cat Tembok", Name: "Aries 5 kg", Price: 70000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_aries.png"}, InitialStock: 120},
		{Product: models.Product{ID: "P-060", Category: "Cat Tembok", Name: "Aries 20 kg", Price: 280000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_aries.png"}, InitialStock: 40},

		// =====================================================================
		// CAT KAYU (IsLarge = false)
		// =====================================================================
		{Product: models.Product{ID: "P-061", Category: "Cat Kayu", Name: "Emco Warna Standart 1 kg", Price: 85000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_emco.png"}, InitialStock: 80},
		{Product: models.Product{ID: "P-062", Category: "Cat Kayu", Name: "Emco Warna Standart 0.5 kg", Price: 47500, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_emco.png"}, InitialStock: 100},
		{Product: models.Product{ID: "P-063", Category: "Cat Kayu", Name: "Emco Warna Gunung 1 kg", Price: 95000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_emco.png"}, InitialStock: 60},
		{Product: models.Product{ID: "P-064", Category: "Cat Kayu", Name: "Emco Warna Gunung 0.5 kg", Price: 55000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_emco.png"}, InitialStock: 80},
		{Product: models.Product{ID: "P-065", Category: "Cat Kayu", Name: "Emco Warna Bintang 1 kg", Price: 102000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_emco.png"}, InitialStock: 50},
		{Product: models.Product{ID: "P-066", Category: "Cat Kayu", Name: "Emco Warna Bintang 0.5 kg", Price: 60000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_emco.png"}, InitialStock: 70},
		{Product: models.Product{ID: "P-067", Category: "Cat Kayu", Name: "Avian 1 kg", Price: 85000, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_avian.png"}, InitialStock: 80},
		{Product: models.Product{ID: "P-068", Category: "Cat Kayu", Name: "Avian 0.5 kg", Price: 47500, Sold: 0, ImageURL: "http://localhost:8000/images/products/cat_avian.png"}, InitialStock: 100},

		// =====================================================================
		// BESI BETON (IsLarge = true)
		// =====================================================================
		{Product: models.Product{ID: "P-069", Category: "Besi Beton", Name: "Besi Beton 6 SNI", Weight: 2660, Price: 28000, Sold: 0, ImageURL: "https://placehold.co/400x300/374151/white?text=Besi+6+SNI"}, InitialStock: 200},
		{Product: models.Product{ID: "P-070", Category: "Besi Beton", Name: "Besi Beton 8 SNI", Weight: 4740, Price: 46000, Sold: 0, ImageURL: "https://placehold.co/400x300/374151/white?text=Besi+8+SNI"}, InitialStock: 150},
		{Product: models.Product{ID: "P-071", Category: "Besi Beton", Name: "Besi Beton 10 SNI", Weight: 7400, Price: 71000, Sold: 0, ImageURL: "https://placehold.co/400x300/374151/white?text=Besi+10+SNI"}, InitialStock: 120},
		{Product: models.Product{ID: "P-072", Category: "Besi Beton", Name: "Besi Beton 12 SNI", Weight: 10660, Price: 105000, Sold: 0, ImageURL: "https://placehold.co/400x300/374151/white?text=Besi+12+SNI"}, InitialStock: 100},
		{Product: models.Product{ID: "P-073", Category: "Besi Beton", Name: "Besi Beton 14 SNI", Weight: 13500, Price: 134000, Sold: 0, ImageURL: "https://placehold.co/400x300/374151/white?text=Besi+14+SNI"}, InitialStock: 80},
		{Product: models.Product{ID: "P-074", Category: "Besi Beton", Name: "Besi Beton 16 SNI", Weight: 18960, Price: 195000, Sold: 0, ImageURL: "https://placehold.co/400x300/374151/white?text=Besi+16+SNI"}, InitialStock: 60},

		// =====================================================================
		// KLOSET (IsLarge = true)
		// =====================================================================
		{Product: models.Product{ID: "P-075", Category: "Kloset", Name: "Kloset Jongkok INA", Weight: 25000, Price: 210000, Sold: 0, ImageURL: "http://localhost:8000/images/products/kloset_ina.png", Variants: []models.ProductVariant{{Name: "Biru Muda"}, {Name: "Merah Muda"}, {Name: "Putih"}, {Name: "Merah Maroon", Price: 295000}}}, InitialStock: 30},
		{Product: models.Product{ID: "P-076", Category: "Kloset", Name: "Kloset Jongkok Triliun", Weight: 25000, Price: 205000, Sold: 0, ImageURL: "http://localhost:8000/images/products/kloset_triliun.png", Variants: []models.ProductVariant{{Name: "Biru Muda"}, {Name: "Merah Muda"}, {Name: "Putih"}, {Name: "Merah Maroon", Price: 295000}}}, InitialStock: 30},
		{Product: models.Product{ID: "P-077", Category: "Kloset", Name: "Kloset Jongkok Duty", Weight: 25000, Price: 145000, Sold: 0, ImageURL: "http://localhost:8000/images/products/kloset_duty.png", Variants: []models.ProductVariant{{Name: "Biru Muda"}, {Name: "Merah Muda"}, {Name: "Putih"}, {Name: "Merah Maroon", Price: 225000}}}, InitialStock: 40},
		{Product: models.Product{ID: "P-078", Category: "Kloset", Name: "Monoblok INA", Weight: 25000, Price: 1550000, Sold: 0, ImageURL: "http://localhost:8000/images/products/monoblok_ina.png", Variants: []models.ProductVariant{{Name: "Biru Muda"}, {Name: "Merah Muda"}, {Name: "Putih"}}}, InitialStock: 10},
		{Product: models.Product{ID: "P-079", Category: "Kloset", Name: "Monoblok Triliun", Weight: 25000, Price: 1525000, Sold: 0, ImageURL: "http://localhost:8000/images/products/monoblok_triliun.png", Variants: []models.ProductVariant{{Name: "Biru Muda"}, {Name: "Merah Muda"}, {Name: "Putih"}}}, InitialStock: 10},
		{Product: models.Product{ID: "P-080", Category: "Kloset", Name: "Monoblok Volk", Weight: 25000, Price: 1250000, Sold: 0, ImageURL: "http://localhost:8000/images/products/monoblok_volk.png", Variants: []models.ProductVariant{{Name: "Biru Muda"}, {Name: "Merah Muda"}, {Name: "Putih"}}}, InitialStock: 12},

		// =====================================================================
		// TOOLS AND MACHINERY (IsLarge = false)
		// =====================================================================
		{Product: models.Product{ID: "P-081", Category: "Perkakas", Name: "Mesin Pasrah Modern M2900", Weight: 3000, Price: 495000, Sold: 0, ImageURL: "http://localhost:8000/images/products/mesin_pasrah_m2900.png"}, InitialStock: 15},
		{Product: models.Product{ID: "P-082", Category: "Perkakas", Name: "Mesin Pasrah Modern M2950", Weight: 4000, Price: 475000, Sold: 0, ImageURL: "http://localhost:8000/images/products/mesin_pasrah_m2950.png"}, InitialStock: 15},
		{Product: models.Product{ID: "P-083", Category: "Perkakas", Name: "Mesin Bor Modern M2100", Weight: 1300, Price: 295000, Sold: 0, ImageURL: "http://localhost:8000/images/products/mesin_bor_m2100.png"}, InitialStock: 20},
		{Product: models.Product{ID: "P-084", Category: "Perkakas", Name: "Mesin Bor Modern M2130", Weight: 3000, Price: 395000, Sold: 0, ImageURL: "http://localhost:8000/images/products/mesin_bor_m2130.png"}, InitialStock: 15},
		{Product: models.Product{ID: "P-085", Category: "Perkakas", Name: "Mesin Gerinda Modern M2350", Weight: 2000, Price: 325000, Sold: 0, ImageURL: "http://localhost:8000/images/products/mesin_gerinda_m2350.png"}, InitialStock: 18},
		{Product: models.Product{ID: "P-086", Category: "Perkakas", Name: "Mesin Profil Modern M2700", Weight: 2800, Price: 425000, Sold: 0, ImageURL: "http://localhost:8000/images/products/mesin_profil_m2700.png"}, InitialStock: 12},
		{Product: models.Product{ID: "P-087", Category: "Perkakas", Name: "Mesin Gergaji Modern M2600", Weight: 5000, Price: 625000, Sold: 0, ImageURL: "http://localhost:8000/images/products/mesin_gergaji_m2600.png"}, InitialStock: 10},
		{Product: models.Product{ID: "P-088", Category: "Perkakas", Name: "Meteran Tukang 3 m", Weight: 150, Price: 25000, Sold: 0, ImageURL: "http://localhost:8000/images/products/meteran_tukang.png"}, InitialStock: 200},
		{Product: models.Product{ID: "P-089", Category: "Perkakas", Name: "Meteran Tukang 5 m", Weight: 300, Price: 35000, Sold: 0, ImageURL: "http://localhost:8000/images/products/meteran_tukang.png"}, InitialStock: 200},
		{Product: models.Product{ID: "P-090", Category: "Perkakas", Name: "Meteran Tukang 7.5 m", Weight: 300, Price: 55000, Sold: 0, ImageURL: "http://localhost:8000/images/products/meteran_tukang.png"}, InitialStock: 150},
		{Product: models.Product{ID: "P-091", Category: "Perkakas", Name: "Meteran Tukang 10 m", Weight: 600, Price: 55000, Sold: 0, ImageURL: "http://localhost:8000/images/products/meteran_tukang.png"}, InitialStock: 150},
		{Product: models.Product{ID: "P-092", Category: "Perkakas", Name: "Palu Tukang Supit 8 oz", Weight: 250, Price: 35000, Sold: 0, ImageURL: "https://placehold.co/400x300/059669/white?text=Palu+8oz"}, InitialStock: 100},
		{Product: models.Product{ID: "P-093", Category: "Perkakas", Name: "Palu Tukang Supit 12 oz", Weight: 350, Price: 45000, Sold: 0, ImageURL: "https://placehold.co/400x300/059669/white?text=Palu+12oz"}, InitialStock: 100},
		{Product: models.Product{ID: "P-094", Category: "Perkakas", Name: "Palu Tukang Kotak 200 gram", Weight: 200, Price: 35000, Sold: 0, ImageURL: "https://placehold.co/400x300/059669/white?text=Palu+200g"}, InitialStock: 100},
		{Product: models.Product{ID: "P-095", Category: "Perkakas", Name: "Palu Tukang Kotak 300 gram", Weight: 300, Price: 45000, Sold: 0, ImageURL: "https://placehold.co/400x300/059669/white?text=Palu+300g"}, InitialStock: 100},

		// =====================================================================
		// ELECTRICAL (IsLarge = false)
		// =====================================================================
		{Product: models.Product{ID: "P-096", Category: "Listrik", Name: "Lampu Philips LED 5 Watt", Weight: 60, Price: 25000, Sold: 0, ImageURL: "http://localhost:8000/images/products/lampu_philips_5w.jpg"}, InitialStock: 300},
		{Product: models.Product{ID: "P-097", Category: "Listrik", Name: "Lampu Philips LED 7 Watt", Weight: 80, Price: 29000, Sold: 0, ImageURL: "http://localhost:8000/images/products/lampu_philips_7w.webp"}, InitialStock: 300},
		{Product: models.Product{ID: "P-098", Category: "Listrik", Name: "Lampu Philips LED 9 Watt", Weight: 80, Price: 35000, Sold: 0, ImageURL: "http://localhost:8000/images/products/lampu_philips_9w.webp"}, InitialStock: 250},
		{Product: models.Product{ID: "P-099", Category: "Listrik", Name: "Lampu Philips LED 11 Watt", Weight: 100, Price: 42500, Sold: 0, ImageURL: "http://localhost:8000/images/products/lampu_philips_11w.jpg"}, InitialStock: 200},
		{Product: models.Product{ID: "P-100", Category: "Listrik", Name: "Lampu Philips LED 13 Watt", Weight: 100, Price: 49500, Sold: 0, ImageURL: "http://localhost:8000/images/products/lampu_philips_13w.jpg"}, InitialStock: 200},

		// =====================================================================
		// KUAS CAT (IsLarge = false)
		// =====================================================================
		{Product: models.Product{ID: "P-101", Category: "Kuas Cat", Name: "Kuas Eterna 1 Inch", Weight: 60, Price: 7000, Sold: 0, ImageURL: "http://localhost:8000/images/products/kuas_eterna.png"}, InitialStock: 300},
		{Product: models.Product{ID: "P-102", Category: "Kuas Cat", Name: "Kuas Eterna 1.5 Inch", Weight: 60, Price: 10000, Sold: 0, ImageURL: "http://localhost:8000/images/products/kuas_eterna.png"}, InitialStock: 300},
		{Product: models.Product{ID: "P-103", Category: "Kuas Cat", Name: "Kuas Eterna 2 Inch", Weight: 60, Price: 12000, Sold: 0, ImageURL: "http://localhost:8000/images/products/kuas_eterna.png"}, InitialStock: 250},
		{Product: models.Product{ID: "P-104", Category: "Kuas Cat", Name: "Kuas Eterna 2.5 Inch", Weight: 60, Price: 15000, Sold: 0, ImageURL: "http://localhost:8000/images/products/kuas_eterna.png"}, InitialStock: 250},
		{Product: models.Product{ID: "P-105", Category: "Kuas Cat", Name: "Kuas Eterna 3 Inch", Weight: 80, Price: 18000, Sold: 0, ImageURL: "http://localhost:8000/images/products/kuas_eterna.png"}, InitialStock: 200},
		{Product: models.Product{ID: "P-106", Category: "Kuas Cat", Name: "Kuas Eterna 4 Inch", Weight: 80, Price: 25000, Sold: 0, ImageURL: "http://localhost:8000/images/products/kuas_eterna.png"}, InitialStock: 200},
		{Product: models.Product{ID: "P-107", Category: "Kuas Cat", Name: "Kuas Eterna 5 Inch", Weight: 80, Price: 30000, Sold: 0, ImageURL: "http://localhost:8000/images/products/kuas_eterna.png"}, InitialStock: 150},
		{Product: models.Product{ID: "P-108", Category: "Kuas Cat", Name: "Kuas Eterna 6 Inch", Weight: 80, Price: 35000, Sold: 0, ImageURL: "http://localhost:8000/images/products/kuas_eterna.png"}, InitialStock: 150},
		{Product: models.Product{ID: "P-109", Category: "Kuas Cat", Name: "Kuas Roll Eterna 9 Inch", Weight: 1000, Price: 30000, Sold: 0, ImageURL: "https://placehold.co/400x300/e11d48/white?text=Roll+Eterna+9in"}, InitialStock: 100},
		{Product: models.Product{ID: "P-110", Category: "Kuas Cat", Name: "Kuas Roll 4 Inch", Weight: 1000, Price: 15000, Sold: 0, ImageURL: "https://placehold.co/400x300/e11d48/white?text=Roll+4in"}, InitialStock: 150},
		{Product: models.Product{ID: "P-111", Category: "Kuas Cat", Name: "Kuas Roll Imundex 9 Inch", Weight: 1000, Price: 30000, Sold: 0, ImageURL: "https://placehold.co/400x300/e11d48/white?text=Roll+Imundex+9in"}, InitialStock: 100},
		{Product: models.Product{ID: "P-112", Category: "Kuas Cat", Name: "Kuas Roll Imundex 7 Inch", Weight: 1000, Price: 25000, Sold: 0, ImageURL: "https://placehold.co/400x300/e11d48/white?text=Roll+Imundex+7in"}, InitialStock: 120},

		// =====================================================================
		// KUNCI PINTU (IsLarge = false)
		// =====================================================================
		{Product: models.Product{ID: "P-113", Category: "Kunci Pintu", Name: "Kunci Pintu Zeona Besar", Weight: 1000, Price: 175000, Sold: 0, ImageURL: "https://placehold.co/400x300/1e293b/white?text=Zeona+Besar"}, InitialStock: 50},
		{Product: models.Product{ID: "P-114", Category: "Kunci Pintu", Name: "Kunci Pintu Zeona Tanggung", Weight: 800, Price: 110000, Sold: 0, ImageURL: "https://placehold.co/400x300/1e293b/white?text=Zeona+Tanggung"}, InitialStock: 60},
		{Product: models.Product{ID: "P-115", Category: "Kunci Pintu", Name: "Kunci Pintu WanLi Kecil", Weight: 600, Price: 75000, Sold: 0, ImageURL: "https://placehold.co/400x300/1e293b/white?text=WanLi+Kecil"}, InitialStock: 80},
		{Product: models.Product{ID: "P-116", Category: "Kunci Pintu", Name: "Kunci Pintu Muller Besar", Weight: 1000, Price: 325000, Sold: 0, ImageURL: "https://placehold.co/400x300/1e293b/white?text=Muller+Besar"}, InitialStock: 30},
		{Product: models.Product{ID: "P-117", Category: "Kunci Pintu", Name: "Kunci Pintu Muller Tanggung", Weight: 800, Price: 245000, Sold: 0, ImageURL: "https://placehold.co/400x300/1e293b/white?text=Muller+Tanggung"}, InitialStock: 40},
		{Product: models.Product{ID: "P-118", Category: "Kunci Pintu", Name: "Kunci Pintu Kuda Besar", Weight: 1000, Price: 125000, Sold: 0, ImageURL: "https://placehold.co/400x300/1e293b/white?text=Kuda+Besar"}, InitialStock: 60},
		{Product: models.Product{ID: "P-119", Category: "Kunci Pintu", Name: "Kunci Pintu Kuda Kecil", Weight: 600, Price: 95000, Sold: 0, ImageURL: "https://placehold.co/400x300/1e293b/white?text=Kuda+Kecil"}, InitialStock: 70},

		// =====================================================================
		// ENGSEL (IsLarge = false)
		// =====================================================================
		{Product: models.Product{ID: "P-120", Category: "Engsel", Name: "Engsel Pintu Muller 5 Inch", Weight: 300, Price: 95000, Sold: 0, ImageURL: "http://localhost:8000/images/products/engsel_muller.png"}, InitialStock: 100},
		{Product: models.Product{ID: "P-121", Category: "Engsel", Name: "Engsel Pintu Muller 4 Inch", Weight: 200, Price: 75000, Sold: 0, ImageURL: "http://localhost:8000/images/products/engsel_muller.png"}, InitialStock: 100},
		{Product: models.Product{ID: "P-122", Category: "Engsel", Name: "Engsel Pintu Muller 3 Inch", Weight: 100, Price: 45000, Sold: 0, ImageURL: "http://localhost:8000/images/products/engsel_muller.png"}, InitialStock: 120},
		{Product: models.Product{ID: "P-123", Category: "Engsel", Name: "Engsel Pintu Nishio 5 Inch", Weight: 300, Price: 45000, Sold: 0, ImageURL: "http://localhost:8000/images/products/engsel_nishio.png"}, InitialStock: 100},
		{Product: models.Product{ID: "P-124", Category: "Engsel", Name: "Engsel Pintu Nishio 4 Inch", Weight: 200, Price: 35000, Sold: 0, ImageURL: "http://localhost:8000/images/products/engsel_nishio.png"}, InitialStock: 120},
		{Product: models.Product{ID: "P-125", Category: "Engsel", Name: "Engsel Pintu Nishio 3 Inch", Weight: 100, Price: 20000, Sold: 0, ImageURL: "http://localhost:8000/images/products/engsel_nishio.png"}, InitialStock: 150},
		{Product: models.Product{ID: "P-126", Category: "Engsel", Name: "Engsel Lemari Tipis 3 Inch", Weight: 100, Price: 10000, Sold: 0, ImageURL: "http://localhost:8000/images/products/engsel_lemari.png"}, InitialStock: 200},
		{Product: models.Product{ID: "P-127", Category: "Engsel", Name: "Engsel Lemari Tipis 2.5 Inch", Weight: 100, Price: 8000, Sold: 0, ImageURL: "http://localhost:8000/images/products/engsel_lemari.png"}, InitialStock: 200},
		{Product: models.Product{ID: "P-128", Category: "Engsel", Name: "Engsel Lemari Tipis 2 Inch", Weight: 100, Price: 7000, Sold: 0, ImageURL: "http://localhost:8000/images/products/engsel_lemari.png"}, InitialStock: 250},

		// =====================================================================
		// KERAMIK & GRANITE (IsLarge = true)
		// =====================================================================
		{Product: models.Product{ID: "P-129", Category: "Keramik & Granite", Name: "Keramik Lantai 40x40 cm", Weight: 17000, Price: 55000, Sold: 0, ImageURL: "https://placehold.co/400x300/0f172a/white?text=Keramik+40x40"}, InitialStock: 200},
		{Product: models.Product{ID: "P-130", Category: "Keramik & Granite", Name: "Keramik Lantai 50x50 cm", Weight: 17000, Price: 65000, Sold: 0, ImageURL: "https://placehold.co/400x300/0f172a/white?text=Keramik+50x50"}, InitialStock: 180},
		{Product: models.Product{ID: "P-131", Category: "Keramik & Granite", Name: "Keramik Lantai 60x60 cm", Weight: 17000, Price: 135000, Sold: 0, ImageURL: "https://placehold.co/400x300/0f172a/white?text=Keramik+60x60"}, InitialStock: 100},
		{Product: models.Product{ID: "P-132", Category: "Keramik & Granite", Name: "Keramik Dinding 25x40 cm", Weight: 16000, Price: 65000, Sold: 0, ImageURL: "https://placehold.co/400x300/0f172a/white?text=Keramik+25x40"}, InitialStock: 150},
		{Product: models.Product{ID: "P-133", Category: "Keramik & Granite", Name: "Keramik Dinding 25x50 cm", Weight: 16000, Price: 75000, Sold: 0, ImageURL: "https://placehold.co/400x300/0f172a/white?text=Keramik+25x50"}, InitialStock: 130},
		{Product: models.Product{ID: "P-134", Category: "Keramik & Granite", Name: "Keramik Dinding 30x60 cm", Weight: 16000, Price: 90000, Sold: 0, ImageURL: "https://placehold.co/400x300/0f172a/white?text=Keramik+30x60"}, InitialStock: 100},
		{Product: models.Product{ID: "P-135", Category: "Keramik & Granite", Name: "Granite Polos 60x60 cm", Weight: 30000, Price: 145000, Sold: 0, ImageURL: "http://localhost:8000/images/products/granite_tile.png"}, InitialStock: 80},
		{Product: models.Product{ID: "P-136", Category: "Keramik & Granite", Name: "Granite Motif 60x60 cm", Weight: 30000, Price: 165000, Sold: 0, ImageURL: "http://localhost:8000/images/products/granite_tile.png"}, InitialStock: 70},
		{Product: models.Product{ID: "P-137", Category: "Keramik & Granite", Name: "Granite Warna Gelap 60x60 cm", Weight: 30000, Price: 255000, Sold: 0, ImageURL: "http://localhost:8000/images/products/granite_tile.png"}, InitialStock: 50},
	}

	// Create products and their initial stock logs
	for _, item := range items {
		db.Create(&item.Product)

		// Record initial stock in stock_logs
		if item.InitialStock > 0 {
			db.Create(&models.StockLog{
				ProductID:   item.Product.ID,
				ChangeType:  "addition",
				QtyChanged:  item.InitialStock,
				FinalStock:  item.InitialStock,
				Description: "Stok Awal (Seeder)",
			})
		}
	}
	log.Printf("✅ Seeded %d products with initial stock logs\n", len(items))
}

// ---- ORDERS ----
func seedOrders(db *gorm.DB) {
	var count int64
	db.Model(&models.Order{}).Count(&count)
	if count > 0 {
		log.Println("⏭️  Orders table already seeded, skipping...")
		return
	}

	// Get budi's customer ID
	var budi models.Customer
	if result := db.Where("username = ?", "budi").First(&budi); result.Error != nil {
		log.Println("⚠️  Could not find user 'budi' for order seeding")
		return
	}

	orders := []models.Order{
		{
			ID:             "ORD-260401-081",
			Date:           "2026-04-01",
			CustomerID:     budi.ID,
			CustomerName:   "budi",
			Phone:          "081234567890",
			Address:        "Jl. Merdeka, Malang",
			ShippingMethod: "Kurir Toko Sinar Abadi",
			Total:          854700,
			Status:         "success",
			ShippingStatus: "Selesai",
			ProofUploaded:  true,
			Items: []models.OrderItem{
				{ProductID: "P-096", Name: "Lampu Philips LED 5 Watt", Qty: 2, Price: 385000},
			},
		},
		{
			ID:             "ORD-260402-309",
			Date:           "2026-04-02",
			CustomerID:     budi.ID,
			CustomerName:   "budi",
			Phone:          "081234567890",
			Address:        "Toko Sinar Abadi",
			ShippingMethod: "Ambil di Toko",
			Total:          721500,
			Status:         "pending",
			ShippingStatus: "Menunggu Validasi",
			ProofUploaded:  true,
			Items: []models.OrderItem{
				{ProductID: "P-001", Name: "Semen Gresik 40 kg", Qty: 10, Price: 59000},
			},
		},
	}

	for _, o := range orders {
		db.Create(&o)
	}
	log.Println("✅ Seeded 2 sample orders")
}

// ---- CUSTOMER ADDRESSES ----
func seedAddresses(db *gorm.DB) {
	var count int64
	db.Model(&models.CustomerAddress{}).Count(&count)
	if count > 0 {
		log.Println("⏭️  Customer addresses table already seeded, skipping...")
		return
	}

	// Get budi's customer ID
	var budi models.Customer
	if result := db.Where("username = ?", "budi").First(&budi); result.Error != nil {
		log.Println("⚠️  Could not find user 'budi' for address seeding")
		return
	}

	addresses := []models.CustomerAddress{
		{
			CustomerID:     budi.ID,
			Label:          "Kantor Sinar Abadi",
			RecipientName:  "Budi Santoso",
			PhoneNumber:    "08123456789",
			City:           "Lowokwaru, Kota Malang, Jawa Timur",
			FullAddress:    "Jl. Letjen Sutoyo No. 12, Lowokwaru, Malang, Jawa Timur 65141",
			Notes:          "",
			PostalCode:     "65141",
			BiteshipAreaID: "IDNP11IDNC250IDND2612IDZ65141",
			IsPrimary:      true,
			Pinpoint:       false,
		},
	}

	for _, a := range addresses {
		if err := db.Create(&a).Error; err != nil {
			log.Printf("⚠️  Failed to seed address: %v", err)
		}
	}
	log.Printf("✅ Seeded %d customer addresses\n", len(addresses))
}

// ---- DELIVERY LOCATIONS (Kurir Toko Sinar Abadi) ----
func seedDeliveryLocations(db *gorm.DB) {
	locations := []models.DeliveryLocation{
		{Name: "Kepatihan", DistanceKm: 18.4, ShippingCost: 150000, IsActive: true},
		{Name: "Desa Jambangan", DistanceKm: 8.1, ShippingCost: 50000, IsActive: true},
		{Name: "Desa Ngelak", DistanceKm: 0.8, ShippingCost: 0, IsActive: true},
		{Name: "Desa Wonokitri", DistanceKm: 6.0, ShippingCost: 25000, IsActive: true},
		{Name: "Blubuk", DistanceKm: 19.0, ShippingCost: 150000, IsActive: true},
		{Name: "Karangsono", DistanceKm: 32.4, ShippingCost: 250000, IsActive: true},
		{Name: "Sumber Gesing", DistanceKm: 21.2, ShippingCost: 250000, IsActive: true},
		{Name: "Sumber Arum", DistanceKm: 15.3, ShippingCost: 150000, IsActive: true},
		{Name: "Sono Wangi", DistanceKm: 21.7, ShippingCost: 250000, IsActive: true},
		{Name: "Sono Sekar", DistanceKm: 18.0, ShippingCost: 150000, IsActive: true},
		{Name: "Pujiharjo", DistanceKm: 38.1, ShippingCost: 250000, IsActive: true},
		{Name: "Tambak Asri", DistanceKm: 26.6, ShippingCost: 250000, IsActive: true},
		{Name: "Sido Asri", DistanceKm: 27.8, ShippingCost: 250000, IsActive: true},
		{Name: "Lenggoksono", DistanceKm: 32.5, ShippingCost: 250000, IsActive: true},
		{Name: "Sumber Ayu", DistanceKm: 3.0, ShippingCost: 0, IsActive: true},
		{Name: "Rembun", DistanceKm: 8.4, ShippingCost: 50000, IsActive: true},
		{Name: "Lambang Kuning", DistanceKm: 5.4, ShippingCost: 25000, IsActive: true},
		{Name: "Lambang Sari", DistanceKm: 9.7, ShippingCost: 75000, IsActive: true},
		{Name: "Sumber Putih", DistanceKm: 9.9, ShippingCost: 75000, IsActive: true},
		{Name: "Kedok", DistanceKm: 14.3, ShippingCost: 100000, IsActive: true},
		{Name: "Turen", DistanceKm: 11.4, ShippingCost: 75000, IsActive: true},
	}

	for _, loc := range locations {
		if err := db.Where("name = ?", loc.Name).Assign(models.DeliveryLocation{
			DistanceKm:   loc.DistanceKm,
			ShippingCost: loc.ShippingCost,
			IsActive:     loc.IsActive,
		}).FirstOrCreate(&loc).Error; err != nil {
			log.Printf("⚠️  Failed to seed delivery location %s: %v", loc.Name, err)
		}
	}
	log.Printf("✅ Seeded/Updated %d delivery locations\n", len(locations))
}

// ---- FLEET VEHICLES ----
func seedFleetVehicles(db *gorm.DB) {
	var count int64
	db.Model(&models.FleetVehicle{}).Count(&count)
	if count > 0 {
		log.Println("⏭️  Fleet vehicles table already seeded, skipping...")
		return
	}

	vehicles := []models.FleetVehicle{
		{Name: "L300", Status: "Tersedia"},
		{Name: "Mitsubishi Canter", Status: "Tersedia"},
	}

	for _, v := range vehicles {
		if err := db.Create(&v).Error; err != nil {
			log.Printf("⚠️  Failed to seed fleet vehicle %s: %v", v.Name, err)
		}
	}
	log.Printf("✅ Seeded %d fleet vehicles\n", len(vehicles))
}
