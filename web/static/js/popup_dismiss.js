/** Consistent light dismissal for native dialogs and legacy modal backdrops. */
(() => {
    let pressedOutside=null;
    function outside(event){
        const target=event.target;
        if(target?.tagName==='DIALOG'&&target.open){
            const r=target.getBoundingClientRect();
            return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom?target:null;
        }
        return target?.classList?.contains('modal-backdrop')&&target.classList.contains('active')?target:null;
    }
    document.addEventListener('pointerdown',event=>{pressedOutside=event.button===0?outside(event):null;});
    document.addEventListener('pointercancel',()=>pressedOutside=null);
    document.addEventListener('click',event=>{
        const target=outside(event),pressed=pressedOutside;pressedOutside=null;
        if(!target||target!==pressed)return;
        if(target.tagName==='DIALOG'){
            // Preserve the existing cancel cleanup, including the game-library navigation.
            if(target.dispatchEvent(new Event('cancel',{cancelable:true})))target.close();
        }else if(typeof closeModal==='function')closeModal(target.id);
        else target.classList.remove('active');
    });
})();
