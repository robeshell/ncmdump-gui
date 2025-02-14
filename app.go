package main

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"git.taurusxin.com/taurusxin/ncmdump-go/ncmcrypt"
	"git.taurusxin.com/taurusxin/ncmdump-gui/utils"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// select files to dump
func (a *App) SelectFiles() []string {
	selection, err := runtime.OpenMultipleFilesDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "请选择文件",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "NCM Files",
				Pattern:     "*.ncm",
			},
		},
	})
	if err != nil {
		return []string{}
	}
	return selection
}

func (a *App) SelectFolder() string {
	folder, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "请选择保存目录",
	})
	if err != nil {
		return ""
	}
	return folder
}

func (a *App) SelectFilesFromFolder(ext string) []string {
	folder, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "请选择文件夹",
	})
	if err != nil {
		return []string{}
	} else {
		files, err := utils.ListFilesFromFolder(folder, ext)
		if err != nil {
			return []string{}
		}
		return files
	}
}

type Status = string

const (
	Pending    Status = "pending"
	Processing Status = "processing"
	Done       Status = "done"
	Error      Status = "error"
)

type NcmFile struct {
	Name   string
	Status Status
}

// process single file
func (a *App) processFile(file string, index int, savePath string) {
	runtime.EventsEmit(a.ctx, "file-status-changed", index, Processing)
	ncm, err := ncmcrypt.NewNeteaseCloudMusic(file)
	if err != nil {
		runtime.EventsEmit(a.ctx, "file-status-changed", index, Error)
		return
	}
	dumpResult, err := ncm.Dump(savePath)
	if err != nil {
		runtime.EventsEmit(a.ctx, "file-status-changed", index, Error)
		return
	}
	if dumpResult {
		_, err := ncm.FixMetadata(true)
		if err != nil {
			runtime.EventsEmit(a.ctx, "file-status-changed", index, Error)
			return
		}
		runtime.EventsEmit(a.ctx, "file-status-changed", index, Done)
	}
}

// process files
func (a *App) ProcessFiles(files []NcmFile, savePath string) {
	for index, file := range files {
		if file.Status == Pending {
			go a.processFile(file.Name, index, savePath)
		}
	}
}
