# RDP Client.js - 现代化 WebAssembly RDP 客户端

一个独立的、现代化的基于 WebAssembly 的 RDP (远程桌面协议) 客户端库，提供清晰简洁的 JavaScript API。

[![版本](https://img.shields.io/badge/版本-1.1.0-blue.svg)]()
[![许可证](https://img.shields.io/badge/许可证-GPL--2.0+-green.svg)](LICENSE)
[![ES6+](https://img.shields.io/badge/ES-6%2B-orange.svg)]()

## ✨ 项目概述

本项目提供了一个使用 Emscripten 编译为 WebAssembly 的现代化浏览器 RDP 客户端。用户可以直接从 Web 浏览器连接到 RDP 服务器，无需任何插件。

### 🆕 v1.1.0 现代化更新

- ✅ **ES6+ 特性**: 使用私有字段 (`#`)、空值合并运算符 (`??`)、Map 等现代语法
- ✅ **链式调用**: 支持流式 API 调用
- ✅ **自动重连**: 内置智能重连机制
- ✅ **单文件库**: 所有功能集成在一个文件中
- ✅ **完整键盘**: 100+ 按键支持，包括修饰键和锁定键
- ✅ **类型安全**: 增强的参数验证和错误处理

📖 查看 [现代化更新日志](MODERNIZATION.md) 了解详情

## 🚀 功能特性

### 核心功能
- 🌐 基于浏览器的 RDP 客户端
- ⚡ WebAssembly 编译，接近原生性能
- 🔒 支持安全的 RDP 连接
- 🎨 清晰简洁的 JavaScript API

### 输入支持
- ⌨️ **完整键盘支持**: 
  - 100+ 按键映射
  - 修饰键 (Shift, Ctrl, Alt, Meta)
  - 锁定键 (CapsLock, NumLock, ScrollLock)
  - 输入法编辑器 (IME) 支持
  - Unicode 字符输入
- 🖱️ 鼠标和指针支持
- 📋 剪贴板支持

### 开发体验
- 💡 现代化 ES6+ 语法
- 📝 完整的 API 文档
- 🔄 自动重连机制
- 🎯 事件驱动架构
- ⛓️ 链式调用支持

## 📦 快速开始

### 1. 基本使用

```html
<!DOCTYPE html>
<html>
<head>
    <title>RDP Client</title>
</head>
<body>
    <canvas id="rdp-canvas" width="800" height="600"></canvas>
    
    <!-- 引入单个文件 -->
    <script src="rdpclient.js"></script>
    <script>
        const canvas = document.getElementById('rdp-canvas');
        
        // 创建客户端实例（支持链式调用）
        const client = new RDPClient(canvas, {
            url: 'ws://your-server:3390',
            username: 'user',
            password: 'pass',
            width: 800,
            height: 600,
            autoReconnect: true,          // 启用自动重连
            maxReconnectAttempts: 5       // 最多重连 5 次
        })
        .on('connected', () => console.log('已连接'))
        .on('disconnected', () => console.log('已断开'))
        .on('error', (err) => console.error('错误:', err));
        
        // 初始化并连接
        async function connect() {
            try {
                await client.initialize('./js_client.js');
                await client.connect();
            } catch (error) {
                console.error('连接失败:', error);
            }
        }
        
        connect();
    </script>
</body>
</html>
```

### 2. 高级用法

```javascript
// 使用所有配置选项
const client = new RDPClient(canvas, {
    url: 'ws://server:3390',
    username: 'admin',
    password: 'secret',
    domain: 'COMPANY',
    width: 1920,
    height: 1080,
    bpp: 24,
    keyboard: 'en',
    autoReconnect: true,
    maxReconnectAttempts: 3
});

// 监听所有事件
client
    .on('connected', () => {
        console.log('成功连接到服务器');
    })
    .on('disconnected', () => {
        console.log('与服务器断开连接');
    })
    .on('error', (error) => {
        console.error('发生错误:', error);
    })
    .on('resize', ({ width, height }) => {
        console.log(`屏幕大小变更: ${width}x${height}`);
    })
    .on('clipboard', (data) => {
        console.log('剪贴板数据:', data);
    })
    .on('log', ({ level, message }) => {
        console.log(`[${level}] ${message}`);
    });

// 初始化和连接
await client.initialize('./js_client.js');
await client.connect();

// 程序控制
client.isConnected();           // 检查连接状态
client.getCanvasSize();         // 获取画布大小
client.getKeyboardState();      // 获取键盘状态
client.releaseAllKeys();        // 释放所有按键
await client.disconnect();      // 断开连接
```

## 🎮 示例页面

本项目包含三个示例页面：

1. **example.html** - 完整的连接示例，带美观的 UI
2. **keyboard-test.html** - 键盘功能测试页面
3. **test-modern.html** - 现代化特性测试页面

运行示例：
```bash
# 使用任何 HTTP 服务器
python -m http.server 8000
# 然后访问 http://localhost:8000/example.html
```

## 📚 API 文档

查看 [LIBRARY_API.md](LIBRARY_API.md) 获取完整的 API 文档。

### 主要 API

#### 构造函数
```javascript
new RDPClient(canvas, options)
```

#### 方法
- `async initialize(wasmPath)` - 初始化 WASM 模块
- `async connect()` - 连接到服务器
- `async disconnect()` - 断开连接
- `on(event, handler)` - 注册事件监听器（支持链式调用）
- `off(event, handler)` - 移除事件监听器（支持链式调用）
- `isConnected()` - 检查连接状态

#### 事件
- `connected` - 连接成功
- `disconnected` - 连接断开
- `error` - 发生错误
- `resize` - 屏幕大小变更
- `clipboard` - 剪贴板数据
- `log` - 日志消息

## 🏗️ 项目结构

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

### 3. 配置 Boost 头文件

```bash
# Linux/Mac
mkdir system_include/
ln -s /usr/include/boost system_include/

# Windows
mkdir system_include
# 将 Boost 安装路径的 boost 目录链接到 system_include
```

**注意**：项目已包含所有必需的 Redemption 头文件（548 个 .hpp 文件），无需额外配置。

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
