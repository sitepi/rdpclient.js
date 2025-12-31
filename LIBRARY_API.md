# RDP Client JavaScript Library

一个简洁、现代的 JavaScript API，用于在浏览器中使用 WebAssembly RDP 客户端。

## ✨ 特性

- 🚀 **简单易用** - 清晰的 API 设计，几行代码即可连接
- 🎯 **类型安全** - 完整的参数验证和错误处理
- 📦 **零依赖** - 纯 JavaScript 实现，无需额外依赖
- 🎨 **事件驱动** - 灵活的事件系统，轻松处理各种状态
- 🔌 **插件化** - 模块化设计，易于扩展
- 📱 **响应式** - 自动适配画布大小

## 🚀 快速开始

### 基础用法

```html
<!DOCTYPE html>
<html>
<head>
    <title>RDP Client Demo</title>
</head>
<body>
    <canvas id="screen" width="1280" height="720"></canvas>
    
    <script src="rdpclient.js"></script>
    <script>
        // 创建客户端实例
        const client = new RDPClient({
            canvas: document.getElementById('screen'),
            url: 'ws://localhost:3390',
            username: 'administrator',
            password: 'your-password',
            width: 1280,
            height: 720
        });

        // 注册事件监听器
        client
            .on('connected', () => {
                console.log('连接成功！');
            })
            .on('disconnected', () => {
                console.log('连接已断开');
            })
            .on('error', (error) => {
                console.error('错误:', error.message);
            });

        // 初始化并连接
        (async () => {
            await client.initialize('./js_client.js');
            await client.connect();
        })();
    </script>
</body>
</html>
```

## 📖 API 文档

### 构造函数

```javascript
new RDPClient(options)
```

#### 参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `canvas` | HTMLCanvasElement | ✅ | - | 用于渲染的画布元素 |
| `url` | string | ✅ | - | WebSocket 服务器地址 |
| `username` | string | ✅ | - | 用户名 |
| `password` | string | ✅ | - | 密码 |
| `domain` | string | ❌ | `''` | 域名 |
| `width` | number | ❌ | `800` | 屏幕宽度 |
| `height` | number | ❌ | `600` | 屏幕高度 |
| `bpp` | number | ❌ | `24` | 色深 (16/24/32) |
| `keyboard` | string | ❌ | `'en'` | 键盘布局 |

#### 键盘布局选项

- `en` - English (US)
- `fr` - Français
- `de` - Deutsch
- `es` - Español
- `it` - Italiano
- `pt` - Português
- `zh` - 中文
- `ja` - 日本語
- `ko` - 한국어

### 方法

#### `initialize(wasmPath)`

初始化 WASM 模块。

```javascript
await client.initialize('./js_client.js');
```

**参数:**
- `wasmPath` (string, 可选) - WASM 模块路径，默认 `'./js_client.js'`

**返回:** Promise\<void\>

#### `connect()`

连接到 RDP 服务器。

```javascript
await client.connect();
```

**返回:** Promise\<void\>

#### `disconnect()`

断开与 RDP 服务器的连接。

```javascript
await client.disconnect();
```

**返回:** Promise\<void\>

#### `sendKeyEvent(scancode, pressed)`

发送键盘事件。

```javascript
client.sendKeyEvent(0x1E, true);  // 按下 'A' 键
client.sendKeyEvent(0x1E, false); // 释放 'A' 键
```

**参数:**
- `scancode` (number) - 键盘扫描码
- `pressed` (boolean) - 是否按下

#### `sendUnicodeEvent(unicode, pressed)`

发送 Unicode 字符。

```javascript
client.sendUnicodeEvent(0x4E2D, true);  // 输入中文字符 '中'
```

**参数:**
- `unicode` (number) - Unicode 码点
- `pressed` (boolean) - 是否按下

#### `sendMouseEvent(x, y, flags)`

发送鼠标事件。

```javascript
client.sendMouseEvent(100, 200, 0x1000); // 左键点击
```

**参数:**
- `x` (number) - X 坐标
- `y` (number) - Y 坐标
- `flags` (number) - 鼠标标志

#### `sendClipboard(text)`

发送剪贴板文本。

```javascript
client.sendClipboard('Hello, World!');
```

**参数:**
- `text` (string) - 文本内容

#### `on(event, handler)`

注册事件监听器。

```javascript
client.on('connected', () => {
    console.log('已连接');
});
```

**参数:**
- `event` (string) - 事件名称
- `handler` (Function) - 事件处理函数

**返回:** RDPClient (支持链式调用)

#### `off(event, handler)`

移除事件监听器。

