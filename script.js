// 更新API地址为你的Vercel域名
const API_URL = 'https://你的域名.vercel.app/api';

document.getElementById('submit-btn').addEventListener('click', async () => {
    const code = document.getElementById('code-editor').value;
    const input = document.getElementById('test-input').value;
    
    try {
        const response = await fetch(API_URL, {
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
        html = `
            <div class="result-success">
                <h3>评测结果：成功</h3>
                <h4>输出结果：</h4>
                <pre>${result.output || '(无输出)'}</pre>
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
    
    document.getElementById('code-editor').value = sampleCode;
    document.getElementById('test-input').value = sampleInput;
}

// 在页面加载完成后添加事件监听器
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sample-btn').addEventListener('click', loadSampleCode);
}); 