package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"

	"git.taurusxin.com/taurusxin/ncmdump-gui/utils"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := NewApp()

	configManager, err := utils.NewConfigManager("config.json")
	if err != nil {
		println("Error: failed to init config:", err.Error())
		return
	}

	err = wails.Run(&options.App{
		Title:     "NCM 转换",
		Width:     920,
		Height:    640,
		MinWidth:  720,
		MinHeight: 480,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 245, G: 245, B: 247, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
			configManager,
		},
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop:     true,
			DisableWebViewDrop: true,
		},
		Mac: &mac.Options{
			About: &mac.AboutInfo{
				Title:   "NCM 转换",
				Message: "网易云 NCM 文件转换工具",
			},
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
