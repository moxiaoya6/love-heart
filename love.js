// 爱心动画程序 - JavaScript版本
// 配置参数
const CONFIG = {
    IMAGE_ENLARGE: 11,
    HEART_COLOR: "#C00000",
    TEXT_MESSAGE: "我喜欢你",
    TEXT_COLOR: "#0070C0",
    TEXT_SIZE: 40,
    MUSIC_FILE: "唯一.mp3",
    MUSIC_VOLUME: 0.7,
    LYRIC_COLOR: "#FFFFFF",
    LYRIC_SIZE: 30,
    LYRIC_Y_OFFSET: 250,
    LYRICS: [
        {time: 0.00, text: "作词 : 潘云安"},
        {time: 1.00, text: "作曲 : 潘云安"},
        {time: 2.00, text: "词曲 : 告五人/云安"},
        {time: 3.00, text: "改编词曲 : G.E.M.邓紫棋"},
        {time: 4.00, text: "制作人 : G.E.M.邓紫棋/T-Ma"},
        {time: 5.00, text: "To : 小蜜蜂"},
        {time: 13.64, text: "你真的懂唯一的定义"},
        {time: 20.78, text: "并不简单如呼吸"},
        {time: 26.83, text: "你真的希望你能厘清"},
        {time: 33.18, text: "若没交⼼怎么说明"},
        {time: 40.11, text: "我真的爱你 句句不轻易"},
        {time: 52.91, text: "眼神中飘移 总是在关键时刻清楚洞悉"},
        {time: 66.04, text: "你的不坚定 配合我颠沛流离"},
        {time: 79.27, text: "死去中清醒 明⽩你背着我聪明"},
        {time: 107.85, text: "那些我 想说的 没说的 话"},
        {time: 113.55, text: "有时我 怀疑呢 只是我 傻瓜"},
        {time: 120.00, text: "但如果真的爱 不会算计"},
        {time: 124.16, text: "爱是不嫉妒 不张狂 不求⾃⼰"},
        {time: 127.27, text: "无关你的回应 永不⽌息"},
        {time: 131.98, text: "你知道"},
        {time: 133.76, text: "我真的爱你 没⼈能比拟"},
        {time: 146.40, text: "眼神没肯定 总是在关键时刻清楚洞悉"},
        {time: 159.44, text: "你的不坚定 配合我颠沛流离"},
        {time: 172.89, text: "死去中清醒 明⽩你背着我聪明"},
        {time: 185.44, text: "我知道"},
        {time: 186.95, text: "爱本质无异 是因为⼈多得拥挤"},
        {time: 199.32, text: "你不想证明 证明我是你唯一"},
        {time: 212.45, text: "证明我是你唯一"},
        {time: 220.31, text: "程序制作：古德赖可"},
        {time: 221.85, text: "可视化：古德赖可"},
        {time: 223.27, text: "歌词校对：古德赖可"},
        {time: 224.74, text: "我喜欢你"},
    ]
};

// 全局变量
let canvas, ctx;
let CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_CENTER_X, CANVAS_CENTER_Y;
let heart;
let musicPlayer;
let startTime = 0;
let frameCount = 0;
let lastFrameTime = 0;
const TARGET_FPS = 30; // 降低帧率到30fps，减少闪烁
const FRAME_INTERVAL = 1000 / TARGET_FPS; // 每帧间隔（毫秒）

// 工具函数
function heartFunction(t, shrinkRatio = CONFIG.IMAGE_ENLARGE) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    
    const scaledX = x * shrinkRatio + CANVAS_CENTER_X;
    const scaledY = y * shrinkRatio + CANVAS_CENTER_Y;
    
    return [Math.floor(scaledX), Math.floor(scaledY)];
}

function scatterInside(x, y, beta = 0.15) {
    const ratioX = -beta * Math.log(Math.random());
    const ratioY = -beta * Math.log(Math.random());
    
    const dx = ratioX * (x - CANVAS_CENTER_X);
    const dy = ratioY * (y - CANVAS_CENTER_Y);
    
    return [x - dx, y - dy];
}

