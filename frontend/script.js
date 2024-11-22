document.getElementById('submit-btn').addEventListener('click', async () => {
    const code = document.getElementById('code-editor').value;
    const input = document.getElementById('test-input').value;
    
    try {
        const response = await fetch('https://your-api-url.vercel.app/api', {
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

// 其余代码保持不变... 