```javascript
const handler = () => console.log('连接');
client.on('connected', handler);
client.off('connected', handler);
```

**参数:**
- `event` (string) - 事件名称
- `handler` (Function) - 事件处理函数

**返回:** RDPClient (支持链式调用)

#### `isConnected()`

检查连接状态。

```javascript
if (client.isConnected()) {
    console.log('客户端已连接');
}
```

**返回:** boolean

#### `getCanvasSize()`

获取画布尺寸。

```javascript
const { width, height } = client.getCanvasSize();
console.log(`画布尺寸: ${width}×${height}`);
```

**返回:** { width: number, height: number }

### 事件

#### `connected`

成功连接到服务器时触发。

```javascript
client.on('connected', () => {
    console.log('连接成功！');
});
```

#### `disconnected`

与服务器断开连接时触发。

```javascript
client.on('disconnected', () => {
    console.log('连接已断开');
});
```

#### `error`

发生错误时触发。

```javascript
client.on('error', (errorData) => {
    console.error('错误:', errorData.message);
    console.error('详情:', errorData.error);
});
```

**事件数据:**
```javascript
{
    timestamp: string,  // ISO 时间戳
    message: string,    // 错误消息
    error: any          // 错误详情
}
```

#### `resize`

屏幕尺寸改变时触发。

```javascript
client.on('resize', (sizeData) => {
    console.log(`新尺寸: ${sizeData.width}×${sizeData.height}`);
});
```

**事件数据:**
```javascript
{
    width: number,   // 新宽度
    height: number   // 新高度
}
```

#### `clipboard`

接收到剪贴板数据时触发。

```javascript
client.on('clipboard', (clipboardData) => {
    console.log('剪贴板内容:', clipboardData.text);
});
```

#### `log`

记录日志时触发。

```javascript
client.on('log', (logData) => {
    console.log(`[${logData.level}] ${logData.message}`);
});
```

**事件数据:**
```javascript
{
    timestamp: string,  // ISO 时间戳
    level: string,      // 日志级别 (info/warn/error)
    message: string     // 日志消息
}
```

## 💡 示例

### 完整连接示例

```javascript
const client = new RDPClient({
    canvas: document.getElementById('screen'),
    url: 'ws://192.168.1.100:3390',
    username: 'admin',
    password: 'password123',
    domain: 'DOMAIN',
    width: 1920,
    height: 1080,
    bpp: 24,
    keyboard: 'en'
});

// 注册所有事件
client
    .on('connected', () => {
        console.log('✅ 连接成功');
        document.getElementById('status').textContent = '已连接';
    })
    .on('disconnected', () => {
        console.log('⚠️ 连接断开');
        document.getElementById('status').textContent = '未连接';
    })
    .on('error', (error) => {
        console.error('❌ 错误:', error.message);
        alert(`连接错误: ${error.message}`);
    })
    .on('resize', ({ width, height }) => {
        console.log(`📐 分辨率: ${width}×${height}`);
    })
    .on('log', ({ level, message }) => {
        console.log(`📝 [${level}] ${message}`);
    });

// 连接
async function connectToRDP() {
    try {
        await client.initialize('./js_client.js');
        await client.connect();
    } catch (error) {
        console.error('连接失败:', error);
    }
}

// 断开连接
async function disconnectFromRDP() {
    try {
        await client.disconnect();
    } catch (error) {
        console.error('断开失败:', error);
    }
}

// 自动清理
window.addEventListener('beforeunload', () => {
    if (client.isConnected()) {
        client.disconnect();
    }
});
```

### 错误处理

```javascript
try {
    const client = new RDPClient({
        canvas: document.getElementById('screen'),
        url: 'ws://localhost:3390',
        username: 'user',
        password: 'pass'
    });

    await client.initialize();
    await client.connect();

} catch (error) {
    if (error.message.includes('canvas')) {
        console.error('画布元素无效');
    } else if (error.message.includes('url')) {
        console.error('WebSocket 地址无效');
    } else {
        console.error('未知错误:', error);
    }
}
```

## 🔧 开发

### 构建项目

```bash
# 使用 b2 构建
b2 -j$(nproc) js_client

# 或使用 bjam
bjam -j$(nproc) js_client
```

### 运行示例

1. 构建 WebAssembly 模块
2. 启动本地 HTTP 服务器
3. 打开 `example.html`

```bash
# 使用 Python 启动服务器
python -m http.server 8000

# 或使用 Node.js
npx http-server
```

## 📝 许可证

GPL-2.0+

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系

如有问题，请在 GitHub 上创建 Issue。
