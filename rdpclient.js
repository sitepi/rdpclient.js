/**
 * RDP Client JavaScript Library
 * 提供清晰简洁的 API 来使用 WebAssembly RDP 客户端
 * 
 * @version 1.0.0
 * @license GPL-2.0+
 */

class RDPClient {
    /**
     * 创建 RDP 客户端实例
     * @param {Object} options - 配置选项
     * @param {HTMLCanvasElement} options.canvas - 渲染画布
     * @param {string} options.url - WebSocket 服务器地址 (例如: ws://localhost:3390)
     * @param {string} options.username - 用户名
     * @param {string} options.password - 密码
     * @param {string} [options.domain=''] - 域名
     * @param {number} [options.width=800] - 屏幕宽度
     * @param {number} [options.height=600] - 屏幕高度
     * @param {number} [options.bpp=24] - 色深 (16/24/32)
     * @param {string} [options.keyboard='en'] - 键盘布局
     */
    constructor(options) {
        this._validateOptions(options);
        
        this.canvas = options.canvas;
        this.url = options.url;
        this.username = options.username;
        this.password = options.password;
        this.domain = options.domain || '';
        this.width = options.width || 800;
        this.height = options.height || 600;
        this.bpp = options.bpp || 24;
        this.keyboard = options.keyboard || 'en';
        
        // 内部状态
        this._wasm = null;
        this._client = null;
        this._socket = null;
        this._connected = false;
        this._graphics = null;
        this._keyboard = null;
        this._mouse = null;
        this._clipboard = null;
        
        // 事件回调
        this._eventHandlers = {
            connected: [],
            disconnected: [],
            error: [],
            resize: [],
            clipboard: [],
            log: []
        };
    }

    /**
     * 验证配置选项
     * @private
     */
    _validateOptions(options) {
        if (!options.canvas || !(options.canvas instanceof HTMLCanvasElement)) {
            throw new Error('canvas 必须是 HTMLCanvasElement 实例');
        }
        if (!options.url || typeof options.url !== 'string') {
            throw new Error('url 必须是有效的 WebSocket 地址');
        }
        if (!options.username || typeof options.username !== 'string') {
            throw new Error('username 是必需的');
        }
        if (!options.password || typeof options.password !== 'string') {
            throw new Error('password 是必需的');
        }
    }

    /**
     * 初始化 WASM 模块
     * @param {string} [wasmPath='./js_client.js'] - WASM 模块路径
     * @returns {Promise<void>}
     */
    async initialize(wasmPath = './js_client.js') {
        if (this._wasm) {
            throw new Error('客户端已经初始化');
        }

        this._log('正在加载 WASM 模块...');
        
        try {
            // 加载 WASM 模块
            const WallixModule = await this._loadWasmModule(wasmPath);
            this._wasm = await WallixModule();
            
            this._log('WASM 模块加载成功');
            
            // 初始化图形、键盘、鼠标、剪贴板处理器
            this._initializeHandlers();
            
            return this._wasm;
        } catch (error) {
            this._error('WASM 模块加载失败', error);
            throw error;
        }
    }

