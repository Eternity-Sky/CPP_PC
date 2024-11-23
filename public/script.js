const API_URL = 'https://cppcp.glitch.me/api/compile';

document.addEventListener('DOMContentLoaded', () => {
    const codeEditor = document.getElementById('code-editor');
    const testInput = document.getElementById('test-input');
    const expectedOutput = document.getElementById('expected-output');
    const submitBtn = document.getElementById('submit-btn');
    const sampleBtn = document.getElementById('sample-btn');
    const resultContainer = document.getElementById('result-container');

    sampleBtn.addEventListener('click', () => {
        codeEditor.value = `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`;
        testInput.value = "1 2";
        expectedOutput.value = "3";
    });

    submitBtn.addEventListener('click', async () => {
        try {
            resultContainer.innerHTML = '<div class="loading">正在评测中...</div>';
            console.log('发送请求到:', API_URL);
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    code: codeEditor.value,
                    input: testInput.value,
                    expectedOutput: expectedOutput.value
                })
            });

            console.log('响应状态:', response.status);
            
            const contentType = response.headers.get('content-type');
            console.log('响应类型:', contentType);

            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('非JSON响应:', text);
                throw new Error(`服务器返回了非JSON格式的数据: ${text.substring(0, 100)}...`);
            }

            const data = await response.json();
            if (data.success) {
                const resultClass = data.isCorrect ? 'success' : 'wrong-answer';
                const resultHTML = `
                    <div class="result ${resultClass}">
                        <div class="status">${data.isCorrect ? '✓ 通过测试' : '✗ 答案错误'}</div>
                        <div class="details">
                            <div class="output-section">
                                <h4>程序输出：</h4>
                                <pre>${data.output}</pre>
                            </div>
                            ${!data.isCorrect ? `
                            <div class="expected-section">
                                <h4>期望输出：</h4>
                                <pre>${expectedOutput.value}</pre>
                            </div>` : ''}
                        </div>
                    </div>`;
                resultContainer.innerHTML = resultHTML;
            } else {
                resultContainer.innerHTML = `
                    <div class="result error">
                        <div class="status">✗ ${data.error.includes('编译错误') ? '编译错误' : '运行错误'}</div>
                        <div class="details">
                            <pre>${data.error}</pre>
                        </div>
                    </div>`;
            }
        } catch (error) {
            console.error('详细错误:', error);
            resultContainer.innerHTML = `
                <div class="result error">
                    <div class="status">✗ 系统错误</div>
                    <div class="details">
                        <pre>${error.message}</pre>
                    </div>
                </div>`;
        }
    });
}); 