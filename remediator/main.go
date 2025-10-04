package main

import (
	"log"
	"net/http"
	"remediator/handlers"
)

func main() {
	http.HandleFunc("/webhook", handlers.WebhookHandler)
	log.Println("Remediator running on 7070")
	log.Fatal(http.ListenAndServe(":7070", nil))
}
