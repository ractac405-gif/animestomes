/* ═══════════════════════════════════════════
   ANIMESTOMES — games.js  (15 jeux complets)
   ═══════════════════════════════════════════ */

/* ══ JEU 1 : MORPION X O ══ */
function launchXO(c, lvl) {
  window.board = Array(9).fill('');
  window.cur = 'X';
  window.on = true;
  window.sc = {X:0,O:0};
  window.wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const SIZE = lvl === 'hard' ? 80 : 72;
  c.innerHTML=`
    <div class="game-hud">
      <div class="hud-item"><div class="hud-val" id="xoSX">0</div><div class="hud-label">Joueur X</div></div>
      <div class="hud-item" style="color:var(--muted);font-size:12px">VS</div>
      <div class="hud-item"><div class="hud-val" id="xoSO">0</div><div class="hud-label">Joueur O</div></div>
    </div>
    <div style="font-size:12px;color:var(--muted)">Tour : <span id="xoCurP" style="color:var(--accent2);font-weight:700">X</span></div>
    <div style="display:grid;grid-template-columns:repeat(3,${SIZE}px);gap:8px" id="xoBoard"></div>
    <div style="font-size:14px;color:var(--gold);min-height:22px;font-weight:600" id="xoMsgG"></div>
    <div class="game-controls">
      <button class="gc-btn" onclick="launchXO(document.getElementById('gameContainer'),'${lvl}')">🔄 Nouvelle partie</button>
    </div>`;
  const render=()=>{
    document.getElementById('xoBoard').innerHTML=board.map((v,i)=>`
      <div onclick="xoPlayG(${i})" style="width:${SIZE}px;height:${SIZE}px;background:var(--bg3);border:2px solid ${v?'var(--border)':'var(--border)'};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:${SIZE*0.42}px;cursor:pointer;transition:all .2s;font-weight:700;color:${v==='X'?'var(--accent2)':'var(--gold)'}"
        onmouseover="if(!this.textContent&&${on})this.style.background='var(--bg4)'"
        onmouseout="this.style.background='var(--bg3)'">${v}</div>`).join('');
  };
  window.xoPlayG=(i)=>{
    if(!on||board[i]) return;
    board[i]=cur;
    const w=wins.find(([a,b,c2])=>board[a]&&board[a]===board[b]&&board[a]===board[c2]);
    if(w){
      sc[cur]++;
      document.getElementById('xoSX').textContent=sc.X;
      document.getElementById('xoSO').textContent=sc.O;
      document.getElementById('xoMsgG').textContent=`🎉 Joueur ${cur} gagne !`;
      on=false; (window.awardGameBadge||function(){})('xo',lvl);
    } else if(!board.includes('')){
      document.getElementById('xoMsgG').textContent='Match nul !'; on=false;
    } else {
      cur=cur==='X'?'O':'X';
      document.getElementById('xoCurP').textContent=cur;
    }
    render();
  };
  render();
}

