package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"git.taurusxin.com/taurusxin/ncmdump-go/ncmcrypt"
	"git.taurusxin.com/taurusxin/ncmdump-gui/utils"
)

// App is the Wails application binding.
type App struct {
	ctx     context.Context
	mu      sync.Mutex
	running bool
}

// NewApp creates a new App.
func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// SelectFiles opens a multi-file dialog for .ncm files.
func (a *App) SelectFiles() []string {
	selection, err := wailsRuntime.OpenMultipleFilesDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "请选择 NCM 文件",
		Filters: []wailsRuntime.FileFilter{
			{
				DisplayName: "NCM Files (*.ncm)",
				Pattern:     "*.ncm",
			},
		},
	})
	if err != nil {
		return []string{}
	}
	return selection
}

// SelectFolder opens a directory dialog (used for output path).
func (a *App) SelectFolder() string {
	folder, err := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "请选择保存目录",
	})
	if err != nil {
		return ""
	}
	return folder
}

// FolderSelection is the result of picking a source folder (recursive .ncm scan).
type FolderSelection struct {
	Root  string   `json:"root"`
	Files []string `json:"files"`
}

// SelectFilesFromFolder picks a folder and returns all .ncm files under it (recursive),
// together with the selected root so output can preserve relative subdirectories.
func (a *App) SelectFilesFromFolder() FolderSelection {
	folder, err := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "请选择包含 NCM 的文件夹",
	})
	if err != nil || folder == "" {
		return FolderSelection{Files: []string{}}
	}
	files, err := utils.ListFilesFromFolder(folder, "ncm")
	if err != nil {
		return FolderSelection{Root: folder, Files: []string{}}
	}
	return FolderSelection{Root: folder, Files: files}
}

// InputEntry is a resolved .ncm path with optional source root for subdir-preserving output.
type InputEntry struct {
	Path       string `json:"path"`
	SourceRoot string `json:"sourceRoot,omitempty"`
}

// ExpandDropPaths expands a drag-and-drop path list: directories are scanned recursively
// for .ncm files (sourceRoot = that folder); plain .ncm files are kept as-is.
func (a *App) ExpandDropPaths(paths []string) []InputEntry {
	if len(paths) == 0 {
		return []InputEntry{}
	}

	seen := make(map[string]struct{})
	out := make([]InputEntry, 0)

	add := func(path, root string) {
		abs, err := filepath.Abs(path)
		if err != nil {
			abs = path
		}
		key := strings.ToLower(abs)
		if _, ok := seen[key]; ok {
			return
		}
		seen[key] = struct{}{}
		if root != "" {
			if r, err := filepath.Abs(root); err == nil {
				root = r
			}
		}
		out = append(out, InputEntry{Path: abs, SourceRoot: root})
	}

	for _, p := range paths {
		if p == "" {
			continue
		}
		info, err := os.Stat(p)
		if err != nil {
			continue
		}
		if info.IsDir() {
			files, err := utils.ListFilesFromFolder(p, "ncm")
			if err != nil {
				continue
			}
			for _, f := range files {
				add(f, p)
			}
			continue
		}
		if strings.EqualFold(filepath.Ext(p), ".ncm") {
			add(p, "")
		}
	}
	return out
}

// TaskStatus is the lifecycle state of a conversion task.
type TaskStatus = string

const (
	StatusPending    TaskStatus = "pending"
	StatusProcessing TaskStatus = "processing"
	StatusDone       TaskStatus = "done"
	StatusError      TaskStatus = "error"
)

// Task is a single file conversion unit. ID is assigned by the frontend.
type Task struct {
	ID         string     `json:"id"`
	Path       string     `json:"path"`
	Status     TaskStatus `json:"status"`
	Error      string     `json:"error,omitempty"`
	OutputPath string     `json:"outputPath,omitempty"`
	Format     string     `json:"format,omitempty"`
}

// TaskRequest is the input for ProcessTasks.
type TaskRequest struct {
	ID         string `json:"id"`
	Path       string `json:"path"`
	SourceRoot string `json:"sourceRoot,omitempty"` // folder root when added via directory; used to preserve subdirs
}

// ProcessOptions controls dump behaviour.
type ProcessOptions struct {
	SavePath    string `json:"savePath"`
	FetchCover  bool   `json:"fetchCover"`
	EmbedLyrics bool   `json:"embedLyrics"`
	Concurrency int    `json:"concurrency"`
}

// BatchResult is emitted when a batch finishes.
type BatchResult struct {
	Total int `json:"total"`
	Done  int `json:"done"`
	Error int `json:"error"`
}

func (a *App) emitTask(task Task) {
	wailsRuntime.EventsEmit(a.ctx, "task-updated", task)
}

func formatFromPath(p string) string {
	ext := strings.ToLower(filepath.Ext(p))
	if len(ext) > 1 {
		return ext[1:]
	}
	return ""
}

