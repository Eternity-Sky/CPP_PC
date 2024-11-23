const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// 创建临时文件的函数
async function createTempFile(content, extension) {
    const tempDir = path.join(__dirname, '../temp');
    const fileName = crypto.randomBytes(16).toString('hex') + extension;
    const filePath = path.join(tempDir, fileName);
    
    // 确保临时目录存在
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(filePath, content);
    return filePath;
}

// 清理临时文件
async function cleanupFiles(...files) {
    for (const file of files) {
        try {
            // 先检查文件是否存在
            const exists = await fs.access(file).then(() => true).catch(() => false);
            if (exists) {
                await fs.unlink(file);
            }
        } catch (error) {
            // 只在开发环境下输出错误信息
            if (process.env.NODE_ENV === 'development') {
                console.error('清理文件失败:', error);
            }
        }
    }
}

// 编译并运行C++代码
async function compileAndRun(code, input) {
    return new Promise(async (resolve, reject) => {
        const sourceFile = await createTempFile(code, '.cpp');
        const inputFile = await createTempFile(input, '.txt');
        const executableFile = sourceFile.replace('.cpp', '');

        // 编译代码
        exec(`g++ "${sourceFile}" -o "${executableFile}"`, async (error, stdout, stderr) => {
            if (error) {
                await cleanupFiles(sourceFile, inputFile);
                return reject(new Error(`编译错误: ${stderr}`));
            }

            // 运行程序
            exec(`"${executableFile}" < "${inputFile}"`, 
                { timeout: 5000 }, // 5秒超时
                async (error, stdout, stderr) => {
                    await cleanupFiles(sourceFile, inputFile, executableFile);

                    if (error) {
                        if (error.killed) {
                            return reject(new Error('程序执行超时'));
                        }
                        return reject(new Error(`运行错误: ${stderr}`));
                    }

                    resolve(stdout.trim());
                }
            );
        });
    });
}

// API 路由处理
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: '只支持 POST 请求' });
    }

    try {
        const { code, input, expectedOutput } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: '代码不能为空' });
        }

        const output = await compileAndRun(code, input || '');
        const isCorrect = output === expectedOutput.trim();

        res.json({
            success: true,
            output: output,
            isCorrect: isCorrect,
            message: isCorrect ? '测试通过！' : '输出结果与预期不符'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}; 