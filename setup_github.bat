@echo off
echo ========================================
echo Enhanced Pronunciation & Grammar Checker
echo GitHub Upload Setup
echo ========================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed!
    echo.
    echo Please install Git first:
    echo 1. Go to https://git-scm.com/download/win
    echo 2. Download and install Git
    echo 3. Restart this script
    echo.
    pause
    exit /b 1
)

echo ✅ Git is installed
echo.

REM Initialize Git repository
echo 📁 Initializing Git repository...
git init

REM Add all files
echo 📄 Adding all files...
git add .

REM Create initial commit
echo 💾 Creating initial commit...
git commit -m "Initial commit: Enhanced Pronunciation & Grammar Checker

Features:
- Comprehensive grammar checker with 50+ error patterns
- Real-time red error highlighting with tooltips
- Smart auto-correction for all error types
- Pronunciation analysis with speech-to-text
- User authentication and profile management
- Modern responsive UI with Bootstrap
- Free and offline-compatible operation"

echo.
echo ✅ Local Git repository setup complete!
echo.
echo 🌐 Next steps:
echo 1. Go to https://github.com
echo 2. Click the '+' button and select 'New repository'
echo 3. Name it: pronunciation-grammar-checker
echo 4. Description: Enhanced Pronunciation & Grammar Checker
echo 5. Choose Public or Private
echo 6. DO NOT initialize with README (we already have one)
echo 7. Click 'Create repository'
echo.
echo 8. Copy the repository URL (it will look like):
echo    https://github.com/yourusername/pronunciation-grammar-checker.git
echo.
echo 9. Run these commands (replace 'yourusername' with your GitHub username):
echo    git remote add origin https://github.com/yourusername/pronunciation-grammar-checker.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 📋 Or copy and paste this template (replace yourusername):
echo git remote add origin https://github.com/yourusername/pronunciation-grammar-checker.git
echo git branch -M main
echo git push -u origin main
echo.
pause
