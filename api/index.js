const { exec } = require('child_process');
const crypto = require('crypto');
const os = require('os');
const path = require('path');

// 编译并运行C++代码
async function compileAndRun(code, input) {
    return new Promise((resolve, reject) => {
        const id = crypto.randomBytes(16).toString('hex');
        const tmpDir = os.tmpdir();
        const sourcePath = path.join(tmpDir, `${id}.cpp`);
        const execPath = path.join(tmpDir, id);
        
        // 使用 echo 命令直接输入代码到编译器
        const compileCmd = process.platform === 'win32' 
            ? `g++ "${sourcePath}" -o "${execPath}.exe"`
            : `g++ "${sourcePath}" -o "${execPath}"`;
        
        // 写入源代码文件
        require('fs').writeFileSync(sourcePath, code);
        
        exec(compileCmd, (error, stdout, stderr) => {
            if (error) {
                // 清理文件
                cleanupFiles(sourcePath);
                return reject(new Error(`编译错误: ${stderr}`));
            }

            // 运行程序
            const runCmd = process.platform === 'win32'
                ? `echo ${input} | "${execPath}.exe"`
                : `echo "${input}" | "${execPath}"`;

            exec(runCmd, { timeout: 5000 }, (error, stdout, stderr) => {
                // 清理文件
                cleanupFiles(sourcePath, process.platform === 'win32' ? `${execPath}.exe` : execPath);

                if (error) {
                    if (error.killed) {
                        return reject(new Error('程序执行超时'));
                    }
                    return reject(new Error(`运行错误: ${stderr}`));
                }

                resolve(stdout.trim());
            });
        });
    });
}

// 清理文件
function cleanupFiles(...files) {
    files.forEach(file => {
        try {
            require('fs').unlinkSync(file);
        } catch (error) {
            console.error('清理文件失败:', error);
        }
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