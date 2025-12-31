/**
 * RDP Client JavaScript Library
 * 提供清晰简洁的 API 来使用 WebAssembly RDP 客户端
 * 包含完整的键盘、鼠标、剪贴板支持
 * 
 * @version 1.1.0
 * @license GPL-2.0+
 */

// ============================================================================
// 键盘处理模块
// ============================================================================

// 键盘扫描码映射表
const SCANCODE_MAP = {
    // 字母键
    'KeyA': 0x1E, 'KeyB': 0x30, 'KeyC': 0x2E, 'KeyD': 0x20,
    'KeyE': 0x12, 'KeyF': 0x21, 'KeyG': 0x22, 'KeyH': 0x23,
    'KeyI': 0x17, 'KeyJ': 0x24, 'KeyK': 0x25, 'KeyL': 0x26,
    'KeyM': 0x32, 'KeyN': 0x31, 'KeyO': 0x18, 'KeyP': 0x19,
    'KeyQ': 0x10, 'KeyR': 0x13, 'KeyS': 0x1F, 'KeyT': 0x14,
    'KeyU': 0x16, 'KeyV': 0x2F, 'KeyW': 0x11, 'KeyX': 0x2D,
    'KeyY': 0x15, 'KeyZ': 0x2C,

    // 数字键
    'Digit0': 0x0B, 'Digit1': 0x02, 'Digit2': 0x03, 'Digit3': 0x04,
    'Digit4': 0x05, 'Digit5': 0x06, 'Digit6': 0x07, 'Digit7': 0x08,
    'Digit8': 0x09, 'Digit9': 0x0A,

    // 功能键
    'F1': 0x3B, 'F2': 0x3C, 'F3': 0x3D, 'F4': 0x3E,
    'F5': 0x3F, 'F6': 0x40, 'F7': 0x41, 'F8': 0x42,
    'F9': 0x43, 'F10': 0x44, 'F11': 0x57, 'F12': 0x58,

    // 符号键
    'Minus': 0x0C, 'Equal': 0x0D, 'Backspace': 0x0E,
    'Tab': 0x0F, 'BracketLeft': 0x1A, 'BracketRight': 0x1B,
    'Enter': 0x1C, 'Semicolon': 0x27, 'Quote': 0x28,
    'Backquote': 0x29, 'Backslash': 0x2B, 'Comma': 0x33,
    'Period': 0x34, 'Slash': 0x35, 'Space': 0x39,

    // 修饰键
    'CapsLock': 0x3A, 'ShiftLeft': 0x2A, 'ShiftRight': 0x36,
    'ControlLeft': 0x1D, 'ControlRight': 0x11D,
    'AltLeft': 0x38, 'AltRight': 0x138,
    'OSLeft': 0x15B, 'OSRight': 0x15C,
    'MetaLeft': 0x15B, 'MetaRight': 0x15C,

    // 方向键（带扩展前缀）
    'ArrowUp': 0x148, 'ArrowDown': 0x150,
    'ArrowLeft': 0x14B, 'ArrowRight': 0x14D,

    // 编辑键（带扩展前缀）
    'Insert': 0x152, 'Delete': 0x153,
    'Home': 0x147, 'End': 0x14F,
    'PageUp': 0x149, 'PageDown': 0x151,

    // 其他
    'Escape': 0x01, 'NumLock': 0x45, 'ScrollLock': 0x46,
    'Pause': 0xE11D45, 'ContextMenu': 0x15D,
    'PrintScreen': 0xE02AE037,

    // 小键盘
    'Numpad0': 0x52, 'Numpad1': 0x4F, 'Numpad2': 0x50,
    'Numpad3': 0x51, 'Numpad4': 0x4B, 'Numpad5': 0x4C,
    'Numpad6': 0x4D, 'Numpad7': 0x47, 'Numpad8': 0x48,
    'Numpad9': 0x49, 'NumpadDecimal': 0x53, 'NumpadEnter': 0x11C,
    'NumpadAdd': 0x4E, 'NumpadSubtract': 0x4A,
    'NumpadMultiply': 0x37, 'NumpadDivide': 0x135,
};

