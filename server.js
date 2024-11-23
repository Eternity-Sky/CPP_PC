const express = require('express');
const path = require('path');
const compileHandler = require('./api/index.js');

const app = express();
const port = process.env.PORT || 3000;

// 解析 JSON 请求体
app.use(express.json());

// 提供静态文件服务
app.use(express.static('public'));

// 处理编译请求
app.post('/api/compile', compileHandler);

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 