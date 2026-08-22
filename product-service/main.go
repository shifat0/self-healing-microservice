// main.go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv" // To convert string ID to int for lookup
)

// Product represents a product in our system
type Product struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
}

// In-memory "database" for demonstration
var products = []Product{
	{ID: 101, Name: "Laptop", Description: "Powerful gaming laptop", Price: 1200.00},
	{ID: 102, Name: "Mouse", Description: "Ergonomic wireless mouse", Price: 25.50},
	{ID: 103, Name: "Keyboard", Description: "Mechanical keyboard with RGB", Price: 75.00},
}

// getProductHandler handles requests for product details by ID
func getProductHandler(w http.ResponseWriter, r *http.Request) {
	// Extract product ID from the URL path.
	// We expect paths like /products/{id}
	idStr := r.URL.Path[len("/products/"):] // Slice to get the ID part
	productID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	// Find the product by ID
	var foundProduct *Product
	for i := range products {
		if products[i].ID == productID {
			foundProduct = &products[i]
			break
		}
	}

	if foundProduct == nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	// Set content type and encode the product to JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(foundProduct)
}

// healthCheckHandler responds with a simple OK for health checks
func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Product Service is healthy!\n")
}

// metricsHandler exposes a minimal Prometheus-compatible metrics endpoint.
func metricsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; version=0.7.0; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "# HELP product_service_up Whether the product service is running.\n")
	fmt.Fprint(w, "# TYPE product_service_up gauge\n")
	fmt.Fprint(w, "product_service_up 1\n")
}

func main() {
	// Register handlers for different routes
	http.HandleFunc("/products/", getProductHandler) // Specific route for products with ID
	http.HandleFunc("/health", healthCheckHandler)   // Health check endpoint
	http.HandleFunc("/metrics", metricsHandler)      // Prometheus metrics endpoint

	// Start the HTTP server on port 3001
	port := ":3001"
	log.Printf("Product Service is running on port %s\n", port)
	log.Fatal(http.ListenAndServe(port, nil)) // Listen and serve forever
}
