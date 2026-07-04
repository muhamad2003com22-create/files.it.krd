document.addEventListener('DOMContentLoaded', () => {
    // ConvertAPI Secret (User provided)
    const API_KEY = "LQwbFtqRcdXBqCUhx9EjHThLpjQkITnN";

    // Theme Logic
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'dark';
    root.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = root.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    
    const fileListContainer = document.getElementById('file-list-container');
    const fileListEl = document.getElementById('file-list');
    const fileCountEl = document.getElementById('file-count');
    const clearAllBtn = document.getElementById('clear-all-files');
    const conversionSettings = document.getElementById('conversion-settings');
    
    const outputFormat = document.getElementById('output-format');
    const qualitySlider = document.getElementById('quality');
    const qualityVal = document.getElementById('quality-val');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    
    const convertBtn = document.getElementById('convert-btn');
    
    const statusContainer = document.getElementById('status-container');
    const statusText = document.getElementById('status-text');
    const progressText = document.getElementById('progress-text');
    
    const resultContainer = document.getElementById('result-container');
    const downloadList = document.getElementById('download-list');
    const convertAnotherBtn = document.getElementById('convert-another');
    
    const errorContainer = document.getElementById('error-container');
    const errorText = document.getElementById('error-text');
    const retryBtn = document.getElementById('retry-btn');
    
    const historySection = document.getElementById('history-section');
    const historyListEl = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');

    let currentFiles = [];
    let history = JSON.parse(localStorage.getItem('conversion_history') || '[]');

    renderHistory();

    qualitySlider.addEventListener('input', (e) => {
        qualityVal.textContent = e.target.value;
    });

    // Drag & Drop Events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        handleFiles(Array.from(e.dataTransfer.files));
    });

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', function() { handleFiles(Array.from(this.files)); });

    function handleFiles(files) {
        if (files.length === 0) return;
        currentFiles = [...currentFiles, ...files];
        renderFileList();
    }

    function renderFileList() {
        if (currentFiles.length === 0) {
            fileListContainer.classList.add('hidden');
            conversionSettings.classList.add('hidden');
            dropZone.classList.remove('hidden');
            return;
        }

        fileCountEl.textContent = currentFiles.length;
        fileListEl.innerHTML = '';
        
        currentFiles.forEach((file, index) => {
            const el = document.createElement('div');
            el.className = 'file-item';
            el.innerHTML = `
                <div class="file-details">
                    <svg class="file-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <div>
                        <p class="file-name">${file.name}</p>
                        <p class="file-size">${formatBytes(file.size)}</p>
                    </div>
                </div>
                <button class="icon-btn remove-file" data-index="${index}" title="سڕینەوە">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            `;
            fileListEl.appendChild(el);
        });

        // Auto format suggest
        const firstFileExt = currentFiles[0].name.split('.').pop().toLowerCase();
        if (firstFileExt === 'png') outputFormat.value = 'jpg';
        else if (firstFileExt === 'jpg' || firstFileExt === 'jpeg') outputFormat.value = 'png';
        else if (firstFileExt === 'mp4') outputFormat.value = 'mp3';

        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                currentFiles.splice(idx, 1);
                renderFileList();
            });
        });

        dropZone.classList.add('hidden');
        fileListContainer.classList.remove('hidden');
        conversionSettings.classList.remove('hidden');
    }

    clearAllBtn.addEventListener('click', resetUI);
    convertAnotherBtn.addEventListener('click', resetUI);
    retryBtn.addEventListener('click', resetUI);

    function resetUI() {
        currentFiles = [];
        fileInput.value = '';
        dropZone.classList.remove('hidden');
        fileListContainer.classList.add('hidden');
        conversionSettings.classList.add('hidden');
        statusContainer.classList.add('hidden');
        resultContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        downloadList.innerHTML = '';
        renderHistory();
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    convertBtn.addEventListener('click', async () => {
        if (currentFiles.length === 0) return;

        const targetFormat = outputFormat.value;
        const quality = parseInt(qualitySlider.value);
        const w = widthInput.value;
        const h = heightInput.value;

        conversionSettings.classList.add('hidden');
        fileListContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        statusContainer.classList.remove('hidden');

        try {
            let completedFiles = [];
            
            for (let i = 0; i < currentFiles.length; i++) {
                const file = currentFiles[i];
                progressText.textContent = `فایلی ${i + 1} لە ${currentFiles.length} (${file.name})`;
                statusText.textContent = 'خەریکی دروستکردنی کارەکەیە...';

                const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                const fromFormat = file.name.split('.').pop().toLowerCase();
                const resultUrl = await convertWithConvertAPI(file, targetFormat, fromFormat);
                const newName = `${originalName}.${targetFormat}`;
                
                completedFiles.push({ name: newName, url: resultUrl });
                saveToHistory(newName, resultUrl, targetFormat);
            }

            showSuccess(completedFiles);
        } catch (error) {
            statusContainer.classList.add('hidden');
            errorContainer.classList.remove('hidden');
            errorText.textContent = error.message || 'هەڵەیەک ڕوویدا لە کاتی گۆڕینەکەدا.';
        }
    });

    async function convertWithConvertAPI(file, targetFormat, fromFormat) {
        statusText.textContent = 'خەریکی ناردنی فایلەکەیە بۆ ConvertAPI...';
        
        const apiUrl = `https://v2.convertapi.com/convert/${fromFormat}/to/${targetFormat}?Secret=${API_KEY}`;
        const formData = new FormData();
        formData.append('File', file);

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error('هەڵەیەک هەیە لە ConvertAPI، لەوانەیە باڵانسەکەت تەواو بووبێت یان فۆرماتەکە پشتگیری نەکرێت.');
        }

        const data = await response.json();
        
        if (data.Files && data.Files.length > 0) {
            return data.Files[0].Url;
        } else {
            throw new Error('هیچ فایلێک نەگەڕایەوە.');
        }
    }

    function showSuccess(completedFiles) {
        statusContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        
        downloadList.innerHTML = '';
        completedFiles.forEach(file => {
            const el = document.createElement('div');
            el.className = 'download-item';
            el.innerHTML = `
                <span class="file-name">${file.name}</span>
                <a href="${file.url}" class="btn-small" download="${file.name}" target="_blank">داگرتن</a>
            `;
            downloadList.appendChild(el);
        });
        
        renderHistory();
    }

    function saveToHistory(name, url, format) {
        const item = {
            name, url, format,
            date: new Date().toLocaleString('ku-IQ')
        };
        history.unshift(item);
        if(history.length > 20) history.pop(); // keep last 20
        localStorage.setItem('conversion_history', JSON.stringify(history));
    }

    function renderHistory() {
        if (history.length === 0) {
            historySection.classList.add('hidden');
            return;
        }
        historySection.classList.remove('hidden');
        historyListEl.innerHTML = '';
        
        history.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-info">
                    <span class="file-name">${item.name}</span>
                    <span class="history-date">${item.date}</span>
                </div>
                <a href="${item.url}" class="text-btn" target="_blank" download="${item.name}">داگرتنەوە</a>
            `;
            historyListEl.appendChild(el);
        });
    }

    clearHistoryBtn.addEventListener('click', () => {
        history = [];
        localStorage.removeItem('conversion_history');
        renderHistory();
    });
});
