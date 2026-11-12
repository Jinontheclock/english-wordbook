'use strict';
(()=>{
 let serial=0,active=null,startTimer=null,currentUnit=null;const loads=new Map();
 function resetButton(button){if(!button)return;button.textContent='발음';button.setAttribute('aria-pressed','false');button.removeAttribute('aria-busy');button.setAttribute('aria-label',`${button.dataset.pronounce} 영어 발음 듣기`)}
 function showStatus(button,message,path){
  const status=button.closest('.vocabulary')?.querySelector('.speech-status');if(!status)return;
  status.textContent=message;status.hidden=!message;
  if(path?.startsWith('data:')){const player=document.createElement('audio');player.controls=true;player.preload='metadata';player.src=path;status.append(player)}
  else if(path){const link=document.createElement('a');link.href=path;link.target='_blank';link.rel='noopener';link.textContent='음성 파일 직접 열기';status.append(' ',link)}
 }
 function stop(){
  serial++;clearTimeout(startTimer);startTimer=null;const previous=active;active=null;resetButton(previous?.button);
  if(previous){previous.audio.pause();previous.audio.removeAttribute('src');previous.audio.load();previous.audio.remove()}
 }
 function fail(token,message){if(token!==serial||!active)return;const {button,path}=active;stop();showStatus(button,message,path)}
 function prepare(unitId){
  currentUnit=unitId;const pending=[...document.querySelectorAll('[data-pronounce]')].filter(button=>!window.WORDBOOK_AUDIO_FILES?.[button.dataset.pronounce]);
  if(!pending.length)return;
  const bundle=window.WORDBOOK_AUDIO_BUNDLES?.[unitId];if(!bundle)return;
  pending.forEach(button=>{button.disabled=true;button.textContent='준비';button.setAttribute('aria-busy','true')});
  if(!loads.has(unitId)){
   const task=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=bundle;const timer=setTimeout(()=>{script.remove();reject(new Error('Audio bundle timed out'))},15000);script.onload=()=>{clearTimeout(timer);resolve()};script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('Audio bundle unavailable'))};document.head.append(script)});
   loads.set(unitId,task);task.catch(()=>{loads.delete(unitId)});
  }
  loads.get(unitId).then(()=>{for(const button of pending){button.disabled=false;resetButton(button);showStatus(button,'')}},()=>{for(const button of pending){button.disabled=false;resetButton(button)}if(pending[0]?.isConnected)showStatus(pending[0],'발음 파일을 불러오지 못했어요. 발음 버튼을 눌러 다시 시도해 주세요.')});
 }
 function play(button){
  if(active?.button===button){stop();return}
  stop();showStatus(button,'');const text=button.dataset.pronounce?.trim(),path=window.WORDBOOK_AUDIO_FILES?.[text];
  if(!path){prepare(currentUnit);showStatus(button,'발음 파일을 준비하고 있어요. 잠시 후 다시 눌러 주세요.');return}
  const token=serial,audio=document.createElement('audio');audio.id='pronunciation-audio';audio.preload='auto';audio.hidden=true;audio.setAttribute('playsinline','');audio.muted=false;audio.volume=1;audio.src=path;
  active={button,audio,path};document.body.append(audio);
  button.textContent='로딩';button.setAttribute('aria-busy','true');button.setAttribute('aria-label',`${text} 발음 준비 중, 취소`);
  audio.addEventListener('playing',()=>{
   if(token!==serial)return;clearTimeout(startTimer);startTimer=null;
   button.textContent='정지';button.removeAttribute('aria-busy');button.setAttribute('aria-pressed','true');button.setAttribute('aria-label',`${text} 영어 발음 정지`);
  });
  audio.addEventListener('ended',()=>{if(token===serial)stop()});
  audio.addEventListener('error',()=>fail(token,'발음 파일을 불러오지 못했어요. 아래에서 직접 재생해 주세요.'));
  startTimer=setTimeout(()=>fail(token,'재생이 지연되고 있어요. 아래에서 직접 재생해 주세요.'),15000);
  // Call play synchronously inside the user's tap; do not await a fetch/voice load on iOS.
  try{const request=audio.play();request?.catch(error=>fail(token,error.name==='NotAllowedError'?'재생이 차단됐어요. 아래에서 직접 재생해 주세요.':'발음을 재생하지 못했어요. 아래에서 직접 재생해 주세요.'))}
  catch{fail(token,'발음을 재생하지 못했어요. 아래에서 직접 재생해 주세요.')}
 }
 document.querySelector('#content').addEventListener('click',event=>{const button=event.target.closest('[data-pronounce]');if(button)play(button)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',stop);
 window.WORDBOOK_AUDIO={stop,prepare};
})();
