package utils

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type SaveToType = string

const (
	Original SaveToType = "original"
	Custom   SaveToType = "custom"
)

// Preference stores user settings for the GUI.
type Preference struct {
	SaveTo      SaveToType `json:"save_to"`
	Path        string     `json:"path"`
	FetchCover  bool       `json:"fetch_cover"`
	EmbedLyrics bool       `json:"embed_lyrics"`
}

// ConfigManager persists Preference to the user config directory.
type ConfigManager struct {
	FilePath string
}

// NewConfigManager creates a config manager under the OS user config dir.
func NewConfigManager(filename string) (*ConfigManager, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return nil, err
	}

	dirPath := filepath.Join(configDir, "ncmdump-gui")
	if err := os.MkdirAll(dirPath, os.ModePerm); err != nil {
		return nil, err
	}

	filePath := filepath.Join(dirPath, filename)
	cm := &ConfigManager{FilePath: filePath}

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		_ = cm.Save(&Preference{
			SaveTo:      Original,
			Path:        "",
			FetchCover:  true,
			EmbedLyrics: true,
		})
	}
	return cm, nil
}

// Save writes preference to disk.
func (cm *ConfigManager) Save(preference *Preference) bool {
	file, err := os.Create(cm.FilePath)
	if err != nil {
		return false
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	return encoder.Encode(preference) == nil
}

// Load reads preference from disk. Missing fetch_cover / embed_lyrics default to true.
func (cm *ConfigManager) Load() *Preference {
	raw, err := os.ReadFile(cm.FilePath)
	if err != nil {
		return defaultPreference()
	}

	var preference Preference
	if err := json.Unmarshal(raw, &preference); err != nil {
		return defaultPreference()
	}

	// Old configs: missing keys default to true.
	var m map[string]interface{}
	if json.Unmarshal(raw, &m) == nil {
		if _, ok := m["fetch_cover"]; !ok {
			preference.FetchCover = true
		}
		if _, ok := m["embed_lyrics"]; !ok {
			preference.EmbedLyrics = true
		}
	}

	if preference.SaveTo == "" {
		preference.SaveTo = Original
	}
	return &preference
}

func defaultPreference() *Preference {
	return &Preference{
		SaveTo:      Original,
		Path:        "",
		FetchCover:  true,
		EmbedLyrics: true,
	}
}