// 键标志
const KEY_FLAGS = {
    RELEASE: 0x8000,  // 键释放标志
    EXTENDED: 0x0100, // 扩展键标志
};

// 修饰键状态
const MODIFIER_KEYS = {
    Shift: ['ShiftLeft', 'ShiftRight'],
    Control: ['ControlLeft', 'ControlRight'],
    Alt: ['AltLeft', 'AltRight'],
    Meta: ['MetaLeft', 'MetaRight', 'OSLeft', 'OSRight'],
};

// 锁定键状态标志
const LOCK_FLAGS = {
    SCROLL_LOCK: 0x01,
    NUM_LOCK: 0x02,
    CAPS_LOCK: 0x04,
};

/**
 * 键盘处理器类
 */
class KeyboardHandler {
    constructor(client) {
        this.client = client;
        this.pressedKeys = new Set(); // 记录按下的键
        this.modifierState = {
            shift: false,
            control: false,
            alt: false,
            meta: false,
        };
        this.lockState = {
            capsLock: false,
            numLock: false,
            scrollLock: false,
        };
        this.composing = false; // 输入法组合状态
        this.compositionText = '';

        // 绑定事件处理方法
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleCompositionStart = this.handleCompositionStart.bind(this);
        this.handleCompositionUpdate = this.handleCompositionUpdate.bind(this);
        this.handleCompositionEnd = this.handleCompositionEnd.bind(this);
    }

    getScancode(code) {
        return SCANCODE_MAP[code];
    }

    isExtendedKey(scancode) {
        return scancode > 0xFF;
    }

    isModifierKey(code) {
        for (const modCodes of Object.values(MODIFIER_KEYS)) {
            if (modCodes.includes(code)) {
                return true;
            }
        }
        return false;
    }

    updateModifierState(event) {
        this.modifierState.shift = event.shiftKey;
        this.modifierState.control = event.ctrlKey;
        this.modifierState.alt = event.altKey;
        this.modifierState.meta = event.metaKey;
    }

    updateLockState(code, pressed) {
        if (code === 'CapsLock' && pressed) {
            this.lockState.capsLock = !this.lockState.capsLock;
            this.syncLocks();
        } else if (code === 'NumLock' && pressed) {
            this.lockState.numLock = !this.lockState.numLock;
            this.syncLocks();
        } else if (code === 'ScrollLock' && pressed) {
            this.lockState.scrollLock = !this.lockState.scrollLock;
            this.syncLocks();
        }
    }

    syncLocks() {
        let locks = 0;
        if (this.lockState.scrollLock) locks |= LOCK_FLAGS.SCROLL_LOCK;
        if (this.lockState.numLock) locks |= LOCK_FLAGS.NUM_LOCK;
        if (this.lockState.capsLock) locks |= LOCK_FLAGS.CAPS_LOCK;
        
        if (this.client && this.client._client) {
            this.client._client.syncKbdLocks(locks);
            this.client._sendOutputData();
        }
    }

    handleKeyDown(event) {
        if (!this.shouldAllowDefault(event)) {
            event.preventDefault();
        }

        if (this.composing) {
            return;
        }

        const code = event.code;
        if (!code) return;

        if (this.pressedKeys.has(code)) {
            return;
        }

        this.pressedKeys.add(code);
        this.updateModifierState(event);
        this.updateLockState(code, true);

        const scancode = this.getScancode(code);
        if (scancode === undefined) {
            console.warn('未知的键码:', code);
            return;
        }

        this.sendScancode(scancode, false);
    }

