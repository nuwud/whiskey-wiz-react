# PowerShell migration script for quarters data

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
    Write-ColorOutput Green "[MIGRATE] $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "[WARNING] $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "[ERROR] $message"
}

# Create backup timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups/quarters_$timestamp"

# Create backup directory
Write-Log "Creating backup directory..."
try {
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
}
catch {
    Write-Error "Failed to create backup directory"
    exit 1
}

# Create a backup script
$backupScript = @"
import { db } from './src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs/promises';

async function backup() {
    try {
        const quartersRef = collection(db, 'quarters');
        const snapshot = await getDocs(quartersRef);
        const data = {};
        
        snapshot.forEach((doc) => {
            data[doc.id] = doc.data();
        });

        await fs.writeFile('$($backupDir.Replace("\","\\"))/quarters_backup.json', 
            JSON.stringify(data, null, 2));
            
        console.log('Backup completed successfully');
    } catch (error) {
        console.error('Backup failed:', error);
        process.exit(1);
    }
}

backup();
"@

# Save backup script
Write-Log "Creating backup..."
$backupScript | Out-File -FilePath "scripts/backup-quarters.mjs" -Encoding UTF8

# Run backup script
try {
    node scripts/backup-quarters.mjs
    if ($LASTEXITCODE -ne 0) { throw }
}
catch {
    Write-Error "Failed to create backup"
    Write-Error $_.Exception.Message
    exit 1
}

# Run the migration script
Write-Log "Running migration..."
try {
    npx tsx scripts/migrate-quarters.tsx
    if ($LASTEXITCODE -ne 0) { throw }
}
catch {
    Write-Error "Migration failed. Backup is available at: $backupDir"
    exit 1
}

# Cleanup backup script
Remove-Item -Path "scripts/backup-quarters.mjs" -ErrorAction SilentlyContinue

Write-Log "Migration completed successfully!"
Write-Log "Backup available at: $backupDir/quarters_backup.json"