package controllers

import (
	"net/http"
	"time"

	"sinar-abadi-backend/config"
	"sinar-abadi-backend/middleware"
	"sinar-abadi-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// RegisterInput represents the request body for customer/admin/owner registration.
type RegisterInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=5"`
	Role     string `json:"role" binding:"required"` // customer | admin | owner
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
}

// LoginInput represents the request body for user login.
type LoginInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role" binding:"required"` // customer | admin | owner
}

// Register creates a new account (Customer/Admin/Owner).
// POST /api/register
func Register(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lengkapi semua field yang diperlukan (username, password, role)"})
		return
	}

	// Check if username already exists in any table
	var customerCount, adminCount, ownerCount int64
	config.DB.Model(&models.Customer{}).Where("username = ?", input.Username).Count(&customerCount)
	config.DB.Model(&models.Admin{}).Where("username = ?", input.Username).Count(&adminCount)
	config.DB.Model(&models.Owner{}).Where("username = ?", input.Username).Count(&ownerCount)
	if customerCount > 0 || adminCount > 0 || ownerCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Username sudah terdaftar"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses password"})
		return
	}

	switch input.Role {
	case "customer":
		if input.Name == "" || input.Phone == "" || input.Email == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Lengkapi profil (nama, telepon, email) untuk mendaftar sebagai customer"})
			return
		}
		customer := models.Customer{
			Username:  input.Username,
			Password:  string(hashedPassword),
			Name:      input.Name,
			Phone:     input.Phone,
			Email:     input.Email,
		}
		if result := config.DB.Create(&customer); result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat akun customer"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{
			"message": "Akun customer berhasil terdaftar",
			"user": gin.H{
				"username":  customer.Username,
				"role":      "customer",
				"name":      customer.Name,
			},
		})

	case "admin":
		name := input.Name
		if name == "" {
			name = "Admin " + input.Username
		}
		admin := models.Admin{
			Username:  input.Username,
			Password:  string(hashedPassword),
			Name:      name,
		}
		if result := config.DB.Create(&admin); result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat akun admin"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{
			"message": "Akun admin berhasil terdaftar",
			"user": gin.H{
				"username":  admin.Username,
				"role":      "admin",
				"name":      admin.Name,
			},
		})



	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role tidak valid"})
	}
}

// Login authenticates a user and returns a JWT token.
// POST /api/login
func Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lengkapi semua field (username, password, role)"})
		return
	}

	var userID uint
	var dbUsername, dbPassword, dbName, dbPhone string

	switch input.Role {
	case "customer":
		var user models.Customer
		if result := config.DB.Where("username = ? OR email = ?", input.Username, input.Username).First(&user); result.Error != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Kredensial tidak valid"})
			return
		}
		userID = user.ID
		dbUsername = user.Username
		dbPassword = user.Password
		dbName = user.Name
		dbPhone = user.Phone

	case "admin":
		var user models.Admin
		if result := config.DB.Where("email = ?", input.Username).First(&user); result.Error != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Kredensial tidak valid"})
			return
		}
		userID = user.ID
		dbUsername = user.Username
		dbPassword = user.Password
		dbName = user.Name

	case "owner":
		var user models.Owner
		if result := config.DB.Where("email = ?", input.Username).First(&user); result.Error != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Kredensial tidak valid"})
			return
		}
		userID = user.ID
		dbUsername = user.Username
		dbPassword = user.Password
		dbName = user.Name

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role tidak valid"})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(dbPassword), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Kredensial tidak valid"})
		return
	}

	// Generate JWT token
	claims := &middleware.Claims{
		UserID:   userID,
		Username: dbUsername,
		Role:     input.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(middleware.GetJWTSecret())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":        userID,
			"username":  dbUsername,
			"role":      input.Role,
			"name":      dbName,
			"phone":     dbPhone,
		},
	})
}
