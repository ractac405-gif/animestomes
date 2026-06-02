/* ═══════════════════════════════════════════
   ANIMESTOMES — app.js  (version Firebase RT)
   ═══════════════════════════════════════════ */

/* ══ CONFIG ══ */
const ADMIN      = 'AnimesTomes';
const ADMIN_PASS = 'ractac2025';

/* ══ ÉTAT LOCAL (miroir + cache des données Firebase) ══ */
let DB = {
  users: {
    [ADMIN]: {
      pass: ADMIN_PASS, avatar:'🔱', avatarImg:null, coverImg:null,
      bio:'Créateur d\'AnimesTomes 🔱', email:'ractac405@gmail.com',
      phone:'', country:'BJ', friends:[], invSent:[], invReceived:[],
      clubAccess:true, clubMember:true, stars:5, rank:'Otaku Pro',
      quizPoints:9999, badges:[
        {icon:'👑',name:'Fondateur',color:'gold-b'},
        {icon:'⚔️',name:'Admin Pro',color:'gold-b'}
      ], posts:[], stories:[], groups:0
    }
  },
  posts:[],
  stories:[],
  channelMsgs:{
    'général':[{id:1,user:ADMIN,text:'Bienvenue dans le Club Otaku AnimesTomes ! 🔱',type:'text',t:'10:00'}],
    'naruto':[], 'one-piece':[], 'demon-slayer':[], 'aot':[], 'fan-art':[], 'quiz-défi':[]
  },
  clubPending:[], clubMembers:[ADMIN], clubLocked:false,
  privMessages:{},
  notifications:{ [ADMIN]:[] },
  reports:[],
  ratings:[],
  quizLeaderboard:{ easy:[], normal:[], hard:[] },
  siteStats:{
    connections:0, likes:0, comments:0, shares:0,
    signalements:0, preventions:0, starsGiven:0,
    monthly:[0,0,0,0,0,0,0,0,0,0,0,0],
    likesM:[0,0,0,0,0,0,0,0,0,0,0,0]
  }
};

let currentUser   = null;
let msgId         = 1000;
let postId        = 100;
let ratingDone    = false;
let privFriend    = null;
let clubChannel   = 'général';
let gameAnimFrame = null;

/* ══ FIREBASE HELPERS (attend que Firebase soit prêt) ══ */
let FB_READY = false;
let FB_QUEUE = [];
function withFB(fn){ if(FB_READY){ fn(window.FB); } else { FB_QUEUE.push(fn); } }

window.addEventListener('firebase-ready', ()=>{
  FB_READY = true;
  FB_QUEUE.forEach(fn => fn(window.FB));
  FB_QUEUE = [];
  initFirebaseListeners();
});

/* ══ INIT FIREBASE LISTENERS (données temps réel) ══ */
function initFirebaseListeners(){
  const { db, ref, onValue } = window.FB;

  /* Stats globales temps réel */
  onValue(ref(db, 'siteStats'), snap=>{
    if(snap.exists()){
      const s = snap.val();
      DB.siteStats = { ...DB.siteStats, ...s };
      if(currentUser === ADMIN){
        const statsBody = document.getElementById('statsBody');
        if(statsBody && document.getElementById('pgStats')?.classList.contains('active')) renderStats();
      }
    }
  });

  /* Users temps réel */
  onValue(ref(db, 'users'), snap=>{
    if(snap.exists()){
      const fbUsers = snap.val();
      Object.keys(fbUsers).forEach(u=>{
        if(u !== ADMIN || !DB.users[ADMIN]) DB.users[u] = { ...DB.users[u]||{}, ...fbUsers[u] };
      });
      if(currentUser) updateHeader();
    }
  });

  /* Posts temps réel */
  onValue(ref(db, 'posts'), snap=>{
    const posts = [];
    if(snap.exists()){
      snap.forEach(child=>{ posts.push(child.val()); });
    }
    DB.posts = posts.sort((a,b)=>a.id-b.id);
    if(document.getElementById('pgHome')?.classList.contains('active')) renderFeed();
  });

  /* Messages Club temps réel */
  onValue(ref(db, 'channelMsgs'), snap=>{
    if(snap.exists()){
      const ch = snap.val();
      Object.keys(ch).forEach(c=>{ DB.channelMsgs[c] = Array.isArray(ch[c]) ? ch[c] : Object.values(ch[c]); });
    }
    if(document.getElementById('clubChat')?.style.display !== 'none') renderClubMsgs();
  });

  /* Messages privés temps réel */
  onValue(ref(db, 'privMessages'), snap=>{
    if(snap.exists()){
      const pm = snap.val();
      Object.keys(pm).forEach(k=>{
        DB.privMessages[k] = Array.isArray(pm[k]) ? pm[k] : Object.values(pm[k]);
      });
    }
    if(privFriend && document.getElementById('privChat')?.style.display !== 'none') renderPrivMsgs();
  });

  /* Notifications temps réel */
  onValue(ref(db, 'notifications'), snap=>{
    if(snap.exists()){
      const notifs = snap.val();
      Object.keys(notifs).forEach(u=>{
        DB.notifications[u] = Array.isArray(notifs[u]) ? notifs[u] : Object.values(notifs[u]);
      });
    }
    if(currentUser) updateNotifBadge();
  });

  /* Club members + pending */
  onValue(ref(db, 'club'), snap=>{
    if(snap.exists()){
      const c = snap.val();
      if(c.members) DB.clubMembers = c.members;
      if(c.pending) DB.clubPending = c.pending;
      if(c.locked !== undefined) DB.clubLocked = c.locked;
    }
  });

  /* Leaderboard quiz */
  onValue(ref(db, 'quizLeaderboard'), snap=>{
    if(snap.exists()) DB.quizLeaderboard = snap.val();
  });

  /* Ratings */
  onValue(ref(db, 'ratings'), snap=>{
    const arr=[];
    if(snap.exists()) snap.forEach(c=>arr.push(c.val()));
    DB.ratings = arr;
  });

  /* Reports */
  onValue(ref(db, 'reports'), snap=>{
    const arr=[];
    if(snap.exists()) snap.forEach(c=>arr.push(c.val()));
    DB.reports = arr;
  });
}

/* ══ SAUVEGARDE FIREBASE ══ */
function fbSaveUser(username){
  withFB(({db,ref,set})=>{
    const u = DB.users[username];
    if(!u) return;
    set(ref(db, `users/${username}`), u);
  });
}
function fbSaveStats(){
  withFB(({db,ref,set})=>set(ref(db,'siteStats'), DB.siteStats));
}
function fbSavePost(post){
  withFB(({db,ref,set})=>set(ref(db,`posts/${post.id}`), post));
}
function fbDeletePost(id){
  withFB(({db,ref,remove})=>remove(ref(db,`posts/${id}`)));
}
function fbSaveChannelMsg(channel, msgs){
  withFB(({db,ref,set})=>set(ref(db,`channelMsgs/${channel}`), msgs));
}
function fbSavePriv(key, msgs){
  withFB(({db,ref,set})=>set(ref(db,`privMessages/${key}`), msgs));
}
function fbSaveNotif(user){
  withFB(({db,ref,set})=>set(ref(db,`notifications/${user}`), DB.notifications[user]||[]));
}
function fbSaveClub(){
  withFB(({db,ref,set})=>set(ref(db,'club'),{
    members: DB.clubMembers,
    pending: DB.clubPending,
    locked: DB.clubLocked
  }));
}
function fbSaveLeaderboard(){
  withFB(({db,ref,set})=>set(ref(db,'quizLeaderboard'), DB.quizLeaderboard));
}
function fbPushRating(rating){
  withFB(({db,ref,push})=>push(ref(db,'ratings'), rating));
}
function fbPushReport(report){
  withFB(({db,ref,push})=>push(ref(db,'reports'), report));
}
function fbIncrStat(key){
  withFB(({db,ref,update,increment})=>update(ref(db,'siteStats'),{[key]:increment(1)}));
}

/* ═══════════════════════════════
   AUTH
════════════════════════════════*/
const AVATARS = ['🐉','⚔️','🌸','🔥','👁️','🌙','⚡','🎭','🏯','🦊','🌊','🎌','🌺','💫','🐱'];

function switchTab(t){
  document.getElementById('loginForm').style.display   = t==='login'?'block':'none';
  document.getElementById('registerForm').style.display = t==='register'?'block':'none';
  document.getElementById('tabLogin').classList.toggle('active', t==='login');
  document.getElementById('tabRegister').classList.toggle('active', t==='register');
  document.getElementById('authErr').textContent = '';
  if(t==='register') buildAvatarPicker();
}

function buildAvatarPicker(){
  const p = document.getElementById('avatarPick');
  if(!p) return;
  p.innerHTML = AVATARS.map((a,i)=>
    `<div class="av-opt${i===0?' selected':''}" onclick="pickAv(this,'${a}')" data-av="${a}">${a}</div>`
  ).join('');
}

function pickAv(el,av){
  document.querySelectorAll('.av-opt').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
}
function selAvatar(){ return document.querySelector('.av-opt.selected')?.dataset.av || AVATARS[0]; }

function doRegister(){
  const u   = document.getElementById('rUser').value.trim();
  const p   = document.getElementById('rPass').value.trim();
  const err = document.getElementById('authErr');
  if(!u||!p){ err.textContent='Remplis tous les champs.'; return; }
  if(p.length<4){ err.textContent='Mot de passe trop court.'; return; }
  if(DB.users[u]){ err.textContent='Pseudo déjà pris.'; return; }
  DB.users[u] = {
    pass:p, avatar:selAvatar(), avatarImg:null, coverImg:null,
    bio:'', email:'', phone:'', country:'BJ',
    friends:[], invSent:[], invReceived:[],
    clubAccess:false, clubMember:false, stars:0, rank:'Rang E',
    quizPoints:0, badges:[], posts:[], stories:[], groups:0
  };
  DB.notifications[u] = [];
  /* Auto-ami avec ADMIN (RACTAC) */
  DB.users[u].friends = [ADMIN];
  if(DB.users[ADMIN]){
    if(!Array.isArray(DB.users[ADMIN].friends)) DB.users[ADMIN].friends=[];
    if(!DB.users[ADMIN].friends.includes(u)) DB.users[ADMIN].friends.push(u);
    fbSaveUser(ADMIN);
  }
  fbSaveUser(u);
  fbSaveNotif(u);
  fbIncrStat('totalUsers');
  addNotif(ADMIN,{icon:'🎉',text:`${u} vient de s'inscrire et a été ajouté à tes amis !`,link:{page:'pgFriends'}});
  addNotif(u,{icon:'👑',text:`Bienvenue ! Tu es automatiquement ami avec ${ADMIN}.`,link:{page:'pgFriends'}});
  err.style.color='var(--green)'; err.textContent='Compte créé !';
  setTimeout(()=>loginAs(u), 700);
}

function doLogin(){
  const u   = document.getElementById('lUser').value.trim();
  const p   = document.getElementById('lPass').value.trim();
  const err = document.getElementById('authErr');
  if(!u||!p){ err.textContent='Remplis tous les champs.'; return; }

  /* Vérification d'abord en local puis Firebase */
  if(DB.users[u]){
    if(DB.users[u].pass !== p){ err.textContent='Identifiants incorrects.'; return; }
    loginAs(u);
  } else {
    withFB(({db,ref,get})=>{
      get(ref(db,`users/${u}`)).then(snap=>{
        if(!snap.exists()){ err.textContent='Identifiants incorrects.'; return; }
        const userData = snap.val();
        if(userData.pass !== p){ err.textContent='Identifiants incorrects.'; return; }
        DB.users[u] = userData;
        if(!DB.notifications[u]) DB.notifications[u]=[];
        loginAs(u);
      });
    });
  }
}

function loginAs(u){
  currentUser = u;
  if(!DB.notifications[u]) DB.notifications[u]=[];
  sessionStorage.setItem('at_u', u);
  document.getElementById('authScreen').style.display='none';
  document.getElementById('appShell').style.display='flex';
  updateHeader();
  navTo('pgHome');
  updateNotifBadge();
  toast('Bienvenue, '+u+' ! '+(DB.users[u]?.avatar||''));
  fbIncrStat('connections');
  if(!ratingDone) setTimeout(showRatingModal, 10*60*1000);
}

function doLogout(){
  sessionStorage.removeItem('at_u');
  currentUser=null; privFriend=null; clubChannel='général';
  document.getElementById('appShell').style.display='none';
  document.getElementById('authScreen').style.display='flex';
  document.getElementById('authErr').textContent='';
  document.getElementById('lUser').value='';
  document.getElementById('lPass').value='';
}

function checkAutoLogin(){
  const s = sessionStorage.getItem('at_u');
  if(s){
    /* Essaie d'abord en local */
    if(DB.users[s]){ loginAs(s); return; }
    /* Sinon charge depuis Firebase */
    withFB(({db,ref,get})=>{
      get(ref(db,`users/${s}`)).then(snap=>{
        if(snap.exists()){ DB.users[s]=snap.val(); loginAs(s); }
        else { sessionStorage.removeItem('at_u'); }
      });
    });
  }
}

/* ═══════════════════════════════
   HEADER
════════════════════════════════*/
function updateHeader(){
  if(!currentUser) return;
  const u  = DB.users[currentUser];
  const av = document.getElementById('hAvatar');
  if(av) av.innerHTML = u?.avatarImg ? `<img src="${u.avatarImg}" alt="">` : (u?.avatar||'👤');
  const dp = document.getElementById('drawerAvatar');
  if(dp) dp.innerHTML = u?.avatarImg ? `<img src="${u.avatarImg}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : (u?.avatar||'👤');
  const dn = document.getElementById('drawerName'); if(dn) dn.textContent = currentUser;
  const dr = document.getElementById('drawerRank'); if(dr) dr.textContent = (u?.rank||'Rang E')+' '+'⭐'.repeat(Math.min(u?.stars||0,5));
  /* composer avatar */
  const ca = document.getElementById('composerAvatar');
  if(ca) ca.innerHTML = u?.avatarImg ? `<img src="${u.avatarImg}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : (u?.avatar||'👤');
}

/* ═══════════════════════════════
   NAVIGATION
════════════════════════════════*/
const ALL_PAGES = ['pgHome','pgFriends','pgMsg','pgGalerie','pgJeux','pgQuiz','pgProfile','pgMonCompte','pgStats','pgApropos','pgHelp'];

function navTo(id){
  ALL_PAGES.forEach(p=>{ const el=document.getElementById(p); if(el) el.classList.remove('active'); });
  const pg = document.getElementById(id);
  if(pg) pg.classList.add('active');
  ['dm0','dm1','dm2','dm3','dm4','dm5'].forEach(d=>{ const el=document.getElementById(d); if(el) el.classList.remove('active'); });
  const map={pgHome:'dm0',pgFriends:'dm2',pgMsg:'dm1',pgGalerie:'dm3',pgJeux:'dm4',pgQuiz:'dm5'};
  if(map[id]){ const el=document.getElementById(map[id]); if(el) el.classList.add('active'); }
  closeNotifPanel();
  if(id==='pgHome')      renderHome();
  if(id==='pgFriends')   renderFriendsPage();
  if(id==='pgMsg')       resetMsgHub();
  if(id==='pgGalerie')   renderGallery(GALLERY_IMGS);
  if(id==='pgJeux')      renderGamesGrid();
  if(id==='pgQuiz')      renderQuizLevels();
  if(id==='pgMonCompte') renderMonCompte();
  if(id==='pgStats' && currentUser===ADMIN) renderStats();
  if(id==='pgApropos')   renderAbout();
  if(id==='pgHelp')      renderHelp();
  window.scrollTo(0,0);
}

/* ═══════════════════════════════
   DRAWER
════════════════════════════════*/
function toggleDrawer(){
  document.getElementById('drawer').classList.toggle('open');
  document.getElementById('drawerOv').classList.toggle('open');
  updateHeader();
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOv').classList.remove('open');
}

