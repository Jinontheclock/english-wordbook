'use strict';
function createPronunciation(env){
 const cache=new Map(),pending=new Map(),failedAudio=new Set();
 const player=new env.Audio();let serial=0,active=null,utterance=null,rate=1,startTimer;
 const api={onState:()=>{},get:word=>cache.get(word.toLowerCase())||null,setRate:value=>{rate=Number(value)===.8?.8:1;},prepare:async words=>{const queue=[...new Set(words.map(w=>w.word))].filter(w=>/^[a-z]+(?:-[a-z]+)*$/i.test(w));async function worker(){while(queue.length)await lookup(queue.shift());}await Promise.all([worker(),worker()]);},stop,play};
 function emit(state,extra={}){api.onState({state,...extra});}
 function stop(){env.clearTimeout(startTimer);serial++;active=null;player.onended=null;player.onerror=null;player.pause();if(env.speechSynthesis)env.speechSynthesis.cancel();utterance=null;emit('idle');}
 async function lookup(word){const key=word.toLowerCase();if(cache.has(key))return cache.get(key);if(pending.has(key))return pending.get(key);
  const job=(async()=>{let timer,controller;try{controller=new env.AbortController();timer=env.setTimeout(()=>controller.abort(),5000);const response=await env.fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(key),{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)return null;const entries=await response.json();if(!Array.isArray(entries))return null;const clips=entries.flatMap(entry=>(entry.phonetics||[]).filter(p=>p.audio).map(p=>({...p,license:p.license||entry.license})));clips.sort((a,b)=>Number(/[-_]us(?:[_.-]|$)/i.test(b.audio))-Number(/[-_]us(?:[_.-]|$)/i.test(a.audio)));for(const p of clips){const url=new URL(p.audio,'https://dictionaryapi.dev/');if(url.protocol!=='https:')continue;return {url:url.href,source:safeUrl(p.sourceUrl),license:p.license?.name||'',licenseUrl:safeUrl(p.license?.url)};}return null;}catch{return null;}finally{env.clearTimeout(timer);}})();pending.set(key,job);const result=await job;cache.set(key,result);pending.delete(key);return result;
 }
 function safeUrl(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:'';}catch{return '';}}
 function play(word,id){if(active===id){stop();return;}stop();const token=serial;active=id;const recording=api.get(word);const clean=word.replace(/\s*\([^)]*\)/g,'').replace(/\//g,', ').trim();
  if(recording&&!failedAudio.has(recording.url)){
   let failed=false;emit('loading',{id,word,kind:'recording'});player.src=recording.url;player.playbackRate=rate;player.onended=()=>{if(token===serial){active=null;emit('ended',{id,word,kind:'recording'});}};player.onerror=()=>failRecording();
   const failRecording=()=>{if(token!==serial||failed)return;failed=true;failedAudio.add(recording.url);player.onended=null;player.onerror=null;player.pause();speakDevice(clean,word,id,token);};
   try{Promise.resolve(player.play()).then(()=>{if(token===serial&&!failed)emit('playing',{id,word,kind:'recording'});}).catch(failRecording);}catch{failRecording();}return;
  }
  speakDevice(clean,word,id,token);
 }
 function speakDevice(clean,word,id,token){if(!env.speechSynthesis||!env.SpeechSynthesisUtterance){active=null;emit('error',{id,word,message:'이 브라우저에서 기기 음성을 사용할 수 없습니다. 사전 녹음이 있는 단어를 선택하거나 Safari 또는 Chrome에서 열어 주세요.'});return;}
  try{utterance=new env.SpeechSynthesisUtterance(clean);utterance.lang='en-US';utterance.rate=rate;const voices=env.speechSynthesis.getVoices();const voice=voices.find(v=>v.lang==='en-US')||voices.find(v=>/^en\b/i.test(v.lang));if(voice)utterance.voice=voice;utterance.onstart=()=>{if(token!==serial)return;env.clearTimeout(startTimer);if(token===serial)emit('playing',{id,word,kind:'device'});};utterance.onend=()=>{if(token!==serial)return;env.clearTimeout(startTimer);if(token===serial){active=null;utterance=null;emit('ended',{id,word,kind:'device'});}};utterance.onerror=e=>{if(token!==serial)return;env.clearTimeout(startTimer);if(token===serial&&e.error!=='canceled'&&e.error!=='interrupted'){active=null;utterance=null;emit('error',{id,word,message:'음성을 재생하지 못했습니다. 듣기 버튼을 다시 눌러 주세요. 기기에 영어 음성이 설치되어 있어야 합니다.'});}};emit('loading',{id,word,kind:'device'});startTimer=env.setTimeout(()=>{if(token===serial&&active===id){env.speechSynthesis.cancel();active=null;emit('error',{id,word,message:'영어 음성이 시작되지 않았습니다. 듣기를 다시 누르거나 Safari 또는 Chrome에서 열어 주세요.'});}},6000);env.speechSynthesis.speak(utterance);}catch{active=null;emit('error',{id,word,message:'음성을 재생하지 못했습니다. 듣기 버튼을 다시 눌러 주세요.'});}
 }
 return api;
}
if(typeof module!=='undefined'&&module.exports)module.exports=createPronunciation;
else window.pronunciation=createPronunciation(window);
