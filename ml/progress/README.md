# Experimental practice-goal Prediction tab

This is not a medical recovery prediction system. It has no diagnosis, clinical impairment scores, functional outcomes, or patient recovery labels. Never use its days estimate to make treatment, discharge, prognosis, eligibility or care decisions.

## Target and training

The target is days until the selected exercise's daily attempt-weighted achievement reaches a configurable 70%, 80% or 90% practice goal. That software metric is not clinical recovery.

Run `.venv/Scripts/python.exe ml/progress/train.py` on Windows (or `.venv/bin/python ml/progress/train.py` on Linux). Seed 1947 generates 12,000 independent fictional practice scenarios with six input features. The simulator assumes a future daily progress rate linked to recent score trend, attendance, practice time, within-game point-rate changes and variability, with lognormal noise. The generated labels and assumed relationship are invented; they are not validated rehabilitation science. The script is the exact data-generation specification.

The script produces `synthetic_training.csv` and a 48-tree random forest in `model.json`, including holdout MAE on a random 20% synthetic split. This MAE measures simulator approximation only. It is not a patient-validation result. The JSON stores tree arrays and is evaluated by ordinary Python at inference time to avoid sklearn/pickle version coupling on the Raspberry Pi. Dependencies for training already exist in requirements.txt.

A point estimate uses the mean of the tree predictions. The scenario range is the 10th–90th percentile of tree outputs (rounded); it is neither a calibrated prediction interval nor a clinical confidence interval. No causal importance claims are made. The UI explains observed inputs separately from model assumptions.

## Patient data and guardrails

`GET /api/prediction?exercise=grasp_release&goal=80&mode=live` reads only completed, scored MQTT/serial sessions for user 1, the selected exercise, and the latest scored calibration/protocol combination from the past 90 days. Daily scores are weighted by completed attempts. Unscored sessions are never treated as zero. Gaps without practice are not interpolated into observed data. At least four scored days spanning one week are required. Flat/declining trends, out-of-training-range inputs and scenarios beyond 180 days suppress a forecast. Reaching a practice goal only reports that observed software achievement.

The synthetic example is generated in memory, labelled as fictional, and never inserted into patient tables or used as a fallback for missing live history.

`POST /api/game-sessions` stores future completed browser game runs (minimum five seconds) in additive SQLite table `game_sessions_v1`, with unique client IDs to prevent duplicate submissions. Source and settings are recorded. Game scores are browser-reported performance, not verified physiological measurements. Manual and simulated runs do not enter live forecasts. Trends compare points/minute within each game and matching settings, not raw points across games. Past browser best scores are preserved and are not converted into invented historical sessions.

## Validation and remaining work

`tests/test_prediction.py` verifies data separation, insufficient/flat trends, calibration isolation, API validation, idempotent game storage and target-reached behavior. Existing game tests also cover one-time history submission. Isolated browser testing covers navigation, synthetic labels, hover/focus chart interaction, browser errors and responsive layout.

Before any clinical recovery model could be built, establish a clinician-defined outcome, collect appropriate consented longitudinal clinical data, split validation by patient and site/time, assess calibration, uncertainty, subgroup performance and external validity, and obtain relevant clinical and regulatory review. This prototype supplies none of that evidence.

Background: https://www.nhs.uk/conditions/stroke/recovery/ and https://www.nice.org.uk/guidance/ng236/chapter/Recommendations
