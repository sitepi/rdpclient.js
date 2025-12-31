/**
 * 键盘处理模块
 * 提供完整的键盘输入功能，包括扫描码映射、修饰键处理、特殊键支持等
 */

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

    /**
     * 将键码转换为扫描码
     */
    getScancode(code) {
        return SCANCODE_MAP[code];
    }

    /**
     * 检查是否是扩展键（需要 0xE0 前缀）
     */
    isExtendedKey(scancode) {
        return scancode > 0xFF;
    }

    /**
     * 检查是否是修饰键
     */
    isModifierKey(code) {
        for (const modCodes of Object.values(MODIFIER_KEYS)) {
            if (modCodes.includes(code)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 更新修饰键状态
     */
    updateModifierState(event) {
        this.modifierState.shift = event.shiftKey;
        this.modifierState.control = event.ctrlKey;
        this.modifierState.alt = event.altKey;
        this.modifierState.meta = event.metaKey;
    }

    /**
     * 更新锁定键状态
     */
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

    /**
     * 同步锁定键状态到服务器
     */
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

    /**
     * 处理按键按下事件
     */
    handleKeyDown(event) {
        // 阻止默认行为（除了 F5、F12 等浏览器快捷键）
        if (!this.shouldAllowDefault(event)) {
            event.preventDefault();
        }

        // 输入法组合中，不处理键盘事件
        if (this.composing) {
            return;
        }

        const code = event.code;
        if (!code) return;

        // 避免重复按键（自动重复）
        if (this.pressedKeys.has(code)) {
            return;
        }

        this.pressedKeys.add(code);
        this.updateModifierState(event);
        this.updateLockState(code, true);

        // 获取扫描码
        const scancode = this.getScancode(code);
        if (scancode === undefined) {
            console.warn('未知的键码:', code);
            return;
        }

        // 发送扫描码
        this.sendScancode(scancode, false);
    }

    /**
     * 处理按键释放事件
     */
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

        // 获取扫描码
        const scancode = this.getScancode(code);
        if (scancode === undefined) {
            return;
        }

        // 发送扫描码（带释放标志）
        this.sendScancode(scancode, true);
    }

    /**
     * 发送扫描码到 RDP 服务器
     */
    sendScancode(scancode, release) {
        if (!this.client || !this.client._client) {
            return;
        }

        let flags = release ? KEY_FLAGS.RELEASE : 0;
        
        // 处理扩展键
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

    /**
     * 输入法组合开始
     */
    handleCompositionStart(event) {
        this.composing = true;
        this.compositionText = '';
    }

    /**
     * 输入法组合更新
     */
    handleCompositionUpdate(event) {
        this.compositionText = event.data || '';
    }

    /**
     * 输入法组合结束
     */
    handleCompositionEnd(event) {
        this.composing = false;
        const text = event.data || this.compositionText;
        
        if (text) {
            // 发送 Unicode 字符
            this.sendUnicodeText(text);
        }
        
        this.compositionText = '';
    }

    /**
     * 发送 Unicode 文本
     */
    sendUnicodeText(text) {
        if (!this.client || !this.client._client) {
            return;
        }

        try {
            for (const char of text) {
                const unicode = char.charCodeAt(0);
                // 按下
                this.client._client.writeUnicodeEvent(unicode, 0);
                // 释放
                this.client._client.writeUnicodeEvent(unicode, KEY_FLAGS.RELEASE);
            }
            this.client._sendOutputData();
        } catch (error) {
            console.error('发送 Unicode 文本失败:', error);
        }
    }

    /**
     * 判断是否允许浏览器默认行为
     */
    shouldAllowDefault(event) {
        // 允许 F5 刷新
        if (event.key === 'F5') return true;
        // 允许 F12 开发者工具
        if (event.key === 'F12') return true;
        // 允许 Ctrl+W 关闭标签页
        if (event.ctrlKey && event.key === 'w') return true;
        // 允许 Ctrl+T 新建标签页
        if (event.ctrlKey && event.key === 't') return true;
        // 允许 Ctrl+Shift+T 恢复标签页
        if (event.ctrlKey && event.shiftKey && event.key === 'T') return true;
        
        return false;
    }

    /**
     * 释放所有按下的键
     */
    releaseAllKeys() {
        for (const code of this.pressedKeys) {
            const scancode = this.getScancode(code);
            if (scancode !== undefined) {
                this.sendScancode(scancode, true);
            }
        }
        this.pressedKeys.clear();
    }

    /**
     * 注册键盘事件监听
     */
    attach(element) {
        element.addEventListener('keydown', this.handleKeyDown);
        element.addEventListener('keyup', this.handleKeyUp);
        element.addEventListener('compositionstart', this.handleCompositionStart);
        element.addEventListener('compositionupdate', this.handleCompositionUpdate);
        element.addEventListener('compositionend', this.handleCompositionEnd);
        
        // 确保元素可以接收键盘事件
        if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }
        
        // 自动聚焦
        element.focus();
    }

    /**
     * 移除键盘事件监听
     */
    detach(element) {
        element.removeEventListener('keydown', this.handleKeyDown);
        element.removeEventListener('keyup', this.handleKeyUp);
        element.removeEventListener('compositionstart', this.handleCompositionStart);
        element.removeEventListener('compositionupdate', this.handleCompositionUpdate);
        element.removeEventListener('compositionend', this.handleCompositionEnd);
        
        // 释放所有按键
        this.releaseAllKeys();
    }

    /**
     * 处理失去焦点
     */
    handleBlur() {
        // 窗口失去焦点时，释放所有按键
        this.releaseAllKeys();
    }

    /**
     * 获取当前状态信息（用于调试）
     */
    getState() {
        return {
            pressedKeys: Array.from(this.pressedKeys),
            modifierState: { ...this.modifierState },
            lockState: { ...this.lockState },
            composing: this.composing,
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyboardHandler;
}
if (typeof window !== 'undefined') {
    window.KeyboardHandler = KeyboardHandler;
}