    /**
     * 加载 WASM 模块
     * @private
     */
    async _loadWasmModule(path) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = path;
            script.onload = () => {
                if (typeof WallixModule !== 'undefined') {
                    resolve(WallixModule);
                } else {
                    reject(new Error('WallixModule 未定义'));
                }
            };
            script.onerror = () => reject(new Error(`加载脚本失败: ${path}`));
            document.head.appendChild(script);
        });
    }

    /**
     * 初始化处理器
     * @private
     */
    _initializeHandlers() {
        const ctx = this.canvas.getContext('2d');
        
        // 图形绘制回调
        this._graphics = {
            draw: (imageData, x, y, w, h) => {
                ctx.putImageData(imageData, x, y);
            },
            resize: (width, height) => {
                this.canvas.width = width;
                this.canvas.height = height;
                this._emit('resize', { width, height });
            },
            setCursor: (cursorType) => {
                this.canvas.style.cursor = cursorType;
            }
        };

        // 键盘事件处理
        this._keyboard = {
            handleKeyDown: (e) => {
                if (!this._connected) return;
                e.preventDefault();
                // 发送键盘事件到 WASM
                // this._client.writeScancodeEvent(scancode);
            },
            handleKeyUp: (e) => {
                if (!this._connected) return;
                e.preventDefault();
            }
        };

        // 鼠标事件处理
        this._mouse = {
            handleMouseMove: (e) => {
                if (!this._connected) return;
                const rect = this.canvas.getBoundingClientRect();
                const x = Math.floor(e.clientX - rect.left);
                const y = Math.floor(e.clientY - rect.top);
                // this._client.writeMouseEvent(x, y, flags);
            },
            handleMouseDown: (e) => {
                if (!this._connected) return;
                e.preventDefault();
            },
            handleMouseUp: (e) => {
                if (!this._connected) return;
                e.preventDefault();
            },
            handleWheel: (e) => {
                if (!this._connected) return;
                e.preventDefault();
            }
        };

        // 剪贴板处理
        this._clipboard = {
            handleCopy: async (e) => {
                // 处理复制事件
            },
            handlePaste: async (e) => {
                // 处理粘贴事件
            }
        };
    }

    /**
     * 连接到 RDP 服务器
     * @returns {Promise<void>}
     */
    async connect() {
        if (!this._wasm) {
            throw new Error('请先调用 initialize() 初始化客户端');
        }
        if (this._connected) {
            throw new Error('客户端已连接');
        }

        this._log(`正在连接到 ${this.url}...`);

        try {
            // 创建 WebSocket 连接
            this._socket = await this._createWebSocket();
            
            // 创建 RDP 客户端配置
            const config = this._createConfig();
            const graphics = this._createGraphicsObject();
            
            // 创建 WASM 客户端实例
            this._client = new this._wasm.RdpClient(graphics, config);
            
            // 注册事件监听器
            this._registerEventListeners();
            
            // 发送第一个数据包
            this._client.writeFirstPacket();
            this._sendOutputData();
            
            this._connected = true;
            this._emit('connected');
            this._log('连接成功');
            
        } catch (error) {
            this._error('连接失败', error);
            throw error;
        }
    }

    /**
     * 创建 WebSocket 连接
     * @private
     */
    _createWebSocket() {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(this.url);
            ws.binaryType = 'arraybuffer';
            
            ws.onopen = () => {
                this._log('WebSocket 连接已建立');
                resolve(ws);
            };
            
            ws.onerror = (error) => {
                this._error('WebSocket 错误', error);
                reject(error);
            };
            
            ws.onmessage = (event) => {
                this._handleServerData(event.data);
            };
            
            ws.onclose = () => {
                this._handleDisconnect();
            };
        });
    }

    /**
     * 创建配置对象
     * @private
     */
    _createConfig() {
        return {
            user: this.username,
            password: this.password,
            domain: this.domain,
            width: this.width,
            height: this.height,
            bpp: this.bpp,
            keyboard_layout: this._getKeyboardLayoutId(this.keyboard),
            // 更多配置选项...
        };
    }

    /**
     * 创建图形对象
     * @private
     */
    _createGraphicsObject() {
        const self = this;
        return {
            draw: function(data, x, y, w, h) {
                // 将 WASM 内存中的图像数据绘制到 Canvas
                const imageData = self.canvas.getContext('2d').createImageData(w, h);
                // 复制数据...
                self._graphics.draw(imageData, x, y, w, h);
            },
            resize: function(width, height) {
                self._graphics.resize(width, height);
            },
            log: function(level, message) {
                self._log(message, level);
            }
        };
    }

    /**
     * 注册事件监听器
     * @private
     */
    _registerEventListeners() {
        // 键盘事件
        this.canvas.addEventListener('keydown', this._keyboard.handleKeyDown);
        this.canvas.addEventListener('keyup', this._keyboard.handleKeyUp);
        
        // 鼠标事件
        this.canvas.addEventListener('mousemove', this._mouse.handleMouseMove);
        this.canvas.addEventListener('mousedown', this._mouse.handleMouseDown);
        this.canvas.addEventListener('mouseup', this._mouse.handleMouseUp);
        this.canvas.addEventListener('wheel', this._mouse.handleWheel);
        
        // 剪贴板事件
        document.addEventListener('copy', this._clipboard.handleCopy);
        document.addEventListener('paste', this._clipboard.handlePaste);
        
        // 确保 canvas 可以获得焦点
        this.canvas.tabIndex = 1;
        this.canvas.focus();
    }

    /**
     * 处理服务器数据
     * @private
     */
    _handleServerData(data) {
        if (!this._client) return;
        
        try {
            // 将数据传递给 WASM 客户端处理
            const uint8Array = new Uint8Array(data);
            this._client.processInputData(uint8Array);
            
            // 发送响应数据
            this._sendOutputData();
            
        } catch (error) {
            this._error('处理服务器数据失败', error);
        }
    }

    /**
     * 发送输出数据到服务器
     * @private
     */
    _sendOutputData() {
        if (!this._client || !this._socket) return;
        
        const output = this._client.getOutputData();
        if (output && output.length > 0) {
            this._socket.send(output);
            this._client.resetOutputData();
        }
    }

    /**
     * 断开连接
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (!this._connected) {
            return;
        }

        this._log('正在断开连接...');
        
        try {
            // 移除事件监听器
            this._unregisterEventListeners();
            
            // 关闭 WebSocket
            if (this._socket) {
                this._socket.close();
                this._socket = null;
            }
            
            // 清理 WASM 客户端
            if (this._client) {
                this._client.delete();
                this._client = null;
            }
            
            this._connected = false;
            this._emit('disconnected');
            this._log('已断开连接');
            
        } catch (error) {
            this._error('断开连接时出错', error);
        }
    }

    /**
     * 处理断开连接事件
     * @private
     */
    _handleDisconnect() {
        if (this._connected) {
            this._connected = false;
            this._emit('disconnected');
            this._log('连接已关闭');
        }
    }

    /**
     * 取消注册事件监听器
     * @private
     */
    _unregisterEventListeners() {
        this.canvas.removeEventListener('keydown', this._keyboard.handleKeyDown);
        this.canvas.removeEventListener('keyup', this._keyboard.handleKeyUp);
        this.canvas.removeEventListener('mousemove', this._mouse.handleMouseMove);
        this.canvas.removeEventListener('mousedown', this._mouse.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this._mouse.handleMouseUp);
        this.canvas.removeEventListener('wheel', this._mouse.handleWheel);
        document.removeEventListener('copy', this._clipboard.handleCopy);
        document.removeEventListener('paste', this._clipboard.handlePaste);
    }

    /**
     * 发送键盘事件
     * @param {number} scancode - 扫描码
     * @param {boolean} pressed - 是否按下
     */
    sendKeyEvent(scancode, pressed) {
        if (!this._connected || !this._client) return;
        
        const flags = pressed ? 0 : 0x8000; // KEY_UP flag
        this._client.writeScancodeEvent(scancode | flags);
        this._sendOutputData();
    }

    /**
     * 发送 Unicode 字符
     * @param {number} unicode - Unicode 码点
     * @param {boolean} pressed - 是否按下
     */
    sendUnicodeEvent(unicode, pressed) {
        if (!this._connected || !this._client) return;
        
        const flags = pressed ? 0 : 0x8000;
        this._client.writeUnicodeEvent(unicode, flags);
        this._sendOutputData();
    }

    /**
     * 发送鼠标事件
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} flags - 鼠标标志
     */
    sendMouseEvent(x, y, flags) {
        if (!this._connected || !this._client) return;
        
        this._client.writeMouseEvent(x, y, flags);
        this._sendOutputData();
    }

    /**
     * 发送剪贴板数据
     * @param {string} text - 文本内容
     */
    sendClipboard(text) {
        if (!this._connected) return;
        
        // 实现剪贴板发送逻辑
        this._log('发送剪贴板数据');
    }

    /**
     * 注册事件监听器
     * @param {string} event - 事件名称 (connected, disconnected, error, resize, clipboard, log)
     * @param {Function} handler - 事件处理函数
     */
    on(event, handler) {
        if (this._eventHandlers[event]) {
            this._eventHandlers[event].push(handler);
        } else {
            throw new Error(`未知的事件类型: ${event}`);
        }
        return this;
    }

    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} handler - 事件处理函数
     */
    off(event, handler) {
        if (this._eventHandlers[event]) {
            const index = this._eventHandlers[event].indexOf(handler);
            if (index > -1) {
                this._eventHandlers[event].splice(index, 1);
            }
        }
        return this;
    }

    /**
     * 触发事件
     * @private
     */
    _emit(event, data) {
        if (this._eventHandlers[event]) {
            this._eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 记录日志
     * @private
     */
    _log(message, level = 'info') {
        const logData = {
            timestamp: new Date().toISOString(),
            level,
            message
        };
        console.log(`[RDPClient ${level}]`, message);
        this._emit('log', logData);
    }

    /**
     * 记录错误
     * @private
     */
    _error(message, error) {
        const errorData = {
            timestamp: new Date().toISOString(),
            message,
            error: error?.message || error
        };
        console.error('[RDPClient error]', message, error);
        this._emit('error', errorData);
    }

    /**
     * 获取键盘布局 ID
     * @private
     */
    _getKeyboardLayoutId(layout) {
        const layouts = {
            'en': 0x409,      // 美式英语
            'fr': 0x40c,      // 法语
            'de': 0x407,      // 德语
            'es': 0x40a,      // 西班牙语
            'it': 0x410,      // 意大利语
            'pt': 0x416,      // 葡萄牙语
            'zh': 0x804,      // 中文
            'ja': 0x411,      // 日语
            'ko': 0x412,      // 韩语
        };
        return layouts[layout] || layouts['en'];
    }

    /**
     * 获取连接状态
     * @returns {boolean}
     */
    isConnected() {
        return this._connected;
    }

    /**
     * 获取画布尺寸
     * @returns {{width: number, height: number}}
     */
    getCanvasSize() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RDPClient;
}
if (typeof window !== 'undefined') {
    window.RDPClient = RDPClient;
}
