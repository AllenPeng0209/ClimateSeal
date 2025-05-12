document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('dataRequestForm');
    const uploadButton = document.getElementById('uploadButton');
    const fileInput = document.getElementById('fileInput');
    const fileListDiv = document.getElementById('fileList');
    const emissionValueInput = document.getElementById('emissionValue');
    const formArea = document.querySelector('.form-area');

    let uploadedFiles = [];
    const MAX_FILES = 5;

    // Trigger file input when '点击上传' is clicked
    if (uploadButton) {
        uploadButton.addEventListener('click', function () {
            fileInput.click();
        });
    }

    // Handle file selection
    if (fileInput) {
        fileInput.addEventListener('change', function (event) {
            const files = event.target.files;
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    if (uploadedFiles.length < MAX_FILES) {
                        uploadedFiles.push(files[i]);
                    } else {
                        alert(`最多只能上传 ${MAX_FILES} 个文件。`);
                        break;
                    }
                }
                renderFileList();
            }
            // Reset file input to allow selecting the same file again if removed
            fileInput.value = ''; 
        });
    }

    function renderFileList() {
        if (!fileListDiv) return;
        fileListDiv.innerHTML = '';
        uploadedFiles.forEach((file, index) => {
            const fileEntry = document.createElement('div');
            fileEntry.textContent = `${file.name}`;
            const removeButton = document.createElement('button');
            removeButton.textContent = '删除';
            removeButton.style.marginLeft = '10px';
            removeButton.style.padding = '2px 5px';
            removeButton.style.fontSize = '0.8em';
            removeButton.style.cursor = 'pointer';
            removeButton.onclick = function() {
                uploadedFiles.splice(index, 1);
                renderFileList();
            };
            fileEntry.appendChild(removeButton);
            fileListDiv.appendChild(fileEntry);
        });
    }
    
    // Emission value formatting (allow negative, 10 decimal places)
    if (emissionValueInput) {
        emissionValueInput.addEventListener('input', function(e) {
            let value = e.target.value;
            // Allow negative sign at the beginning
            value = value.replace(/[^-0-9.]/g, ''); 
            // Ensure only one decimal point
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            // Limit decimal places
            if (parts[1] && parts[1].length > 10) {
                value = parseFloat(value).toFixed(10);
            }
            e.target.value = value;
        });
    }

    // Handle form submission
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent default form submission

            // Validation
            const emissionValue = document.getElementById('emissionValue').value.trim();
            const emissionUnit = document.getElementById('emissionUnit').value.trim();

            let isValid = true;
            let errorMessages = [];

            if (emissionValue === "") {
                isValid = false;
                errorMessages.push("排放数值不能为空。");
            }
            // Check if emissionValue is a valid number (including negative)
            if (emissionValue !== "" && isNaN(parseFloat(emissionValue))) {
                isValid = false;
                errorMessages.push("排放数值必须是一个有效的数字。");
            }

            if (emissionUnit === "") {
                isValid = false;
                errorMessages.push("排放源单位不能为空。");
            }

            if (uploadedFiles.length === 0) {
                isValid = false;
                errorMessages.push("请至少上传一个证明材料文件。");
            }

            if (!isValid) {
                alert("提交失败，请检查以下错误：\n" + errorMessages.join("\n"));
                return;
            }

            // Confirmation dialog
            const isConfirmed = confirm("确认提交数据吗？");

            if (isConfirmed) {
                // Simulate submission success
                if(formArea){
                    formArea.innerHTML = `
                        <div style="text-align: center; padding: 50px; color: var(--text-primary);">
                            <h2>感谢您的提交！</h2>
                            <p>您的数据已成功提交。</p>
                            <p><a href="." style="color: var(--accent-color);">返回填报页面</a></p> 
                        </div>
                    `;
                }
                console.log("Form submitted:", {
                    emissionSourceName: document.getElementById('emissionSourceName').value,
                    remarks: document.getElementById('remarks').value,
                    deadline: document.getElementById('deadline').value,
                    emissionValue: emissionValue,
                    emissionUnit: emissionUnit,
                    uploadedFiles: uploadedFiles.map(f => f.name)
                });
            } else {
                console.log("Submission cancelled by user.");
            }
        });
    }

    // --- Chat Component Logic ---
    const chatMessagesContainer = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendChatButton = document.getElementById('sendChatButton');

    function addChatMessage(message, sender, isHTML = false) {
        if (!chatMessagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender); // sender is 'user' or 'assistant'
        
        if (isHTML) {
            messageElement.innerHTML = message; // Use innerHTML if message contains HTML
        } else {
            messageElement.textContent = message; // Use textContent for plain text to prevent XSS
        }
        
        chatMessagesContainer.appendChild(messageElement);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Auto-scroll to bottom
    }

    function sendUserMessage() {
        if (!chatInput) return;
        const messageText = chatInput.value.trim();
        if (messageText !== '') {
            addChatMessage(messageText, 'user');
            chatInput.value = ''; // Clear input
            
            // Simulate AI response after a short delay
            setTimeout(() => {
                const aiResponses = [
                    "感谢您的提问，我会尽力帮助您。",
                    "正在处理您的问题...",
                    "我明白了，关于这个问题，我可以提供以下信息... (模拟回复)",
                    "您好！我是碳助手，有什么可以帮您的吗？",
                    "对于碳足迹和数据填报方面的问题，我很乐意为您解答。"
                ];
                const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
                addChatMessage(randomResponse, 'assistant');
            }, 1000);
        }
    }

    if (sendChatButton) {
        sendChatButton.addEventListener('click', sendUserMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Prevent new line on Enter
                sendUserMessage();
            }
        });
    }

    // Initial AI Greeting Message
    const assistantGreeting = `
        您好！我是碳助手AI Chatbot。<br>
        我可以协助您解答关于碳足迹数据填报的疑问，提供相关指引，或帮助您理解某些特定指标的计算方法等。<br><br>
        如果您在填报过程中遇到任何问题，请随时在这里向我提问。
    `;
    addChatMessage(assistantGreeting, 'assistant', true);

}); 