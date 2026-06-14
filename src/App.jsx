import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://fkzdnkcybrbjmjandwgb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZremRua2N5YnJiam1qYW5kd2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTkxMjAsImV4cCI6MjA5NTQ3NTEyMH0.DBiwdL6x9-3gpzAW3ky-Yfz2i_AA7q-HuO8mSeMETJ8";

const hdrs = { "Content-Type":"application/json", apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}` };

async function supa(path, opts={}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers:{...hdrs,...opts.headers}, ...opts });
  if(!r.ok) throw new Error(await r.text());
  const t = await r.text(); return t ? JSON.parse(t) : null;
}

const FL = {
  Mexico:"🇲🇽","South Africa":"🇿🇦","South Korea":"🇰🇷",Czechia:"🇨🇿",
  Canada:"🇨🇦","Bosnia-Herzegovina":"🇧🇦",Qatar:"🇶🇦",Switzerland:"🇨🇭",
  Brazil:"🇧🇷",Morocco:"🇲🇦",Haiti:"🇭🇹",Scotland:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "United States":"🇺🇸",Paraguay:"🇵🇾",Australia:"🇦🇺",Turkey:"🇹🇷",
  Germany:"🇩🇪",Curacao:"🇨🇼","Ivory Coast":"🇨🇮",Ecuador:"🇪🇨",
  Netherlands:"🇳🇱",Japan:"🇯🇵",Sweden:"🇸🇪",Tunisia:"🇹🇳",
  Belgium:"🇧🇪",Egypt:"🇪🇬",Iran:"🇮🇷","New Zealand":"🇳🇿",
  Spain:"🇪🇸","Cape Verde":"🇨🇻","Saudi Arabia":"🇸🇦",Uruguay:"🇺🇾",
  France:"🇫🇷",Senegal:"🇸🇳",Iraq:"🇮🇶",Norway:"🇳🇴",
  Argentina:"🇦🇷",Algeria:"🇩🇿",Austria:"🇦🇹",Jordan:"🇯🇴",
  Portugal:"🇵🇹","DR Congo":"🇨🇩",Uzbekistan:"🇺🇿",Colombia:"🇨🇴",
  England:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",Croatia:"🇭🇷",Ghana:"🇬🇭",Panama:"🇵🇦",
};
const gf = t => FL[t]||"🏳️";

function calcPts(ph,pa,rh,ra){ if(rh===null||ra===null) return 0; if(ph===rh&&pa===ra) return 5; const p=ph>pa?"H":ph<pa?"A":"D", r=rh>ra?"H":rh<ra?"A":"D"; return p===r?3:0; }




export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("ranking");
  const [matches, setMatches] = useState([]);
  const [parts, setParts] = useState([]);
  const [preds, setPreds] = useState([]);
  const [allPreds, setAllPreds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lName, setLName] = useState(""); const [lPin, setLPin] = useState("");
  const [rName, setRName] = useState(""); const [rPin, setRPin] = useState("");
  const [err, setErr] = useState(""); const [ok, setOk] = useState("");
  const [grp, setGrp] = useState("ALL");
  const [drafts, setDrafts] = useState({});
  const [sending, setSending] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);

  const load = useCallback(async () => {
    try {
      const [m,p,a] = await Promise.all([supa("matches?order=match_number.asc"),supa("participants?order=name.asc"),supa("predictions?select=*")]);
      setMatches(m||[]); setParts(p||[]); setAllPreds(a||[]);
      if(user) setPreds((a||[]).filter(pr=>pr.participant_id===user.id));
    } catch(e){ console.error(e); }
    setLoading(false);
  },[user]);

  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{ if(err||ok){ const t=setTimeout(()=>{setErr("");setOk("");},4000); return ()=>clearTimeout(t); } },[err,ok]);

  const login = async () => {
    setErr(""); if(!lName.trim()||!lPin){setErr("Ingresá nombre y PIN");return;}
    try { const r=await supa(`participants?name=eq.${encodeURIComponent(lName.trim())}&pin=eq.${lPin}`);
      if(r&&r.length>0){setUser(r[0]);setView("ranking");setLName("");setLPin("");}
      else setErr("Nombre o PIN incorrecto");
    } catch{ setErr("Error de conexión"); }
  };

  const register = async () => {
    setErr(""); const nm=rName.trim();
    if(!nm||!rPin){setErr("Completá todos los campos");return;}
    if(rPin.length!==4||isNaN(rPin)){setErr("El PIN debe ser de 4 dígitos");return;}
    try { const ex=await supa(`participants?name=eq.${encodeURIComponent(nm)}`);
      if(ex&&ex.length>0){setErr("Ese nombre ya está registrado. Usá otro.");return;}
    } catch{ setErr("Error verificando nombre"); return; }
    try { const r=await supa("participants",{method:"POST",headers:{...hdrs,Prefer:"return=representation"},body:JSON.stringify({name:nm,pin:rPin})});
      if(r&&r.length>0){setUser(r[0]);setOk("¡Registrado! Ingresá tus predicciones");setView("predictions");setRName("");setRPin("");load();}
    } catch(e){ e.message.includes("duplicate")?setErr("Nombre ya registrado"):setErr("Error al registrar"); }
  };

  const hasPred = mid => preds.some(p=>p.match_id===mid);
  const getPred = mid => preds.find(p=>p.match_id===mid);

  const updDraft = (mid,f,v) => { if(hasPred(mid)) return; setDrafts(p=>({...p,[mid]:{...p[mid],[f]:v}})); };

  const submitOne = async mid => {
    if(!user||hasPred(mid)) return; const d=drafts[mid];
    if(!d||d.home===undefined||d.home===""||d.away===undefined||d.away===""){setErr("Ingresá ambos marcadores");return;}
    try { await supa("predictions",{method:"POST",headers:{...hdrs,Prefer:"return=representation"},body:JSON.stringify({participant_id:user.id,match_id:mid,pred_home:parseInt(d.home),pred_away:parseInt(d.away)})});
      setDrafts(p=>{const n={...p};delete n[mid];return n;}); await load(); setOk("Predicción bloqueada ✓");
    } catch(e){ setErr("Error: "+e.message); }
  };

  const submitAll = async () => {
    const pending=Object.entries(drafts).filter(([mid,d])=>d.home!==undefined&&d.home!==""&&d.away!==undefined&&d.away!==""&&!hasPred(parseInt(mid)));
    if(!pending.length){setErr("No hay predicciones pendientes");return;}
    setSending(true); let n=0;
    for(const [mid,d] of pending){
      try { await supa("predictions",{method:"POST",headers:{...hdrs,Prefer:"return=representation"},body:JSON.stringify({participant_id:user.id,match_id:parseInt(mid),pred_home:parseInt(d.home),pred_away:parseInt(d.away)})}); n++;
      } catch(e){ console.error(e); }
    }
    setDrafts({}); await load(); setOk(`${n} predicciones bloqueadas ✓`); setSending(false);
  };

  const updResult = async (mid,sh,sa) => {
    if(!user?.is_admin) return;
    try { await supa(`matches?id=eq.${mid}`,{method:"PATCH",headers:{...hdrs,Prefer:"return=representation"},body:JSON.stringify({score_home:parseInt(sh),score_away:parseInt(sa),is_finished:true})});
      const freshPreds = await supa(`predictions?match_id=eq.${mid}`);
      for(const pr of (freshPreds||[])){
        const pts=calcPts(pr.pred_home,pr.pred_away,parseInt(sh),parseInt(sa));
        await supa(`predictions?id=eq.${pr.id}`,{method:"PATCH",body:JSON.stringify({points_earned:pts})});
      }
      await load(); setOk("Resultado y puntos actualizados ✓");
    } catch(e){ setErr("Error: "+e.message); }
  };

  const ranking = parts.map(p=>{
    const pp=allPreds.filter(pr=>pr.participant_id===p.id);
    return {...p, pts:pp.reduce((s,pr)=>s+(pr.points_earned||0),0), ex:pp.filter(pr=>pr.points_earned===5).length, ac:pp.filter(pr=>pr.points_earned===3).length, tp:pp.length};
  }).sort((a,b)=>b.pts-a.pts||b.ex-a.ex);

  const GS=["ALL","A","B","C","D","E","F","G","H","I","J","K","L"];
  const fm = grp==="ALL"?matches:matches.filter(m=>m.group_name===grp);
  const fin=matches.filter(m=>m.is_finished).length;
  const pendN=Object.entries(drafts).filter(([mid,d])=>d.home!==undefined&&d.home!==""&&d.away!==undefined&&d.away!==""&&!hasPred(parseInt(mid))).length;

  // Group standings calculation (real results)
  const getGroupStandings = (groupName) => {
    const groupMatches = matches.filter(m => m.group_name === groupName && m.is_finished);
    const teams = {};
    matches.filter(m => m.group_name === groupName).forEach(m => {
      if (!teams[m.team_home]) teams[m.team_home] = { name: m.team_home, pj:0, g:0, e:0, p:0, gf:0, gc:0, pts:0 };
      if (!teams[m.team_away]) teams[m.team_away] = { name: m.team_away, pj:0, g:0, e:0, p:0, gf:0, gc:0, pts:0 };
    });
    groupMatches.forEach(m => {
      const h = teams[m.team_home], a = teams[m.team_away];
      h.pj++; a.pj++; h.gf += m.score_home; h.gc += m.score_away; a.gf += m.score_away; a.gc += m.score_home;
      if (m.score_home > m.score_away) { h.g++; h.pts += 3; a.p++; }
      else if (m.score_home < m.score_away) { a.g++; a.pts += 3; h.p++; }
      else { h.e++; a.e++; h.pts += 1; a.pts += 1; }
    });
    return Object.values(teams).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);
  };

  // Group standings based on USER PREDICTIONS
  const getGroupStandingsPred = (groupName) => {
    const teams = {};
    matches.filter(m => m.group_name === groupName).forEach(m => {
      if (!teams[m.team_home]) teams[m.team_home] = { name: m.team_home, pj:0, g:0, e:0, p:0, gf:0, gc:0, pts:0 };
      if (!teams[m.team_away]) teams[m.team_away] = { name: m.team_away, pj:0, g:0, e:0, p:0, gf:0, gc:0, pts:0 };
      // Use prediction or draft for this match
      const pred = preds.find(p => p.match_id === m.id);
      const draft = drafts[m.id];
      let sh = null, sa = null;
      if (pred) { sh = pred.pred_home; sa = pred.pred_away; }
      else if (draft && draft.home !== undefined && draft.home !== "" && draft.away !== undefined && draft.away !== "") { sh = parseInt(draft.home); sa = parseInt(draft.away); }
      if (sh !== null && sa !== null) {
        const h = teams[m.team_home], a = teams[m.team_away];
        h.pj++; a.pj++; h.gf += sh; h.gc += sa; a.gf += sa; a.gc += sh;
        if (sh > sa) { h.g++; h.pts += 3; a.p++; }
        else if (sh < sa) { a.g++; a.pts += 3; h.p++; }
        else { h.e++; a.e++; h.pts += 1; a.pts += 1; }
      }
    });
    return Object.values(teams).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);
  };

  // Best third-placed teams
  const getBestThirds = (standingsFn) => {
    const thirds = [];
    ["A","B","C","D","E","F","G","H","I","J","K","L"].forEach(g => {
      const s = standingsFn(g);
      if (s.length >= 3 && s[2].pj > 0) thirds.push({ ...s[2], group: g });
    });
    return thirds.sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);
  };

  if(loading) return(
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-icon">⚽</div>
        <div className="loading-text text-bebas">CARGANDO...</div>
      </div>
    </div>
  );

  // LOGIN
  if(!user) return(
    <div className="login-page">
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>
      <div className="login-container fade-in">
        <div className="login-header">
          <div className="login-logo">🏆</div>
          <h1 className="login-title text-bebas">QUINIELA</h1>
          <h2 className="login-subtitle text-bebas">MUNDIAL 2026</h2>
          <div className="login-locations">🇺🇸 🇨🇦 🇲🇽 USA · Canadá · México</div>
        </div>
        {err&&<Msg t="e">{err}</Msg>}{ok&&<Msg t="s">{ok}</Msg>}
        {view!=="register"?(
          <div className="glass-card">
            <h3 className="form-title">Iniciar Sesión</h3>
            <input placeholder="Tu nombre" value={lName} onChange={e=>setLName(e.target.value)} className="input-field"/>
            <input placeholder="PIN (4 dígitos)" type="password" maxLength={4} value={lPin} onChange={e=>setLPin(e.target.value)} className="input-field" onKeyDown={e=>e.key==="Enter"&&login()}/>
            <button onClick={login} className="btn-primary">Entrar</button>
            <div className="form-footer"><span className="text-dim">¿Primera vez? </span><button onClick={()=>setView("register")} className="btn-link">Registrate</button></div>
          </div>
        ):(
          <div className="glass-card">
            <h3 className="form-title">Registro</h3>
            <input placeholder="Tu nombre (único)" value={rName} onChange={e=>setRName(e.target.value)} className="input-field"/>
            <input placeholder="PIN de 4 dígitos" type="password" maxLength={4} value={rPin} onChange={e=>setRPin(e.target.value)} className="input-field" onKeyDown={e=>e.key==="Enter"&&register()}/>
            <button onClick={register} className="btn-primary">Registrarme</button>
            <div className="form-footer"><span className="text-dim">¿Ya tenés cuenta? </span><button onClick={()=>setView("ranking")} className="btn-link">Iniciá sesión</button></div>
          </div>
        )}
        <div className="login-rules">
          ⚽ Acertar ganador/empate = <span className="text-blue">3 pts</span><br/>
          🎯 Marcador exacto = <span className="text-green">5 pts</span><br/>
          🔒 Una vez enviada, la predicción se bloquea
        </div>
      </div>
    </div>
  );

  // MAIN
  return(
    <div className="app-main-layout">
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>
      {/* Header */}
      <header className="sticky-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="header-logo">🏆</span>
            <div>
              <h1 className="header-title text-bebas">QUINIELA MUNDIAL 2026</h1>
              <div className="header-user">
                <span>{user.name}</span>
                {user.is_admin && <span className="badge-admin">👑 Admin</span>}
              </div>
            </div>
          </div>
          <button onClick={()=>{setUser(null);setView("ranking");setPreds([]);setDrafts({});}} className="btn-secondary">Salir</button>
        </div>
      </header>
      {/* Nav */}
      <nav className="nav-bar">
        <div className="nav-inner nav-container">
          {[{id:"ranking",l:"🏅 Ranking",s:true},{id:"predictions",l:"📝 Predicciones",s:true},{id:"groups",l:"⚽ Grupos",s:true},{id:"results",l:"📊 Resultados",s:true},{id:"transparency",l:"👁️ Quinielas",s:true},{id:"admin",l:"👑 Admin",s:user.is_admin}].filter(t=>t.s).map(tab=>(
            <button key={tab.id} onClick={()=>setView(tab.id)} className={`nav-btn ${view===tab.id?'active':''}`}>{tab.l}</button>
          ))}
        </div>
      </nav>
      <div className="main-content">
        <div className="alerts-container">
          {err&&<Msg t="e">{err}</Msg>}{ok&&<Msg t="s">{ok}</Msg>}
        </div>

        {/* RANKING */}
        {view==="ranking"&&(
          <div className="view-ranking fade-in">
            <div className="glass-card progress-card">
              <div className="progress-details">
                <span className="text-dim text-sm">Progreso del torneo</span>
                <span className="progress-count text-bebas">{fin}/{matches.length} partidos</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{width:`${matches.length>0?(fin/matches.length)*100:0}%`}}/>
              </div>
            </div>
            <h3 className="section-title text-bebas">🏅 TABLA DE POSICIONES</h3>
            <div className="ranking-list">
              {ranking.map((p,i)=>{
                const isTop1 = i===0&&p.pts>0;
                const isTop2 = i===1&&p.pts>0;
                const isTop3 = i===2&&p.pts>0;
                let rankClass = "ranking-item";
                if(isTop1) rankClass += " ranking-item-top1";
                else if(isTop2) rankClass += " ranking-item-top2";
                else if(isTop3) rankClass += " ranking-item-top3";
                
                let badgeClass = "rank-badge";
                if(i===0) badgeClass += " rank-badge-1";
                else if(i===1) badgeClass += " rank-badge-2";
                else if(i===2) badgeClass += " rank-badge-3";

                return(
                  <div key={p.id} className={rankClass}>
                    <div className={badgeClass}>{i===0?"👑":i+1}</div>
                    <div className="ranking-item-body">
                      <div className="participant-name">{p.name}{p.id===user.id?<span className="self-tag"> (tú)</span>:""}</div>
                      <div className="participant-stats">
                        <span className="stat-exact">{p.ex} exactos</span>
                        <span className="stat-divider">·</span>
                        <span className="stat-winner">{p.ac} aciertos</span>
                        <span className="stat-divider">·</span>
                        <span className="stat-pred">{p.tp} pred.</span>
                      </div>
                    </div>
                    <div className="ranking-item-pts">
                      <div className="pts-num text-bebas" style={{color:isTop1?"var(--gold)":"var(--accent)"}}>{p.pts}</div>
                      <div className="pts-lbl text-xs">PTS</div>
                    </div>
                  </div>
                );
              })}
              {!ranking.length&&<div className="no-data">Sin participantes aún</div>}
            </div>
          </div>
        )}

        {/* PREDICTIONS */}
        {view==="predictions"&&(
          <div className="view-predictions fade-in">
            <div className="view-header-row">
              <h3 className="section-title text-bebas" style={{margin:0}}>📝 MIS PREDICCIONES</h3>
              {pendN>0&&<button onClick={submitAll} disabled={sending} className="btn-success">{sending?"Enviando...":`Enviar todas (${pendN}) 🔒`}</button>}
            </div>

            {/* Sub-tabs: Predictions vs Simulated Table */}
            <div className="subtabs-bar">
              <button onClick={()=>setShowSim(false)} className={`btn-tab-pill ${!showSim?'active':''}`}>📝 Mis predicciones</button>
              <button onClick={()=>setShowSim(true)} className={`btn-tab-pill ${showSim?'active':''}`}>📊 Mi tabla simulada</button>
            </div>

            {/* SIMULATED TABLE VIEW */}
            {showSim?(
              <div className="simulated-view fade-in">
                <div className="info-banner">
                  <span className="banner-icon">📊</span>
                  <div className="banner-text">Así quedarían los grupos según <strong className="text-highlight">tus predicciones</strong>. Se actualiza conforme llenás resultados.</div>
                </div>
                {["A","B","C","D","E","F","G","H","I","J","K","L"].map(g=>{
                  const standings = getGroupStandingsPred(g);
                  const predsInGroup = matches.filter(m=>m.group_name===g).filter(m=>preds.some(p=>p.match_id===m.id)||drafts[m.id]).length;
                  return(
                    <div key={g} className="glass-card group-standings-card">
                      <div className="group-header group-header-blue">
                        <span className="group-title text-bebas">GRUPO {g}</span>
                        <span className="group-status">{predsInGroup}/6 predicciones</span>
                      </div>
                      <div className="table-wrapper">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th style={{textAlign:"left",width:"40%"}}>Equipo</th>
                              <th>PJ</th><th>G</th><th>E</th><th>P</th>
                              <th>GF</th><th>GC</th><th>DIF</th>
                              <th style={{color:"var(--blue)"}}>PTS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {standings.map((t,i)=>(
                              <tr key={t.name} className={i<2?"table-row-promoted":""}>
                                <td style={{fontWeight:500}}>
                                  <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                                    {i<2&&<span className="promotion-dot" style={{background:"var(--blue)"}}/>}
                                    <span className="flag-emoji">{gf(t.name)}</span> {t.name}
                                  </span>
                                </td>
                                <td className="text-center">{t.pj}</td>
                                <td className="text-center">{t.g}</td>
                                <td className="text-center">{t.e}</td>
                                <td className="text-center">{t.p}</td>
                                <td className="text-center">{t.gf}</td>
                                <td className="text-center">{t.gc}</td>
                                <td className="text-center" style={{color:t.gf-t.gc>0?"var(--green)":t.gf-t.gc<0?"var(--red)":"var(--text-dim)"}}>{t.gf-t.gc>0?"+":""}{t.gf-t.gc}</td>
                                <td className="text-center text-bebas" style={{color:"var(--blue)",fontWeight:700,fontSize:18}}>{t.pts}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
                {/* Simulated best thirds */}
                {(()=>{
                  const bt=getBestThirds(getGroupStandingsPred);
                  return bt.length>0?(
                    <div className="glass-card group-standings-card">
                      <div className="group-header">
                        <span className="group-title text-bebas">MEJORES TERCEROS</span>
                        <span className="group-status">Clasifican los 8 mejores</span>
                      </div>
                      <div className="table-wrapper">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th style={{textAlign:"left",paddingLeft:16}}>Grupo</th>
                              <th style={{textAlign:"left"}}>Equipo</th>
                              <th>PJ</th><th>G</th><th>E</th><th>P</th>
                              <th>GF</th><th>GC</th><th>DIF</th>
                              <th style={{color:"var(--accent)"}}>PTS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bt.map((t,i)=>(
                              <tr key={t.name} className={i<8?"table-row-promoted-thirds":""} style={{opacity:i>=8?0.55:1}}>
                                <td style={{color:"var(--accent)",fontWeight:600,paddingLeft:16}}>{t.group}</td>
                                <td style={{fontWeight:500}}>
                                  <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
                                    {i<8&&<span className="promotion-dot" style={{background:"var(--accent)"}}/>}
                                    <span className="flag-emoji">{gf(t.name)}</span> {t.name}
                                  </span>
                                </td>
                                <td className="text-center">{t.pj}</td>
                                <td className="text-center">{t.g}</td>
                                <td className="text-center">{t.e}</td>
                                <td className="text-center">{t.p}</td>
                                <td className="text-center">{t.gf}</td>
                                <td className="text-center">{t.gc}</td>
                                <td className="text-center" style={{color:t.gf-t.gc>0?"var(--green)":t.gf-t.gc<0?"var(--red)":"var(--text-dim)"}}>{t.gf-t.gc>0?"+":""}{t.gf-t.gc}</td>
                                <td className="text-center text-bebas" style={{color:"var(--accent)",fontWeight:700,fontSize:18}}>{t.pts}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ):null;
                })()}
              </div>
            ):(
              <div className="predictions-list-view fade-in">
                <div className="info-banner">
                  <span className="banner-icon">🔒</span>
                  <div className="banner-text">Una vez enviada, la predicción <strong className="text-highlight">NO se puede cambiar</strong>.</div>
                </div>
                <GF gs={GS} sel={grp} set={setGrp}/>
                <div className="fixtures-list">
                  {fm.map(match=>{
                    const pred=getPred(match.id), locked=!!pred, draft=drafts[match.id]||{}, finished=match.is_finished;
                    let pts=null; if(finished&&pred) pts=calcPts(pred.pred_home,pred.pred_away,match.score_home,match.score_away);
                    
                    let matchCardClass = "match-card";
                    if(finished){
                      if(pts===5) matchCardClass += " match-card-exact";
                      else if(pts===3) matchCardClass += " match-card-winner";
                      else matchCardClass += " match-card-incorrect";
                    } else if(locked){
                      matchCardClass += " match-card-locked";
                    }
                    
                    return(
                      <div key={match.id} className={matchCardClass}>
                        <div className="match-card-header">
                          <span className="match-meta">Grupo {match.group_name} · #{match.match_number} · {match.match_date}</span>
                          {finished&&pts!==null&&<span className={`badge ${pts===5?'badge-success':pts===3?'badge-info':'badge-danger'} badge-pts-earned`}>{pts===5?"🎯 EXACTO +5":pts===3?"✓ +3":"✗ 0"}</span>}
                          {!finished&&locked&&<span className="badge badge-success">🔒 Enviado</span>}
                          {!finished&&!locked&&!draft.home&&!draft.away&&<span className="badge badge-neutral">Pendiente</span>}
                          {!finished&&!locked&&(draft.home!==undefined||draft.away!==undefined)&&<span className="badge badge-warning">Sin guardar</span>}
                        </div>
                        <div className="match-fixture-row">
                          <div className="team-home">
                            <span className="team-name">{match.team_home}</span>
                            <span className="flag-emoji large">{gf(match.team_home)}</span>
                          </div>
                          <div className="score-inputs-container">
                            {locked?(
                              <div className="locked-prediction text-bebas">
                                <span className="predicted-score">{pred.pred_home}</span>
                                <span className="score-separator">:</span>
                                <span className="predicted-score">{pred.pred_away}</span>
                              </div>
                            ):(
                              <div className="inputs-row">
                                <input type="number" min="0" max="20" value={draft.home??""} onChange={e=>updDraft(match.id,"home",e.target.value)} className="score-box" placeholder="-"/>
                                <span className="score-separator">:</span>
                                <input type="number" min="0" max="20" value={draft.away??""} onChange={e=>updDraft(match.id,"away",e.target.value)} className="score-box" placeholder="-"/>
                              </div>
                            )}
                          </div>
                          <div className="team-away">
                            <span className="flag-emoji large">{gf(match.team_away)}</span>
                            <span className="team-name">{match.team_away}</span>
                          </div>
                        </div>
                        {finished&&<div className="real-score-row">Resultado real: <span className="real-score-accent text-bebas">{match.score_home} - {match.score_away}</span></div>}
                        {!locked&&draft.home!==undefined&&draft.home!==""&&draft.away!==undefined&&draft.away!==""&&(
                          <div className="match-card-actions">
                            <button onClick={()=>submitOne(match.id)} className="btn-success btn-sm-action">Enviar 🔒</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!fm.length&&<div className="no-data">No hay partidos en este grupo</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GROUPS STANDINGS */}
        {view==="groups"&&(
          <div className="view-groups fade-in">
            <h3 className="section-title text-bebas">⚽ TABLA DE GRUPOS</h3>
            <p className="section-subtitle">Posiciones actualizadas en base a los resultados reales</p>
            {["A","B","C","D","E","F","G","H","I","J","K","L"].map(g=>{
              const standings = getGroupStandings(g);
              const groupFinished = matches.filter(m=>m.group_name===g&&m.is_finished).length;
              return(
                <div key={g} className="glass-card group-standings-card">
                  <div className="group-header">
                    <span className="group-title text-bebas">GRUPO {g}</span>
                    <span className="group-status">{groupFinished}/6 partidos finalizados</span>
                  </div>
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th style={{textAlign:"left",width:"40%"}}>Equipo</th>
                          <th>PJ</th><th>G</th><th>E</th><th>P</th>
                          <th>GF</th><th>GC</th><th>DIF</th>
                          <th style={{color:"var(--accent)"}}>PTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((t,i)=>(
                          <tr key={t.name} className={i<2?"table-row-promoted":""}>
                            <td style={{fontWeight:500}}>
                              <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                                {i<2&&<span className="promotion-dot" style={{background:"var(--green)"}}/>}
                                <span className="flag-emoji">{gf(t.name)}</span> {t.name}
                              </span>
                            </td>
                            <td className="text-center">{t.pj}</td><td className="text-center">{t.g}</td><td className="text-center">{t.e}</td><td className="text-center">{t.p}</td>
                            <td className="text-center">{t.gf}</td><td className="text-center">{t.gc}</td>
                            <td className="text-center" style={{color:t.gf-t.gc>0?"var(--green)":t.gf-t.gc<0?"var(--red)":"var(--text-dim)"}}>{t.gf-t.gc>0?"+":""}{t.gf-t.gc}</td>
                            <td className="text-center text-bebas" style={{color:"var(--accent)",fontWeight:700,fontSize:18}}>{t.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {groupFinished>0&&<div className="group-footer-info">🟢 Clasifican los 2 primeros + mejores terceros</div>}
                </div>
              );
            })}
            {/* Best third-placed teams (real) */}
            {(()=>{
              const bt=getBestThirds(getGroupStandings);
              return bt.length>0?(
                <div className="glass-card group-standings-card">
                  <div className="group-header">
                    <span className="group-title text-bebas">MEJORES TERCEROS</span>
                    <span className="group-status">Clasifican los 8 mejores</span>
                  </div>
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th style={{textAlign:"left",paddingLeft:16}}>Grupo</th>
                          <th style={{textAlign:"left"}}>Equipo</th>
                          <th>PJ</th><th>G</th><th>E</th><th>P</th>
                          <th>GF</th><th>GC</th><th>DIF</th>
                          <th style={{color:"var(--accent)"}}>PTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bt.map((t,i)=>(
                          <tr key={t.name} className={i<8?"table-row-promoted-thirds":""} style={{opacity:i>=8?0.55:1}}>
                            <td style={{color:"var(--accent)",fontWeight:600,paddingLeft:16}}>{t.group}</td>
                            <td style={{fontWeight:500}}>
                              <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
                                {i<8&&<span className="promotion-dot" style={{background:"var(--green)"}}/>}
                                <span className="flag-emoji">{gf(t.name)}</span> {t.name}
                              </span>
                            </td>
                            <td className="text-center">{t.pj}</td><td className="text-center">{t.g}</td><td className="text-center">{t.e}</td><td className="text-center">{t.p}</td>
                            <td className="text-center">{t.gf}</td><td className="text-center">{t.gc}</td>
                            <td className="text-center" style={{color:t.gf-t.gc>0?"var(--green)":t.gf-t.gc<0?"var(--red)":"var(--text-dim)"}}>{t.gf-t.gc>0?"+":""}{t.gf-t.gc}</td>
                            <td className="text-center text-bebas" style={{color:"var(--accent)",fontWeight:700,fontSize:18}}>{t.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ):null;
            })()}
          </div>
        )}

        {/* RESULTS */}
        {view==="results"&&(
          <div className="view-results fade-in">
            <h3 className="section-title text-bebas">📊 RESULTADOS</h3>
            <GF gs={GS} sel={grp} set={setGrp}/>
            <div className="fixtures-list">
              {fm.map(m=>{
                let cardClass = "match-card";
                if(m.is_finished){
                  cardClass += " match-card-locked";
                } else {
                  cardClass += " match-card-finished opacity-60";
                }
                
                return(
                  <div key={m.id} className={cardClass}>
                    <div className="match-card-header">
                      <span className="match-meta">Grupo {m.group_name} · #{m.match_number} · {m.match_date}</span>
                      {m.is_finished ? (
                        <span className="badge badge-success">✓ FINAL</span>
                      ) : (
                        <span className="badge badge-neutral">Pendiente</span>
                      )}
                    </div>
                    <div className="match-fixture-row">
                      <div className="team-home">
                        <span className="team-name">{m.team_home}</span>
                        <span className="flag-emoji large">{gf(m.team_home)}</span>
                      </div>
                      <div className="score-inputs-container">
                        <div className="locked-prediction text-bebas">
                          {m.is_finished ? (
                            <>
                              <span className="predicted-score" style={{color:"var(--accent)"}}>{m.score_home}</span>
                              <span className="score-separator">-</span>
                              <span className="predicted-score" style={{color:"var(--accent)"}}>{m.score_away}</span>
                            </>
                          ) : (
                            <span className="predicted-score" style={{color:"var(--text-dim)"}}>vs</span>
                          )}
                        </div>
                      </div>
                      <div className="team-away">
                        <span className="flag-emoji large">{gf(m.team_away)}</span>
                        <span className="team-name">{m.team_away}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!fm.length&&<div className="no-data">No hay partidos en este grupo</div>}
            </div>
          </div>
        )}

        {/* TRANSPARENCY - ALL PREDICTIONS */}
        {view==="transparency"&&(
          <div className="view-transparency fade-in">
            <h3 className="section-title text-bebas">👁️ QUINIELAS DE TODOS</h3>
            <p className="section-subtitle">Consultá las predicciones de cada participante. Solo lectura.</p>
            <div className="participant-chips-container">
              {parts.map(p=>{
                const pp = allPreds.filter(pr=>pr.participant_id===p.id);
                const isActive = selectedPart?.id===p.id;
                return(
                  <button key={p.id} onClick={()=>setSelectedPart(isActive?null:p)} className={`chip ${isActive?'active':''}`}>
                    <span className="chip-name">{p.name}{p.id===user.id?" (tú)":""}</span>
                    <span className="chip-count">{pp.length} pred.</span>
                  </button>
                );
              })}
            </div>
            {selectedPart ? (()=>{
              const partPreds = allPreds.filter(pr=>pr.participant_id===selectedPart.id);
              const totalPts = partPreds.reduce((s,pr)=>s+(pr.points_earned||0),0);
              const exactos = partPreds.filter(pr=>pr.points_earned===5).length;
              const aciertos = partPreds.filter(pr=>pr.points_earned===3).length;
              return(
                <div className="participant-dashboard fade-in">
                  <div className="glass-card summary-dashboard">
                    <div className="summary-dashboard-item">
                      <div className="dashboard-val text-bebas" style={{color:"var(--accent)"}}>{totalPts}</div>
                      <div className="dashboard-lbl">PTS</div>
                    </div>
                    <div className="summary-dashboard-item">
                      <div className="dashboard-val text-bebas" style={{color:"var(--green)"}}>{exactos}</div>
                      <div className="dashboard-lbl">EXACTOS</div>
                    </div>
                    <div className="summary-dashboard-item">
                      <div className="dashboard-val text-bebas" style={{color:"var(--blue)"}}>{aciertos}</div>
                      <div className="dashboard-lbl">ACIERTOS</div>
                    </div>
                    <div className="summary-dashboard-item">
                      <div className="dashboard-val text-bebas">{partPreds.length}</div>
                      <div className="dashboard-lbl">PREDICCIONES</div>
                    </div>
                  </div>
                  <GF gs={GS} sel={grp} set={setGrp}/>
                  <div className="fixtures-list">
                    {fm.map(match=>{
                      const pred = partPreds.find(pr=>pr.match_id===match.id);
                      if(!pred) return(
                        <div key={match.id} className="match-card match-card-finished opacity-60">
                          <div className="match-card-header">
                            <span className="match-meta">Grupo {match.group_name} · #{match.match_number}</span>
                            <span className="badge badge-neutral">Sin predicción</span>
                          </div>
                          <div className="match-fixture-row">
                            <div className="team-home">
                              <span className="team-name" style={{color:"var(--text-dim)"}}>{match.team_home}</span>
                              <span className="flag-emoji large" style={{opacity:0.5}}>{gf(match.team_home)}</span>
                            </div>
                            <div className="score-inputs-container">
                              <div className="locked-prediction text-bebas" style={{color:"var(--text-muted)"}}>- : -</div>
                            </div>
                            <div className="team-away">
                              <span className="flag-emoji large" style={{opacity:0.5}}>{gf(match.team_away)}</span>
                              <span className="team-name" style={{color:"var(--text-dim)"}}>{match.team_away}</span>
                            </div>
                          </div>
                        </div>
                      );
                      const finished = match.is_finished;
                      const pts = finished ? calcPts(pred.pred_home,pred.pred_away,match.score_home,match.score_away) : null;
                      
                      let matchCardClass = "match-card";
                      if(finished){
                        if(pts===5) matchCardClass += " match-card-exact";
                        else if(pts===3) matchCardClass += " match-card-winner";
                        else matchCardClass += " match-card-incorrect";
                      } else {
                        matchCardClass += " match-card-locked";
                      }

                      return(
                        <div key={match.id} className={matchCardClass}>
                          <div className="match-card-header">
                            <span className="match-meta">Grupo {match.group_name} · #{match.match_number} · {match.match_date}</span>
                            {finished&&pts!==null&&<span className={`badge ${pts===5?'badge-success':pts===3?'badge-info':'badge-danger'} badge-pts-earned`}>{pts===5?"🎯 +5":pts===3?"✓ +3":"✗ 0"}</span>}
                            {!finished&&<span className="badge badge-success">🔒 Enviado</span>}
                          </div>
                          <div className="match-fixture-row">
                            <div className="team-home">
                              <span className="team-name">{match.team_home}</span>
                              <span className="flag-emoji large">{gf(match.team_home)}</span>
                            </div>
                            <div className="score-inputs-container">
                              <div className="locked-prediction text-bebas">
                                <span className="predicted-score">{pred.pred_home}</span>
                                <span className="score-separator">:</span>
                                <span className="predicted-score">{pred.pred_away}</span>
                              </div>
                            </div>
                            <div className="team-away">
                              <span className="flag-emoji large">{gf(match.team_away)}</span>
                              <span className="team-name">{match.team_away}</span>
                            </div>
                          </div>
                          {finished&&<div className="real-score-row">Resultado real: <span className="real-score-accent text-bebas">{match.score_home} - {match.score_away}</span></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })():(
              <div className="no-selection-banner glass-card text-center">
                <div style={{fontSize:44,marginBottom:12}}>👆</div>
                <div className="text-dim font-medium">Seleccioná un participante para ver sus predicciones</div>
              </div>
            )}
          </div>
        )}

        {/* ADMIN */}
        {view==="admin"&&user.is_admin&&(
          <div className="view-admin fade-in">
            <h3 className="section-title text-bebas">👑 PANEL DE ADMIN</h3>
            <p className="section-subtitle">Ingresá los resultados reales. Los puntos se recalculan para todos.</p>
            <div className="glass-card admin-summary-card">
              <h4 className="admin-subtitle text-bebas">PARTICIPANTES ({parts.length})</h4>
              <div className="admin-users-list">
                {parts.map(p=>{
                  const pp=allPreds.filter(pr=>pr.participant_id===p.id);
                  return(
                    <div key={p.id} className="admin-user-row">
                      <span className="admin-user-name">{p.name}{p.is_admin?" 👑":""}</span>
                      <span className="admin-user-meta">{pp.length} pred.</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <GF gs={GS} sel={grp} set={setGrp}/>
            <div className="fixtures-list">
              {fm.map(m=><AMC key={m.id} m={m} onU={updResult}/>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GF({gs,sel,set}){
  return(
    <div className="group-filters">
      {gs.map(g=>(
        <button 
          key={g} 
          onClick={()=>set(g)} 
          className={`btn-tab-pill ${sel===g?'active':''}`}
        >
          {g==="ALL"?"Todos":g}
        </button>
      ))}
    </div>
  );
}

function AMC({m,onU}){
  const [h,sH]=useState(m.score_home!==null?String(m.score_home):"");
  const [a,sA]=useState(m.score_away!==null?String(m.score_away):"");
  
  let cardClass = "match-card";
  if (m.is_finished) {
    cardClass += " match-card-exact";
  }

  return(
    <div className={cardClass}>
      <div className="match-card-header">
        <span className="match-meta">Grupo {m.group_name} · #{m.match_number} · {m.match_date}</span>
        {m.is_finished&&<span className="badge badge-success">✓ FINAL</span>}
      </div>
      <div className="match-fixture-row">
        <div className="team-home">
          <span className="team-name">{m.team_home}</span>
          <span className="flag-emoji large">{gf(m.team_home)}</span>
        </div>
        <div className="score-inputs-container">
          <div className="inputs-row">
            <input type="number" min="0" value={h} onChange={e=>sH(e.target.value)} className="score-box" placeholder="-"/>
            <span className="score-separator">:</span>
            <input type="number" min="0" value={a} onChange={e=>sA(e.target.value)} className="score-box" placeholder="-"/>
          </div>
        </div>
        <div className="team-away">
          <span className="flag-emoji large">{gf(m.team_away)}</span>
          <span className="team-name">{m.team_away}</span>
        </div>
      </div>
      <div className="match-card-actions">
        <button onClick={()=>{if(h!==""&&a!=="")onU(m.id,h,a);}} className="btn-success btn-sm-action">{m.is_finished?"Actualizar resultado":"Registrar resultado"}</button>
      </div>
    </div>
  );
}

function Msg({t,children}){
  const alertClass = t==="e"?"alert-box alert-danger":"alert-box alert-success";
  return(
    <div className={alertClass}>
      <span className="alert-icon">{t==="e"?"⚠️":"✓"}</span>
      <span className="alert-message">{children}</span>
    </div>
  );
}
