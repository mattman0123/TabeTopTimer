# Check if npm is installed
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm is not installed. Please install Node.js and npm first." -ForegroundColor Red
    exit 1
}

# Define the packages to install
$packages = @(
    "express",
    "http",
    "socket.io",
    "multer",
    "path",
    "fs",
    "express-session",
    "body-parser"
)

# Install the packages
foreach ($package in $packages) {
    Write-Host "Installing $package..."
    npm install $package
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install $package." -ForegroundColor Red
        exit 1
    }
}

Write-Host "All packages installed successfully!" -ForegroundColor Green