function shrink(x, y, ratio) {
    const force = -1 / Math.pow(Math.pow(x - CANVAS_CENTER_X, 2) + Math.pow(y - CANVAS_CENTER_Y, 2), 0.6);
    const dx = ratio * force * (x - CANVAS_CENTER_X);
    const dy = ratio * force * (y - CANVAS_CENTER_Y);
    return [x - dx, y - dy];
}

function curve(p) {
    // 降低跳动频率，从4改为2，让跳动更慢更平滑
    return 2 * (2 * Math.sin(2 * p)) / (2 * Math.PI);
}

function hasChinese(text) {
    for (let char of text) {
        if (char >= '\u4e00' && char <= '\u9fff') {
            return true;
        }
    }
    return false;
}

function getFont(text, size, style = "normal") {
    if (hasChinese(text)) {
        return `${style} ${size}px "Microsoft YaHei"`;
    } else {
        return `${style} ${size}px "Times New Roman"`;
    }
}

function blendColor(colorHex, alpha) {
    if (alpha >= 1) return colorHex;
    
    const color = colorHex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    const newR = Math.floor(r * alpha);
    const newG = Math.floor(g * alpha);
    const newB = Math.floor(b * alpha);
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// 音乐播放器类
class MusicPlayer {
    constructor(musicFile, volume) {
        this.musicFile = musicFile;
        this.volume = volume;
        this.audio = document.getElementById('audioPlayer');
        this.startTime = null;
        this.playing = false;
        
        if (musicFile) {
            this.audio.src = musicFile;
            this.audio.volume = volume;
        }
    }
    
    play() {
        if (this.musicFile && this.audio) {
            this.audio.play().then(() => {
                this.playing = true;
                this.startTime = Date.now() / 1000;
            }).catch(err => {
                console.log("播放音乐失败:", err);
            });
        }
    }
    
    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.playing = false;
        }
    }
    
    getElapsedTime() {
        // 优先使用audio的currentTime，更准确
        if (this.audio && !this.audio.paused) {
            return this.audio.currentTime;
        }
        // 如果音频未播放，使用开始时间计算
        if (this.startTime) {
            return (Date.now() / 1000) - this.startTime;
        }
        return 0;
    }
}

// 爱心类
class Heart {
    constructor(generateFrame = 20) {
        this._points = new Set();
        this._edgeDiffusionPoints = new Set();
        this._centerDiffusionPoints = new Set();
        this.allPoints = {};
        this.generateFrame = generateFrame;
        
        this.build(2000);
        
        for (let frame = 0; frame < generateFrame; frame++) {
            this.calc(frame);
        }
    }
    
    build(number) {
        // 生成爱心点
        for (let i = 0; i < number; i++) {
            const t = Math.random() * 2 * Math.PI;
            const [x, y] = heartFunction(t);
            this._points.add(`${x},${y}`);
        }
        
        // 边缘扩散
        const pointsArray = Array.from(this._points);
        for (let point of pointsArray) {
            const [x, y] = point.split(',').map(Number);
            for (let i = 0; i < 3; i++) {
                const [nx, ny] = scatterInside(x, y, 0.05);
                this._edgeDiffusionPoints.add(`${Math.floor(nx)},${Math.floor(ny)}`);
            }
        }
        
        // 中心扩散
        for (let i = 0; i < 4000; i++) {
            const randomPoint = pointsArray[Math.floor(Math.random() * pointsArray.length)];
            const [x, y] = randomPoint.split(',').map(Number);
            const [nx, ny] = scatterInside(x, y, 0.17);
            this._centerDiffusionPoints.add(`${Math.floor(nx)},${Math.floor(ny)}`);
        }
    }
    
