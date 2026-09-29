/*
 * CoursePulse
 * Developed by Jon Gorlo
 */
(function(){
  const nativeFetch=window.fetch.bind(window);
  const langLabel=l=>l==='de'?'Deutsch (DE)':'English (EN)';
  const selectedCreateLanguage=()=>document.querySelector('#activityLanguage')?.value||'en';

  // Keep the existing CoursePulse code simple: enrich create/update requests with the
  // language selected in the instructor UI. The backend uses this language before analysis.
  window.fetch=async function(input,init={}){
    const url=typeof input==='string'?input:(input?.url||'');
    const method=String(init.method||'GET').toUpperCase();
    if(init.body&&typeof init.body==='string'&&init.headers&&String(init.headers['Content-Type']||init.headers.get?.('Content-Type')||'').includes('application/json')){
      try{
        const body=JSON.parse(init.body);
        if(method==='POST'&&url==='/api/sessions')body.dashboard_language=selectedCreateLanguage();
        const editMatch=url.match(/^\/api\/admin\/sessions\/([^/]+)$/);
        if(method==='PATCH'&&editMatch){
          const sel=document.querySelector(`#edit-language-${CSS.escape(editMatch[1])}`);
          if(sel)body.dashboard_language=sel.value;
        }
        init={...init,body:JSON.stringify(body)};
      }catch{}
    }
    return nativeFetch(input,init);
  };

  async function resetActivitySubmissions(id,title){
    const ok=confirm(`Reset all submissions for “${title||'this activity'}”?\n\nThis permanently deletes all student submissions and the currently generated dashboard analysis for this activity.\n\nThe activity itself, its student tasks, settings, link, activity code and QR code will remain unchanged.\n\nThis cannot be undone.`);
    if(!ok)return;
    const r=await nativeFetch(`/api/admin/sessions/${encodeURIComponent(id)}/submissions`,{method:'DELETE',headers:{'x-admin-key':localStorage.cpkey||''}});
    if(!r.ok){const x=await r.json().catch(()=>({}));alert(x.error||'Could not reset submissions.');return}
    const x=await r.json().catch(()=>({}));
    alert(`${x.deleted_submissions??0} submission${x.deleted_submissions===1?'':'s'} deleted. The activity link, code and QR code are unchanged.`);
    if(typeof window.showTeacher==='function')await window.showTeacher();
  }
  window.resetActivitySubmissions=resetActivitySubmissions;

  function ensureCreateLanguage(){
    const form=document.querySelector('#newActivityForm');
    if(!form||form.querySelector('#activityLanguage'))return;
    const context=document.querySelector('#activityContext')?.closest('label')||document.querySelector('#activityContext');
    const wrap=document.createElement('div');
    wrap.className='activity-language-create';
    wrap.innerHTML=`<label for="activityLanguage"><b>Activity language</b></label><select id="activityLanguage" style="max-width:220px"><option value="en">English (EN)</option><option value="de">Deutsch (DE)</option></select><p class="stat">Choose the language in which students are expected to respond. CoursePulse uses this setting when it analyzes the original student inputs and generates the dashboard — it does not simply translate an already generated pulse.</p>`;
    const sections=document.querySelector('#createSections');
    if(sections){const label=sections.previousElementSibling?.previousElementSibling||sections;label.parentNode.insertBefore(wrap,label)}else form.appendChild(wrap);
  }

  async function ensureEditLanguages(){
    const cards=[...document.querySelectorAll('#sessions .activity-card')];
    for(const card of cards){
      const code=card.querySelector('.code')?.textContent?.trim();
      const edit=code&&document.querySelector(`#edit-${CSS.escape(code)}`);
      if(!code||!edit||edit.querySelector('.edit-language-wrap'))continue;
      const r=await nativeFetch('/api/sessions/'+encodeURIComponent(code));if(!r.ok)continue;const s=await r.json();
      const wrap=document.createElement('div');wrap.className='edit-language-wrap';
      wrap.innerHTML=`<label><b>Activity language</b></label><select id="edit-language-${code}" style="max-width:220px"><option value="en" ${s.dashboard_language==='de'?'':'selected'}>English (EN)</option><option value="de" ${s.dashboard_language==='de'?'selected':''}>Deutsch (DE)</option></select><p class="stat">Changing the language affects the next generated pulse. Refresh the pulse after saving to regenerate it in the new language.</p>`;
      const actions=edit.querySelector('.form-actions');if(actions)edit.insertBefore(wrap,actions);
    }
  }

  function enhanceInstructorCredit(){
    const teacher=document.querySelector('#teacher');if(!teacher)return;
    let credit=teacher.querySelector('.developer-credit');
    if(!credit){credit=document.createElement('div');credit.className='stat developer-credit';credit.style.cssText='margin:32px 0 8px;text-align:center;opacity:.72';credit.textContent='CoursePulse developed by Jon Gorlo · For questions about CoursePulse, please contact Jon Gorlo.'}
    teacher.appendChild(credit);
  }

  function enhanceActivityCards(){
    document.querySelectorAll('#sessions .activity-card').forEach(card=>{
      if(card.querySelector('.reset-submissions-btn'))return;
      const code=card.querySelector('.code')?.textContent?.trim();const title=card.querySelector('.session-main > b')?.textContent?.trim()||'this activity';const actions=card.querySelector('.session-actions');if(!code||!actions)return;
      const btn=document.createElement('button');btn.type='button';btn.className='secondary reset-submissions-btn';btn.textContent='Reset submissions';btn.title='Delete submissions and the generated pulse while keeping this activity, link, code and QR code';btn.addEventListener('click',()=>resetActivitySubmissions(code,title));
      const del=[...actions.querySelectorAll('button')].find(b=>b.textContent.trim()==='Delete');if(del)actions.insertBefore(btn,del);else actions.appendChild(btn);
    });
  }

  async function enhancePulseLanguage(){
    const pulse=document.querySelector('#pulse');if(!pulse||pulse.classList.contains('hidden')||pulse.querySelector('.activity-language-info'))return;
    const analyzeBtn=[...pulse.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('analyze('));const m=(analyzeBtn?.getAttribute('onclick')||'').match(/analyze\(['\"]([^'\"]+)/);if(!m)return;
    const r=await nativeFetch('/api/sessions/'+encodeURIComponent(m[1]));if(!r.ok)return;const s=await r.json();
    const box=document.createElement('div');box.className='card activity-language-info';box.innerHTML=`<div><b>Activity language · ${langLabel(s.dashboard_language)}</b><div class="stat">This language was chosen when the activity was created because CoursePulse analyzes the student inputs in that language. To change it, edit the activity and then refresh the pulse.</div></div>`;
    const picker=pulse.querySelector('.dashboard-picker');if(picker)picker.parentNode.insertBefore(box,picker);else pulse.prepend(box);
  }

  function enhance(){ensureCreateLanguage();enhanceActivityCards();enhanceInstructorCredit();ensureEditLanguages();enhancePulseLanguage()}
  const observer=new MutationObserver(enhance);const start=()=>{observer.observe(document.body,{childList:true,subtree:true});enhance()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();