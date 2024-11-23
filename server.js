const express = require('express');
const cors = require('cors');
const path = require('path');
const { compileAndRun } = require('./api/index.js');

const app = express();
const port = process.env.PORT || 3000;

// 启用 CORS
app.use(cors({
    origin: '*',
    methods: ['POST', 'GET', 'OPTIONS']
}));

// 解析 JSON 请求体
app.use(express.json({
    limit: '1mb'
}));

// 提供静态文件服务
app.use(express.static('public'));

// 确保响应总是JSON格式
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});

// 处理编译请求
app.post('/api/compile', async (req, res) => {
    try {
        const { code, input, expectedOutput } = req.body;
        
        if (!code) {
            return res.json({
                success: false,
                error: '代码不能为空'
            });
        }

        const output = await compileAndRun(code, input || '');
        const isCorrect = output === expectedOutput.trim();

        return res.json({
            success: true,
            output: output,
            isCorrect: isCorrect,
            message: isCorrect ? '测试通过！' : '输出结果与预期不符'
        });
    } catch (error) {
        console.error('编译运行错误:', error);
        return res.json({
            success: false,
            error: error.message || '未知错误'
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    return res.json({
        success: false,
        error: err.message || '服务器内部错误'
    });
});

// 添加测试端点
app.get('/test', (req, res) => {
    res.json({ status: 'ok', message: '服务器正常运行' });
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 