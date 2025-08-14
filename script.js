class LaTeXOCR {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.initializeMathJax();
        this.checkServerStatus();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewSection = document.getElementById('previewSection');
        this.processBtn = document.getElementById('processBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultSection = document.getElementById('resultSection');
        this.latexOutput = document.getElementById('latexOutput');
        this.copyBtn = document.getElementById('copyBtn');
        this.mathPreview = document.getElementById('mathPreview');
        this.newImageBtn = document.getElementById('newImageBtn');
        this.rawText = document.getElementById('rawText');
        this.rawTextSection = document.getElementById('rawTextSection');
        this.updatePreviewBtn = document.getElementById('updatePreviewBtn');
        this.pix2texUrl = document.getElementById('pix2texUrl');
        this.serverStatus = document.getElementById('serverStatus');
        this.testConnectionBtn = document.getElementById('testConnectionBtn');
        this.serverConfig = document.getElementById('serverConfig');
        this.setupSection = document.getElementById('setupSection');
    }

    bindEvents() {
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.processBtn.addEventListener('click', this.processImage.bind(this));
        this.copyBtn.addEventListener('click', this.copyToClipboard.bind(this));
        this.newImageBtn.addEventListener('click', this.resetInterface.bind(this));
        this.updatePreviewBtn.addEventListener('click', this.updatePreview.bind(this));
        this.testConnectionBtn.addEventListener('click', this.checkServerStatus.bind(this));
        
        // Allow editing of LaTeX output
        this.latexOutput.addEventListener('input', this.updatePreview.bind(this));
        
        // Auto-check server status when URL changes
        this.pix2texUrl.addEventListener('change', this.checkServerStatus.bind(this));
    }

    initializeMathJax() {
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']]
            },
            options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
            },
            startup: {
                ready: () => {
                    console.log('MathJax is ready!');
                    MathJax.startup.defaultReady();
                }
            }
        };
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        // Store the original file for API calls
        this.currentFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreview.src = e.target.result;
            this.previewSection.style.display = 'block';
            this.resultSection.style.display = 'none';
            this.checkServerStatus(); // Check server when image is loaded
        };
        reader.readAsDataURL(file);
    }

    async checkServerStatus() {
        const serverUrl = this.pix2texUrl.value.trim() || 'http://localhost:8502';
        
        try {
            this.serverStatus.innerHTML = '🔄 Checking pix2tex server...';
            this.processBtn.disabled = true;
            this.setupSection.style.display = 'none';
            
            console.log('Checking server at:', serverUrl);
            
            // Remove timeout option as fetch doesn't support it directly
            const response = await fetch(`${serverUrl}/`, {
                method: 'GET'
            });
            
            console.log('Response status:', response.status, 'OK:', response.ok);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Server response:', data);
                this.serverStatus.innerHTML = '✅ pix2tex server is ready!';
                this.processBtn.disabled = false;
                this.serverConfig.style.display = 'none';
            } else {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            this.serverStatus.innerHTML = '❌ pix2tex server not available';
            this.processBtn.disabled = true;
            this.serverConfig.style.display = 'block';
            this.setupSection.style.display = 'block';
            
            console.error('Server check failed:', error);
        }
    }

    async processImage() {
        if (!this.currentFile) {
            alert('Please upload an image first.');
            return;
        }

        const serverUrl = this.pix2texUrl.value.trim() || 'http://localhost:8502';
        
        this.showProgress();
        this.progressText.textContent = 'Processing image with pix2tex AI...';

        try {
            // Create FormData to send as multipart/form-data
            const formData = new FormData();
            formData.append('file', this.currentFile);
            
            const apiResponse = await fetch(`${serverUrl}/predict/`, {
                method: 'POST',
                body: formData
            });

            if (!apiResponse.ok) {
                throw new Error(`Server responded with ${apiResponse.status}: ${apiResponse.statusText}`);
            }

            const latex = await apiResponse.json();
            
            if (latex && typeof latex === 'string') {
                // Don't show raw text section since API only returns the LaTeX string
                this.displayResult(latex, null);
            } else {
                throw new Error('No LaTeX result from pix2tex server');
            }
        } catch (error) {
            console.error('pix2tex API Error:', error);
            let errorMsg = 'Failed to process image with pix2tex. ';
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMsg += `

Please make sure the pix2tex server is running:

1. Install: pip install "pix2tex[gui]"
2. Run: python -m pix2tex.api.run
3. Server should start at http://localhost:8502

Or use the setup_pix2tex.bat file for automatic setup!`;
            } else {
                errorMsg += `Error: ${error.message}`;
            }
            
            this.showError(errorMsg);
            this.setupSection.style.display = 'block';
            this.serverConfig.style.display = 'block';
        }
    }

    updateProgress(progress, status) {
        this.progressFill.style.width = `${progress}%`;
        this.progressText.textContent = `${status}: ${Math.round(progress)}%`;
    }

    showProgress() {
        this.previewSection.style.display = 'none';
        this.progressSection.style.display = 'block';
        this.resultSection.style.display = 'none';
        
        // Simulate progress for better UX
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            this.updateProgress(progress, 'Processing with pix2tex');
        }, 200);
        
        // Store interval to clear it later
        this.progressInterval = interval;
    }

    displayResult(latex, rawText) {
        // Clear progress interval
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        
        this.progressSection.style.display = 'none';
        this.resultSection.style.display = 'block';
        this.setupSection.style.display = 'none';
        
        this.latexOutput.value = latex;
        this.mathPreview.textContent = latex;
        
        // Show raw processing info if available
        if (rawText && rawText.trim() && rawText !== latex) {
            const rawTextElement = document.getElementById('rawText');
            if (rawTextElement) {
                rawTextElement.textContent = rawText;
                this.rawTextSection.style.display = 'block';
            }
        } else {
            // Hide raw text section if no meaningful raw text
            this.rawTextSection.style.display = 'none';
        }
        
        this.updatePreview();
    }

    updatePreview() {
        const latex = this.latexOutput.value;
        
        // Clear previous content and set new LaTeX
        this.mathPreview.innerHTML = `$$${latex}$$`;
        
        // Render with MathJax if available
        if (window.MathJax && MathJax.typesetPromise) {
            try {
                MathJax.typesetPromise([this.mathPreview]).catch((err) => {
                    console.log('MathJax rendering error:', err);
                    this.mathPreview.innerHTML = `<p>Preview unavailable. LaTeX code: <code>${latex}</code></p>`;
                });
            } catch (error) {
                console.log('MathJax error:', error);
                this.mathPreview.innerHTML = `<p>MathJax not ready. LaTeX code: <code>${latex}</code></p>`;
            }
        } else if (window.MathJax && MathJax.startup) {
            // Wait for MathJax to be ready
            window.setTimeout(() => {
                if (MathJax.typesetPromise) {
                    MathJax.typesetPromise([this.mathPreview]).catch((err) => {
                        console.log('MathJax rendering error:', err);
                    });
                }
            }, 100);
        } else {
            // Fallback if MathJax not loaded
            this.mathPreview.innerHTML = `<p>Loading MathJax... LaTeX code: <code>${latex}</code></p>`;
        }
    }

    showError(message) {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        
        this.progressSection.style.display = 'none';
        alert(message);
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.latexOutput.value);
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copied!';
            this.copyBtn.classList.add('success');
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
                this.copyBtn.classList.remove('success');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback for older browsers
            this.latexOutput.select();
            document.execCommand('copy');
            alert('LaTeX code copied to clipboard!');
        }
    }

    resetInterface() {
        this.previewSection.style.display = 'none';
        this.progressSection.style.display = 'none';
        this.resultSection.style.display = 'none';
        this.rawTextSection.style.display = 'none';
        this.serverConfig.style.display = 'none';
        this.setupSection.style.display = 'block';
        this.fileInput.value = '';
        this.currentFile = null;
        
        // Clear any progress intervals
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LaTeXOCR();
});