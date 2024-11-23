const { exec } = require('child_process');
const crypto = require('crypto');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;

// 编译并运行C++代码
async function compileAndRun(code, input) {
    return new Promise(async (resolve, reject) => {
        try {
            const id = crypto.randomBytes(16).toString('hex');
            const tmpDir = os.tmpdir();
            const sourcePath = path.join(tmpDir, `${id}.cpp`);
            const execPath = path.join(tmpDir, id);
            
            console.log('写入源代码到:', sourcePath);
            await fs.writeFile(sourcePath, code);
            
            const compileCmd = `g++ "${sourcePath}" -o "${execPath}"`;
            console.log('执行编译命令:', compileCmd);
            
            exec(compileCmd, async (error, stdout, stderr) => {
                if (error) {
                    console.error('编译错误:', stderr);
                    await cleanupFiles(sourcePath);
                    return reject(new Error(`编译错误: ${stderr}`));
                }

                const runCmd = `echo "${input}" | "${execPath}"`;
                console.log('执行运行命令:', runCmd);

                exec(runCmd, { timeout: 5000 }, async (error, stdout, stderr) => {
                    try {
                        await cleanupFiles(sourcePath, execPath);
                    } catch (e) {
                        console.error('清理文件失败:', e);
                    }

                    if (error) {
                        console.error('运行错误:', error);
                        if (error.killed) {
                            return reject(new Error('程序执行超时'));
                        }
                        return reject(new Error(`运行错误: ${stderr}`));
                    }

                    console.log('程序输出:', stdout);
                    resolve(stdout.trim());
                });
            });
        } catch (error) {
            console.error('处理过程出错:', error);
            reject(error);
        }
    });
}

// 清理文件
async function cleanupFiles(...files) {
    for (const file of files) {
        try {
            await fs.unlink(file);
            console.log('成功删除文件:', file);
        } catch (error) {
            console.error('删除文件失败:', file, error);
        }
    }
}

// API 路由处理
module.exports = async (req, res) => {
    console.log('收到编译请求:', req.body);
    
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: '只支持 POST 请求' });
    }

    try {
        const { code, input, expectedOutput } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: '代码不能为空' });
        }

        console.log('开始编译和运行代码');
        const output = await compileAndRun(code, input || '');
        const isCorrect = output === expectedOutput.trim();

        console.log('执行结果:', { output, isCorrect });
        
        res.json({
            success: true,
            output: output,
            isCorrect: isCorrect,
            message: isCorrect ? '测试通过！' : '输出结果与预期不符'
        });

    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({
            success: false,
            error: error.message || '未知错误'
        });
    }
}; 