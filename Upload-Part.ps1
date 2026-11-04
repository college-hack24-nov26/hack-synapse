param(
    [Parameter(Mandatory=$true)][ValidateRange(1,4)][int]$Member,
    [Parameter(Mandatory=$true)][ValidateRange(1,3)][int]$Step,
    [string]$RepoPath='',
    [switch]$Preview
)
$ErrorActionPreference='Stop'
if([string]::IsNullOrWhiteSpace($RepoPath)){$RepoPath=Join-Path (Split-Path $PSScriptRoot) 'hack-synapse-upload'}
$remote='https://github.com/college-hack24-nov26/hack-synapse.git'
$parts=@{
    '1.1'=@{Message='build(web): configure React, Vite and dependency locking';Paths=@('.gitignore','.gitattributes','package.json','package-lock.json','index.html','vite.config.js')}
    '1.2'=@{Message='feat(web): add React dashboard shell and workspace integration';Paths=@('src')}
    '1.3'=@{Message='chore(deploy): add launchers, Pi services and setup guides';Paths=@('README.md','start-react.ps1','deployment','playwright.config.js','tests/workspace.spec.js','Upload-Part.ps1','GITHUB_UPLOAD.md')}
    '2.1'=@{Message='feat(sensors): add ESP32 input and calibrated signal processing';Paths=@('engine/__init__.py','engine/edge_pipeline.py','engine/mqtt_client.py','engine/serial_client.py','engine/preprocessor.py','engine/emg_estimator.py','engine/feature_extractor.py','engine/classifier.py','engine/fusion_engine.py','engine/repetition_counter.py','engine/simulator.py')}
    '2.2'=@{Message='feat(rehab): add glove calibration and guided exercise scoring';Paths=@('engine/glove_personalisation.py','engine/guided_exercises.py','engine/guided_tracker.py','engine/paced_movement.py')}
    '2.3'=@{Message='test(rehab): cover calibration, scoring and jump controls';Paths=@('tests/test_calibration.py','tests/test_emg_estimator.py','tests/test_finger_rounds.py','tests/test_grip_tolerance.py','tests/test_kangaroo_input.cjs')}
    '3.1'=@{Message='feat(api): add session APIs, SQLite storage and report exports';Paths=@('run.py','server.py','config.py','requirements.txt','web/__init__.py','web/app.py','web/guided_api.py','web/personalisation_api.py','web/prediction_api.py','database','reporting')}
    '3.2'=@{Message='style(dashboard): add responsive layouts and clinical theme';Paths=@('web/templates','web/static/css')}
    '3.3'=@{Message='feat(dashboard): add hand views, rehab games and language controls';Paths=@('web/static/js')}
    '4.1'=@{Message='assets(hand): add 3D models, illustrations and bundled fonts';Paths=@('web/static/models','web/static/images','web/static/fonts')}
    '4.2'=@{Message='assets(rehab): add architecture diagram and exercise videos';Paths=@('web/static/images/neuroglove-architecture.jpg','exercise_videos','web/static/videos')}
    '4.3'=@{Message='feat(firmware): add ESP32 sketches and movement model assets';Paths=@('ml','firmware')}
}
$descriptions=@{
    '1.1'='Add the frontend entry point, reproducible npm dependencies and Git exclusions for local data and build output.'
    '1.2'='Add React rendering, workspace startup handling and integration with the existing dashboard controllers.'
    '1.3'='Document local and Raspberry Pi setup, configure boot services and include the shared upload workflow.'
    '2.1'='Add USB/MQTT acquisition, calibrated five-finger processing and an explicitly estimated EMG channel.'
    '2.2'='Add patient personalisation, five-finger exercise rounds and tolerant grip-pressure scoring.'
    '2.3'='Cover calibration validation, estimated EMG, complete finger rounds, pressure tolerance and kangaroo gestures.'
    '3.1'='Add the Python entry points, session persistence, calibration APIs, progress endpoints and PDF/CSV exports.'
    '3.2'='Add page templates, viewport layouts and consistent styling for telemetry, exercises, games and dialogs.'
    '3.3'='Add interactive hand rendering, game controls, progress charts, history views and English/Hindi/Marathi support.'
    '4.1'='Bundle the hand assets and fonts alongside their attribution and license files.'
    '4.2'='Add the NeuroGlove hardware block diagram used by the README and bundle local exercise demonstration videos.'
    '4.3'='Add model artifacts and training utilities with ESP32 firmware copies stripped of local credentials.'
}
$part=$parts["$Member.$Step"]
$sourceRoot=[IO.Path]::GetFullPath($PSScriptRoot)
$files=@()
foreach($entry in $part.Paths){
    $source=Join-Path $sourceRoot $entry
    if(-not(Test-Path -LiteralPath $source)){throw "Missing project file: $entry"}
    $items=if((Get-Item -LiteralPath $source).PSIsContainer){Get-ChildItem -LiteralPath $source -File -Recurse}else{Get-Item -LiteralPath $source}
    foreach($item in $items){
        $relative=$item.FullName.Substring($sourceRoot.Length+1).Replace('\','/')
        if("$Member.$Step" -eq '4.1' -and $relative -eq 'web/static/images/neuroglove-architecture.jpg'){continue}
        if($relative -match '(^|/)(__pycache__|node_modules|\.venv|\.git|test-results|reports)(/|$)' -or $relative -match '\.(pyc|db|sqlite|sqlite3|log)(-|$)' -or $item.Name -match '^\.env' -or $item.Name -eq 'secrets.h'){continue}
        $destination=$relative
        $files+=@{Source=$item.FullName;Relative=$destination}
    }
}
# Apply the project ignore rules even when a different member uploads before
# step 1.1 has added .gitignore to the remote repository.
if(-not(Test-Path -LiteralPath (Join-Path $RepoPath '.git'))){throw 'Clone the repository first. See GITHUB_UPLOAD.md.'}
$ignoreFile=Join-Path $sourceRoot '.gitignore'
$ignored=@($files.Relative | & git -C $RepoPath -c "core.excludesFile=$ignoreFile" check-ignore --no-index --stdin)
if($LASTEXITCODE -gt 1){throw 'Unable to validate upload paths against .gitignore.'}
$files=@($files | Where-Object {$_.Relative -notin $ignored})
if(-not $files.Count){throw 'This step contains no uploadable files.'}
if($Preview){
    Write-Host "Member $Member / step $Step : $($part.Message)"
    Write-Host $descriptions["$Member.$Step"]
    $files | ForEach-Object {Write-Host $_.Relative}
    Write-Host "$($files.Count) files. Preview only: nothing copied, staged, committed or pushed."
    return
}
function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
    & git -C $RepoPath @Arguments
    if($LASTEXITCODE -ne 0){throw "Git failed. Resolve the error above before retrying. No force-push is used."}
}
if(-not(Test-Path -LiteralPath (Join-Path $RepoPath '.git'))){throw 'Clone the repository first. See GITHUB_UPLOAD.md.'}
$RepoPath=[IO.Path]::GetFullPath($RepoPath)
$actualRoot=(& git -C $RepoPath rev-parse --show-toplevel).Trim()
if([IO.Path]::GetFullPath($actualRoot) -ne $RepoPath.TrimEnd('\','/')){throw 'RepoPath must be the cloned repository root.'}
$url=(& git -C $RepoPath remote get-url origin).Trim()
if($url -notmatch 'github\.com[:/]college-hack24-nov26/hack-synapse(?:\.git)?$'){throw 'The clone points at a different repository.'}
if((& git -C $RepoPath branch --show-current).Trim() -ne 'main'){throw 'Switch to main before running this upload.'}
foreach($key in @('user.name','user.email')){if(-not(& git -C $RepoPath config --get $key)){throw "Configure your own $key first; see GITHUB_UPLOAD.md."}}
if(& git -C $RepoPath status --porcelain --untracked-files=no){throw 'This clone has tracked edits or staged changes. Commit or resolve those before uploading a part.'}
Invoke-Git pull --rebase origin main
Write-Host "Uploading as: $(& git -C $RepoPath config user.name) <$(& git -C $RepoPath config user.email)>"
Write-Host "Commit: $($part.Message)"
foreach($file in $files){
    $target=Join-Path $RepoPath $file.Relative
    $parent=Split-Path $target
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    if($file.Relative -match '^firmware/.*\.(ino|h)$'){
        # Sanitize only the upload copy. Keep the working glove firmware intact.
        $text=[IO.File]::ReadAllText($file.Source)
        $text=[regex]::Replace($text,'(?i)(\b(?:WIFI_SSID|WIFI_PASS(?:WORD)?|MQTT_USER(?:NAME)?|MQTT_PASS(?:WORD)?)\s*=\s*)"[^"\r\n]*"','$1"CONFIGURE_LOCALLY"')
        $text=[regex]::Replace($text,'(?im)(^\s*#define\s+(?:WIFI_SSID|WIFI_PASS(?:WORD)?|MQTT_USER(?:NAME)?|MQTT_PASS(?:WORD)?)\s+)"[^"\r\n]*"','$1"CONFIGURE_LOCALLY"')
        [IO.File]::WriteAllText($target,$text,[Text.UTF8Encoding]::new($false))
    }else{Copy-Item -LiteralPath $file.Source -Destination $target -Force}
}
foreach($file in $files){Invoke-Git add -- $file.Relative}
& git -C $RepoPath diff --cached --quiet
if($LASTEXITCODE -eq 1){Invoke-Git commit -m $part.Message -m $descriptions["$Member.$Step"]}
elseif($LASTEXITCODE -eq 0){Write-Host 'These files are already committed; no empty commit created.'}
else{throw 'Unable to inspect staged changes.'}
Invoke-Git pull --rebase origin main
Invoke-Git push origin main
Write-Host "Uploaded member $Member / step $Step using your configured Git identity."
