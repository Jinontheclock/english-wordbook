'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const book=window.BOOK,KEY='english-wordbook-renewal-v1';let saved={drafts:{},progress:{},positions:{},routes:{}};try{saved={...saved,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
let state={id:null,s:0,q:0,a:false,p:0},unit=null,blocks=[];
const scrollPositions=new Map(Object.entries(saved.positions));let currentRoute="";
function save(){try{localStorage.setItem(KEY,JSON.stringify(saved))}catch{}}
function section(){return unit.sections[state.s]}
function progressKey(u=unit,stage=section(),q=state.q){return `${u.id}/${stage.id}/${stage.questions?q:'read'}`}
function stageDone(u,stage){return stage.questions?stage.questions.every((_,q)=>saved.progress[progressKey(u,stage,q)]):!!saved.progress[progressKey(u,stage)]}
function stats(u){let done=0,total=0;for(const stage of u.sections){const n=stage.questions?.length||1;total+=n;for(let q=0;q<n;q++)if(saved.progress[progressKey(u,stage,q)])done++}return {done,total}}
function markDone(done=true){if(!unit)return;const key=progressKey();if(done)saved.progress[key]=true;else delete saved.progress[key];save();updateProgress()}
function updateProgress(){
 if(!unit)return;$('#completed').checked=!!saved.progress[progressKey()];$('#completed-label').textContent=section().questions?'문항 완료':'학습 완료';
 $('#sections').querySelectorAll('a').forEach((a,i)=>{a.textContent=unit.sections[i].label+(stageDone(unit,unit.sections[i])?' ✓':'')});
 $('#sections').querySelectorAll('option').forEach((a,i)=>{a.textContent=unit.sections[i].label+(stageDone(unit,unit.sections[i])?' ✓':'')});
}
function rememberScroll(){if(!currentRoute)return;const top=$('#content').scrollTop;scrollPositions.set(currentRoute,top);saved.positions[currentRoute]=top;save()}
let scrollTimer;$('#content').addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(rememberScroll,180)});window.addEventListener('pagehide',rememberScroll);
function draftKey(){return `${unit.id}/${state.s}/${state.q}`}
function url(t){const params=new URLSearchParams();if(t.id){const u=book.find(x=>x.id===t.id);params.set('section',u.sections[t.s||0].id);if(u.sections[t.s||0].questions){params.set('q',String((t.q||0)+1));if(t.a&&!u.sections[t.s||0].open)params.set('answer','1')}}return '#/'+(t.id?encodeURIComponent(t.id):'')+(params.size?'?'+params:'')}
function go(changes){const next={...state,...changes},hash=url(next);if(location.hash===hash)readRoute();else location.hash=hash}
function readRoute(){
 clearTimeout(scrollTimer);rememberScroll();
 const raw=location.hash.slice(2).split('?'),params=new URLSearchParams(raw[1]||'');let id='';try{id=decodeURIComponent(raw[0]||'')}catch{}
 unit=book.find(u=>u.id===id)||null;const si=unit?unit.sections.findIndex(s=>s.id===params.get('section')):0;
 const n=(k)=>Math.max(0,(parseInt(params.get(k),10)||1)-1);
 state={id:unit?.id||null,s:Math.max(0,si),q:0,a:params.get('answer')==='1',p:n('page')};if(unit&&section().questions)state.q=Math.min(n('q'),section().questions.length-1);else state.a=false;if(unit&&section().open)state.a=false;
 currentRoute=url(state);if(location.hash!==currentRoute)history.replaceState(null,'',currentRoute);render();
 $('#content').scrollTop=scrollPositions.get(currentRoute)||0;
}
function render(){
 document.body.classList.remove('typing');const form=$('#response');form.hidden=true;form.innerHTML='';
 if(!unit){$('#source').textContent='';$('#heading').innerHTML='<h1>단원 선택</h1>';$('#sections').innerHTML='';document.title='영어 단어장';blocks=[];paint();return}
 document.title=unit.title+' · 영어 단어장';const s=section();$('#source').textContent=`p. ${unit.page}`;
 $('#heading').innerHTML=`<h1 lang="en">${esc(unit.title)}</h1><p class="meta">${s.questions?`${s.label} · ${s.numbers?.[state.q]||state.q+1} / ${s.numbers?.at(-1)||s.questions.length}`:esc(unit.group||s.label)}</p>`;
 $('#sections').innerHTML=unit.sections.length>3?`<label class=sr-only for=stage>학습 단계</label><select id=stage>${unit.sections.map((x,i)=>`<option value=${i} ${state.s===i?'selected':''}>${esc(x.label)}</option>`).join('')}</select>`:unit.sections.map((s,i)=>`<a href="${esc(url({...state,s:i,q:0,a:false,p:0}))}" aria-current="${state.s===i?'step':'false'}">${esc(s.label)}</a>`).join('');if($('#stage'))$('#stage').onchange=e=>go({s:Number(e.target.value),q:0,a:false,p:0});
 if(s.questions){const [prompt,answer]=s.questions[state.q];blocks=state.a?[[`Answers · ${s.numbers?.[state.q]||state.q+1}`,answer]]:[[`${s.label} · ${s.numbers?.[state.q]||state.q+1}`,prompt]];if(!state.a)input(s.open?'답 저장':'정답 확인')}
 else if(s.prompt){blocks=[['Extra practice',s.prompt]];input('답 저장')}
 else blocks=s.blocks;
 paint();
}
function input(action){const form=$('#response');form.hidden=false;form.innerHTML=`<label for="draft">내 답</label><input id="draft" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(saved.drafts[draftKey()]||'')}"><button type="submit">${action}</button>`;
 const field=$('#draft');field.oninput=()=>{saved.drafts[draftKey()]=field.value;save()};field.onfocus=()=>{document.body.classList.add('typing');resize()};field.onblur=()=>{document.body.classList.remove('typing');resize()};form.onsubmit=e=>{e.preventDefault();field.blur();if(section().questions&&!section().open){markDone();go({a:true,p:0})}else{markDone();form.querySelector('button').textContent='저장됨'}};
}
function sheet(title,text){return `<div class="sheet">${title?`<h2 lang="en">${esc(title)}</h2>`:''}<p lang="en">${esc(text)}</p></div>`}
function vocabularySheet(title,text,i){
 const meaning=window.KOREAN?.[title];
 return `<section class="sheet vocabulary"><div class="word-row"><h2 lang="en">${esc(title)}</h2>${meaning?`<button type="button" class="meaning-toggle" aria-expanded="false" aria-controls="meaning-${i}" aria-label="${esc(title)} 한국어 뜻 보기">한국어 뜻</button>`:''}</div><p lang="en">${esc(text)}</p>${meaning?`<p class="korean-meaning" id="meaning-${i}" lang="ko" hidden>${esc(meaning)}</p>`:''}</section>`;
}
$('#content').addEventListener('click',e=>{
 const button=e.target.closest('.meaning-toggle');if(!button)return;
 const expanded=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!expanded));
 document.getElementById(button.getAttribute('aria-controls')).hidden=expanded;
 button.textContent=expanded?'한국어 뜻':'뜻 숨기기';
});
function paint(){
 const area=$('#content');
 if(!unit){
 const last=book.find(u=>saved.last?.startsWith('#/'+encodeURIComponent(u.id)+'?'));const finished=book.filter(u=>{const n=stats(u);return n.done===n.total}).length;
 area.innerHTML=(last?`<a class="resume" href="${esc(saved.last)}"><span>이어서 학습 →</span><strong>${esc(last.title)}</strong></a>`:'')+`<p class="overall">${finished} / ${book.length} 단원 완료 <small>이 브라우저에 자동 저장</small></p>`+book.map(u=>{const n=stats(u);return `<a class="entry" href="${esc(saved.routes[u.id]||url({id:u.id,s:0,q:0,a:false,p:0}))}"><span class="entry-title">${esc(u.title)}${n.done===n.total?'<span class="done-badge">완료 ✓</span>':''}</span><small>${esc(u.group||'Dialogue · Vocabulary · Practice')} · p. ${esc(u.page)}</small><span class="entry-progress">${n.done?`${n.done} / ${n.total} 학습 완료`:'시작 전'}</span><span class="progress-track" aria-hidden="true"><span style="width:${n.done/n.total*100}%"></span></span></a>`}).join('');$('footer').hidden=true;return}

 area.innerHTML=blocks.map(([title,text],i)=>section().id==='vocabulary'?vocabularySheet(title,text,i):sheet(title,text)).join('');$('footer').hidden=false;
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
window.addEventListener('hashchange',readRoute);window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);document.fonts.ready.then(resize);if(!location.hash.startsWith('#/'))history.replaceState(null,'','#/');readRoute();resize();
