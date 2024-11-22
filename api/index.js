const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

module.exports = async (req, res) => {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: '只支持POST请求' });
    }

    const { code, input } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, error: '代码不能为空' });
    }

    try {
        // 使用系统临时目录
        const tmpDir = os.tmpdir();
        const filename = 'code_' + Date.now();
        const sourcePath = path.join(tmpDir, `${filename}.cpp`);
        const exePath = path.join(tmpDir, filename);
        const inputPath = path.join(tmpDir, `${filename}.txt`);

        // 写入文件
        await fs.writeFile(sourcePath, code);
        await fs.writeFile(inputPath, input || '');

        // 编译
        const compileResult = await new Promise((resolve, reject) => {
            exec(`g++ "${sourcePath}" -o "${exePath}"`, (error, stdout, stderr) => {
                if (error) reject(stderr);
                else resolve(stdout);
            });
        });

        // 运行
        const runResult = await new Promise((resolve, reject) => {
            exec(`"${exePath}" < "${inputPath}"`, {
                timeout: 5000,
                maxBuffer: 1024 * 1024
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

        // 清理文件
        await Promise.all([
            fs.unlink(sourcePath),
            fs.unlink(exePath),
            fs.unlink(inputPath)
        ]).catch(console.error);

        res.json({ success: true, output: runResult });
    } catch (error) {
        res.status(500).json({ success: false, error: error.toString() });
    }
}; 