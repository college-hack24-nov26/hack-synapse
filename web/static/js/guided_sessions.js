/** Guided practice UI. Scores and session clocks come exclusively from the server. */
class GuidedPractice {
    constructor() {
        this.catalog=[];this.exercise='grasp_release';this.source=window.ACTIVE_DATA_SOURCE||'mqtt';this.session=null;this.busy=false;this.historyRequest=0;this.lastResultId=null;
        this.byId('gpStart').addEventListener('click',()=>this.start());
        this.byId('gpPause').addEventListener('click',()=>this.pause());
        this.byId('gpFinish').addEventListener('click',()=>this.finish());
        // gpHistorySource dropdown removed: source tracks settings data_source
        this.byId('gpHistoryRange')?.addEventListener('change',()=>{if(this.history)this.renderHistory(this.history);});
        this.video=this.byId('guidedDemoVideo');
        this.video.addEventListener('error',()=>{if(this.video.getAttribute('src'))this.byId('gpVideoError').hidden=false;});
        this.video.addEventListener('loadeddata',()=>this.byId('gpVideoError').hidden=true);
        document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.session?.active&&this.session.status==='active')this.pause();});
        setInterval(()=>{if(this.session?.active&&!document.hidden&&this.byId('tab-exercises').classList.contains('active'))this.request('/api/guided/heartbeat',{session_id:this.session.id}).catch(()=>{});},3000);
        this.activityLabels=new Map();
        setInterval(()=>this.renderActivity(),60000);
        this.byId('langSelect')?.addEventListener('change',()=>this.renderActivity());
        this.init();
    }
    byId(id){return document.getElementById(id);}
    text(id,value){const e=this.byId(id);if(e&&e.textContent!==String(value))e.textContent=value;}
    percent(value){return Number.isFinite(value)?`${value.toFixed(1)}%`:'—';}
    time(seconds){return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;}
    async request(path,body){const response=await fetch(path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error||'The request could not be completed.');return data;}
    async init(){try{
        const data=await this.request('/api/guided/exercises');this.catalog=data.exercises;
        const group=this.byId('gpExercises');
        this.catalog.forEach((item,index)=>{
            const card=document.createElement('article');card.className='gp-exercise-card';
            const button=document.createElement('button');button.type='button';button.dataset.exercise=item.id;button.className='gp-card-open';
            const n=document.createElement('span');n.className='gp-card-number';n.textContent=`0${index+1}`;
            const title=document.createElement('strong');title.textContent=item.name;
            const description=document.createElement('p');description.textContent=item.description;
            const action=document.createElement('small');action.textContent='How to practise →';
            const preview=document.createElement('canvas');preview.className='gp-card-preview';preview.width=240;preview.height=288;preview.setAttribute('aria-hidden','true');
            if(typeof ExerciseCardPreview!=='undefined')new ExerciseCardPreview(preview,card,item.id);
            const last=document.createElement('span');last.className='gp-card-last';last.setAttribute('data-no-translate','');this.activityLabels.set(item.id,last);
            button.append(n,title,description,action,preview);button.addEventListener('click',()=>this.openInstructions(item.id));
            const graph=document.createElement('button');graph.type='button';graph.className='gp-card-progress';graph.textContent='View progress';graph.addEventListener('click',()=>this.openProgress(item.id));
            const footer=document.createElement('div');footer.className='gp-card-footer';footer.append(graph,last);
            card.append(button,footer);group.append(card);
        });
        this.renderActivity();this.select(this.exercise);if(this.lastState)this.updateTelemetry(this.lastState);
    }catch(error){this.text('gpFeedback',error.message+' Refresh to retry.');}}
    activityText(timestamp,now=Date.now()){
        const lang=typeof currentLang==='string'?currentLang:'en';
        const date=Date.parse(timestamp||'');
        if(!Number.isFinite(date))return {text:{en:'Not practised yet',hi:'अभी अभ्यास नहीं किया',mr:'अद्याप सराव केलेला नाही'}[lang]||'Not practised yet',title:''};
        const seconds=Math.max(0,(now-date)/1000);
        const unit=seconds<3600?'minute':seconds<86400?'hour':'day';
        const amount=Math.floor(seconds/(unit==='minute'?60:unit==='hour'?3600:86400));
        const relative=seconds<60?{en:'Just now',hi:'अभी',mr:'आत्ताच'}[lang]:new Intl.RelativeTimeFormat(lang,{numeric:'always',style:'short'}).format(-amount,unit);
        const prefix={en:'Last practised',hi:'पिछला अभ्यास',mr:'शेवटचा सराव'}[lang]||'Last practised';
        return {text:`${prefix} · ${relative}`,title:new Date(date).toLocaleString(lang)};
    }
    renderActivity(){
        if(!this.activityLabels)return;
        for(const item of this.catalog){const label=this.activityLabels.get(item.id);if(!label)continue;const value=this.activityText(item.last_practised_at);label.textContent=value.text;label.setAttribute('title',value.title);}
    }
    async refreshActivity(){
        try{const data=await this.request('/api/guided/exercises');for(const item of this.catalog)item.last_practised_at=data.exercises.find(e=>e.id===item.id)?.last_practised_at;this.renderActivity();}catch(_){/* Existing timestamps remain visible while offline. */}
    }
    setView(view){
        this.view=view;this.byId('tab-exercises').setAttribute('data-view',view);
        if(view==='session'&&typeof requestAnimationFrame==='function')requestAnimationFrame(()=>{if(typeof exerciseMirrorHand!=='undefined')exerciseMirrorHand?.onResize();});
    }
    showLibrary(){if(this.session?.active)return;this.video.pause();this.demoHand?.stop();this.setView('library');}
    openInstructions(id){
        if(this.session?.active)return;
        this.select(id);const item=this.catalog.find(e=>e.id===id);if(!item)return;
        this.text('gpInstructionsTitle',item.name);this.text('gpInstructionsDescription',item.description);
        const steps={
            grasp_release:['Rest your forearm on a comfortable surface.','Slowly close all five fingers, then hold briefly.','Open your hand again and relax. Repeat at your own pace.'],
            individual_fingers:['Support your hand. Nearby fingers may move naturally.','Bend the named finger to at least 75% of its target, then relax it.','Complete thumb, index, middle, ring and little finger. All five earn one round.'],
            thumb_opposition:['Keep your hand relaxed with your palm facing up.','Move your thumb gently toward one fingertip at a time.','Return your thumb to rest after each movement.'],
            wrist_flexion:['Support your forearm and keep your hand relaxed.','Slowly lift your wrist, then return to the centre.','Lower your wrist gently, then return to the centre.'],
            forearm_rotation:['Rest your elbow and keep your wrist comfortable.','Turn your palm upward, then return to the centre.','Turn your palm downward, then return to the centre.'],
            grip_pressure:['Hold a soft object against the grip sensor.','Aim for a comfortable 25–65% pressure and hold briefly. A stronger squeeze still counts.','Release the pressure completely and relax before repeating.']
        };
        const list=this.byId('gpInstructionsSteps');list.replaceChildren();
        (steps[id]||item.steps||[]).forEach(text=>{const li=document.createElement('li');li.textContent=text;list.append(li);});
        this.byId('gpInstructions').showModal?.();
    }
    closeInstructions(){this.byId('gpInstructions').close?.();}
    startDemonstration(){if(this.exercise!=='grasp_release'&&typeof ExerciseHandDemonstration!=='undefined'){if(!this.demoHand)this.demoHand=new ExerciseHandDemonstration(this.byId('gpAnimatedDemo'));this.demoHand.start(this.exercise);}}
    enterSession(){this.closeInstructions();this.setView('session');if(!this.video.hidden)this.video.play().catch(()=>{});this.startDemonstration();}
    openProgress(id=this.exercise){
        if(this.session?.active&&id!==this.exercise)return;
        if(id!==this.exercise)this.select(id);
        this.text('gpProgressExercise',this.catalog.find(e=>e.id===id)?.name||'Your progress');
        this.loadHistory();this.byId('gpProgressDialog').showModal?.();
    }
    select(id,recover=false){
        if(this.session?.active&&!recover)return;
        const item=this.catalog.find(e=>e.id===id);if(!item)return;
        this.exercise=id;this.text('gpExerciseTitle',item.name);this.text('gpExerciseDescription',item.description);
        this.text('gpStep','Start in a comfortable resting position.');
        this.byId('gpResult').hidden=true;
        this.video.pause();this.byId('gpVideoError').hidden=true;
        this.demoHand?.stop();
        const animated=this.byId('gpAnimatedDemo');if(animated){animated.hidden=id==='grasp_release';animated.setAttribute('aria-label',`${item.name} demonstration`);}
        const useVideo=id==='grasp_release'&&!!item.demo_video;
        this.video.hidden=!useVideo;this.byId('gpDemoLabel').hidden=!useVideo;
        if(useVideo){this.video.src=`/exercise_videos/${item.demo_video}?v=2`;this.video.play().catch(()=>{});}
        else {this.video.removeAttribute('src');this.video.load();}
        this.byId('gpExercises').querySelectorAll('[data-exercise]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.exercise===id)));
        this.loadHistory();this.renderButtons();
    }
    async action(path,payload){if(this.busy)return null;this.busy=true;this.renderButtons();try{return await this.request(path,payload);}catch(error){this.text('gpFeedback',error.message);return null;}finally{this.busy=false;this.renderButtons();}}
    async start(){if(this.session?.active)return;const data=await this.action('/api/guided/start',{exercise:this.exercise,utc_offset_minutes:-new Date().getTimezoneOffset()});if(data){this.byId('gpResult').hidden=true;this.applySession(data);}}
    async pause(){if(!this.session?.active)return;const data=await this.action('/api/guided/pause',{session_id:this.session.id,paused:this.session.status!=='paused'});if(data){this.applySession(data);if(data.status==='paused')this.video.pause();else if(!this.video.hidden)this.video.play().catch(()=>{});}}
    async finish(){if(!this.session?.active)return;const result=await this.action('/api/guided/finish',{session_id:this.session.id});if(result){this.applySession({active:false,last_result:result});this.loadHistory();}}
    renderButtons(){const active=!!this.session?.active;this.byId('gpBack').disabled=active||this.busy;this.byId('gpStart').hidden=active;this.byId('gpPause').hidden=!active;this.byId('gpFinish').hidden=!active;['gpStart','gpPause','gpFinish'].forEach(id=>this.byId(id).disabled=this.busy||!this.catalog.length);this.byId('gpExercises').querySelectorAll('button').forEach(b=>b.disabled=active||this.busy);this.text('gpPause',this.session?.status==='paused'?'Resume':'Pause');}
    applySession(session,fresh=true){
        const previous=this.session;this.session=session;
        if(session.active){
            if(this.view!=='session')this.setView('session');
            if(session.exercise!==this.exercise)this.select(session.exercise,true);
            this.startDemonstration();
            this.text('gpSessionState',session.status==='paused'?'Paused · take your time':!fresh||!session.signal_ready?'Waiting for sensor data':'Session in progress');
            this.text('gpCurrentScore',fresh?this.percent(session.current_pct):'—');this.text('gpAverageScore',this.percent(session.average_pct));
            this.text('gpActiveTime',this.time(session.elapsed));this.text('gpCycles',session.cycles);this.text('gpStep',session.step);
            this.text('gpFeedback',session.status==='paused'?'Rest when you need. Resume when you’re ready.':!fresh||!session.signal_ready?'Movement tracking is on hold until fresh, complete sensor readings return.':`At your pace: ${session.step}`);
        }else{
            this.text('gpSessionState','Ready when you are');this.text('gpCurrentScore','—');
            const result=session.last_result;
            if(result&&result.id!==this.lastResultId){this.lastResultId=result.id;if(this.exercise!==result.exercise)this.select(result.exercise,true);this.showResult(result);this.loadHistory();}
            if(!result){this.text('gpAverageScore','—');this.text('gpActiveTime','00:00');this.text('gpCycles','0');}
        }
        this.renderButtons();
    }
    updateTelemetry(state){
        this.lastState=state;if(!this.catalog.length)return;
        const fresh=Number.isFinite(state.received_at)&&Date.now()-state.received_at*1000<2500&&(state.data_source==='simulate'||(state.data_source==='serial'?state.serial_connected===true:state.mqtt_connected===true));
        this.text('gpLiveState',fresh?'Receiving sensor data':'Waiting for readings');
        this.text('gpSource',state.data_source==='mqtt'?'Glove sensor session':'Simulated sensor session');
        if(state.data_source&&state.data_source!==this.source){this.source=state.data_source;this.loadHistory();}
        if(state.guided)this.applySession(state.guided,fresh);
    }
    showResult(result){
        this.refreshActivity();
        this.byId('gpResult').hidden=true;this.text('gpResultScore',this.percent(result.average_pct));this.text('gpAverageScore',this.percent(result.average_pct));
        this.text('gpResultTitle',result.status==='source_changed'?'Session stopped: sensor source changed.':result.status==='calibration_changed'?'Session stopped: calibration changed.':result.average_pct===null?'Session saved without a score.':'Your practice, recorded.');
        this.text('gpResultDetail',`${this.time(result.active_seconds)} of measured practice · ${result.cycles} targets achieved · ${result.attempts ?? 0} reach-and-return attempts · ${result.source==='simulate'?'Simulated data':'Glove data'}. ${result.average_pct===null?'No reach-and-return attempts were completed.':result.exercise==='grasp_release'?'':result.coverage}`);
        this.text('gpFeedback','');this.text('gpActiveTime',this.time(result.active_seconds));this.text('gpCycles',result.cycles);
    }
    async loadHistory(){
        const request=++this.historyRequest,exercise=this.exercise,source=this.source||window.ACTIVE_DATA_SOURCE||'';
        try{
            let history=await this.request(`/api/guided/history?exercise=${encodeURIComponent(exercise)}&source=${encodeURIComponent(source)}&utc_offset_minutes=${-new Date().getTimezoneOffset()}`);
            if(request!==this.historyRequest)return;
            // Keep measured and generated series separate; preview only when history is sparse.
            if(source!=='simulate' && (history.daily?.length||0)<2){
                const preview=await this.request(`/api/guided/history?exercise=${encodeURIComponent(exercise)}&source=simulate&utc_offset_minutes=${-new Date().getTimezoneOffset()}`);
                if(request!==this.historyRequest)return;
                if(preview.daily?.length)history=preview;
            }
            this.renderHistory(history);
        }catch(error){if(request!==this.historyRequest)return;this.byId('gpChartWrap').hidden=true;this.byId('gpHistoryTable').hidden=true;this.byId('gpHistoryEmpty').hidden=false;this.text('gpHistoryEmpty','History could not load. Change the exercise or results filter to retry.');}
    }
    renderHistory(history){
        this.history=history;
        const days=Number(this.byId('gpHistoryRange')?.value)||30;
        const cutoff=new Date();cutoff.setHours(0,0,0,0);cutoff.setDate(cutoff.getDate()-days+1);
        const points=history.daily.filter(p=>Number.isFinite(p.average_pct)&&Date.parse(p.day+'T12:00:00')>=cutoff.getTime()).sort((a,b)=>a.day.localeCompare(b.day));
        this.text('gpLatestAverage',this.percent(points.at(-1)?.average_pct));
        this.text('gpBestDay',points.length?this.percent(Math.max(...points.map(p=>p.average_pct))):'—');
        this.text('gpPracticeDays',points.length);
        this.text('gpChartDetail','');
        const lang=typeof currentLang==='string'?currentLang:'en';
        const dayLabel=day=>day?new Date(day+'T12:00:00').toLocaleDateString(lang,{day:'numeric',month:'short'}):'—';
        this.text('gpLatestDate',dayLabel(points.at(-1)?.day));
        this.text('gpBestDate',dayLabel(points.length?points.reduce((best,p)=>p.average_pct>best.average_pct?p:best).day:null));
        this.text('gpSessionCount',`${points.reduce((total,p)=>total+p.sessions,0)} ${{en:'sessions',hi:'सत्र',mr:'सत्रे'}[lang]||'sessions'}`);
        this.byId('gpChartWrap').hidden=!points.length;this.byId('gpHistoryEmpty').hidden=!!points.length;
        this.text('gpHistoryEmpty','Your first completed, scored session will appear here. ');
        this.text('gpHistorySourceNote',history.source==='simulate'?'Test history · generated for interface testing.':'');
        const delta=points.length>1?points[points.length-1].average_pct-points[0].average_pct:null;
        this.text('gpTrendSummary',!points.length?'No scored sessions yet.':delta===null?`${points[0].average_pct.toFixed(1)}% · First day recorded`:`${delta>=0?'+':''}${delta.toFixed(1)} percentage points from first to latest recorded day`);
        if(points.length)this.drawChart(points);
        const body=this.byId('gpHistoryRows');body.replaceChildren();this.byId('gpHistoryTable').hidden=!history.recent.length;
        const pageSize=window.innerHeight<720?2:4,pages=Math.max(1,Math.ceil(history.recent.length/pageSize));
        this.recentPage=Math.max(0,Math.min(this.recentPage||0,pages-1));
        history.recent.slice(this.recentPage*pageSize,(this.recentPage+1)*pageSize).forEach(session=>{const row=document.createElement('tr');[session.local_day||session.started_at.slice(0,10),this.time(session.active_seconds),this.percent(session.average_pct),session.status==='completed'?'Saved':session.status==='interrupted'?'Interrupted':session.status==='calibration_changed'?'Calibration changed':'Source changed'].forEach(value=>{const cell=document.createElement('td');cell.textContent=value;row.append(cell);});body.append(row);});
        const details=this.byId('gpHistoryTable')?.closest?.('details');
        if(details){
            let controls=details.querySelector('.gp-recent-pagination');
            if(!controls){controls=document.createElement('div');controls.className='gp-recent-pagination';details.append(controls);}
            controls.replaceChildren();
            for(const [label,delta] of [['Previous',-1],['Next',1]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=delta<0?this.recentPage===0:this.recentPage===pages-1;button.onclick=()=>{this.recentPage+=delta;this.renderHistory(history);};controls.append(button);}
        }
    }
    drawChart(points){
        const svg=this.byId('gpDailyChart');svg.replaceChildren();const ns='http://www.w3.org/2000/svg';
        const tooltip=this.byId('gpChartTooltip');tooltip.hidden=true;
        const lang=typeof currentLang==='string'?currentLang:'en';
        const words={en:{axis:'Target achievement (%)',date:'Practice date'},hi:{axis:'लक्ष्य प्राप्ति (%)',date:'अभ्यास की तारीख'},mr:{axis:'लक्ष्य साध्य (%)',date:'सरावाची तारीख'}}[lang];
        const add=(tag,attrs,text)=>{const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));if(text!==undefined)el.textContent=text;svg.append(el);return el;};
        for(let value=0;value<=100;value+=25){const y=190-value*1.65;add('line',{x1:48,x2:880,y1:y,y2:y,stroke:'#edf1f5'});add('text',{x:36,y:y+4,'text-anchor':'end',fill:'#8495a3','font-size':12},`${value}%`);}
        add('text',{x:48,y:14,fill:'#8495a3','font-size':11},words.axis);
        const dates=points.map(p=>Date.parse(p.day+'T12:00:00Z')),span=dates[dates.length-1]-dates[0];
        const positions=points.map((p,i)=>[span?60+(dates[i]-dates[0])/span*800:460,190-p.average_pct*1.65]);
        if(points.length>1)add('path',{d:positions.map(([x,y],i)=>`${i?'L':'M'}${x},${y}`).join(' ')+` L${positions.at(-1)[0]},190 L${positions[0][0]},190Z`,fill:'#edf4f9',opacity:'.7'});
        if(points.length>1)add('path',{d:positions.map(([x,y],i)=>`${i?'L':'M'}${x},${y}`).join(' '),fill:'none',stroke:'#638ba6','stroke-width':3});
        const crosshair=add('line',{x1:0,x2:0,y1:25,y2:190,stroke:'#92aebe','stroke-dasharray':'4 5',visibility:'hidden'});
        const dots=[];
        const inspect=(index,floating=true)=>{
            const point=points[index],x=positions[index][0];
            crosshair.setAttribute('x1',x);crosshair.setAttribute('x2',x);crosshair.setAttribute('visibility',floating?'visible':'hidden');
            dots.forEach((dot,i)=>{dot.setAttribute('r',floating&&i===index?7:4.5);dot.setAttribute('fill',i===index?'#345f7d':'#6e94ac');});
            const lang=typeof currentLang==='string'?currentLang:'en';
            const date=new Date(point.day+'T12:00:00').toLocaleDateString(lang,{day:'numeric',month:'short',year:'numeric'});
            this.text('gpChartDetail',`${date} · ${this.percent(point.average_pct)} · ${point.sessions} ${lang==='hi'?'सत्र':lang==='mr'?'सत्रे':point.sessions===1?'session':'sessions'}`);
            const sessions=`${point.sessions} ${lang==='hi'?'सत्र':lang==='mr'?'सत्रे':point.sessions===1?'session':'sessions'}`;
            tooltip.textContent=`${date}\n${this.percent(point.average_pct)}  ·  ${sessions}`;tooltip.hidden=!floating;
            const rect=svg.getBoundingClientRect?.();
            if(rect&&tooltip.style){tooltip.style.left=`${Math.max(12,Math.min(rect.width-205,x/900*rect.width-92))}px`;tooltip.style.top=`${Math.max(12,positions[index][1]/260*rect.height-72)}px`;}

        };
        positions.forEach(([x,y],i)=>{
            const target=add('g',{tabindex:0,role:'button','aria-label':`${points[i].day}: ${points[i].average_pct}%, ${points[i].sessions} sessions`,class:'gp-chart-point'});
            const hit=document.createElementNS(ns,'circle');Object.entries({cx:x,cy:y,r:17,fill:'transparent'}).forEach(([k,v])=>hit.setAttribute(k,v));target.append(hit);
            const dot=document.createElementNS(ns,'circle');Object.entries({cx:x,cy:y,r:5,fill:'#6e94ac',stroke:'#fff','stroke-width':2}).forEach(([k,v])=>dot.setAttribute(k,v));target.append(dot);dots.push(dot);
            target.addEventListener('pointerenter',()=>inspect(i));target.addEventListener('focus',()=>inspect(i));target.addEventListener('click',()=>inspect(i));
            target.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?points.length-1:Math.max(0,Math.min(points.length-1,i+(event.key==='ArrowRight'?1:-1)));svg.querySelectorAll('.gp-chart-point')[next]?.focus();}else if(event.key==='Enter'||event.key===' '){event.preventDefault();inspect(i);}});
        });
        svg.onpointermove=event=>{const rect=svg.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width*900;let nearest=0;positions.forEach((point,i)=>{if(Math.abs(point[0]-x)<Math.abs(positions[nearest][0]-x))nearest=i;});inspect(nearest);};
        svg.onpointerleave=()=>{tooltip.hidden=true;crosshair.setAttribute('visibility','hidden');dots.forEach(dot=>dot.setAttribute('r',4.5));};
        inspect(points.length-1,false);
        const count=Math.min(5,points.length);
        const indices=Array.from(new Set(Array.from({length:count},(_,i)=>Math.round(i*(points.length-1)/Math.max(1,count-1)))));
        indices.forEach(i=>add('text',{x:positions[i][0],y:219,'text-anchor':i===0&&count>1?'start':i===points.length-1&&count>1?'end':'middle',fill:'#8295a4','font-size':12},new Date(points[i].day+'T12:00:00').toLocaleDateString(lang,{day:'numeric',month:'short'})));
        add('text',{x:460,y:248,'text-anchor':'middle',fill:'#91a0ac','font-size':11},words.date);
    }
}
document.addEventListener('DOMContentLoaded',()=>{if(document.getElementById('gpExercises'))window.guidedPractice=new GuidedPractice();});
