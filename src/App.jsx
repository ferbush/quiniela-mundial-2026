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

const C = { bg:"#0a0e1a",card:"#111827",accent:"#f59e0b",accentDk:"#d97706",green:"#10b981",red:"#ef4444",blue:"#3b82f6",text:"#f1f5f9",dim:"#94a3b8",bdr:"#1e293b",gold:"#fbbf24",silver:"#9ca3af",bronze:"#cd7f32",srf:"#0f172a" };
const fonts = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');`;

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

  // Group standings calculation
  const getGroupStandings = (groupName) => {
    const groupMatches = matches.filter(m => m.group_name === groupName && m.is_finished);
    const teams = {};
    // Get all teams in this group (from all matches, not just finished)
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

  if(loading) return(<div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><style>{fonts}</style><div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>⚽</div><div style={{color:C.accent,fontFamily:"Bebas Neue",fontSize:24,letterSpacing:2}}>CARGANDO...</div></div></div>);

  // LOGIN
  if(!user) return(
    <div style={{background:`linear-gradient(135deg,${C.bg} 0%,#1a1040 100%)`,minHeight:"100vh",fontFamily:"DM Sans"}}>
      <style>{fonts}</style>
      <div style={{maxWidth:420,margin:"0 auto",padding:"40px 20px"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:64,marginBottom:8}}>🏆</div>
          <h1 style={{fontFamily:"Bebas Neue",fontSize:42,color:C.accent,letterSpacing:3,margin:0}}>QUINIELA</h1>
          <h2 style={{fontFamily:"Bebas Neue",fontSize:28,color:C.text,letterSpacing:2,margin:0,fontWeight:400}}>MUNDIAL 2026</h2>
          <div style={{color:C.dim,fontSize:13,marginTop:12}}>🇺🇸 🇨🇦 🇲🇽 USA · Canadá · México</div>
        </div>
        {err&&<Msg t="e">{err}</Msg>}{ok&&<Msg t="s">{ok}</Msg>}
        {view!=="register"?(
          <div style={crd}>
            <h3 style={{color:C.text,margin:"0 0 20px",fontWeight:600}}>Iniciar Sesión</h3>
            <input placeholder="Tu nombre" value={lName} onChange={e=>setLName(e.target.value)} style={inp}/>
            <input placeholder="PIN (4 dígitos)" type="password" maxLength={4} value={lPin} onChange={e=>setLPin(e.target.value)} style={inp} onKeyDown={e=>e.key==="Enter"&&login()}/>
            <button onClick={login} style={btnP}>Entrar</button>
            <div style={{textAlign:"center",marginTop:16}}><span style={{color:C.dim,fontSize:14}}>¿Primera vez? </span><button onClick={()=>setView("register")} style={lnk}>Registrate</button></div>
          </div>
        ):(
          <div style={crd}>
            <h3 style={{color:C.text,margin:"0 0 20px",fontWeight:600}}>Registro</h3>
            <input placeholder="Tu nombre (único)" value={rName} onChange={e=>setRName(e.target.value)} style={inp}/>
            <input placeholder="PIN de 4 dígitos" type="password" maxLength={4} value={rPin} onChange={e=>setRPin(e.target.value)} style={inp} onKeyDown={e=>e.key==="Enter"&&register()}/>
            <button onClick={register} style={btnP}>Registrarme</button>
            <div style={{textAlign:"center",marginTop:16}}><span style={{color:C.dim,fontSize:14}}>¿Ya tenés cuenta? </span><button onClick={()=>setView("ranking")} style={lnk}>Iniciá sesión</button></div>
          </div>
        )}
        <div style={{textAlign:"center",marginTop:24,color:C.dim,fontSize:12,lineHeight:1.8}}>
          ⚽ Acertar ganador/empate = <span style={{color:C.blue,fontWeight:600}}>3 pts</span><br/>
          🎯 Marcador exacto = <span style={{color:C.green,fontWeight:600}}>5 pts</span><br/>
          🔒 Una vez enviada, la predicción se bloquea
        </div>
      </div>
    </div>
  );

  // MAIN
  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"DM Sans"}}>
      <style>{fonts}</style>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,#1a1040 0%,${C.bg} 100%)`,borderBottom:`1px solid ${C.bdr}`,padding:"14px 20px"}}>
        <div style={{maxWidth:800,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:26}}>🏆</span>
            <div>
              <div style={{fontFamily:"Bebas Neue",fontSize:20,color:C.accent,letterSpacing:2,lineHeight:1}}>QUINIELA MUNDIAL 2026</div>
              <div style={{color:C.dim,fontSize:12}}>{user.name}{user.is_admin?" 👑 Admin":""}</div>
            </div>
          </div>
          <button onClick={()=>{setUser(null);setView("ranking");setPreds([]);setDrafts({});}} style={{background:"none",border:`1px solid ${C.bdr}`,color:C.dim,padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:12}}>Salir</button>
        </div>
      </div>
      {/* Nav */}
      <div style={{background:C.srf,borderBottom:`1px solid ${C.bdr}`,padding:"0 20px",overflowX:"auto"}}>
        <div style={{maxWidth:800,margin:"0 auto",display:"flex",gap:0,minWidth:"max-content"}}>
          {[{id:"ranking",l:"🏅 Ranking",s:true},{id:"predictions",l:"📝 Predicciones",s:true},{id:"groups",l:"⚽ Grupos",s:true},{id:"results",l:"📊 Resultados",s:true},{id:"admin",l:"👑 Admin",s:user.is_admin}].filter(t=>t.s).map(tab=>(
            <button key={tab.id} onClick={()=>setView(tab.id)} style={{background:view===tab.id?C.accent+"22":"transparent",border:"none",borderBottom:view===tab.id?`2px solid ${C.accent}`:"2px solid transparent",color:view===tab.id?C.accent:C.dim,padding:"12px 16px",cursor:"pointer",fontSize:14,fontWeight:view===tab.id?600:400,whiteSpace:"nowrap"}}>{tab.l}</button>
          ))}
        </div>
      </div>
      <div style={{maxWidth:800,margin:"0 auto",padding:"0 20px"}}>{err&&<Msg t="e">{err}</Msg>}{ok&&<Msg t="s">{ok}</Msg>}</div>
      <div style={{maxWidth:800,margin:"0 auto",padding:"20px 20px 40px"}}>

        {/* RANKING */}
        {view==="ranking"&&(<div>
          <div style={{...crd,marginBottom:20,padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{color:C.dim,fontSize:13}}>Progreso del torneo</span>
              <span style={{color:C.accent,fontSize:13,fontWeight:600}}>{fin}/{matches.length} partidos</span>
            </div>
            <div style={{background:C.bdr,borderRadius:10,height:8,overflow:"hidden"}}>
              <div style={{background:`linear-gradient(90deg,${C.accent},${C.green})`,width:`${matches.length>0?(fin/matches.length)*100:0}%`,height:"100%",borderRadius:10,transition:"width 0.5s"}}/>
            </div>
          </div>
          <h3 style={{color:C.text,fontFamily:"Bebas Neue",fontSize:24,letterSpacing:1,marginBottom:16}}>🏅 TABLA DE POSICIONES</h3>
          {ranking.map((p,i)=>(
            <div key={p.id} style={{background:i===0&&p.pts>0?`linear-gradient(135deg,${C.gold}15,${C.card})`:C.card,borderRadius:12,padding:"14px 16px",marginBottom:8,border:`1px solid ${i===0&&p.pts>0?C.gold+"44":C.bdr}`,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Bebas Neue",fontSize:18,flexShrink:0,background:i===0?C.gold+"33":i===1?C.silver+"33":i===2?C.bronze+"33":C.bdr,color:i===0?C.gold:i===1?C.silver:i===2?C.bronze:C.dim}}>{i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:C.text,fontWeight:600,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}{p.id===user.id?<span style={{color:C.accent,fontSize:12}}> (tú)</span>:""}</div>
                <div style={{color:C.dim,fontSize:12}}>{p.ex} exactos · {p.ac} aciertos · {p.tp} pred.</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:"Bebas Neue",fontSize:28,color:i===0&&p.pts>0?C.gold:C.accent}}>{p.pts}</div>
                <div style={{color:C.dim,fontSize:11}}>PTS</div>
              </div>
            </div>
          ))}
          {!ranking.length&&<div style={{textAlign:"center",color:C.dim,padding:40}}>Sin participantes aún</div>}
        </div>)}

        {/* PREDICTIONS */}
        {view==="predictions"&&(<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <h3 style={{color:C.text,fontFamily:"Bebas Neue",fontSize:24,letterSpacing:1,margin:0}}>📝 MIS PREDICCIONES</h3>
            {pendN>0&&<button onClick={submitAll} disabled={sending} style={{background:C.green,color:"#fff",border:"none",borderRadius:10,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:600,opacity:sending?0.5:1}}>{sending?"Enviando...":`Enviar todas (${pendN}) 🔒`}</button>}
          </div>
          <div style={{background:C.card,borderRadius:10,padding:"10px 14px",marginBottom:16,border:`1px solid ${C.bdr}`}}>
            <div style={{color:C.dim,fontSize:12,lineHeight:1.6}}>🔒 <strong style={{color:C.accent}}>Importante:</strong> Una vez enviada, la predicción NO se puede cambiar.</div>
          </div>
          <GF gs={GS} sel={grp} set={setGrp}/>
          {fm.map(match=>{
            const pred=getPred(match.id), locked=!!pred, draft=drafts[match.id]||{}, finished=match.is_finished;
            let pts=null; if(finished&&pred) pts=calcPts(pred.pred_home,pred.pred_away,match.score_home,match.score_away);
            const bg=finished?(pts===5?C.green+"11":pts===3?C.blue+"11":pred?C.red+"11":C.card):C.card;
            const bd=finished?(pts===5?C.green+"44":pts===3?C.blue+"44":pred?C.red+"44":C.bdr):locked?C.green+"33":C.bdr;
            return(
              <div key={match.id} style={{background:bg,borderRadius:12,padding:16,marginBottom:8,border:`1px solid ${bd}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{color:C.dim,fontSize:12}}>Grupo {match.group_name} · #{match.match_number} · {match.match_date}</span>
                  {finished&&pts!==null&&<span style={{background:(pts===5?C.green:pts===3?C.blue:C.red)+"33",color:pts===5?C.green:pts===3?C.blue:C.red,padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>{pts===5?"🎯 EXACTO +5":pts===3?"✓ +3":"✗ 0"}</span>}
                  {!finished&&locked&&<span style={{color:C.green,fontSize:11,fontWeight:600}}>🔒 Enviado</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <div style={{textAlign:"right",flex:1,minWidth:0}}><div style={{color:C.text,fontSize:14,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{gf(match.team_home)} {match.team_home}</div></div>
                  {locked?(<div style={{fontFamily:"Bebas Neue",fontSize:24,color:C.accent,minWidth:60,textAlign:"center"}}>{pred.pred_home} - {pred.pred_away}</div>
                  ):(<div style={{display:"flex",alignItems:"center",gap:4}}>
                    <input type="number" min="0" max="20" value={draft.home??""} onChange={e=>updDraft(match.id,"home",e.target.value)} style={si} placeholder="-"/>
                    <span style={{color:C.dim,fontWeight:700,fontSize:16}}>:</span>
                    <input type="number" min="0" max="20" value={draft.away??""} onChange={e=>updDraft(match.id,"away",e.target.value)} style={si} placeholder="-"/>
                  </div>)}
                  <div style={{textAlign:"left",flex:1,minWidth:0}}><div style={{color:C.text,fontSize:14,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{match.team_away} {gf(match.team_away)}</div></div>
                </div>
                {finished&&<div style={{textAlign:"center",marginTop:8,color:C.dim,fontSize:12}}>Real: <span style={{color:C.accent,fontWeight:700}}>{match.score_home} - {match.score_away}</span></div>}
                {!locked&&draft.home!==undefined&&draft.home!==""&&draft.away!==undefined&&draft.away!==""&&(
                  <div style={{textAlign:"center",marginTop:10}}><button onClick={()=>submitOne(match.id)} style={{background:C.accent,color:C.bg,border:"none",borderRadius:8,padding:"6px 18px",cursor:"pointer",fontSize:13,fontWeight:600}}>Enviar 🔒</button></div>
                )}
              </div>
            );
          })}
        </div>)}

        {/* GROUPS STANDINGS */}
        {view==="groups"&&(<div>
          <h3 style={{color:C.text,fontFamily:"Bebas Neue",fontSize:24,letterSpacing:1,marginBottom:16}}>⚽ TABLA DE GRUPOS</h3>
          <p style={{color:C.dim,fontSize:13,marginBottom:20}}>Posiciones actualizadas en base a los resultados reales</p>
          {["A","B","C","D","E","F","G","H","I","J","K","L"].map(g=>{
            const standings = getGroupStandings(g);
            const groupFinished = matches.filter(m=>m.group_name===g&&m.is_finished).length;
            return(
              <div key={g} style={{...crd,marginBottom:16,padding:0,overflow:"hidden"}}>
                <div style={{background:C.accent+"18",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontFamily:"Bebas Neue",fontSize:18,color:C.accent,letterSpacing:2}}>GRUPO {g}</span>
                  <span style={{color:C.dim,fontSize:11}}>{groupFinished}/6 partidos</span>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:480}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${C.bdr}`}}>
                        <th style={{...th,textAlign:"left",paddingLeft:16,width:"40%"}}>Equipo</th>
                        <th style={th}>PJ</th><th style={th}>G</th><th style={th}>E</th><th style={th}>P</th>
                        <th style={th}>GF</th><th style={th}>GC</th><th style={th}>DIF</th>
                        <th style={{...th,color:C.accent}}>PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((t,i)=>(
                        <tr key={t.name} style={{borderBottom:`1px solid ${C.bdr}`,background:i<2?C.green+"08":"transparent"}}>
                          <td style={{padding:"10px 16px",color:C.text,fontSize:14,fontWeight:500}}>
                            <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                              {i<2&&<span style={{width:6,height:6,borderRadius:"50%",background:C.green,display:"inline-block",flexShrink:0}}/>}
                              {gf(t.name)} {t.name}
                            </span>
                          </td>
                          <td style={td}>{t.pj}</td><td style={td}>{t.g}</td><td style={td}>{t.e}</td><td style={td}>{t.p}</td>
                          <td style={td}>{t.gf}</td><td style={td}>{t.gc}</td>
                          <td style={{...td,color:t.gf-t.gc>0?C.green:t.gf-t.gc<0?C.red:C.dim}}>{t.gf-t.gc>0?"+":""}{t.gf-t.gc}</td>
                          <td style={{...td,color:C.accent,fontWeight:700,fontFamily:"Bebas Neue",fontSize:18}}>{t.pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {groupFinished>0&&<div style={{padding:"6px 16px 10px",fontSize:11,color:C.dim}}>🟢 Clasifican los 2 primeros</div>}
              </div>
            );
          })}
        </div>)}

        {/* RESULTS */}
        {view==="results"&&(<div>
          <h3 style={{color:C.text,fontFamily:"Bebas Neue",fontSize:24,letterSpacing:1,marginBottom:16}}>📊 RESULTADOS</h3>
          <GF gs={GS} sel={grp} set={setGrp}/>
          {fm.map(m=>(
            <div key={m.id} style={{background:m.is_finished?C.card:C.srf,borderRadius:12,padding:14,marginBottom:8,border:`1px solid ${m.is_finished?C.green+"33":C.bdr}`,opacity:m.is_finished?1:0.6}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{color:C.dim,fontSize:12}}>Grupo {m.group_name} · #{m.match_number} · {m.match_date}</span>
                <span style={{color:m.is_finished?C.green:C.dim,fontSize:11,fontWeight:600}}>{m.is_finished?"✓ FINAL":"Pendiente"}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16}}>
                <div style={{textAlign:"right",flex:1}}><span style={{color:C.text,fontSize:14,fontWeight:500}}>{gf(m.team_home)} {m.team_home}</span></div>
                <div style={{fontFamily:"Bebas Neue",fontSize:28,color:m.is_finished?C.accent:C.dim,minWidth:70,textAlign:"center"}}>{m.is_finished?`${m.score_home} - ${m.score_away}`:"vs"}</div>
                <div style={{textAlign:"left",flex:1}}><span style={{color:C.text,fontSize:14,fontWeight:500}}>{m.team_away} {gf(m.team_away)}</span></div>
              </div>
            </div>
          ))}
        </div>)}

        {/* ADMIN */}
        {view==="admin"&&user.is_admin&&(<div>
          <h3 style={{color:C.text,fontFamily:"Bebas Neue",fontSize:24,letterSpacing:1,marginBottom:8}}>👑 PANEL DE ADMIN</h3>
          <p style={{color:C.dim,fontSize:13,marginBottom:20}}>Ingresá los resultados reales. Los puntos se recalculan para todos.</p>
          <div style={{...crd,marginBottom:20,padding:16}}>
            <h4 style={{color:C.accent,margin:"0 0 12px",fontFamily:"Bebas Neue",fontSize:18,letterSpacing:1}}>PARTICIPANTES ({parts.length})</h4>
            {parts.map(p=>{const pp=allPreds.filter(pr=>pr.participant_id===p.id);return(
              <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.bdr}`}}>
                <span style={{color:C.text,fontSize:14}}>{p.name}{p.is_admin?" 👑":""}</span>
                <span style={{color:C.dim,fontSize:12}}>{pp.length} pred.</span>
              </div>
            );})}
          </div>
          <GF gs={GS} sel={grp} set={setGrp}/>
          {fm.map(m=><AMC key={m.id} m={m} onU={updResult}/>)}
        </div>)}
      </div>
    </div>
  );
}

function GF({gs,sel,set}){return(<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>{gs.map(g=><button key={g} onClick={()=>set(g)} style={{background:sel===g?C.accent:C.card,color:sel===g?C.bg:C.dim,border:`1px solid ${sel===g?C.accent:C.bdr}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:600}}>{g==="ALL"?"Todos":g}</button>)}</div>);}

function AMC({m,onU}){
  const [h,sH]=useState(m.score_home!==null?String(m.score_home):"");
  const [a,sA]=useState(m.score_away!==null?String(m.score_away):"");
  return(
    <div style={{background:m.is_finished?C.green+"11":C.card,borderRadius:12,padding:16,marginBottom:8,border:`1px solid ${m.is_finished?C.green+"44":C.bdr}`}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{color:C.dim,fontSize:12}}>Grupo {m.group_name} · #{m.match_number} · {m.match_date}</span>
        {m.is_finished&&<span style={{color:C.green,fontSize:12,fontWeight:600}}>✓ FINAL</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <div style={{textAlign:"right",flex:1}}><span style={{color:C.text,fontSize:14}}>{gf(m.team_home)} {m.team_home}</span></div>
        <input type="number" min="0" value={h} onChange={e=>sH(e.target.value)} style={si} placeholder="-"/>
        <span style={{color:C.dim,fontWeight:700}}>:</span>
        <input type="number" min="0" value={a} onChange={e=>sA(e.target.value)} style={si} placeholder="-"/>
        <div style={{textAlign:"left",flex:1}}><span style={{color:C.text,fontSize:14}}>{m.team_away} {gf(m.team_away)}</span></div>
      </div>
      <div style={{textAlign:"center",marginTop:10}}>
        <button onClick={()=>{if(h!==""&&a!=="")onU(m.id,h,a);}} style={{background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"6px 16px",cursor:"pointer",fontSize:13,fontWeight:600}}>{m.is_finished?"Actualizar":"Registrar resultado"}</button>
      </div>
    </div>
  );
}

function Msg({t,children}){const bg=t==="e"?C.red:C.green;return(<div style={{background:bg+"22",border:`1px solid ${bg}`,color:bg,padding:"10px 16px",borderRadius:8,marginTop:12,fontSize:14}}>{children}</div>);}

const inp={width:"100%",padding:"12px 16px",borderRadius:10,border:`1px solid ${C.bdr}`,background:C.srf,color:C.text,fontSize:15,marginBottom:12,outline:"none",boxSizing:"border-box",fontFamily:"DM Sans"};
const btnP={width:"100%",padding:"12px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.accent},${C.accentDk})`,color:C.bg,fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans"};
const lnk={background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:14,fontWeight:600};
const crd={background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.bdr}`};
const si={width:44,height:40,textAlign:"center",borderRadius:8,border:`1px solid ${C.bdr}`,background:C.srf,color:C.text,fontSize:18,fontWeight:700,fontFamily:"Bebas Neue",outline:"none"};
const th={padding:"8px 6px",textAlign:"center",color:C.dim,fontSize:11,fontWeight:600,letterSpacing:1};
const td={padding:"10px 6px",textAlign:"center",color:C.text,fontSize:14};