/* ══ JEU 2 : PUISSANCE 4 ══ */
function launchConnect4(c, lvl) {
  const R=6,C=7;
  let grid=Array.from({length:R},()=>Array(C).fill(0)), cur=1, on=true;
  const checkWin=(r,col,p)=>{
    const dirs=[[0,1],[1,0],[1,1],[1,-1]];
    return dirs.some(([dr,dc])=>{
      let cnt=1;
      for(let s=1;s<=3;s++){const nr=r+dr*s,nc=col+dc*s;if(nr>=0&&nr<R&&nc>=0&&nc<C&&grid[nr][nc]===p)cnt++;else break;}
      for(let s=1;s<=3;s++){const nr=r-dr*s,nc=col-dc*s;if(nr>=0&&nr<R&&nc>=0&&nc<C&&grid[nr][nc]===p)cnt++;else break;}
      return cnt>=4;
    });
  };
  c.innerHTML=`
    <div class="game-hud">
      <div class="hud-item" style="color:var(--accent2)">🔴 Joueur 1</div>
      <div class="hud-item"><div class="hud-val" id="c4Cur">🔴</div><div class="hud-label">Tour</div></div>
      <div class="hud-item" style="color:var(--gold)">🟡 Joueur 2</div>
    </div>
    <div style="display:flex;gap:3px;margin-bottom:4px">
      ${Array.from({length:7},(_,i)=>`<button onclick="c4DropG(${i})" style="width:40px;background:var(--bg3);border:1px solid var(--border);color:var(--muted);padding:5px;border-radius:6px;cursor:pointer;font-size:14px;transition:all .2s" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='var(--muted)'">▼</button>`).join('')}
    </div>
    <div id="c4Board" style="display:grid;grid-template-columns:repeat(7,40px);gap:3px;background:var(--blue);padding:10px;border-radius:12px"></div>
    <div style="font-size:14px;color:var(--gold);min-height:22px;font-weight:600;margin-top:8px" id="c4Msg"></div>
    <button class="gc-btn" onclick="launchConnect4(document.getElementById('gameContainer'),'${lvl}')">🔄 Rejouer</button>`;
  const render=()=>{
    document.getElementById('c4Board').innerHTML=grid.map(row=>row.map(cell=>
      `<div style="width:40px;height:40px;border-radius:50%;background:${cell===1?'var(--accent2)':cell===2?'var(--gold)':'var(--bg2)'};transition:background .3s;box-shadow:${cell?'inset 0 -3px 6px rgba(0,0,0,.3)':'none'}"></div>`
    ).join('')).join('');
  };
  window.c4DropG=(col)=>{
    if(!on) return;
    let row=-1;
    for(let r=R-1;r>=0;r--){if(!grid[r][col]){row=r;break;}}
    if(row<0) return;
    grid[row][col]=cur; render();
    if(checkWin(row,col,cur)){
      document.getElementById('c4Msg').textContent=`🎉 Joueur ${cur===1?'🔴':'🟡'} gagne !`;
      on=false; (window.awardGameBadge||function(){})('connect4',lvl);
    } else if(grid[0].every(c2=>c2)){
      document.getElementById('c4Msg').textContent='Match nul !'; on=false;
    } else {
      cur=cur===1?2:1;
      document.getElementById('c4Cur').textContent=cur===1?'🔴':'🟡';
    }
  };
  render();
}

/* ══ JEU 3 : MEMORY ══ */
function launchMemory(c, lvl) {
  let n = {easy:8, normal:12, hard:16}[lvl];
  let pool = ['🐉','⚔️','🌸','🔥','🌙','⚡','🏯','🦊','🌊','🎌','🌺','🐱','💫','🎭','👁️','🎴'];
  let cards = [...pool.slice(0,n), ...pool.slice(0,n)]
                .sort(()=>Math.random()-.5)
                .map((e,i)=>({id:i,e,f:false,m:false}));
  let sel = [], moves = 0, matched = 0;
  const cols = {easy:4, normal:4, hard:4}[lvl];

  const render = () => {
    document.getElementById('memGrid').innerHTML = cards.map(card=>`
      <div onclick="memFlipG(${card.id})"
           style="width:62px;height:62px;background:${card.f||card.m?'var(--bg3)':'linear-gradient(135deg,var(--accent),var(--gold))'};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:${card.f||card.m?'28px':'0'};cursor:pointer;transition:all .35s;border:2px solid ${card.m?'var(--green)':'var(--border)'}">
        ${card.f||card.m?card.e:''}
      </div>`).join('');
    document.getElementById('memMoves').textContent = moves;
    document.getElementById('memPairs').textContent = matched+'/'+n;
  };

  c.innerHTML = `
    <div class="game-hud">
      <div class="hud-item"><div class="hud-val" id="memMoves">0</div><div class="hud-label">Coups</div></div>
      <div class="hud-item"><div class="hud-val" id="memPairs">0/${n}</div><div class="hud-label">Paires</div></div>
    </div>
    <div id="memGrid" style="display:grid;grid-template-columns:repeat(${cols},62px);gap:8px"></div>
    <div style="font-size:14px;color:var(--gold);min-height:22px;margin-top:8px" id="memMsg"></div>
    <button class="gc-btn" onclick="launchMemory(document.getElementById('gameContainer'),'${lvl}')">🔄 Rejouer</button>`;

  const memFlipG = (id) => {
    const card = cards[id];
    if(card.f || card.m || sel.length >= 2) return;
    card.f = true; sel.push(card); moves++;
    if(sel.length === 2){
      if(sel[0].e === sel[1].e){
        sel.forEach(c2=>c2.m = true); matched++;
        document.getElementById('memPairs').textContent = matched+'/'+n;
        if(matched === n){
          document.getElementById('memMsg').textContent = `🎉 Bravo ! ${moves} coups.`;
          if(typeof awardGameBadge === 'function') (window.awardGameBadge||function(){})('memory', lvl);
        }
      } else {
        setTimeout(()=>{ sel.forEach(c2=>c2.f=false); sel=[]; render(); }, 900);
      }
      sel = sel.filter(c2=>!c2.m);
    }
    render();
  };

  window.memFlipG = memFlipG; // exposé pour l’HTML
  render();
}


/* ══ JEU 4 : SNAKE ══ */
function launchSnake(c, lvl) {
  const speeds={easy:180,normal:120,hard:70};
  const SIZE=16, CS=22;
  let snake=[{x:8,y:8}], dir={x:1,y:0}, food={x:3,y:3}, score=0, running=true;
  const place=()=>{ food={x:Math.floor(Math.random()*SIZE),y:Math.floor(Math.random()*SIZE)}; };
  c.innerHTML=`
    <div class="game-hud"><div class="hud-item"><div class="hud-val" id="snkScore">0</div><div class="hud-label">Score</div></div></div>
    <canvas id="snkCv" width="${SIZE*CS}" height="${SIZE*CS}" style="border:2px solid var(--border);border-radius:10px;background:#050508"></canvas>
    <div style="display:grid;grid-template-columns:repeat(3,44px);gap:6px;justify-content:center">
      <div></div><button class="gc-btn" style="padding:8px" onclick="snkDir(0,-1)">▲</button><div></div>
      <button class="gc-btn" style="padding:8px" onclick="snkDir(-1,0)">◀</button>
      <button class="gc-btn" style="padding:8px" onclick="snkDir(0,1)">▼</button>
      <button class="gc-btn" style="padding:8px" onclick="snkDir(1,0)">▶</button>
    </div>
    <div style="font-size:12px;color:var(--muted)">Ou utilise les flèches du clavier</div>
    <div id="snkMsg" style="font-size:14px;color:var(--gold);min-height:22px"></div>`;
  const cv=document.getElementById('snkCv'), ctx=cv.getContext('2d');
  window.snkDir=(dx,dy)=>{ if(!(dx===-dir.x&&dy===-dir.y)) dir={x:dx,y:dy}; };
  const kh=e=>{
    const k={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];
    if(k){e.preventDefault();snkDir(k[0],k[1]);}
  };
  document.addEventListener('keydown',kh);
  const loop=()=>{
    if(!running||!document.getElementById('snkCv')){document.removeEventListener('keydown',kh);return;}
    const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
    if(head.x<0||head.x>=SIZE||head.y<0||head.y>=SIZE||snake.some(s=>s.x===head.x&&s.y===head.y)){
      running=false;
      document.getElementById('snkMsg').textContent=`💀 Game Over ! Score : ${score}`;
      document.removeEventListener('keydown',kh);
      if(score>5) (window.awardGameBadge||function(){})('snake',lvl);
      return;
    }
    snake.unshift(head);
    if(head.x===food.x&&head.y===food.y){score++;document.getElementById('snkScore').textContent=score;place();}
    else snake.pop();
    ctx.fillStyle='#050508'; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle='#c0392b'; ctx.beginPath(); ctx.arc(food.x*CS+CS/2,food.y*CS+CS/2,CS/2-2,0,Math.PI*2); ctx.fill();
    snake.forEach((s,i)=>{ctx.fillStyle=i===0?'#e74c3c':'rgba(231,76,60,0.6)';ctx.beginPath();ctx.roundRect(s.x*CS+1,s.y*CS+1,CS-2,CS-2,4);ctx.fill();});
    setTimeout(()=>{gameAnimFrame=requestAnimationFrame(loop);},speeds[lvl]);
  };
  gameAnimFrame=requestAnimationFrame(loop);
}

/* ══ JEU 5 : TETRIS ══ */
function launchTetris(c, lvl) {
  const W=10,H=18,BS=24,speeds={easy:700,normal:400,hard:200};
  const PIECES=[[[1,1,1,1]],[[1,1],[1,1]],[[1,1,1],[0,1,0]],[[1,1,1],[1,0,0]],[[1,1,1],[0,0,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]];
  const COLORS=['#e74c3c','#f39c12','#9b59b6','#2980b9','#27ae60','#e67e22','#1abc9c'];
  let board=Array.from({length:H},()=>Array(W).fill(0));
  let bColors=Array.from({length:H},()=>Array(W).fill(null));
  let piece,px,py,pc,score=0,running=true,last=0;
  const newP=()=>{
    const i=Math.floor(Math.random()*PIECES.length);
    piece=PIECES[i];pc=COLORS[i];px=Math.floor((W-piece[0].length)/2);py=0;
    if(!canP(piece,px,py)){running=false;document.getElementById('tetMsg').textContent=`Game Over ! ${score}pts`;if(score>50)(window.awardGameBadge||function(){})('tetris',lvl);}
  };
  const canP=(p,x,y)=>p.every((row,r)=>row.every((v,col)=>!v||(y+r>=0&&y+r<H&&x+col>=0&&x+col<W&&!board[y+r][x+col])));
  const merge=()=>{
    piece.forEach((row,r)=>row.forEach((v,col)=>{if(v){board[py+r][px+col]=1;bColors[py+r][px+col]=pc;}}));
    let cl=0;
    for(let r=H-1;r>=0;r--){if(board[r].every(v=>v)){board.splice(r,1);bColors.splice(r,1);board.unshift(Array(W).fill(0));bColors.unshift(Array(W).fill(null));cl++;r++;}}
    score+=cl*100;document.getElementById('tetScore').textContent=score;newP();
  };
  c.innerHTML=`
    <div class="game-hud"><div class="hud-item"><div class="hud-val" id="tetScore">0</div><div class="hud-label">Score</div></div></div>
    <canvas id="tetCv" width="${W*BS}" height="${H*BS}" style="border:2px solid var(--border);border-radius:10px;background:#050508"></canvas>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
      <button class="gc-btn" onclick="tetMoveG(-1)">◀</button>
      <button class="gc-btn" onclick="tetDownG()">▼</button>
      <button class="gc-btn" onclick="tetMoveG(1)">▶</button>
      <button class="gc-btn" onclick="tetRotG()">↻ Rot</button>
      <button class="gc-btn" onclick="tetDropG()">⬇ Drop</button>
    </div>
    <div id="tetMsg" style="font-size:13px;color:var(--gold);min-height:18px"></div>`;
  const cv=document.getElementById('tetCv'),ctx=cv.getContext('2d');
  window.tetMoveG=dx=>{if(running&&canP(piece,px+dx,py))px+=dx;draw();};
  window.tetDownG=()=>{if(!running)return;if(canP(piece,px,py+1))py++;else merge();draw();};
  window.tetRotG=()=>{const r=piece[0].map((_,i)=>piece.map(row=>row[i]).reverse());if(canP(r,px,py))piece=r;draw();};
  window.tetDropG=()=>{while(canP(piece,px,py+1))py++;tetDownG();};
  const draw=()=>{
    ctx.fillStyle='#050508';ctx.fillRect(0,0,cv.width,cv.height);
    board.forEach((row,r)=>row.forEach((v,col)=>{if(v){ctx.fillStyle=bColors[r][col]+'cc';ctx.fillRect(col*BS+1,r*BS+1,BS-2,BS-2);}}));
    if(piece) piece.forEach((row,r)=>row.forEach((v,col)=>{if(v&&py+r>=0){ctx.fillStyle=pc;ctx.fillRect((px+col)*BS+1,(py+r)*BS+1,BS-2,BS-2);}}));
  };
  const kh=e=>{
    if(!document.getElementById('tetCv'))return;
    if(e.key==='ArrowLeft')tetMoveG(-1);
    else if(e.key==='ArrowRight')tetMoveG(1);
    else if(e.key==='ArrowDown')tetDownG();
    else if(e.key==='ArrowUp')tetRotG();
    else if(e.key===' '){e.preventDefault();tetDropG();}
  };
  document.addEventListener('keydown',kh);
  const loop=ts=>{
    if(!running||!document.getElementById('tetCv')){document.removeEventListener('keydown',kh);return;}
    if(ts-last>speeds[lvl]){tetDownG();last=ts;}
    draw();
    gameAnimFrame=requestAnimationFrame(loop);
  };
  newP();gameAnimFrame=requestAnimationFrame(loop);
}

/* ══ JEU 6 : PONG ══ */
function launchPong(c, lvl) {
  const spd={easy:3,normal:5}[lvl]||4;
  const W=400,H=240,PW=10,PH=52,BZ=7;
  let p1={y:H/2-PH/2,s:0},ai={y:H/2-PH/2,s:0};
  let ball={x:W/2,y:H/2,vx:spd,vy:spd*(Math.random()>.5?1:-1)};
  let running=true, mouseY=H/2;
  c.innerHTML=`
    <div class="game-hud">
      <div class="hud-item"><div class="hud-val" id="pngP1">0</div><div class="hud-label">Toi</div></div>
      <div class="hud-item"><div class="hud-val" id="pngAI">0</div><div class="hud-label">IA</div></div>
    </div>
    <canvas id="pngCv" width="${W}" height="${H}" style="border:2px solid var(--border);border-radius:10px;cursor:none"></canvas>
    <div style="font-size:12px;color:var(--muted)">Bouge ta souris ou utilise ▲▼</div>
    <div id="pngMsg" style="font-size:13px;color:var(--gold);min-height:18px"></div>`;
  const cv=document.getElementById('pngCv'),ctx=cv.getContext('2d');
  cv.onmousemove=e=>{const r=cv.getBoundingClientRect();mouseY=e.clientY-r.top;};
  const kh=e=>{
    if(e.key==='ArrowUp')p1.y=Math.max(0,p1.y-18);
    if(e.key==='ArrowDown')p1.y=Math.min(H-PH,p1.y+18);
  };
  document.addEventListener('keydown',kh);
  const loop=()=>{
    if(!running||!document.getElementById('pngCv')){document.removeEventListener('keydown',kh);return;}
    p1.y=Math.max(0,Math.min(H-PH,mouseY-PH/2));
    ai.y+=(ball.y-ai.y-PH/2)*(lvl==='easy'?.08:.12);
    ai.y=Math.max(0,Math.min(H-PH,ai.y));
    ball.x+=ball.vx; ball.y+=ball.vy;
    if(ball.y<=0||ball.y>=H-BZ) ball.vy*=-1;
    if(ball.x<=20+PW&&ball.y>=p1.y&&ball.y<=p1.y+PH){ball.vx=Math.abs(ball.vx);ball.vy+=(ball.y-p1.y-PH/2)*.05;}
    if(ball.x>=W-20-PW-BZ&&ball.y>=ai.y&&ball.y<=ai.y+PH){ball.vx=-Math.abs(ball.vx);}
    if(ball.x<0){ai.s++;document.getElementById('pngAI').textContent=ai.s;ball={x:W/2,y:H/2,vx:spd,vy:spd*(Math.random()>.5?1:-1)};}
    if(ball.x>W){p1.s++;document.getElementById('pngP1').textContent=p1.s;ball={x:W/2,y:H/2,vx:-spd,vy:spd*(Math.random()>.5?1:-1)};}
    if(p1.s>=7||ai.s>=7){
      document.getElementById('pngMsg').textContent=p1.s>=7?'🎉 Tu gagnes !':'😔 L\'IA gagne...';
      if(p1.s>=7)(window.awardGameBadge||function(){})('pong',lvl);running=false;return;
    }
    ctx.fillStyle='#050508';ctx.fillRect(0,0,W,H);
    ctx.setLineDash([8,8]);ctx.strokeStyle='rgba(255,255,255,.1)';ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.roundRect(20,p1.y,PW,PH,3);ctx.fill();
    ctx.fillStyle='#f39c12';ctx.beginPath();ctx.roundRect(W-20-PW,ai.y,PW,PH,3);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ball.x,ball.y,BZ,0,Math.PI*2);ctx.fill();
    gameAnimFrame=requestAnimationFrame(loop);
  };
  gameAnimFrame=requestAnimationFrame(loop);
}

/* ══ JEU 7 : FLAPPY ══ */
function launchFlappy(c, lvl) {
  const g={easy:.28,hard:.48}[lvl]||.35;
  const W=320,H=420;
  let bird={y:200,vy:0},pipes=[],score=0,running=true,frame=0;
  c.innerHTML=`
    <div class="game-hud"><div class="hud-item"><div class="hud-val" id="flpScore">0</div><div class="hud-label">Score</div></div></div>
    <canvas id="flpCv" width="${W}" height="${H}" style="border:2px solid var(--border);border-radius:10px;cursor:pointer" tabindex="0"></canvas>
    <div style="font-size:12px;color:var(--muted)">Clique ou Espace pour voler</div>
    <div id="flpMsg" style="font-size:13px;color:var(--gold);min-height:18px"></div>`;
  const cv=document.getElementById('flpCv'),ctx=cv.getContext('2d');
  const jump=()=>{if(running)bird.vy=-8;};
  cv.addEventListener('click',jump);
  const kh=e=>{if(e.code==='Space'){e.preventDefault();jump();}};
  document.addEventListener('keydown',kh);
  const loop=()=>{
    if(!running||!document.getElementById('flpCv')){document.removeEventListener('keydown',kh);return;}
    bird.vy+=g; bird.y+=bird.vy; frame++;
    if(frame%85===0) pipes.push({x:W,top:50+Math.random()*(H-180)});
    pipes=pipes.filter(p=>p.x>-50);
    pipes.forEach(p=>{p.x-=3;if(p.x+50<40&&!p.passed){p.passed=true;score++;document.getElementById('flpScore').textContent=score;}});
    const gap=130;
    const hit=pipes.some(p=>(bird.y<p.top||bird.y>p.top+gap)&&p.x<55&&p.x+50>30);
    if(bird.y>H-20||bird.y<0||hit){
      running=false;
      document.getElementById('flpMsg').textContent=`💀 Game Over ! Score: ${score}`;
      if(score>5)(window.awardGameBadge||function(){})('flappy',lvl);return;
    }
    ctx.fillStyle='#050810';ctx.fillRect(0,0,W,H);
    // Tuyaux
    const grad1=ctx.createLinearGradient(0,0,50,0);
    grad1.addColorStop(0,'#27ae60');grad1.addColorStop(1,'#2ecc71');
    ctx.fillStyle=grad1;
    pipes.forEach(p=>{
      ctx.fillRect(p.x,0,50,p.top);
      ctx.fillRect(p.x,p.top+gap,50,H-p.top-gap);
      ctx.fillStyle='rgba(255,255,255,.1)';
      ctx.fillRect(p.x,p.top-8,50,8);
      ctx.fillRect(p.x,p.top+gap,50,8);
      ctx.fillStyle=grad1;
    });
    // Oiseau
    ctx.fillStyle='#f39c12';
    ctx.beginPath();ctx.arc(42,bird.y,14,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(48,bird.y-3,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#333';ctx.beginPath();ctx.arc(50,bird.y-3,2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#e74c3c';
    ctx.beginPath();ctx.moveTo(56,bird.y);ctx.lineTo(64,bird.y-3);ctx.lineTo(64,bird.y+3);ctx.fill();
    gameAnimFrame=requestAnimationFrame(loop);
  };
  gameAnimFrame=requestAnimationFrame(loop);
}

/* ══ JEU 8 : DÉMINEUR ══ */
function launchMinesweeper(c, lvl) {
  const cfgs={easy:{w:8,h:8,m:10},normal:{w:10,h:10,m:20},hard:{w:12,h:12,m:30}};
  const {w,h,m}=cfgs[lvl];
  let board=Array.from({length:h},()=>Array(w).fill(null).map(()=>({mine:false,rev:false,flag:false,adj:0})));
  let over=false,won=false,first=true;
  const init=(sx,sy)=>{
    let mc=0;
    while(mc<m){const x=Math.floor(Math.random()*w),y=Math.floor(Math.random()*h);if(!board[y][x].mine&&!(x===sx&&y===sy)){board[y][x].mine=true;mc++;}}
    for(let y2=0;y2<h;y2++)for(let x2=0;x2<w;x2++){
      if(!board[y2][x2].mine){let cnt=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const ny=y2+dy,nx=x2+dx;if(ny>=0&&ny<h&&nx>=0&&nx<w&&board[ny][nx].mine)cnt++;}board[y2][x2].adj=cnt;}
    }
  };
  const reveal=(x,y)=>{
    if(x<0||x>=w||y<0||y>=h||board[y][x].rev||board[y][x].flag)return;
    board[y][x].rev=true;
    if(board[y][x].adj===0&&!board[y][x].mine)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)reveal(x+dx,y+dy);
  };
  const colors=['','#3498db','#27ae60','#e74c3c','#8e44ad','#c0392b','#16a085','#2c3e50','#7f8c8d'];
  const render=()=>{
    document.getElementById('mineGrid').innerHTML=board.map((row,y)=>row.map((cell,x)=>`
      <div onclick="mineRevG(${x},${y})" oncontextmenu="mineFlagG(event,${x},${y})"
        style="width:${lvl==='hard'?28:32}px;height:${lvl==='hard'?28:32}px;background:${cell.rev?(cell.mine?'var(--accent)':'var(--bg4)'):'var(--bg3)'};border:1px solid var(--border);border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:${lvl==='hard'?12:14}px;font-weight:700;color:${cell.adj>0?colors[cell.adj]:'inherit'};user-select:none;transition:background .15s">
        ${cell.flag&&!cell.rev?'🚩':cell.rev?(cell.mine?'💣':cell.adj||''):''}
      </div>`).join('')).join('');
    document.getElementById('mineLeft').textContent=m-board.flat().filter(c=>c.flag).length;
  };
  c.innerHTML=`
    <div class="game-hud">
      <div class="hud-item"><div class="hud-val" id="mineLeft">${m}</div><div class="hud-label">💣 Mines</div></div>
    </div>
    <div id="mineGrid" style="display:grid;grid-template-columns:repeat(${w},${lvl==='hard'?28:32}px);gap:3px"></div>
    <div id="mineMsg" style="font-size:13px;color:var(--gold);min-height:18px;margin-top:8px"></div>
    <div style="font-size:12px;color:var(--muted)">Clic droit = 🚩 drapeau</div>
    <button class="gc-btn" onclick="launchMinesweeper(document.getElementById('gameContainer'),'${lvl}')">🔄 Rejouer</button>`;
  window.mineRevG=(x,y)=>{
    if(over||won||board[y][x].flag)return;
    if(first){init(x,y);first=false;}
    if(board[y][x].mine){
      board[y][x].rev=true;over=true;
      board.forEach(row=>row.forEach(c=>{if(c.mine)c.rev=true;}));
      render();document.getElementById('mineMsg').textContent='💥 Boom ! Partie perdue.';return;
    }
    reveal(x,y);
    if(board.flat().filter(c=>!c.mine&&!c.rev).length===0){won=true;document.getElementById('mineMsg').textContent='🎉 Gagné !';(window.awardGameBadge||function(){})('mine',lvl);}
    render();
  };
  window.mineFlagG=(e,x,y)=>{e.preventDefault();if(!board[y][x].rev)board[y][x].flag=!board[y][x].flag;render();};
  render();
}

/* ══ JEU 9 : 2048 ══ */
function launch2048(c, lvl) {
  let grid=Array.from({length:4},()=>Array(4).fill(0)),score=0;
  const add=()=>{const em=[];grid.forEach((r,y)=>r.forEach((v,x)=>{if(!v)em.push({x,y});}));if(!em.length)return;const {x,y}=em[Math.floor(Math.random()*em.length)];grid[y][x]=Math.random()<.9?2:4;};
  const cols={0:'#1a1a26',2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'};
  const tc=v=>v<=4?'#776e65':'#f9f6f2';
  const slide=row=>{let r=row.filter(v=>v);for(let i=0;i<r.length-1;i++){if(r[i]===r[i+1]){r[i]*=2;score+=r[i];r.splice(i+1,1);}}while(r.length<4)r.push(0);return r;};
  const move=dir=>{
    const prev=JSON.stringify(grid);
    if(dir==='left')grid=grid.map(r=>slide(r));
    else if(dir==='right')grid=grid.map(r=>slide(r.reverse()).reverse());
    else if(dir==='up'){grid=grid[0].map((_,i)=>grid.map(r=>r[i]));grid=grid.map(r=>slide(r));grid=grid[0].map((_,i)=>grid.map(r=>r[i]));}
    else{grid=grid[0].map((_,i)=>grid.map(r=>r[i]));grid=grid.map(r=>slide(r.reverse()).reverse());grid=grid[0].map((_,i)=>grid.map(r=>r[i]));}
    if(JSON.stringify(grid)!==prev)add();
    render();
    if(grid.flat().includes(2048)){document.getElementById('g2048Msg').textContent='🎉 2048 atteint !';(window.awardGameBadge||function(){})('2048',lvl);}
  };
  const render=()=>{
    document.getElementById('g2048Score').textContent=score;
    document.getElementById('g2048Grid').innerHTML=grid.flat().map(v=>`
      <div style="background:${cols[v]||'#3c3a32'};width:72px;height:72px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:${v>99?v>999?16:20:24}px;font-weight:800;color:${tc(v)};transition:all .15s">${v||''}</div>`).join('');
  };
  c.innerHTML=`
    <div class="game-hud"><div class="hud-item"><div class="hud-val" id="g2048Score">0</div><div class="hud-label">Score</div></div></div>
    <div id="g2048Grid" style="display:grid;grid-template-columns:repeat(4,72px);gap:8px;background:rgba(255,255,255,.1);padding:12px;border-radius:12px"></div>
    <div style="display:grid;grid-template-columns:repeat(3,44px);gap:6px;justify-content:center">
      <div></div><button class="gc-btn" style="padding:8px" onclick="g2048Move('up')">▲</button><div></div>
      <button class="gc-btn" style="padding:8px" onclick="g2048Move('left')">◀</button>
      <button class="gc-btn" style="padding:8px" onclick="g2048Move('down')">▼</button>
      <button class="gc-btn" style="padding:8px" onclick="g2048Move('right')">▶</button>
    </div>
    <div id="g2048Msg" style="font-size:13px;color:var(--gold);min-height:18px"></div>
    <button class="gc-btn" onclick="launch2048(document.getElementById('gameContainer'),'${lvl}')">🔄 Rejouer</button>`;
  window.g2048Move=move;
  const kh=e=>{
    if(!document.getElementById('g2048Grid'))return;
    const m={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];
    if(m){e.preventDefault();move(m);}
  };
  document.addEventListener('keydown',kh);
  add();add();render();
}

/* ══ JEU 10 : PAIRES ANIME ══ */
function launchAnimePairs(c, lvl) {
  const chars=['🐉 Shenron','⚔️ Zoro','🌸 Sakura','🔥 Ace','🌙 Itachi','⚡ Killua','🏯 Hisoka','🦊 Kurama','🌊 Minato','🎌 Luffy','💫 Goku','🎭 Deku'];
  const n=lvl==='easy'?8:12;
  let cards=[...chars.slice(0,n),...chars.slice(0,n)].sort(()=>Math.random()-.5).map((e,i)=>({id:i,name:e,f:false,m:false}));
  let sel=[],moves=0,matched=0;
  const render=()=>{
    document.getElementById('pairsGrid').innerHTML=cards.map(card=>`
      <div onclick="pairsFlipG(${card.id})" style="width:88px;min-height:68px;background:${card.f||card.m?'var(--bg3)':'linear-gradient(135deg,var(--accent),var(--gold))'};border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .3s;border:2px solid ${card.m?'var(--green)':'var(--border)'};font-size:${card.f||card.m?'11px':'0'};text-align:center;padding:6px;font-weight:600">
        ${card.f||card.m?card.name:''}
      </div>`).join('');
    document.getElementById('pairsMoves').textContent=moves;
    document.getElementById('pairsMatch').textContent=matched+'/'+n;
  };
  c.innerHTML=`
    <div class="game-hud">
      <div class="hud-item"><div class="hud-val" id="pairsMoves">0</div><div class="hud-label">Coups</div></div>
      <div class="hud-item"><div class="hud-val" id="pairsMatch">0/${n}</div><div class="hud-label">Paires</div></div>
    </div>
    <div id="pairsGrid" style="display:grid;grid-template-columns:repeat(4,88px);gap:8px"></div>
    <div id="pairsMsg" style="font-size:13px;color:var(--gold);min-height:18px"></div>
    <button class="gc-btn" onclick="launchAnimePairs(document.getElementById('gameContainer'),'${lvl}')">🔄 Rejouer</button>`;
  window.pairsFlipG=(id)=>{
    const card=cards[id];
    if(card.f||card.m||sel.length>=2)return;
    card.f=true;sel.push(card);moves++;
    if(sel.length===2){
      if(sel[0].name===sel[1].name){sel.forEach(c2=>c2.m=true);matched++;if(matched===n){document.getElementById('pairsMsg').textContent='🎉 Bravo !';(window.awardGameBadge||function(){})('pairs',lvl);}}
      else setTimeout(()=>{sel.forEach(c2=>c2.f=false);sel=[];render();},900);
      sel=sel.filter(c2=>!c2.m);
    }
    render();
  };
  render();
}

/* ══ JEU 11 : RÉFLEXES ══ */
function launchReaction(c, lvl) {
  let best=Infinity,waiting=false,startT=null;
  const minD={easy:1500,normal:1000,hard:500}[lvl];
  c.innerHTML=`
    <div class="game-hud">
      <div class="hud-item"><div class="hud-val" id="reactBest">—</div><div class="hud-label">Meilleur (ms)</div></div>
      <div class="hud-item"><div class="hud-val" id="reactLast">—</div><div class="hud-label">Dernier (ms)</div></div>
    </div>
    <div id="reactTarget" onclick="reactClickG()" style="width:200px;height:200px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:#fff;font-weight:600;transition:background .3s;user-select:none;margin:0 auto;box-shadow:0 0 30px rgba(192,57,43,.3)">
      Clique pour démarrer
    </div>
    <div id="reactMsg" style="font-size:13px;color:var(--muted);min-height:18px;text-align:center;margin-top:8px"></div>`;
  let timer;
  window.reactClickG=()=>{
    const t=document.getElementById('reactTarget'),msg=document.getElementById('reactMsg');
    if(!waiting){
      t.style.background='var(--muted)';t.textContent='Attends...';waiting=true;startT=null;
      clearTimeout(timer);
      timer=setTimeout(()=>{
        t.style.background='var(--green)';t.textContent='CLIQUE !';
        t.style.boxShadow='0 0 40px rgba(39,174,96,.5)';
        startT=Date.now();
      },minD+Math.random()*2000);
    } else if(startT){
      const rt=Date.now()-startT;
      document.getElementById('reactLast').textContent=rt;
      if(rt<best){best=rt;document.getElementById('reactBest').textContent=best;}
      msg.textContent=rt<200?`⚡ Incroyable ! ${rt}ms`:rt<350?`💫 Excellent ! ${rt}ms`:`😊 ${rt}ms — encore !`;
      t.style.background='var(--accent)';t.textContent='Encore !';
      t.style.boxShadow='0 0 30px rgba(192,57,43,.3)';
      waiting=false;startT=null;
      if(rt<250)(window.awardGameBadge||function(){})('reaction',lvl);
    } else {
      msg.textContent='⚠️ Trop tôt ! Attends le vert.';
      t.style.background='var(--accent)';t.textContent='Encore !';
      waiting=false;clearTimeout(timer);
    }
  };
}

/* ══ JEU 12 : PENDU ANIME ══ */
function launchHangman(c, lvl) {
  const words={
    easy:['NARUTO','LUFFY','GOKU','ICHIGO','DEKU','ZORO','TITAN','KURAMA','SAKURA','HINATA'],
    normal:['SHARINGAN','RINNEGAN','BANKAI','FULLMETAL','SHINGEKI','KIMETSU','AKATSUKI','BIJUDAMA','RASENGAN','CHIDORI']
  };
  const pool=words[lvl==='easy'?'easy':'normal'];
  let word=pool[Math.floor(Math.random()*pool.length)];
  let guessed=new Set(), wrong=0, maxWrong=lvl==='easy'?8:6;
  const render=()=>{
    const display=word.split('').map(l=>guessed.has(l)?`<span style="color:var(--accent2);font-size:24px;font-weight:700">${l}</span>`:'<span style="color:var(--muted);font-size:24px">_</span>').join(' ');
    const won2=word.split('').every(l=>guessed.has(l));
    document.getElementById('hangDisplay').innerHTML=display;
    document.getElementById('hangWrong').textContent=wrong+'/'+maxWrong;
    // Dessin pendu
    const cv=document.getElementById('hangCv'); if(!cv)return;
    const ctx=cv.getContext('2d');
    ctx.clearRect(0,0,160,180);
    ctx.strokeStyle='#e8e8f0';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(20,170);ctx.lineTo(140,170);ctx.moveTo(50,170);ctx.lineTo(50,20);ctx.lineTo(110,20);ctx.lineTo(110,40);ctx.stroke();
    if(wrong>0){ctx.beginPath();ctx.arc(110,55,15,0,Math.PI*2);ctx.stroke();}
    if(wrong>1){ctx.beginPath();ctx.moveTo(110,70);ctx.lineTo(110,110);ctx.stroke();}
    if(wrong>2){ctx.beginPath();ctx.moveTo(110,80);ctx.lineTo(90,100);ctx.stroke();}
    if(wrong>3){ctx.beginPath();ctx.moveTo(110,80);ctx.lineTo(130,100);ctx.stroke();}
    if(wrong>4){ctx.beginPath();ctx.moveTo(110,110);ctx.lineTo(90,135);ctx.stroke();}
    if(wrong>5){ctx.beginPath();ctx.moveTo(110,110);ctx.lineTo(130,135);ctx.stroke();}
    if(wrong>6){ctx.strokeStyle='var(--accent)';ctx.beginPath();ctx.moveTo(104,50);ctx.lineTo(108,58);ctx.moveTo(116,50);ctx.lineTo(112,58);ctx.stroke();}
    if(won2){document.getElementById('hangMsg').textContent='🎉 Gagné ! Tu as trouvé : '+word;(window.awardGameBadge||function(){})('hangman',lvl);}
    else if(wrong>=maxWrong){document.getElementById('hangMsg').textContent='💀 Perdu ! Le mot était : '+word;}
  };
  c.innerHTML=`
    <canvas id="hangCv" width="160" height="180" style="background:var(--bg2);border-radius:10px;border:1px solid var(--border)"></canvas>
    <div id="hangDisplay" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:10px 0"></div>
    <div style="font-size:12px;color:var(--muted)">Erreurs : <span id="hangWrong">0/${maxWrong}</span></div>
    <div id="hangMsg" style="font-size:13px;color:var(--gold);min-height:18px"></div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;max-width:320px">
      ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l=>`<button id="hbtn_${l}" onclick="hangGuessG('${l}')" style="width:30px;height:30px;background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;transition:all .2s">${l}</button>`).join('')}
    </div>
    <button class="gc-btn" onclick="launchHangman(document.getElementById('gameContainer'),'${lvl}')">🔄 Rejouer</button>`;
  render();
  window.hangGuessG=(l)=>{
    if(guessed.has(l)||wrong>=maxWrong||word.split('').every(c2=>guessed.has(c2)))return;
    guessed.add(l);
    const btn=document.getElementById('hbtn_'+l);
    if(btn){btn.disabled=true;btn.style.opacity='.4';}
    if(!word.includes(l)) wrong++;
    render();
  };
}

/* ══ JEU 13 : BLIND TEST ANIME ══ */
function launchTrivia(c, lvl) {
  const clues=[
    {clue:"Un garçon blond rêve de devenir le chef de son village de ninjas.",ans:"NARUTO"},
    {clue:"Un jeune pirate avec un chapeau de paille cherche le trésor ultime.",ans:"ONE PIECE"},
    {clue:"Humanity fights giant humanoid monsters behind walls.",ans:"ATTACK ON TITAN"},
    {clue:"Un pourfendeur de démons cherche un remède pour sa sœur transformée.",ans:"DEMON SLAYER"},
    {clue:"Un lycéen découvre un carnet permettant de tuer n'importe qui.",ans:"DEATH NOTE"},
    {clue:"Deux frères alchimistes cherchent la Pierre Philosophale.",ans:"FULLMETAL ALCHEMIST"},
    {clue:"Un kenyan demi-ghoul essaie de survivre dans Tokyo.",ans:"TOKYO GHOUL"},
    {clue:"Des étudiants héros en formation à UA High School.",ans:"MY HERO ACADEMIA"},
    {clue:"Des joueurs sont piégés dans un MMORPG et doivent battre le jeu.",ans:"SWORD ART ONLINE"},
    {clue:"Un garçon cherche son père en passant un examen de chasseur.",ans:"HUNTER X HUNTER"},
  ];
  let idx=0,score2=0;
  const render=()=>{
    if(idx>=clues.length){document.getElementById('trivWrap').innerHTML=`<div class="qz-result"><h2>Terminé !</h2><span class="big-sc" style="font-size:40px">${score2}/${clues.length}</span><button class="auth-btn" style="max-width:200px" onclick="launchTrivia(document.getElementById('gameContainer'),'${lvl}')">Rejouer</button></div>`;if(score2>=7)(window.awardGameBadge||function(){})('trivia',lvl);return;}
    const cl=clues[idx];
    document.getElementById('trivWrap').innerHTML=`
      <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Indice ${idx+1}/${clues.length} — Score : ${score2}</div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:20px;font-size:14px;line-height:1.6;margin-bottom:14px">${cl.clue}</div>
      <div class="field"><label>Quel anime est-ce ?</label><input id="trivInput" type="text" placeholder="Ton réponse..." style="text-transform:uppercase" onkeydown="if(event.key==='Enter')trivCheckG()"></div>
      <button class="auth-btn" onclick="trivCheckG()">Valider</button>
      <div id="trivFb" style="font-size:13px;min-height:18px;margin-top:10px"></div>`;
    setTimeout(()=>document.getElementById('trivInput')?.focus(),100);
  };
  window.trivCheckG=()=>{
    const inp=document.getElementById('trivInput');
    const ans=inp?.value.trim().toUpperCase();
    const cl=clues[idx];
    const fb=document.getElementById('trivFb');
    if(ans===cl.ans||cl.ans.includes(ans)&&ans.length>3){score2++;fb.textContent='✅ Bonne réponse !';fb.style.color='var(--green)';}
    else{fb.textContent=`❌ C'était : ${cl.ans}`;fb.style.color='var(--accent2)';}
    idx++;
    setTimeout(render,1200);
  };
  c.innerHTML=`<div id="trivWrap" style="max-width:460px;width:100%"></div>`;
  render();
}

