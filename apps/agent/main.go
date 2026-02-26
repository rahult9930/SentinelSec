package main

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

// AgentConfig holds the configuration for the SentinelSec agent
type AgentConfig struct {
	ServerURL string `json:"server_url"`
	AgentID   string `json:"agent_id"`
	SecretKey string `json:"secret_key"`
}

var config AgentConfig

func loadConfig() {
	// Dummy hardcoded config for PoC
	config = AgentConfig{
		ServerURL: "https://localhost:3000",
		AgentID:   "agent-node-01",
		SecretKey: "super-secret-agent-key",
	}
}

// SecurityAuditResult represents the result of the local server scan
type SecurityAuditResult struct {
	OS             string   `json:"os"`
	Hostname       string   `json:"hostname"`
	OpenPorts      []string `json:"open_ports"`
	RootLoginEnabled bool     `json:"root_login_enabled"`
	Vulnerabilities  []string `json:"vulnerabilities"`
}

func performAudit() SecurityAuditResult {
	hostname, _ := os.Hostname()
	result := SecurityAuditResult{
		OS:       runtime.GOOS,
		Hostname: hostname,
	}

	// Mocking audit checks for PoC
	if runtime.GOOS == "linux" {
		// Example: checking sshd_config for PermitRootLogin
		out, err := exec.Command("sh", "-c", "grep '^PermitRootLogin yes' /etc/ssh/sshd_config").Output()
		if err == nil && len(out) > 0 {
			result.RootLoginEnabled = true
			result.Vulnerabilities = append(result.Vulnerabilities, "Root login over SSH is enabled.")
		}
		
		// Example check for open ports (dummy data)
		result.OpenPorts = []string{"22", "80", "443"}
	} else if runtime.GOOS == "windows" {
		// Basic Windows placeholder
		result.OpenPorts = []string{"135", "445", "3389"}
		result.Vulnerabilities = append(result.Vulnerabilities, "RDP is exposed to the local network.")
	}

	return result
}

func reportToServer(result SecurityAuditResult) {
	// mTLS Setup (Mocked for PoC, assuming certs exist in ./certs directory)
	// In production, these should be generated securely
	certPath := "./certs/agent.crt"
	keyPath := "./certs/agent.key"
	caPath := "./certs/ca.crt"

	var client *http.Client

	// Try loading mTLS if certs are present, fallback to standard HTTPS or HTTP
	if _, err := os.Stat(certPath); err == nil {
		cert, err := tls.LoadX509KeyPair(certPath, keyPath)
		if err != nil {
			log.Fatalf("Failed to load key pair: %v", err)
		}

		caCert, err := ioutil.ReadFile(caPath)
		if err != nil {
			log.Fatalf("Failed to read CA cert: %v", err)
		}

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		tlsConfig := &tls.Config{
			Certificates: []tls.Certificate{cert},
			RootCAs:      caCertPool,
		}

		client = &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: tlsConfig,
			},
			Timeout: 10 * time.Second,
		}
	} else {
		// Fallback for development without certs
		client = &http.Client{
			Timeout: 10 * time.Second,
		}
	}

	payload, _ := json.Marshal(result)
	req, _ := http.NewRequest("POST", fmt.Sprintf("%s/agent/report", config.ServerURL), strings.NewReader(string(payload)))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Agent-ID", config.AgentID)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", config.SecretKey))

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Failed to report to server: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		log.Println("Successfully reported audit results to server.")
	} else {
		log.Printf("Server returned status: %s\n", resp.Status)
	}
}

func main() {
	log.Println("Starting SentinelSec Agent...")
	loadConfig()

	// Infinite loop for continuous scanning (Scheduler simulation)
	for {
		log.Println("Performing security audit...")
		result := performAudit()
		
		log.Println("Reporting results to server...")
		reportToServer(result)
		
		// Sleep for 1 hour before next scan
		time.Sleep(1 * time.Hour)
	}
}
