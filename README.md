# NCM 转换（ncmdump-gui）

> [!CAUTION]
> **此应用只用于学习用途，下载后请在 24 小时内删除，禁止用于商业或违法用途！**  
> 请在遵守 NCM 文件提供平台的服务条款下使用本应用，作者对商业或违法使用本软件造成的任何后果不承担任何责任！  
>  
> **使用本软件转换的音频请在不侵犯著作权的前提下使用。如需商业用途，请从平台或版权所有人购买对应歌曲。**

macOS 图形化工具：将 `.ncm` 解密为标准 **MP3 / FLAC**，并写入元数据、封面与歌词。

基于 [ncmdump-go](https://git.taurusxin.com/taurusxin/ncmdump-go) / 原 [ncmdump-gui](https://git.taurusxin.com/taurusxin/ncmdump-gui) 改造，界面按 macOS 工具风格重做，并增强批量与目录能力。解密核心仍使用 `ncmcrypt`（MIT）。

**仓库：** [github.com/robeshell/ncmdump-gui](https://github.com/robeshell/ncmdump-gui)  
**当前版本：** [v2.0.1](https://github.com/robeshell/ncmdump-gui/releases/tag/v2.0.1)

---

## 下载与安装

### 下载

前往 **[Releases](https://github.com/robeshell/ncmdump-gui/releases/latest)** 下载最新 DMG：

| 文件 | 说明 |
|------|------|
| `NCM-Convert-macOS-universal-v*.dmg` | **Intel + Apple Silicon** 通用包（推荐） |

### 安装

1. 打开 DMG  
2. 将 **ncmdump-gui**（NCM 转换）拖到「应用程序」  
3. 从启动台或「应用程序」中打开  

### 无法打开时（Gatekeeper）

本应用为 **未公证** 的个人分发包，系统可能提示「无法验证开发者」。可以：

1. 在 App 上 **右键 → 打开** → 再点「打开」  
2. 或：系统设置 → **隐私与安全性** → 仍要打开  

---

## 使用说明

### 添加文件

任选一种方式：

- **添加文件**：多选 `.ncm`  
- **添加目录**：递归扫描该文件夹下所有 `.ncm`  
- **拖放**：把 `.ncm` 或**整个文件夹**拖进窗口（文件夹会递归展开）  

同一路径只会加入一次（自动去重）。

### 输出位置

| 选项 | 行为 |
|------|------|
| **源目录** | 转换结果写在每个 `.ncm` 旁边 |
| **自定义** | 写入你选择的目录 |

**自定义 + 从「添加目录」或拖入文件夹时：** 会按相对路径**镜像子目录**，例如：

```text
源文件夹/
  周杰伦/七里香.ncm
  陈奕迅/浮夸.ncm

输出目录/
  周杰伦/七里香.flac
  陈奕迅/浮夸.mp3
```

单独「添加文件」且无目录根信息时，自定义输出为**平铺**到目标目录。

### 选项

| 选项 | 说明 |
|------|------|
| **联网补封面** | 部分 NCM 无内嵌封面；开启后按元数据中的封面地址下载并写入（需网络） |
| **嵌入同级歌词** | 在**源 `.ncm` 旁边**查找歌词并写入输出文件标签 |

### 歌词匹配规则

与 `.ncm` **同目录**、同名优先，依次尝试：

```text
歌名.ncm
  → 歌名.lrc / 歌名.LRC
  → 歌名.ncm.lrc
  → 歌名.txt / 歌名.TXT
```

- 支持常见 **LRC**（含时间轴）  

- **MP3**：写入 ID3 USLT  
- **FLAC**：写入 `LYRICS` / `UNSYNCEDLYRICS`  
- 找不到歌词：静默跳过，不影响转换成功  

### 开始转换

1. 确认列表里有「等待」中的任务  
2. 设好输出与选项  
3. 点 **开始转换**  

列表会显示状态（等待 / 处理中 / 完成 / 失败）及错误说明。转换在有界并发下进行，大批量不易把机器打满。

---

## 功能一览

- [x] `.ncm` → MP3 / FLAC  
- [x] 标题、歌手、专辑等元数据  
- [x] 可选联网下载封面  
- [x] 可选嵌入同级 `.lrc` / `.txt`  
- [x] 多文件 / 目录 / 拖放文件夹  
- [x] 自定义输出时保留子目录结构  
- [x] 任务级状态与错误信息  
- [x] 偏好记忆（输出方式、封面、歌词开关）  

---

## 从源码运行（开发）

### 环境

- macOS  
- [Go](https://go.dev/) 1.23+  
- [Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/)  
- [Wails v2](https://wails.io/)  
- Xcode Command Line Tools  

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
# 确保 $(go env GOPATH)/bin 在 PATH 中
```

### 开发模式

```bash
git clone https://github.com/robeshell/ncmdump-gui.git
cd ncmdump-gui
wails dev
```

### 与 ncmdump-go 源码联调（可选）

若本机有同级目录 `../ncmdump-go`，可在 `go.mod` 中取消注释：

```go
// replace git.taurusxin.com/taurusxin/ncmdump-go => ../ncmdump-go
```

默认使用 module 版本，无需本地 clone 解密库。

---

## 自行打包 DMG

```bash
./scripts/package-dmg.sh
```

- 默认：`darwin/universal`（Intel + Apple Silicon）  
- 仅本机 ARM：`PLATFORM=darwin/arm64 ./scripts/package-dmg.sh`  
- 产物：`build/bin/NCM转换.dmg`  

发布到 GitHub Release 时，可将文件重命名为便于识别的名称，例如：

`NCM-Convert-macOS-universal-v2.0.0.dmg`

---

## 常见问题

**Q：转换后没有封面？**  
开启「联网补封面」并保证网络可用；若文件本身已内嵌封面则无需联网。

**Q：有歌词文件却没嵌进去？**  
确认歌词与 **源 ncm** 同目录、按上文规则同名；看任务备注是否有「歌词嵌入失败」。

**Q：拖文件夹没反应？**  
确认文件夹内确实有 `.ncm`；应用需支持文件拖放（本应用已开启）。

**Q：Windows / Linux？**  
当前发布与打包脚本面向 **macOS**。Wails 理论上可编其他平台，本仓库未提供现成安装包。

---

## 致谢与许可

| 项目 | 说明 |
|------|------|
| [ncmdump-go](https://git.taurusxin.com/taurusxin/ncmdump-go) | NCM 解密与元数据核心 |
| [ncmdump-gui](https://git.taurusxin.com/taurusxin/ncmdump-gui) | 原图形界面参考 |

**许可证：** [MIT](./LICENSE)  

请保留原作者版权声明（TaurusXin and contributors）。本仓库在其之上的界面与流程改动由维护者继续以 MIT 分发。

仅供将**你已合法获得**的 NCM 缓存转为通用格式以便本地播放/备份，请遵守相关服务条款与版权法。