// resolveDumpDir computes the directory for Dump().
// - savePath empty: "" (ncmcrypt writes next to the source file)
// - custom + sourceRoot: savePath / relative(sourceRoot → fileDir)
// - custom without root: savePath (flat)
func resolveDumpDir(sourcePath, sourceRoot, savePath string) (string, error) {
	if savePath == "" {
		return "", nil
	}
	if sourceRoot == "" {
		return savePath, nil
	}

	absFile, err := filepath.Abs(sourcePath)
	if err != nil {
		return "", err
	}
	absRoot, err := filepath.Abs(sourceRoot)
	if err != nil {
		return "", err
	}

	fileDir := filepath.Dir(absFile)
	rel, err := filepath.Rel(absRoot, fileDir)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		// not under source root — fall back to flat output
		return savePath, nil
	}

	outDir := savePath
	if rel != "." {
		outDir = filepath.Join(savePath, rel)
	}
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return "", fmt.Errorf("创建输出目录失败: %w", err)
	}
	return outDir, nil
}

func (a *App) processOne(req TaskRequest, opts ProcessOptions) Task {
	task := Task{
		ID:     req.ID,
		Path:   req.Path,
		Status: StatusProcessing,
	}
	a.emitTask(task)

	dumpDir, err := resolveDumpDir(req.Path, req.SourceRoot, opts.SavePath)
	if err != nil {
		task.Status = StatusError
		task.Error = err.Error()
		a.emitTask(task)
		return task
	}

	ncm, err := ncmcrypt.NewNeteaseCloudMusic(req.Path)
	if err != nil {
		task.Status = StatusError
		task.Error = fmt.Sprintf("打开文件失败: %s", err.Error())
		a.emitTask(task)
		return task
	}

	ok, err := ncm.Dump(dumpDir)
	if err != nil {
		task.Status = StatusError
		task.Error = fmt.Sprintf("解密失败: %s", err.Error())
		a.emitTask(task)
		return task
	}
	if !ok {
		task.Status = StatusError
		task.Error = "解密失败: 未知错误"
		a.emitTask(task)
		return task
	}

	outputPath := ncm.GetDumpFilePath()
	task.OutputPath = outputPath
	task.Format = formatFromPath(outputPath)

	var notes []string

	metaOK, err := ncm.FixMetadata(opts.FetchCover)
	if err != nil || !metaOK {
		if err != nil {
			notes = append(notes, fmt.Sprintf("元数据写入失败: %s", err.Error()))
		} else {
			notes = append(notes, "元数据写入失败")
		}
	}

	if opts.EmbedLyrics {
		if msg := a.tryEmbedLyrics(req.Path, outputPath); msg != "" {
			notes = append(notes, msg)
		}
	}

	task.Status = StatusDone
	if len(notes) > 0 {
		task.Error = "已转换；" + strings.Join(notes, "；")
	} else {
		task.Error = ""
	}
	a.emitTask(task)
	return task
}

// tryEmbedLyrics finds sibling .lrc/.txt next to the source ncm and embeds into output.
// Returns a short note for the UI when lyrics were missing or embedding failed; empty on success or skip.
func (a *App) tryEmbedLyrics(sourcePath, outputPath string) string {
	lrcPath := utils.FindSiblingLyrics(sourcePath)
	if lrcPath == "" {
		return "" // no lyrics file — silent skip
	}
	text, err := utils.ReadLyricsFile(lrcPath)
	if err != nil {
		return fmt.Sprintf("歌词读取失败(%s): %s", filepath.Base(lrcPath), err.Error())
	}
	if err := utils.EmbedLyrics(outputPath, text); err != nil {
		return fmt.Sprintf("歌词嵌入失败: %s", err.Error())
	}
	return ""
}

// ProcessTasks converts the given tasks with a bounded worker pool.
// Emits "task-updated" per task and "batch-finished" when all complete.
// Returns false if a batch is already running.
func (a *App) ProcessTasks(tasks []TaskRequest, opts ProcessOptions) bool {
	a.mu.Lock()
	if a.running {
		a.mu.Unlock()
		return false
	}
	a.running = true
	a.mu.Unlock()

	go func() {
		defer func() {
			a.mu.Lock()
			a.running = false
			a.mu.Unlock()
		}()

		valid := make([]TaskRequest, 0, len(tasks))
		for _, t := range tasks {
			if t.ID != "" && t.Path != "" {
				valid = append(valid, t)
			}
		}

		if len(valid) == 0 {
			wailsRuntime.EventsEmit(a.ctx, "batch-finished", BatchResult{})
			return
		}

		workers := opts.Concurrency
		if workers <= 0 {
			workers = runtime.NumCPU()
			if workers > 4 {
				workers = 4
			}
			if workers < 1 {
				workers = 1
			}
		}

		jobs := make(chan TaskRequest)
		var wg sync.WaitGroup
		var resultMu sync.Mutex
		doneCount, errCount := 0, 0

		for i := 0; i < workers; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				for req := range jobs {
					result := a.processOne(req, opts)
					resultMu.Lock()
					if result.Status == StatusError {
						errCount++
					} else if result.Status == StatusDone {
						doneCount++
					}
					resultMu.Unlock()
				}
			}()
		}

		for _, t := range valid {
			jobs <- t
		}
		close(jobs)
		wg.Wait()

		wailsRuntime.EventsEmit(a.ctx, "batch-finished", BatchResult{
			Total: len(valid),
			Done:  doneCount,
			Error: errCount,
		})
	}()

	return true
}

// IsProcessing reports whether a batch is currently running.
func (a *App) IsProcessing() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.running
}
