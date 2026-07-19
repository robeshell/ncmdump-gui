# ncmdump-gui

基于 [ncmdump-go](https://git.taurusxin.com/taurusxin/ncmdump-go) / [ncmdump-gui](https://git.taurusxin.com/taurusxin/ncmdump-gui) 的 macOS 图形化 NCM 转换工具（MIT）。

本仓库在原项目之上重做了界面与任务流程，并增加歌词嵌入、目录结构保留、拖入文件夹等能力。解密核心仍使用 `ncmcrypt`。

## 功能

- 将网易云 `.ncm` 解密为 MP3 / FLAC
- 写入标题 / 歌手 / 专辑，可选联网补封面
- 可选嵌入同级 `.lrc` / `.txt` 歌词
- 添加目录 / 拖入文件夹：递归扫描，自定义输出时保留相对子目录
- 有界并发转换，任务级状态与错误提示

## 开发

```bash
# 依赖：Go、Node/pnpm、Wails v2、Xcode CLT（macOS）
go install github.com/wailsapp/wails/v2/cmd/wails@latest

cd ncmdump-gui
wails dev
```

本地若与 `ncmdump-go` 源码并排开发，可在 `go.mod` 中取消注释：

```go
// replace git.taurusxin.com/taurusxin/ncmdump-go => ../ncmdump-go
```

## 打包 DMG（macOS）

```bash
./scripts/package-dmg.sh
# 产物：build/bin/NCM转换.dmg
# 仅 arm64：PLATFORM=darwin/arm64 ./scripts/package-dmg.sh
```

未签名安装包在他人电脑上可能需「右键 → 打开」通过 Gatekeeper。

## 致谢与许可

- 原项目：[taurusxin/ncmdump-gui](https://git.taurusxin.com/taurusxin/ncmdump-gui)、[ncmdump-go](https://git.taurusxin.com/taurusxin/ncmdump-go)
- 许可证：MIT（见 [LICENSE](./LICENSE)），保留原作者版权声明