/* ══ JEU 14 : MOTS CACHÉS ══ */
function launchWordSearch(c, lvl) {
  const words2=lvl==='easy'?['NARUTO','GOKU','LUFFY','ZORO','DEKU']:['SHARINGAN','RASENGAN','BANKAI','KURAMA','ICHIGO'];
  const G=10;
  let grid2=Array.from({length:G},()=>Array(G).fill(''));
  let placed=[];
  // Placer les mots
  words2.forEach(w=>{
    let ok=false,tries=0;
    while(!ok&&tries<200){
      tries++;
      const dir=Math.random()>.5?[0,1]:[1,0];
      const r=Math.floor(Math.random()*(G-w.length*dir[0]));
      const col=Math.floor(Math.random()*(G-w.length*dir[1]));
      let fits=true;
      for(let i=0;i<w.length;i++){const nr=r+i*dir[0],nc=col+i*dir[1];if(grid2[nr][nc]&&grid2[nr][nc]!==w[i]){fits=false;break;}}
      if(fits){for(let i=0;i<w.length;i++)grid2[r+i*dir[0]][col+i*dir[1]]=w[i];placed.push({word:w,r,col,dir});ok=true;}
    }
  });
  // Remplir les cases vides
  const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  grid2.forEach((row,r)=>row.forEach((v,col)=>{if(!v)grid2[r][col]=letters[Math.floor(Math.random()*26)];}));
  let sel2=[],found=new Set();
  const render2=()=>{
    document.getElementById('wsGrid').innerHTML=grid2.map((row,r)=>row.map((v,col)=>{
      const isFound=[...found].some(w=>placed.find(p=>p.word===w&&Array.from({length:p.word.length},(_,i)=>({r:p.r+i*p.dir[0],c:p.col+i*p.dir[1]})).some(({r:pr,c:pc})=>pr===r&&pc===col)));
      const isSel=sel2.some(s=>s.r===r&&s.c===col);
      return `<div onclick="wsClickG(${r},${col})" style="width:28px;height:28px;background:${isFound?'rgba(39,174,96,.3)':isSel?'rgba(192,57,43,.3)':'var(--bg3)'};border:1px solid var(--border);border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;font-weight:700;color:${isFound?'var(--green)':isSel?'var(--accent2)':'var(--text)'};transition:all .15s">${v}</div>`;
    }).join('')).join('');
    document.getElementById('wsFound').textContent=found.size+'/'+words2.length;
    document.getElementById('wsWords').innerHTML=words2.map(w=>`<span style="padding:3px 8px;border-radius:10px;font-size:11px;background:${found.has(w)?'rgba(39,174,96,.2)':'var(--bg3)'};border:1px solid ${found.has(w)?'var(--green)':'var(--border)'};color:${found.has(w)?'var(--green)':'var(--muted)'};text-decoration:${found.has(w)?'line-through':'none'}">${w}</span>`).join('');
  };
  window.wsClickG=(r,col)=>{
    const exists=sel2.findIndex(s=>s.r===r&&s.c===col);
    if(exists>=0){sel2.splice(exists,1);}
    else{sel2.push({r,col,v:grid2[r][col]});}
    // Vérifier si un mot est formé
    if(sel2.length>=3){
      const selStr=sel2.map(s=>s.v).join('');
      words2.forEach(w=>{
        if(!found.has(w)&&(selStr===w||[...sel2].reverse().map(s=>s.v).join('')===w))found.add(w);
      });
      if(found.size===words2.length){document.getElementById('wsMsg').textContent='🎉 Tous les mots trouvés !';(window.awardGameBadge||function(){})('wordsearch',lvl);}
    }
    render2();
  };
  c.innerHTML=`
    <div class="game-hud"><div class="hud-item"><div class="hud-val" id="wsFound">0/${words2.length}</div><div class="hud-label">Trouvés</div></div></div>
    <div id="wsGrid" style="display:grid;grid-template-columns:repeat(${G},28px);gap:3px"></div>
    <div id="wsWords" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;justify-content:center"></div>
    <div id="wsMsg" style="font-size:13px;color:var(--gold);min-height:18px;margin-top:6px"></div>
    <div style="font-size:12px;color:var(--muted)">Clique les lettres dans l'ordre pour former un mot</div>
    <button class="gc-btn" onclick="sel2=[];launchWordSearch(document.getElementById('gameContainer'),'${lvl}')">🔄 Rejouer</button>`;
  render2();
}

