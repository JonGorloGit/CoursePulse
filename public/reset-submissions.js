/*
 * CoursePulse
 * Developed by Jon Gorlo
 */
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

  async function saveDashboardLanguage(id,language,select){
    select.disabled=true;
    try{
      const r=await fetch(`/api/admin/sessions/${encodeURIComponent(id)}`,{method:'PATCH',headers:{'Content-Type':'application/json','x-admin-key':window.key||localStorage.cpkey||''},body:JSON.stringify({dashboard_language:language})});
      if(!r.ok){const x=await r.json().catch(()=>({}));throw Error(x.error||'Could not save dashboard language.')}
      const note=document.querySelector('.dashboard-language-note');
      if(note)note.textContent=language==='de'?'Deutsch ist gespeichert. „Refresh pulse“ erzeugt die Auswertung auf Deutsch.':'English is saved. “Refresh pulse” will generate the analysis in English.';
    }catch(e){alert(e.message)}finally{select.disabled=false}
  }
  window.saveDashboardLanguage=saveDashboardLanguage;

  async function enhanceLanguageControl(){
    const pulse=document.querySelector('#pulse');
    if(!pulse||pulse.classList.contains('hidden')||pulse.querySelector('.dashboard-language-control'))return;
    const analyzeBtn=[...pulse.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('analyze('));
    const m=(analyzeBtn?.getAttribute('onclick')||'').match(/analyze\(['\"]([^'\"]+)/);
    if(!m)return;
    const id=m[1];
    const r=await fetch('/api/sessions/'+encodeURIComponent(id));
    if(!r.ok)return;
    const s=await r.json();
    if(s.activity_type!=='open')return;
    const language=s.dashboard_language==='de'?'de':'en';
    const box=document.createElement('div');
    box.className='card dashboard-language-control';
    box.innerHTML=`<div><b>Dashboard language</b><div class="stat dashboard-language-note">Choose the language that matches the student input. CoursePulse uses this setting for the generated dashboard content and Ask the Room. The CoursePulse interface and box names stay in English.</div></div><select aria-label="Dashboard language" style="max-width:180px"><option value="en" ${language==='en'?'selected':''}>English (EN)</option><option value="de" ${language==='de'?'selected':''}>Deutsch (DE)</option></select>`;
    box.querySelector('select').addEventListener('change',e=>saveDashboardLanguage(id,e.target.value,e.target));
    const picker=pulse.querySelector('.dashboard-picker');
    if(picker)picker.parentNode.insertBefore(box,picker);else pulse.prepend(box);
  }

  function enhanceInstructorCredit(){
    const teacher=document.querySelector('#teacher');
    if(!teacher||teacher.querySelector('.developer-credit'))return;
    const top=teacher.querySelector('.topline');
    if(!top)return;
    const credit=document.createElement('div');
    credit.className='stat developer-credit';
    credit.style.margin='-8px 0 18px';
    credit.textContent='CoursePulse developed by Jon Gorlo · For questions about CoursePulse, please contact Jon Gorlo.';
    top.insertAdjacentElement('afterend',credit);
  }

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
    enhanceInstructorCredit();
    enhanceLanguageControl();
  }
  const observer=new MutationObserver(enhance);
  const start=()=>{observer.observe(document.body,{childList:true,subtree:true});enhance()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();