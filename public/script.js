// 更新API地址为本地服务器地址
const API_URL = 'http://localhost:3000/api/compile';

// 其余代码保持不变... 

document.getElementById('submit-btn').addEventListener('click', async () => {
    const code = document.getElementById('code-editor').value;
    const input = document.getElementById('test-input').value;
    
    // 显示加载状态
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '评测中...';
    
    try {
        const response = await fetch('http://localhost:3000/api/compile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                input
            })
        });
        
        const result = await response.json();
        displayResult(result);
    } catch (error) {
        console.error('评测请求失败:', error);
        displayResult({ 
            success: false, 
            error: '评测服务暂时不可用: ' + error.message 
        });
    } finally {
        // 恢复按钮状态
        submitBtn.disabled = false;
        submitBtn.textContent = '提交评测';
    }
});

function displayResult(result) {
    const resultContainer = document.getElementById('result-container');
    let html = '';
    
    if (!result.success) {
        html = `
            <div class="result-error">
                <h3>评测结果：失败</h3>
                <p>错误信息：${result.error}</p>
            </div>
        `;
    } else {
        // 规范化输出和期望输出（去除所有空白字符后比较）
        const output = result.output.replace(/\s+/g, '');
        const expectedOutput = document.getElementById('expected-output').value.replace(/\s+/g, '');
        const isCorrect = output === expectedOutput;
        
        html = `
            <div class="result-${isCorrect ? 'success' : 'wrong'}">
                <h3>评测结果：${isCorrect ? '通过' : '答案错误'}</h3>
                <h4>程序输出：</h4>
                <pre>${result.output || '(无输出)'}</pre>
                ${!isCorrect && expectedOutput ? `
                    <h4>期望输出：</h4>
                    <pre>${document.getElementById('expected-output').value}</pre>
                ` : ''}
            </div>
        `;
    }
    
    resultContainer.innerHTML = html;
}

// 添加示例代码按钮的处理函数
function loadSampleCode() {
    const sampleCode = `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`;

    const sampleInput = `5 3`;
    const sampleOutput = `8`;
    
    document.getElementById('code-editor').value = sampleCode;
    document.getElementById('test-input').value = sampleInput;
    document.getElementById('expected-output').value = sampleOutput;
}

// 在页面加载完成后添加事件监听器
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sample-btn').addEventListener('click', loadSampleCode);
}); 