/* ═══════════════════════════════
   NOTIFICATIONS
════════════════════════════════*/
function addNotif(user, n){
  if(!DB.notifications[user]) DB.notifications[user]=[];
  DB.notifications[user].unshift({...n, id:Date.now(), read:false, time:nowStr()});
  fbSaveNotif(user);
  if(user===currentUser) updateNotifBadge();
}
function updateNotifBadge(){
  const notifs = DB.notifications[currentUser]||[];
  const cnt    = notifs.filter(n=>!n.read).length;
  const badge  = document.getElementById('notifBadge');
  if(badge){ badge.textContent=cnt; badge.classList.toggle('show',cnt>0); }
  const qdot = document.getElementById('qnInvDot');
  if(qdot){ const inv=DB.users[currentUser]?.invReceived||[]; qdot.classList.toggle('show',inv.length>0); }
  const ddot = document.getElementById('drawerInvDot');
  if(ddot){ const inv=DB.users[currentUser]?.invReceived||[]; ddot.classList.toggle('show',inv.length>0); }
}
function openNotifPanel(){
  const p = document.getElementById('notifPanel');
  p.classList.toggle('open');
  if(p.classList.contains('open')) renderNotifPanel();
}
function closeNotifPanel(){ document.getElementById('notifPanel')?.classList.remove('open'); }
function renderNotifPanel(){
  const notifs = DB.notifications[currentUser]||[];
  notifs.forEach(n=>n.read=true);
  fbSaveNotif(currentUser);
  updateNotifBadge();
  const list = document.getElementById('notifList');
  if(!notifs.length){ list.innerHTML='<div class="notif-empty">🔔 Aucune notification</div>'; return; }
  list.innerHTML = notifs.slice(0,25).map((n,i)=>`
    <div class="notif-item" data-notif-idx="${i}" onclick="handleNotifClick(${i})">
      <div class="ni-icon">${n.icon||'🔔'}</div>
      <div><div class="ni-text">${n.text}</div><div class="ni-time">${n.time}</div></div>
    </div>`).join('');
}
/* Gestion clic notification — redirige vers la zone concernée */
function handleNotifClick(idx){
  const notifs = DB.notifications[currentUser]||[];
  const n = notifs[idx]; if(!n) return;
  closeNotifPanel();
  const link = n.link || autoNotifLink(n);
  if(!link){ return; }
  if(link.openProfile){ openProfile(link.openProfile); return; }
  if(link.openPriv){    openPrivChat(link.openPriv);   return; }
  if(link.page){
    navTo(link.page);
    if(link.page==='pgProfile' && link.user) setTimeout(()=>{ openProfile(link.user); if(link.tab==='stars') setTimeout(()=>{ const r=document.querySelector('.stars-display'); if(r) r.scrollIntoView({behavior:'smooth',block:'center'}); },200); },80);
  }
}
function autoNotifLink(n){
  const t = (n.text||'').toLowerCase();
  if(t.includes('invitation') || t.includes('ami')) return {page:'pgFriends'};
  if(t.includes('étoile') || t.includes('etoile')) return {page:'pgProfile', user:currentUser, tab:'stars'};
  if(t.includes('club'))     return {page:'pgMsg'};
  if(t.includes('message'))  return {page:'pgMsg'};
  if(t.includes('publication') || t.includes('partagé')) return {page:'pgHome'};
  if(t.includes('badge') || t.includes('jeu'))   return {page:'pgJeux'};
  if(t.includes('signalement') || t.includes('prévention')) return {page:'pgMonCompte'};
  return {page:'pgHome'};
}
window.handleNotifClick = handleNotifClick;
function clearNotifs(){
  DB.notifications[currentUser]=[];
  fbSaveNotif(currentUser);
  updateNotifBadge(); renderNotifPanel();
}

/* ═══════════════════════════════
   HERO SLIDER
════════════════════════════════*/
const SLIDES=[
  {tag:'Naruto',color:'#e67e22',bg:'th-7.png',title:'Naruto Shippuden',desc:'Dans un monde de ninjas, Naruto Uzumaki rêve de devenir Hokage. Porteur de Kurama, le renard à neuf queues, il surmontera chaque épreuve avec persévérance et amitié.'},
  {tag:'Attack on Titan',color:'#2980b9',bg:'th-2.webp',title:'Shingeki no Kyojin',desc:'Derrière d\'immenses murs, l\'humanité survit face aux Titans dévastateurs. Eren Yeager jure d\'exterminer ces créatures après la chute du Mur Maria.'},
  {tag:'Demon Slayer',color:'#c0392b',bg:'th-3.webp',title:'Kimetsu no Yaiba',desc:'Tanjiro Kamado part à la recherche d\'un remède pour sa sœur transformée en démon. Un périple épique au cœur du Corps des Pourfendeurs de Démons.'},
  {tag:'One Piece',color:'#f39c12',bg:'th-6.webp',title:'One Piece',desc:'Monkey D. Luffy et son équipage naviguent sur la Grand Line à la recherche du légendaire trésor One Piece. L\'aventure ultime vers la liberté !'},
  {tag:'Dragon Ball Z',color:'#27ae60',bg:'th-0.webp',title:'Dragon Ball Z',desc:'Son Goku et ses amis défendent la Terre contre des ennemis toujours plus puissants. Des Saiyans aux Androïdes, chaque combat redéfinit les limites du possible.'},
];
let slideIdx=0, slideTimer;
function initSlider(){
  const w = document.getElementById('sliderWrap');
  const d = document.getElementById('sliderDots');
  if(!w) return;
  w.innerHTML = SLIDES.map((s,i)=>`
    <div class="slide${i===0?' active':''}" id="slide${i}">
      <div class="slide-bg" style="background-image:url('${s.bg}')"></div>
      <div class="slide-overlay"></div>
      <div class="slide-content">
        <div class="slide-tag" style="background:${s.color}">${s.tag}</div>
        <div class="slide-title">${s.title}</div>
        <div class="slide-desc">${s.desc}</div>
      </div>
    </div>`).join('');
  if(d) d.innerHTML = SLIDES.map((_,i)=>`<div class="slide-dot${i===0?' active':''}" onclick="goSlide(${i})"></div>`).join('');
  clearInterval(slideTimer);
  slideTimer = setInterval(()=>goSlide((slideIdx+1)%SLIDES.length), 5000);
}
function goSlide(n){
  document.querySelectorAll('.slide').forEach((s,i)=>s.classList.toggle('active',i===n));
  document.querySelectorAll('.slide-dot').forEach((d,i)=>d.classList.toggle('active',i===n));
  slideIdx=n;
}

/* ═══════════════════════════════
   HOME
════════════════════════════════*/
function renderHome(){
  renderStories();
  renderFeed();
}

/* ── STORIES — helpers expiration 24h ── */
const STORY_TTL_MS = 24*60*60*1000;
function pruneExpiredStories(){
  const now = Date.now();
  let changed = false;
  Object.keys(DB.users).forEach(u=>{
    const usr = DB.users[u]; if(!usr?.stories?.length) return;
    const kept = usr.stories.filter(s=>{
      if(!s.t) return true; /* anciennes stories sans timestamp = on garde */
      return (now - s.t) < STORY_TTL_MS;
    });
    if(kept.length !== usr.stories.length){
      usr.stories = kept; changed = true;
      if(u===currentUser) fbSaveUser(u);
    }
  });
  return changed;
}
/* Purge auto toutes les 5 minutes */
setInterval(()=>{ if(pruneExpiredStories()){ if(document.getElementById('pgHome')?.classList.contains('active')) renderStories(); } }, 5*60*1000);

/* ── STORIES ── */
function renderStories(){
  const row = document.getElementById('storiesRow');
  if(!row) return;
  const me = DB.users[currentUser];
  let html = `<div class="add-story" onclick="openModal('addStoryModal')">
    <div class="add-story-ring">➕</div>
    <div class="story-name">Ma story</div>
  </div>`;
  /* Purger les stories expirées (>24h) avant affichage */
  pruneExpiredStories();
  /* Ma propre story si j'en ai */
  if(me?.stories?.length){
    const myStory = me.stories[me.stories.length-1];
    const thumb = myStory.mediaType==='image' ? `<img src="${myStory.media}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` :
                  myStory.mediaType==='video'  ? '🎥' :
                  (me.avatarImg ? `<img src="${me.avatarImg}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : me.avatar);
    html+=`<div class="story-item" onclick="viewStory('${currentUser}')">
      <div class="story-ring" style="background:linear-gradient(135deg,var(--gold),var(--accent))"><div class="story-inner">${thumb}</div></div>
      <div class="story-name">Moi</div>
    </div>`;
  }
  /* Stories des amis */
  (me?.friends||[]).forEach(f=>{
    const fu = DB.users[f];
    if(!fu?.stories?.length) return;
    const lastStory = fu.stories[fu.stories.length-1];
    let thumb;
    if(lastStory.mediaType==='image') thumb = `<img src="${lastStory.media}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    else if(lastStory.mediaType==='video') thumb = '🎥';
    else thumb = fu.avatarImg ? `<img src="${fu.avatarImg}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : fu.avatar;
    html+=`<div class="story-item" onclick="viewStory('${f}')">
      <div class="story-ring"><div class="story-inner">${thumb}</div></div>
      <div class="story-name">${f}</div>
    </div>`;
  });
  row.innerHTML=html;
}

function doAddStory(){
  const txt      = document.getElementById('storyText').value.trim();
  const fileInp  = document.getElementById('storyMediaInput');
  const files    = Array.from(fileInp?.files||[]);
  const u        = DB.users[currentUser];
  if(!u.stories) u.stories=[];

  const finish = ()=>{
    fbSaveUser(currentUser);
    closeModal('addStoryModal');
    document.getElementById('storyText').value='';
    if(fileInp) fileInp.value='';
    const prev = document.getElementById('storyMediaPreview');
    if(prev) prev.innerHTML='';
    renderStories();
    toast(files.length>1 ? `${files.length} stories publiées ! 📸` : 'Story publiée ! 📸');
  };

  if(files.length){
    let done=0;
    files.forEach((file,idx)=>{
      const r=new FileReader();
      r.onload=e=>{
        const type=file.type.startsWith('video/')?'video':'image';
        u.stories.push({ text: idx===0?txt:'', media:e.target.result, mediaType:type, time:nowStr(), t:Date.now() });
        if(++done===files.length) finish();
      };
      r.readAsDataURL(file);
    });
  } else if(txt){
    u.stories.push({ text:txt, media:null, mediaType:'text', time:nowStr(), t:Date.now() });
    finish();
  } else {
    toast('Ajoute du texte ou un média !');
  }
}

let _storyCtx = { user:null, idx:0 };
function viewStory(user, idx){
  pruneExpiredStories();
  const u = DB.users[user]; if(!u?.stories?.length) return;
  /* Permission : si on n'est pas l'auteur, on doit être ami */
  if(user!==currentUser){
    const me = DB.users[currentUser];
    const friends = me?.friends||[];
    if(!friends.includes(user) && currentUser!==ADMIN){
      toast('🔒 Tu dois être ami avec '+user+' pour voir sa story.');
      return;
    }
  }
  if(idx==null) idx = u.stories.length-1;
  idx = Math.max(0, Math.min(u.stories.length-1, idx));
  _storyCtx = { user, idx };
  const s = u.stories[idx];
  const av = u.avatarImg ? `<img src="${u.avatarImg}" style="width:60px;height:60px;border-radius:50%;object-fit:cover" alt="">` : `<span style="font-size:48px">${u.avatar}</span>`;
  let mediaHtml = '';
  if(s.mediaType==='image') mediaHtml = `<img src="${s.media}" style="width:100%;max-height:320px;object-fit:cover;border-radius:10px;margin:10px 0" alt="">`;
  else if(s.mediaType==='video') mediaHtml = `<video src="${s.media}" controls style="width:100%;max-height:320px;border-radius:10px;margin:10px 0"></video>`;
  const hasPrev = idx>0, hasNext = idx < u.stories.length-1;
  document.getElementById('storyViewer').innerHTML=`
    <div class="story-modal-body" style="position:relative">
      ${hasPrev?`<button class="story-nav-btn prev" onclick="navStory(-1)">‹</button>`:''}
      ${hasNext?`<button class="story-nav-btn next" onclick="navStory(1)">›</button>`:''}
      <div class="story-progress"><div class="story-progress-fill"></div></div>
      <div style="font-size:36px;margin-bottom:4px">${av}</div>
      <div style="font-weight:500;margin-bottom:4px;font-size:15px">${user}${user===ADMIN?' 👑':''}</div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:10px">Story ${idx+1}/${u.stories.length}</div>
      ${mediaHtml}
      ${s.text ? `<div style="font-size:14px;line-height:1.6;margin-top:8px">${s.text}</div>` : ''}
      <div style="font-size:11px;color:var(--muted);margin-top:10px">${s.time||''}</div>
    </div>`;
  openModal('storyModal');
}
function navStory(delta){
  if(!_storyCtx.user) return;
  viewStory(_storyCtx.user, _storyCtx.idx + delta);
}
window.viewStory = viewStory;
window.navStory  = navStory;

/* ── FEED ── */
function renderFeed(){
  const f = document.getElementById('feedPosts');
  if(!f) return;
  /* Filtre : seuls les posts publics apparaissent dans l'accueil.
     Les posts privés (public:false) restent dans le journal de leur auteur. */
  const visible = DB.posts.filter(p => p.public !== false);
  if(!visible.length){ f.innerHTML='<div class="empty-state"><div class="es-icon">📭</div>Aucune publication. Sois le premier à publier !</div>'; return; }
  f.innerHTML = visible.slice().reverse().map(p=>buildPostHTML(p)).join('');
}
function buildPostHTML(p){
  const u     = DB.users[p.author];
  const av    = u?.avatarImg?`<img src="${u.avatarImg}" alt="">`:u?.avatar||'👤';
  const liked = p.likes?.includes(currentUser);
  const isVid = (p.image||'').startsWith('data:video/');
  const allowDl = (p.downloadable !== false);
  const media = p.image ? (isVid
      ? `<div class="post-img-wrap"><video class="post-img" src="${p.image}" controls></video></div>`
      : `<div class="post-img-wrap"><img class="post-img" src="${p.image}" alt="">${allowDl?`<button class="post-dl-btn" onclick="downloadPostMedia(${p.id})">⬇ Télécharger</button>`:''}</div>`) : '';
  const canEdit = p.author===currentUser;
  const canDelete = canEdit || currentUser===ADMIN;
  const ownerCtrls = `
    ${canEdit?`<button onclick="editPost(${p.id})" style="background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:14px" title="Modifier">✏️</button>`:''}
    ${canDelete?`<button onclick="confirmDeletePost(${p.id})" style="background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:14px" title="Supprimer">🗑️</button>`:''}
  `;
  return `<div class="post-card" id="post_${p.id}">
    <div class="post-header">
      <div class="post-avatar" onclick="openProfile('${p.author}')">${av}</div>
      <div class="post-meta">
        <div class="post-user" onclick="openProfile('${p.author}')">${p.author}${p.author===ADMIN?' 👑':''}${p.edited?' <span style="font-size:11px;color:var(--muted)">(modifié)</span>':''}</div>
        <div class="post-time">${p.time}</div>
      </div>
      <div style="margin-left:auto;display:flex;gap:4px">${ownerCtrls}</div>
    </div>
    ${media}
    <div class="post-body" id="pb_${p.id}">${p.text||''}</div>
    <div class="post-actions">
      <button class="pa-btn${liked?' liked':''}" onclick="likePost(${p.id})">❤️ ${p.likes?.length||0}</button>
      <button class="pa-btn" onclick="toggleComments(${p.id})">💬 ${p.comments?.length||0}</button>
      <button class="pa-btn" onclick="sharePost(${p.id})">🔗 ${p.shares||0}</button>
    </div>
    <div class="comments-section" id="cs_${p.id}">
      <div id="cl_${p.id}">${buildComments(p)}</div>
      <div class="ci-input-row">
        <input class="c-input" id="ci_${p.id}" placeholder="Commenter..." onkeydown="if(event.key==='Enter')addComment(${p.id})">
        <button class="send-btn priv" onclick="addComment(${p.id})">➤</button>
      </div>
    </div>
  </div>`;
}
function buildComments(p){
  if(!p.comments?.length) return '<div style="font-size:12px;color:var(--muted);margin-bottom:8px">Aucun commentaire.</div>';
  return p.comments.map(c=>{
    const u=DB.users[c.author]; const av=u?.avatarImg?`<img src="${u.avatarImg}" alt="">`:u?.avatar||'👤';
    return `<div class="comment-item">
      <div class="ci-av" onclick="openProfile('${c.author}')">${av}</div>
      <div class="ci-body"><div class="ci-user" onclick="openProfile('${c.author}')">${c.author}</div><div class="ci-text">${c.text}</div></div>
    </div>`;
  }).join('');
}
/* Helper : re-render la feed en gardant ouvertes les sections commentaires */
function refreshFeed(){
  const opened = Array.from(document.querySelectorAll('.comments-section'))
    .filter(el=>el.style.display==='block').map(el=>el.id);
  renderFeed();
  /* Si la page profil est active, on rafraîchit aussi le journal */
  if(document.getElementById('pgProfile')?.classList.contains('active') && window._currentProfileUser){
    renderProfile(window._currentProfileUser);
  }
  opened.forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='block'; });
}
function likePost(id){
  const p=DB.posts.find(x=>x.id===id); if(!p) return;
  if(!p.likes) p.likes=[];
  const i=p.likes.indexOf(currentUser);
  if(i>=0) p.likes.splice(i,1);
  else { p.likes.push(currentUser); fbIncrStat('likes'); }
  fbSavePost(p);
  refreshFeed();
}
function toggleComments(id){ const el=document.getElementById('cs_'+id); if(el) el.style.display=el.style.display==='block'?'none':'block'; }
function addComment(id){
  const inp=document.getElementById('ci_'+id); const txt=inp?.value.trim(); if(!txt) return;
  const p=DB.posts.find(x=>x.id===id); if(!p) return;
  if(!p.comments) p.comments=[];
  p.comments.push({author:currentUser,text:txt,time:nowStr()});
  fbIncrStat('comments');
  fbSavePost(p);
  if(inp) inp.value='';
  refreshFeed();
  const sec=document.getElementById('cs_'+id); if(sec) sec.style.display='block';
}
function deletePost(id){
  DB.posts=DB.posts.filter(p=>p.id!==id);
  fbDeletePost(id);
  refreshFeed();
}
function confirmDeletePost(id){
  if(confirm('Supprimer cette publication ?')) deletePost(id);
}
function editPost(id){
  const p=DB.posts.find(x=>x.id===id); if(!p) return;
  if(p.author!==currentUser){ toast('Tu ne peux modifier que tes propres publications.'); return; }
  const t=prompt('Modifier ta publication :', p.text||'');
  if(t===null) return;
  p.text=t.trim();
  p.edited=true;
  fbSavePost(p);
  refreshFeed();
  toast('Publication modifiée ✓');
}

/* ── PARTAGE : ouvre une vraie boîte de partage ── */
function sharePost(id){
  const p=DB.posts.find(x=>x.id===id); if(!p) return;
  const url = `${location.origin}${location.pathname}#post=${p.id}`;
  const text = (p.text||'').slice(0,120);
  const me = DB.users[currentUser];
  const friends = (me?.friends||[]).filter(f=>f!==currentUser);
  const isMember = (DB.clubMembers||[]).includes(currentUser);
  const myChannels = isMember ? Object.keys(DB.channelMsgs||{}) : [];
  const friendOpts = friends.length
    ? friends.map(f=>`<button class="auth-btn" style="margin:4px 0" onclick="shareToFriend(${p.id},'${f.replace(/'/g,"\\'")}')">👤 ${f}</button>`).join('')
    : '<div style="color:var(--muted);font-size:13px">Aucun ami pour l\'instant.</div>';
  const chanOpts = myChannels.length
    ? myChannels.map(c=>`<button class="auth-btn" style="margin:4px 0;background:var(--purple)" onclick="shareToClub(${p.id},'${c.replace(/'/g,"\\'")}')">🏰 #${c}</button>`).join('')
    : '<div style="color:var(--muted);font-size:13px">Tu n\'es membre d\'aucun salon du Club.</div>';
  const html=`
    <div id="shareSheet" style="position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px" onclick="if(event.target.id==='shareSheet')closeShareSheet()">
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:14px;padding:18px;max-width:380px;width:100%;max-height:80vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-family:'Cinzel',serif;font-size:16px;color:#fff">🔗 Partager</div>
          <button onclick="closeShareSheet()" style="background:transparent;border:none;color:var(--muted);font-size:20px;cursor:pointer">✕</button>
        </div>
        <div style="font-size:12px;color:var(--muted);margin:4px 0 4px">Partage externe (lien) :</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
          <button class="auth-btn" onclick="shareCopyLink('${url.replace(/'/g,"\\'")}',${p.id})">📋 Lien</button>
          <button class="auth-btn" style="background:#1877F2" onclick="shareFacebook('${url.replace(/'/g,"\\'")}',${p.id})">📘 FB</button>
          <button class="auth-btn" style="background:#25D366" onclick="shareWhatsapp('${url.replace(/'/g,"\\'")}','${text.replace(/'/g,"\\'")}',${p.id})">💬 WA</button>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:4px">📨 Envoyer à un ami (média direct) :</div>
        <div style="max-height:140px;overflow-y:auto;margin-bottom:10px">${friendOpts}</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:4px">🏰 Partager dans un salon :</div>
        <div style="max-height:140px;overflow-y:auto">${chanOpts}</div>
      </div>
    </div>`;
  const wrap=document.createElement('div'); wrap.innerHTML=html; document.body.appendChild(wrap.firstElementChild);
}
function closeShareSheet(){ const el=document.getElementById('shareSheet'); if(el) el.remove(); }
function downloadPostMedia(id){
  const p = DB.posts.find(x=>x.id===id); if(!p||!p.image) return;
  if(p.downloadable===false){ toast('🔒 Cette image n\'est pas téléchargeable.'); return; }
  const ext = (p.image.match(/data:[^/]+\/([^;]+);/)||[])[1] || 'jpg';
  const a = document.createElement('a');
  a.href = p.image; a.download = `animestomes_${p.id}.${ext}`;
  document.body.appendChild(a); a.click(); a.remove();
  toast('⬇ Téléchargement lancé');
}
window.downloadPostMedia = downloadPostMedia;
function _incShare(id){
  const p=DB.posts.find(x=>x.id===id); if(!p) return;
  p.shares=(p.shares||0)+1; fbSavePost(p); fbIncrStat('shares'); refreshFeed();
}
function _postMediaType(p){
  if(!p.image) return 'text';
  return p.image.startsWith('data:video/') ? 'video' : 'image';
}
function shareCopyLink(url,id){
  navigator.clipboard?.writeText(url).then(()=>toast('Lien copié ! 🔗')).catch(()=>toast('Lien : '+url));
  _incShare(id); closeShareSheet();
}
function shareFacebook(url,id){
  window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url),'_blank','width=600,height=500');
  _incShare(id); closeShareSheet();
}
function shareWhatsapp(url,text,id){
  window.open('https://wa.me/?text='+encodeURIComponent(text+' '+url),'_blank');
  _incShare(id); closeShareSheet();
}
function shareToFriend(id,friend){
  const p=DB.posts.find(x=>x.id===id); if(!p) return;
  const key=[currentUser,friend].sort().join('_');
  if(!DB.privMessages[key]) DB.privMessages[key]=[];
  const caption = `📢 Partagé par ${currentUser}${p.text?' : "'+p.text.slice(0,140)+'"':''}`;
  const mtype = _postMediaType(p);
  if(mtype==='text'){
    DB.privMessages[key].push({id:++msgId,user:currentUser,text:caption,type:'text',t:nowStr()});
  } else {
    DB.privMessages[key].push({id:++msgId,user:currentUser,data:p.image,type:mtype,text:caption,t:nowStr()});
    DB.privMessages[key].push({id:++msgId,user:currentUser,text:caption,type:'text',t:nowStr()});
  }
  fbSavePriv(key, DB.privMessages[key]);
  addNotif(friend,{icon:'📢',text:`${currentUser} t'a partagé une publication.`});
  _incShare(id); closeShareSheet();
  toast('Partagé à '+friend+' ✉️');
}
function shareToClub(id, channel){
  const p=DB.posts.find(x=>x.id===id); if(!p) return;
  const ch = channel || clubChannel || 'général';
  DB.channelMsgs[ch] = DB.channelMsgs[ch] || [];
  const caption = `📢 ${currentUser} a partagé${p.text?' : "'+p.text.slice(0,140)+'"':' une publication.'}`;
  const mtype = _postMediaType(p);
  if(mtype==='text'){
    DB.channelMsgs[ch].push({id:++msgId,user:currentUser,text:caption,type:'text',t:nowStr()});
  } else {
    DB.channelMsgs[ch].push({id:++msgId,user:currentUser,data:p.image,type:mtype,text:caption,t:nowStr()});
    DB.channelMsgs[ch].push({id:++msgId,user:currentUser,text:caption,type:'text',t:nowStr()});
  }
  fbSaveChannelMsg(ch, DB.channelMsgs[ch]);
  _incShare(id); closeShareSheet();
  toast('Partagé dans #'+ch+' 🏰');
}

