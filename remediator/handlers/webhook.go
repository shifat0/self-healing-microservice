package handlers

import (
	"encoding/json"
	"net/http"
	"remediator/services"
)

type Alert struct {
	Status string `json:"status"`
	Alerts []struct {
		Labels map[string]string `json:"labels"`
	} `json:"alerts"`
}

func WebhookHandler(w http.ResponseWriter, r *http.Request) {
	var alert Alert
	json.NewDecoder(r.Body).Decode(&alert)

	healService := services.HealService{}
	for _, a := range alert.Alerts {
		if a.Labels["severity"] == "heal" {
			healService.Restart(a.Labels["job"])
		}
	}
}
