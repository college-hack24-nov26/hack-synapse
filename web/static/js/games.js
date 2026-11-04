/** Sensor-driven rehabilitation activities. Canvas coordinates remain 920 × 520. */
class NeuroGloveGames {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.activeGame = 'fruit';
        this.isRunning = false;
        this.isPaused = false;
        this.completed = false;
        this.score = 0;
        this.bestScoreStorageKey = 'neuroglove.gameBestScores.v1';
        this.scoresPersisted = true;
        this.bestScores = this.loadBestScores();
        this.sqliteScoresSaved = false;
        this.sessionBestAtStart = 0;
        this.reps = 0;
        this.elapsedSeconds = 0;
        this.elapsed = 0;
        this.liveGripPct = 0;
        this.liveFsrPct = 0;
        this.liveWristPitch = 0;
        this.rawWristPitch = 0;
        this.liveWristPitchDeg = 0;
        this.wristPitchOffset = 0;
        this.catchThreshold = 50;
        this.wristSensitivity = 1;
        this.inputMode = 'sensor';
        this.lastFlexAt = this.lastImuAt = this.lastFsrAt = 0;
        this.latestSensorState = null;
        this.latestSensorAt = 0;
        this.dinoFinger = null;
        this.fingerNames = {thumb:'Thumb',index:'Index finger',middle:'Middle finger',ring:'Ring finger',pinky:'Little finger'};
        this.fingerNumbers = {thumb:1,index:2,middle:3,ring:4,pinky:5};
        this.liveFingerFlex = {};
        this.fingerSeenAt = {};
        this.dinoBendThreshold = 15;
        this.dinoPickerOpen = true;
        this.dinoPace = 1;
        this.dinoGentle = true;
        this.dinoArmed = true;
        this.dinoRestFlex = 0;
        this.manualPulseUntil = 0;
        this.dino = this.createDino();
        this.soundEnabled = false;
        this.lastTelemetryAt = 0;
        this.sourceIsLive = false;
        this.hardwareConnected = true;
        this.lastPrompt = '';
        this.fruit = {x:460,y:108,isCaught:false,releasing:false,arriving:true};
        this.balloon = {x:210,y:260};
        this.targetRings = [{x:550,y:210,passed:false},{x:850,y:310,passed:false}];
        this.message = '';
        this.messageTime = 0;
        this.logicalWidth = 920;
        this.logicalHeight = 520;
        this.initCanvasResolution();
        this.lastFrameTime = performance.now();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
        this.selectGame("fruit");
        this.setStage("library");
        this.syncBestScores();
        window.addEventListener?.('keydown', event => {
            if (this.inputMode !== 'manual' || this.activeGame !== 'dino' || !this.isRunning || this.isPaused) return;
            if (!document.getElementById('tab-games')?.classList.contains('active')) return;
            if (['INPUT','SELECT','TEXTAREA','BUTTON','SUMMARY'].includes(event.target?.tagName) || event.repeat) return;
            if (event.code === 'Space' || event.code === 'ArrowUp') {event.preventDefault();this.manualAction('jump');}
        });
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement && this.isRunning && !this.isPaused) this.pauseGame();
        });
        window.addEventListener?.('keydown', event => {if(event.key === 'Escape' && this.settingsOpen) this.toggleSettings(false);});
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning && !this.isPaused) this.pauseGame();
        });
        window.addEventListener?.('storage', event => {
            if (event.key !== this.bestScoreStorageKey && event.key !== null) return;
            const saved = this.loadBestScores();
            for (const game of ['fruit','balloon','dino']) this.bestScores[game] = Math.max(this.bestScores[game], saved[game]);
            this.updateScoreDisplay();
        });
    }
    loadBestScores() {
        const scores = {fruit:0,balloon:0,dino:0};
        try {
            if (!window.localStorage) {this.scoresPersisted = false;return scores;}
            const saved = JSON.parse(window.localStorage.getItem(this.bestScoreStorageKey) || '{}');
            for (const game of Object.keys(scores)) {
                if (Number.isSafeInteger(saved?.[game]) && saved[game] >= 0) scores[game] = saved[game];
            }
        } catch (_) {this.scoresPersisted = false; /* An unreadable record never prevents play. */}
        return scores;
    }
    async syncBestScores() {
        if(typeof fetch!=='function')return;
        try {
            const response=await fetch('/api/game-best-scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scores:this.bestScores})});
            if(!response.ok)throw new Error('Score save failed');
            const data=await response.json();
            for(const game of ['fruit','balloon','dino'])if(Number.isSafeInteger(data.scores?.[game]))this.bestScores[game]=Math.max(this.bestScores[game],data.scores[game]);
            this.sqliteScoresSaved=true;
            try{window.localStorage.setItem(this.bestScoreStorageKey,JSON.stringify(this.bestScores));}catch(_){}
            this.updateScoreDisplay();
            if(this.completed)this.setText('gameResultBest',this.bestScores[this.activeGame]);
        }catch(_){this.sqliteScoresSaved=false;this.updateScoreDisplay();}
    }
    recordBestScore() {
        if (!Number.isSafeInteger(this.score) || this.score <= this.bestScores[this.activeGame]) return;
        // Merge other tabs' records before writing so one game cannot erase another's best.
        const saved = this.loadBestScores();
        for (const game of ['fruit','balloon','dino']) this.bestScores[game] = Math.max(this.bestScores[game], saved[game]);
        this.bestScores[this.activeGame] = Math.max(this.bestScores[this.activeGame], this.score);
        try {
            if (!window.localStorage) throw new Error('Storage unavailable');
            window.localStorage.setItem(this.bestScoreStorageKey, JSON.stringify(this.bestScores));
            this.scoresPersisted = true;
        } catch (_) {this.scoresPersisted = false;}
        this.syncBestScores();
    }
    updateScoreDisplay() {
        const best = this.bestScores[this.activeGame];
        this.setText('gameBestScoreVal', best);
        for (const game of ['fruit','balloon','dino']) this.setText(`gameBest-${game}`, `Personal best · ${this.bestScores[game]} pts`);
        const improvement = this.score - this.sessionBestAtStart;
        const progress = this.score > 0 && this.score === best && improvement > 0
            ? (this.sessionBestAtStart > 0 ? `New personal best · ${improvement} points above your previous best` : 'Your first personal best. A lovely start.')
            : best === 0 ? 'Every movement is a start. Set your first personal best.'
            : this.score === best ? 'You matched your personal best. Well done.'
            : `${best - this.score} points to your personal best. Go at your own pace.`;
        if (document.getElementById('gameScoreProgress')?.textContent !== progress) this.setText('gameScoreProgress', progress);
        this.setText('gameScoreStorage',this.sqliteScoresSaved?'Personal best saved.':'Personal best waiting to sync.');
    }
    initCanvasResolution() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = this.logicalWidth * dpr;
        this.canvas.height = this.logicalHeight * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    setCatchThreshold(value) {
        this.catchThreshold = Math.max(20, Math.min(80, Number(value)));
        this.setText('gameCatchThresholdVal', `${this.catchThreshold}%`);
        this.updateBiofeedbackGauges();
    }
    setWristSensitivity(value) { this.wristSensitivity = Number(value); }
    selectGame(name) {
        if (!['fruit','balloon','dino'].includes(name) || this.isRunning) return;
        this.activeGame = name;
        document.getElementById('tab-games').setAttribute('data-activity', name);
        if (name === 'dino') this.dinoPickerOpen = true;
        this.resetGame();
        document.querySelectorAll('.game-select-pill').forEach(button => {
            const selected = button.dataset.game === name;
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
        for (const game of ['fruit','balloon','dino']) {
            document.getElementById(`${game}InstructionsCard`).style.display = game === name ? 'block' : 'none';
        }
        this.setText('gameSceneLabel', {fruit:'GRASP & RELEASE',balloon:'WRIST CONTROL',dino:'JUMP & RELAX'}[name]);
        this.setText('gameActivityTitle', {fruit:'The Orchard',balloon:'Sky Journey',dino:'Kangaroo Hop'}[name]);
        const canvas = document.getElementById('gameCanvas');
        canvas.setAttribute('aria-label', `${{fruit:'The Orchard: close and open your hand to collect fruit',balloon:'Sky Journey: tilt your wrist to guide the balloon',dino:'Kangaroo Hop: bend your chosen finger toward your palm to jump'}[name]}`);
        this.updateInputSettings();
        this.updateBiofeedbackGauges();

    }
    updateInputSettings() {
        document.getElementById('tab-games').classList.toggle('rehab-manual', this.inputMode === 'manual');
        const feedback = document.querySelector('.rehab-feedback');
        if (feedback) feedback.hidden = this.inputMode === 'manual';
        const wrist = this.activeGame === 'balloon';
        document.getElementById('fruitGripMeterCard').style.display = wrist ? 'none' : 'block';
        document.getElementById('balloonWristMeterCard').style.display = wrist ? 'block' : 'none';
        document.getElementById('gameCatchThreshold').disabled = this.activeGame !== 'fruit';
        document.getElementById('gameWristSensitivity').disabled = !wrist;
        document.getElementById('gameHandSetting').hidden = this.activeGame !== 'fruit';
        document.getElementById('gameWristSetting').hidden = !wrist;
        for (const id of ['dinoBendSetting','dinoPaceSetting','dinoGentleSetting']) document.getElementById(id).hidden = this.activeGame !== 'dino';
        document.getElementById('gameManualControls').hidden = this.inputMode !== 'manual';
        document.getElementById('manualFruitControls').hidden = this.activeGame !== 'fruit';
        document.getElementById('manualBalloonControls').hidden = this.activeGame !== 'balloon';
        document.getElementById('manualDinoControl').hidden = this.activeGame !== 'dino';
        this.setText('dinoActionHelp', this.inputMode === 'manual' ? 'Press Jump to jump' : this.dinoFinger ? `Bend your ${this.fingerNames[this.dinoFinger].toLowerCase()} toward your palm to jump` : 'Choose a finger, then bend it');
        this.setText('gameInputHelp', this.inputMode === 'manual' ? (this.activeGame === 'dino' ? 'Press Jump or use the space bar. No glove needed.' : 'Use the buttons below. No glove needed.') : 'Your glove movements control the activity.');
    }
    setInputMode(mode) {
        if (!['sensor','manual'].includes(mode)) return;
        if (this.isRunning && !this.isPaused) this.pauseGame();
        this.inputMode = mode;
        this.liveGripPct = this.liveFsrPct = this.liveWristPitch = this.liveWristPitchDeg = 0;
        this.manualPulseUntil = 0;
        this.dinoArmed = true;
        for (const value of ['sensor','manual']) {
            const button = document.getElementById(value === 'sensor' ? 'gameSensorInput' : 'gameManualInput');
            if (!button) continue;
            button.classList.toggle('active', value === mode);
            button.setAttribute('aria-pressed', String(value === mode));
        }
        if (mode === 'sensor') {
            this.lastFlexAt = this.lastImuAt = this.lastFsrAt = 0;
            if (this.latestSensorState && performance.now() - this.latestSensorAt < 2500) this.updateTelemetry(this.latestSensorState);
        }
        this.updateInputSettings();this.updateBiofeedbackGauges();this.updateUI();
    }
    manualAction(action) {
        if (this.inputMode !== 'manual' || !this.isRunning || this.isPaused) return;
        if (this.activeGame === 'fruit') this.liveGripPct = action === 'close' ? 100 : 0;
        if (this.activeGame === 'balloon') {
            this.liveWristPitch = action === 'up' ? .35 : -.35;
            this.liveWristPitchDeg = Math.round(this.liveWristPitch * 57);
            this.manualPulseUntil = performance.now() + 700;
        }
        if (this.activeGame === 'dino' && action === 'jump') this.requestDinoJump();
        this.updateBiofeedbackGauges();
    }
    selectDinoFinger(finger) {
        if (!Object.hasOwn(this.fingerNames, finger)) return;
        if (this.isRunning && !this.isPaused) this.pauseGame();
        this.dinoFinger = finger;
        const resting=this.liveFingerFlex[finger];
        this.dinoRestFlex=Number.isFinite(resting)&&resting<=50?resting:0;
        this.dinoArmed = false;
        if (this.isRunning) this.dino = this.createDino(310);
        this.updateInputSettings();this.updateBiofeedbackGauges();this.updateUI();
    }
    showDinoFingerPicker() {
        if (this.isRunning && !this.isPaused) this.pauseGame();
        this.dinoPickerOpen = true;
        this.setFocus(true);this.updateUI();
    }
    setDinoBendThreshold(value) {
        this.dinoBendThreshold = Math.max(5,Math.min(50,Number(value)||15));
        this.setText('dinoBendThresholdVal', `${this.dinoBendThreshold}%`);
        this.updateBiofeedbackGauges();
    }
    updateDinoFingerUI() {
        const finger = this.dinoFinger, label = finger ? this.fingerNames[finger] : '';
        const isDino = this.activeGame === 'dino';
        document.getElementById('dinoFingerSetup').hidden = !isDino || !this.dinoPickerOpen;
        document.getElementById('gameCanvas').hidden = isDino && this.dinoPickerOpen;
        const change = document.getElementById('dinoChangeFinger');
        change.hidden = !isDino || !finger || this.dinoPickerOpen;
        this.setText('dinoChangeFinger', finger ? `${this.fingerNumbers[finger]} · ${label} · Change` : 'Choose finger');
        this.setText('dinoSelectedFinger', finger ? `${this.fingerNumbers[finger]} · ${label} selected` : 'Choose a finger to begin');
        this.setText('dinoFingerHint', finger ? `Bend your ${label.toLowerCase()} toward your palm to jump, then straighten it to get ready again.` : '1 Thumb · 2 Index · 3 Middle · 4 Ring · 5 Little finger');
        document.querySelectorAll('.dino-finger-target').forEach(target => {
            const selected = target.dataset.finger === finger;
            target.classList.toggle('selected',selected);target.setAttribute('aria-pressed',String(selected));
        });
    }
    setDinoPace(value) {this.dinoPace = Math.max(.75,Math.min(1.2,Number(value)||1));}
    signalAvailable(now = performance.now()) {
        if (this.inputMode === 'manual') return true;
        const channel = this.activeGame === 'balloon' ? this.lastImuAt : this.activeGame === 'dino' ? this.fingerSeenAt[this.dinoFinger] : this.lastFlexAt;
        return channel > 0 && now - channel < 2500 && this.hardwareConnected;
    }
    setStage(stage) {
        const dialog = document.getElementById('gameInstructionsDialog');
        const workspace = document.getElementById('gameWorkspace');
        if (stage === 'instructions') {
            dialog?.appendChild?.(workspace);
            if (!dialog?.open) dialog?.showModal?.();
        } else {
            dialog?.close?.();
            if (stage === 'playing') dialog?.before?.(workspace);
        }
        this.stage = stage;
        document.getElementById('tab-games').setAttribute('data-stage', stage);
        document.getElementById('gameResults').hidden = stage !== 'results';
        this.toggleSettings(false);
        if (document.body?.classList) document.body.classList.toggle('game-session-open', stage === 'playing');
    }
    openInstructions(name) {
        if (this.isRunning) return;
        this.selectGame(name);
        this.setupStep = 'guidance';
        document.getElementById('tab-games').setAttribute('data-setup-step','guidance');
        this.setStage('instructions');
        this.updateUI();
        document.getElementById('btnGameStart')?.focus?.();
    }
    showDinoInstructions() {
        this.setupStep = 'guidance';
        document.getElementById('tab-games').setAttribute('data-setup-step','guidance');
        this.updateUI();
        document.getElementById('btnGameStart')?.focus?.();
    }
    toggleSettings(open) {
        this.settingsOpen = open === undefined ? !this.settingsOpen : open;
        const back = document.querySelector('.game-settings-close');
        if (back) back.textContent = this.stage === 'instructions' ? 'Back to instructions' : 'Done';
        if (this.settingsOpen && this.isRunning && !this.isPaused) this.pauseGame();
        document.getElementById('tab-games').classList.toggle('game-settings-open', this.settingsOpen);
        document.getElementById('gameSettingsButton').setAttribute('aria-expanded', String(this.settingsOpen));
        if (this.settingsOpen) document.getElementById(this.activeGame === 'balloon' ? 'gameWristSensitivity' : this.activeGame === 'dino' ? 'dinoBendThreshold' : 'gameCatchThreshold')?.focus?.();
    }
    setFocus(enabled) {
        document.getElementById('tab-games').classList.toggle('rehab-focus', enabled);
        document.getElementById('gamesFocusBar').hidden = !enabled;
    }
    leaveFullscreen() {
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(()=>{});
    }
    returnToLibrary() {
        if (this.isRunning) this.stopGame();
        this.leaveFullscreen();
        this.setFocus(false);
        this.setStage('library');
        document.querySelector(`[data-game="${this.activeGame}"]`)?.focus?.();
    }
    startGame() {
        if (this.activeGame === 'dino' && this.stage === 'instructions' && this.setupStep !== 'finger') {
            this.setupStep = 'finger';
            this.dinoPickerOpen = true;
            document.getElementById('tab-games').setAttribute('data-setup-step','finger');
            this.updateUI();
            document.querySelector('.dino-finger-target')?.focus?.();
            return;
        }
        if (this.activeGame === 'dino' && !this.dinoFinger) {this.updateUI();return;}
        if (this.activeGame === 'dino') this.dinoPickerOpen = false;
        if (this.completed) this.resetGame();
        if (!this.isRunning && this.score === 0) this.sessionBestAtStart = this.bestScores[this.activeGame];
        if(!this.isRunning){
            this.gameRecordId=globalThis.crypto?.randomUUID?.()||`game-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            this.gameRecordSource=this.inputMode==='manual'?'manual':this.latestSensorState?.data_source;
        }
        this.isRunning = true;
        this.isPaused = false;
        this.dinoArmed = this.dinoInputValue() <= this.dinoReleaseThreshold();
        this.setFocus(true);
        this.setStage('playing');
        const surface = document.getElementById('tab-games');
        if (!document.fullscreenElement && surface.requestFullscreen) surface.requestFullscreen().catch(()=>{});
        this.updateUI();
    }
    pauseGame() {
        if (!this.isRunning) return;
        this.isPaused = !this.isPaused;
        if (!this.isPaused && this.activeGame === 'dino') this.dinoPickerOpen = false;
        if (!this.isPaused && this.activeGame === 'dino') this.dinoArmed = this.dinoInputValue() <= this.dinoReleaseThreshold();
        if (!this.isPaused && this.activeGame === 'dino' && this.dino.needsRetry) {
            this.dino = this.createDino(310); this.dinoArmed = this.dinoInputValue() <= this.dinoReleaseThreshold();
        }
        this.updateUI();
    }
    stopGame() {
        if(this.isRunning&&typeof fetch==='function'&&this.gameRecordSource){
            const record={id:this.gameRecordId,game:this.activeGame,source:this.gameRecordSource,score:this.score,reps:this.reps,seconds:this.elapsedSeconds,settings:{catch:this.catchThreshold,wrist:this.wristSensitivity,bend:this.dinoBendThreshold,pace:this.dinoPace,finger:this.dinoFinger,gentle:this.dinoGentle}};
            fetch('/api/game-sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record)}).catch(()=>{});
        }
        this.isRunning = false;
        this.isPaused = false;
        this.completed = true;
        this.updateUI();
        this.setStage('results');
        this.leaveFullscreen();
        this.setText('gameResultsName', {fruit:'The Orchard',balloon:'Sky Journey',dino:'Kangaroo Hop'}[this.activeGame]);
        this.setText('gameResultScore', this.score);
        this.setText('gameResultBest', this.bestScores[this.activeGame]);
        this.setText('gameResultReps', this.reps);
        this.setText('gameResultTime', document.getElementById('gameTimeVal').textContent);
        this.setText('gameResultMessage', this.score > this.sessionBestAtStart ? 'New personal best. Well done.' : 'Every movement counts. Keep going at your own pace.');
        document.getElementById('gameResults')?.focus?.();
    }
    resetGame() {
        this.isRunning = false;
        this.isPaused = false;
        this.completed = false;
        this.score = this.reps = this.elapsedSeconds = this.elapsed = 0;
        this.sessionBestAtStart = this.bestScores[this.activeGame];
        this.fruit = {x:460,y:108,isCaught:false,releasing:false,arriving:true};
        this.balloon.y = 260;
        this.targetRings = [{x:550,y:210,passed:false},{x:850,y:310,passed:false}];
        this.messageTime = 0;
        this.dino = this.createDino(); this.dinoArmed = true;
        this.updateUI();
    }
    zeroWristCenter() {
        this.wristPitchOffset = this.rawWristPitch;
        this.liveWristPitch = this.liveWristPitchDeg = 0;
        this.updateBiofeedbackGauges();
        this.message = 'Resting position set';
        this.messageTime = 2;
    }
    setText(id, value) {
        const element = document.getElementById(id), text = String(value);
        const displayed = window.ngI18n?.translate(text) ?? text;
        // Avoid replacing unchanged text at 60 fps (and retriggering translation).
        if(element && element.textContent !== displayed) element.textContent = text;
    }
    updateUI() {
        this.recordBestScore();
        this.updateScoreDisplay();
        this.setText('gameScoreVal', this.score);
        this.setText('gameRepsVal', this.reps);
        this.setText('gameTimeVal', `${String(Math.floor(this.elapsedSeconds/60)).padStart(2,'0')}:${String(this.elapsedSeconds%60).padStart(2,'0')}`);
        const status = document.getElementById('gameStatusPill');
        if (status) {
            status.textContent = this.completed ? 'Practice complete' : this.isPaused ? 'Paused · take your time' : this.isRunning ? 'Practice in progress' : 'Ready when you are';
            status.className = 'game-status-pill ' + (this.isPaused ? 'paused' : this.isRunning ? 'active' : 'ready');
        }
        for (const [id, visible] of [['btnGameStart',!this.isRunning],['btnGamePause',this.isRunning],['btnGameStop',this.isRunning]]) {
            const button = document.getElementById(id); if(button) button.style.display = visible ? 'inline-flex' : 'none';
        }
        const nextFingerStep = this.activeGame === 'dino' && this.stage === 'instructions' && this.setupStep !== 'finger';
        const needsFinger = this.activeGame === 'dino' && !this.dinoFinger && !nextFingerStep;
        document.getElementById('btnGameStart').disabled = needsFinger;
        this.setText('btnGameStart', nextFingerStep ? 'Next: choose your finger' : needsFinger ? 'Choose a finger first' : this.completed ? 'Practice again' : this.activeGame === 'fruit' ? 'Start picking' : this.activeGame === 'balloon' ? 'Begin flight' : 'Start activity');
        this.updateDinoFingerUI();
        this.setText('btnGamePause', this.isPaused ? (this.dino.needsRetry && this.activeGame === 'dino' ? 'Try again' : 'Resume activity') : 'Pause activity');
        this.setText('gameLibraryButton', this.isRunning ? 'Finish & choose another' : 'Choose another activity');
        document.querySelectorAll('.game-select-pill').forEach(button => button.disabled = this.isRunning);
        const completion = document.getElementById('gameCompletion');
        completion.hidden = !this.completed;
        const gain = this.score - this.sessionBestAtStart;
        const result = this.score > 0 && this.score === this.bestScores[this.activeGame] && gain > 0 ? (this.sessionBestAtStart > 0 ? ` · New personal best (+${gain} points)` : ' · First personal best') : this.score > 0 && this.score === this.bestScores[this.activeGame] ? ' · Personal best matched' : '';
        this.setText('gameCompletionText', `${this.reps} movements completed · ${this.score} points · ${document.getElementById('gameTimeVal').textContent} of practice${result}`);
        for (const id of ['manualDinoControl']) document.getElementById(id).disabled = !this.isRunning || this.isPaused;
        document.querySelectorAll('#manualFruitControls button, #manualBalloonControls button').forEach(button => button.disabled = !this.isRunning || this.isPaused);
    }
    updateTelemetry(state) {
        const now = performance.now();
        this.latestSensorState = state;
        this.latestSensorAt = now;
        this.sourceIsLive = state.data_source === 'mqtt' || state.data_source === 'serial';
        this.hardwareConnected = !this.sourceIsLive || (state.data_source === 'serial' ? state.serial_connected === true : state.mqtt_connected === true);
        if (this.inputMode === 'manual') return;
        if (state.timestamp !== undefined && state.timestamp === this.lastPacketTimestamp) return;
        this.lastPacketTimestamp = state.timestamp;
        const processed = state.processed || {};
        const flex = processed.flex || {};
        for (const finger of Object.keys(this.fingerNames)) {
            if (Number.isFinite(flex[finger])) {
                this.liveFingerFlex[finger] = Math.max(0,Math.min(100,flex[finger]));
                this.fingerSeenAt[finger] = now;
            }
        }
        const fingerValues = ['thumb','index','middle','ring','pinky'].map(key => flex[key]).filter(Number.isFinite);
        const bend = processed.mean_bend_pct ?? (fingerValues.length ? fingerValues.reduce((a,b)=>a+b,0)/fingerValues.length : null);
        if (Number.isFinite(bend)) {
            this.liveGripPct = Math.max(0, Math.min(100,bend));
            this.lastTelemetryAt = this.lastFlexAt = now;
        }
        if (Number.isFinite(processed.fsr?.pressure_pct)) {
            this.liveFsrPct = Math.max(0,Math.min(100,processed.fsr.pressure_pct)); this.lastFsrAt = now;
        }
        const imu = processed.imu || {};
        // Use orientation, rather than treating one acceleration axis as an angle.
        const pitch = Number.isFinite(imu.pitch) ? imu.pitch * Math.PI / 180
            : ['acc_x','acc_y','acc_z'].every(key => Number.isFinite(imu[key]))
                && Math.hypot(imu.acc_x,imu.acc_y,imu.acc_z) > .1
                ? Math.atan2(imu.acc_y,Math.hypot(imu.acc_x,imu.acc_z)) : null;
        if (pitch !== null) {
            this.rawWristPitch = pitch;
            this.liveWristPitch = Math.atan2(Math.sin(pitch-this.wristPitchOffset),Math.cos(pitch-this.wristPitchOffset));
            this.liveWristPitchDeg = Math.round(this.liveWristPitch * 180/Math.PI);
            this.lastTelemetryAt = this.lastImuAt = now;
        }
        this.sourceIsLive = state.data_source === 'mqtt' || state.data_source === 'serial';
        this.hardwareConnected = !this.sourceIsLive || (state.data_source === "serial" ? state.serial_connected === true : state.mqtt_connected === true);
        this.updateDinoGesture();
        this.updateBiofeedbackGauges();
    }
    updateBiofeedbackGauges() {
        const handValue = this.activeGame === 'dino' ? this.dinoInputValue() : this.liveGripPct;
        this.setText('fruitGripVal', `${Math.round(handValue)}%`);
        this.setText('gameFsrVal', `${Math.round(this.liveFsrPct)}%`);
        const threshold = this.activeGame === 'dino' ? this.dinoBendThreshold : this.catchThreshold;
        const release = this.activeGame === 'dino' ? this.dinoReleaseThreshold() : Math.round(threshold * .5);
        this.setText('gameMotionLabel', this.activeGame === 'dino' ? (this.dinoFinger ? `${this.fingerNames[this.dinoFinger]} bend` : 'Choose a finger') : 'Hand closed');
        this.setText('fruitGripZone', this.activeGame === 'dino' ? (!this.dinoFinger ? 'Select a finger on the hand diagram.' : handValue >= threshold ? 'Finger bent · straighten it before the next jump' : handValue <= release ? 'Finger straight · ready to bend' : 'Keep bending gently') : this.liveGripPct >= this.catchThreshold ? 'Hand closed · ready to catch' : this.liveGripPct <= release ? 'Hand open · release' : 'Keep moving gently');
        const gripBar = document.getElementById('fruitGripBar');
        if (gripBar) gripBar.style.width = `${handValue}%`;
        const catchMark = document.querySelector('.thresh-catch');
        const releaseMark = document.querySelector('.thresh-release');
        if(catchMark) { catchMark.style.left = `${threshold}%`; catchMark.title = `Movement threshold ${threshold}%`; }
        if(releaseMark) { releaseMark.style.left = `${release}%`; releaseMark.title = `Release at ${release}%`; }
        this.setText('balloonWristVal', `${this.liveWristPitchDeg}°`);
        this.setText('balloonWristZone', this.liveWristPitchDeg > 5 ? 'Rising' : this.liveWristPitchDeg < -5 ? 'Descending' : 'Resting position');
        const wristBar = document.getElementById('balloonWristBar');
        if(wristBar) wristBar.style.width = `${Math.max(0,Math.min(100,50+this.liveWristPitchDeg/90*100))}%`;
    }
    playChime() {
        if(!this.soundEnabled) return;
        try {
            const Audio = window.AudioContext || window.webkitAudioContext;
            if (!Audio) return;
            this.audioCtx ||= new Audio();
            this.audioCtx.resume();
            const tone = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
            tone.frequency.value = 660;
            gain.gain.setValueAtTime(.05,this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(.001,this.audioCtx.currentTime+.3);
            tone.connect(gain); gain.connect(this.audioCtx.destination);
            tone.start();tone.stop(this.audioCtx.currentTime+.3);
        } catch (_) { /* Sound remains optional. */ }
    }
    renderPreview(now) {
        if (this.stage !== 'instructions') return;
        const canvas = document.getElementById('gamePreviewCanvas');
        if (!canvas?.getContext) return;
        // Render the actual game artwork on independent state: no input, scores or sessions change.
        const demo = Object.create(NeuroGloveGames.prototype);
        demo.ctx = canvas.getContext('2d');
        demo.elapsed = now / 1000;
        demo.reps = 0;
        demo.isPaused = false;
        demo.dinoGentle = false;
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const phase = reduced ? .3 : (now % 6000) / 6000;
        demo.ctx.save();
        demo.ctx.setTransform(.5,0,0,.5,0,0);
        demo.ctx.clearRect(0,0,920,520);
        if (this.activeGame === 'fruit') {
            demo.fruit = {x:460,y:phase < .35 ? 120+phase/.35*124 : phase < .6 ? 244 : 244+(phase-.6)/.4*180,isCaught:phase>=.35&&phase<.6,releasing:phase>=.6};
            demo.renderFruitGame(0,false);
        } else if (this.activeGame === 'balloon') {
            demo.balloon = {x:210+phase*320,y:230-Math.sin(phase*Math.PI*2)*70};
            demo.targetRings = [{x:530,y:230,passed:phase>.85},{x:850,y:310,passed:false}];
            demo.renderBalloonGame(0,false);
        } else {
            demo.dino = demo.createDino();
            demo.dino.phase = phase*6;
            demo.dino.height = phase>.38&&phase<.72 ? Math.sin((phase-.38)/.34*Math.PI)*115 : 0;
            demo.dino.obstacle.x = 780-phase*820;
            demo.renderDinoGame(0,false);
        }
        demo.ctx.restore();
    }
    animate(now) {
        const dt = Math.min((now-this.lastFrameTime)/1000,.05);
        this.lastFrameTime = now;
        const visible = document.getElementById('tab-games')?.classList.contains('active');
        if(visible) {
            this.renderPreview(now);
            const available = this.signalAvailable();
            if (this.inputMode === 'manual' && this.activeGame === 'balloon' && performance.now() > this.manualPulseUntil) {this.liveWristPitch = this.liveWristPitchDeg = 0;this.updateBiofeedbackGauges();}
            const playing = this.isRunning && !this.isPaused && available;
            if(playing) {
                this.elapsed += dt;
                const seconds = Math.floor(this.elapsed);
                if(seconds !== this.elapsedSeconds) { this.elapsedSeconds=seconds;this.updateUI(); }
            }
            this.setText('gameInputStatus', this.activeGame === 'dino' && !this.dinoFinger ? 'Choose your control finger' : available ? (this.inputMode === 'manual' ? 'Practice buttons · no sensor input' : this.sourceIsLive ? 'Glove connected · live movement' : 'Demo · simulated glove') : 'Sensor data unavailable · movement on hold');
            const ctx=this.ctx;
            ctx.clearRect(0,0,920,520);
            if(this.activeGame === 'fruit') this.renderFruitGame(dt,playing); else if(this.activeGame === 'balloon') this.renderBalloonGame(dt,playing); else this.renderDinoGame(dt,playing);
            let prompt = !this.isRunning ? (this.completed ? `Well done. ${this.reps} repetitions completed.` : 'Start when you feel ready.') : this.isPaused ? 'Paused. Rest your hand, then resume.' : !available ? 'Waiting for sensor data. Your activity is on hold.' : this.activeGame === 'fruit' ? (this.fruit.arriving ? 'Watch the fruit fall into the pick circle.' : this.fruit.isCaught ? 'Now open your hand to release the fruit.' : this.fruit.releasing ? 'Well done. Let your hand relax.' : 'Gently close your hand to pick the fruit.') : this.activeGame === 'balloon' ? 'Tilt your wrist gently to guide the balloon.' : this.inputMode === 'manual' ? 'Press Jump or the space bar to jump over the cactus.' : this.dinoFinger ? `Bend your ${this.fingerNames[this.dinoFinger].toLowerCase()} toward your palm to jump. Straighten it to get ready again.` : 'Choose a finger on the hand diagram to begin.';
            if (this.activeGame === 'dino' && this.dinoPickerOpen) prompt = this.dinoFinger ? `Your ${this.fingerNames[this.dinoFinger].toLowerCase()} is selected. Start when you feel ready.` : 'Choose a finger on the hand diagram to begin.';
            if (this.activeGame === 'dino' && this.dino.needsRetry) prompt = 'That’s okay. Try again whenever you feel ready.';
            if(prompt !== this.lastPrompt) {this.setText('gameMovementPrompt',prompt);this.lastPrompt=prompt;}
            if(this.isPaused || (this.isRunning && !available)) this.drawOverlay(this.isPaused ? (this.activeGame === 'dino' && this.dino.needsRetry ? 'Let’s try that again' : 'Take a moment to rest') : 'Waiting for your glove',this.isPaused ? 'Your progress is here. Continue when you feel ready.' : 'The activity will continue when sensor data returns.');
            if(this.messageTime > 0 && !this.isPaused) {
                this.messageTime -= dt;
                this.roundRect(315,24,290,42,10,'#ffffff');
                this.text(this.message,460,51,15,'#3c6546');
            }
        }
        requestAnimationFrame(this.animate);
    }
    roundRect(x,y,w,h,r,color) {const c=this.ctx;c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
    text(value,x,y,size=14,color='#426047',align='center') {const c=this.ctx;c.font=`500 ${size}px ${window.ngI18n?.fontFamily || "Poppins, Arial, sans-serif"}`;c.fillStyle=color;c.textAlign=align;c.fillText(window.ngI18n?window.ngI18n.translate(value):value,x,y);}
    ellipse(x,y,rx,ry,color) {const c=this.ctx;c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
    drawLandscape(sky=false) {
        const c=this.ctx;
        c.fillStyle=sky?'#eaf3f6':'#f0f5e9';c.fillRect(0,0,920,520);
        this.ellipse(770,88,36,36,'#f3df9c');
        [[160,82],[580,125],[860,180]].forEach(([x,y])=>{this.ellipse(x,y,53,13,'#ffffff');this.ellipse(x-12,y-10,25,17,'#ffffff');this.ellipse(x+18,y-6,23,15,'#ffffff');});
        c.fillStyle=sky?'#d7e5db':'#dce6cf';c.beginPath();c.moveTo(0,420);c.bezierCurveTo(180,300,280,420,460,365);c.bezierCurveTo(650,310,780,345,920,380);c.lineTo(920,520);c.lineTo(0,520);c.fill();
        c.fillStyle=sky?'#b8d1bd':'#c8d8b6';c.beginPath();c.moveTo(0,465);c.bezierCurveTo(250,365,400,485,620,415);c.bezierCurveTo(750,380,850,410,920,435);c.lineTo(920,520);c.lineTo(0,520);c.fill();
        if(!sky) {
            this.drawTree(90,415,.9);this.drawTree(825,425,1.1);
            for(const [x,y] of [[170,475],[720,455],[760,495],[210,430]]) {this.ellipse(x,y,3,3,'#f8f3d9');this.ellipse(x+9,y+4,2,2,'#f8f3d9');}
        }
    }
    drawActivityHeader(title, detail, unit) {
        this.roundRect(24,22,245,66,12,'#ffffffed');
        this.text(title,42,48,18,'#294b43','left');
        this.text(detail,42,71,12,'#62776e','left');
        this.roundRect(730,22,166,66,12,'#ffffffed');
        this.text(String(this.reps).padStart(2,'0'),754,54,25,'#294b43','left');
        this.text(unit,754,74,11,'#62776e','left');
    }
    drawOrchardSetting() {
        const c=this.ctx;
        c.fillStyle='#eff4e7';c.fillRect(0,0,920,520);
        this.ellipse(723,116,57,57,'#f5e8bc');
        c.fillStyle='#dbe6cc';c.beginPath();c.moveTo(0,340);c.bezierCurveTo(220,260,490,360,920,278);c.lineTo(920,520);c.lineTo(0,520);c.fill();
        for(const [x,y,s] of [[34,365,.65],[167,354,.60],[748,352,.63],[904,366,.76]]) this.drawTree(x,y,s);
        c.fillStyle='#e6ddc1';c.beginPath();c.moveTo(387,354);c.lineTo(513,354);c.lineTo(688,520);c.lineTo(213,520);c.closePath();c.fill();
        this.ellipse(84,499,208,95,'#c5d5b0');this.ellipse(848,499,209,95,'#c5d5b0');
        c.strokeStyle='#a99b79';c.lineWidth=4;
        for(const side of [0,694]) {
            for(let x=side+10;x<side+226;x+=42){c.beginPath();c.moveTo(x,407);c.lineTo(x,458);c.stroke();}
            for(const y of [420,442]){c.beginPath();c.moveTo(side,y);c.lineTo(side+226,y);c.stroke();}
        }
        for(const [x,y] of [[74,478],[154,467],[784,483],[860,459]]) {
            this.ellipse(x,y,4,4,'#fff8df');this.ellipse(x+10,y+9,3,3,'#f3cf91');
        }
        // The branch anchors the fruit visually while the pick point stays unobstructed.
        c.strokeStyle='#887656';c.lineWidth=8;c.lineCap='round';
        c.beginPath();c.moveTo(335,110);c.quadraticCurveTo(438,80,578,105);c.stroke();
        c.strokeStyle='#768a58';c.lineWidth=3;c.beginPath();c.moveTo(460,95);c.lineTo(460,119);c.stroke();
        for(const [x,y,angle] of [[359,100,-.4],[400,89,.3],[535,96,-.3],[571,103,.4]]) {
            c.fillStyle='#88a36a';c.beginPath();c.ellipse(x,y,23,9,angle,0,Math.PI*2);c.fill();
        }
    }
    drawSkySetting() {
        const c=this.ctx;
        c.fillStyle='#e8f2fa';c.fillRect(0,0,920,520);
        this.ellipse(780,130,53,53,'#f7e6b6');
        for(const [x,y,s] of [[95,140,1],[470,116,.8],[805,250,.65]]) {
            this.ellipse(x,y,62*s,17*s,'#ffffff');this.ellipse(x-18*s,y-14*s,30*s,25*s,'#ffffff');this.ellipse(x+21*s,y-9*s,27*s,21*s,'#ffffff');
        }
        c.fillStyle='#c6dce7';c.beginPath();c.moveTo(0,432);c.lineTo(145,304);c.lineTo(290,409);c.lineTo(462,274);c.lineTo(652,414);c.lineTo(795,319);c.lineTo(920,407);c.lineTo(920,520);c.lineTo(0,520);c.fill();
        c.fillStyle='#f1f6f8';c.beginPath();c.moveTo(417,313);c.lineTo(462,274);c.lineTo(511,310);c.lineTo(479,306);c.lineTo(457,318);c.lineTo(441,307);c.fill();
        c.fillStyle='#9fbdc7';c.beginPath();c.moveTo(0,459);c.bezierCurveTo(230,383,305,474,502,415);c.bezierCurveTo(680,366,830,445,920,410);c.lineTo(920,520);c.lineTo(0,520);c.fill();
        c.fillStyle='#cbdfe5';c.beginPath();c.moveTo(300,520);c.bezierCurveTo(550,455,420,460,640,428);c.lineTo(694,428);c.bezierCurveTo(500,475,662,480,620,520);c.fill();
        for(const [x,y] of [[54,480],[88,470],[833,466],[868,483]]) {
            c.fillStyle='#739c95';c.beginPath();c.moveTo(x,y-27);c.lineTo(x-12,y);c.lineTo(x+12,y);c.closePath();c.fill();
        }
    }
    drawTree(x,y,scale) {
        const c=this.ctx;c.save();c.translate(x,y);c.scale(scale,scale);
        this.roundRect(-9,-170,18,170,5,'#a79270');
        c.strokeStyle='#a79270';c.lineWidth=9;c.beginPath();c.moveTo(0,-90);c.lineTo(-38,-140);c.moveTo(0,-100);c.lineTo(35,-170);c.stroke();
        this.ellipse(-38,-182,58,65,'#aac295');this.ellipse(33,-202,65,74,'#9eb989');this.ellipse(0,-247,59,65,'#b4cba2');
        [[-45,-180],[28,-218],[5,-260]].forEach(([a,b])=>this.drawApple(a,b,10));c.restore();
    }
    drawApple(x,y,r) {
        const c=this.ctx;c.save();c.translate(x,y);
        c.strokeStyle='#78694a';c.lineWidth=Math.max(2,r*.09);c.beginPath();c.moveTo(0,-r*.55);c.quadraticCurveTo(-2,-r*1.12,4,-r*1.2);c.stroke();
        c.fillStyle='#6c9157';c.beginPath();c.ellipse(r*.25,-r*.9,r*.31,r*.13,-.45,0,Math.PI*2);c.fill();
        c.fillStyle='#ce765b';c.beginPath();c.moveTo(0,-r*.7);c.bezierCurveTo(-r*.9,-r*1.12,-r*1.2,-r*.15,-r*.72,r*.56);c.bezierCurveTo(-r*.4,r*1.05,-r*.15,r*.77,0,r*.82);c.bezierCurveTo(r*.4,r*1,r*.93,r*.6,r*.96,-r*.1);c.bezierCurveTo(r*.98,-r*.7,r*.4,-r*.95,0,-r*.7);c.fill();
        this.ellipse(-r*.4,-r*.3,r*.12,r*.27,'#e4a18a');c.restore();
    }
    drawBasket(x,y) {
        const c=this.ctx;c.save();c.translate(x,y);
        this.ellipse(0,52,90,12,'#53754218');
        c.fillStyle='#b58b5c';c.beginPath();c.moveTo(-76,0);c.lineTo(-58,62);c.quadraticCurveTo(0,75,58,62);c.lineTo(76,0);c.closePath();c.fill();
        c.save();c.clip();c.strokeStyle='#d9b887';c.lineWidth=3;
        for(let a=-80;a<90;a+=17){c.beginPath();c.moveTo(a,-2);c.lineTo(a+7,75);c.stroke();}
        for(let a=15;a<65;a+=14){c.beginPath();c.moveTo(-80,a);c.lineTo(80,a);c.stroke();}c.restore();
        this.roundRect(-81,-4,162,12,5,'#98724c');
        this.roundRect(-42,21,84,25,4,'#f5ead4');this.text('BASKET',0,38,10,'#795c3c');c.restore();
    }
    renderFruitGame(dt,playing) {
        this.drawOrchardSetting();
        const c=this.ctx,f=this.fruit;
        this.drawActivityHeader('The Orchard','One gentle movement at a time','FRUIT COLLECTED');
        this.ellipse(460,268,104,20,'#64874c18');
        this.ellipse(460,244,83,83,f.isCaught?'#e0ecd7':'#ffffffb8');
        c.strokeStyle=f.isCaught?'#4c7956':'#789c68';c.lineWidth=3;c.setLineDash(f.isCaught?[]:[7,8]);c.beginPath();c.arc(460,244,83,0,Math.PI*2);c.stroke();c.setLineDash([]);
        this.text(f.isCaught?'Fruit picked':'Pick point',460,351,15,'#45613d');
        this.drawBasket(460,425);
        for(let i=0;i<Math.min(this.reps,5);i++) this.drawApple(412+i*24,425-(i%2)*7,15);
        if(playing) {
            if(f.releasing) {
                f.y += 210*dt;
                if(f.y >= 424) {
                    this.score+=10;this.reps++;this.playChime();
                    this.message='A good movement. Well done.';this.messageTime=2;
                    this.fruit={x:460,y:108,isCaught:false,releasing:false,arriving:true};this.updateUI();
                }
            } else if(f.isCaught) {
                if(this.liveGripPct <= this.catchThreshold*.5) { f.isCaught=false;f.releasing=true; }
            } else if(f.arriving) {
                // Each round begins with a visible, gentle fall from the branch.
                // The fruit settles at the pick point and then waits for the patient.
                f.y=Math.min(244,f.y+150*dt);
                if(f.y>=244) f.arriving=false;
            } else {
                f.y=244;
                if(this.liveGripPct>=this.catchThreshold) {f.isCaught=true;this.playChime();}
            }
        }
        this.drawApple(f.x,f.y,40);
        const releasing=f.isCaught||f.releasing;
        this.roundRect(24,263,236,102,12,'#ffffffed');
        this.text(releasing?'02 / RELEASE':f.arriving?'READY':'01 / PICK',42,289,12,'#6a805e','left');
        this.text(releasing?'Gently open your hand':f.arriving?'Watch the fruit fall':'Gently close your hand',42,318,16,'#304f38','left');
        this.text(releasing?'Place the fruit in the basket.':f.arriving?'It will stop at the circle.':'The fruit will wait for you.',42,343,12,'#657660','left');
        c.strokeStyle='#8eaa79';c.lineWidth=2;c.setLineDash([4,7]);c.beginPath();c.moveTo(460,366);c.lineTo(460,400);c.stroke();c.setLineDash([]);

    }
    renderBalloonGame(dt,playing) {
        this.drawSkySetting();
        this.drawActivityHeader('Sky Journey','Find your height. Float through.','RINGS REACHED');
        const b=this.balloon,c=this.ctx;
        if(playing) {
            const input=Math.abs(this.liveWristPitch)<.04 ? 0 : Math.max(-.65,Math.min(.65,this.liveWristPitch));
            // Position control: the next rendered frame follows the current
            // measured wrist angle instead of accumulating a slow velocity.
            b.y=Math.max(105,Math.min(360,260-input*300*this.wristSensitivity));
        }
        const next=this.targetRings.filter(r=>!r.passed).sort((a,b)=>a.x-b.x)[0];
        if(next) {
            const delta=b.y-next.y;
            const aligned=Math.abs(delta)<38;
            c.strokeStyle=aligned?'#75a992':'#96b4c4';c.lineWidth=2;c.setLineDash([5,9]);c.beginPath();c.moveTo(b.x+56,b.y);c.quadraticCurveTo((b.x+next.x)/2,next.y,next.x,next.y);c.stroke();c.setLineDash([]);
            this.roundRect(24,436,284,60,12,'#fffffff0');
            this.text(aligned?'Hold steady':delta>0?'Tilt up to rise':'Tilt down to descend',42,461,17,'#34586c','left');
            this.text(aligned?'Stay inside the ring for a moment.':'Small wrist movements are enough.',42,483,12,'#657e8c','left');
        }
        this.targetRings.forEach(ring=>{
            if(playing) {
                // Only the next target approaches; the others stay spaced behind it.
                if (ring.passed) {
                    ring.x -= 150*dt;
                    if (ring.x < -60) {
                        ring.x = Math.max(920,...this.targetRings.filter(r=>r!==ring).map(r=>r.x+340));
                        ring.y = b.y < 235 ? 300 : 155;
                        ring.passed = false;
                        ring.hold = 0;
                    }
                } else if (ring === next) {
                    ring.x = Math.max(b.x,ring.x-65*dt);
                    const inPosition = Math.abs(ring.x-b.x)<22 && Math.abs(ring.y-b.y)<38;
                    ring.hold = inPosition ? (ring.hold || 0)+dt : 0;
                    if (ring.hold >= .4) {
                        ring.passed=true;ring.hold=0;this.score+=15;this.reps++;
                        this.playChime();this.message='Ring reached. Well done.';this.messageTime=2;this.updateUI();
                    }
                } else {
                    ring.x = Math.max(next ? next.x+340 : 920,ring.x-65*dt);
                    ring.hold = 0;
                }
            }
            if(ring===next) {this.ellipse(ring.x,ring.y,38,69,'#ffffff70');this.text('NEXT RING',ring.x,ring.y-83,12,'#41677b');}
            c.strokeStyle=ring.passed?'#4b9278':'#ad8140';c.lineWidth=9;c.beginPath();c.ellipse(ring.x,ring.y,28,59,0,0,Math.PI*2);c.stroke();
            c.strokeStyle=ring.passed?'#b8dcc7':'#f9dda4';c.lineWidth=3;c.beginPath();c.ellipse(ring.x-2,ring.y,28,59,0,0,Math.PI*2);c.stroke();
            if(ring.passed) this.text('✓',ring.x,ring.y+8,25,'#367d61');
        });
        this.drawBalloon(b.x,b.y);

    }
    drawBalloon(x,y) {
        const c=this.ctx;c.save();c.translate(x,y);
        c.strokeStyle='#8f8267';c.lineWidth=2;c.beginPath();c.moveTo(-22,32);c.lineTo(-14,66);c.moveTo(22,32);c.lineTo(14,66);c.stroke();
        this.ellipse(0,-5,47,59,'#3e7897');this.ellipse(0,-5,31,59,'#8bb6ca');this.ellipse(0,-5,13,59,'#f3e5c8');
        this.roundRect(-17,64,34,23,4,'#947450');this.roundRect(-20,62,40,6,2,'#b1966b');c.restore();
    }
    createDino(obstacleX = 650) {
        return {height:0,velocity:0,phase:0,needsRetry:false,obstacle:{x:obstacleX,width:27,height:42,committed:false,scored:false}};
    }
    dinoInputValue() {
        if (!this.dinoFinger || !Number.isFinite(this.liveFingerFlex[this.dinoFinger])) return 0;
        // The backend calibration already maps raw ADC direction to 0=open, 100=bent.
        return Math.max(0,Math.min(100,this.liveFingerFlex[this.dinoFinger]-(this.dinoRestFlex||0)));
    }
    dinoReleaseThreshold() { return Math.max(2, this.dinoBendThreshold - 5); }
    updateDinoGesture() {
        if (this.activeGame !== 'dino' || this.inputMode !== 'sensor' || !this.dinoFinger || !this.signalAvailable() || !this.isRunning || this.isPaused || this.dinoPickerOpen) return;
        // A relaxed finger is not always calibrated to exactly zero. Track its
        // lower resting position automatically and trigger on added flexion.
        this.dinoRestFlex=Math.min(this.dinoRestFlex||0,this.liveFingerFlex[this.dinoFinger]);
        const value = this.dinoInputValue();
        if (value <= this.dinoReleaseThreshold()) this.dinoArmed = true;
        if (value >= this.dinoBendThreshold && this.dinoArmed) {
            if(this.requestDinoJump())this.dinoArmed = false;
        }
    }
    requestDinoJump() {
        if (this.activeGame !== 'dino' || !this.dinoFinger || this.dinoPickerOpen || !this.isRunning || this.isPaused || this.dino.height > 0 || this.dino.needsRetry) return false;
        this.dino.velocity = 430;
        this.dino.height = .1;
        if (this.dino.obstacle.x <= 330) this.dino.obstacle.committed = true;
        return true;
    }
    updateDino(dt) {
        const d = this.dino, obstacle = d.obstacle, step = dt * this.dinoPace;
        d.phase += step;
        if (d.height > 0 || d.velocity > 0) {
            d.height += d.velocity * step - 330 * step * step;
            d.velocity -= 660 * step;
            if (d.height <= 0) {d.height = 0; d.velocity = 0;}
        }
        obstacle.x -= 150 * step;
        if (this.dinoGentle && !obstacle.committed) obstacle.x = Math.max(310,obstacle.x);
        const overlaps = obstacle.x < 230 && obstacle.x + obstacle.width > 178;
        if (overlaps && d.height < obstacle.height + 5) {
            d.needsRetry = true; this.isPaused = true; this.updateUI(); return;
        }
        if (obstacle.x + obstacle.width < 165 && !obstacle.scored) {
            obstacle.scored = true; this.reps++; this.score += 10;
            this.message = 'A good jump. Well done.'; this.messageTime = 1.6;
            this.playChime();this.updateUI();
        }
        if (obstacle.x < -50) d.obstacle = {x:920,width:27,height:36 + Math.floor(Math.random()*12),committed:false,scored:false};
    }
    drawKangaroo(x,ground,height,phase) {
        const c = this.ctx, airborne = height > 0;
        const bob = airborne ? 0 : Math.abs(Math.sin(phase*7))*2;
        c.save();c.translate(x,ground-height-bob);
        // Long balancing tail, strong haunches, small arms and upright ears.
        c.fillStyle='#a67b50';
        c.beginPath();c.moveTo(34,-32);c.bezierCurveTo(20,-22,11,-8,-20,-5);c.bezierCurveTo(5,-1,30,-8,46,-18);c.closePath();c.fill();
        c.save();c.translate(44,-40);c.rotate(.26);this.ellipse(0,0,17,27,'#bd9162');c.restore();
        this.ellipse(49,-39,9,18,'#e8cda5');
        c.fillStyle='#bd9162';c.beginPath();c.moveTo(44,-58);c.lineTo(49,-77);c.quadraticCurveTo(57,-83,64,-76);c.lineTo(76,-69);c.quadraticCurveTo(78,-63,70,-62);c.lineTo(58,-62);c.lineTo(54,-49);c.closePath();c.fill();
        c.save();c.translate(53,-79);c.rotate(-.2);this.ellipse(0,-10,4,14,'#bd9162');this.ellipse(0,-10,1.7,9,'#e8cda5');c.restore();
        c.save();c.translate(61,-78);c.rotate(.18);this.ellipse(0,-10,3.7,13,'#bd9162');this.ellipse(0,-10,1.5,8,'#e8cda5');c.restore();
        this.ellipse(66,-73,1.8,2,'#35382b');this.ellipse(76,-66,2.2,2,'#534331');
        c.strokeStyle='#a67b50';c.lineWidth=5;c.lineCap='round';
        c.beginPath();c.moveTo(53,-51);c.lineTo(62,-41);c.lineTo(68,-43);c.stroke();
        this.ellipse(36,-22,14,17,'#ad8053');
        c.strokeStyle='#976b44';c.lineWidth=7;
        c.beginPath();c.moveTo(40,-20);c.lineTo(airborne?54:47,airborne?-14:-5);c.lineTo(airborne?65:66,airborne?-15:-4);c.stroke();
        c.strokeStyle='#bd9162';c.lineWidth=6;
        c.beginPath();c.moveTo(33,-18);c.lineTo(airborne?45:38,airborne?-8:-3);c.lineTo(airborne?59:57,airborne?-7:-3);c.stroke();
        c.restore();
    }
    drawCactus(x,ground,height) {
        const c=this.ctx; c.fillStyle='#87957b';
        c.fillRect(x+10,ground-height,9,height);
        c.fillRect(x,ground-height+14,7,17);
        c.fillRect(x+2,ground-height+25,13,7);
        c.fillRect(x+21,ground-height+8,6,17);
        c.fillRect(x+16,ground-height+20,11,6);
        c.fillStyle='#a8b39a';c.fillRect(x+12,ground-height+4,2,height-6);
    }
    renderDinoGame(dt,playing) {
        const c=this.ctx,ground=400;
        c.fillStyle='#f7f8f2';c.fillRect(0,0,920,520);
        this.text('KANGAROO HOP',460,44,12,'#78836d');
        // Quiet desert scenery leaves the kangaroo and obstacle easy to distinguish.
        this.ellipse(764,120,31,31,'#eee8c8');
        c.strokeStyle='#d8dfd0';c.lineWidth=2;
        for(const [x,y] of [[135,125],[490,175],[795,220]]) {
            c.beginPath();c.moveTo(x,y);c.lineTo(x+12,y);c.bezierCurveTo(x+14,y-20,x+39,y-20,x+43,y-8);c.bezierCurveTo(x+60,y-13,x+69,y-3,x+68,y);c.lineTo(x+81,y);c.stroke();
        }
        c.fillStyle='#edf0e5';c.beginPath();c.moveTo(0,400);c.lineTo(0,375);c.bezierCurveTo(200,335,250,395,420,370);c.bezierCurveTo(620,320,750,370,920,345);c.lineTo(920,400);c.closePath();c.fill();
        c.strokeStyle='#aebca0';c.lineWidth=2;c.beginPath();c.moveTo(0,ground);c.lineTo(920,ground);c.stroke();
        if(playing) this.updateDino(dt);
        const d=this.dino,offset=(d.phase*150)%70;
        c.fillStyle='#cbd3bf';
        for(let x=-offset;x<920;x+=70){c.fillRect(x,ground+13,12,2);c.fillRect(x+30,ground+28,5,2);}
        this.ellipse(198,ground+5,38,5,'#6a7e5020');
        this.drawKangaroo(165,ground,d.height,d.phase);
        this.drawCactus(d.obstacle.x,ground,d.obstacle.height);
        if(this.dinoGentle && !d.obstacle.committed && d.obstacle.x<=311 && !this.isPaused) {
            c.strokeStyle='#c7d4bb';c.setLineDash([4,5]);c.beginPath();c.moveTo(290,ground-85);c.lineTo(290,ground-12);c.stroke();c.setLineDash([]);
            this.text('Waiting for your jump',460,460,16,'#627654');
        } else this.text('One jump, then relax.',460,460,14,'#75816c');
    }
    drawOverlay(title,description) {
        const c=this.ctx;c.fillStyle='#f4f7f0c9';c.fillRect(0,0,920,520);
        this.roundRect(205,192,510,126,14,'#fff');this.text(title,460,242,22,'#365539');this.text(description,460,280,13,'#71806d');
    }
}
let neuroGames = null;
document.addEventListener('DOMContentLoaded',()=>{neuroGames=new NeuroGloveGames('gameCanvas');});