/* ══ JEU 15 : DUEL QUIZ ══ */
function launchDuelQuiz(c, lvl) {
  const qs=[
    {q:"Quel est le fruit du démon de Luffy ?",opts:["Gomu Gomu","Mera Mera","Hie Hie","Gura Gura"],a:0},
    {q:"Qui est le maître de Naruto ?",opts:["Jiraiya","Kakashi","Iruka","Minato"],a:1},
    {q:"Quel studio a fait FMA Brotherhood ?",opts:["Madhouse","Bones","Mappa","Trigger"],a:1},
    {q:"Quel est le vrai nom du Titan Colossal ?",opts:["Reiner","Bertholdt","Zeke","Armin"],a:1},
    {q:"Quelle respiration Tanjiro utilise au départ ?",opts:["L'eau","Le feu","Le tonnerre","Le vent"],a:0},
  ];
  let qi=0,p1=0,p2=0,answered=false;
  const render=()=>{
    if(qi>=qs.length){
      c.innerHTML=`<div class="qz-result">
        <h2>Duel terminé !</h2>
        <div style="display:flex;gap:20px;justify-content:center;margin:16px 0">
          <div class="hud-item"><div class="hud-val">${p1}</div><div class="hud-label">Joueur 1 🔴</div></div>
          <div class="hud-item"><div class="hud-val">${p2}</div><div class="hud-label">Joueur 2 🟡</div></div>
        </div>
        <div style="font-size:16px;color:var(--gold);margin-bottom:16px">${p1>p2?'🔴 Joueur 1 gagne !':p2>p1?'🟡 Joueur 2 gagne !':'🤝 Égalité !'}</div>
        <button class="auth-btn" style="max-width:200px" onclick="launchDuelQuiz(document.getElementById('gameContainer'),'${lvl}')">Rejouer</button>
      </div>`;
      if(p1>p2||p2>p1)(window.awardGameBadge||function(){})('duel',lvl);return;
    }
    const q=qs[qi];
    answered=false;
    document.getElementById('duelWrap').innerHTML=`
      <div style="display:flex;justify-content:space-between;margin-bottom:14px">
        <div class="hud-item"><div class="hud-val" style="color:var(--accent2)">${p1}</div><div class="hud-label">🔴 J1</div></div>
        <div style="font-size:12px;color:var(--muted);align-self:center">Q${qi+1}/${qs.length}</div>
        <div class="hud-item"><div class="hud-val" style="color:var(--gold)">${p2}</div><div class="hud-label">🟡 J2</div></div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:16px;font-size:14px;font-weight:500;margin-bottom:14px">${q.q}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${q.opts.map((o,i)=>`<button id="dopt${i}" onclick="duelAnswerG(${i})" class="qz-opt">${o}</button>`).join('')}
      </div>
      <div id="duelFb" style="font-size:13px;color:var(--muted);min-height:18px;margin-top:10px;text-align:center"></div>
      <div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px">J1 clique en premier → 🔴 · J2 (2ème clic) → 🟡</div>`;
  };
  let firstAnswer=null;
  window.duelAnswerG=(i)=>{
    if(answered)return;
    const q=qs[qi];
    if(firstAnswer===null){firstAnswer=i;document.getElementById(`dopt${i}`).style.border='2px solid var(--accent2)';return;}
    answered=true;
    const correct=q.a;
    if(firstAnswer===correct)p1+=10; if(i===correct)p2+=10;
    document.getElementById(`dopt${firstAnswer}`).style.background='var(--accent2)';
    document.getElementById(`dopt${i}`).style.background='var(--blue)';
    document.getElementById(`dopt${correct}`).classList.add('ok');
    document.getElementById('duelFb').textContent=`Bonne réponse : ${q.opts[correct]} ✅`;
    firstAnswer=null;
    setTimeout(()=>{qi++;render();},1400);
  };
  c.innerHTML=`<div id="duelWrap" style="max-width:460px;width:100%"></div>`;
  render();
}

Object.assign(window, {
  launchXO,
  launchConnect4,
  launchMemory,
  launchSnake,
  launchTetris,
  launchPong,
  launchFlappy,
  launchMinesweeper,
  launch2048,
  launchAnimePairs,
  launchReaction,
  launchHangman,
  launchTrivia,
  launchWordSearch,
  launchDuelQuiz,
});