    calcPosition(x, y, ratio) {
        const force = 1 / Math.pow(Math.pow(x - CANVAS_CENTER_X, 2) + Math.pow(y - CANVAS_CENTER_Y, 2), 0.520);
        const dx = ratio * force * (x - CANVAS_CENTER_X) + (Math.random() * 2 - 1);
        const dy = ratio * force * (y - CANVAS_CENTER_Y) + (Math.random() * 2 - 1);
        return [x - dx, y - dy];
    }
    
    calc(generateFrame) {
        const ratio = 10 * curve(generateFrame / 10 * Math.PI);
        const haloRadius = Math.floor(4 + 6 * (1 + curve(generateFrame / 10 * Math.PI)));
        const haloNumber = Math.floor(3000 + 4000 * Math.abs(Math.pow(curve(generateFrame / 10 * Math.PI), 2)));
        
        const allPoints = [];
        const heartHaloPoint = new Set();
        
        // 光环
        for (let i = 0; i < haloNumber; i++) {
            const t = Math.random() * 2 * Math.PI;
            let [x, y] = heartFunction(t, 11.6);
            [x, y] = shrink(x, y, haloRadius);
            const key = `${Math.floor(x)},${Math.floor(y)}`;
            
            if (!heartHaloPoint.has(key)) {
                heartHaloPoint.add(key);
                x += Math.floor(Math.random() * 29 - 14);
                y += Math.floor(Math.random() * 29 - 14);
                const size = [1, 2, 2][Math.floor(Math.random() * 3)];
                allPoints.push([x, y, size]);
            }
        }
        
        // 轮廓
        for (let point of this._points) {
            const [x, y] = point.split(',').map(Number);
            const [nx, ny] = this.calcPosition(x, y, ratio);
            const size = Math.floor(Math.random() * 3) + 1;
            allPoints.push([Math.floor(nx), Math.floor(ny), size]);
        }
        
        // 边缘扩散点
        for (let point of this._edgeDiffusionPoints) {
            const [x, y] = point.split(',').map(Number);
            const [nx, ny] = this.calcPosition(x, y, ratio);
            const size = Math.floor(Math.random() * 2) + 1;
            allPoints.push([Math.floor(nx), Math.floor(ny), size]);
        }
        
        // 中心扩散点
        for (let point of this._centerDiffusionPoints) {
            const [x, y] = point.split(',').map(Number);
            const [nx, ny] = this.calcPosition(x, y, ratio);
            const size = Math.floor(Math.random() * 2) + 1;
            allPoints.push([Math.floor(nx), Math.floor(ny), size]);
        }
        
        this.allPoints[generateFrame] = allPoints;
    }
    
    render(renderFrame) {
        const frame = renderFrame % this.generateFrame;
        const points = this.allPoints[frame] || [];
        
        ctx.fillStyle = CONFIG.HEART_COLOR;
        for (let [x, y, size] of points) {
            ctx.fillRect(x, y, size, size);
        }
    }
}

