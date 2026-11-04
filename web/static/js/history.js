/** Searchable, paged presentation of existing saved sessions and report links. */
class SessionHistoryView {
    constructor(){
        this.sessions=[];this.page=1;this.pageSize=6;this.generation=0;
        window.addEventListener?.('resize',()=>{if(this.node('modalHistory').classList.contains('active'))this.render();});
        this.node('historySearch').addEventListener('input',()=>{this.page=1;this.render();});
        this.node('historyPrevious').addEventListener('click',()=>{this.page--;this.render();});
        this.node('historyNext').addEventListener('click',()=>{this.page++;this.render();});
        document.addEventListener('keydown',event=>{
            if(!this.node('modalHistory').classList.contains('active'))return;
            if(event.key==='Escape'){event.preventDefault();closeModal('modalHistory');}
            if(event.key==='Tab'){
                const controls=Array.from(this.node('modalHistory').querySelectorAll('button:not(:disabled),input,a[href]')).filter(e=>e.getClientRects().length);
                const first=controls[0],last=controls.at(-1);
                if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
                else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
            }
        });
    }
    node(id){return document.getElementById(id);}
    tr(text){return window.ngI18n?.translate(text)??text;}
    esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
    number(value,digits=0){return typeof value==='number'&&Number.isFinite(value)?value.toFixed(digits):'—';}
    async open(){
        const generation=++this.generation;this.returnFocus=document.activeElement;
        this.controller?.abort();this.controller=new AbortController();
        this.page=1;this.sessions=[];this.loading=true;this.error=false;this.node('historySearch').value='';
        openModal('modalHistory');this.render();this.node('historySearch').focus();
        try{
            const response=await fetch('/api/sessions',{signal:this.controller.signal});
            if(!response.ok)throw new Error('History unavailable');
            const data=await response.json();if(generation!==this.generation)return;
            this.sessions=Array.isArray(data.sessions)?data.sessions:[];
        }catch(error){if(generation!==this.generation||error.name==='AbortError')return;this.error=true;}
        if(generation===this.generation){this.loading=false;this.render();}
    }
    onClose(){this.generation++;this.controller?.abort();this.returnFocus?.focus();}
    filtered(){
        const query=this.node('historySearch').value.trim().toLocaleLowerCase();
        return this.sessions.filter(s=>!query||[s.exercise_name,this.tr(String(s.exercise_name||'').replace(/^Simulated\s*·\s*/i,'')),String(s.id)].some(value=>String(value||'').toLocaleLowerCase().includes(query)));
    }
    row(session){
        const rawName=String(session.exercise_name||'—'),simulated=/^Simulated\s*·\s*/i.test(rawName);
        const name=rawName.replace(/^Simulated\s*·\s*/i,'');
        const date=new Date(String(session.start_time||'').replace(' ','T'));
        const validDate=Number.isFinite(date.getTime()),locale=document.documentElement.lang||'en';
        const day=validDate?new Intl.DateTimeFormat(locale,{month:'short',day:'numeric',year:'numeric'}).format(date):'—';
        const time=validDate?new Intl.DateTimeFormat(locale,{hour:'numeric',minute:'2-digit'}).format(date):'—';
        const consistency=this.number(session.consistency_score),bar=typeof session.consistency_score==='number'?Math.max(0,Math.min(100,session.consistency_score)):0;
        const id=Number(session.id),reports=Number.isSafeInteger(id)&&id>0?`<div class="history-report-actions"><a href="/api/session/${id}/report/pdf" target="_blank" rel="noopener" class="history-report-pdf" aria-label="${this.esc(this.tr('Download PDF'))} #${id}">PDF</a><a href="/api/session/${id}/report/csv" aria-label="${this.esc(this.tr('Download CSV'))} #${id}">CSV</a></div>`:'—';
        return `<tr><td><strong class="history-exercise">${this.esc(this.tr(name))}</strong><span class="history-session-meta">#${this.esc(session.id)}${simulated?`<span class="history-source">${this.esc(this.tr('Simulated'))}</span>`:''}</span></td><td><span class="history-date">${this.esc(day)}</span><small>${this.esc(time)}</small></td><td><strong class="history-number">${this.number(session.total_repetitions)}</strong><small>${this.number(session.active_attempts_count)} <span>${this.esc(this.tr('active attempts'))}</span></small></td><td><span class="history-measure">${this.number(session.avg_rom_percentage,1)}${Number.isFinite(session.avg_rom_percentage)?'%':''}</span><small><span>${this.esc(this.tr('Avg rep'))}</span> · ${this.number(session.avg_duration_sec,1)}s</small></td><td><span class="history-measure">${consistency}${Number.isFinite(session.consistency_score)?'%':''}</span><span class="history-consistency-track" aria-hidden="true"><span style="width:${bar}%"></span></span></td><td>${reports}</td></tr>`;
    }
    render(){
        this.pageSize=Math.max(2,Math.min(6,Math.floor(((window.innerHeight||900)-290)/90)));
        const rows=this.filtered(),pages=Math.max(1,Math.ceil(rows.length/this.pageSize));
        this.page=Math.max(1,Math.min(pages,this.page));const start=(this.page-1)*this.pageSize,shown=rows.slice(start,start+this.pageSize);
        const empty=this.loading?'Loading session history...':this.error?'Unable to load history. Please try again.':this.sessions.length?'No matching sessions.':'No sessions recorded yet.';
        this.node('historyTableBody').innerHTML=this.loading||this.error||!shown.length?`<tr><td colspan="6" class="history-empty">${this.esc(this.tr(empty))}</td></tr>`:shown.map(s=>this.row(s)).join('');
        this.node('historySessionCount').textContent=this.loading?'':`${this.sessions.length} ${this.tr(this.sessions.length===1?'saved session':'saved sessions')}`;
        this.node('historyVisibleCount').textContent=this.loading||!rows.length?'':`${this.tr('Showing')} ${start+1}–${start+shown.length} ${this.tr('of')} ${rows.length}`;
        this.node('historyPageLabel').textContent=`${this.tr('Page')} ${this.page} / ${pages}`;
        this.node('historyPrevious').disabled=this.loading||this.page<=1;
        this.node('historyNext').disabled=this.loading||this.page>=pages;
        this.node('modalHistory').querySelector('.history-table-container').scrollTop=0;
    }
}
document.addEventListener('DOMContentLoaded',()=>{window.sessionHistory=new SessionHistoryView();});
