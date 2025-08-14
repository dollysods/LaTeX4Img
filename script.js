class LaTeXOCR {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.initializeMathJax();
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
    }

    bindEvents() {
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.processBtn.addEventListener('click', this.processImage.bind(this));
        this.copyBtn.addEventListener('click', this.copyToClipboard.bind(this));
        this.newImageBtn.addEventListener('click', this.resetInterface.bind(this));
    }

    initializeMathJax() {
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']]
            },
            options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
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

        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreview.src = e.target.result;
            this.previewSection.style.display = 'block';
            this.resultSection.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    async processImage() {
        this.showProgress();
        
        try {
            const { data: { text } } = await Tesseract.recognize(
                this.imagePreview.src,
                'eng',
                {
                    logger: m => this.updateProgress(m)
                }
            );

            const latexCode = this.convertToLaTeX(text);
            this.displayResult(latexCode);
        } catch (error) {
            console.error('OCR Error:', error);
            this.showError('Failed to process image. Please try again.');
        }
    }

    convertToLaTeX(text) {
        let latex = text.trim();
        
        // Basic cleanup
        latex = latex.replace(/\s+/g, ' ');
        latex = latex.replace(/\n+/g, ' ');
        
        // Common mathematical symbol replacements
        const replacements = [
            [/\bsum\b/gi, '\\sum'],
            [/\bint\b/gi, '\\int'],
            [/\blim\b/gi, '\\lim'],
            [/\bsin\b/gi, '\\sin'],
            [/\bcos\b/gi, '\\cos'],
            [/\btan\b/gi, '\\tan'],
            [/\bln\b/gi, '\\ln'],
            [/\blog\b/gi, '\\log'],
            [/\bsqrt\b/gi, '\\sqrt'],
            [/\balpha\b/gi, '\\alpha'],
            [/\bbeta\b/gi, '\\beta'],
            [/\bgamma\b/gi, '\\gamma'],
            [/\bdelta\b/gi, '\\delta'],
            [/\bepsilon\b/gi, '\\epsilon'],
            [/\btheta\b/gi, '\\theta'],
            [/\blambda\b/gi, '\\lambda'],
            [/\bmu\b/gi, '\\mu'],
            [/\bpi\b/gi, '\\pi'],
            [/\bsigma\b/gi, '\\sigma'],
            [/\bphi\b/gi, '\\phi'],
            [/\bomega\b/gi, '\\omega'],
            [/≤/g, '\\leq'],
            [/≥/g, '\\geq'],
            [/≠/g, '\\neq'],
            [/±/g, '\\pm'],
            [/∞/g, '\\infty'],
            [/∈/g, '\\in'],
            [/∑/g, '\\sum'],
            [/∫/g, '\\int'],
            [/√/g, '\\sqrt'],
            [/×/g, '\\times'],
            [/÷/g, '\\div'],
            // Fractions (simple pattern)
            [/(\w+)\s*\/\s*(\w+)/g, '\\frac{$1}{$2}'],
            // Superscripts (basic pattern)
            [/\^(\w+)/g, '^{$1}'],
            // Subscripts (basic pattern)
            [/_(\w+)/g, '_{$1}'],
        ];

        replacements.forEach(([pattern, replacement]) => {
            latex = latex.replace(pattern, replacement);
        });

        // If it looks like an equation, wrap in display math
        if (latex.includes('=') || latex.includes('\\') || latex.includes('^') || latex.includes('_')) {
            latex = latex.startsWith('$') ? latex : `$$${latex}$$`;
        }

        return latex;
    }

    updateProgress(m) {
        const progress = m.progress * 100;
        this.progressFill.style.width = `${progress}%`;
        this.progressText.textContent = `${m.status}: ${Math.round(progress)}%`;
    }

    showProgress() {
        this.previewSection.style.display = 'none';
        this.progressSection.style.display = 'block';
        this.resultSection.style.display = 'none';
    }

    displayResult(latex) {
        this.progressSection.style.display = 'none';
        this.resultSection.style.display = 'block';
        
        this.latexOutput.value = latex;
        this.mathPreview.textContent = latex;
        
        // Re-render MathJax
        if (window.MathJax) {
            MathJax.typesetPromise([this.mathPreview]).catch((err) => {
                console.log('MathJax rendering error:', err);
                this.mathPreview.innerHTML = `<p>Preview unavailable. LaTeX code: <code>${latex}</code></p>`;
            });
        }
    }

    showError(message) {
        this.progressSection.style.display = 'none';
        alert(message);
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.latexOutput.value);
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback for older browsers
            this.latexOutput.select();
            document.execCommand('copy');
        }
    }

    resetInterface() {
        this.previewSection.style.display = 'none';
        this.progressSection.style.display = 'none';
        this.resultSection.style.display = 'none';
        this.fileInput.value = '';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LaTeXOCR();
});