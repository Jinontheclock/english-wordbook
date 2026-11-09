'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const book=window.BOOK,KEY='english-wordbook-renewal-v1';let saved={drafts:{}};try{saved={...saved,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
let state={id:null,s:0,q:0,a:false,p:0},unit=null,pages=[],blocks=[],frame;
function save(){try{localStorage.setItem(KEY,JSON.stringify(saved))}catch{}}
function section(){return unit.sections[state.s]}
function draftKey(){return `${unit.id}/${state.s}/${state.q}`}
function url(t){const params=new URLSearchParams();if(t.id){const u=book.find(x=>x.id===t.id);params.set('section',u.sections[t.s||0].id);if(u.sections[t.s||0].questions){params.set('q',String((t.q||0)+1));if(t.a&&!u.sections[t.s||0].open)params.set('answer','1')}}if(t.p)params.set('page',String(t.p+1));return '#/'+(t.id?encodeURIComponent(t.id):'')+(params.size?'?'+params:'')}
function go(changes){const next={...state,...changes},hash=url(next);if(location.hash===hash)readRoute();else location.hash=hash}
function readRoute(){
 const raw=location.hash.slice(2).split('?'),params=new URLSearchParams(raw[1]||'');let id='';try{id=decodeURIComponent(raw[0]||'')}catch{}
 unit=book.find(u=>u.id===id)||null;const si=unit?unit.sections.findIndex(s=>s.id===params.get('section')):0;
 const n=(k)=>Math.max(0,(parseInt(params.get(k),10)||1)-1);
 state={id:unit?.id||null,s:Math.max(0,si),q:0,a:params.get('answer')==='1',p:n('page')};if(unit&&section().questions)state.q=Math.min(n('q'),section().questions.length-1);else state.a=false;if(unit&&section().open)state.a=false;
 render();
}
function render(){
 document.body.classList.remove('typing');const form=$('#response');form.hidden=true;form.innerHTML='';
 if(!unit){$('#source').textContent='';$('#heading').innerHTML='<h1>단원 선택</h1>';$('#sections').innerHTML='';blocks=[];paginate();return}
 document.title=unit.title+' · 영어 단어장';const s=section();$('#source').textContent=`p. ${unit.page}`;
 $('#heading').innerHTML=`<h1 lang="en">${esc(unit.title)}</h1><p class="meta">${s.questions?`${s.label} · ${s.numbers?.[state.q]||state.q+1} / ${s.numbers?.at(-1)||s.questions.length}`:esc(unit.group||s.label)}</p>`;
 $('#sections').innerHTML=unit.sections.length>3?`<label class=sr-only for=stage>학습 단계</label><select id=stage>${unit.sections.map((x,i)=>`<option value=${i} ${state.s===i?'selected':''}>${esc(x.label)}</option>`).join('')}</select>`:unit.sections.map((s,i)=>`<a href="${esc(url({...state,s:i,q:0,a:false,p:0}))}" aria-current="${state.s===i?'step':'false'}">${esc(s.label)}</a>`).join('');if($('#stage'))$('#stage').onchange=e=>go({s:Number(e.target.value),q:0,a:false,p:0});
 if(s.questions){const [prompt,answer]=s.questions[state.q];blocks=state.a?[[`Answers · ${s.numbers?.[state.q]||state.q+1}`,answer]]:[[`${s.label} · ${s.numbers?.[state.q]||state.q+1}`,prompt]];if(!state.a)input(s.open?'답 저장':'정답 확인')}
 else if(s.prompt){blocks=[['Extra practice',s.prompt]];input('답 저장')}
 else blocks=s.blocks;
 paginate();
}
function input(action){const form=$('#response');form.hidden=false;form.innerHTML=`<label for="draft">내 답</label><input id="draft" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(saved.drafts[draftKey()]||'')}"><button type="submit">${action}</button>`;
 const field=$('#draft');field.oninput=()=>{saved.drafts[draftKey()]=field.value;save()};field.onfocus=()=>{document.body.classList.add('typing');resize()};field.onblur=()=>{document.body.classList.remove('typing');resize()};form.onsubmit=e=>{e.preventDefault();field.blur();if(section().questions&&!section().open)go({a:true,p:0});else{save();form.querySelector('button').textContent='저장됨'}};
}
function sheet(title,text){return `<div class="sheet">${title?`<h2 lang="en">${esc(title)}</h2>`:''}<p lang="en">${esc(text)}</p></div>`}
function paginate(){
 const area=$('#content'),height=area.clientHeight;if(height<1||area.clientWidth<1)return;pages=[];
 const probe=document.createElement('div');probe.className='sheet';probe.style.cssText='position:absolute;visibility:hidden;top:0;left:0;width:100%;pointer-events:none';area.replaceChildren(probe);
 const fits=html=>{probe.innerHTML=html;return probe.getBoundingClientRect().height<=height-2};
 if(!unit){let html='';for(const u of book){const entry=`<a class="entry" href="${esc(url({id:u.id,s:0,q:0,a:false,p:0}))}">${esc(u.title)}<small>${esc(u.group||'Dialogue · Vocabulary · Practice')} · p. ${esc(u.page)}</small></a>`;if(html&&!fits(html+entry)){pages.push(`<div class="sheet">${html}</div>`);html=''}html+=entry}if(html)pages.push(`<div class="sheet">${html}</div>`)}
 else for(const [title,text] of blocks){const tokens=String(text).match(/\S+\s*/g)||[''];let start=0;while(start<tokens.length){let lo=1,hi=tokens.length-start,best=0;const head=title?`<h2 lang="en">${esc(title)}</h2>`:'';while(lo<=hi){const mid=(lo+hi)>>1;if(fits(head+`<p lang="en">${esc(tokens.slice(start,start+mid).join(''))}</p>`)){best=mid;lo=mid+1}else hi=mid-1}best=Math.max(1,best);pages.push(sheet(title,tokens.slice(start,start+best).join('')));start+=best}}
 state.p=Math.min(state.p,Math.max(0,pages.length-1));const canonical=url(state);if(location.hash!==canonical)history.replaceState(null,'',canonical);paint();
}
function paint(){
 $('#content').innerHTML=pages[state.p]||'';$('#count').textContent=`${state.p+1} / ${pages.length}`;
 $('#prev').disabled=!unit&&state.p===0;$('#next').disabled=!unit&&state.p===pages.length-1;
 $('#next').textContent='다음 →';if(unit&&state.p===pages.length-1){const s=section();if(s.questions&&!s.open&&!state.a){$('#next').textContent='다음 문제 →';$('#next').disabled=true}else if(s.questions&&state.q<s.questions.length-1)$('#next').textContent='다음 문제 →';else $('#next').textContent=state.s<unit.sections.length-1?'다음 단계 →':'목록으로'}
 if(unit){saved.last=location.hash;save()}
}
$('#prev').onclick=()=>{if(state.p>0)return go({p:state.p-1});if(!unit)return;if(state.a)return go({a:false,p:0});if(section().questions&&state.q>0)return go({q:state.q-1,a:!section().open,p:0});if(state.s>0){const s=unit.sections[state.s-1];return go({s:state.s-1,q:s.questions?s.questions.length-1:0,a:!!s.questions&&!s.open,p:99999})}go({id:null,s:0,q:0,a:false,p:0})};
$('#next').onclick=()=>{if(state.p<pages.length-1)return go({p:state.p+1});if(!unit)return;const s=section();if(s.questions&&!s.open&&!state.a)return;if(s.questions&&state.q<s.questions.length-1)return go({q:state.q+1,a:false,p:0});if(state.s<unit.sections.length-1)return go({s:state.s+1,q:0,a:false,p:0});go({id:null,s:0,q:0,a:false,p:0})};
$('#home').onclick=()=>go({id:null,s:0,q:0,a:false,p:0});
function resize(){document.documentElement.style.setProperty('--app-height',`${window.visualViewport?.height||innerHeight}px`);cancelAnimationFrame(frame);frame=requestAnimationFrame(paginate)}
window.addEventListener('hashchange',readRoute);window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);document.fonts.ready.then(resize);if(!location.hash.startsWith('#/'))history.replaceState(null,'','#/');readRoute();resize();
