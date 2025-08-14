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
        this.rawText = document.getElementById('rawText');
        this.rawTextSection = document.getElementById('rawTextSection');
        this.updatePreviewBtn = document.getElementById('updatePreviewBtn');
        this.tryMathpixBtn = document.getElementById('tryMathpixBtn');
        this.mathpixSection = document.getElementById('mathpixSection');
        this.mathpixApiKey = document.getElementById('mathpixApiKey');
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
        this.tryMathpixBtn.addEventListener('click', this.toggleMathpixSection.bind(this));
        
        // Allow editing of LaTeX output
        this.latexOutput.addEventListener('input', this.updatePreview.bind(this));
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
            // Preprocess image for better OCR
            const processedImage = await this.preprocessImage(this.imagePreview.src);
            
            const { data: { text } } = await Tesseract.recognize(
                processedImage,
                'eng',
                {
                    logger: m => this.updateProgress(m),
                    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
                    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz()[]{}=+-*/^_.,?:; '
                }
            );

            const latexCode = this.convertToLaTeX(text);
            this.displayResult(latexCode, text);
        } catch (error) {
            console.error('OCR Error:', error);
            this.showError('Failed to process image. Please try again.');
        }
    }

    async preprocessImage(imageSrc) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw original image
                ctx.drawImage(img, 0, 0);
                
                // Get image data for processing
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Convert to grayscale and increase contrast
                for (let i = 0; i < data.length; i += 4) {
                    // Convert to grayscale
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    
                    // Increase contrast (threshold)
                    const threshold = 128;
                    const newValue = gray > threshold ? 255 : 0;
                    
                    data[i] = newValue;     // Red
                    data[i + 1] = newValue; // Green
                    data[i + 2] = newValue; // Blue
                    // Alpha stays the same
                }
                
                // Put processed image data back
                ctx.putImageData(imageData, 0, 0);
                
                // Scale up for better OCR
                const scaledCanvas = document.createElement('canvas');
                const scaledCtx = scaledCanvas.getContext('2d');
                scaledCanvas.width = canvas.width * 2;
                scaledCanvas.height = canvas.height * 2;
                
                scaledCtx.imageSmoothingEnabled = false;
                scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
                
                resolve(scaledCanvas.toDataURL());
            };
            
            img.src = imageSrc;
        });
    }

    convertToLaTeX(text) {
        let latex = text.trim();
        
        // First, preserve and normalize line breaks for structure
        latex = latex.replace(/\r\n/g, '\n');
        latex = latex.replace(/\r/g, '\n');
        
        // Common OCR mistakes and corrections
        const ocrCorrections = [
            // Number corrections
            [/1f/g, 'If'],
            [/0/g, 'O'], // Sometimes O is recognized as 0
            [/5/g, 'S'], // Sometimes S is recognized as 5
            [/1/g, 'I'], // Sometimes I is recognized as 1
            [/%/g, 'p'], // % often misread as p
            [/\bf/g, 'f'], // Bold formatting artifacts
            [/\bs/g, 's'], // Bold formatting artifacts
        ];
        
        // Apply OCR corrections first
        ocrCorrections.forEach(([pattern, replacement]) => {
            latex = latex.replace(pattern, replacement);
        });
        
        // Clean up whitespace but preserve structure
        latex = latex.replace(/\s+/g, ' ');
        
        // Enhanced mathematical symbol replacements
        const replacements = [
            // Functions
            [/\bsum\b/gi, '\\sum'],
            [/\bint\b/gi, '\\int'],
            [/\blim\b/gi, '\\lim'],
            [/\bsin\b/gi, '\\sin'],
            [/\bcos\b/gi, '\\cos'],
            [/\btan\b/gi, '\\tan'],
            [/\bln\b/gi, '\\ln'],
            [/\blog\b/gi, '\\log'],
            [/\bsqrt\b/gi, '\\sqrt'],
            
            // Greek letters
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
            
            // Mathematical operators
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
            
            // Fraction detection (improved)
            [/(\d+)\s*\/\s*(\d+)/g, '\\frac{$1}{$2}'],
            [/(\w+)\s*\/\s*(\w+)/g, '\\frac{$1}{$2}'],
            
            // Superscript/subscript patterns
            [/(\w+)\^(\d+)/g, '$1^{$2}'],
            [/(\w+)_(\w+)/g, '$1_{$2}'],
            
            // Multiple choice answers
            [/\(A\)/g, '(A)'],
            [/\(B\)/g, '(B)'],
            [/\(C\)/g, '(C)'],
            [/\(D\)/g, '(D)'],
            [/\(E\)/g, '(E)'],
        ];

        replacements.forEach(([pattern, replacement]) => {
            latex = latex.replace(pattern, replacement);
        });
        
        // Handle multi-line mathematical expressions
        if (latex.includes('\n') && (latex.includes('=') || latex.includes('\\frac'))) {
            // Split into lines and process each
            const lines = latex.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            latex = lines.join(' \\\\ ');
        }

        // Only wrap in math mode if it contains mathematical content
        const hasMath = latex.includes('=') || latex.includes('\\') || latex.includes('^') || latex.includes('_') || latex.includes('\\frac');
        
        if (hasMath && !latex.startsWith('$')) {
            // Use align environment for multi-line equations
            if (latex.includes('\\\\')) {
                latex = `\\begin{align}\n${latex}\n\\end{align}`;
            } else {
                latex = `$$${latex}$$`;
            }
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

    displayResult(latex, rawText) {
        this.progressSection.style.display = 'none';
        this.resultSection.style.display = 'block';
        
        this.latexOutput.value = latex;
        this.mathPreview.textContent = latex;
        
        // Show raw OCR text for debugging/manual correction
        if (rawText && rawText.trim()) {
            const rawTextElement = document.getElementById('rawText');
            if (rawTextElement) {
                rawTextElement.textContent = rawText;
                document.getElementById('rawTextSection').style.display = 'block';
            }
        }
        
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
        this.rawTextSection.style.display = 'none';
        this.mathpixSection.style.display = 'none';
        this.fileInput.value = '';
    }

    updatePreview() {
        const latex = this.latexOutput.value;
        this.mathPreview.textContent = latex;
        
        if (window.MathJax) {
            MathJax.typesetPromise([this.mathPreview]).catch((err) => {
                console.log('MathJax rendering error:', err);
                this.mathPreview.innerHTML = `<p>Preview unavailable. LaTeX code: <code>${latex}</code></p>`;
            });
        }
    }

    toggleMathpixSection() {
        const isVisible = this.mathpixSection.style.display !== 'none';
        this.mathpixSection.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            // If showing Mathpix section and API key is provided, try to process with Mathpix
            const apiKey = this.mathpixApiKey.value.trim();
            if (apiKey && this.imagePreview.src) {
                this.procesWithMathpix(apiKey);
            }
        }
    }

    async procesWithMathpix(apiKey) {
        if (!apiKey) {
            alert('Please enter your Mathpix API key first.');
            return;
        }

        this.showProgress();
        this.progressText.textContent = 'Processing with Mathpix API...';

        try {
            // Convert image to base64
            const base64Image = this.imagePreview.src.split(',')[1];
            
            const response = await fetch('https://api.mathpix.com/v3/text', {
                method: 'POST',
                headers: {
                    'app_id': 'trial', // Use trial for demonstration
                    'app_key': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    src: `data:image/jpeg;base64,${base64Image}`,
                    formats: ['text', 'latex_styled'],
                    data_options: {
                        include_asciimath: true,
                        include_latex: true
                    }
                })
            });

            const result = await response.json();
            
            if (result.latex_styled) {
                this.displayResult(result.latex_styled, result.text);
            } else if (result.text) {
                this.displayResult(this.convertToLaTeX(result.text), result.text);
            } else {
                throw new Error('No result from Mathpix API');
            }
        } catch (error) {
            console.error('Mathpix API Error:', error);
            this.showError('Mathpix API failed. Check your API key and try again, or use the free OCR option.');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LaTeXOCR();
});