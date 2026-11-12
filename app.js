'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const book=window.BOOK,KEY='english-wordbook-renewal-v1';let saved={drafts:{},progress:{},positions:{},routes:{},mcqEnglishChoices:{}};try{saved={...saved,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
let state={id:null,s:0,q:0,a:false,p:0},unit=null,blocks=[];
const scrollPositions=new Map(Object.entries(saved.positions));let currentRoute="";
function save(){try{localStorage.setItem(KEY,JSON.stringify(saved))}catch{}}
function section(){return unit.sections[state.s]}
function progressKey(u=unit,stage=section(),q=state.q){return stage.questionProgressKeys?.[q]||`${u.id}/${stage.id}/${stage.questions?q:'read'}`}
function stageKeys(u,stage){return stage.progressKeys|| (stage.questions?stage.questions.map((_,q)=>progressKey(u,stage,q)):[progressKey(u,stage)])}
function currentKeys(){return section().questions?[progressKey()]:stageKeys(unit,section())}
function stageDone(u,stage){return stageKeys(u,stage).every(key=>saved.progress[key])}
function stats(u){const keys=u.sections.flatMap(stage=>stageKeys(u,stage));return {done:keys.filter(key=>saved.progress[key]).length,total:keys.length}}
function markDone(done=true,keys=currentKeys()){if(!unit)return;for(const key of keys){if(done)saved.progress[key]=true;else delete saved.progress[key]}save();updateProgress()}
function updateProgress(){
 if(!unit)return;const keys=currentKeys(),done=keys.filter(key=>saved.progress[key]).length;
 $('#completed').checked=done===keys.length;$('#completed').indeterminate=done>0&&done<keys.length;
 $('#completed-label').textContent=section().questions?'문항 완료':keys.length>1?'전체 학습 완료':'학습 완료';
 $('#content').querySelectorAll('[data-progress-key]').forEach(input=>{input.checked=!!saved.progress[input.dataset.progressKey]});
 $('#sections').querySelectorAll('a').forEach((a,i)=>{a.textContent=unit.sections[i].label+(stageDone(unit,unit.sections[i])?' ✓':'')});
 $('#sections').querySelectorAll('option').forEach((a,i)=>{a.textContent=unit.sections[i].label+(stageDone(unit,unit.sections[i])?' ✓':'')});
}
function rememberScroll(){if(!currentRoute)return;const top=$('#content').scrollTop;scrollPositions.set(currentRoute,top);saved.positions[currentRoute]=top;save()}
let scrollTimer;$('#content').addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(rememberScroll,180)});window.addEventListener('pagehide',rememberScroll);
function draftKey(){return section().draftKeys?.[state.q]||`${unit.id}/${state.s}/${state.q}`}
function url(t){
 const params=new URLSearchParams();
 if(t.id){const u=book.find(x=>x.id===t.id),stage=u.sections[t.s||0];params.set('section',stage.id);
  if(stage.questions){params.set('q',String((t.q||0)+1));if(t.a&&!stage.open)params.set('answer','1')}
  else if(t.item&&stage.idioms?.some(item=>item.id===t.item))params.set('item',t.item);
 }
 return '#/'+(t.id?encodeURIComponent(t.id):'')+(params.size?'?'+params:'');
}
function routeState(hash){
 const raw=String(hash||'#/').slice(2).split('?'),params=new URLSearchParams(raw[1]||'');let id='';try{id=decodeURIComponent(raw[0]||'')}catch{}
 const alias=window.IDIOM_ROUTES?.[id];if(alias){id=alias.id;if(params.get('section')==='extra')params.set('q',String(alias.q+1));else params.set('item',alias.item)}
 const u=book.find(u=>u.id===id);if(!u)return {id:null,s:0,q:0,a:false,p:0,item:null};
 const s=Math.max(0,u.sections.findIndex(s=>s.id===params.get('section'))),stage=u.sections[s];
 const n=k=>Math.max(0,(parseInt(params.get(k),10)||1)-1);
 return {id:u.id,s,q:stage.questions?Math.min(n('q'),stage.questions.length-1):0,a:!!stage.questions&&!stage.open&&params.get('answer')==='1',p:n('page'),item:stage.idioms?.some(x=>x.id===params.get('item'))?params.get('item'):null};
}
function migrateIdiomRoutes(){
 if(saved.last)saved.last=url(routeState(saved.last));
 for(const u of book.filter(u=>u.members)){
  const last=routeState(saved.last);if(last.id===u.id)saved.routes[u.id]=saved.last;
  else if(!saved.routes[u.id]){const old=u.members.map(id=>saved.routes[id]).filter(Boolean).at(-1);if(old)saved.routes[u.id]=url(routeState(old))}
 }
 save();
}
function go(changes){const next={...state,item:null,...changes},hash=url(next);if(location.hash===hash)readRoute();else location.hash=hash}
function readRoute(){
 window.WORDBOOK_AUDIO?.stop();clearTimeout(scrollTimer);rememberScroll();state=routeState(location.hash);unit=book.find(u=>u.id===state.id)||null;
 currentRoute=url(state);if(location.hash!==currentRoute)history.replaceState(null,'',currentRoute);render();
 const area=$('#content');area.scrollTop=scrollPositions.get(currentRoute)||0;
 const item=state.item&&document.getElementById('idiom-'+state.item);
 if(item&&!scrollPositions.has(currentRoute))area.scrollTop+=item.getBoundingClientRect().top-area.getBoundingClientRect().top;
 const feedback=$('#mcq-feedback');if(feedback&&state.a&&!scrollPositions.has(currentRoute))area.scrollTop+=feedback.getBoundingClientRect().top-area.getBoundingClientRect().top-8;
}
function render(){
 document.body.classList.remove('typing');const form=$('#response');form.hidden=true;form.innerHTML='';form.className='';
 if(!unit){$('#source').textContent='';$('#heading').innerHTML='<h1>단원 선택</h1>';$('#sections').innerHTML='';document.title='영어 단어장';blocks=[];paint();return}
 document.title=unit.title+' · 영어 단어장';const s=section();$('#source').textContent=`p. ${s.pages?.[state.q]||unit.page}`;
 $('#heading').innerHTML=`<h1 lang="en">${esc(unit.title)}</h1><p class="meta">${s.questions?`${s.label} · ${s.numbers?.[state.q]||state.q+1} / ${s.numbers?.at(-1)||s.questions.length}`:esc(s.label)}</p>`;
 $('#sections').innerHTML=unit.sections.length>3?`<label class=sr-only for=stage>학습 단계</label><select id=stage>${unit.sections.map((x,i)=>`<option value=${i} ${state.s===i?'selected':''}>${esc(x.label)}</option>`).join('')}</select>`:unit.sections.map((s,i)=>`<a href="${esc(url({...state,s:i,q:0,a:false,p:0,item:null}))}" aria-current="${state.s===i?'step':'false'}">${esc(s.label)}</a>`).join('');if($('#stage'))$('#stage').onchange=e=>go({s:Number(e.target.value),q:0,a:false,p:0});
 if(s.id==='practice'&&window.PRACTICE_MCQ?.[unit.id]?.[state.q]){blocks=[];paint();renderMCQ();return}
 if(s.questions){const [prompt,answer]=s.questions[state.q];blocks=state.a?[[`Answers · ${s.numbers?.[state.q]||state.q+1}`,answer]]:[[s.titles?.[state.q]||`${s.label} · ${s.numbers?.[state.q]||state.q+1}`,prompt]];if(!state.a)input(s.open?'답 저장':'정답 확인')}
 else if(s.prompt){blocks=[['Extra practice',s.prompt]];input('답 저장')}
 else blocks=s.blocks||[];
 paint();
}
function renderMCQ(){
 const item=window.PRACTICE_MCQ[unit.id][state.q],key=progressKey(),stored=saved.mcqEnglishChoices[key];
 const selected=Number.isInteger(stored)&&stored>=0&&stored<4?stored:null;
 const number=section().numbers?.[state.q]||state.q+1;
 const sentence=item.prompt.split('____').map(esc).join(state.a?`<mark class="focus-term">${esc(item.term)}</mark>`:'<span class="cloze" aria-label="빈칸">________</span>');
 const right=selected===item.correct;
 $('#content').innerHTML=`<div class="mcq-question"><p class="mcq-instruction">빈칸에 들어갈 영어 표현을 고르세요.</p><p class="mcq-context" lang="en"><span lang="ko">상황</span> ${esc(item.context)}</p><p class="mcq-sentence" lang="en">${sentence}</p><div class="choices" role="radiogroup" aria-label="Practice ${number} 보기">${item.options.map((option,i)=>`<button type="button" role="radio" class="choice ${selected===i?'selected':''} ${state.a&&i===item.correct?'correct':''} ${state.a&&selected===i&&i!==item.correct?'incorrect':''}" aria-checked="${selected===i}" data-choice="${i}" ${state.a?'disabled':''}><span class="choice-letter" aria-hidden="true">${'ABCD'[i]}</span><span lang="en">${esc(option)}</span>${state.a&&i===item.correct?'<small>정답</small>':state.a&&selected===i?'<small>내 선택</small>':''}</button>`).join('')}</div>${state.a?`<section id="mcq-feedback" class="mcq-feedback" aria-live="polite"><h2>${selected===null?'정답':right?'정답입니다':'다시 확인해 보세요'}</h2><p><strong>${'ABCD'[item.correct]}.</strong> <span lang="en">${esc(item.term)}</span></p><p>${esc(item.meaning)}</p>${selected!==null&&!right?`<p class="chosen-explanation">선택한 “${esc(item.options[selected])}”는 이 문맥의 빈칸에 맞지 않습니다.</p>`:''}${item.definition?`<p class="mcq-definition" lang="en">${esc(item.term)}: ${esc(item.definition)}</p>`:''}${item.note?`<p class="mcq-note">${esc(item.note)}</p>`:''}<button id="mcq-retry" type="button">다시 풀기</button></section>`:''}</div>`;
 if(state.a){$('#mcq-retry').onclick=()=>{delete saved.mcqEnglishChoices[key];save();const questionRoute=url({...state,a:false});scrollPositions.delete(questionRoute);delete saved.positions[questionRoute];go({a:false})};return}
 const form=$('#response');form.hidden=false;form.className='mcq-form';form.innerHTML=`<button type="submit" ${selected===null?'disabled':''}>정답 확인</button>`;
 $('#content').querySelectorAll('[data-choice]').forEach(button=>{button.onclick=()=>{const index=Number(button.dataset.choice);saved.mcqEnglishChoices[key]=index;save();$('#content').querySelectorAll('[data-choice]').forEach(other=>{const checked=Number(other.dataset.choice)===index;other.setAttribute('aria-checked',String(checked));other.classList.toggle('selected',checked)});form.querySelector('button').disabled=false}});
 form.onsubmit=e=>{e.preventDefault();if(!Number.isInteger(saved.mcqEnglishChoices[key]))return;markDone();go({a:true})};
}
function input(action){const form=$('#response');form.hidden=false;form.innerHTML=`<label for="draft">내 답</label><input id="draft" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(saved.drafts[draftKey()]||'')}"><button type="submit">${action}</button>`;
 const field=$('#draft');field.oninput=()=>{saved.drafts[draftKey()]=field.value;save()};field.onfocus=()=>{document.body.classList.add('typing');resize()};field.onblur=()=>{document.body.classList.remove('typing');resize()};form.onsubmit=e=>{e.preventDefault();field.blur();if(section().questions&&!section().open){markDone();go({a:true,p:0})}else{markDone();form.querySelector('button').textContent='저장됨'}};
}
function sheet(title,text){return `<div class="sheet">${title?`<h2 lang="en">${esc(title)}</h2>`:''}<p lang="en">${esc(text)}</p></div>`}
function vocabularySheet(title,text,i){
 const meaning=window.KOREAN?.[title];
 return `<section class="sheet vocabulary"><div class="word-row"><h2 lang="en">${esc(title)}</h2><div class="word-actions">${meaning?`<button type="button" class="meaning-toggle" aria-expanded="false" aria-controls="meaning-${i}" aria-label="${esc(title)} 한국어 뜻 보기">한국어 뜻</button>`:''}<button type="button" class="pronunciation" data-pronounce="${esc(title)}" aria-pressed="false" aria-label="${esc(title)} 영어 발음 듣기">발음</button></div></div><p lang="en">${esc(text)}</p>${meaning?`<p class="korean-meaning" id="meaning-${i}" lang="ko" hidden>${esc(meaning)}</p>`:''}<p class="speech-status" role="status" hidden></p></section>`;
}
$('#content').addEventListener('click',e=>{
 const button=e.target.closest('.meaning-toggle');if(!button)return;
 const expanded=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!expanded));
 document.getElementById(button.getAttribute('aria-controls')).hidden=expanded;
 button.textContent=expanded?'한국어 뜻':'뜻 숨기기';
});
function idiomSheet(item){
 const details=item.blocks.map(([title,text])=>`<div class="idiom-detail">${title==='Examples'?'':`<h3 lang="en">${esc(title)}</h3>`}<p lang="en">${esc(text)}</p></div>`).join('');
 return `<section class="idiom-item" id="idiom-${esc(item.id)}"><div class="idiom-heading"><h2 lang="en">${esc(item.title)}</h2><label class="idiom-check"><input type="checkbox" data-progress-key="${esc(item.key)}" aria-label="${esc(item.title)} ${esc(section().label)} 학습 완료"><span>완료</span></label></div><p class="idiom-page">p. ${esc(item.page)}</p>${details}</section>`;
}
$('#content').addEventListener('change',e=>{const key=e.target.dataset.progressKey;if(key)markDone(e.target.checked,[key])});
function paint(){
 const area=$('#content');
 if(!unit){
 const last=book.find(u=>saved.last?.startsWith('#/'+encodeURIComponent(u.id)+'?'));const finished=book.filter(u=>{const n=stats(u);return n.done===n.total}).length;
 area.innerHTML=(last?`<a class="resume" href="${esc(saved.last)}"><span>이어서 학습 →</span><strong>${esc(last.title)}</strong></a>`:'')+`<p class="overall">${finished} / ${book.length} 단원 완료 <small>이 브라우저에 자동 저장</small></p>`+book.map(u=>{const n=stats(u);return `<a class="entry" href="${esc(saved.routes[u.id]||url({id:u.id,s:0,q:0,a:false,p:0}))}"><span class="entry-title">${esc(u.title)}${n.done===n.total?'<span class="done-badge">완료 ✓</span>':''}</span><small>${esc(u.members?`${u.members.length} idioms · Read · Examples · Extra practice`:u.group||'Dialogue · Vocabulary · Practice')} · p. ${esc(u.page)}</small><span class="entry-progress">${n.done?`${n.done} / ${n.total} 학습 완료`:'시작 전'}</span><span class="progress-track" aria-hidden="true"><span style="width:${n.done/n.total*100}%"></span></span></a>`}).join('');$('footer').hidden=true;return}

 area.innerHTML=section().idioms?section().idioms.map(idiomSheet).join(''):blocks.map(([title,text],i)=>section().id==='vocabulary'?vocabularySheet(title,text,i):sheet(title,text)).join('');$('footer').hidden=false;
 const s=section();$('#count').textContent=s.questions?`${state.q+1} / ${s.questions.length}`:`${state.s+1} / ${unit.sections.length}`;
 $('#prev').disabled=false;$('#next').disabled=!!(s.questions&&!s.open&&!state.a);
 $('#next').textContent=s.questions&&state.q<s.questions.length-1?'다음 문제 →':state.s<unit.sections.length-1?'다음 단계 →':'목록으로';
 saved.last=location.hash;saved.routes[unit.id]=location.hash;save();updateProgress();
}
$('#prev').onclick=()=>{if(!unit)return;if(state.a)return go({a:false,p:0});if(section().questions&&state.q>0)return go({q:state.q-1,a:!section().open,p:0});if(state.s>0){const s=unit.sections[state.s-1];return go({s:state.s-1,q:s.questions?s.questions.length-1:0,a:!!s.questions&&!s.open,p:0})}go({id:null,s:0,q:0,a:false,p:0})};
$('#next').onclick=()=>{if(!unit)return;const s=section();if(s.questions&&!s.open&&!state.a)return;if(s.questions&&state.q<s.questions.length-1)return go({q:state.q+1,a:false,p:0});if(state.s<unit.sections.length-1)return go({s:state.s+1,q:0,a:false,p:0});go({id:null,s:0,q:0,a:false,p:0})};
$('#completed').onchange=e=>markDone(e.target.checked);
$('#home').onclick=()=>go({id:null,s:0,q:0,a:false,p:0});
function resize(){document.documentElement.style.setProperty('--app-height',`${window.visualViewport?.height||innerHeight}px`)}
window.addEventListener('hashchange',readRoute);window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);document.fonts.ready.then(resize);if(!location.hash.startsWith('#/'))history.replaceState(null,'','#/');migrateIdiomRoutes();readRoute();resize();