    handleKeyUp(event) {
        if (!this.shouldAllowDefault(event)) {
            event.preventDefault();
        }

        if (this.composing) {
            return;
        }

        const code = event.code;
        if (!code) return;

        this.pressedKeys.delete(code);
        this.updateModifierState(event);

        const scancode = this.getScancode(code);
        if (scancode === undefined) {
            return;
        }

        this.sendScancode(scancode, true);
    }

    sendScancode(scancode, release) {
        if (!this.client || !this.client._client) {
            return;
        }

        let flags = release ? KEY_FLAGS.RELEASE : 0;
        
        if (this.isExtendedKey(scancode)) {
            flags |= KEY_FLAGS.EXTENDED;
        }

        const scancodeWithFlags = scancode | flags;
        
        try {
            this.client._client.writeScancodeEvent(scancodeWithFlags);
            this.client._sendOutputData();
        } catch (error) {
            console.error('发送扫描码失败:', error);
        }
    }

    handleCompositionStart(event) {
        this.composing = true;
        this.compositionText = '';
    }

    handleCompositionUpdate(event) {
        this.compositionText = event.data || '';
    }

    handleCompositionEnd(event) {
        this.composing = false;
        const text = event.data || this.compositionText;
        
        if (text) {
            this.sendUnicodeText(text);
        }
        
        this.compositionText = '';
    }

    sendUnicodeText(text) {
        if (!this.client || !this.client._client) {
            return;
        }

        try {
            for (const char of text) {
                const unicode = char.charCodeAt(0);
                this.client._client.writeUnicodeEvent(unicode, 0);
                this.client._client.writeUnicodeEvent(unicode, KEY_FLAGS.RELEASE);
            }
            this.client._sendOutputData();
        } catch (error) {
            console.error('发送 Unicode 文本失败:', error);
        }
    }

    shouldAllowDefault(event) {
        if (event.key === 'F5') return true;
        if (event.key === 'F12') return true;
        if (event.ctrlKey && event.key === 'w') return true;
        if (event.ctrlKey && event.key === 't') return true;
        if (event.ctrlKey && event.shiftKey && event.key === 'T') return true;
        return false;
    }

    releaseAllKeys() {
        for (const code of this.pressedKeys) {
            const scancode = this.getScancode(code);
            if (scancode !== undefined) {
                this.sendScancode(scancode, true);
            }
        }
        this.pressedKeys.clear();
    }

    attach(element) {
        element.addEventListener('keydown', this.handleKeyDown);
        element.addEventListener('keyup', this.handleKeyUp);
        element.addEventListener('compositionstart', this.handleCompositionStart);
        element.addEventListener('compositionupdate', this.handleCompositionUpdate);
        element.addEventListener('compositionend', this.handleCompositionEnd);
        
        if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }
        
        element.focus();
    }

    detach(element) {
        element.removeEventListener('keydown', this.handleKeyDown);
        element.removeEventListener('keyup', this.handleKeyUp);
        element.removeEventListener('compositionstart', this.handleCompositionStart);
        element.removeEventListener('compositionupdate', this.handleCompositionUpdate);
        element.removeEventListener('compositionend', this.handleCompositionEnd);
        this.releaseAllKeys();
    }

    handleBlur() {
        this.releaseAllKeys();
    }

    getState() {
        return {
            pressedKeys: Array.from(this.pressedKeys),
            modifierState: { ...this.modifierState },
            lockState: { ...this.lockState },
            composing: this.composing,
        };
    }
}

// ============================================================================
// RDP 客户端主类
// ============================================================================

