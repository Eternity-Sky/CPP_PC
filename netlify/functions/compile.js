const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

exports.handler = async function(event, context) {
    // 只接受 POST 请求
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: '方法不允许' }) };
    }

    try {
        const { code, input } = JSON.parse(event.body);
        
        if (!code) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: '代码不能为空' })
            };
        }

        // 使用系统临时目录
        const tmpDir = os.tmpdir();
        const filename = 'code_' + Date.now();
        const sourcePath = path.join(tmpDir, `${filename}.cpp`);
        const exePath = path.join(tmpDir, filename + (process.platform === 'win32' ? '.exe' : ''));
        const inputPath = path.join(tmpDir, `${filename}.txt`);

        // 写入代码和输入文件
        await fs.writeFile(sourcePath, code);
        await fs.writeFile(inputPath, input || '');

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

        // 清理临时文件
        await Promise.all([
            fs.unlink(sourcePath).catch(() => {}),
            fs.unlink(exePath).catch(() => {}),
            fs.unlink(inputPath).catch(() => {})
        ]);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ success: true, output: result })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ success: false, error: error.toString() })
        };
    }
}; 