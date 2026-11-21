(() => {
  "use strict";
  const cfg = window.WISEBOX_CONFIG || {};
  const API_KEY = cfg.TMDB_API_KEY || "";
  const API = cfg.TMDB_BASE_URL || "https://api.themoviedb.org/3";
  const IMG = cfg.TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p/";
  const state = { hero: null, exploreType: "movie", explorePage: 1, moviesPage: 1, tvPage: 1, searchType: "multi", libraryTab: "watchlist", searchTimer: null, genres: {movie:[],tv:[]} };
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const store = {
    read(){ try{return JSON.parse(localStorage.getItem("wisebox-library")) || {watchlist:[],favorites:[],watched:[],ratings:{},history:[],profile:{name:"My Space"}}}catch{return {watchlist:[],favorites:[],watched:[],ratings:{},history:[],profile:{name:"My Space"}}} },
    save(data){localStorage.setItem("wisebox-library",JSON.stringify(data))}
  };
  let library = store.read();
  const titleOf = x => x.title || x.name || "Untitled";
  const dateOf = x => x.release_date || x.first_air_date || "";
  const yearOf = x => dateOf(x).slice(0,4);
  const isTV = x => x.media_type === "tv" || (!x.title && !!x.name);
  const typeOf = x => isTV(x) ? "tv" : "movie";
  const poster = (path,size=cfg.IMAGE_SIZE||"w500") => path ? `${IMG}${size}${path}` : "";
  const escapeHTML = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const toast = msg => {const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2400)};
  async function api(path, params={}) {
    if(!API_KEY || API_KEY.includes("PASTE_YOUR")) throw new Error("Add your TMDB v3 API key in js/config.js first.");
    const url=new URL(API+path);url.searchParams.set("api_key",API_KEY);
    Object.entries(params).forEach(([k,v])=>{if(v!==""&&v!==null&&v!==undefined)url.searchParams.set(k,v)});
    const res=await fetch(url);
    if(!res.ok){let detail="";try{const j=await res.json();detail=j.status_message||""}catch{}throw new Error(detail||`TMDB request failed (${res.status})`)}
    return res.json();
  }
  function cardHTML(item){
    const type=typeOf(item), id=item.id, image=poster(item.poster_path), title=escapeHTML(titleOf(item)), year=yearOf(item)||"Release date TBA", rating=Number(item.vote_average||0).toFixed(1);
    const saved=library.watchlist.some(x=>x.id===id&&x.type===type);
    return `<article class="poster-card" data-open="${id}" data-type="${type}" tabindex="0" aria-label="View ${title}">
      <div class="poster-image-wrap">${image?`<img class="poster-image" loading="lazy" src="${image}" alt="${title} poster" />`:`<div class="poster-image"></div>`}
      <span class="poster-rating">★ ${rating}</span><div class="poster-overlay"><button class="quick-action" data-save="${id}" data-type="${type}" aria-label="Add ${title} to watchlist">${saved?"✓":"＋"}</button><button class="quick-action" data-open="${id}" data-type="${type}" aria-label="View details">↗</button></div></div>
      <div class="poster-title">${title}</div><div class="poster-sub">${year} ${type==="tv"?"· Series":"· Movie"}</div></article>`;
  }
  function renderRow(id,items){const el=$(id);if(!el)return;el.innerHTML=items.length?items.map(cardHTML).join(""):'<div class="empty-state">No titles found.</div>'}
  function renderGrid(id,items){const el=$(id);if(!el)return;el.innerHTML=items.length?items.map(cardHTML).join(""):'<div class="empty-state"><b>Nothing here just yet.</b>Try another search or explore more titles.</div>'}
  function setActivePage(name){
    $$(".page").forEach(p=>p.classList.remove("active"));const page=$("#"+name+"Page");if(page)page.classList.add("active");
    $$(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.nav===name));
    $(".main-nav").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});
  }
  function navigate(){const raw=location.hash.slice(1)||"home";if(raw.startsWith("detail/")){setActivePage("detail");const [,type,id]=raw.split("/");loadDetails(type,id);return}
    const name=["home","explore","search","movies","tv","library"].includes(raw)?raw:"home";setActivePage(name);
    if(name==="explore"&&!$("#exploreGrid").dataset.loaded)loadExplore();
    if(name==="movies"&&!$("#moviesGrid").dataset.loaded)loadMovies();
    if(name==="tv"&&!$("#tvPageGrid").dataset.loaded)loadTV();
    if(name==="library")renderLibrary();
  }
  async function loadHome(){
    try{
      const [trending,popular,tv,top]=await Promise.all([api("/trending/movie/day"),api("/movie/popular"),api("/tv/popular"),api("/movie/top_rated")]);
      renderRow("#trendingRow",trending.results.slice(0,12));renderRow("#popularRow",popular.results.slice(0,12));renderRow("#tvRow",tv.results.slice(0,8).map(x=>({...x,media_type:"tv"})));renderRow("#topRatedRow",top.results.slice(0,12));
      const hero=trending.results.find(x=>x.backdrop_path)||popular.results[0];setHero(hero);
    }catch(e){showAPIError(e)}
  }
  function setHero(item){if(!item)return;state.hero=item;const bg=$("#heroBackdrop");bg.style.backgroundImage=`url("${poster(item.backdrop_path,cfg.BACKDROP_SIZE||"w1280")}")`;$("#heroTitle").innerHTML=escapeHTML(titleOf(item)).replace(/ (.*)/," <em>$1</em>");$("#heroDescription").textContent=item.overview||"A story waiting to be discovered.";$("#heroMeta").innerHTML=`<span>★ ${Number(item.vote_average||0).toFixed(1)} / 10</span><span>${yearOf(item)||"Coming soon"}</span><span>${typeOf(item)==="tv"?"Series":"Movie"}</span>`;$("#heroKicker").textContent="WISEBOX SPOTLIGHT";}
  function showAPIError(e){console.error(e);toast(e.message);["#trendingRow","#popularRow","#tvRow","#topRatedRow"].forEach(s=>{const el=$(s);if(el)el.innerHTML=`<div class="empty-state"><b>Couldn't load titles.</b>${escapeHTML(e.message)}</div>`})}
  async function loadGenres(type){try{const data=await api(`/genre/${type}/list`);state.genres[type]=data.genres||[];if(type==="movie"||type==="tv")populateGenres()}catch(e){console.warn(e)}}
  function populateGenres(){const sel=$("#genreFilter");if(!sel)return;const list=state.genres[state.exploreType]||[];sel.innerHTML='<option value="">All genres</option>'+list.map(g=>`<option value="${g.id}">${escapeHTML(g.name)}</option>`).join("")}
  async function loadExplore(reset=true){if(reset)state.explorePage=1;const type=state.exploreType;const params={page:state.explorePage,sort_by:$("#sortFilter").value,with_genres:$("#genreFilter").value,primary_release_year:$("#yearFilter").value,"vote_average.gte":$("#ratingFilter").value,vote_count_gte:50};try{const d=await api(`/discover/${type}`,params);renderGrid("#exploreGrid",d.results);$("#exploreGrid").dataset.loaded="1";$("#exploreHeading").textContent=type==="movie"?"Movie discoveries":"TV discoveries";$("#resultCount").textContent=`Page ${d.page} · ${d.total_results.toLocaleString()} results`;$("#loadMore").style.display=d.page<d.total_pages?"flex":"none"}catch(e){toast(e.message)}}
  async function loadMovies(){try{const d=await api("/movie/popular",{page:state.moviesPage});renderGrid("#moviesGrid",d.results);$("#moviesGrid").dataset.loaded="1";$("#moviesMore").style.display=state.moviesPage<d.total_pages?"flex":"none"}catch(e){toast(e.message)}}
  async function loadTV(){try{const d=await api("/tv/popular",{page:state.tvPage});renderGrid("#tvPageGrid",d.results.map(x=>({...x,media_type:"tv"})));$("#tvPageGrid").dataset.loaded="1";$("#tvMore").style.display=state.tvPage<d.total_pages?"flex":"none"}catch(e){toast(e.message)}}
  async function searchTitles(q){if(!q.trim()){renderGrid("#searchGrid",[]);$("#searchStatus").textContent="Start typing to discover something.";return}$("#searchStatus").textContent="Searching WiseBox…";try{const d=await api(`/search/${state.searchType}`,{query:q,include_adult:false,page:1});const items=d.results.filter(x=>x.media_type!=="person"||state.searchType==="multi");renderGrid("#searchGrid",items);$("#searchStatus").textContent=`${d.total_results.toLocaleString()} results for “${q}”`}catch(e){$("#searchStatus").textContent=e.message}}
  async function loadDetails(type,id){
    const target=$("#detailContent");target.innerHTML='<div class="empty-state">Loading your title…</div>';
    try{const [d,credits,videos,recs]=await Promise.all([api(`/${type}/${id}`),api(`/${type}/${id}/credits`),api(`/${type}/${id}/videos`),api(`/${type}/${id}/recommendations`)]);
      const item={...d,media_type:type};const bg=poster(d.backdrop_path,cfg.BACKDROP_SIZE||"w1280");const p=poster(d.poster_path);const title=escapeHTML(titleOf(d));const genres=(d.genres||[]).map(g=>g.name).join(" · ");const runtime=type==="movie"?(d.runtime?`${d.runtime} min`:""):(d.episode_run_time?.[0]?`${d.episode_run_time[0]} min/ep`:"");const trailer=(videos.results||[]).find(v=>v.site==="YouTube"&&v.type==="Trailer")||(videos.results||[]).find(v=>v.site==="YouTube");
      const cast=(credits.cast||[]).slice(0,12);const inWatch=has("watchlist",item),inFav=has("favorites",item),inWatched=has("watched",item);const ownRating=library.ratings[`${type}-${id}`]||"";
      target.innerHTML=`<div class="detail-backdrop" style="background-image:url('${bg}')"></div><div class="detail-layout"><div>${p?`<img class="detail-poster" src="${p}" alt="${title} poster">`:""}</div><div class="detail-info"><p class="section-kicker">${type==="tv"?"SERIES SPOTLIGHT":"FEATURE PRESENTATION"}</p><h1>${title}</h1><div class="detail-tagline">${escapeHTML(d.tagline||"A story worth discovering.")}</div><div class="detail-facts"><span>★ ${Number(d.vote_average||0).toFixed(1)} / 10</span><span>${yearOf(d)||"Date TBA"}</span>${runtime?`<span>${runtime}</span>`:""}<span>${escapeHTML(genres)}</span></div><p class="detail-overview">${escapeHTML(d.overview||"No synopsis is available yet.")}</p><div class="detail-actions"><button class="primary-button" data-save="${id}" data-type="${type}">${inWatch?"✓ In watchlist":"＋ Watchlist"}</button><button class="glass-button" data-fav="${id}" data-type="${type}">${inFav?"♥ Favourited":"♡ Favourite"}</button><button class="glass-button" data-watched="${id}" data-type="${type}">${inWatched?"✓ Watched":"Mark watched"}</button></div><div class="detail-rating"><label for="personalRating">YOUR RATING</label> <select id="personalRating" data-rating="${id}" data-type="${type}"><option value="">Not rated</option>${[10,9,8,7,6,5,4,3,2,1].map(n=>`<option value="${n}" ${String(ownRating)===String(n)?"selected":""}>${n} / 10</option>`).join("")}</select></div></div></div>
      ${trailer?`<section class="detail-section"><h2>Watch the trailer</h2><iframe class="video-frame" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}" title="${title} trailer" loading="lazy" allowfullscreen></iframe></section>`:""}
      <section class="detail-section"><h2>Cast & faces</h2><div class="cast-row">${cast.map(c=>`<div class="cast-card">${c.profile_path?`<img loading="lazy" src="${poster(c.profile_path,"w185")}" alt="${escapeHTML(c.name)}">`:`<div class="cast-placeholder"></div>`}<b>${escapeHTML(c.name)}</b><span>${escapeHTML(c.character||"")}</span></div>`).join("")||"Cast information unavailable."}</div></section>
      <section class="detail-section"><h2>More like this</h2><div class="poster-row">${(recs.results||[]).slice(0,10).map(cardHTML).join("")||'<p class="poster-sub">No recommendations available yet.</p>'}</div></section>`;
      library.history=library.history.filter(x=>!(x.id===item.id&&x.type===type));library.history.unshift({id:item.id,type,title:titleOf(item),poster_path:item.poster_path,backdrop_path:item.backdrop_path,release_date:dateOf(item),vote_average:item.vote_average});library.history=library.history.slice(0,40);store.save(library);
    }catch(e){target.innerHTML=`<div class="empty-state"><b>We couldn't load this title.</b>${escapeHTML(e.message)}<br><a href="#explore" class="text-link">Back to explore ↗</a></div>`}
  }
  function has(list,item){return library[list].some(x=>x.id===item.id&&x.type===typeOf(item))}
  function compactItem(id,type){return {id:Number(id),type}}
  function addTo(list,id,type){const item=compactItem(id,type);const arr=library[list];const i=arr.findIndex(x=>x.id===item.id&&x.type===item.type);if(i>=0){arr.splice(i,1);toast("Removed from "+list+".")}else{arr.unshift(item);toast("Added to "+list+".")}store.save(library);if(location.hash==="#library")renderLibrary();if(location.hash.startsWith("#detail/"))loadDetails(type,id);else refreshButtons(id,type)}
  function refreshButtons(id,type){$$(`[data-save="${id}"][data-type="${type}"]`).forEach(b=>b.textContent=library.watchlist.some(x=>x.id===Number(id)&&x.type===type)?"✓":"＋")}
  async function hydrateItems(items){const results=await Promise.all(items.map(async x=>{try{return await api(`/${x.type}/${x.id}`)}catch{return null}}));return results.filter(Boolean).map(x=>({...x,media_type:typeOf(x)}))}
  async function renderLibrary(){const key=state.libraryTab;const items=library[key]||[];const stats=$("#libraryStats");stats.innerHTML=`<div class="stat-card"><strong>${library.watchlist.length}</strong><span>Titles to watch</span></div><div class="stat-card"><strong>${library.favorites.length}</strong><span>Favourites saved</span></div><div class="stat-card"><strong>${library.watched.length}</strong><span>Stories watched</span></div>`;$$("[data-tab]").forEach(b=>b.classList.toggle("selected",b.dataset.tab===key));if(!items.length){$("#libraryGrid").innerHTML=`<div class="empty-state"><b>Your ${key} is waiting for its first title.</b>Explore WiseBox and add stories as you go.</div>`;return}$("#libraryGrid").innerHTML='<div class="loading-line"></div>'.repeat(Math.min(items.length,6));renderGrid("#libraryGrid",await hydrateItems(items))}
  function showProfile(){ $("#nicknameInput").value=library.profile?.name||"My Space";$("#profileModal").classList.add("open");$("#profileModal").setAttribute("aria-hidden","false")}
  function bindEvents(){
    $("#heroExplore").onclick=()=>location.hash="#explore";$("#heroDetails").onclick=()=>state.hero&&(location.hash=`#detail/${typeOf(state.hero)}/${state.hero.id}`);
    $("#searchToggle").onclick=()=>{location.hash="#search";setTimeout(()=>$("#searchInput").focus(),100)};$("#menuToggle").onclick=()=>$(".main-nav").classList.toggle("open");
    $("#profileButton").onclick=showProfile;$("#closeProfile").onclick=()=>$("#profileModal").classList.remove("open");$("#profileModal").onclick=e=>{if(e.target.id==="profileModal")$("#profileModal").classList.remove("open")};
    $("#saveProfile").onclick=()=>{library.profile={name:$("#nicknameInput").value.trim()||"My Space"};store.save(library);$(".profile-name").textContent=library.profile.name;$("#profileModal").classList.remove("open");toast("Profile saved.")};$(".profile-name").textContent=library.profile?.name||"My Space";
    $("#exploreType").onclick=e=>{const b=e.target.closest("button[data-type]");if(!b)return;state.exploreType=b.dataset.type;$$("button",$("#exploreType")).forEach(x=>x.classList.toggle("selected",x===b));populateGenres();loadExplore()};
    $("#applyFilters").onclick=()=>loadExplore();$("#resetFilters").onclick=()=>{$("#genreFilter").value="";$("#yearFilter").value="";$("#ratingFilter").value="";$("#sortFilter").value="popularity.desc";loadExplore()};
    $("#loadMore").onclick=()=>{state.explorePage++;loadExploreAppend()};$("#moviesMore").onclick=()=>{state.moviesPage++;loadMoreEndpoint("/movie/popular",state.moviesPage,"#moviesGrid","#moviesMore")};$("#tvMore").onclick=()=>{state.tvPage++;loadMoreEndpoint("/tv/popular",state.tvPage,"#tvPageGrid","#tvMore","tv")};
    $("#searchInput").addEventListener("input",e=>{clearTimeout(state.searchTimer);const q=e.target.value;state.searchTimer=setTimeout(()=>searchTitles(q),350)});$("#clearSearch").onclick=()=>{$("#searchInput").value="";searchTitles("")};
    $("#searchType").onclick=e=>{const b=e.target.closest("button[data-type]");if(!b)return;state.searchType=b.dataset.type;$$("button",$("#searchType")).forEach(x=>x.classList.toggle("selected",x===b));searchTitles($("#searchInput").value)};
    $("#libraryTabs").onclick=e=>{const b=e.target.closest("button[data-tab]");if(!b)return;state.libraryTab=b.dataset.tab;renderLibrary()};
    document.body.addEventListener("click",e=>{const save=e.target.closest("[data-save]");if(save){e.preventDefault();addTo("watchlist",save.dataset.save,save.dataset.type);return}const fav=e.target.closest("[data-fav]");if(fav){addTo("favorites",fav.dataset.fav,fav.dataset.type);return}const watched=e.target.closest("[data-watched]");if(watched){addTo("watched",watched.dataset.watched,watched.dataset.type);return}const card=e.target.closest("[data-open]");if(card){location.hash=`#detail/${card.dataset.type}/${card.dataset.open}`}});
    document.body.addEventListener("change",e=>{const r=e.target.closest("[data-rating]");if(r){const key=`${r.dataset.type}-${r.dataset.rating}`;if(r.value)library.ratings[key]=Number(r.value);else delete library.ratings[key];store.save(library);toast("Your rating has been saved.")}});
    $$(".mood-card").forEach(b=>b.onclick=()=>{location.hash="#explore";setTimeout(()=>{$("#genreFilter").value=b.dataset.genre;loadExplore()},100)});
    $("#yearNow").textContent=new Date().getFullYear();
  }
  async function loadExploreAppend(){try{const p={page:state.explorePage,sort_by:$("#sortFilter").value,with_genres:$("#genreFilter").value,primary_release_year:$("#yearFilter").value,"vote_average.gte":$("#ratingFilter").value,vote_count_gte:50};const d=await api(`/discover/${state.exploreType}`,p);$("#exploreGrid").insertAdjacentHTML("beforeend",d.results.map(cardHTML).join(""));$("#loadMore").style.display=d.page<d.total_pages?"flex":"none"}catch(e){toast(e.message)}}
  async function loadMoreEndpoint(path,page,grid,button,type){try{const d=await api(path,{page});const items=type?d.results.map(x=>({...x,media_type:type})):d.results;$(grid).insertAdjacentHTML("beforeend",items.map(cardHTML).join(""));$(button).style.display=page<d.total_pages?"flex":"none"}catch(e){toast(e.message)}}
  async function init(){bindEvents();window.addEventListener("hashchange",navigate);if(!API_KEY||API_KEY.includes("PASTE_YOUR")){toast("Add your TMDB v3 API key in js/config.js to load live titles.");}else{loadHome();loadGenres("movie");loadGenres("tv")}navigate()}
  init();
})();
