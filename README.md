# RDP.WASM - WebAssembly RDP Client

一个独立的基于 WebAssembly 的 RDP (远程桌面协议) 客户端，从 Redemption 项目的 jsclient 子项目中提取。

## 项目概述

本项目提供了一个使用 Emscripten 编译为 WebAssembly 的浏览器 RDP 客户端。用户可以直接从 Web 浏览器连接到 RDP 服务器，无需任何插件。

## 功能特性

- 🌐 基于浏览器的 RDP 客户端
- 🚀 编译为 WebAssembly，接近原生性能
- 🔒 支持安全的 RDP 连接
- 📋 剪贴板支持
- ⌨️ 完整的键盘支持，支持多种键盘布局
- 🖱️ 鼠标和指针支持

## 项目结构

```
rdp.wasm/
├── src/                      # 源代码
│   ├── application/          # HTML/JS 应用文件
│   ├── main/                 # 主入口点 (js_client, js_player)
│   ├── redjs/                # JavaScript 绑定和图形
│   ├── red_channels/         # RDP 通道实现
│   ├── red_emscripten/       # Emscripten 工具
│   ├── system/               # 系统级实现
│   ├── core/                 # 核心功能
│   ├── client/               # RDP 客户端实现
│   ├── gdi/                  # 图形设备接口
│   ├── mod/                  # RDP 模块
│   ├── keyboard/             # 键盘支持
│   ├── translation/          # 国际化
│   ├── transport/            # 传输层
│   └── utils/                # 工具函数
├── include/                  # Redemption 头文件
├── configs/                  # 配置文件
├── jam/                      # Boost.Jam 构建配置
├── tests/                    # 测试文件
├── tools/                    # 构建和实用工具脚本
├── Jamroot                   # 主构建配置
└── targets.jam               # 构建目标
```

## 前置要求

### 1. 安装 Emscripten

```bash
# 克隆并安装 Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

推荐版本: 2.0.9 或更高

### 2. 安装 Boost.Jam (bjam)

项目使用 Boost.Jam 作为构建系统，请根据你的平台安装。

### 3. 配置 Boost 头文件 (用于测试)

```bash
mkdir system_include/
ln -s /usr/include/boost system_include/
```

## 构建

### 1. 配置 Emscripten 环境

```bash
source $EMSDK_PATH/emsdk_env.sh
```

### 2. 构建 RDP 客户端

```bash
# Release 构建 (优化)
bjam -j7 js_client

# Debug 构建
bjam -j7 debug js_client
```

### 3. 安装 Node 模块 (用于测试)

```bash
bjam -j7 install_node_modules
```

### 4. 运行测试

```bash
bjam -j7
```

### 5. 安装应用

```bash
# 复制模式 (默认)
bjam -j7 rdpclient

# 符号链接模式
bjam -j7 -s copy_application_mode=symbolic rdpclient
```

## 配置选项

### 自定义模块名称

```bash
bjam -s JS_MODULE_NAME=MyRdpModule js_client
```

### Source Maps

```bash
bjam debug -s debug-symbols-source-map=on -s JS_SOURCE_MAP='prefix//' js_client
```

使用 source maps 在 Node.js 中调试:

```bash
npm install source-map-support
```

## 运行客户端

### 1. 在 RDP 服务器上启用 WebSocket

配置你的 RDP 代理 (`rdpproxy.ini`):

```ini
[globals]
enable_websocket=yes
```

或使用 [websocat](https://github.com/vi/websocat) 作为 WebSocket 到 TCP 的桥接:

```bash
websocat --binary ws-l:127.0.0.1:8080 tcp:127.0.0.1:3389
```

### 2. 启动本地 Web 服务器

```bash
# 导航到构建目录
cd "$(bjam cwd | sed '/^CWD/!d;s/^CWD: //')"

# 启动 HTTP 服务器
python3 -m http.server 7453 --bind 127.0.0.1

# 在浏览器中打开
xdg-open http://localhost:7453/client.html
```

或使用提供的脚本:

```bash
./tools/open_client.sh
```

## 播放器

项目还包括一个用于查看录制会话的 RDP 播放器:

```bash
# 构建播放器
bjam -j7 js_player

# 安装播放器应用
bjam -j7 rdpplayer
```

## 开发

### 重新生成构建目标

如果修改了源文件需要重新生成 `targets.jam`:

```bash
bjam targets.jam
# 或
./tools/gen_targets.sh > targets.jam
```

### 生成反向键盘布局

```bash
./tools/gen_reversed_keylayout.sh
```

## 项目来源

本项目从 [Redemption](https://github.com/wallix/redemption) 项目的 `jsclient` 子项目中提取。现已独立，不再依赖完整的 Redemption 源代码树。

必要的 Redemption 核心文件已集成到 src/ 目录中，头文件在 include/ 目录，配置系统在 configs/ 目录。

## 许可证

本项目继承 Redemption 项目的许可证。详见 [LICENSE](LICENSE) 和 [COPYING](COPYING) 文件。

## 贡献

欢迎贡献！请确保:

1. 代码遵循现有风格
2. 测试通过: `bjam -j7`
3. 在 debug 和 release 模式下都能成功构建

## 故障排除

### 未定义符号错误

如果遇到未定义符号错误，重新生成构建目标:

```bash
bjam targets.jam
```

### WebSocket 连接问题

确保你的 RDP 服务器或代理已启用 WebSocket 支持，或使用 `websocat` 作为桥接。

### 构建错误

- 验证 Emscripten 已正确激活: `source $EMSDK_PATH/emsdk_env.sh`
- 检查 Boost 头文件是否可访问
- 尝试清理构建: `rm -rf bin/`

## 联系方式

如有问题和疑问，请在项目仓库中提交 issue。

---

**注意**: 这是从 Redemption 中提取的 jsclient 的独立版本。完整的 Redemption 代理项目请访问 https://github.com/wallix/redemption
