'use strict';
(()=>{
 const synth=window.speechSynthesis;
 let voices=[],serial=0,active=null,utterance=null,startTimer=null;
 const loadVoices=()=>{try{voices=synth?.getVoices()||[]}catch{voices=[]}};
 loadVoices();synth?.addEventListener?.('voiceschanged',loadVoices);
 function resetButton(button){if(!button)return;button.textContent='발음';button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`${button.dataset.pronounce} 영어 발음 듣기`)}
 function showStatus(button,message){const status=button.closest('.vocabulary')?.querySelector('.speech-status');if(status){status.textContent=message;status.hidden=!message}}
 function finish(token){if(token!==serial)return;clearTimeout(startTimer);startTimer=null;resetButton(active?.button);active=null;utterance=null}
 function stop(){serial++;clearTimeout(startTimer);startTimer=null;const button=active?.button;active=null;utterance=null;resetButton(button);try{synth?.cancel()}catch{}}
 function play(button){
  if(active?.button===button){stop();return}
  stop();showStatus(button,'');
  if(!synth||!window.SpeechSynthesisUtterance){showStatus(button,'이 브라우저에서는 발음 재생을 지원하지 않아요. Safari나 Chrome에서 열어 주세요.');return}
  const text=button.dataset.pronounce?.trim();if(!text)return;
  loadVoices();const english=voices.filter(v=>/^en(?:[-_]|$)/i.test(v.lang)),us=english.filter(v=>/^en[-_]US$/i.test(v.lang));
  const voice=us.find(v=>v.default)||us.find(v=>v.localService)||us[0]||english.find(v=>v.localService)||english[0];
  const token=serial;
  utterance=new window.SpeechSynthesisUtterance(text.replace(/[’‘]/g,"'").replace(/\s+/g,' '));
  utterance.lang=voice?.lang||'en-US';if(voice)utterance.voice=voice;utterance.rate=0.9;utterance.pitch=1;utterance.volume=1;
  active={button};button.textContent='정지';button.setAttribute('aria-pressed','true');button.setAttribute('aria-label',`${text} 영어 발음 정지`);
  utterance.onstart=()=>{if(token===serial){clearTimeout(startTimer);startTimer=null}};
  utterance.onend=()=>finish(token);
  utterance.onerror=event=>{if(token!==serial)return;finish(token);if(!['canceled','interrupted'].includes(event.error))showStatus(button,'발음을 재생하지 못했어요. 기기의 영어 음성을 확인하고 다시 눌러 주세요.')};
  startTimer=setTimeout(()=>{if(token===serial&&active){stop();showStatus(button,'발음을 시작하지 못했어요. 다시 눌러 주세요.')}},8000);
  try{if(synth.paused)synth.resume();synth.speak(utterance)}catch{finish(token);showStatus(button,'발음을 재생하지 못했어요. 다시 눌러 주세요.')}
 }
 document.querySelector('#content').addEventListener('click',event=>{const button=event.target.closest('[data-pronounce]');if(button)play(button)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
 window.addEventListener('pagehide',stop);
 window.WORDBOOK_AUDIO={stop};
})();
