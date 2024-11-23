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
            const response = await fetch('/api/compile', {
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

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('服务器返回了非JSON格式的数据');
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
            resultContainer.innerHTML = `
                <div class="result error">
                    <div class="status">✗ 系统错误</div>
                    <div class="details">
                        <pre>${error.message}</pre>
                    </div>
                </div>`;
            console.error('API错误:', error);
        }
    });
}); 