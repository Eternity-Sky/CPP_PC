const { exec } = require('child_process');
const crypto = require('crypto');

// 使用内存中的临时变量存储代码和输入
const tempStorage = new Map();

// 生成唯一ID
function generateId() {
    return crypto.randomBytes(16).toString('hex');
}

// 编译并运行C++代码
async function compileAndRun(code, input) {
    return new Promise((resolve, reject) => {
        const id = generateId();
        tempStorage.set(`${id}_code`, code);
        tempStorage.set(`${id}_input`, input);

        // 使用 echo 命令直接输入代码到编译器
        const compileCmd = `echo "${code}" | g++ -x c++ -o /tmp/${id} -`;
        
        exec(compileCmd, (error, stdout, stderr) => {
            if (error) {
                // 清理存储
                tempStorage.delete(`${id}_code`);
                tempStorage.delete(`${id}_input`);
                return reject(new Error(`编译错误: ${stderr}`));
            }

            // 使用 echo 命令输入测试数据
            const runCmd = `echo "${input}" | /tmp/${id}`;
            exec(runCmd, { timeout: 5000 }, (error, stdout, stderr) => {
                // 清理临时文件和存储
                exec(`rm -f /tmp/${id}`);
                tempStorage.delete(`${id}_code`);
                tempStorage.delete(`${id}_input`);

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