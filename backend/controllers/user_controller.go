package controllers

import (
	"net/http"
	"time"

	"sinar-abadi-backend/config"
	"sinar-abadi-backend/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// GetCustomers returns a list of all customer users. Admin/Owner only.
// GET /api/users
func GetCustomers(c *gin.Context) {
	var users []models.Customer
	if result := config.DB.Find(&users); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data customer"})
		return
	}

	// Build safe response (without password hashes)
	type UserResponse struct {
		ID        uint   `json:"id"`
		Username  string `json:"username"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
		Role      string `json:"role"`
	}

	var response []UserResponse
	for _, u := range users {
		response = append(response, UserResponse{
			ID:        u.ID,
			Username:  u.Username,
			Name:      u.Name,
			Email:     u.Email,
			Phone:     u.Phone,
			Role:      "customer",
		})
	}

	c.JSON(http.StatusOK, response)
}


// GetAdmins returns a list of all admin users. Owner only.
// GET /api/users/admins
func GetAdmins(c *gin.Context) {
	var admins []models.Admin
	if result := config.DB.Find(&admins); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data admin"})
		return
	}

	type StaffResponse struct {
		ID        uint      `json:"id"`
		Username  string    `json:"username"`
		Name      string    `json:"name"`
		Email     string    `json:"email"`
		Phone     string    `json:"phone"`
		Role      string    `json:"role"`
		CreatedAt time.Time `json:"createdAt"`
	}

	var response []StaffResponse

	for _, a := range admins {
		response = append(response, StaffResponse{
			ID:        a.ID,
			Username:  a.Username,
			Name:      a.Name,
			Email:     a.Email,
			Phone:     a.Phone,
			Role:      "Admin",
			CreatedAt: a.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, response)
}

// DeleteAdmin removes an admin account. Owner only.
// DELETE /api/users/admins/:username
func DeleteAdmin(c *gin.Context) {
	username := c.Param("username")

	var user models.Admin
	if result := config.DB.Where("username = ?", username).First(&user); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Admin tidak ditemukan"})
		return
	}

	config.DB.Delete(&user)

	c.JSON(http.StatusOK, gin.H{
		"message": "Akun admin " + username + " telah dihapus",
	})
}

// UpdateAdminInput represents the request body for updating an admin.
type UpdateAdminInput struct {
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// UpdateAdmin updates an admin profile by Owner. Owner only.
// PUT /api/users/admins/:username
func UpdateAdmin(c *gin.Context) {
	username := c.Param("username")

	var user models.Admin
	if result := config.DB.Where("username = ?", username).First(&user); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Admin tidak ditemukan"})
		return
	}

	var input UpdateAdminInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Input tidak valid"})
		return
	}

	if input.Name != "" {
		user.Name = input.Name
	}
	user.Phone = input.Phone
	user.Email = input.Email

	if input.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi password baru"})
			return
		}
		user.Password = string(hashedPassword)
	}

	if result := config.DB.Save(&user); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui admin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Admin berhasil diperbarui",
	})
}

// CreateAdminInput represents the request body for creating a new admin.
type CreateAdminInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
}

// CreateAdmin creates a new admin account. Owner only.
// POST /api/users/admins
func CreateAdmin(c *gin.Context) {
	var input CreateAdminInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lengkapi semua field wajib"})
		return
	}

	// Check duplicate username
	var existing models.Admin
	if result := config.DB.Where("username = ?", input.Username).First(&existing); result.RowsAffected > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Username sudah digunakan"})
		return
	}

	// Hash password with bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses password"})
		return
	}

	user := models.Admin{
		Username:  input.Username,
		Password:  string(hashedPassword),
		Name:      input.Name,
		Email:     input.Email,
		Phone:     input.Phone,
	}

	if result := config.DB.Create(&user); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat akun admin"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Akun admin berhasil dibuat",
		"username": user.Username,
		"name":     user.Name,
	})
}

// GetProfile returns the authenticated user's profile.
// GET /api/users/profile
func GetProfile(c *gin.Context) {
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	roleInterface, roleExists := c.Get("role")
	role := "customer"
	if roleExists {
		role = roleInterface.(string)
	}

	if role == "owner" {
		var user models.Owner
		if result := config.DB.First(&user, userId); result.Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Profile tidak ditemukan"})
			return
		}
		user.Role = role
		c.JSON(http.StatusOK, user)
		return
	} else if role == "admin" {
		var user models.Admin
		if result := config.DB.First(&user, userId); result.Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Profile tidak ditemukan"})
			return
		}
		user.Role = role
		c.JSON(http.StatusOK, user)
		return
	}

	// Default to customer
	var user models.Customer
	if result := config.DB.First(&user, userId); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile tidak ditemukan"})
		return
	}

	user.Role = "customer"
	c.JSON(http.StatusOK, user)
}

// UpdateProfileInput represents the request body for updating a profile.
type UpdateProfileInput struct {
	Name     string `json:"name" binding:"required"`
	Username string `json:"username" binding:"required"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

// UpdateProfile updates the authenticated user's profile.
// PUT /api/users/profile
func UpdateProfile(c *gin.Context) {
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	roleInterface, roleExists := c.Get("role")
	role := "customer"
	if roleExists {
		role = roleInterface.(string)
	}

	var input UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid"})
		return
	}

	if role == "owner" {
		var user models.Owner
		if result := config.DB.First(&user, userId); result.Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Profile tidak ditemukan"})
			return
		}

		if input.Username != user.Username {
			var existing models.Owner
			if config.DB.Where("username = ?", input.Username).First(&existing).RowsAffected > 0 {
				c.JSON(http.StatusConflict, gin.H{"error": "Username sudah digunakan"})
				return
			}
			user.Username = input.Username
		}

		user.Name = input.Name
		user.Email = input.Email
		user.Phone = input.Phone

		if input.Password != "" {
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
			if err == nil {
				user.Password = string(hashedPassword)
			}
		}

		if result := config.DB.Save(&user); result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui profile"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Profil berhasil diperbarui",
			"data": gin.H{
				"username": user.Username,
				"name":     user.Name,
			},
		})
		return
	} else if role == "admin" {
		var user models.Admin
		if result := config.DB.First(&user, userId); result.Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Profile tidak ditemukan"})
			return
		}

		if input.Username != user.Username {
			var existing models.Admin
			if config.DB.Where("username = ?", input.Username).First(&existing).RowsAffected > 0 {
				c.JSON(http.StatusConflict, gin.H{"error": "Username sudah digunakan"})
				return
			}
			user.Username = input.Username
		}

		user.Name = input.Name
		user.Email = input.Email
		user.Phone = input.Phone

		if input.Password != "" {
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
			if err == nil {
				user.Password = string(hashedPassword)
			}
		}

		if result := config.DB.Save(&user); result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui profile"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Profil berhasil diperbarui",
			"data": gin.H{
				"username": user.Username,
				"name":     user.Name,
			},
		})
		return
	}

	// Default to customer
	var user models.Customer
	if result := config.DB.First(&user, userId); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile tidak ditemukan"})
		return
	}

	// Check if username is taken by another user
	if input.Username != user.Username {
		var existing models.Customer
		if config.DB.Where("username = ?", input.Username).First(&existing).RowsAffected > 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "Username sudah digunakan"})
			return
		}
		user.Username = input.Username
	}

	user.Name = input.Name
	user.Email = input.Email
	user.Phone = input.Phone

	// Update password if provided
	if input.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses password"})
			return
		}
		user.Password = string(hashedPassword)
	}

	if result := config.DB.Save(&user); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profil berhasil diperbarui",
		"data": gin.H{
			"username": user.Username,
			"name":     user.Name,
		},
	})
}

