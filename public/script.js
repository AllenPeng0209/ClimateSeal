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
    uploadButton.addEventListener('click', function () {
        fileInput.click();
    });

    // Handle file selection
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

    function renderFileList() {
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

    // Handle form submission
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
            formArea.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <h2>感谢您的提交！</h2>
                    <p>您的数据已成功提交。</p>
                    <p><a href=".">返回填报页面</a></p> 
                </div>
            `;
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
}); 