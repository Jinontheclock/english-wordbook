'use strict';
const $=s=>document.querySelector(s),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const book=window.BOOK,KEY='english-wordbook-renewal-v1';let saved={drafts:{},last:null};try{saved={...saved,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
let unit=null,sectionIndex=0,question=0,answerMode=false,pages=[],page=0,blocks=[];
function save(){try{localStorage.setItem(KEY,JSON.stringify(saved))}catch{}}
function key(){return `${unit.id}/${sectionIndex}/${question}`}
function section(){return unit.sections[sectionIndex]}
function paragraph(title,text){return `<div class="sheet">${title?`<h2 lang="en">${escape(title)}</h2>`:''}<p lang="en">${escape(text)}</p></div>`}
function paginate(){
 const area=$('#content'),height=area.clientHeight,width=area.clientWidth;if(height<1||width<1)return;
 const old=page;pages=[];
 const probe=document.createElement('div');probe.className='sheet';probe.style.cssText='position:absolute;visibility:hidden;top:0;left:0;width:100%;pointer-events:none';area.replaceChildren(probe);
 function fits(html){probe.innerHTML=html;return probe.getBoundingClientRect().height<=height-2}
 if(!unit){
  let html='';for(let i=0;i<book.length;i++){const u=book[i],entry=`<button class="entry" data-unit="${i}">${escape(u.title)}<small>${escape(u.group||'Dialogue · Vocabulary · Practice')} · p. ${escape(u.page)}</small></button>`;if(html&&!fits(html+entry)){pages.push(`<div class="sheet">${html}</div>`);html=''}html+=entry}if(html)pages.push(`<div class="sheet">${html}</div>`);
 }else{
  for(const [title,text] of blocks){
   const tokens=text.match(/\S+\s*/g)||[''];let start=0;
   while(start<tokens.length){let lo=1,hi=tokens.length-start,best=0;const head=title?`<h2 lang="en">${escape(title)}</h2>`:'';
    while(lo<=hi){const mid=(lo+hi)>>1;if(fits(head+`<p lang="en">${escape(tokens.slice(start,start+mid).join(''))}</p>`)){best=mid;lo=mid+1}else hi=mid-1}
    if(!best){probe.style.fontSize='14px';probe.style.lineHeight='1.4';best=1}
    pages.push(paragraph(title,tokens.slice(start,start+best).join('')));start+=best;
   }
  }
 }
 page=Math.min(old,Math.max(0,pages.length-1));paint();
}
function paint(){
 $('#content').innerHTML=pages[page]||'';
 $('#content').querySelectorAll('[data-unit]').forEach(el=>el.onclick=()=>openUnit(Number(el.dataset.unit)));
 $('#count').textContent=`${page+1} / ${pages.length}`;
 $('#prev').disabled=!unit?page===0:page===0&&sectionIndex===0&&!answerMode&&question===0;
 $('#next').disabled=!unit?page===pages.length-1:false;
 if(!unit)$('#next').textContent='다음 →';else if(page<pages.length-1)$('#next').textContent='다음 →';else if(section().questions&&!answerMode){$('#next').textContent='다음 문제 →';$('#next').disabled=true}else $('#next').textContent=section().questions&&answerMode?(question<section().questions.length-1?'다음 문제 →':'목록으로'):(sectionIndex<unit.sections.length-1?'다음 단계 →':'목록으로');
 if(unit){saved.last={id:unit.id,sectionIndex,question,page};save()}
}
function home(){unit=null;page=0;document.body.classList.remove('typing');$('#source').textContent='구성 초안';$('#heading').innerHTML='<h1>단원 선택</h1><p class="meta">Making Waves · Idioms #1 발췌</p>';$('#sections').innerHTML='';$('#response').hidden=true;paginate()}
function openUnit(index){unit=book[index];sectionIndex=0;question=0;answerMode=false;page=0;render()}
function render(){
 document.body.classList.remove('typing');const s=section();$('#source').textContent=`p. ${unit.page}`;
 $('#heading').innerHTML=`<h1 lang="en">${escape(unit.title)}</h1><p class="meta">${s.questions?`${s.label} · ${question+1} / ${s.questions.length}`:escape(unit.group||s.label)}</p>`;
 $('#sections').innerHTML=unit.sections.map((s,i)=>`<button data-section="${i}" aria-current="${sectionIndex===i?'step':'false'}">${escape(s.label)}</button>`).join('');
 $('#sections').querySelectorAll('button').forEach(el=>el.onclick=()=>{sectionIndex=Number(el.dataset.section);question=0;page=0;answerMode=false;render()});
 const form=$('#response');form.hidden=true;form.innerHTML='';
 if(s.questions){const [prompt,answer]=s.questions[question];blocks=answerMode?[[`Answers · ${question+1}`,answer]]:[[`Practice · ${question+1}`,prompt]];if(!answerMode)showInput('내 답','정답 확인');}
 else if(s.prompt){blocks=[['Extra practice',s.prompt]];showInput('내 답','답 저장');}
 else blocks=s.blocks;
 paginate();
}
function showInput(label,button){const form=$('#response');form.hidden=false;form.innerHTML=`<label for="draft">${label}</label><input id="draft" aria-label="${label}" autocomplete="off" autocapitalize="none" spellcheck="false" value="${escape(saved.drafts[key()]||'')}"><button type="submit">${button}</button>`;
 const input=$('#draft');input.oninput=()=>{saved.drafts[key()]=input.value;save()};input.onfocus=()=>{document.body.classList.add('typing');resize()};input.onblur=()=>{document.body.classList.remove('typing');resize()};
 form.onsubmit=e=>{e.preventDefault();input.blur();if(section().questions){answerMode=true;page=0;render()}else{form.querySelector('button').textContent='저장됨';save()}};
}
$('#prev').onclick=()=>{if(page>0){page--;paint();return}if(!unit)return;if(answerMode){answerMode=false;page=0;render()}else if(section().questions&&question>0){question--;answerMode=false;render()}else if(sectionIndex>0){sectionIndex--;question=0;answerMode=false;page=0;render();page=pages.length-1;paint()}};
$('#next').onclick=()=>{if(page<pages.length-1){page++;paint();return}if(!unit)return;const s=section();if(s.questions&&!answerMode){answerMode=true;page=0;render();return}if(s.questions&&question<s.questions.length-1){question++;answerMode=false;page=0;render();return}if(sectionIndex<unit.sections.length-1){sectionIndex++;question=0;answerMode=false;page=0;render()}else home()};
$('#home').onclick=home;
let frame;function resize(){document.documentElement.style.setProperty('--app-height',`${window.visualViewport?.height||innerHeight}px`);cancelAnimationFrame(frame);frame=requestAnimationFrame(paginate)}
window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);document.fonts.ready.then(resize);home();resize();
