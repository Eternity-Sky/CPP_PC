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
            const response = await fetch('/.netlify/functions/compile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: codeEditor.value,
                    input: testInput.value,
                    expectedOutput: expectedOutput.value
                })
            });
            const data = await response.json();
            if (data.success) {
                resultContainer.innerHTML = `<pre>${data.output}</pre>`;
            } else {
                resultContainer.innerHTML = `<p style="color: red;">错误：${data.error}</p>`;
            }
        } catch (error) {
            resultContainer.innerHTML = `<p style="color: red;">评测出错：${error.message}</p>`;
        }
    });
}); 