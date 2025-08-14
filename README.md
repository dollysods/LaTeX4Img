# LaTeX OCR - Image to LaTeX Converter

A free, client-side web application that converts images of mathematical equations into LaTeX code using OCR technology.

## Features

- **Free & Client-Side**: No API costs, all processing happens in your browser
- **Drag & Drop**: Easy image upload via drag and drop or file selection
- **Real-time Preview**: See both LaTeX code and rendered math preview
- **Copy to Clipboard**: One-click copying of generated LaTeX code
- **Mobile Friendly**: Responsive design works on all devices
- **No Server Required**: Pure client-side implementation using Tesseract.js

## How to Use

1. **Upload Image**: Drag and drop an image or click to select a file
2. **Process**: Click "Convert to LaTeX" to start OCR processing
3. **Review**: Check the generated LaTeX code and math preview
4. **Copy**: Use the copy button to copy LaTeX code to your clipboard

## Tips for Better Results

- Use high-contrast images with clear, dark text on light background
- Ensure the equation is well-lit and not blurry
- Crop the image to focus on the equation
- For handwritten equations, use clear, separated characters

## Technology Stack

- **OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/) for optical character recognition
- **Math Rendering**: [MathJax](https://www.mathjax.org/) for LaTeX preview
- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Hosting**: GitHub Pages compatible

## Development

This is a static website that can be served from any web server or opened directly in a browser.

### Local Development

1. Clone the repository
2. Open `index.html` in a web browser
3. Or serve using a local server:
   ```bash
   npx serve .
   ```

### GitHub Pages Deployment

This project is configured for GitHub Pages deployment. Simply push to the main branch and enable GitHub Pages in repository settings.

## Browser Support

- Modern browsers with JavaScript enabled
- WebAssembly support required for Tesseract.js
- File API support for drag & drop functionality

## Limitations

- OCR accuracy depends on image quality and complexity
- Works best with printed equations rather than handwritten
- Complex mathematical layouts may require manual correction
- Processing may take 10-30 seconds depending on image size

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is open source and available under the MIT License.
