param([ValidateSet('serial','mqtt','simulate')][string]$Source='serial', [string]$SerialPort='COM11', [int]$Port=5002)
$ErrorActionPreference='Stop'
$reactRoot=$PSScriptRoot
$reactPython=Join-Path $reactRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $reactPython)) { $reactPython=Join-Path (Split-Path $reactRoot) '.venv\Scripts\python.exe' }
if (-not (Test-Path -LiteralPath $reactPython)) { throw 'Run: py -3 -m venv .venv, then .\.venv\Scripts\python.exe -m pip install -r requirements.txt' }
Push-Location -LiteralPath $reactRoot
try { & $reactPython -u server.py --source $Source --serial-port $SerialPort --port $Port }
finally { Pop-Location }
