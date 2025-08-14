@echo off
echo 🔬 LaTeX OCR Setup with pix2tex
echo ========================================
echo.
echo This script will:
echo 1. Install pix2tex (LaTeX-OCR) 
echo 2. Start the API server
echo 3. Open your web interface
echo.
echo ⚠️  Make sure you have Python 3.7+ installed
echo.
pause

python setup_pix2tex.py

echo.
echo Press any key to exit...
pause > nul