class RDPClient {
    // 私有字段
    #wasm = null;
    #client = null;
    #socket = null;
    #connected = false;
    #graphics = null;
    #keyboardHandler = null;
    #mouse = null;
    #clipboard = null;
    #eventHandlers = new Map();
    #reconnectAttempts = 0;
    #maxReconnectAttempts = 3;
    
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
     * @param {boolean} [options.autoReconnect=false] - 自动重连
     * @param {number} [options.maxReconnectAttempts=3] - 最大重连次数
     */
    constructor(options) {
        this._validateOptions(options);
        
        // 公共配置
        this.canvas = options.canvas;
        this.url = options.url;
        this.username = options.username;
        this.password = options.password;
        this.domain = options.domain ?? '';
        this.width = options.width ?? 800;
        this.height = options.height ?? 600;
        this.bpp = options.bpp ?? 24;
        this.keyboard = options.keyboard ?? 'en';
        this.autoReconnect = options.autoReconnect ?? false;
        this.#maxReconnectAttempts = options.maxReconnectAttempts ?? 3;
        
        // 初始化事件处理器映射
        for (const event of ['connected', 'disconnected', 'error', 'resize', 'clipboard', 'log']) {
            this.#eventHandlers.set(event, []);
        }
    }

    /**
     * 验证配置选项
     * @private
     */
    _validateOptions(options) {
        const validators = [
            { condition: !options?.canvas || !(options.canvas instanceof HTMLCanvasElement), 
              message: 'canvas 必须是 HTMLCanvasElement 实例' },
            { condition: !options?.url || typeof options.url !== 'string', 
              message: 'url 必须是有效的 WebSocket 地址' },
            { condition: !options?.username || typeof options.username !== 'string', 
              message: 'username 是必需的' },
            { condition: !options?.password || typeof options.password !== 'string', 
              message: 'password 是必需的' }
        ];
        
        for (const { condition, message } of validators) {
            if (condition) throw new Error(message);
        }
    }

    /**
     * 初始化 WASM 模块
     * @param {string} [wasmPath='./js_client.js'] - WASM 模块路径
     * @returns {Promise<Object>} WASM 模块实例
     */
    async initialize(wasmPath = './js_client.js') {
        if (this.#wasm) {
            throw new Error('客户端已经初始化');
        }

        this._log('正在加载 WASM 模块...');
        
        try {
            const WallixModule = await this._loadWasmModule(wasmPath);
            this.#wasm = await WallixModule();
            
            this._log('WASM 模块加载成功');
            this._initializeHandlers();
            
            return this.#wasm;
        } catch (error) {
            this._error('WASM 模块加载失败', error);
            throw error;
        }
    }

