#!/usr/bin/env python3
"""
Setup script for pix2tex LaTeX OCR server
This script helps you install and run the pix2tex server for better LaTeX OCR accuracy.
"""

import subprocess
import sys
import os
import webbrowser
from pathlib import Path

def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully!")
        if result.stdout:
            print(f"Output: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed!")
        print(f"Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 7):
        print("❌ Python 3.7+ is required. Please upgrade Python.")
        return False
    print(f"✅ Python {sys.version.split()[0]} is compatible.")
    return True

def install_pix2tex():
    """Install pix2tex package."""
    print("🚀 Installing pix2tex (LaTeX-OCR)...")
    
    # Try installing with different options
    install_commands = [
        'pip install "pix2tex[gui]"',
        'pip install pix2tex',
        'python -m pip install "pix2tex[gui]"',
        'python -m pip install pix2tex'
    ]
    
    for cmd in install_commands:
        if run_command(cmd, f"Installing pix2tex with: {cmd}"):
            return True
    
    print("❌ Failed to install pix2tex. Please install manually:")
    print("pip install \"pix2tex[gui]\"")
    return False

def test_installation():
    """Test if pix2tex is installed correctly."""
    try:
        import pix2tex
        print("✅ pix2tex is installed correctly!")
        return True
    except ImportError:
        print("❌ pix2tex installation test failed.")
        return False

def run_server():
    """Run the pix2tex API server."""
    print("\n🚀 Starting pix2tex API server...")
    print("📝 The server will start at http://localhost:8502")
    print("🌐 Your web interface will automatically open")
    print("⚠️  Keep this terminal window open while using the OCR!")
    print("\n" + "="*50)
    
    try:
        # Open the web interface
        web_interface_path = Path(__file__).parent / "index.html"
        if web_interface_path.exists():
            webbrowser.open(f"file://{web_interface_path.absolute()}")
        
        # Run the server (this will block)
        subprocess.run([sys.executable, "-m", "pix2tex.api.run"], check=True)
        
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start server: {e}")
        print("\nTry running manually:")
        print("python -m pix2tex.api.run")

def main():
    """Main setup function."""
    print("🔬 LaTeX OCR Setup with pix2tex")
    print("="*40)
    
    # Check Python version
    if not check_python_version():
        return
    
    # Install pix2tex
    if not install_pix2tex():
        return
    
    # Test installation
    if not test_installation():
        return
    
    print("\n" + "="*40)
    print("✅ Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. The pix2tex server will start automatically")
    print("2. Use your web interface at the opened browser window") 
    print("3. Click 'Try pix2tex (Better OCR)' button for better results")
    print("4. Keep this terminal open while using the OCR")
    print("\n🚀 Starting server now...")
    
    input("\nPress Enter to continue...")
    run_server()

if __name__ == "__main__":
    main()