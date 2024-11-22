const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// 启用CORS和JSON解析
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 编译和运行C++代码的函数
async function compileCpp(code, input) {
    let sourcePath = '';
    let exePath = '';
    let inputPath = '';
    
    try {
        // 创建临时文件夹
        const tmpDir = path.join(__dirname, 'temp');
        await fs.mkdir(tmpDir, { recursive: true });
        
        // 生成唯一的文件名
        const filename = 'code_' + Date.now();
        sourcePath = path.join(tmpDir, `${filename}.cpp`);
        exePath = path.join(tmpDir, `${filename}.exe`);  // Windows下需要.exe后缀
        inputPath = path.join(tmpDir, `${filename}.txt`);
        
        // 写入代码和输入文件
        await fs.writeFile(sourcePath, code);
        await fs.writeFile(inputPath, input);
        
        // 编译代码
        await new Promise((resolve, reject) => {
            exec(`g++ "${sourcePath}" -o "${exePath}"`, (error, stdout, stderr) => {
                if (error) reject(stderr);
                else resolve(stdout);
            });
        });
        
        // 运行程序
        const result = await new Promise((resolve, reject) => {
            exec(`"${exePath}" < "${inputPath}"`, {
                timeout: 5000, // 5秒超时
                maxBuffer: 1024 * 1024 // 1MB输出限制
            }, (error, stdout, stderr) => {
                if (error && error.killed) {
                    reject('执行超时');
                } else if (error) {
                    reject(stderr);
                } else {
                    resolve(stdout);
                }
            });
        });
        
        return { success: true, output: result };
    } catch (error) {
        return { success: false, error: error.toString() };
    } finally {
        // 清理临时文件
        try {
            if (sourcePath) await fs.unlink(sourcePath).catch(() => {});
            if (exePath) await fs.unlink(exePath).catch(() => {});
            if (inputPath) await fs.unlink(inputPath).catch(() => {});
        } catch (error) {
            console.error('清理临时文件失败:', error);
        }
    }
}

// API端点
app.post('/api/compile', async (req, res) => {
    const { code, input } = req.body;
    
    if (!code) {
        return res.status(400).json({ success: false, error: '代码不能为空' });
    }
    
    try {
        const result = await compileCpp(code, input || '');
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.toString() });
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}); 