function doAddPost(){
  const txt       = document.getElementById('postText').value.trim();
  const fileInput = document.getElementById('postImgInput');
  const file      = fileInput?.files[0];
  const nextPostId = () => {
    const maxExisting = DB.posts.reduce((max, post) => Math.max(max, Number(post?.id) || 0), 0);
    postId = Math.max(postId, maxExisting, Date.now());
    while(DB.posts.some(post => Number(post?.id) === postId)) postId += 1;
    return postId;
  };
  const isPublic = document.getElementById('postPublic') ? document.getElementById('postPublic').checked : true;
  const dl      = document.getElementById('postDownloadable') ? document.getElementById('postDownloadable').checked : true;
  const submit = (img)=>{
    const newPost = {id:nextPostId(), author:currentUser, text:txt||'', image:img||null, time:nowStr(), likes:[], comments:[], shares:0, public:isPublic, downloadable:dl};
    DB.posts.push(newPost);
    fbSavePost(newPost);
    closeModal('addPostModal');
    document.getElementById('postText').value='';
    if(fileInput) fileInput.value='';
    refreshFeed();
    toast('Publication ajoutée ! ✨');
  };
  if(file){ const r=new FileReader(); r.onload=e=>submit(e.target.result); r.readAsDataURL(file); }
  else if(txt) submit(null);
  else toast('Écris quelque chose !');
}

/* Poster depuis la page Profil */
function postFromProfile(){
  const txt  = document.getElementById('profComposerText')?.value.trim() || '';
  const file = document.getElementById('profComposerFile')?.files[0];
  const isPublic = document.getElementById('profComposerPublic')?.checked || false;
  const dl   = document.getElementById('profComposerDl')?.checked !== false;
  const nextPostId = () => {
    const maxExisting = DB.posts.reduce((max, post) => Math.max(max, Number(post?.id) || 0), 0);
    postId = Math.max(postId, maxExisting, Date.now());
    while(DB.posts.some(post => Number(post?.id) === postId)) postId += 1;
    return postId;
  };
  const submit = (img)=>{
    const newPost = {id:nextPostId(), author:currentUser, text:txt, image:img||null, time:nowStr(), likes:[], comments:[], shares:0, public:isPublic, downloadable:dl};
    DB.posts.push(newPost); fbSavePost(newPost);
    toast(isPublic?'Publié dans l\'accueil ✨':'Publié dans ton journal 🔒');
    renderProfile(currentUser);
  };
  if(!txt && !file){ toast('Écris ou ajoute un média !'); return; }
  if(file){ const r=new FileReader(); r.onload=e=>submit(e.target.result); r.readAsDataURL(file); }
  else submit(null);
}
window.postFromProfile = postFromProfile;

