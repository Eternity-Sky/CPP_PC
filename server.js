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
app.use(express.json());

// 提供静态文件服务
app.use(express.static('public'));

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || '服务器内部错误'
    });
});

// 处理编译请求
app.post('/api/compile', async (req, res) => {
    try {
        await compileHandler(req, res);
    } catch (error) {
        console.error('Compile Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || '编译过程出错'
        });
    }
});

// 添加健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 