// 绘制函数
function draw(animationTime) {
    // 限制帧率，减少闪烁
    if (animationTime - lastFrameTime < FRAME_INTERVAL) {
        requestAnimationFrame(draw);
        return;
    }
    lastFrameTime = animationTime;
    
    // 清空画布
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 渲染爱心（使用更慢的帧计数，让跳动更平滑）
    heart.render(Math.floor(frameCount / 2)); // 除以2进一步降低跳动速度
    
    // 显示提示词（降低跳动幅度）
    const textRatio = curve(frameCount / 20 * Math.PI) * 0.05; // 从10改为20，从0.1改为0.05
    const textY = CANVAS_CENTER_Y - 200 + textRatio * 20;
    const textX = CANVAS_CENTER_X;
    
    const textFont = getFont(CONFIG.TEXT_MESSAGE, CONFIG.TEXT_SIZE, "bold");
    
    // 阴影
    ctx.fillStyle = "#000000";
    ctx.font = textFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(CONFIG.TEXT_MESSAGE, textX + 2, textY + 2);
    
    // 主文字
    ctx.fillStyle = CONFIG.TEXT_COLOR;
    ctx.fillText(CONFIG.TEXT_MESSAGE, textX, textY);
    
    // 显示歌词
    if (CONFIG.LYRICS && CONFIG.LYRICS.length > 0) {
        // 优先使用音频的实际播放时间
        let currentTime = 0;
        if (musicPlayer && musicPlayer.audio) {
            if (!musicPlayer.audio.paused && musicPlayer.audio.currentTime > 0) {
                currentTime = musicPlayer.audio.currentTime;
            } else if (musicPlayer.startTime) {
                currentTime = musicPlayer.getElapsedTime();
            } else {
                // 如果音乐未开始，使用页面加载后的时间
                currentTime = (Date.now() / 1000) - (startTime || Date.now() / 1000);
            }
        } else {
            // 备用方案：使用帧数计算（30fps）
            currentTime = frameCount / TARGET_FPS;
        }
        
        let currentLyric = null;
        let fadeProgress = 0;
        
        for (let i = 0; i < CONFIG.LYRICS.length; i++) {
            const lyric = CONFIG.LYRICS[i];
            if (currentTime >= lyric.time) {
                currentLyric = lyric;
                if (i + 1 < CONFIG.LYRICS.length) {
                    const nextLyric = CONFIG.LYRICS[i + 1];
                    if (nextLyric && currentTime >= nextLyric.time - 0.5) {
                        fadeProgress = (nextLyric.time - currentTime) / 0.5;
                    } else {
                        fadeProgress = 1.0;
                    }
                } else {
                    fadeProgress = 1.0;
                }
            } else {
                break;
            }
        }
        
        if (currentLyric === null && CONFIG.LYRICS.length > 0) {
            currentLyric = CONFIG.LYRICS[0];
            fadeProgress = 1.0;
        }
        
        if (currentLyric) {
            const lyricY = CANVAS_CENTER_Y + CONFIG.LYRIC_Y_OFFSET;
            const lyricX = CANVAS_CENTER_X;
            const alpha = Math.max(0, Math.min(1, fadeProgress));
            const lyricColor = blendColor(CONFIG.LYRIC_COLOR, alpha);
            const lyricFont = getFont(currentLyric.text, CONFIG.LYRIC_SIZE, "normal");
            
            // 歌词阴影
            ctx.fillStyle = "#000000";
            ctx.font = lyricFont;
            ctx.fillText(currentLyric.text, lyricX + 2, lyricY + 2);
            
            // 歌词主文字
            ctx.fillStyle = lyricColor;
            ctx.fillText(currentLyric.text, lyricX, lyricY);
        }
    }
    
    frameCount++;
    requestAnimationFrame(draw);
}

// 初始化
function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    // 设置画布大小
    CANVAS_WIDTH = window.innerWidth;
    CANVAS_HEIGHT = window.innerHeight;
    CANVAS_CENTER_X = CANVAS_WIDTH / 2;
    CANVAS_CENTER_Y = CANVAS_HEIGHT / 2;
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // 创建爱心对象
    heart = new Heart(20);
    
    // 初始化音乐播放器（不自动播放，等待用户点击）
    musicPlayer = new MusicPlayer(CONFIG.MUSIC_FILE, CONFIG.MUSIC_VOLUME);
    // 注意：由于浏览器自动播放策略，音乐不会自动播放
    // 需要用户点击"开始"按钮后才能播放
    
    // 将musicPlayer暴露到全局，方便index.html访问
    window.musicPlayer = musicPlayer;
    
    // 记录开始时间
    startTime = Date.now() / 1000;
    lastFrameTime = performance.now();
    
    // 开始动画
    draw(performance.now());
    
    // 窗口大小改变时重新调整
    window.addEventListener('resize', () => {
        CANVAS_WIDTH = window.innerWidth;
        CANVAS_HEIGHT = window.innerHeight;
        CANVAS_CENTER_X = CANVAS_WIDTH / 2;
        CANVAS_CENTER_Y = CANVAS_HEIGHT / 2;
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        heart = new Heart(20);
    });
}

// 页面加载完成后初始化
window.addEventListener('load', init);

