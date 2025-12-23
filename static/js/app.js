(() => {
  // Minimal mobile-first cricket scorer
  const $ = sel => document.querySelector(sel);
  const qs = sel => Array.from(document.querySelectorAll(sel));

  const loader = $('#loader');
  const app = $('#app');
  const setup = $('#setup');
  const rules = $('#rules');
  const live = $('#live');
  const result = $('#result');

  const setupForm = $('#setupForm');
  const rulesForm = $('#rulesForm');

  const onStrikeSel = $('#onStrike');
  const nonStrikeSel = $('#nonStrike');
  const bowlerSel = $('#bowler');
  const overTracker = $('#overTracker');
  const scoreLabel = $('#score');
  const teamALabel = $('#teamALabel');
  const teamBLabel = $('#teamBLabel');

  const resultSummary = $('#resultSummary');
  const playerStats = $('#playerStats');
  const matchesPanel = $('#matchesPanel');
  const matchesList = $('#matchesList');
  const openMatchesBtn = $('#openMatches');
  const closeMatchesBtn = $('#closeMatches');
  let state = null;

  function showLoaderThenApp(){
    console.log('showLoaderThenApp: loader=', !!loader, 'app=', !!app);
    setTimeout(()=>{
      try{
        if(loader){ loader.classList.add('hidden'); loader.style.display = 'none'; }
        if(app){ app.classList.remove('hidden'); app.style.display = 'block'; }
        console.log('showLoaderThenApp: hideloader, showapp; loader.class=', loader && loader.className, 'app.class=', app && app.className);
      }catch(err){
        console.error('Error toggling loader/app', err);
      }
    },500);
  }

  function parsePlayers(text){
    return text.split(',').map(s=>s.trim()).filter(Boolean);
  }

  function initState(data){
    const playersA = data.playersA.map(name=>({name,runs:0,balls:0,wickets:0,ballsBowled:0,overs:0,conceded:0}));
    const playersB = data.playersB.map(name=>({name,runs:0,balls:0,wickets:0,ballsBowled:0,overs:0,conceded:0}));
    state = {
      teamA:{name:data.teamA,players:playersA,score:0,wickets:0,overs:0,balls:0,completed:false},
      teamB:{name:data.teamB,players:playersB,score:0,wickets:0,overs:0,balls:0,completed:false},
      config:{overs:data.overs,countExtras:data.countExtras,freeHit:data.freeHit,tossWinner:data.tossWinner,tossDecision:data.tossDecision},
      innings:1, // 1 => team batting is based on toss decision
      battingSide: data.tossDecision==='bat' ? (data.tossWinner==='A'?'A':'B') : (data.tossWinner==='A'?'B':'A'),
      onStrikeIndex:0, nonStrikeIndex:1, bowlerIndex:2,
      currentOver: Array(6).fill(null), // array of ball objects
      history:[],
      freeHit:false
    };
  }

  function getBatting(){ return state.battingSide==='A' ? state.teamA : state.teamB }
  function getBowling(){ return state.battingSide==='A' ? state.teamB : state.teamA }

  function populateSelectors(){
    const batting = getBatting();
    [onStrikeSel, nonStrikeSel, bowlerSel].forEach(sel=>sel.innerHTML='');
    batting.players.forEach((p,idx)=>{
      const opt = document.createElement('option'); opt.value=idx; opt.textContent=p.name; onStrikeSel.appendChild(opt.cloneNode(true)); nonStrikeSel.appendChild(opt.cloneNode(true));
    });
    // bowlers from bowling side
    const bowlingSide = getBowling();
    bowlingSide.players.forEach((p,idx)=>{ const opt=document.createElement('option'); opt.value=idx; opt.textContent=p.name; bowlerSel.appendChild(opt); });
    onStrikeSel.selectedIndex = state.onStrikeIndex||0;
    nonStrikeSel.selectedIndex = state.nonStrikeIndex||1;
    bowlerSel.selectedIndex = state.bowlerIndex||0;
    syncStrikeSelectors();
  }

  function syncStrikeSelectors(){
  const strike = onStrikeSel.value;
  Array.from(nonStrikeSel.options).forEach(opt => {
    opt.disabled = opt.value === strike;
  });

  const nonStrike = nonStrikeSel.value;
  Array.from(onStrikeSel.options).forEach(opt => {
    opt.disabled = opt.value === nonStrike;
  });
}

  onStrikeSel.addEventListener('change', syncStrikeSelectors);
  nonStrikeSel.addEventListener('change', syncStrikeSelectors);
  
  function renderOverTracker(){
    if(!state || !state.currentOver) return;
    overTracker.innerHTML = '';
    state.currentOver.forEach((ball, i) => {
    const div = document.createElement('div');
    div.className = 'ball';
    div.dataset.idx = i;
    div.textContent = ball?ball.display:'-';
    overTracker.appendChild(div);
  });
}

  function renderScore(){
    const batting = getBatting();
    const bowling = getBowling();
    const overs = Math.floor(batting.balls/6) + '.' + (batting.balls%6);
    scoreLabel.textContent = `${batting.score}/${batting.wickets} (${overs})`;
    teamALabel.textContent = state.teamA.name;
    teamBLabel.textContent = state.teamB.name;
  }

  function updateOverTrackerUI(){
    if(!state || !Array.isArray(state.currentOver)) return;
    const slots = qs('.ball');
    // if state or currentOver isn't ready, clear UI
    if(slots.length !== state.currentOver.length){
    renderOverTracker();
  }

  qs('.ball').forEach((s, i)=>{
    const ball = state.currentOver[i];
    if(ball){
      s.textContent = ball.display;
      s.classList.add('done');
    } else {
      s.textContent='-';
      s.classList.remove('done');
    }
  });
  }

  function recordBall({type='run',runs=0}){
    const batting = getBatting();
    const bowling = getBowling();
    const striker = batting.players[+onStrikeSel.value];
    const bowler = bowling.players[+bowlerSel.value];

    const ballObj = {type,runs,display:'',freeHitApplied:state.freeHit};
    if(type==='run'){
      batting.score += runs;
      batting.balls += 1; striker.runs += runs; striker.balls +=1;
      bowler.ballsBowled +=1; bowler.conceded += runs;
      ballObj.display = runs.toString();
      if(runs%2===1) swapStrike();
    } else if(type==='wide'){
      // wide: doesn't count as legal ball
      if(state.config.countExtras) batting.score += 1; bowler.conceded +=1; ballObj.display='WD';
    } else if(type==='noball'){
      if(state.config.countExtras) batting.score += 1; bowler.conceded +=1; ballObj.display='NB';
      if(state.config.freeHit) state.freeHit = true;
    } else if(type==='wicket'){
      batting.wickets +=1; 
      if(batting.wickets===batting.players.length){
        endInnings();
      }
      batting.balls +=1; 
      striker.balls +=1; 
      bowler.wickets = (bowler.wickets||0)+1; 
      bowler.ballsBowled +=1; 
      ballObj.display='W'; 
      batting.wicketsRemaining-=1;
    }

    // place in currentOver (legal deliveries only increment ball slot)
    if(type==='run' || type==='wicket'){
      // find next empty legal slot
      let idx = state.currentOver.findIndex(b=>b==null);
      if(idx===-1){ idx = state.currentOver.length; }
      state.currentOver[idx] = ballObj;
    } 
    else {
      // extras should appear before legal empty slots
      const firstEmptyIdx = state.currentOver.findIndex(b => b === null);
      if (firstEmptyIdx === -1) {
        state.currentOver.push(ballObj);
      } else {
        state.currentOver.splice(firstEmptyIdx, 0, ballObj);
      }
    }

    state.history.push(ballObj);
    renderScore(); updateOverTrackerUI();

    // check over completion
    const legalBalls = state.currentOver.filter(b=>b && (b.display!=='WD' && b.display!=='NB')).length;
    if(legalBalls>=6){ finishOver(); }
  }

  function finishOver(){
    // finalize over: increment bowls and overs
    const batting = getBatting();
    const bowling = getBowling();
    const bowler = bowling.players[+bowlerSel.value];
    // count legal balls
    const legal = state.currentOver.filter(b=>b && (b.display!=='WD' && b.display!=='NB')).length;
    batting.overs += Math.floor((batting.balls)/6);
    bowler.overs = Math.floor(bowler.ballsBowled/6);
    // reset current over
    state.currentOver = Array(6).fill(null);
    renderOverTrackerUI();
    // swap strike at over end
    swapStrike();
    // check innings end
    const maxBalls = state.config.overs * 6;
    if(batting.balls >= maxBalls){ endInnings(); }
  }

  function swapStrike(){
    const tmp = onStrikeSel.selectedIndex;
    onStrikeSel.selectedIndex = nonStrikeSel.selectedIndex;
    nonStrikeSel.selectedIndex = tmp;
  }

  function renderOverTrackerUI(){ renderOverTracker(); updateOverTrackerUI(); }

  function endInnings(){
    // mark batting side complete
    getBatting().completed = true;
    if(state.innings===1){
      // switch batting side
      state.innings = 2;
      state.battingSide = state.battingSide==='A'?'B':'A';
      state.currentOver = Array(6).fill(null);
      populateSelectors(); renderOverTrackerUI(); renderScore();
    } else {
      // match finished
      showResult();
    }
  }

  function showResult(){
    live.classList.add('hidden'); result.classList.remove('hidden');
    const a = state.teamA, b = state.teamB;
    let res='';
    if(a.score===b.score) res='Match Tied';
    else if(a.score>b.score) res=`${a.name} won by ${a.score-b.score} runs`; else res=`${b.name} won by ${ ( (getBatting()===b) ? (b.players.length - b.wickets) : (b.score - a.score)) } runs`;
    resultSummary.innerHTML = `<p><strong>${a.name}</strong> ${a.score}/${a.wickets}  <br><strong>${b.name}</strong> ${b.score}/${b.wickets} <br><strong>${res}</strong></p>`;
    // player stats (simple)
    const rows=[];
    function buildTable(team){
      let html=`<h3>${team.name}</h3><table class="stat-table"><thead><tr><th>Player</th><th>R</th><th>B</th><th>W</th></tr></thead><tbody>`;
      team.players.forEach(p=>{ html+=`<tr><td>${p.name}</td><td>${p.runs||0}</td><td>${p.balls||0}</td><td>${p.wickets||0}</td></tr>` });
      html+='</tbody></table>';
      return html;
    }
    playerStats.innerHTML = buildTable(a)+buildTable(b);
  }

  // Save match to server or localStorage
  async function saveMatch(){
    const payload = JSON.stringify(state, null, 2);
    try{
      const res = await fetch('/save', {method:'POST',headers:{'Content-Type':'application/json'},body:payload});
      if(res.ok) alert('Match saved to server (matches folder)'); else throw new Error('Save failed');
    }catch(e){
      localStorage.setItem('criktrack_last',payload);
      alert('Could not save to server — saved locally');
    }
  }

  // Matches listing & load/restore
  async function fetchMatches(){
    matchesList.textContent = 'Loading...';
    try{
      const res = await fetch('/matches');
      if(!res.ok) throw new Error('no server');
      const list = await res.json();
      renderMatches(list);
    }catch(e){
      // fallback to localStorage
      const local = localStorage.getItem('criktrack_last');
      if(local){ renderMatches([{name:'Local: last match', id:'local-last', data: JSON.parse(local)}]); }
      else matchesList.textContent = 'No matches available.';
    }
  }

  function renderMatches(list){
    if(!list || list.length===0){ matchesList.textContent='No saved matches.'; return }
    matchesList.innerHTML = '';
    list.forEach(item=>{
      const el = document.createElement('div'); el.className='match-item';
      const title = document.createElement('div'); title.textContent = item.name || item.filename || 'Saved match';
      const btnLoad = document.createElement('button'); btnLoad.textContent='Load'; btnLoad.className='btn';
      btnLoad.addEventListener('click', ()=>{ loadMatch(item); });
      const btnDelete = document.createElement('button'); btnDelete.textContent='Delete'; btnDelete.className='btn';
      btnDelete.addEventListener('click', ()=>{ deleteMatch(item); });
      el.appendChild(title); el.appendChild(btnLoad); el.appendChild(btnDelete);
      matchesList.appendChild(el);
    });
  }

  async function deleteMatch(item){
    if(!confirm('Delete match?')) return;
    try{
      if(item.id && item.id.startsWith('local')){
        localStorage.removeItem('criktrack_last');
        fetchMatches();
        return;
      }
      const res = await fetch('/delete', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:item.filename})});
      if(res.ok) fetchMatches(); else alert('Delete failed');
    }catch(e){ alert('Delete failed'); }
  }

  function loadMatch(item){
    const data = item.data || item.content;
    if(!data){ alert('No data'); return }
    // restore state and UI
    state = data;
    // ensure selectors exist
    populateSelectors(); renderOverTrackerUI(); renderScore();
    // decide which view
    if(state.teamA.completed || state.teamB.completed) { live.classList.add('hidden'); result.classList.remove('hidden'); }
    else { result.classList.add('hidden'); live.classList.remove('hidden'); }
    matchesPanel.classList.add('hidden');
  }

  openMatchesBtn && openMatchesBtn.addEventListener('click', ()=>{ matchesPanel.classList.remove('hidden'); fetchMatches(); });
  closeMatchesBtn && closeMatchesBtn.addEventListener('click', ()=>{ matchesPanel.classList.add('hidden'); });

  // Event wiring
  setupForm.addEventListener('submit', e=>{
    e.preventDefault();
    const data={
      teamA:$('#teamA').value||'Team A', playersA:parsePlayers($('#playersA').value),
      teamB:$('#teamB').value||'Team B', playersB:parsePlayers($('#playersB').value)
    };
    console.log(data);
    let totalWickets = 0;
    if(data.playersA.length!=data.playersB.length){ alert('Number of players are not same in both teams'); return }
    totalWickets = data.playersA.length;
    console.log(totalWickets);
    // require at least 2 players each
    if(data.playersA.length<2 || data.playersB.length<2){ alert('Add at least 2 players per team'); return }
    // store temporarily
    window._setupData = data;
    setup.classList.add('hidden'); rules.classList.remove('hidden');
    // set toss labels
    $('#tossWinner').querySelector('option[value="A"]').textContent = data.teamA;
    $('#tossWinner').querySelector('option[value="B"]').textContent = data.teamB;
  });

  $('#backToSetup').addEventListener('click', ()=>{ rules.classList.add('hidden'); setup.classList.remove('hidden'); });

  rulesForm.addEventListener('submit', e=>{
    e.preventDefault();
    const sd = window._setupData;
    const data = Object.assign({}, sd, {
      tossWinner:$('#tossWinner').value, tossDecision:$('#tossDecision').value, overs:Math.max(1,Math.min(50,parseInt($('#overs').value||10))), countExtras:$('#countExtras').checked, freeHit:$('#freeHit').checked
    });
    initState(data);
    populateSelectors(); renderOverTrackerUI(); renderScore(); rules.classList.add('hidden'); live.classList.remove('hidden');
  });

  // run buttons
  document.addEventListener('click', e=>{
    if(e.target.classList.contains('run')){
      const r = parseInt(e.target.dataset.run,10);
      recordBall({type:'run',runs:r});
    }
    if(e.target.classList.contains('special')){
      const t = e.target.dataset.type;
      if(t==='wicket') recordBall({type:'wicket'});
      if(t==='wide') recordBall({type:'wide'});
      if(t==='noball') recordBall({type:'noball'});
    }
  });

  $('#endInnings').addEventListener('click', ()=>{ if(confirm('End current innings?')) endInnings(); });
  $('#saveMatch').addEventListener('click', saveMatch);
  $('#restart').addEventListener('click', ()=>{ location.reload(); });

  // init: if DOM already loaded call immediately, otherwise wait
  function initApp(){ console.log('initApp running, document.readyState=', document.readyState); showLoaderThenApp(); renderOverTrackerUI(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
