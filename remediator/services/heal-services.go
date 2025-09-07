package services

import (
	"log"
	"os/exec"
)

type HealService struct{}

func (s *HealService) Restart(service string) {
	log.Println("Restarting container:", service)
    cmd := exec.Command("docker", "restart", service)
    output, err := cmd.CombinedOutput()
    if err != nil {
        log.Printf("❌ Failed to restart %s: %v, output: %s", service, err, string(output))
    } else {
        log.Printf("✅ Restarted container %s", service)
    }
}