/* ═══════════════════════════════
   PROFIL
════════════════════════════════*/
function openProfile(user){ window._currentProfileUser = user; navTo('pgProfile'); renderProfile(user); }
function renderProfile(user){
  const u=DB.users[user]; if(!u) return;
  const isMe=user===currentUser, isAdmin=currentUser===ADMIN;
  const isFriend=DB.users[currentUser]?.friends?.includes(user);
  window._currentProfileUser = user;
  /* Profil ADMIN protégé : les autres utilisateurs ne peuvent pas voir son journal */
  if(user===ADMIN && !isMe){
    const av0 = u.avatarImg?`<img src="${u.avatarImg}" alt="">`:u.avatar;
    document.getElementById('profileBody').innerHTML = `
      <div class="profile-cover" style="background:linear-gradient(135deg,#1a0a0f,#2a1a2a)"></div>
      <div class="profile-info-row">
        <div class="profile-big-av">${av0}</div>
        <div class="profile-details">
          <div class="profile-name">${ADMIN} 👑</div>
          <div class="profile-bio">${u.bio||'Créateur d\'AnimesTomes'}</div>
          <div class="profile-rank-row"><span class="rank-badge">${u.rank||'Otaku Pro'}</span><span class="stars-display">${'⭐'.repeat(u.stars||0)}</span></div>
        </div>
      </div>
      <div style="padding:30px 20px;text-align:center;color:var(--muted)">
        <div style="font-size:48px;margin-bottom:12px">🔒</div>
        <div style="font-size:14px">Le journal de l'administrateur est privé.</div>
      </div>`;
    return;
  }
  const av=u.avatarImg?`<img src="${u.avatarImg}" alt="">`:u.avatar;
  const cover=u.coverImg?`<img src="${u.coverImg}" alt="">`:'';
  const stars='⭐'.repeat(u.stars||0)||'Aucune étoile';
  const userPosts=DB.posts.filter(p=>p.author===user);
  let actions='';
  if(!isMe){
    actions+=`<button class="prof-btn primary" onclick="openPrivChat('${user}')">💬 Message</button>`;
    if(!isFriend) actions+=`<button class="prof-btn" onclick="sendInv('${user}')">➕ Ajouter</button>`;
    actions+=`<button class="prof-btn danger" onclick="openReport('${user}')">⚑ Signaler</button>`;
  }
  if(isAdmin&&!isMe){
    actions+=`<button class="prof-btn warn" onclick="openWarnModal('${user}')">⚠️ Prévenir</button>`;
    actions+=`<button class="prof-btn gold" onclick="openGiveStarsModal('${user}')">⭐ Étoiles</button>`;
  }
  if(isMe) actions+=`<button class="prof-btn primary" onclick="navTo('pgMonCompte')">✏️ Modifier profil</button>`;
  const page=document.getElementById('pgProfile');
  document.getElementById('profileBody').innerHTML=`
    <div class="profile-cover" style="${u.coverImg?'':'background:linear-gradient(135deg,#1a0a0f,#2a1a2a)'}">${cover}
      ${isMe?`<button class="cover-edit-btn" onclick="document.getElementById('coverInp').click()">📷 Modifier</button><input type="file" id="coverInp" accept="image/*" style="display:none" onchange="changeCover(this)">`:''}
    </div>
    <div class="profile-info-row">
      <div class="profile-big-av" onclick="${isMe?`document.getElementById('avInp').click()`:''}">${av}</div>
      ${isMe?`<input type="file" id="avInp" accept="image/*" style="display:none" onchange="changeAvatar(this)">`:''}
      <div class="profile-details">
        <div class="profile-name">${user}${user===ADMIN?' 👑':''}</div>
        <div class="profile-bio">${u.bio||'Aucune bio'}</div>
        <div class="profile-stats-row">
          <div class="ps-stat"><div class="ps-num">${u.friends?.length||0}</div><div class="ps-lbl">Amis</div></div>
          <div class="ps-stat"><div class="ps-num">${userPosts.length}</div><div class="ps-lbl">Posts</div></div>
          <div class="ps-stat"><div class="ps-num">${u.groups||0}</div><div class="ps-lbl">Groupes</div></div>
        </div>
        <div class="profile-rank-row">
          <span class="rank-badge">${u.rank||'Rang E'}</span>
          <span class="stars-display">${stars}</span>
        </div>
      </div>
    </div>
    <div class="profile-actions">${actions}</div>
    <div class="profile-tabs">
      <button class="ptab active" onclick="switchPTab(this,'pPosts')">Publications</button>
      <button class="ptab" onclick="switchPTab(this,'pBadges')">Badges</button>
    </div>
    <div id="pPosts" style="padding:14px">
      ${isMe?`
        <div class="profile-composer">
          <div style="font-size:13px;color:var(--muted);margin-bottom:6px">📝 Publier dans mon journal</div>
          <textarea id="profComposerText" placeholder="Quoi de neuf, otaku ?"></textarea>
          <input type="file" id="profComposerFile" accept="image/*,video/*">
          <div class="post-options-row">
            <label><input type="checkbox" id="profComposerPublic"> 🌍 Public (afficher dans l'accueil)</label>
            <label><input type="checkbox" id="profComposerDl" checked> ⬇ Téléchargeable</label>
          </div>
          <button class="auth-btn" style="margin-top:10px" onclick="postFromProfile()">Publier</button>
        </div>`:''}
      ${(()=>{ const list = isMe ? userPosts : userPosts.filter(p=>p.public!==false); return list.length?list.slice().reverse().map(p=>buildPostHTML(p)+(p.public===false?'<div style="font-size:11px;color:var(--muted);margin:-12px 14px 14px;padding:4px 8px;background:var(--bg3);border-radius:6px;display:inline-block">🔒 Privé · visible seulement dans ton journal</div>':'')).join(''):'<div class="empty-state">Aucune publication.</div>'; })()}
    </div>
    <div id="pBadges" style="padding:14px;display:none">
      <div class="badges-grid">
        ${(u.badges||[]).map(b=>`<div class="badge-item ${b.color}"><span style="font-size:20px">${b.icon}</span><span>${b.name}</span></div>`).join('')||'<span style="color:var(--muted);font-size:12px">Aucun badge pour l\'instant.</span>'}
      </div>
    </div>`;
}
function switchPTab(btn,tab){
  document.querySelectorAll('.ptab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['pPosts','pBadges'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display=id===tab?'block':'none'; });
}
function changeAvatar(inp){
  if(!inp.files[0]) return;
  const r=new FileReader();
  r.onload=e=>{ DB.users[currentUser].avatarImg=e.target.result; fbSaveUser(currentUser); updateHeader(); toast('Avatar mis à jour !'); renderProfile(currentUser); };
  r.readAsDataURL(inp.files[0]);
}
function changeCover(inp){
  if(!inp.files[0]) return;
  const r=new FileReader();
  r.onload=e=>{ DB.users[currentUser].coverImg=e.target.result; fbSaveUser(currentUser); toast('Couverture mise à jour !'); renderProfile(currentUser); };
  r.readAsDataURL(inp.files[0]);
}

/* ═══════════════════════════════
   MON COMPTE
════════════════════════════════*/
function renderMonCompte(){
  if(!currentUser) return;
  const u=DB.users[currentUser];
  const av=u.avatarImg?`<img src="${u.avatarImg}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:u.avatar;
  document.getElementById('mcBody').innerHTML=`
    <div style="max-width:560px;margin:0 auto">
      <div class="account-card">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--bg3);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;font-size:30px;overflow:hidden;cursor:pointer" onclick="document.getElementById('avInpMC').click()">${av}</div>
          <input type="file" id="avInpMC" accept="image/*" style="display:none" onchange="changeAvatar(this)">
          <div><div style="font-size:16px;font-weight:600">${currentUser}${currentUser===ADMIN?' 👑':''}</div><div style="font-size:12px;color:var(--muted)">Clique sur l'avatar pour changer</div></div>
        </div>
        <div class="field"><label>Bio</label><textarea id="mc_bio" rows="2" placeholder="Parle de toi...">${u.bio||''}</textarea></div>
        <div class="field"><label>Email</label><input id="mc_email" type="email" value="${u.email||''}" placeholder="ton@email.com"></div>
        <div class="field"><label>Pays</label>
          <select id="mc_country">
            ${['BJ','SN','CI','FR','CM','ML','GH','NG','US','CA','MA','TN','DZ','RW','KE'].map(c=>`<option value="${c}"${u.country===c?' selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Téléphone</label><input id="mc_phone" type="tel" value="${u.phone||''}" placeholder="+229 ..."></div>
        <button class="auth-btn" onclick="saveProfil()">💾 Mettre à jour</button>
      </div>
      <div class="account-card">
        <h3>📊 Mon classement</h3>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
          <div class="stat-card"><div class="stat-val">${u.quizPoints||0}</div><div class="stat-lbl">Points Quiz</div></div>
          <div class="stat-card"><div class="stat-val" style="font-size:14px">${u.rank}</div><div class="stat-lbl">Rang</div></div>
          <div class="stat-card"><div class="stat-val">${u.stars||0}⭐</div><div class="stat-lbl">Étoiles</div></div>
        </div>
      </div>
      <div class="account-card">
        <h3>🏅 Mes badges</h3>
        <div class="badges-grid">
          ${(u.badges||[]).map(b=>`<div class="badge-item ${b.color}"><span style="font-size:20px">${b.icon}</span><span>${b.name}</span></div>`).join('')||'<span style="color:var(--muted);font-size:13px">Gagne des parties pour obtenir des badges !</span>'}
        </div>
      </div>
      ${currentUser===ADMIN?`<button class="auth-btn" style="background:var(--purple)" onclick="navTo('pgStats')">📊 Tableau de bord Admin</button>`:''}
    </div>`;
}
function saveProfil(){
  const u=DB.users[currentUser];
  u.bio=document.getElementById('mc_bio').value.trim();
  u.email=document.getElementById('mc_email').value.trim();
  u.country=document.getElementById('mc_country').value;
  u.phone=document.getElementById('mc_phone').value.trim();
  fbSaveUser(currentUser);
  updateHeader(); toast('✅ Profil mis à jour !');
}

/* ═══════════════════════════════
   AMIS
════════════════════════════════*/
function renderFriendsPage(){ renderFriendsInv(); renderFriendsList2(); renderAllUsers(); updateNotifBadge(); }
function renderAllUsers(){
  /* Liste tous les utilisateurs ; cache l'admin pour les non-admin */
  let host = document.getElementById('allUsersList');
  if(!host){
    const parent = document.getElementById('friendsList')?.parentElement;
    if(!parent) return;
    const lbl = document.createElement('div');
    lbl.className='section-label';
    lbl.textContent = currentUser===ADMIN?'Tous les utilisateurs':'Découvrir des otakus';
    host = document.createElement('div');
    host.id = 'allUsersList';
    parent.appendChild(lbl); parent.appendChild(host);
  }
  const me = DB.users[currentUser]||{};
  const friends = me.friends||[];
  const users = Object.keys(DB.users).filter(u=>{
    if(u===currentUser) return false;
    if(u===ADMIN && currentUser!==ADMIN) return false; /* admin invisible pour les autres */
    return true;
  });
  if(!users.length){ host.innerHTML = '<div class="empty-state" style="padding:14px">Aucun autre utilisateur pour l\'instant.</div>'; return; }
  host.innerHTML = users.map(u=>{
    const uu = DB.users[u];
    const av = uu?.avatarImg?`<img src="${uu.avatarImg}" alt="">`:uu?.avatar||'👤';
    const isFr = friends.includes(u);
    const sent = (me.invSent||[]).includes(u);
    let btn;
    if(isFr) btn = `<button class="icon-btn" onclick="openPrivChat('${u}')">💬</button>`;
    else if(sent) btn = `<button class="icon-btn" disabled style="opacity:.6">⏳</button>`;
    else btn = `<button class="icon-btn accept" onclick="sendInv('${u}')">+ Inviter</button>`;
    return `<div class="friend-row">
      <div class="fr-av" onclick="openProfile('${u}')">${av}</div>
      <div class="fr-info"><div class="fr-name">${u}</div><div class="fr-sub">${uu?.rank||'Rang E'} · ${uu?.stars||0}⭐${isFr?' · 🤝 ami':''}</div></div>
      <button class="icon-btn" onclick="openProfile('${u}')">👤</button>
      ${btn}
    </div>`;
  }).join('');
}
window.renderAllUsers = renderAllUsers;
function renderFriendsInv(){
  const me=DB.users[currentUser];
  const div=document.getElementById('invitationsReceived');
  const lbl=document.getElementById('invLabel');
  if(!me?.invReceived?.length){ if(lbl) lbl.textContent=''; if(div) div.innerHTML=''; return; }
  if(lbl) lbl.textContent='Invitations reçues ('+me.invReceived.length+')';
  if(div) div.innerHTML=me.invReceived.map(u=>{
    const uu=DB.users[u]; const av=uu?.avatarImg?`<img src="${uu.avatarImg}" alt="">`:uu?.avatar||'👤';
    return `<div class="friend-row">
      <div class="fr-av" onclick="openProfile('${u}')">${av}</div>
      <div class="fr-info"><div class="fr-name">${u}</div><div class="fr-sub">veut être ton ami</div></div>
      <button class="icon-btn accept" onclick="acceptInv('${u}')">✓ Accepter</button>
      <button class="icon-btn decline" onclick="declineInv('${u}')">✕</button>
    </div>`;
  }).join('');
}
function renderFriendsList2(){
  const me=DB.users[currentUser];
  const fl=document.getElementById('friendsList');
  if(!fl) return;
  if(!me?.friends?.length){ fl.innerHTML='<div class="empty-state"><div class="es-icon">🤝</div>Aucun ami. Cherche un pseudo ci-dessus.</div>'; return; }
  fl.innerHTML=me.friends.map(u=>{
    const uu=DB.users[u]; const av=uu?.avatarImg?`<img src="${uu.avatarImg}" alt="">`:uu?.avatar||'👤';
    return `<div class="friend-row">
      <div class="fr-av" onclick="openProfile('${u}')">${av}</div>
      <div class="fr-info"><div class="fr-name">${u}</div><div class="fr-sub">${uu?.rank||'Rang E'} · ${uu?.stars||0}⭐</div></div>
      <button class="icon-btn" onclick="openPrivChat('${u}')">💬</button>
      <button class="icon-btn" onclick="openProfile('${u}')">👤</button>
    </div>`;
  }).join('');
}
function searchUser(){
  const q=document.getElementById('friendSearch').value.trim().toLowerCase();
  const res=document.getElementById('searchResult');
  if(!q){ res.innerHTML=''; return; }
  const found=Object.keys(DB.users).find(u=>u.toLowerCase()===q);
  if(!found||found===currentUser){ res.innerHTML='<div class="empty-state">Aucun utilisateur trouvé.</div>'; return; }
  const me=DB.users[currentUser];
  if(me.friends?.includes(found)){ res.innerHTML='<div class="empty-state">Vous êtes déjà amis ! 🤝</div>'; return; }
  if(me.invSent?.includes(found)){ res.innerHTML='<div class="empty-state">Invitation déjà envoyée ⏳</div>'; return; }
  const uu=DB.users[found]; const av=uu?.avatarImg?`<img src="${uu.avatarImg}" alt="">`:uu?.avatar;
  res.innerHTML=`<div class="friend-row">
    <div class="fr-av" onclick="openProfile('${found}')">${av}</div>
    <div class="fr-info"><div class="fr-name">${found}</div><div class="fr-sub">Membre AnimesTomes</div></div>
    <button class="icon-btn accept" onclick="sendInv('${found}')">+ Inviter</button>
  </div>`;
}
function sendInv(to){
  const me=DB.users[currentUser], them=DB.users[to]; if(!me||!them) return;
  if(!me.invSent) me.invSent=[];
  if(!them.invReceived) them.invReceived=[];
  me.invSent.push(to); them.invReceived.push(currentUser);
  fbSaveUser(currentUser); fbSaveUser(to);
  addNotif(to,{icon:'👥',text:`${currentUser} t'a envoyé une invitation d'ami !`,link:{page:'pgFriends'}});
  updateNotifBadge();
  document.getElementById('friendSearch').value='';
  document.getElementById('searchResult').innerHTML='';
  toast('Invitation envoyée à '+to+' !');
}
function acceptInv(from){
  const me=DB.users[currentUser], them=DB.users[from]; if(!me||!them) return;
  me.invReceived=(me.invReceived||[]).filter(u=>u!==from);
  them.invSent=(them.invSent||[]).filter(u=>u!==currentUser);
  if(!me.friends) me.friends=[]; if(!them.friends) them.friends=[];
  me.friends.push(from); them.friends.push(currentUser);
  fbSaveUser(currentUser); fbSaveUser(from);
  addNotif(from,{icon:'🤝',text:`${currentUser} a accepté ton invitation ! Vous êtes maintenant amis.`,link:{page:'pgFriends'}});
  addNotif(currentUser,{icon:'🤝',text:`Vous êtes maintenant amis avec ${from} !`,link:{page:'pgFriends'}});
  toast('Vous êtes maintenant amis avec '+from+' ! 🤝');
  renderFriendsPage(); updateNotifBadge();
}
function declineInv(from){
  const me=DB.users[currentUser], them=DB.users[from];
  if(me) me.invReceived=(me.invReceived||[]).filter(u=>u!==from);
  if(them) them.invSent=(them.invSent||[]).filter(u=>u!==currentUser);
  fbSaveUser(currentUser); if(them) fbSaveUser(from);
  renderFriendsPage(); updateNotifBadge();
}

/* ═══════════════════════════════
   MESSAGERIE
════════════════════════════════*/
function resetMsgHub(){
  document.getElementById('msgHub').style.display='grid';
  ['privChat','clubChat'].forEach(id=>{ const e=document.getElementById(id); if(e) e.style.display='none'; });
}
function openPriv(){
  const me=DB.users[currentUser];
  if(!me?.friends?.length){ toast('Ajoute des amis d\'abord !'); return; }
  document.getElementById('msgHub').style.display='none';
  document.getElementById('privChat').style.display='flex';
  renderPrivSidebar();
}
function renderPrivSidebar(){
  const me=DB.users[currentUser];
  const sb=document.getElementById('privSidebar'); if(!sb) return;
  sb.innerHTML='<div class="cs-title">Amis</div>'+(me?.friends||[]).map(u=>{
    const uu=DB.users[u]; const av=uu?.avatarImg?`<img src="${uu.avatarImg}" style="width:28px;height:28px;border-radius:50%;object-fit:cover" alt="">`:uu?.avatar||'👤';
    return `<div class="cs-item${privFriend===u?' priv-active':''}" onclick="selectPrivFriend('${u}')">
      <div style="width:28px;height:28px;border-radius:50%;background:var(--bg3);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:14px">${av}</div>
      <span>${u}</span>
    </div>`;
  }).join('');
}
function selectPrivFriend(u){
  privFriend=u; renderPrivSidebar();
  const uu=DB.users[u];
  const av=uu?.avatarImg?`<img src="${uu.avatarImg}" style="width:36px;height:36px;border-radius:50%;object-fit:cover" alt="">`:uu?.avatar||'👤';
  document.getElementById('privCtIcon').innerHTML=av;
  document.getElementById('privTitle').textContent=u;
  document.getElementById('privSub').textContent='Message privé';
  renderPrivMsgs();
}
function openPrivChat(u){ navTo('pgMsg'); setTimeout(()=>{ openPriv(); setTimeout(()=>selectPrivFriend(u),50); },50); }
function convKey(a,b){ return [a,b].sort().join('__'); }
function renderPrivMsgs(){
  if(!privFriend) return;
  const key=convKey(currentUser,privFriend);
  const msgs=DB.privMessages[key]||[];
  const area=document.getElementById('privMsgs');
  if(!msgs.length){ area.innerHTML='<div class="empty-state">Commencez à chater !</div>'; return; }
  area.innerHTML=msgs.map(m=>{
    const isMe=m.user===currentUser; const uu=DB.users[m.user];
    const av=uu?.avatarImg?`<img src="${uu.avatarImg}" style="width:28px;height:28px;border-radius:50%;object-fit:cover" alt="">`:uu?.avatar||'👤';
    let content='';
    if(m.type==='image') content=`<img class="msg-media" src="${m.data}" alt="image">`;
    else if(m.type==='audio') content=`<audio src="${m.data}" controls style="max-width:200px"></audio>`;
    else if(m.type==='video') content=`<video class="msg-media" src="${m.data}" controls></video>`;
    else content=m.text||'';
    return `<div class="msg-bw${isMe?' me':''}">
      <div class="mb-av" onclick="openProfile('${m.user}')">${av}</div>
      <div class="msg-content">
        <div class="bubble">${content}</div>
        <div class="msg-time">${m.t}</div>
      </div>
    </div>`;
  }).join('');
  area.scrollTop=area.scrollHeight;
}
function sendPriv(){
  if(!privFriend) return;
  const inp=document.getElementById('privInput'); const txt=inp.value.trim(); if(!txt) return;
  const key=convKey(currentUser,privFriend);
  if(!DB.privMessages[key]) DB.privMessages[key]=[];
  DB.privMessages[key].push({id:++msgId,user:currentUser,text:txt,type:'text',t:nowStr()});
  fbSavePriv(key, DB.privMessages[key]);
  inp.value=''; renderPrivMsgs();
  addNotif(privFriend,{icon:'💬',text:`Nouveau message de ${currentUser}`,link:{openPriv:currentUser}});
}
function sendPrivMedia(inp){
  if(!privFriend||!inp.files[0]) return;
  const file=inp.files[0];
  const r=new FileReader();
  r.onload=e=>{
    const type=file.type.startsWith('video/')?'video':file.type.startsWith('audio/')?'audio':'image';
    const key=convKey(currentUser,privFriend);
    if(!DB.privMessages[key]) DB.privMessages[key]=[];
    DB.privMessages[key].push({id:++msgId,user:currentUser,data:e.target.result,type,t:nowStr()});
    fbSavePriv(key, DB.privMessages[key]);
    renderPrivMsgs();
    addNotif(privFriend,{icon:'💬',text:`${currentUser} t'a envoyé un ${type}`,link:{openPriv:currentUser}});
  };
  r.readAsDataURL(file);
  inp.value='';
}

/* CLUB */
function openClub(){
  const me=DB.users[currentUser];
  if(currentUser!==ADMIN&&!me?.clubAccess){
    if(DB.clubPending.includes(currentUser)){ toast('Ta demande est en attente de validation.'); return; }
    DB.clubPending.push(currentUser);
    fbSaveClub();
    addNotif(ADMIN,{icon:'🏯',text:`${currentUser} demande l'accès au Club Otaku.`});
    toast('Demande envoyée à l\'admin ! En attente de validation.');
    return;
  }
  document.getElementById('msgHub').style.display='none';
  document.getElementById('clubChat').style.display='flex';
  const ab=document.getElementById('adminBar'); if(ab) ab.style.display=currentUser===ADMIN?'flex':'none';
  const lb=document.getElementById('lockedBanner'); if(lb) lb.style.display=DB.clubLocked?'flex':'none';
  updatePendingCount();
  renderClubSidebar();
  renderClubMsgs();
}
function renderClubSidebar(){
  const sb=document.getElementById('clubSidebar'); if(!sb) return;
  const channels=Object.keys(DB.channelMsgs);
  let html='<div class="cs-title">Salons</div>';
  channels.forEach(c=>{
    html+=`<div class="cs-item${clubChannel===c?' active':''}" onclick="selectChannel('${c}')"><span style="font-weight:700;color:var(--muted)">#</span><span>${c}</span></div>`;
  });
  if(currentUser===ADMIN){
    html+=`<div class="cs-item" onclick="openModal('newChannelModal')" style="color:var(--blue2)"><span>+</span><span>Nouveau salon</span></div>`;
    html+='<div class="cs-title" style="margin-top:8px">Membres</div>';
    DB.clubMembers.forEach(m=>{
      html+=`<div class="cs-item" style="font-size:11px">
        <div style="width:8px;height:8px;border-radius:50%;background:var(--green)"></div>
        <span style="flex:1;cursor:pointer" onclick="openProfile('${m}')">${m}</span>
        ${m!==ADMIN?`<button class="adm-btn danger" style="padding:2px 6px;font-size:10px;margin-left:4px" onclick="kickClubMember('${m}')">✕</button>`:''}
      </div>`;
    });
    html+=`<div style="padding:8px 6px;border-top:1px solid var(--border);margin-top:6px;display:flex;flex-direction:column;gap:4px">
      <button class="adm-btn" style="font-size:11px" onclick="openPendingModal()">📋 Demandes <span id="pendingCount"></span></button>
      <button class="adm-btn" id="lockLabel" style="font-size:11px" onclick="toggleLock()">${DB.clubLocked?'Ouvrir le salon':'Fermer le salon'}</button>
    </div>`;
  }
  document.getElementById('clubMemberCount').textContent=DB.clubMembers.length+' membres · Club Otaku';
  sb.innerHTML=html;
}
function selectChannel(ch){
  clubChannel=ch;
  document.getElementById('clubChanName').textContent='#'+ch;
  document.getElementById('clubInput').placeholder='Message dans #'+ch+'...';
  renderClubSidebar(); renderClubMsgs();
}
function renderClubMsgs(){
  const area=document.getElementById('clubMsgs'); if(!area) return;
  const msgs=DB.channelMsgs[clubChannel]||[];
  if(!msgs.length){ area.innerHTML='<div class="empty-state">Aucun message dans ce salon.</div>'; return; }
  area.innerHTML=msgs.map(m=>{
    const isMe=m.user===currentUser; const isAdm=m.user===ADMIN; const uu=DB.users[m.user];
    const av=uu?.avatarImg?`<img src="${uu.avatarImg}" style="width:28px;height:28px;border-radius:50%;object-fit:cover" alt="">`:uu?.avatar||'👤';
    let content='';
    if(m.type==='image') content=`<img class="msg-media" src="${m.data}" alt="image">`;
    else if(m.type==='audio') content=`<audio src="${m.data}" controls style="max-width:200px"></audio>`;
    else if(m.type==='video') content=`<video class="msg-media" src="${m.data}" controls></video>`;
    else content=m.text||'';
    const delBtn=(currentUser===ADMIN&&!isMe)?`<button class="del-msg-btn" onclick="delClubMsg(${m.id})">✕</button>`:'';
    return `<div class="msg-bw${isMe?' me':''}">
      <div class="mb-av" onclick="openProfile('${m.user}')">${av}</div>
      <div class="msg-content">
        <div class="msg-sender${isAdm?' adm':''}" style="color:${isAdm?'var(--purple)':'var(--muted)'}">${m.user}${isAdm?' 👑':''}</div>
        <div class="bubble">${content}${delBtn}</div>
        <div class="msg-time">${m.t}</div>
      </div>
    </div>`;
  }).join('');
  area.scrollTop=area.scrollHeight;
}
function sendClub(){
  if(DB.clubLocked&&currentUser!==ADMIN){ toast('🔒 Salon temporairement fermé.'); return; }
  const inp=document.getElementById('clubInput'); const txt=inp.value.trim(); if(!txt) return;
  if(!DB.channelMsgs[clubChannel]) DB.channelMsgs[clubChannel]=[];
  DB.channelMsgs[clubChannel].push({id:++msgId,user:currentUser,text:txt,type:'text',t:nowStr()});
  fbSaveChannelMsg(clubChannel, DB.channelMsgs[clubChannel]);
  inp.value=''; renderClubMsgs();
}
function sendClubMedia(inp){
  if(!inp.files[0]) return;
  const file=inp.files[0];
  const r=new FileReader();
  r.onload=e=>{
    const type=file.type.startsWith('video/')?'video':file.type.startsWith('audio/')?'audio':'image';
    if(!DB.channelMsgs[clubChannel]) DB.channelMsgs[clubChannel]=[];
    DB.channelMsgs[clubChannel].push({id:++msgId,user:currentUser,data:e.target.result,type,t:nowStr()});
    fbSaveChannelMsg(clubChannel, DB.channelMsgs[clubChannel]);
    renderClubMsgs();
  };
  r.readAsDataURL(file);
  inp.value='';
}
function delClubMsg(id){
  DB.channelMsgs[clubChannel]=DB.channelMsgs[clubChannel].filter(m=>m.id!==id);
  fbSaveChannelMsg(clubChannel, DB.channelMsgs[clubChannel]);
  renderClubMsgs(); toast('Message supprimé.');
}
function toggleLock(){
  DB.clubLocked=!DB.clubLocked;
  const lbl=document.getElementById('lockLabel'); if(lbl) lbl.textContent=DB.clubLocked?'Ouvrir le salon':'Fermer le salon';
  const lb=document.getElementById('lockedBanner'); if(lb) lb.style.display=DB.clubLocked?'flex':'none';
  const msg=DB.clubLocked?'🔒 Salon fermé temporairement.':'🔓 Salon rouvert !';
  if(!DB.channelMsgs[clubChannel]) DB.channelMsgs[clubChannel]=[];
  DB.channelMsgs[clubChannel].push({id:++msgId,user:ADMIN,text:msg,type:'text',t:nowStr()});
  fbSaveChannelMsg(clubChannel, DB.channelMsgs[clubChannel]);
  fbSaveClub();
  renderClubMsgs(); toast(msg);
}
function updatePendingCount(){
  const el=document.getElementById('pendingCount'); if(el) el.textContent=DB.clubPending.length?'('+DB.clubPending.length+')':'';
}
function openPendingModal(){
  const list=document.getElementById('pendingList');
  if(!DB.clubPending.length){ list.innerHTML='<div class="empty-state">Aucune demande en attente.</div>'; }
  else list.innerHTML=DB.clubPending.map(u=>{
    const uu=DB.users[u]; const av=uu?.avatar||'👤';
    return `<div class="friend-row" style="margin-bottom:8px">
      <div class="fr-av">${av}</div>
      <div class="fr-info"><div class="fr-name">${u}</div><div class="fr-sub">Demande d'accès</div></div>
      <button class="icon-btn accept" onclick="approveClub('${u}')">✓</button>
      <button class="icon-btn decline" onclick="rejectClub('${u}')">✕</button>
    </div>`;
  }).join('');
  openModal('pendingModal');
}
function approveClub(u){
  DB.clubPending=DB.clubPending.filter(x=>x!==u);
  if(DB.users[u]){ DB.users[u].clubAccess=true; DB.users[u].clubMember=true; fbSaveUser(u); }
  if(!DB.clubMembers.includes(u)) DB.clubMembers.push(u);
  fbSaveClub();
  addNotif(u,{icon:'🏯',text:'L\'admin t\'a accordé l\'accès au Club Otaku ! Bienvenue !'});
  updatePendingCount(); openPendingModal(); toast(u+' a accès au Club !');
}
function rejectClub(u){
  DB.clubPending=DB.clubPending.filter(x=>x!==u);
  fbSaveClub();
  addNotif(u,{icon:'🏯',text:'Ta demande d\'accès au Club n\'a pas été acceptée.'});
  updatePendingCount(); openPendingModal(); toast('Demande refusée.');
}
function kickClubMember(u){
  DB.clubMembers=DB.clubMembers.filter(x=>x!==u);
  if(DB.users[u]){ DB.users[u].clubAccess=false; DB.users[u].clubMember=false; fbSaveUser(u); }
  fbSaveClub();
  addNotif(u,{icon:'🏯',text:'Tu as été retiré du Club Otaku par l\'admin.'});
  if(!DB.channelMsgs[clubChannel]) DB.channelMsgs[clubChannel]=[];
  DB.channelMsgs[clubChannel].push({id:++msgId,user:ADMIN,text:`⚙️ ${u} a été retiré du Club.`,type:'text',t:nowStr()});
  fbSaveChannelMsg(clubChannel, DB.channelMsgs[clubChannel]);
  renderClubSidebar(); renderClubMsgs(); toast(u+' retiré du Club.');
}
function doCreateChannel(){
  const name=document.getElementById('newChanName').value.trim().toLowerCase().replace(/\s+/g,'-');
  if(!name){ toast('Nom invalide.'); return; }
  if(DB.channelMsgs[name]){ toast('Ce salon existe déjà.'); return; }
  DB.channelMsgs[name]=[{id:++msgId,user:ADMIN,text:`Salon #${name} créé !`,type:'text',t:nowStr()}];
  fbSaveChannelMsg(name, DB.channelMsgs[name]);
  closeModal('newChannelModal'); selectChannel(name); toast('Salon #'+name+' créé !');
}

/* ═══════════════════════════════
   ADMIN ACTIONS
════════════════════════════════*/
function openReport(reported){
  document.getElementById('reportTarget').value=reported;
  document.getElementById('reportTargetName').textContent=reported;
  openModal('reportModal');
}
function doReport(){
  const reported=document.getElementById('reportTarget').value;
  const reason=document.getElementById('reportReason').value;
  const details=document.getElementById('reportDetails').value.trim();
  const report={by:currentUser,against:reported,reason,details,time:nowStr()};
  DB.reports.push(report);
  fbPushReport(report);
  fbIncrStat('signalements');
  addNotif(ADMIN,{icon:'⚑',text:`Signalement : ${currentUser} signale ${reported} pour "${reason}". ${details}`});
  closeModal('reportModal');
  document.getElementById('reportDetails').value='';
  toast('Signalement envoyé à l\'admin.');
}
function openWarnModal(user){
  document.getElementById('warnTarget').value=user;
  document.getElementById('warnTargetName').textContent=user;
  openModal('warnModal');
}
function doWarn(){
  const user=document.getElementById('warnTarget').value;
  const msg=document.getElementById('warnMsg').value.trim(); if(!msg) return;
  addNotif(user,{icon:'⚠️',text:`Prévention de l'admin : ${msg}`});
  fbIncrStat('preventions');
  closeModal('warnModal'); document.getElementById('warnMsg').value='';
  toast('Prévention envoyée à '+user+' !');
}
function openGiveStarsModal(user){
  document.getElementById('starsTarget').value=user;
  document.getElementById('starsTargetName').textContent=user;
  openModal('giveStarsModal');
}
function doGiveStars(){
  const user=document.getElementById('starsTarget').value;
  const n=parseInt(document.getElementById('starsCount').value)||1;
  if(DB.users[user]){
    DB.users[user].stars=Math.min((DB.users[user].stars||0)+n,10);
    fbSaveUser(user);
    fbIncrStat('starsGiven');
    addNotif(user,{icon:'⭐',text:`L'admin t'a donné ${n} étoile(s) ! Tu as maintenant ${DB.users[user].stars}⭐`,link:{page:'pgProfile',user:user,tab:'stars'}});
  }
  closeModal('giveStarsModal'); toast(`${n} étoile(s) données à ${user} !`);
}
function inviteToGame(gameId){
  const me=DB.users[currentUser];
  const sel=document.getElementById('gameInvFriend');
  if(sel) sel.innerHTML=(me?.friends||[]).map(f=>`<option value="${f}">${f}</option>`).join('')||'<option>Aucun ami</option>';
  document.getElementById('gameInvId').value=gameId;
  openModal('gameInvModal');
}
function doGameInvite(){
  const gameId=document.getElementById('gameInvId').value;
  const friend=document.getElementById('gameInvFriend').value;
  if(!friend||!DB.users[friend]) return;
  const game=GAMES.find(g=>g.id===gameId);
  addNotif(friend,{icon:'🎮',text:`${currentUser} t'invite à jouer à ${game?.title||gameId} ! Va dans Jeux.`,link:{page:'pgJeux'}});
  closeModal('gameInvModal'); toast('Invitation envoyée à '+friend+' !');
}

/* ═══════════════════════════════
   GALERIE
════════════════════════════════*/
const GALLERY_IMGS = [
  { id:1,  title:'Forêt de Konoha',     cat:'naruto',        emoji:'🍃', src:'th-1.png',     desc:'Paysage style ninja' },
  { id:2,  title:'Flammes du Destin',   cat:'demon slayer',  emoji:'🔥', src:'https://cdn.pixabay.com/photo/2023/01/05/08/22/ai-generated-7698856_640.jpg',  desc:'Atmosphère Kimetsu' },
  { id:3,  title:'Grand Line',          cat:'one piece',     emoji:'🌅', src:'https://cdn.pixabay.com/photo/2016/11/29/09/16/ocean-1868483_640.jpg',        desc:'Horizon marin' },
  { id:4,  title:'Au-delà des Murs',    cat:'aot',           emoji:'🧱', src:'https://cdn.pixabay.com/photo/2016/11/22/21/57/landscape-1850477_640.jpg',    desc:'Paysage AOT' },
  { id:5,  title:'Ki Céleste',          cat:'dragon ball',   emoji:'🐉', src:'https://cdn.pixabay.com/photo/2023/02/16/21/17/ai-generated-7793864_640.png',  desc:'Énergie cosmique' },
  { id:6,  title:'Nuit de Tokyo',       cat:'naruto',        emoji:'🌃', src:'https://cdn.pixabay.com/photo/2021/11/10/17/28/road-6783951_640.jpg',         desc:'Ambiance urbaine' },
  { id:7,  title:'Montagne Sacrée',     cat:'naruto',        emoji:'⛰️', src:'https://cdn.pixabay.com/photo/2016/05/05/02/37/sunset-1373171_640.jpg',       desc:'Paysage épique' },
  { id:8,  title:'Océan Infini',        cat:'one piece',     emoji:'🌊', src:'https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_640.jpg',    desc:'Galaxie One Piece' },
  { id:9,  title:'Respiration Solaire', cat:'demon slayer',  emoji:'☀️', src:'https://cdn.pixabay.com/photo/2023/03/14/15/34/ai-generated-7851524_640.jpg',  desc:'Lumière solaire' },
  { id:10, title:'Super Saiyan',        cat:'dragon ball',   emoji:'💥', src:'https://cdn.pixabay.com/photo/2022/12/29/07/35/ai-generated-7684265_640.jpg',  desc:'Explosion énergie' },
  { id:11, title:'Sakura no Yoru',      cat:'naruto',        emoji:'🌸', src:'https://cdn.pixabay.com/photo/2017/03/25/17/55/cherry-blossom-2173524_640.jpg', desc:'Cerisiers fleur' },
  { id:12, title:'Combat de Titans',    cat:'aot',           emoji:'⚡', src:'https://cdn.pixabay.com/photo/2016/10/20/18/35/earth-1756274_640.jpg',         desc:'Paysage bataille' },
];

let galFilter='all', galSearch='';
function filtG(cat,btn){
  galFilter=cat; galSearch='';
  if(document.getElementById('galSearchInput')) document.getElementById('galSearchInput').value='';
  document.querySelectorAll('.f-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderGallery(GALLERY_IMGS);
}
function filterGalSearch(q){ galSearch=q.toLowerCase(); renderGallery(GALLERY_IMGS); }
function renderGallery(imgs){
  let filtered=imgs;
  if(galFilter!=='all') filtered=filtered.filter(i=>i.cat===galFilter);
  if(galSearch) filtered=filtered.filter(i=>i.title.toLowerCase().includes(galSearch)||i.cat.toLowerCase().includes(galSearch));
  const grid=document.getElementById('galGrid'); if(!grid) return;
  if(!filtered.length){ grid.innerHTML='<div class="empty-state">Aucune image pour ce filtre.</div>'; return; }
  grid.innerHTML=filtered.map(img=>`
    <div class="gal-item">
      <div class="gal-img-wrap">
        <img class="gal-img" src="${img.src}" alt="${img.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="gal-ph" style="display:none">${img.emoji}</div>
      </div>
      <div class="gal-info"><h4>${img.title}</h4><p>${img.emoji} ${img.cat}</p></div>
      <div class="gal-actions">
        <button class="ga-btn" onclick="likeGal(${img.id},this)">❤️ Like</button>
        <button class="ga-btn" onclick="dlImg('${img.src}','${img.title}')">⬇ DL</button>
        <button class="ga-btn" onclick="shareGal('${img.title}')">🔗 Share</button>
      </div>
    </div>`).join('');
}
function likeGal(id,btn){ btn.textContent='❤️ +1'; btn.style.color='var(--accent2)'; toast('Image likée !'); }
function shareGal(title){ toast('Lien copié pour : '+title); }
function previewImg(id){
  const img=GALLERY_IMGS.find(i=>i.id===id); if(!img) return;
  document.getElementById('previewImgEl').src=img.src;
  document.getElementById('previewImgTitle').textContent=img.title;
  document.getElementById('previewImgDesc').textContent=img.desc;
  document.getElementById('previewDlBtn').onclick=()=>dlImg(img.src,img.title);
  openModal('imgPreviewModal');
}
function dlImg(src,title){
  const a=document.createElement('a'); a.href=src; a.download=title.replace(/\s+/g,'_')+'.jpg'; a.target='_blank'; a.click();
  toast('⬇ Téléchargement lancé !');
}

/* ═══════════════════════════════
   QUIZ
════════════════════════════════*/
const QUIZ_QUESTIONS = {
  easy: [
    {q:"Dans Naruto, quel est le nom du démon renard à neuf queues ?",opts:["Shukaku","Kurama","Gyūki","Matatabi"],a:1},
    {q:"Dans One Piece, quel fruit du démon Luffy a-t-il mangé ?",opts:["Gomu Gomu no Mi","Mera Mera no Mi","Hie Hie no Mi","Gura Gura no Mi"],a:0},
    {q:"Dans Dragon Ball Z, sur quelle planète Goku devient Super Saiyan ?",opts:["Namek","Terre","Végéta","Cell"],a:0},
    {q:"Dans Demon Slayer, quelle est la respiration de base de Tanjiro ?",opts:["Respiration de l'eau","Respiration du feu","Respiration du tonnerre","Respiration du vent"],a:0},
    {q:"Quel est le studio qui a produit 'FMA Brotherhood' ?",opts:["Madhouse","Bones","Mappa","Trigger"],a:1},
    {q:"Dans Naruto, quel est le village natal de Naruto ?",opts:["Village de la Pluie","Village du Sable","Village de Konoha","Village de Kumo"],a:2},
    {q:"Dans One Piece, comment s'appelle l'équipage de Luffy ?",opts:["Équipage du Phoenix","Équipage de Barbe Blanche","Équipage de Chapeau de Paille","Équipage des Géants"],a:2},
    {q:"Dans Dragon Ball, qui est le rival de Goku ?",opts:["Freezer","Cell","Vegeta","Boo"],a:2},
    {q:"Dans My Hero Academia, quel est le vrai prénom de Deku ?",opts:["Katsuki","Izuku","Shoto","Tenya"],a:1},
    {q:"Dans Demon Slayer, quel est le nom de la sœur de Tanjiro ?",opts:["Aoi","Kanao","Nezuko","Shinobu"],a:2},
    {q:"Dans Attack on Titan, quel est le prénom de l'ami d'Eren ?",opts:["Reiner","Armin","Jean","Connie"],a:1},
    {q:"Dans Naruto, qui est le maître de Naruto ?",opts:["Iruka","Kakashi","Jiraiya","Tsunade"],a:1},
    {q:"Dans One Piece, quel est le fruit de Ace ?",opts:["Mera Mera no Mi","Gomu Gomu","Hie Hie","Yami Yami"],a:0},
    {q:"Dans Dragon Ball Z, quel est le niveau maximum de Freezer ?",opts:["Forme 2","Forme 3","Forme 4","Forme 5"],a:2},
    {q:"Dans Bleach, quel est le nom du zanpakuto d'Ichigo ?",opts:["Zangetsu","Senbonzakura","Zabimaru","Sode no Shirayuki"],a:0},
    {q:"Dans Fairy Tail, qui est le dragon de Natsu ?",opts:["Weisslogia","Grandeeney","Igneel","Metalicana"],a:2},
    {q:"Dans Tokyo Ghoul, quel est le type de kagune de Kaneki ?",opts:["Ukaku","Bikaku","Koukaku","Rinkaku"],a:3},
    {q:"Dans MHA, quel est le quirk d'Ochaco Uraraka ?",opts:["Zéro gravité","Ciment","Moteur","Création"],a:0},
    {q:"Dans SAO, comment s'appelle le protagoniste dans la vraie vie ?",opts:["Asuna","Kirigaya Kazuto","Ryoutarou","Klein"],a:1},
    {q:"Dans Hunter x Hunter, quel est l'ami de Gon ?",opts:["Kurapika","Leorio","Killua","Hisoka"],a:2},
    {q:"Dans Naruto, quel est le clan de Sasuke ?",opts:["Uzumaki","Hyuga","Uchiha","Nara"],a:2},
    {q:"Dans One Piece, quel est le rang de Shanks ?",opts:["Capitaine","Amiral","Yonko","Shichibukai"],a:2},
    {q:"Dans AOT, qui est le porteur du Titan Colossal ?",opts:["Reiner","Bertholdt","Zeke","Armin"],a:1},
    {q:"Dans Dragon Ball Z, comment s'appelle le fils de Goku ?",opts:["Vegeta","Trunks","Gohan","Piccolo"],a:2},
    {q:"Dans FMA Brotherhood, qui est l'alchimiste de la flamme ?",opts:["Alphonse","Edward","Roy Mustang","Riza"],a:2},
    {q:"Dans Naruto, qui a fondé Konoha ?",opts:["Madara et Hashirama","Minato et Kushina","Sarutobi","Tobirama"],a:0},
    {q:"Dans One Piece, quel est le nom du médecin de l'équipage ?",opts:["Usopp","Brook","Chopper","Franky"],a:2},
    {q:"Dans MHA, quel est le quirk de Todoroki ?",opts:["Explosion","Half-Cold Half-Hot","Zéro gravité","Cran"],a:1},
    {q:"Dans Hunter x Hunter, quel type de Nen utilise Killua ?",opts:["Renforcement","Transformation","Émission","Manipulation"],a:0},
    {q:"Dans Naruto, qui est le père de Naruto ?",opts:["Jiraiya","Hiruzen","Minato Namikaze","Itachi"],a:2},
  ],
  normal: [
    {q:"Dans AOT, quel est le vrai nom du Titan Colossal (dès le début) ?",opts:["Reiner Braun","Bertholdt Hoover","Zeke Yeager","Porco Galliard"],a:1},
    {q:"Dans Naruto, quel est l'œil légendaire d'Itachi ?",opts:["Byakugan","Rinnegan","Mangekyō Sharingan","Tenseigan"],a:2},
    {q:"Dans Demon Slayer, quel démon est le plus puissant après Muzan ?",opts:["Doma","Akaza","Kokushibo","Gyutaro"],a:2},
    {q:"Dans FMA, quel péché capital est Lust ?",opts:["Envie","Luxure","Colère","Paresse"],a:1},
    {q:"Dans Tokyo Ghoul, quel est le nom de l'organisation anti-ghoul ?",opts:["Squad Zero","CCG","Aogiri","V"],a:1},
    {q:"Dans MHA, quel est le nom du méchant principal ?",opts:["Dabi","Tomura Shigaraki","Overhaul","Spinner"],a:1},
    {q:"Dans Hunter x Hunter, quel est le type de Nen de Gon ?",opts:["Émission","Renforcement","Matérialisation","Spécialisation"],a:1},
    {q:"Dans Naruto, quelle est la jutsu signature de Naruto ?",opts:["Rasengan","Chidori","Kage Bunshin","Rasengan Géant"],a:0},
    {q:"Dans Bleach, comment s'appelle l'ennemi principal de la saison 2 ?",opts:["Aizen","Yhwach","Grand Fisher","Menos Grande"],a:0},
    {q:"Dans Code Geass, quel est le surnom de Lelouch ?",opts:["C.C.","Suzaku","Zéro","Rolo"],a:2},
    {q:"Dans Death Note, quel est le vrai nom de L ?",opts:["Near","Beyond Birthday","Lawliet","Mello"],a:2},
    {q:"Dans Evangelion, comment s'appelle le père de Shinji ?",opts:["Gendo Ikari","Ryoji Kaji","Kozo Fuyutsuki","Makoto"],a:0},
    {q:"Dans Psycho-Pass, quel est le nom du système de surveillance ?",opts:["Sibyl System","Dominator","Enforcer","Inspector"],a:0},
    {q:"Dans Steins;Gate, quel est le prénom du protagoniste ?",opts:["Kurisu","Itaru","Rintarō","Mayuri"],a:2},
    {q:"Dans Naruto, quelle technique Minato a-t-il inventée ?",opts:["Chidori","Rasengan","Kage Bunshin","Rasenshuriken"],a:1},
    {q:"Dans One Piece, quel est le nom de l'épée de Zoro ?",opts:["Wado Ichimonji","Kuina","Yubashiri","Sandai Kitetsu"],a:0},
    {q:"Dans HxH, quel est le nom du père de Gon ?",opts:["Leorio","Ging Freecss","Killua","Netero"],a:1},
    {q:"Dans FMA, quel métal est utilisé pour les prothèses d'Edward ?",opts:["Acier","Automail","Platine","Adamantium"],a:1},
    {q:"Dans Code Geass, quel est le pouvoir de Lelouch ?",opts:["Code","Geass","Refrain","Absolute Order"],a:1},
    {q:"Dans Death Note, combien de règles contient le Death Note ?",opts:["10","66","13","108"],a:1},
    {q:"Dans Bleach, comment s'appelle le monde des âmes ?",opts:["Hueco Mundo","Soul Society","Dangai","Rukongai"],a:1},
    {q:"Dans Evangelion, quel est le modèle de l'Eva de Shinji ?",opts:["EVA-00","EVA-01","EVA-02","EVA-03"],a:1},
    {q:"Dans Steins;Gate, quel est l'identifiant du worldline de départ ?",opts:["0.337187","1.048596","0.571024","1.382733"],a:0},
    {q:"Dans HxH, quel est le vrai nom de l'ennemi de l'arc Chimera Ant ?",opts:["Meruem","Neferpitou","Shaiapouf","Royal Guard"],a:0},
    {q:"Dans Naruto, combien de portes du Chakra existent dans la technique des 8 Portes ?",opts:["6","7","8","9"],a:2},
    {q:"Dans Demon Slayer, quel est le vrai nom du premier Pourfendeur ?",opts:["Yoriichi Tsugikuni","Kokushibo","Michikatsu","Sumiyoshi"],a:0},
    {q:"Dans Bleach, quel est le numéro d'Espada de Ulquiorra ?",opts:["3","4","5","6"],a:1},
    {q:"Dans FMA, quel est l'alchimiste qui a créé les Homuncules initialement ?",opts:["Ed","Van Hohenheim","Le Père","Dante"],a:2},
    {q:"Dans Death Note, en quelle année se passe l'histoire ?",opts:["2003","2004","2006","2009"],a:2},
    {q:"Dans Code Geass, qui pilote le Lancelot ?",opts:["Lelouch","Suzaku","Gino","Anya"],a:1},
    {q:"Dans Demon Slayer, combien de Piliers (Hashira) existe-t-il ?",opts:["8","9","10","12"],a:1},
    {q:"Dans One Piece, quel est le nom du constructeur de navires de l'équipage ?",opts:["Usopp","Nami","Franky","Robin"],a:2},
    {q:"Dans Naruto, quel est l'élément naturel de Kakashi ?",opts:["Feu","Eau","Foudre","Vent"],a:2},
    {q:"Dans Evangelion, quel est le nom de l'opératrice des communications ?",opts:["Maya Ibuki","Ritsuko Akagi","Misato Katsuragi","Yui Ikari"],a:0},
    {q:"Dans AOT, quel est le nom du détachement de reconnaissance ?",opts:["Bataillon de Garnison","Corps des Titans","Corps d'Exploration","Police Royale"],a:2},
    {q:"Dans Death Note, quel est le métier du père de Light ?",opts:["Médecin","Policier/Enquêteur","Professeur","Avocat"],a:1},
    {q:"Dans Code Geass, quel est le numéro du district où vit Lelouch ?",opts:["1","7","11","4"],a:1},
    {q:"Dans FMA, quel est le surnom d'Edward Elric ?",opts:["Fullmetal Alchemist","Alchemiste de la Flamme","Renard d'argent","Petit"],a:0},
    {q:"Dans Naruto, combien de formes a le mode chakra de Kyubi ?",opts:["2","3","4","5"],a:1},
    {q:"Dans One Piece, quel est le nom de la technique de Sanji du Feu ?",opts:["Diable Jambe","Partie Frites","Hell Memories","Ifrit Jambe"],a:0},
    {q:"Dans Evangelion, quel est l'ange qui ressemble à un humain ?",opts:["Ange 16","Ange 17 Kaworu","Ange 15","Ange 13"],a:1},
    {q:"Dans Demon Slayer, qui a créé la respiration de la Lune ?",opts:["Muzan","Yoriichi","Kokushibo (Michikatsu)","Doma"],a:2},
    {q:"Dans Bleach, quel est le nom de l'arc final contre les Quincy ?",opts:["Arrancar","Turn Back the Pendulum","Thousand Year Blood War","Substitute Shinigami"],a:2},
    {q:"Dans Death Note, quel est le prénom de la petite amie de Light ?",opts:["Misa","Naomi","Sayu","Takada"],a:0},
    {q:"Dans Code Geass, quel est le titre de Lelouch à la fin ?",opts:["Roi","Empereur","Zéro","Prince"],a:1},
  ],
  hard: [
    {q:"Dans One Piece, quel est le chapitre où Roger rit sur le One Piece ?",opts:["Chapitre 0","Chapitre 967","Chapitre 1000","Chapitre 52"],a:1},
    {q:"Dans AOT, combien de Titans primordiaux existent-ils ?",opts:["7","8","9","10"],a:2},
    {q:"Dans Evangelion, quel est le vrai premier ange sur Terre ?",opts:["Adam","Lilith","Sachiel","Kaworu"],a:0},
    {q:"Dans HxH, quel est le chapitre du premier retour de Meruem après le coup ?",opts:["Chapitre 292","Chapitre 300","Chapitre 310","Chapitre 318"],a:0},
    {q:"Dans Demon Slayer, quel est le chapitre final du manga ?",opts:["Chapitre 200","Chapitre 205","Chapitre 204","Chapitre 210"],a:1},
    {q:"Dans FMA Brotherhood, combien d'épisodes y a-t-il ?",opts:["51","64","63","52"],a:1},
    {q:"Dans Bleach, comment s'appelle l'arme de Soul King ?",opts:["Royal Key","Soul Key","Royal Palace Pass","Blank Sword"],a:0},
    {q:"Dans Steins;Gate, à quelle divergence Okabe atteint-il la fin vraie ?",opts:["1.048596","0.337187","0.571024","1.382733"],a:0},
    {q:"Dans Naruto, quel est le nombre de sceaux dans la technique de Kushina ?",opts:["4","5","8","9"],a:2},
    {q:"Dans HxH, quel est le coefficient de talent de Killua donné par Bisky ?",opts:["1 sur 10 millions","1 sur 100 millions","Incommensurable","1 sur milliard"],a:0},
    {q:"Dans Evangelion, quel est le thème musical iconique de l'anime ?",opts:["A Cruel Angel's Thesis","Fly Me to the Moon","Beautiful World","Komm süsser Tod"],a:0},
    {q:"Dans AOT, quel est l'épisode de la révélation du Titan Colossal ?",opts:["Episode 25","Episode 30","Episode 37","Episode 55"],a:2},
    {q:"Dans Demon Slayer, quel est le nom de l'auteure du manga ?",opts:["Rumiko Takahashi","Koyoharu Gotouge","Tite Kubo","Akira Toriyama"],a:1},
    {q:"Dans FMA, dans quel pays fictif se passe l'histoire ?",opts:["Amestris","Xing","Xerxes","Creta"],a:0},
    {q:"Dans Death Note, quel est le QI de Light Yagami selon L ?",opts:["160","170","180","190"],a:0},
    {q:"Dans Steins;Gate, combien de worldlines sont visitées dans la série principale ?",opts:["5","7","9","Plus de 10"],a:3},
    {q:"Dans Naruto, quel est le seul Kage à avoir survécu à la 4e Guerre ?",opts:["Gaara","Tsunade","A (Raikage)","Oonoki"],a:0},
    {q:"Dans One Piece, quel est le surnom de Mihawk ?",opts:["Faucon des Mers","Yeux de Faucon","Grand Corsaire","Dracule"],a:1},
    {q:"Dans HxH, quel est le vrai nom de Hisoka ?",opts:["Hisoka Morow","Hisoka Gittarackur","Hisoka Baum","Hisoka Illumi"],a:0},
    {q:"Dans Evangelion, quel est le grade militaire de Misato ?",opts:["Lieutenant","Capitaine","Major","Colonel"],a:2},
    {q:"Dans AOT, combien d'années après la chute de Shiganshina commence la saison 4 ?",opts:["3 ans","4 ans","5 ans","6 ans"],a:1},
    {q:"Dans FMA Brotherhood, quel épisode est considéré comme le plus émouvant selon les fans ?",opts:["Épisode 19 (Nina)","Épisode 10","Épisode 33","Épisode 47"],a:0},
    {q:"Dans Bleach, quelle est la signification de Bankai ?",opts:["Grand Déploiement Final","Épée de l'âme","Finale Ultime","Manifestation de l'Âme"],a:0},
    {q:"Dans Death Note, sur quelle chaîne japonaise l'anime a-t-il été diffusé ?",opts:["NHK","MBS/NTV","Fuji TV","TV Tokyo"],a:1},
    {q:"Dans Code Geass, quel est le nom de la zone géographique du Japon occupé ?",opts:["Area 10","Area 11","Britannian Zone 11","Occupied Japan"],a:1},
    {q:"Dans Naruto, quel est le volume du manga où apparaît Tobi pour la première fois ?",opts:["Volume 30","Volume 33","Volume 38","Volume 41"],a:2},
    {q:"Dans One Piece, quel est le nombre de membres de l'Alliance des pirates de Luffy à Dressrosa ?",opts:["4000","5600","6000","7500"],a:2},
    {q:"Dans HxH, quelle est la date d'anniversaire de Gon ?",opts:["5 mai","7 juin","3 mars","1er janvier"],a:0},
    {q:"Dans Demon Slayer, combien de Lunes Supérieures compte Muzan ?",opts:["3","5","6","7"],a:2},
    {q:"Dans Bleach, comment s'appelle le monde des Arrancar ?",opts:["Soul Society","Hueco Mundo","Dangai","Garganta"],a:1},
  ]
};

const QUIZ_RANKS = {
  easy:   [['E','Facile — Rang E',10],['D','Facile — Rang D',10],['C','Facile — Rang C',10]],
  normal: [['B','Normal — Rang B',15],['A','Normal — Rang A',15],['S','Normal — Rang S',15]],
  hard:   [['SS','Difficile — Rang SS',10],['Otaku','Difficile — Rang Otaku',10],['Otaku Pro','Difficile — Rang Otaku Pro',10]]
};

let quizState = { level:null, subRank:0, qi:0, score:0, questions:[], mode:'levels' };

function renderQuizLevels(){
  const wrap=document.getElementById('quizWrap'); if(!wrap) return;
  wrap.innerHTML=`
    <div class="quiz-levels">
      <div class="ql-card easy" onclick="startQuizLevel('easy')">
        <div class="ql-icon">🟢</div>
        <div class="ql-title">Facile</div>
        <div class="ql-ranks">Rang E · Rang D · Rang C<br>30 questions</div>
      </div>
      <div class="ql-card normal" onclick="startQuizLevel('normal')">
        <div class="ql-icon">🟡</div>
        <div class="ql-title">Normal</div>
        <div class="ql-ranks">Rang B · Rang A · Rang S<br>45 questions</div>
      </div>
      <div class="ql-card hard" onclick="startQuizLevel('hard')">
        <div class="ql-icon">🔴</div>
        <div class="ql-title">Difficile</div>
        <div class="ql-ranks">Rang SS · Otaku · Otaku Pro<br>30 questions</div>
      </div>
    </div>
    <div style="margin-top:16px">
      <div style="font-family:'Cinzel',serif;font-size:14px;margin-bottom:12px;color:var(--gold)">🏆 Classements</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        ${['easy','normal','hard'].map(l=>`
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px">
            <div style="font-size:12px;font-weight:500;margin-bottom:8px;color:${l==='easy'?'var(--green)':l==='normal'?'var(--gold)':'var(--accent2)'}">${l==='easy'?'Facile':l==='normal'?'Normal':'Difficile'}</div>
            ${buildLeaderboard(l)}
          </div>`).join('')}
      </div>
    </div>`;
}

function buildLeaderboard(level){
  const lb=DB.quizLeaderboard[level]||[];
  if(!lb.length) return '<div style="font-size:11px;color:var(--muted)">Aucun score</div>';
  return lb.slice(0,5).map((e,i)=>`
    <div style="display:flex;align-items:center;gap:6px;font-size:11px;margin-bottom:4px">
      <span style="width:18px;height:18px;border-radius:50%;background:${i===0?'var(--gold)':i===1?'#aaa':i===2?'#cd7f32':'var(--bg2)'};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0">${i+1}</span>
      <span style="flex:1">${e.user}</span>
      <span style="color:var(--gold)">${e.score}pts</span>
    </div>`).join('');
}

function startQuizLevel(level){
  const questions = [...QUIZ_QUESTIONS[level]].sort(()=>Math.random()-.5);
  quizState={ level, subRank:0, qi:0, score:0, questions, mode:'quiz' };
  renderQuizQuestion();
}

function renderQuizQuestion(){
  const s=quizState; const wrap=document.getElementById('quizWrap'); if(!wrap) return;
  const total=s.questions.length;
  if(s.qi>=total){ showQuizResult(); return; }
  const q=s.questions[s.qi];
  const pct=Math.round((s.qi/total)*100);
  const lvlClass=s.level;
  wrap.innerHTML=`
    <div style="max-width:560px;margin:0 auto">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <button class="back-btn" onclick="renderQuizLevels()" style="flex-shrink:0">←</button>
        <div style="flex:1;font-size:12px;color:var(--muted)">Q${s.qi+1}/${total}</div>
        <div class="qz-sc-badge">⭐ ${s.score}</div>
      </div>
      <div class="pb"><div class="pb-fill pb-${lvlClass}" style="width:${pct}%"></div></div>
      <div class="qz-q">${q.q}</div>
      <div class="qz-opts">${q.opts.map((o,i)=>`<button class="qz-opt" id="qo${i}" onclick="qzAnswer(${i})">${o}</button>`).join('')}</div>
      <div class="qz-fb" id="qzfb"></div>
      <button class="qz-next" id="qznext" style="display:none" onclick="qzNext()">Question suivante →</button>
    </div>`;
}

function qzAnswer(i){
  const q=quizState.questions[quizState.qi];
  document.querySelectorAll('.qz-opt').forEach(b=>b.classList.add('dis'));
  document.getElementById('qo'+i)?.classList.add(i===q.a?'ok':'ko');
  if(i!==q.a) document.getElementById('qo'+q.a)?.classList.add('ok');
  const fb=document.getElementById('qzfb');
  if(fb) fb.textContent=i===q.a?'✅ Bonne réponse !':'❌ Mauvais ! Réponse : '+q.opts[q.a];
  if(i===q.a) quizState.score+=10;
  const nxt=document.getElementById('qznext'); if(nxt) nxt.style.display='inline-block';
}

function qzNext(){ quizState.qi++; renderQuizQuestion(); }

function showQuizResult(){
  const s=quizState; const wrap=document.getElementById('quizWrap'); if(!wrap) return;
  const pct=s.score/(s.questions.length*10)*100;
  let rankIdx=QUIZ_RANKS[s.level].length-1;
  if(pct<40) rankIdx=0; else if(pct<70) rankIdx=Math.min(1,QUIZ_RANKS[s.level].length-1);
  const [rankName,rankLabel]=QUIZ_RANKS[s.level][rankIdx];
  const color=s.level==='easy'?'var(--green)':s.level==='normal'?'var(--gold)':'var(--accent2)';
  if(currentUser){
    if(!DB.quizLeaderboard[s.level]) DB.quizLeaderboard[s.level]=[];
    DB.quizLeaderboard[s.level].push({user:currentUser,score:s.score,rank:rankName});
    DB.quizLeaderboard[s.level].sort((a,b)=>b.score-a.score);
    DB.quizLeaderboard[s.level]=DB.quizLeaderboard[s.level].slice(0,20);
    const u=DB.users[currentUser];
    u.quizPoints=(u.quizPoints||0)+s.score;
    u.rank=rankLabel;
    fbSaveUser(currentUser);
    fbSaveLeaderboard();
    awardQuizBadge(s.level,rankName);
  }
  wrap.innerHTML=`
    <div class="qz-result">
      <h2>Quiz terminé !</h2>
      <span class="big-sc">${s.score}</span>
      <div class="rank-earned" style="color:${color}">Rang obtenu : ${rankName}</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:16px">${pct>=80?'Excellent ! Tu maîtrises le sujet 🔥':pct>=50?'Bien joué ! Continue ainsi 👊':'Entraîne-toi encore, futur Otaku Pro 😤'}</div>
      <div style="margin-bottom:16px">
        <div style="font-size:13px;font-weight:500;margin-bottom:8px">🏆 Classement</div>
        <div class="leaderboard-wrap">${buildLeaderboard(s.level)}</div>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="auth-btn" style="max-width:200px" onclick="startQuizLevel('${s.level}')">🔄 Rejouer</button>
        <button class="auth-btn" style="max-width:200px;background:var(--bg3);border:1px solid var(--border)" onclick="renderQuizLevels()">← Niveaux</button>
      </div>
    </div>`;
}

function awardQuizBadge(level,rank){
  const u=DB.users[currentUser]; if(!u) return;
  const badges={
    easy:{ E:{icon:'🥉',name:'Rang E',color:'bronze-b'}, D:{icon:'🥈',name:'Rang D',color:'silver-b'}, C:{icon:'🥇',name:'Rang C',color:'gold-b'} },
    normal:{ B:{icon:'⚔️',name:'Rang B',color:'silver-b'}, A:{icon:'🌟',name:'Rang A',color:'gold-b'}, S:{icon:'💎',name:'Rang S',color:'gold-b'} },
    hard:{ SS:{icon:'👑',name:'Rang SS',color:'gold-b'}, Otaku:{icon:'🏯',name:'Otaku',color:'gold-b'}, 'Otaku Pro':{icon:'🔥',name:'Otaku Pro',color:'gold-b'} }
  };
  const b=badges[level]?.[rank]; if(!b) return;
  if(u.badges?.some(x=>x.name===b.name)) return;
  if(!u.badges) u.badges=[];
  u.badges.push(b);
  fbSaveUser(currentUser);
  toast('🏅 Badge Quiz gagné : '+b.name+' !');
  addNotif(currentUser,{icon:b.icon,text:`Badge Quiz obtenu : ${b.name} !`});
}

/* ═══════════════════════════════
   ABOUT & HELP
════════════════════════════════*/
function renderAbout(){
  const b=document.getElementById('aboutBody'); if(!b) return;
  b.innerHTML=`
    <div class="about-section">
      <div style="background:linear-gradient(135deg,#1a0a0f,#2a1a2a);border-radius:12px;height:120px;display:flex;align-items:center;justify-content:center;font-size:48px;margin-bottom:20px">🏯</div>
      <div class="about-block"><h3>🏯 À propos d'AnimesTomes</h3><p>AnimesTomes est la plateforme anime tout-en-un pensée pour les fans d'animation japonaise. Jeux, quiz, galerie, messagerie, communauté — tout réuni au même endroit, créé avec passion.</p></div>
      <div class="about-block"><h3>👨‍💻 À propos de RACTAC</h3><p>RACTAC est le concepteur et créateur d'AnimesTomes. Passionné d'anime et de développement, RACTAC a bâti cette plateforme pour rassembler la communauté otaku du monde entier.</p><p style="margin-top:8px">📧 Contact : <a href="mailto:ractac405@gmail.com">ractac405@gmail.com</a></p></div>
      <div class="about-block"><h3>🎯 Notre Mission</h3><ul><li>Rassembler les fans d'anime du monde entier</li><li>Offrir un espace sécurisé et convivial</li><li>Partager la passion de la culture japonaise</li><li>Créer des jeux et défis autour des animes</li></ul></div>
      <div class="about-block"><h3>📅 Version</h3><p>AnimesTomes v2.0 — 2026 · Créé avec ❤️ par RACTAC</p></div>
    </div>`;
}

function renderHelp(){
  const b=document.getElementById('helpBody'); if(!b) return;
  b.innerHTML=`
    <div style="max-width:640px;margin:0 auto">
      <div class="about-block">
        <h3>❓ Questions fréquentes</h3>
        <ol class="help-list">
          <li>Comment créer un compte ? → Clique sur "Inscription" depuis l'écran d'accueil et remplis le formulaire.</li>
          <li>Comment ajouter un ami ? → Va dans "Amis", tape le pseudo exact et clique "Inviter".</li>
          <li>Comment rejoindre le Club Otaku ? → Dans Messagerie > Club Otaku. Ta demande sera validée par l'admin.</li>
          <li>Comment changer ma photo de profil ? → Menu → Mon compte, clique sur ton avatar.</li>
          <li>Comment publier une story avec image ou vidéo ? → Accueil > 📸 Stories > ➕ Ma story, puis choisis un fichier.</li>
          <li>Comment télécharger une image de la galerie ? → Galerie, survole l'image et clique "⬇ DL".</li>
          <li>Comment jouer avec un ami ? → Dans Jeux, choisis un jeu multijoueur et clique "Inviter ami".</li>
          <li>Comment gagner des badges ? → Gagne des parties, termine des quiz pour débloquer des badges.</li>
          <li>Comment signaler un utilisateur ? → Visite son profil et clique "⚑ Signaler".</li>
          <li>J'ai oublié mon mot de passe → Contacte l'admin : ractac405@gmail.com avec ton pseudo.</li>
        </ol>
      </div>
      <div class="about-block">
        <h3>📩 Envoyer une demande d'aide</h3>
        <div class="field"><label>Ton pseudo</label><input id="helpUser" type="text" placeholder="Ton pseudo AnimesTomes"></div>
        <div class="field"><label>Sujet</label>
          <select id="helpSubject">
            <option>Problème de connexion</option>
            <option>Bug sur le site</option>
            <option>Problème avec un membre</option>
            <option>Demande de fonctionnalité</option>
            <option>Autre</option>
          </select>
        </div>
        <div class="field"><label>Message</label><textarea id="helpMsg" rows="4" placeholder="Décris ton problème..."></textarea></div>
        <button class="auth-btn" onclick="sendHelpRequest()">📨 Envoyer à l'admin</button>
      </div>
    </div>`;
  if(currentUser){ setTimeout(()=>{ const e=document.getElementById('helpUser'); if(e) e.value=currentUser; },100); }
}

function sendHelpRequest(){
  const user=document.getElementById('helpUser').value.trim();
  const subject=document.getElementById('helpSubject').value;
  const msg=document.getElementById('helpMsg').value.trim();
  if(!user||!msg){ toast('Remplis tous les champs.'); return; }
  addNotif(ADMIN,{icon:'📩',text:`Aide de ${user} — ${subject}: ${msg}`});
  document.getElementById('helpMsg').value='';
  toast('✅ Demande envoyée à l\'admin !');
}

/* ═══════════════════════════════
   STATS ADMIN (temps réel Firebase)
════════════════════════════════*/
function renderStats(){
  const body=document.getElementById('statsBody'); if(!body) return;
  const s=DB.siteStats;
  const months=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const monthly=Array.isArray(s.monthly)?s.monthly:Array(12).fill(0);
  const likesM=Array.isArray(s.likesM)?s.likesM:Array(12).fill(0);
  const maxC=Math.max(...monthly,1), maxL=Math.max(...likesM,1);
  const totalUsers=Object.keys(DB.users).length;

  body.innerHTML=`
    <div style="max-width:800px;margin:0 auto">
      <div style="font-size:11px;color:var(--green);margin-bottom:12px;padding:8px 12px;background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.3);border-radius:8px">
        🔴 Données en temps réel via Firebase — auto-actualisées
      </div>
      <div class="stats-grid">
        ${[
          ['👥','Connexions totales',s.connections||0,''],
          ['👤','Utilisateurs inscrits',totalUsers,''],
          ['❤️','Likes',s.likes||0,''],
          ['💬','Commentaires',s.comments||0,''],
          ['🔗','Partages',s.shares||0,''],
          ['⚑','Signalements',s.signalements||0,''],
          ['⚠️','Préventions',s.preventions||0,''],
          ['⭐','Étoiles données',s.starsGiven||0,''],
          ['🏯','Membres Club',DB.clubMembers.length,''],
          ['📝','Publications',DB.posts.length,''],
          ['⭐','Évaluations reçues',DB.ratings.length,''],
          ['🏆','Quiz joués',(DB.quizLeaderboard.easy?.length||0)+(DB.quizLeaderboard.normal?.length||0)+(DB.quizLeaderboard.hard?.length||0),''],
        ].map(([ic,lb,val])=>`
          <div class="stat-card">
            <div style="font-size:22px;margin-bottom:6px">${ic}</div>
            <div class="stat-val">${val}</div>
            <div class="stat-lbl">${lb}</div>
          </div>`).join('')}
      </div>
      <div class="chart-wrap">
        <div class="chart-title">📈 Connexions par mois</div>
        <div class="bar-chart">${monthly.map((v,i)=>`<div class="bar-col"><div class="bar red" style="height:${Math.round((v/maxC)*90)||4}px"></div><div class="bar-lbl">${months[i]}</div></div>`).join('')}</div>
      </div>
      <div class="chart-wrap">
        <div class="chart-title">❤️ Likes par mois</div>
        <div class="bar-chart">${likesM.map((v,i)=>`<div class="bar-col"><div class="bar gold" style="height:${Math.round((v/maxL)*90)||4}px"></div><div class="bar-lbl">${months[i]}</div></div>`).join('')}</div>
      </div>
      <div class="chart-wrap">
        <div class="chart-title">⚑ Signalements récents</div>
        ${DB.reports.length?DB.reports.slice().reverse().slice(0,20).map(r=>`<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;font-size:12px"><strong style="color:var(--accent2)">${r.by}</strong> signale <strong>${r.against}</strong> — ${r.reason}<div style="color:var(--muted);margin-top:4px">${r.details||''} · ${r.time}</div></div>`).join(''):'<div class="empty-state" style="padding:16px">Aucun signalement.</div>'}
      </div>
      <div class="chart-wrap">
        <div class="chart-title">⭐ Évaluations du site</div>
        ${DB.ratings.length?DB.ratings.slice().reverse().map(r=>`<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px;font-size:12px"><strong>${r.user}</strong> — ${'⭐'.repeat(+r.score)} (${r.score}/10)<div style="color:var(--muted);margin-top:4px">${r.comment||'—'}</div></div>`).join(''):'<div class="empty-state" style="padding:16px">Aucune évaluation.</div>'}
      </div>
      <div class="chart-wrap">
        <div class="chart-title">👥 Utilisateurs inscrits (${totalUsers})</div>
        ${Object.entries(DB.users).map(([u,d])=>`<div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;font-size:12px">
          <span style="font-size:18px">${d.avatar||'👤'}</span>
          <span style="flex:1;font-weight:500">${u}${u===ADMIN?' 👑':''}</span>
          <span style="color:var(--gold)">${d.rank||'Rang E'}</span>
          <span style="color:var(--muted)">${d.stars||0}⭐</span>
        </div>`).join('')}
      </div>
    </div>`;
}

/* ═══════════════════════════════
   RATING
════════════════════════════════*/
function showRatingModal(){
  if(!currentUser||currentUser===ADMIN||ratingDone) return;
  openModal('ratingModal');
}
function rateClick(n){
  document.querySelectorAll('.rating-star').forEach((s,i)=>s.classList.toggle('active',i<n));
  document.getElementById('ratingScore').value=n;
}
function submitRating(){
  const score=document.getElementById('ratingScore').value;
  const comment=document.getElementById('ratingComment').value.trim();
  if(!score){ toast('Sélectionne une note !'); return; }
  const rating={user:currentUser,score,comment,time:nowStr()};
  DB.ratings.push(rating);
  fbPushRating(rating);
  ratingDone=true;
  closeModal('ratingModal'); toast('Merci pour ton évaluation ! 🙏');
}

/* ═══════════════════════════════
   JEUX (liste + ouverture)
════════════════════════════════*/
const GAMES=[
  {id:'xo',        title:'Morpion X O',     icon:'❌⭕',  desc:'Le classique morpion.',                   levels:['Facile','Difficile'],         multi:true },
  {id:'connect4',  title:'Puissance 4',     icon:'🔴🟡', desc:'Aligne 4 jetons avant ton adversaire.',   levels:['Normal','Difficile'],          multi:true },
  {id:'memory',    title:'Memory',          icon:'🃏',    desc:'Retrouve toutes les paires de cartes.',   levels:['Facile','Normal','Difficile'],  multi:false},
  {id:'snake',     title:'Snake',           icon:'🐍',    desc:'Mange les pommes, évite les murs.',       levels:['Facile','Normal','Difficile'],  multi:false},
  {id:'tetris',    title:'Tetris',          icon:'🧱',    desc:'Complète les lignes avant qu\'elles montent.', levels:['Facile','Normal','Difficile'], multi:false},
  {id:'pong',      title:'Pong',            icon:'🏓',    desc:'Renvoie la balle avec ta raquette.',      levels:['Facile','Normal'],             multi:false},
  {id:'flappy',    title:'Flappy',          icon:'🐦',    desc:'Passe entre les tuyaux.',                 levels:['Facile','Difficile'],          multi:false},
  {id:'mine',      title:'Démineur',        icon:'💣',    desc:'Trouve les mines sans les déclencher.',   levels:['Facile','Normal','Difficile'],  multi:false},
  {id:'2048',      title:'2048',            icon:'🔢',    desc:'Combine les tuiles pour atteindre 2048.', levels:['Facile','Normal'],             multi:false},
  {id:'pairs',     title:'Paires Anime',    icon:'🎴',    desc:'Memory avec des personnages anime.',      levels:['Facile','Normal'],             multi:false},
  {id:'reaction',  title:'Réflexes',        icon:'⚡',    desc:'Clique le plus vite possible.',           levels:['Facile','Normal','Difficile'],  multi:false},
  {id:'hangman',   title:'Pendu Anime',     icon:'🎌',    desc:'Devine le mot anime lettre par lettre.',  levels:['Facile','Normal'],             multi:false},
  {id:'trivia',    title:'Blind Test',      icon:'🎵',    desc:'Devine l\'anime depuis la description.',   levels:['Normal','Difficile'],          multi:false},
  {id:'wordsearch',title:'Mots Croisés',    icon:'🔤',    desc:'Trouve les mots anime dans la grille.',   levels:['Facile','Normal'],             multi:false},
  {id:'duel',      title:'Duel Quiz',       icon:'🧠⚔️', desc:'Défi quiz contre un ami.',                levels:['Normal','Difficile'],          multi:true },
];

function renderGamesGrid(){
  const grid=document.getElementById('gamesGrid'); if(!grid) return;
  const area=document.getElementById('gameArea'); if(area) area.style.display='none';
  grid.style.display='grid';
  grid.innerHTML=GAMES.map(g=>`
    <div class="game-card">
      ${g.multi?'<div class="multi-badge">👥 Multijoueur</div>':''}
      <span class="gc-icon">${g.icon}</span>
      <div class="gc-title">${g.title}</div>
      <div class="gc-desc">${g.desc}</div>
      <div class="gc-levels">${g.levels.map(l=>`<span class="level-tag level-${l==='Facile'?'easy':l==='Normal'?'normal':'hard'}">${l}</span>`).join('')}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:8px">
        ${g.levels.map(l=>`<button class="play-btn" data-game-launch="${g.id}" data-game-level="${l}">${l}</button>`).join('')}
        ${g.multi?`<button class="play-btn blue" data-game-invite="${g.id}">👥 Inviter</button>`:''}
      </div>
    </div>`).join('');
}

function openGame(id, level){
  if(gameAnimFrame){ cancelAnimationFrame(gameAnimFrame); gameAnimFrame=null; }
  const grid=document.getElementById('gamesGrid');
  const area=document.getElementById('gameArea');
  if(grid) grid.style.display='none';
  if(area) area.style.display='block';
  area.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <button class="back-btn" onclick="closeGame()">←</button>
      <div style="font-family:'Cinzel',serif;font-size:15px;color:#fff">${GAMES.find(g=>g.id===id)?.title||id}</div>
      <span class="level-tag level-${level==='Facile'?'easy':level==='Normal'?'normal':'hard'}" style="margin-left:4px">${level}</span>
    </div>
    <div id="gameContainer" style="display:flex;flex-direction:column;align-items:center;gap:14px"></div>`;
  const c=document.getElementById('gameContainer');
  const lvl=level==='Facile'?'easy':level==='Normal'?'normal':'hard';

  /* ── Correspondance id → fonction de lancement ── */
  const map={
    xo: window.launchXO,
    connect4: window.launchConnect4,
    memory: window.launchMemory,
    snake: window.launchSnake,
    tetris: window.launchTetris,
    pong: window.launchPong,
    flappy: window.launchFlappy,
    mine: window.launchMinesweeper,
    '2048': window.launch2048,
    pairs: window.launchAnimePairs,
    reaction: window.launchReaction,
    hangman: window.launchHangman,
    trivia: window.launchTrivia,
    wordsearch: window.launchWordSearch,
    duel: window.launchDuelQuiz,
  };
  const fn = map[id];
  if(typeof fn !== 'function'){
    c.innerHTML='<div class="empty-state">🎮 Jeu indisponible : fonction <code>launch'+id+'</code> introuvable. Vérifie que <code>games.js</code> est bien chargé.</div>';
    return;
  }
  try { fn(c, lvl); }
  catch(err){
    console.error('[openGame]', err);
    c.innerHTML='<div class="empty-state" style="color:var(--accent2)">❌ Erreur lors du lancement du jeu : '+(err?.message||err)+'</div>';
  }
}

function closeGame(){
  if(gameAnimFrame){ cancelAnimationFrame(gameAnimFrame); gameAnimFrame=null; }
  const area=document.getElementById('gameArea'); if(area) area.style.display='none';
  const grid=document.getElementById('gamesGrid'); if(grid) grid.style.display='grid';
}

function awardGameBadge(gameId, lvl){
  const u=DB.users[currentUser]; if(!u||!currentUser) return;
  const icons={easy:'🥉',normal:'🥈',hard:'🥇'};
  const colors={easy:'bronze-b',normal:'silver-b',hard:'gold-b'};
  const game=GAMES.find(g=>g.id===gameId);
  const name=`${icons[lvl]||'🏅'} ${game?.title||gameId} — ${lvl==='easy'?'Facile':lvl==='normal'?'Normal':'Difficile'}`;
  if(u.badges?.some(b=>b.name===name)) return;
  if(!u.badges) u.badges=[];
  u.badges.push({icon:icons[lvl]||'🏅',name,color:colors[lvl]||'bronze-b'});
  fbSaveUser(currentUser);
  toast('🏅 Badge gagné : '+name+' !');
  addNotif(currentUser,{icon:icons[lvl]||'🏅',text:'Badge jeu gagné : '+name});
}

/* ═══════════════════════════════
   MODALS
════════════════════════════════*/
function openModal(id){ const el=document.getElementById(id); if(el) el.classList.add('open'); }
function closeModal(id){ const el=document.getElementById(id); if(el) el.classList.remove('open'); }

/* ═══════════════════════════════
   UTILS
════════════════════════════════*/
function nowStr(){
  const d=new Date();
  return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
}
function toast(msg){
  const t=document.getElementById('toastEl'); if(!t) return;
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

/* ═══════════════════════════════
   INIT
════════════════════════════════*/
document.addEventListener('DOMContentLoaded',()=>{
  buildAvatarPicker();
  initSlider();
  /* Lance l'auto-login dès que Firebase est prêt, ou tout de suite si déjà prêt */
  if(FB_READY) checkAutoLogin();
  else window.addEventListener('firebase-ready', ()=>checkAutoLogin());
});
/* ═══════════════════════════════
   Exposition window + délégation
═══════════════════════════════ */
Object.assign(window, {
  openGame, closeGame, inviteToGame, doGameInvite,
  editPost, confirmDeletePost, deletePost, likePost, addComment, toggleComments,
  sharePost, closeShareSheet, shareCopyLink, shareFacebook, shareWhatsapp,
  shareToFriend, shareToClub, doAddStory, doAddPost, refreshFeed, viewStory,
  renderGamesGrid,
});

document.addEventListener('click', (e)=>{
  const launch = e.target.closest('[data-game-launch]');
  if(launch){ e.preventDefault(); openGame(launch.getAttribute('data-game-launch'), launch.getAttribute('data-game-level')); return; }
  const inv = e.target.closest('[data-game-invite]');
  if(inv){ e.preventDefault(); inviteToGame(inv.getAttribute('data-game-invite')); return; }
});
