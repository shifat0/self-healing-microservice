package services

import (
	"log"
	"os/exec"
)

type HealService struct{}

func (s *HealService) Restart(service string) {
	log.Println("Restarting container:", service)
	cmd := exec.Command("docker", "start", service)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("❌ Failed to start %s: %v, output: %s", service, err, string(output))
	} else {
		log.Printf("✅ Started container %s", service)
	}
}
