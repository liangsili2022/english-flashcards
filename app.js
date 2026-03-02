// English Flashcard App - SM-2 Spaced Repetition
'use strict';
const STATE_KEY='flashcard_state_v2';
let state={mode:'all',cards:[],current:0,isFlipped:false,todayCount:0,searchQuery:'',cardData:{}};
function loadState(){try{const r=localStorage.getItem(STATE_KEY);if(r){const s=JSON.parse(r);state.cardData=s.cardData||{};state.todayCount=isSameDay(s.lastDate)?(s.todayCount||0):0;}}catch(e){console.warn(e);}}
function saveState(){try{localStorage.setItem(STATE_KEY,JSON.stringify({cardData:state.cardData,todayCount:state.todayCount,lastDate:new Date().toDateString()}));}catch(e){}}
function isSameDay(d){return d===new Date().toDateString();}
function getCardData(w){if(!state.cardData[w])state.cardData[w]={easeFactor:2.5,interval:0,nextReview:null,reps:0,rating:null};return state.cardData[w];}
function updateCardSM2(word,rating){
  const d=getCardData(word),q={again:0,hard:1,good:3,easy:5}[rating];
  if(q>=3){if(d.reps===0)d.interval=1;else if(d.reps===1)d.interval=6;else d.interval=Math.round(d.interval*d.easeFactor);d.reps++;}else{d.reps=0;d.interval=1;}
  d.easeFactor=Math.max(1.3,d.easeFactor+0.1-(5-q)*(0.08+(5-q)*0.02));d.rating=rating;
  const nx=new Date();nx.setDate(nx.getDate()+d.interval);d.nextReview=nx.toDateString();return d;
}
function isDueForReview(w){const d=state.cardData[w];if(!d||!d.nextReview)return true;return new Date(d.nextReview)<=new Date();}
function isNew(w){return !state.cardData[w]||state.cardData[w].reps===0;}
function buildSession(){
  let pool=[...CARDS];
  if(state.searchQuery){const q=state.searchQuery.toLowerCase();pool=pool.filter(c=>c.word.toLowerCase().includes(q)||c.translation.includes(q)||c.category.toLowerCase().includes(q));}
  if(state.mode==='new')pool=pool.filter(c=>isNew(c.word));
  else if(state.mode==='review')pool=pool.filter(c=>!isNew(c.word)&&isDueForReview(c.word));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  state.cards=pool;state.current=0;state.isFlipped=false;
}
function $(id){return document.getElementById(id);}
function renderCard(){
  if(!state.cards.length){showDone(true);return;}
  const c=state.cards[state.current];if(!c){showDone(false);return;}
  $('cardInner').classList.remove('flipped');state.isFlipped=false;
  $('cardWord').textContent=c.word;$('cardPhonetic').textContent=c.phonetic||'';$('cardCategory').textContent=c.category||'';
  $('cardWordSmall').textContent=c.word;$('cardTranslation').textContent=c.translation;
  $('cardExample').textContent=c.example?`"${c.example}"`:'';
  $('cardExampleZh').textContent=c.exampleZh||'';
  $('actionButtons').style.display='none';
  $('cardCounter').textContent=`${state.current+1} / ${state.cards.length}`;
  const pct=Math.round((state.current/state.cards.length)*100);
  $('progressFill').style.width=pct+'%';$('progressText').textContent=`${state.current} / ${state.cards.length}`;
  $('prevBtn').disabled=state.current===0;$('nextBtn').disabled=state.current>=state.cards.length-1;
  $('cardArea').style.display='flex';$('completionScreen').style.display='none';$('navButtons').style.display='flex';
}
function renderStats(){
  const known=CARDS.filter(c=>{const d=state.cardData[c.word];return d&&d.reps>=3;}).length;
  const rev=CARDS.filter(c=>{const d=state.cardData[c.word];return d&&d.reps>0&&d.reps<3;}).length;
  $('todayCount').textContent=state.todayCount;$('knownCount').textContent=known;$('reviewCount').textContent=rev;
}
function showDone(empty){
  const known=CARDS.filter(c=>{const d=state.cardData[c.word];return d&&d.reps>=3;}).length;
  const rev=CARDS.filter(c=>{const d=state.cardData[c.word];return d&&d.reps>0&&d.reps<3;}).length;
  document.querySelector('.completion-title').textContent=empty?'没有匹配的卡片':'太棒了！';
  document.querySelector('.completion-text').textContent=empty?(state.mode==='review'?'今日复习完成！':state.mode==='new'?'新词已学完！':'请调整搜索条件'):'本轮学习完成！';
  $('finalKnown').textContent=known;$('finalReview').textContent=rev;$('finalTotal').textContent=CARDS.length;
  $('cardArea').style.display='none';$('completionScreen').style.display='block';$('navButtons').style.display='none';
}
function flipCard(){const ci=$('cardInner');state.isFlipped=!state.isFlipped;ci.classList.toggle('flipped',state.isFlipped);$('actionButtons').style.display=state.isFlipped?'grid':'none';}
function rateCard(r){if(!state.isFlipped)return;const c=state.cards[state.current];if(!c)return;updateCardSM2(c.word,r);state.todayCount++;saveState();renderStats();if(state.current<state.cards.length-1){state.current++;renderCard();}else showDone(false);}
function nextCard(){if(state.current<state.cards.length-1){state.current++;state.isFlipped=false;renderCard();}}
function prevCard(){if(state.current>0){state.current--;state.isFlipped=false;renderCard();}}
function setMode(m){state.mode=m;document.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));buildSession();renderCard();renderStats();}
function restartSession(){buildSession();renderCard();renderStats();}
function handleSearch(v){state.searchQuery=v.trim();buildSession();renderCard();}
document.addEventListener('keydown',e=>{
  if(document.activeElement===$('searchInput'))return;
  if(e.key===' '||e.key==='f'||e.key==='F'){e.preventDefault();flipCard();}
  else if(e.key==='ArrowRight'||e.key==='n')nextCard();
  else if(e.key==='ArrowLeft'||e.key==='p')prevCard();
  else if(e.key==='1')rateCard('again');
  else if(e.key==='2')rateCard('hard');
  else if(e.key==='3')rateCard('good');
  else if(e.key==='4')rateCard('easy');
});
let tx=0,ty=0;
$('card').addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
$('card').addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>50&&!state.isFlipped){dx<0?nextCard():prevCard();}},{passive:true});
function init(){loadState();buildSession();renderCard();renderStats();console.log('⌨️ Space/F=flip ←→=nav 1-4=rate');}
init();