    /**
     * 处理鼠标移动
     * @private
     */
    _handleMouseMove(e) {
        if (!this.#connected) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        // 发送鼠标位置
        if (this.#client) {
            // this.#client.writeMouseEvent(x, y, 0x0800); // MOUSE_MOVE
        }
    }

    /**
     * 处理鼠标按下
     * @private
     */
    _handleMouseDown(e) {
        if (!this.#connected) return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        // 发送鼠标按下事件
    }

    /**
     * 处理鼠标释放
     * @private
     */
    _handleMouseUp(e) {
        if (!this.#connected) return;
        e.preventDefault();
    }

    /**
     * 处理鼠标滚轮
     * @private
     */
    _handleWheel(e) {
        if (!this.#connected) return;
        e.preventDefault();
    }

    /**
     * 处理复制事件
     * @private
     */
    async _handleCopy(e) {
        // TODO: 实现剪贴板复制
    }

    /**
     * 处理粘贴事件
     * @private
     */
    async _handlePaste(e) {
        // TODO: 实现剪贴板粘贴
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
        this.#graphics = {
            draw: (imageData, x, y, w, h) => ctx.putImageData(imageData, x, y),
            resize: (width, height) => {
                this.canvas.width = width;
                this.canvas.height = height;
                this._emit('resize', { width, height });
            },
            setCursor: (cursorType) => {
                this.canvas.style.cursor = cursorType;
            }
        };

        // 创建键盘处理器
        this.#keyboardHandler = new KeyboardHandler(this);

        // 鼠标事件处理
        this.#mouse = {
            handleMouseMove: (e) => this._handleMouseMove(e),
            handleMouseDown: (e) => this._handleMouseDown(e),
            handleMouseUp: (e) => this._handleMouseUp(e),
            handleWheel: (e) => this._handleWheel(e)
        };

        // 剪贴板处理
        this.#clipboard = {
            handleCopy: async (e) => this._handleCopy(e),
            handlePaste: async (e) => this._handlePaste(e)
        };
    }

    /**
     * 连接到 RDP 服务器
     * @returns {Promise<void>}
     */
    async connect() {
        if (!this.#wasm) {
            throw new Error('请先调用 initialize() 初始化客户端');
        }
        if (this.#connected) {
            throw new Error('客户端已连接');
        }

        this._log(`正在连接到 ${this.url}...`);

        try {
            this.#socket = await this._createWebSocket();
            
            const config = this._createConfig();
            const graphics = this._createGraphicsObject();
            
            this.#client = new this.#wasm.RdpClient(graphics, config);
            
            this._registerEventListeners();
            
            this.#client.writeFirstPacket();
            this._sendOutputData();
            
            this.#connected = true;
            this.#reconnectAttempts = 0;
            this._emit('connected');
            this._log('连接成功');
            
        } catch (error) {
            this._error('连接失败', error);
            await this._handleReconnect(error);
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
        // 键盘事件（使用 KeyboardHandler）
        if (this.#keyboardHandler) {
            this.#keyboardHandler.attach(this.canvas);
        }
        
        // 鼠标事件
        this.canvas.addEventListener('mousemove', this.#mouse.handleMouseMove);
        this.canvas.addEventListener('mousedown', this.#mouse.handleMouseDown);
        this.canvas.addEventListener('mouseup', this.#mouse.handleMouseUp);
        this.canvas.addEventListener('wheel', this.#mouse.handleWheel);
        
        // 剪贴板事件
        document.addEventListener('copy', this.#clipboard.handleCopy);
        document.addEventListener('paste', this.#clipboard.handlePaste);
        
        // 窗口失去焦点时释放所有按键
        window.addEventListener('blur', () => {
            if (this.#keyboardHandler) {
                this.#keyboardHandler.handleBlur();
            }
        });
        
        // 确保 canvas 可以获得焦点
        this.canvas.tabIndex = 1;
        this.canvas.focus();
    }

    /**
     * 处理服务器数据
     * @private
     */
    _handleServerData(data) {
        if (!this.#client) return;
        
        try {
            // 将数据传递给 WASM 客户端处理
            const uint8Array = new Uint8Array(data);
            this.#client.processInputData(uint8Array);
            
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
        if (!this.#client || !this.#socket) return;
        
        const output = this.#client.getOutputData();
        if (output && output.length > 0) {
            this.#socket.send(output);
            this.#client.resetOutputData();
        }
    }

    /**
     * 处理重连
     * @private
     */
    async _handleReconnect(error) {
        if (!this.autoReconnect || this.#reconnectAttempts >= this.#maxReconnectAttempts) {
            throw error;
        }
        
        this.#reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.#reconnectAttempts - 1), 10000);
        this._log(`尝试重连 (${this.#reconnectAttempts}/${this.#maxReconnectAttempts})，${delay}ms 后...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connect();
    }

    /**
     * 断开连接
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (!this.#connected) {
            return;
        }

        this._log('正在断开连接...');
        
        try {
            // 移除事件监听器
            this._unregisterEventListeners();
            
            // 关闭 WebSocket
            if (this.#socket) {
                this.#socket.close();
                this.#socket = null;
            }
            
            // 清理 WASM 客户端
            if (this.#client) {
                this.#client.delete();
                this.#client = null;
            }
            
            this.#connected = false;
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
        if (this.#connected) {
            this.#connected = false;
            this._emit('disconnected');
            this._log('连接已关闭');
        }
    }

    /**
     * 移除事件监听器
     * @private
     */
    _unregisterEventListeners() {
        // 移除键盘事件
        if (this.#keyboardHandler) {
            this.#keyboardHandler.detach(this.canvas);
        }
        
        // 移除鼠标事件
        this.canvas.removeEventListener('mousemove', this.#mouse.handleMouseMove);
        this.canvas.removeEventListener('mousedown', this.#mouse.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.#mouse.handleMouseUp);
        this.canvas.removeEventListener('wheel', this.#mouse.handleWheel);
        
        // 移除剪贴板事件
        document.removeEventListener('copy', this.#clipboard.handleCopy);
        document.removeEventListener('paste', this.#clipboard.handlePaste);
    }

    /**
     * 发送键盘事件
     * @param {number} scancode - 扫描码
     * @param {boolean} pressed - 是否按下
     */
    sendKeyEvent(scancode, pressed) {
        if (!this.#connected || !this.#client) return;
        
        const flags = pressed ? 0 : 0x8000; // KEY_UP flag
        this.#client.writeScancodeEvent(scancode | flags);
        this._sendOutputData();
    }

    /**
     * 发送 Unicode 字符
     * @param {number} unicode - Unicode 码点
     * @param {boolean} pressed - 是否按下
     */
    sendUnicodeEvent(unicode, pressed) {
        if (!this.#connected || !this.#client) return;
        
        const flags = pressed ? 0 : 0x8000;
        this.#client.writeUnicodeEvent(unicode, flags);
        this._sendOutputData();
    }

    /**
     * 发送鼠标事件
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} flags - 鼠标标志
     */
    sendMouseEvent(x, y, flags) {
        if (!this.#connected || !this.#client) return;
        
        this.#client.writeMouseEvent(x, y, flags);
        this._sendOutputData();
    }

    /**
     * 发送剪贴板数据
     * @param {string} text - 文本内容
     */
    sendClipboard(text) {
        if (!this.#connected) return;
        
        // 实现剪贴板发送逻辑
        this._log('发送剪贴板数据');
    }

    /**
     * 注册事件监听器
     * @param {string} event - 事件名称 (connected, disconnected, error, resize, clipboard, log)
     * @param {Function} handler - 事件处理函数
     */
    on(event, handler) {
        if (this.#eventHandlers[event]) {
            this.#eventHandlers[event].push(handler);
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
        if (this.#eventHandlers[event]) {
            const index = this.#eventHandlers[event].indexOf(handler);
            if (index > -1) {
                this.#eventHandlers[event].splice(index, 1);
            }
        }
        return this;
    }

    /**
     * 触发事件
     * @private
     */
    _emit(event, data) {
        if (this.#eventHandlers[event]) {
            this.#eventHandlers[event].forEach(handler => {
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
        return this.#connected;
    }

    /**
     * 获取画布尺寸
     * @returns {{width: number, height: number}}
     */

    /**
     * 获取键盘状态（调试用）
     * @returns {Object} 键盘状态信息
     */
    getKeyboardState() {
        if (this.#keyboardHandler) {
            return this.#keyboardHandler.getState();
        }
        return null;
    }

    /**
     * 释放所有按下的键
     */
    releaseAllKeys() {
        if (this.#keyboardHandler) {
            this.#keyboardHandler.releaseAllKeys();
        }
    }

    /**
     * 同步锁定键状态
     * @param {Object} locks - 锁定键状态 {capsLock, numLock, scrollLock}
     */
    syncLockKeys(locks) {
        if (this.#keyboardHandler) {
            if (locks.capsLock !== undefined) {
                this.#keyboardHandler.lockState.capsLock = locks.capsLock;
            }
            if (locks.numLock !== undefined) {
                this.#keyboardHandler.lockState.numLock = locks.numLock;
            }
            if (locks.scrollLock !== undefined) {
                this.#keyboardHandler.lockState.scrollLock = locks.scrollLock;
            }
            this.#keyboardHandler.syncLocks();
        }
    }
    getCanvasSize() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RDPClient, KeyboardHandler };
}
if (typeof window !== 'undefined') {
    window.RDPClient = RDPClient;
    window.KeyboardHandler = KeyboardHandler;
}
