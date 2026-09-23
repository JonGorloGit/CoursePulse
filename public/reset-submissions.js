(function(){
  async function resetActivitySubmissions(id,title){
    const ok=confirm(`Reset all submissions for “${title||'this activity'}”?\n\nThis permanently deletes all student submissions and the currently generated dashboard analysis for this activity.\n\nThe activity itself, its student tasks, settings, link, activity code and QR code will remain unchanged.\n\nThis cannot be undone.`);
    if(!ok)return;
    const instructorKey=window.key||localStorage.cpkey||'';
    const r=await fetch(`/api/admin/sessions/${encodeURIComponent(id)}/submissions`,{method:'DELETE',headers:{'x-admin-key':instructorKey}});
    if(!r.ok){const x=await r.json().catch(()=>({}));alert(x.error||'Could not reset submissions.');return}
    const x=await r.json().catch(()=>({}));
    alert(`${x.deleted_submissions??0} submission${x.deleted_submissions===1?'':'s'} deleted. The activity link, code and QR code are unchanged.`);
    if(typeof window.showTeacher==='function')await window.showTeacher();
  }
  window.resetActivitySubmissions=resetActivitySubmissions;

  function enhance(){
    document.querySelectorAll('#sessions .activity-card').forEach(card=>{
      if(card.querySelector('.reset-submissions-btn'))return;
      const code=card.querySelector('.code')?.textContent?.trim();
      const title=card.querySelector('.session-main > b')?.textContent?.trim()||'this activity';
      const actions=card.querySelector('.session-actions');
      if(!code||!actions)return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='secondary reset-submissions-btn';
      btn.textContent='Reset submissions';
      btn.title='Delete submissions and the generated pulse while keeping this activity, link, code and QR code';
      btn.addEventListener('click',()=>resetActivitySubmissions(code,title));
      const deleteBtn=[...actions.querySelectorAll('button')].find(b=>b.textContent.trim()==='Delete');
      if(deleteBtn)actions.insertBefore(btn,deleteBtn);else actions.appendChild(btn);
    });
  }
  const observer=new MutationObserver(enhance);
  const start=()=>{const sessions=document.querySelector('#sessions');if(sessions){observer.observe(sessions,{childList:true,subtree:true});enhance()}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();