/** Patient-led open/close calibration. Only the Pi captures and saves readings. */
class GlovePersonalisationDialog {
    constructor(){
        this.dialog=document.getElementById('glovePersonalisationDialog');
        this.canvas=document.getElementById('gloveSetupAnimation');
        this.hand=null;
        const reading=document.createElement('p');reading.id='gloveSetupLiveReadings';reading.className='glove-setup-live';reading.setAttribute('aria-live','off');
        this.node('gloveSetupDescription').after(reading);
        const done=this.dialog.querySelector('[data-step="done"]');
        const release=document.createElement('li');release.dataset.step='release';
        const number=document.createElement('span');number.textContent='5';
        const label=document.createElement('strong');label.textContent='Release pressure';
        release.append(number,label);done.before(release);done.querySelector('span').textContent='6';
        this.generation=0;this.frame=null;this.id=null;this.busy=false;this.stage='open';
        this.dialog.addEventListener('close',()=>this.cleanup());
    }
    node(id){return document.getElementById(id);}
    text(id,value){const e=this.node(id);if(e)e.textContent=value;}
    async request(action,data={},signal){
        const response=await fetch(`/api/glove-personalisation/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal});
        const result=await response.json();
        if(!response.ok){const error=new Error(result.error||'Unable to take readings. Check the connection and try again.');error.fingers=result.fingers;throw error;}
        return result;
    }
    async open(){
        if(typeof neuroGames!=='undefined'&&neuroGames?.isRunning&&!neuroGames.isPaused)neuroGames.pauseGame();
        const generation=++this.generation;
        this.id=null;this.stage='open';this.busy=true;this.connecting=true;this.error='';
        if(!this.dialog.open)this.dialog.showModal();
        if(!this.hand&&typeof MirrorHandVisualizer!=='undefined'){
            this.hand=new MirrorHandVisualizer('gloveSetupAnimation',{cameraDistance:138,fitSmallPanels:false,interactive:false,isVisible:()=>this.dialog.open});
            this.hand.setCameraPreset('palm');
            this.hand.targetEmg=0;this.hand.targetFsr=0;
        }
        this.hand?.onResize();
        this.render();this.animate(performance.now());
        this.pollReadings(generation);
        try{
            const result=await this.request('start');
            if(generation!==this.generation||!this.dialog.open){this.request('cancel',{id:result.id}).catch(()=>{});return;}
            this.id=result.id;this.duration=result.duration_seconds*1000;
        }catch(error){if(generation===this.generation)this.error=error.message;}
        if(generation===this.generation){this.busy=false;this.connecting=false;this.render();this.node('gloveSetupAction').focus();}
    }
    async advance(){
        if(this.busy)return;
        if(this.stage==='done'){this.close();return;}
        if(!this.id){this.open();return;}
        const generation=this.generation;
        this.busy=true;this.error='';this.started=performance.now();this.controller=new AbortController();this.render();
        this.animate(performance.now());
        try{
            const result=await this.request('capture',{id:this.id,pose:this.stage},this.controller.signal);
            if(generation!==this.generation)return;
            this.stage=result.stage;
            if(result.calibration)this.syncCalibration(result.calibration);
        }catch(error){
            if(generation!==this.generation||error.name==='AbortError')return;
            this.error=error.message;
            if(error.fingers?.length){const labels={thumb:'Thumb',index:'Index finger',middle:'Middle finger',ring:'Ring finger',pinky:'Little finger'};this.errorFingers=error.fingers.map(f=>labels[f]||f);}
        }finally{
            if(generation===this.generation){this.busy=false;this.controller=null;this.render();}
        }
    }
    syncCalibration(calibration){
        for(const [finger,prefix] of Object.entries({thumb:'Thumb',index:'Index',middle:'Middle',ring:'Ring',pinky:'Pinky'})){
            for(const [suffix,key] of [['Min','min_adc'],['Max','max_adc']]){
                const input=this.node(`calib${prefix}${suffix}`);if(input)input.value=calibration.flex[finger][key];
            }
        }
        for(const [id,key] of [['calibFsrBaseline','fsr_baseline'],['calibFsrMax','fsr_max_raw'],['calibFsrThresh','fsr_contact_threshold']]){
            const input=this.node(id);if(input)input.value=calibration[key];
        }
    }
    async pollReadings(generation){
        try{
            const response=await fetch('/api/status',{cache:'no-store'}),state=await response.json();
            if(generation!==this.generation||!this.dialog.open)return;
            const raw=state.raw_sensors||{},flex=raw.flex||{};
            const pressureStep=['fsr','release'].includes(this.stage);
            this.text('gloveSetupLiveReadings',pressureStep?`Pressure sensor: ${raw.fsr?.pressure??'—'} ADC`:
                ['thumb','index','middle','ring','pinky'].map((f,i)=>`${['Thumb','Index','Middle','Ring','Little'][i]}: ${flex[f]??'—'}`).join(' · '));
        }catch(_){this.text('gloveSetupLiveReadings','Waiting for sensor readings…');}
        if(generation===this.generation&&this.dialog.open)this.readingTimer=setTimeout(()=>this.pollReadings(generation),300);
    }
    render(){
        const done=this.stage==='done',closed=this.stage==='closed',rest=this.stage==='rest',fsr=this.stage==='fsr',release=this.stage==='release';
        this.dialog.dataset.stage=this.stage;
        if(this.hand){
            // Each step has a fixed anatomical pose; only the timeline animates.
            const pose=fsr?{thumb:.55,index:.5,middle:.55,ring:.55,pinky:.6}:closed?this.hand.poses.close:rest?{thumb:.18,index:.14,middle:.16,ring:.18,pinky:.2}:this.hand.poses.open;
            this.hand.currentBends ||= {};
            for(const finger of ['thumb','index','middle','ring','pinky'])this.hand.currentBends[finger]=this.hand.targetBends[finger]=pose[finger];
        }
        this.text('gloveSetupStepLabel',done?'PERSONALISATION COMPLETE':release?'STEP 5 OF 5':fsr?'STEP 4 OF 5':rest?'STEP 3 OF 5':closed?'STEP 2 OF 5':'STEP 1 OF 5');
        this.text('gloveSetupHeading',this.connecting?'Connecting to your glove…':done?'Your glove is personalised':rest?'Let your hand rest naturally':closed?'Gently close your hand':'Keep your hand open');
        this.text('gloveSetupDescription',done?'Your dashboard is now adjusted to your hand. You’re ready to begin.':rest?'Relax your fingers in their natural position. Support your wrist and hold still. You do not need to straighten or close your hand.':closed?'Make a comfortable fist with all five fingers. Keep your wrist relaxed and hold still.':'Straighten all five fingers comfortably. Rest your wrist and keep your hand still.');
        this.text('gloveSetupPoseLabel',done?'Ready for your hand':rest?'Rest naturally':closed?'Close gently':'Open and relax');
        this.node('gloveSetupConfirmation').hidden=!closed&&!rest;
        this.text('gloveSetupConfirmation',rest?'Open and closed readings captured.':'Open-hand readings captured.');
        this.node('gloveSetupProgress').hidden=!this.busy||this.connecting;
        this.node('gloveSetupRestart').hidden=(!closed&&!rest&&!fsr&&!release)||this.busy;
        this.node('gloveSetupAction').disabled=this.busy;
        this.text('gloveSetupAction',this.connecting?'Connecting…':this.busy?'Taking readings…':done?'Back to dashboard':!this.id?'Reconnect glove':rest?'Capture resting position':closed?'Capture closed hand':'Capture open hand');
        if(rest)this.text('gloveSetupDescription','Rest your fingers naturally with no pressure on the FSR. Do not hold the ball yet. Keep your wrist still.');
        if(fsr){
            this.text('gloveSetupHeading','Hold a soft ball and squeeze');
            this.text('gloveSetupDescription','Place a soft ball against the pressure sensor in your palm. Squeeze firmly but comfortably and keep the same pressure for 3 seconds. This sets your personal pressure range.');
            this.text('gloveSetupPoseLabel','Hold steady pressure');
            this.node('gloveSetupConfirmation').hidden=false;
            this.text('gloveSetupConfirmation','Finger and resting-pressure readings captured.');
            if(!this.busy&&!this.connecting)this.text('gloveSetupAction','Capture grip pressure');
        }
        if(release){
            this.text('gloveSetupHeading','Release the ball completely');
            this.text('gloveSetupDescription','Remove the ball from the sensor. Relax your hand without pressing your palm. We will check that pressure returns to rest before saving.');
            this.text('gloveSetupPoseLabel','Release all pressure');
            this.node('gloveSetupConfirmation').hidden=false;
            this.text('gloveSetupConfirmation','Squeeze captured. Check the release to finish.');
            if(!this.busy&&!this.connecting)this.text('gloveSetupAction','Verify release and save');
        }
        this.node('gloveSetupError').hidden=!this.error;
        const translate=value=>window.ngI18n?.translate(value)??value;
        this.text('gloveSetupError',this.error?translate(this.error)+(this.errorFingers?.length?' '+this.errorFingers.map(translate).join(', '):''):'');
        this.errorFingers=null;
        this.dialog.querySelectorAll('[data-step]').forEach(item=>{
            const step=item.dataset.step;
            if(step===this.stage)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');
            item.classList.toggle('complete',['open','closed','rest','fsr','release','done'].indexOf(step)<['open','closed','rest','fsr','release','done'].indexOf(this.stage));
        });
    }
    animate(now){
        if(this.frame!==null)cancelAnimationFrame(this.frame);
        if(!this.dialog.open){this.frame=null;return;}
        if(this.busy&&!this.connecting){
            const percent=Math.min(95,Math.max(0,(now-this.started)/(this.duration||3000)*95));
            this.node('gloveSetupProgressFill').style.width=`${percent}%`;
            this.node('gloveSetupProgressTrack').setAttribute('aria-valuenow',String(Math.round(percent)));
        }
        this.frame=this.busy&&!this.connecting?requestAnimationFrame(t=>{this.frame=null;this.animate(t);}):null;
    }
    restart(){if(this.busy)return;const id=this.id;if(id)this.request('cancel',{id}).catch(()=>{});this.open();}
    close(){this.dialog.close();}
    cleanup(){
        clearTimeout(this.readingTimer);
        this.generation++;this.controller?.abort();this.controller=null;
        if(this.frame!==null)cancelAnimationFrame(this.frame);this.frame=null;
        if(this.id)this.request('cancel',{id:this.id}).catch(()=>{});
        this.id=null;this.busy=false;
    }
}
let glovePersonalisation=null;
document.addEventListener('DOMContentLoaded',()=>{glovePersonalisation=new GlovePersonalisationDialog();});
