const express = require('express');
const cors = require('cors');
const path = require('path');
const compileHandler = require('./api/index.js');

const app = express();
const port = process.env.PORT || 3000;

// 启用 CORS
app.use(cors({
    origin: '*',
    methods: ['POST', 'GET', 'OPTIONS']
}));

// 解析 JSON 请求体
app.use(express.json({
    limit: '1mb',  // 增加请求体大小限制
    type: ['application/json', 'text/plain']  // 支持更多内容类型
}));

// 提供静态文件服务
app.use(express.static('public'));

// 处理编译请求
app.post('/api/compile', (req, res) => {
    // 直接在路由中处理请求，不使用 async/await
    compileHandler({
        method: 'POST',
        body: req.body,
        headers: req.headers
    }, {
        status: (code) => ({
            json: (data) => res.status(code).json(data)
        }),
        json: (data) => res.json(data)
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    // 确保返回 JSON 格式的错误信息
    res.status(500).json({
        success: false,
        error: err.message || '服务器内部错误'
    });
});

// 添加健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 添加调试端点
app.get('/debug', (req, res) => {
    res.json({
        env: process.env.NODE_ENV,
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
    });
});

// 启动服务器
const server = app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});

// 添加错误处理
server.on('error', (error) => {
    console.error('Server Error:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
}); 