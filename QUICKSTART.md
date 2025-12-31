# RDP.WASM 快速入门

## 快速构建指南

### 1. 环境准备 (一次性设置)

```bash
# 安装 Emscripten (如果还没有安装)
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest

# 记录 EMSDK 路径
export EMSDK_PATH=/path/to/emsdk
```

### 2. 每次构建前激活 Emscripten

```bash
source $EMSDK_PATH/emsdk_env.sh
```

### 3. 构建项目

```bash
cd /path/to/rdp.wasm

# Release 构建 (推荐)
bjam -j7 js_client

# Debug 构建
bjam -j7 debug js_client

# 安装应用文件
bjam -j7 rdpclient
```

### 4. 运行客户端

```bash
# 方法 1: 使用 Python HTTP 服务器
cd bin/emscripten/release  # 或 bin/emscripten/debug
python3 -m http.server 7453

# 在浏览器中打开
# http://localhost:7453/client.html

# 方法 2: 使用脚本
./tools/open_client.sh
```

## 常用命令

### 构建

```bash
# 完整构建
bjam -j7

# 只构建客户端
bjam -j7 js_client

# 只构建播放器
bjam -j7 js_player

# 清理构建
rm -rf bin/
```

### 测试

```bash
# 安装测试依赖
bjam -j7 install_node_modules

# 运行所有测试
bjam -j7

# 运行特定测试
bjam -j7 test_graphics
bjam -j7 test_transport
```

### 开发

```bash
# 重新生成构建目标 (修改源文件后)
bjam targets.jam

# 生成键盘布局
./tools/gen_reversed_keylayout.sh
```

## 目录结构说明

```
rdp.wasm/
├── bin/                      # 构建输出 (自动生成)
│   └── emscripten/
│       ├── release/          # Release 构建
│       └── debug/            # Debug 构建
├── src/                      # 所有源代码 (包括 Redemption 核心代码)
├── include/                  # Redemption 头文件
├── configs/                  # 配置系统
├── jam/                      # 构建配置
├── tests/                    # 测试
├── tools/                    # 工具脚本
├── Jamroot                   # 主构建文件
└── targets.jam               # 构建目标
```

## WebSocket 代理设置

RDP 服务器通常不直接支持 WebSocket，需要设置代理：

### 使用 websocat (推荐)

```bash
# 安装 websocat
# Ubuntu/Debian: 
sudo apt install websocat

# 或从源码安装:
cargo install websocat

# 运行代理
websocat --binary ws-l:127.0.0.1:8080 tcp:127.0.0.1:3389
```

### 使用 rdpproxy (如果有)

编辑 `rdpproxy.ini`:
```ini
[globals]
enable_websocket=yes
websocket_port=8080
```

## 故障排除

### bjam 命令未找到
```bash
# 安装 Boost.Build (bjam)
sudo apt install boost-build  # Ubuntu/Debian
# 或
brew install boost-build      # macOS
```

### Emscripten 未激活
```bash
source $EMSDK_PATH/emsdk_env.sh
```

### 找不到头文件
```bash
# 确保 include 目录存在
ls include/
```

### 链接错误
```bash
# 重新生成构建目标
bjam targets.jam
```

## 构建选项

### 自定义模块名
```bash
bjam -s JS_MODULE_NAME=MyModule js_client
```

### 启用 Source Maps
```bash
bjam debug -s debug-symbols-source-map=on js_client
```

### 符号链接模式 (开发时)
```bash
bjam -s copy_application_mode=symbolic rdpclient
```

## 输出文件

成功构建后，在 `bin/emscripten/release/` (或 `debug/`) 目录下会有：

- `js_client.js` - JavaScript 包装器
- `js_client.wasm` - WebAssembly 二进制
- `client.html` - RDP 客户端页面
- `scancodes.js`, `keyboard.js` 等 - 应用资源

## 性能优化建议

### Release 构建优化

1. 使用 Release 模式: `bjam release js_client`
2. Emscripten 会自动应用 -O3 优化
3. 启用 LTO (Link Time Optimization) 已配置

### 减小 WASM 大小

在 Jamroot 中已配置：
- `-fno-rtti` - 禁用 RTTI
- `-O3` / `-Os` - 优化选项
- 移除未使用的代码

## 下一步

1. 阅读 [README.md](README.md) 了解完整文档
2. 查看 [EXTRACTION_NOTES.md](EXTRACTION_NOTES.md) 了解项目结构
3. 运行测试确保一切正常
4. 开始开发或部署

## 需要帮助？

- 检查构建日志获取详细错误信息
- 确保所有依赖已正确安装
- 参考原始 Redemption 项目文档: https://github.com/wallix/redemption

---

祝使用愉快！🚀
