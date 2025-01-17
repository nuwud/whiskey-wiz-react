# PowerShell deployment script

# Function to write colored output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Log($message) {
    Write-ColorOutput Green "[DEPLOY] $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "[WARNING] $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "[ERROR] $message"
}

# Check for .env.local
if (-not(Test-Path ".env.local")) {
    Write-Error "Missing .env.local file"
    exit 1
}

# Clean install dependencies
Write-Log "Installing dependencies..."
try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw }
}
catch {
    Write-Error "Failed to install dependencies"
    exit 1
}

# Run tests
Write-Log "Running tests..."
try {
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Tests failed. Continue? (y/n)"
        $continue = Read-Host
        if ($continue -ne "y") {
            exit 1
        }
    }
}
catch {
    Write-Error "Tests failed"
    exit 1
}

# Build application
Write-Log "Building application..."
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw }
}
catch {
    Write-Error "Build failed"
    exit 1
}

# Deploy to Firebase
Write-Log "Deploying to Firebase..."
try {
    firebase deploy
    if ($LASTEXITCODE -ne 0) { throw }
}
catch {
    Write-Error "Firebase deployment failed"
    exit 1
}

Write-Log "Deployment complete!"