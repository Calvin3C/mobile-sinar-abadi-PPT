package main

import (
	"fmt"
	"sinar-abadi-backend/config"
)

func main() {
	config.ConnectDatabase()
	type Column struct {
		ColumnName string
	}
	var columns []Column
	config.DB.Raw("SELECT column_name FROM information_schema.columns WHERE table_name = 'stock_transfers'").Scan(&columns)
	for _, c := range columns {
		fmt.Println(c.ColumnName)
	}
}
