'use strict';
// Group adjacent idiom entries without changing their transcribed text or storage keys.
(()=>{
 const source=window.BOOK,book=[],aliases={};
 const isIdiom=u=>/^Idioms #\d+$/.test(u.group||'')&&u.sections.map(s=>s.id).join(',')==='read,examples,extra';
 for(let i=0;i<source.length;){
  const first=source[i];
  if(!isIdiom(first)){book.push(first);i++;continue}
  const members=[];
  while(i<source.length&&isIdiom(source[i])&&source[i].group===first.group)members.push(source[i++]);
  const id='idioms-'+first.group.match(/\d+/)[0],start=members[0].start,end=members.at(-1).end;
  const sections=['read','examples'].map((stage,si)=>({
   id:stage,label:first.sections[si].label,
   progressKeys:members.map(u=>`${u.id}/${stage}/read`),
   idioms:members.map(u=>({id:u.id,title:u.title,page:u.page,blocks:u.sections[si].blocks,key:`${u.id}/${stage}/read`}))
  }));
  sections.push({id:'extra',label:'Extra practice',open:true,
   questions:members.map(u=>[u.sections[2].prompt,'']),
   titles:members.map(u=>u.title),pages:members.map(u=>u.page),
   questionProgressKeys:members.map(u=>`${u.id}/extra/read`),
   draftKeys:members.map(u=>`${u.id}/2/0`)});
  members.forEach((u,q)=>aliases[u.id]={id,item:u.id,q});
  book.push({id,title:first.group,start,end,page:start===end?String(start):`${start}–${end}`,members:members.map(u=>u.id),sections});
 }
 window.BOOK=book;window.IDIOM_ROUTES=aliases;
})();
