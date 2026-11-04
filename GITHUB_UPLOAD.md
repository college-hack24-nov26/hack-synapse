# Uploading the completed project in twelve parts

Repository: https://github.com/college-hack24-nov26/hack-synapse

These are uploads of an existing project, not a record of when each feature was developed. Use each member's own GitHub login and verified email. No author/date substitution, empty commits or force pushes are used.

## One-time setup on each computer

Extract the shared NeuroGlove-React ZIP. Open PowerShell inside that folder. Keep this source folder separate from the clone.

```powershell
if (-not (Test-Path ..\hack-synapse-upload\.git)) {
    git clone https://github.com/college-hack24-nov26/hack-synapse.git ..\hack-synapse-upload
}
git -C ..\hack-synapse-upload config user.name "YOUR NAME"
git -C ..\hack-synapse-upload config user.email "YOUR VERIFIED GITHUB EMAIL"
```

On the original PC, the clone already exists at E:\NeuroGlove-main\hack-synapse-upload, so skip the clone command. Set your identity there. Each account needs collaborator write access and its own GitHub authentication on its computer. Commit identity alone does not authenticate a GitHub account.

## Twelve commands

Run commands from the extracted **source** folder, where Upload-Part.ps1 lives. Each member runs only their own three commands, in step order. Different members may interleave their steps. Coordinate pushes; if someone else pushes first, the helper pulls/rebases before pushing. Resolve any reported conflict rather than forcing a push.

```powershell
# Member 1
powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member 1 -Step 1
powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member 1 -Step 2
powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member 1 -Step 3

# Member 2
powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member 2 -Step 1
powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member 2 -Step 2
powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member 2 -Step 3

# Member 3
powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member 3 -Step 1
powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member 3 -Step 2
powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member 3 -Step 3

# Member 4
powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member 4 -Step 1
powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member 4 -Step 2
powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member 4 -Step 3
```

You choose the times during your twelve-hour window; the helper does not schedule or backdate anything. Run each part once. Repeating an unchanged part does not manufacture another commit. The initial README commit remains, so after twelve uploads the repository should contain **13 commits total**, including the pre-existing README commit.

## What each member uploads

| Member | Step 1 | Step 2 | Step 3 |
|---|---|---|---|
| 1 | React build configuration | React frontend | Launchers, deployment and setup documentation |
| 2 | Sensor processing engine | Calibration and exercise scorer | Calibration, scoring and gesture tests |
| 3 | Flask, SQLite and reports | Templates and styles | Games, hand, charts and translation controllers |
| 4 | Fonts, illustrations and 3D models | Architecture block diagram and exercise videos | ML and ESP32 firmware |

Part 1.3 updates the repository's README.md with the NeuroGlove project overview, terminal-style banner, feature descriptions and setup instructions. The original README remains in Git history. The banner asset is uploaded in part 4.1; the architecture block-diagram photo is uploaded in part 4.2. The complete app is available after all twelve parts; intermediate commits intentionally contain only part of the project.

## Commit messages

Each upload includes a descriptive title and a short body explaining the files being added.

| Part | Commit title |
|---|---|
| 1.1 | `build(web): configure React, Vite and dependency locking` |
| 1.2 | `feat(web): add React dashboard shell and workspace integration` |
| 1.3 | `chore(deploy): add launchers, Pi services and setup guides` |
| 2.1 | `feat(sensors): add ESP32 input and calibrated signal processing` |
| 2.2 | `feat(rehab): add glove calibration and guided exercise scoring` |
| 2.3 | `test(rehab): cover calibration, scoring and jump controls` |
| 3.1 | `feat(api): add session APIs, SQLite storage and report exports` |
| 3.2 | `style(dashboard): add responsive layouts and clinical theme` |
| 3.3 | `feat(dashboard): add hand views, rehab games and language controls` |
| 4.1 | `assets(hand): add 3D models, illustrations and bundled fonts` |
| 4.2 | `assets(rehab): add architecture diagram and exercise videos` |
| 4.3 | `feat(firmware): add ESP32 sketches and movement model assets` |

## Example interleaved order

`1.1 → 3.1 → 2.1 → 4.1 → 2.2 → 1.2 → 4.2 → 3.2 → 1.3 → 2.3 → 3.3 → 4.3`

The first number is the member and the second is their step. Other interleavings work too. Keep each member's steps in order, run one upload at a time, and choose your own times during the twelve-hour period. No extra `git add .` or manual commit is needed when using the helper.

## Preview without uploading

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member 1 -Step 1 -Preview
```

The helper applies the updated .gitignore to every part, even if someone uploads before part 1.1. It excludes local environments, databases, reports, secrets.h and caches. It replaces Wi-Fi/MQTT credential string assignments with CONFIGURE_LOCALLY in the **firmware upload copy only**. Your original firmware is unchanged. Configure real credentials locally when flashing hardware; do not commit them. `.gitattributes` keeps source line endings consistent across computers. `run.py` remains included in part 3.1. Node dependencies and the frontend build must be regenerated after cloning (`npm ci`, `npm run build`). A new SQLite database is created by the backend on first startup.

The generated dist, node_modules and browser-test output were removed from the source folder during cleanup. They are not required to upload the source and must not be copied back from the cleanup backup into the upload clone.

To preview all twelve parts without copying or running commit/push commands:

```powershell
foreach ($member in 1..4) {
    foreach ($step in 1..3) {
        powershell -NoProfile -ExecutionPolicy Bypass -File .\Upload-Part.ps1 -Member $member -Step $step -Preview
        if ($LASTEXITCODE -ne 0) { throw 'Preview failed; check the error above.' }
    }
}
```

## Check completion

```powershell
git -C ..\hack-synapse-upload pull --rebase origin main
git -C ..\hack-synapse-upload log --oneline --format="%h %an: %s" -13
```

If a push fails after a commit was created, pull/rebase and push that existing commit. Do not delete history or change authors to work around an error.
