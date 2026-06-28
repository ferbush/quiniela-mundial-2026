import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://fkzdnkcybrbjmjandwgb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZremRua2N5YnJiam1qYW5kd2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTkxMjAsImV4cCI6MjA5NTQ3NTEyMH0.DBiwdL6x9-3gpzAW3ky-Yfz2i_AA7q-HuO8mSeMETJ8";

const hdrs = { "Content-Type":"application/json", apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}` };

async function supa(path, opts={}) {
  const { headers, ...restOpts } = opts;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers:{...hdrs,...headers}, ...restOpts });
  if(!r.ok) throw new Error(await r.text());
  const t = await r.text(); return t ? JSON.parse(t) : null;
}

async function supaAllPredictions() {
  let all = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const r = await supa(`predictions?select=*`, {
      headers: {
        Range: `${from}-${to}`
      }
    });
    if (!r || r.length === 0) break;
    all = all.concat(r);
    if (r.length < pageSize) break;
    page++;
  }
  return all;
}


const FL = {
  Mexico: "mx",
  "South Africa": "za",
  "South Korea": "kr",
  Czechia: "cz",
  Canada: "ca",
  "Bosnia-Herzegovina": "ba",
  Qatar: "qa",
  Switzerland: "ch",
  Brazil: "br",
  Morocco: "ma",
  Haiti: "ht",
  Scotland: "gb-sct",
  "United States": "us",
  Paraguay: "py",
  Australia: "au",
  Turkey: "tr",
  Germany: "de",
  Curacao: "cw",
  "Ivory Coast": "ci",
  Ecuador: "ec",
  Netherlands: "nl",
  Japan: "jp",
  Sweden: "se",
  Tunisia: "tn",
  Belgium: "be",
  Egypt: "eg",
  Iran: "ir",
  "New Zealand": "nz",
  Spain: "es",
  "Cape Verde": "cv",
  "Saudi Arabia": "sa",
  Uruguay: "uy",
  France: "fr",
  Senegal: "sn",
  Iraq: "iq",
  Norway: "no",
  Argentina: "ar",
  Algeria: "dz",
  Austria: "at",
  Jordan: "jo",
  Portugal: "pt",
  "DR Congo": "cd",
  Uzbekistan: "uz",
  Colombia: "co",
  England: "gb-eng",
  Croatia: "hr",
  Ghana: "gh",
  Panama: "pa"
};

const gf = t => {
  const code = FL[t];
  if (!code) return "🏳️";
  return (
    <img 
      src={`https://flagcdn.com/${code}.svg`} 
      alt={t} 
      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} 
    />
  );
};

const matchParents = {
  89: [74, 77],
  90: [73, 75],
  91: [76, 78],
  92: [79, 80],
  93: [83, 84],
  94: [81, 82],
  95: [86, 88],
  96: [85, 87],
  97: [89, 90],
  98: [93, 94],
  99: [91, 92],
  100: [95, 96],
  101: [97, 98],
  102: [99, 100],
  103: [101, 102],
  104: [101, 102]
};

const matchChildren = {
  73: { id: 90, slot: "home" },
  74: { id: 89, slot: "home" },
  75: { id: 90, slot: "away" },
  76: { id: 91, slot: "home" },
  77: { id: 89, slot: "away" },
  78: { id: 91, slot: "away" },
  79: { id: 92, slot: "home" },
  80: { id: 92, slot: "away" },
  81: { id: 94, slot: "home" },
  82: { id: 94, slot: "away" },
  83: { id: 93, slot: "home" },
  84: { id: 93, slot: "away" },
  85: { id: 96, slot: "home" },
  86: { id: 95, slot: "home" },
  87: { id: 96, slot: "away" },
  88: { id: 95, slot: "away" },
  89: { id: 97, slot: "home" },
  90: { id: 97, slot: "away" },
  91: { id: 99, slot: "home" },
  92: { id: 99, slot: "away" },
  93: { id: 98, slot: "home" },
  94: { id: 98, slot: "away" },
  95: { id: 100, slot: "home" },
  96: { id: 100, slot: "away" },
  97: { id: 101, slot: "home" },
  98: { id: 101, slot: "away" },
  99: { id: 102, slot: "home" },
  100: { id: 102, slot: "away" }
};

function getAncestors(mid) {
  const list = [];
  const queue = [...(matchParents[mid] || [])];
  while (queue.length > 0) {
    const curr = queue.shift();
    if (!list.includes(curr)) {
      list.push(curr);
      const parents = matchParents[curr] || [];
      queue.push(...parents);
    }
  }
  return list;
}

function decodeScore(val) {
  if (val === null || val === undefined || val === "") return null;
  const num = parseInt(val);
  if (isNaN(num)) return null;
  return num >= 100 ? num - 100 : num;
}

function decodePrediction(pred_home, pred_away) {
  if (pred_home === null || pred_away === null || pred_home === undefined || pred_away === undefined) return null;
  let h = parseInt(pred_home);
  let a = parseInt(pred_away);
  if (isNaN(h) || isNaN(a)) return null;
  let winnerIsHome = null;
  if (h >= 100) {
    h -= 100;
    winnerIsHome = true;
  } else if (a >= 100) {
    a -= 100;
    winnerIsHome = false;
  } else if (h > a) {
    winnerIsHome = true;
  } else if (h < a) {
    winnerIsHome = false;
  }
  return { homeScore: h, awayScore: a, winnerIsHome };
}

function getWinnerSide(hVal, aVal) {
  if (hVal === null || aVal === null || hVal === undefined || aVal === undefined) return null;
  const h = parseInt(hVal);
  const a = parseInt(aVal);
  if (h >= 100) return "home";
  if (a >= 100) return "away";
  if (h > a) return "home";
  if (h < a) return "away";
  return null;
}

function getRealWinnerTeam(m, matchesList) {
  if (!m || !m.is_finished || m.score_home === null || m.score_away === null) return null;
  if (m.score_home > m.score_away) return m.team_home;
  if (m.score_home < m.score_away) return m.team_away;
  
  const child = matchChildren[m.id];
  if (child) {
    const childMatch = matchesList.find(match => match.id === child.id);
    if (childMatch) {
      const expectedTeam = child.slot === "home" ? childMatch.team_home : childMatch.team_away;
      if (expectedTeam === m.team_home || expectedTeam === m.team_away) {
        return expectedTeam;
      }
    }
  }
  if (m.id === 101 || m.id === 102) {
    const finalMatch = matchesList.find(match => match.id === 104);
    if (finalMatch) {
      if (finalMatch.team_home === m.team_home || finalMatch.team_home === m.team_away) return finalMatch.team_home;
      if (finalMatch.team_away === m.team_home || finalMatch.team_away === m.team_away) return finalMatch.team_away;
    }
    const thirdMatch = matchesList.find(match => match.id === 103);
    if (thirdMatch) {
      const isHomeInThird = thirdMatch.team_home === m.team_home || thirdMatch.team_away === m.team_home;
      const isAwayInThird = thirdMatch.team_home === m.team_away || thirdMatch.team_away === m.team_away;
      if (isHomeInThird && !isAwayInThird) return m.team_away;
      if (isAwayInThird && !isHomeInThird) return m.team_home;
    }
  }
  return null;
}

function resolveRealResults(matchesList) {
  const resolved = {};
  for (let id = 1; id <= 72; id++) {
    const m = matchesList.find(match => match.id === id);
    if (m) {
      resolved[id] = {
        id: id,
        home: m.team_home,
        away: m.team_away,
        score_home: m.score_home,
        score_away: m.score_away,
        is_finished: m.is_finished,
        winner: m.is_finished && m.score_home !== null && m.score_away !== null ? (m.score_home > m.score_away ? m.team_home : (m.score_home < m.score_away ? m.team_away : null)) : null
      };
    }
  }
  for (let id = 73; id <= 88; id++) {
    const m = matchesList.find(match => match.id === id);
    if (m) {
      resolved[id] = {
        id: id,
        home: m.team_home,
        away: m.team_away,
        score_home: m.score_home,
        score_away: m.score_away,
        is_finished: m.is_finished,
        winner: getRealWinnerTeam(m, matchesList)
      };
    }
  }
  const order = [
    89, 90, 91, 92, 93, 94, 95, 96,
    97, 98, 99, 100,
    101, 102,
    103, 104
  ];
  order.forEach(id => {
    const m = matchesList.find(match => match.id === id);
    if (m) {
      let homeTeam = m.team_home;
      let awayTeam = m.team_away;
      const parents = matchParents[id];
      if (parents) {
        const p1 = resolved[parents[0]];
        const p2 = resolved[parents[1]];
        if (id === 103) {
          if (p1 && p1.is_finished && p1.winner) {
            homeTeam = p1.winner === p1.home ? p1.away : p1.home;
          }
          if (p2 && p2.is_finished && p2.winner) {
            awayTeam = p2.winner === p2.home ? p2.away : p2.home;
          }
        } else {
          if (p1 && p1.is_finished && p1.winner) homeTeam = p1.winner;
          if (p2 && p2.is_finished && p2.winner) awayTeam = p2.winner;
        }
      }
      resolved[id] = {
        id: id,
        home: homeTeam,
        away: awayTeam,
        score_home: m.score_home,
        score_away: m.score_away,
        is_finished: m.is_finished,
        winner: getRealWinnerTeam({ ...m, team_home: homeTeam, team_away: awayTeam }, matchesList)
      };
    }
  });
  return resolved;
}

function resolvePredictions(userPreds, matchesList) {
  const resolved = {};
  for (let id = 1; id <= 72; id++) {
    const m = matchesList.find(match => match.id === id);
    if (m) {
      const pred = userPreds.find(p => p.match_id === id);
      resolved[id] = {
        id: id,
        home: m.team_home,
        away: m.team_away,
        score_home: pred ? pred.pred_home : null,
        score_away: pred ? pred.pred_away : null,
        winner: pred && pred.pred_home !== null && pred.pred_away !== null ? (pred.pred_home > pred.pred_away ? m.team_home : (pred.pred_home < pred.pred_away ? m.team_away : null)) : null
      };
    }
  }
  for (let id = 73; id <= 88; id++) {
    const m = matchesList.find(match => match.id === id);
    if (m) {
      const pred = userPreds.find(p => p.match_id === id);
      const homeTeam = m.team_home;
      const awayTeam = m.team_away;
      let winner = null;
      let score_home = null;
      let score_away = null;
      if (pred && pred.pred_home !== null && pred.pred_away !== null) {
        score_home = decodeScore(pred.pred_home);
        score_away = decodeScore(pred.pred_away);
        const side = getWinnerSide(pred.pred_home, pred.pred_away);
        if (side === "home") winner = homeTeam;
        else if (side === "away") winner = awayTeam;
      }
      resolved[id] = {
        id: id,
        home: homeTeam,
        away: awayTeam,
        score_home: score_home,
        score_away: score_away,
        winner: winner
      };
    }
  }
  const order = [
    89, 90, 91, 92, 93, 94, 95, 96,
    97, 98, 99, 100,
    101, 102,
    103, 104
  ];
  order.forEach(id => {
    const parents = matchParents[id];
    let homeTeam = `Ganador P${parents[0]}`;
    let awayTeam = `Ganador P${parents[1]}`;
    const p1 = resolved[parents[0]];
    const p2 = resolved[parents[1]];
    if (id === 103) {
      if (p1 && p1.winner) {
        homeTeam = p1.winner === p1.home ? p1.away : p1.home;
      } else {
        homeTeam = `Perdedor P${parents[0]}`;
      }
      if (p2 && p2.winner) {
        awayTeam = p2.winner === p2.home ? p2.away : p2.home;
      } else {
        awayTeam = `Perdedor P${parents[1]}`;
      }
    } else {
      if (p1 && p1.winner) homeTeam = p1.winner;
      if (p2 && p2.winner) awayTeam = p2.winner;
    }
    const pred = userPreds.find(p => p.match_id === id);
    let winner = null;
    let score_home = null;
    let score_away = null;
    const isPlaceholder = (team) => {
      return team.startsWith("Ganador P") || team.startsWith("Perdedor P") || team === "";
    };
    if (pred && pred.pred_home !== null && pred.pred_away !== null && !isPlaceholder(homeTeam) && !isPlaceholder(awayTeam)) {
      score_home = decodeScore(pred.pred_home);
      score_away = decodeScore(pred.pred_away);
      const side = getWinnerSide(pred.pred_home, pred.pred_away);
      if (side === "home") winner = homeTeam;
      else if (side === "away") winner = awayTeam;
    }
    resolved[id] = {
      id: id,
      home: homeTeam,
      away: awayTeam,
      score_home: score_home,
      score_away: score_away,
      winner: winner
    };
  });
  return resolved;
}

function getMatchPointsUnified(matchId, predResolved, realResolved) {
  const p = predResolved[matchId];
  const r = realResolved[matchId];
  if (!p || !r || p.score_home === null || p.score_away === null || r.score_home === null || r.score_away === null) {
    return 0;
  }
  if (matchId <= 72) {
    if (p.score_home === r.score_home && p.score_away === r.score_away) return 5;
    const pSide = p.score_home > p.score_away ? "H" : (p.score_home < p.score_away ? "A" : "D");
    const rSide = r.score_home > r.score_away ? "H" : (r.score_home < r.score_away ? "A" : "D");
    if (pSide === rSide) {
      return 3;
    }
    return 0;
  } else {
    const isWinnerCorrect = (p.winner === r.winner && r.winner !== null);
    
    let basePoints = 0;
    if (isWinnerCorrect) {
      basePoints += 3;
    }

    const isMatchupCorrect = (p.home === r.home && p.away === r.away) || (p.home === r.away && p.away === r.home);
    if (isMatchupCorrect) {
      // 1. Guess draw point (+1 pt)
      const isRealDraw = (r.score_home === r.score_away);
      const isPredDraw = (p.score_home === p.score_away);
      if (isRealDraw && isPredDraw) {
        basePoints += 1;
      }

      // 2. Guess exact score (+2 pts)
      let isScoreExact = false;
      if (p.home === r.home) {
        isScoreExact = (p.score_home === r.score_home && p.score_away === r.score_away);
      } else {
        isScoreExact = (p.score_home === r.score_away && p.score_away === r.score_home);
      }
      if (isScoreExact) {
        let hasAncestorError = false;
        const ancestors = getAncestors(matchId);
        for (const aId of ancestors) {
          const pAnc = predResolved[aId];
          const rAnc = realResolved[aId];
          if (!pAnc || !rAnc) { hasAncestorError = true; break; }
          const isAncMatchupCorrect = (pAnc.home === rAnc.home && pAnc.away === rAnc.away) || (pAnc.home === rAnc.away && pAnc.away === rAnc.home);
          if (!isAncMatchupCorrect) { hasAncestorError = true; break; }
        }
        if (!hasAncestorError) {
          basePoints += 2;
        }
      }
    }
    
    if (basePoints === 0) return 0;

    let mult = 1;
    if (matchId >= 73 && matchId <= 88) mult = 1;
    else if (matchId >= 89 && matchId <= 96) mult = 2;
    else if (matchId >= 97 && matchId <= 100) mult = 3;
    else if (matchId === 101 || matchId === 102 || matchId === 103) mult = 4;
    else if (matchId === 104) mult = 5;
    return basePoints * mult;
  }
}

function getParticipantStats(participantId, allPreds, matchesList) {
  const userPreds = allPreds.filter(pr => pr.participant_id === participantId);
  const realResolved = resolveRealResults(matchesList);
  const predResolved = resolvePredictions(userPreds, matchesList);
  let pts = 0;
  let ex = 0;
  let ac = 0;
  matchesList.forEach(m => {
    if (m.is_finished) {
      const pPoints = getMatchPointsUnified(m.id, predResolved, realResolved);
      pts += pPoints;
      const p = predResolved[m.id];
      const r = realResolved[m.id];
      if (p && r && p.score_home !== null && p.score_away !== null) {
        if (m.id <= 72) {
          if (pPoints === 5) ex++;
          else if (pPoints === 3) ac++;
        } else {
          const isWinnerCorrect = (p.winner === r.winner && r.winner !== null);
          const isMatchupCorrect = (p.home === r.home && p.away === r.away) || (p.home === r.away && p.away === r.home);
          let isScoreExact = false;
          let isDrawCorrect = false;

          if (isMatchupCorrect) {
            const isRealDraw = (r.score_home === r.score_away);
            const isPredDraw = (p.score_home === p.score_away);
            if (isRealDraw && isPredDraw) {
              isDrawCorrect = true;
            }
            if (p.home === r.home) {
              isScoreExact = (p.score_home === r.score_home && p.score_away === r.score_away);
            } else {
              isScoreExact = (p.score_home === r.score_away && p.score_away === r.score_home);
            }
          }
          let hasAncestorError = false;
          if (isScoreExact) {
            const ancestors = getAncestors(m.id);
            for (const aId of ancestors) {
              const pAnc = predResolved[aId];
              const rAnc = realResolved[aId];
              if (!pAnc || !rAnc) { hasAncestorError = true; break; }
              const isAncMatchupCorrect = (pAnc.home === rAnc.home && pAnc.away === rAnc.away) || (pAnc.home === rAnc.away && pAnc.away === rAnc.home);
              if (!isAncMatchupCorrect) { hasAncestorError = true; break; }
            }
          }
          if (isScoreExact && !hasAncestorError) {
            ex++;
          } else if (isWinnerCorrect || isDrawCorrect) {
            ac++;
          }
        }
      }
    }
  });
  return { pts, ex, ac, tp: userPreds.length };
}

function calcPtsForSinglePrediction(pr, matchObj, allMatches, allPreds) {
  const userPreds = allPreds.filter(p => p.participant_id === pr.participant_id);
  const realResolved = resolveRealResults(allMatches);
  const predResolved = resolvePredictions(userPreds, allMatches);
  return getMatchPointsUnified(matchObj.id, predResolved, realResolved);
}

const normalizeTeamName = (name) => {
  if (!name) return "";
  let n = name.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\band\b/g, "&")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
  if (n === "czech republic" || n === "czechia") return "czechia";
  if (n === "bosnia & herzegovina" || n === "bosnia herzegovina") return "bosnia herzegovina";
  if (n === "democratic republic of the congo" || n === "dr congo" || n === "congo dr") return "dr congo";
  if (n === "cote d ivoire" || n === "ivory coast") return "ivory coast";
  return n;
};

const assignThirds = (bestThirds) => {
  const paddedThirds = [...bestThirds];
  const allGroups = ["A","B","C","D","E","F","G","H","I","J","K","L"];
  const usedGroupsInPadded = new Set(paddedThirds.map(t => t.group));
  for (const g of allGroups) {
    if (paddedThirds.length >= 8) break;
    if (!usedGroupsInPadded.has(g)) {
      paddedThirds.push({ name: `3° Grupo ${g}`, group: g });
      usedGroupsInPadded.add(g);
    }
  }
  while (paddedThirds.length < 8) {
    paddedThirds.push({ name: `3° Reservado`, group: "A" });
  }

  const slots = [
    { id: 74, allowed: ["A","B","C","D","F"], opponent: "E" },
    { id: 77, allowed: ["C","D","F","G","H"], opponent: "I" },
    { id: 79, allowed: ["C","E","F","H","I"], opponent: "A" },
    { id: 80, allowed: ["E","H","I","J","K"], opponent: "L" },
    { id: 81, allowed: ["B","E","F","I","J"], opponent: "D" },
    { id: 82, allowed: ["A","E","H","I","J"], opponent: "G" },
    { id: 85, allowed: ["E","F","G","I","J"], opponent: "B" },
    { id: 87, allowed: ["D","E","I","J","L"], opponent: "K" }
  ];

  const assignment = {};
  const usedIndices = new Set();

  function backtrack(slotIdx) {
    if (slotIdx === slots.length) return true;
    const slot = slots[slotIdx];
    for (let i = 0; i < paddedThirds.length; i++) {
      if (usedIndices.has(i)) continue;
      const team = paddedThirds[i];
      if (slot.allowed.includes(team.group) && team.group !== slot.opponent) {
        assignment[slot.id] = team;
        usedIndices.add(i);
        if (backtrack(slotIdx + 1)) return true;
        usedIndices.delete(i);
        delete assignment[slot.id];
      }
    }
    return false;
  }

  const success = backtrack(0);
  if (!success) {
    for (let i = 0; i < slots.length; i++) {
      assignment[slots[i].id] = paddedThirds[i];
    }
  }

  // Swap Germany (74) and France (77) opponents if they get Sweden (F) and Paraguay (D) to match official pairings
  if (assignment[74] && assignment[77]) {
    if (assignment[74].group === "F" && assignment[77].group === "D") {
      const temp = assignment[74];
      assignment[74] = assignment[77];
      assignment[77] = temp;
    }
  }

  // Swap Belgium (82) and Brazil (85) opponents if they get Algeria (J) and Senegal (I) to match official pairings
  if (assignment[82] && assignment[85]) {
    if (assignment[82].group === "J" && assignment[85].group === "I") {
      const temp = assignment[82];
      assignment[82] = assignment[85];
      assignment[85] = temp;
    }
  }

  return assignment;
};
function triggerConfetti() {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", handleResize);

  const colors = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#ec4899", "#8b5cf6"];
  const particles = [];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height - height,
      r: Math.random() * 4 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
      velocity: {
        x: Math.random() * 4 - 2,
        y: Math.random() * 4 + 3
      }
    });
  }

  let animationFrameId;
  const startTime = Date.now();

  function draw() {
    ctx.clearRect(0, 0, width, height);

    let active = false;
    particles.forEach((p) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += p.velocity.y;
      p.x += p.velocity.x;
      p.tilt = Math.sin(p.tiltAngle) * 4;

      if (p.y <= height + 20) {
        active = true;
      }

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();
    });

    if (active && Date.now() - startTime < 3500) {
      animationFrameId = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  draw();
}


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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [compareMode, setCompareMode] = useState(false);
  const [transparencyTab, setTransparencyTab] = useState("list");
  const [bracketSource] = useState("db");
  const [bracketViewMode] = useState("list");

  const [adminSearch, setAdminSearch] = useState("");
  const [adminStatus, setAdminStatus] = useState("pending");

  const getBracketR32TeamMap = (source) => {
    const standingsFn = source === "real" ? getGroupStandings : getGroupStandingsPred;
    const groups = ["A","B","C","D","E","F","G","H","I","J","K","L"];
    const teamMap = {};
    
    if (source === "demo") {
      groups.forEach(g => {
        teamMap[`1${g}`] = { name: `1° Grupo ${g}`, group: g };
        teamMap[`2${g}`] = { name: `2° Grupo ${g}`, group: g };
      });
      const dummyThirds = groups.slice(0, 8).map(g => ({ name: `3° Grupo ${g}`, group: g }));
      const thirdsAssignment = assignThirds(dummyThirds);
      Object.entries(thirdsAssignment).forEach(([matchId, team]) => {
        teamMap[`3rd_${matchId}`] = team;
      });
    } else {
      groups.forEach(g => {
        const s = standingsFn(g);
        teamMap[`1${g}`] = { name: s[0]?.name || `1° Grupo ${g}`, group: g };
        teamMap[`2${g}`] = { name: s[1]?.name || `2° Grupo ${g}`, group: g };
      });
      const bt = getBestThirds(standingsFn);
      const thirdsAssignment = assignThirds(bt);
      Object.entries(thirdsAssignment).forEach(([matchId, team]) => {
        teamMap[`3rd_${matchId}`] = team;
      });
    }
    return teamMap;
  };

  const resolvePredictionsWithSource = (userPreds, matchesList, source) => {
    const resolved = {};
    for (let id = 1; id <= 72; id++) {
      const m = matchesList.find(match => match.id === id);
      if (m) {
        const pred = userPreds.find(p => p.match_id === id);
        resolved[id] = {
          id: id,
          home: m.team_home,
          away: m.team_away,
          score_home: pred ? pred.pred_home : null,
          score_away: pred ? pred.pred_away : null,
          winner: pred && pred.pred_home !== null && pred.pred_away !== null ? (pred.pred_home > pred.pred_away ? m.team_home : (pred.pred_home < pred.pred_away ? m.team_away : null)) : null
        };
      }
    }

    const r32Defs = [
      { id: 73, h: "2A", a: "2B" },
      { id: 74, h: "1E", a: "3rd_74" },
      { id: 75, h: "1F", a: "2C" },
      { id: 76, h: "1C", a: "2F" },
      { id: 77, h: "1I", a: "3rd_77" },
      { id: 78, h: "2E", a: "2I" },
      { id: 79, h: "1A", a: "3rd_79" },
      { id: 80, h: "1L", a: "3rd_80" },
      { id: 81, h: "1D", a: "3rd_81" },
      { id: 82, h: "1G", a: "3rd_82" },
      { id: 83, h: "2K", a: "2L" },
      { id: 84, h: "1H", a: "2J" },
      { id: 85, h: "1B", a: "3rd_85" },
      { id: 86, h: "1J", a: "2H" },
      { id: 87, h: "1K", a: "3rd_87" },
      { id: 88, h: "2D", a: "2G" }
    ];

    let r32TeamMap = null;
    if (source !== "db") {
      r32TeamMap = getBracketR32TeamMap(source);
    }

    for (let id = 73; id <= 88; id++) {
      const m = matchesList.find(match => match.id === id);
      const def = r32Defs.find(d => d.id === id);
      
      let homeTeam = "";
      let awayTeam = "";
      
      if (source === "db" && m) {
        homeTeam = m.team_home;
        awayTeam = m.team_away;
      } else if (r32TeamMap && def) {
        homeTeam = r32TeamMap[def.h]?.name || `2° Grupo ${def.h[1]}`;
        awayTeam = r32TeamMap[def.a]?.name || (def.a.startsWith("3rd_") ? `3° Reservado` : `2° Grupo ${def.a[1]}`);
      } else if (m) {
        homeTeam = m.team_home;
        awayTeam = m.team_away;
      }

      const pred = userPreds.find(p => p.match_id === id);
      let winner = null;
      let score_home = null;
      let score_away = null;
      if (pred && pred.pred_home !== null && pred.pred_away !== null) {
        score_home = decodeScore(pred.pred_home);
        score_away = decodeScore(pred.pred_away);
        const side = getWinnerSide(pred.pred_home, pred.pred_away);
        if (side === "home") winner = homeTeam;
        else if (side === "away") winner = awayTeam;
      }

      resolved[id] = {
        id: id,
        home: homeTeam,
        away: awayTeam,
        score_home: score_home,
        score_away: score_away,
        winner: winner
      };
    }

    const order = [
      89, 90, 91, 92, 93, 94, 95, 96,
      97, 98, 99, 100,
      101, 102,
      103, 104
    ];

    order.forEach(id => {
      const parents = matchParents[id];
      let homeTeam = `Ganador P${parents[0]}`;
      let awayTeam = `Ganador P${parents[1]}`;
      const p1 = resolved[parents[0]];
      const p2 = resolved[parents[1]];
      if (id === 103) {
        if (p1 && p1.winner) {
          homeTeam = p1.winner === p1.home ? p1.away : p1.home;
        } else {
          homeTeam = `Perdedor P${parents[0]}`;
        }
        if (p2 && p2.winner) {
          awayTeam = p2.winner === p2.home ? p2.away : p2.home;
        } else {
          awayTeam = `Perdedor P${parents[1]}`;
        }
      } else {
        if (p1 && p1.winner) homeTeam = p1.winner;
        if (p2 && p2.winner) awayTeam = p2.winner;
      }
      const pred = userPreds.find(p => p.match_id === id);
      let winner = null;
      let score_home = null;
      let score_away = null;
      const isPlaceholder = (team) => {
        return team.startsWith("Ganador P") || team.startsWith("Perdedor P") || team === "";
      };
      if (pred && pred.pred_home !== null && pred.pred_away !== null && !isPlaceholder(homeTeam) && !isPlaceholder(awayTeam)) {
        score_home = decodeScore(pred.pred_home);
        score_away = decodeScore(pred.pred_away);
        const side = getWinnerSide(pred.pred_home, pred.pred_away);
        if (side === "home") winner = homeTeam;
        else if (side === "away") winner = awayTeam;
      }
      resolved[id] = {
        id: id,
        home: homeTeam,
        away: awayTeam,
        score_home: score_home,
        score_away: score_away,
        winner: winner
      };
    });

    return resolved;
  };

  const getBracketDraftsMerged = () => {
    const merged = [...preds];
    Object.entries(drafts).forEach(([midStr, d]) => {
      const mid = parseInt(midStr);
      if (mid >= 73 && mid <= 104) {
        const idx = merged.findIndex(p => p.match_id === mid);
        
        let predHome = null;
        let predAway = null;
        
        const h = d.home;
        const a = d.away;
        
        if (h !== undefined && h !== "" && a !== undefined && a !== "") {
          const hInt = parseInt(h);
          const aInt = parseInt(a);
          if (hInt === aInt) {
            const winner = d.penaltyWinner || "home";
            if (winner === "home") {
              predHome = hInt + 100;
              predAway = aInt;
            } else {
              predHome = hInt;
              predAway = aInt + 100;
            }
          } else {
            predHome = hInt;
            predAway = aInt;
          }
        }
        
        if (predHome !== null && predAway !== null) {
          const predObj = {
            participant_id: user.id,
            match_id: mid,
            pred_home: predHome,
            pred_away: predAway
          };
          if (idx >= 0) {
            merged[idx] = predObj;
          } else {
            merged.push(predObj);
          }
        } else {
          if (idx >= 0) {
            merged.splice(idx, 1);
          }
        }
      }
    });
    return merged;
  };

  const saveBracketPredictions = async () => {
    if (!user) return;
    const merged = getBracketDraftsMerged();
    const bracketMatchesToSave = merged.filter(p => p.match_id >= 73 && p.match_id <= 104);
    
    if (bracketMatchesToSave.length === 0) {
      setErr("No hay predicciones en el bracket para guardar.");
      return;
    }
    
    setSending(true);
    setErr("");
    setOk("");
    
    // 1. Fetch current predictions backup first
    let backup = [];
    try {
      const existingPreds = await supa(`predictions?participant_id=eq.${user.id}&match_id=gte.73`);
      backup = existingPreds || [];
    } catch (e) {
      setErr("Error de conexión al verificar tus predicciones anteriores. No se realizaron cambios.");
      setSending(false);
      return;
    }
    
    try {
      // 2. Delete existing bracket predictions
      await supa(`predictions?participant_id=eq.${user.id}&match_id=gte.73`, {
        method: "DELETE"
      });
      
      // 3. Post new predictions
      const payload = bracketMatchesToSave.map(p => ({
        participant_id: user.id,
        match_id: p.match_id,
        pred_home: p.pred_home,
        pred_away: p.pred_away
      }));
      
      try {
        await supa("predictions", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      } catch (postError) {
        // 4. Fallback: Restore the backup if insertion failed
        if (backup.length > 0) {
          const restorePayload = backup.map(b => ({
            participant_id: b.participant_id,
            match_id: b.match_id,
            pred_home: b.pred_home,
            pred_away: b.pred_away
          }));
          try {
            await supa("predictions", {
              method: "POST",
              body: JSON.stringify(restorePayload)
            });
          } catch (restoreError) {
            console.error("Critical: Failed to restore backup!", restoreError);
          }
        }
        throw new Error("El servidor rechazó el guardado del nuevo bracket. Se restauró tu versión anterior: " + postError.message);
      }
      
      await load();
      setOk("¡Bracket guardado con éxito! 🔒");
      triggerConfetti();
    } catch (e) {
      setErr("Error al guardar bracket: " + e.message);
    }
    setSending(false);
  };

  const publishKnockoutMatches = async () => {
    const r32TeamMap = getBracketR32TeamMap("real");
    
    const r32Defs = [
      { id: 73, h: "2A", a: "2B", date: "2026-06-28" },
      { id: 74, h: "1E", a: "3rd_74", date: "2026-06-29" },
      { id: 75, h: "1F", a: "2C", date: "2026-06-29" },
      { id: 76, h: "1C", a: "2F", date: "2026-06-29" },
      { id: 77, h: "1I", a: "3rd_77", date: "2026-06-30" },
      { id: 78, h: "2E", a: "2I", date: "2026-06-30" },
      { id: 79, h: "1A", a: "3rd_79", date: "2026-06-30" },
      { id: 80, h: "1L", a: "3rd_80", date: "2026-07-01" },
      { id: 81, h: "1D", a: "3rd_81", date: "2026-07-01" },
      { id: 82, h: "1G", a: "3rd_82", date: "2026-07-01" },
      { id: 83, h: "2K", a: "2L", date: "2026-07-02" },
      { id: 84, h: "1H", a: "2J", date: "2026-07-02" },
      { id: 85, h: "1B", a: "3rd_85", date: "2026-07-02" },
      { id: 86, h: "1J", a: "2H", date: "2026-07-03" },
      { id: 87, h: "1K", a: "3rd_87", date: "2026-07-03" },
      { id: 88, h: "2D", a: "2G", date: "2026-07-03" }
    ];

    const otherDefs = [
      { id: 89, h: "Ganador P74", a: "Ganador P77", date: "2026-07-04", phase: "r16" },
      { id: 90, h: "Ganador P73", a: "Ganador P75", date: "2026-07-04", phase: "r16" },
      { id: 91, h: "Ganador P76", a: "Ganador P78", date: "2026-07-05", phase: "r16" },
      { id: 92, h: "Ganador P79", a: "Ganador P80", date: "2026-07-05", phase: "r16" },
      { id: 93, h: "Ganador P83", a: "Ganador P84", date: "2026-07-06", phase: "r16" },
      { id: 94, h: "Ganador P81", a: "Ganador P82", date: "2026-07-06", phase: "r16" },
      { id: 95, h: "Ganador P86", a: "Ganador P88", date: "2026-07-07", phase: "r16" },
      { id: 96, h: "Ganador P85", a: "Ganador P87", date: "2026-07-07", phase: "r16" },
      
      { id: 97, h: "Ganador P89", a: "Ganador P90", date: "2026-07-09", phase: "quarter" },
      { id: 98, h: "Ganador P93", a: "Ganador P94", date: "2026-07-10", phase: "quarter" },
      { id: 99, h: "Ganador P91", a: "Ganador P92", date: "2026-07-11", phase: "quarter" },
      { id: 100, h: "Ganador P95", a: "Ganador P96", date: "2026-07-11", phase: "quarter" },
      
      { id: 101, h: "Ganador P97", a: "Ganador P98", date: "2026-07-14", phase: "semi" },
      { id: 102, h: "Ganador P99", a: "Ganador P100", date: "2026-07-15", phase: "semi" },
      
      { id: 103, h: "Perdedor P101", a: "Perdedor P102", date: "2026-07-18", phase: "third" },
      { id: 104, h: "Ganador P101", a: "Ganador P102", date: "2026-07-19", phase: "final" }
    ];

    setSending(true);
    try {
      const existing = await supa("matches?match_number=gte.73");
      if (existing && existing.length > 0) {
        const confirmUpdate = window.confirm("Los partidos de eliminación directa ya están publicados en la base de datos. ¿Deseas actualizar los equipos del Round of 32 según las posiciones reales actuales?");
        if (!confirmUpdate) {
          setSending(false);
          return;
        }
        
        for (const d of r32Defs) {
          const teamHome = r32TeamMap[d.h]?.name || `2° ${d.h[1]}`;
          const teamAway = r32TeamMap[d.a]?.name || (d.a.startsWith("3rd_") ? `3° ${d.a.split("_")[1] || ""}` : `2° ${d.a[1]}`);
          await supa(`matches?id=eq.${d.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              team_home: teamHome,
              team_away: teamAway
            })
          });
        }
        
        alert("¡Cruces de eliminación directa actualizados con éxito!");
        await load();
        setSending(false);
        return;
      }
      
      const confirmPublish = window.confirm("¿Estás seguro de que quieres publicar los partidos de eliminación directa en la base de datos? Esto permitirá a los usuarios ingresar sus predicciones.");
      if (!confirmPublish) {
        setSending(false);
        return;
      }
      
      const payload = [];
      r32Defs.forEach(d => {
        payload.push({
          id: d.id,
          match_number: d.id,
          group_name: "X",
          team_home: r32TeamMap[d.h]?.name || `2° ${d.h[1]}`,
          team_away: r32TeamMap[d.a]?.name || (d.a.startsWith("3rd_") ? `3° ${d.a.split("_")[1] || ""}` : `2° ${d.a[1]}`),
          match_date: d.date,
          phase: "r32",
          score_home: null,
          score_away: null,
          is_finished: false
        });
      });
      
      otherDefs.forEach(d => {
        payload.push({
          id: d.id,
          match_number: d.id,
          group_name: "X",
          team_home: d.h,
          team_away: d.a,
          match_date: d.date,
          phase: d.phase,
          score_home: null,
          score_away: null,
          is_finished: false
        });
      });

      await supa("matches", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      alert("¡Partidos de eliminación directa publicados con éxito!");
      await load();
    } catch (e) {
      alert("Error al publicar/actualizar partidos: " + e.message);
    }
    setSending(false);
  };

  const load = useCallback(async () => {
    try {
      const [m,p,a] = await Promise.all([supa("matches?order=match_number.asc"),supa("participants?order=name.asc"),supaAllPredictions()]);
      setMatches(m||[]); setParts(p||[]); setAllPreds(a||[]);
      if(user) setPreds((a||[]).filter(pr=>pr.participant_id===user.id));
    } catch(e){ console.error(e); }

    setLoading(false);
  },[user]);

  useEffect(() => {
    load();
  }, [load]);

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
      if(r&&r.length>0){setUser(r[0]);setOk("¡Registrado! Ingresá tus predicciones");setView("predictions");setRName("");setRPin("");load();triggerConfetti();}
    } catch(e){ e.message.includes("duplicate")?setErr("Nombre ya registrado"):setErr("Error al registrar"); }
  };

  const hasPred = mid => preds.some(p=>p.match_id===mid);
  const getPred = mid => preds.find(p=>p.match_id===mid);

  const updDraft = (mid,f,v) => { if(hasPred(mid)) return; setDrafts(p=>({...p,[mid]:{...p[mid],[f]:v}})); };

  const submitOne = async mid => {
    if(!user||hasPred(mid)) return; const d=drafts[mid];
    if(!d||d.home===undefined||d.home===""||d.away===undefined||d.away===""){setErr("Ingresá ambos marcadores");return;}
    try { await supa("predictions",{method:"POST",headers:{...hdrs,Prefer:"return=representation"},body:JSON.stringify({participant_id:user.id,match_id:mid,pred_home:parseInt(d.home),pred_away:parseInt(d.away)})});
      setDrafts(p=>{const n={...p};delete n[mid];return n;}); await load(); setOk("Predicción bloqueada ✓");triggerConfetti();
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
    setDrafts({}); await load(); setOk(`${n} predicciones bloqueadas ✓`); setSending(false);triggerConfetti();
  };

  const updResult = async (mid, sh, sa, winTeam = null) => {
    if(!user?.is_admin) return;
    try { 
      await supa(`matches?id=eq.${mid}`, {
        method: "PATCH",
        headers: { ...hdrs, Prefer: "return=representation" },
        body: JSON.stringify({ score_home: parseInt(sh), score_away: parseInt(sa), is_finished: true })
      });
      
      const matchObj = matches.find(m => m.id === mid);
      const winner = winTeam || (parseInt(sh) > parseInt(sa) ? matchObj.team_home : matchObj.team_away);
      
      // Update child match (advance winner)
      const child = matchChildren[mid];
      if (child && winner) {
        const payload = {};
        if (child.slot === "home") payload.team_home = winner;
        else payload.team_away = winner;
        
        await supa(`matches?id=eq.${child.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      }
      
      // Semis logic for final and 3rd place
      if ((mid === 101 || mid === 102) && winner) {
        const loser = winner === matchObj.team_home ? matchObj.team_away : matchObj.team_home;
        const finalSlot = mid === 101 ? "team_home" : "team_away";
        const thirdSlot = mid === 101 ? "team_home" : "team_away";
        
        await supa(`matches?id=eq.104`, {
          method: "PATCH",
          body: JSON.stringify({ [finalSlot]: winner })
        });
        await supa(`matches?id=eq.103`, {
          method: "PATCH",
          body: JSON.stringify({ [thirdSlot]: loser })
        });
      }

      const freshPreds = await supa(`predictions?match_id=eq.${mid}`);
      const updatedMatches = matches.map(m => m.id === mid ? { ...m, score_home: parseInt(sh), score_away: parseInt(sa), is_finished: true } : m);
      for(const pr of (freshPreds||[])){
        const pts = calcPtsForSinglePrediction(pr, { id: mid, score_home: parseInt(sh), score_away: parseInt(sa), is_finished: true }, updatedMatches, allPreds);
        await supa(`predictions?id=eq.${pr.id}`,{method:"PATCH",body:JSON.stringify({points_earned:pts})});
      }
      
      await load(); 
      setOk("Resultado, cruces y puntos actualizados ✓");
    } catch(e){ 
      setErr("Error: "+e.message); 
    }
  };

  const mergedMatches = matches.map(dbMatch => ({
    ...dbMatch,
    is_live: false,
    time_elapsed: dbMatch.is_finished ? "finished" : "notstarted"
  }));

  const hasKnockoutMatches = matches.some(m => m.id === 73);

  const getQuickMatches = () => {
    const todayStr = (() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    })();

    const activeMatches = mergedMatches.filter(m => {
      if (m.match_date === todayStr) return true;
      if (!m.is_finished && m.match_date < todayStr) return true;
      return false;
    });

    if (activeMatches.length > 0) {
      return activeMatches;
    }

    const upcomingPending = mergedMatches.filter(m => !m.is_finished && m.match_date > todayStr);
    if (upcomingPending.length > 0) {
      const dates = [...new Set(upcomingPending.map(m => m.match_date))].sort();
      const closestDate = dates[0];
      return mergedMatches.filter(m => m.match_date === closestDate);
    }

    if (mergedMatches.length > 0) {
      const dates = [...new Set(mergedMatches.map(m => m.match_date))].sort();
      const lastDate = dates[dates.length - 1];
      return mergedMatches.filter(m => m.match_date === lastDate);
    }

    return [];
  };

  const quickMatches = getQuickMatches();

  const ranking = parts.map(p => {
    const stats = getParticipantStats(p.id, allPreds, mergedMatches);
    return { ...p, pts: stats.pts, ex: stats.ex, ac: stats.ac, tp: stats.tp };
  }).sort((a, b) => b.pts - a.pts || b.ex - a.ex || a.name.localeCompare(b.name));

  const getGroupStageWinner = () => {
    if (!parts.length) return null;
    const list = parts.map(p => {
      const userPreds = allPreds.filter(pr => pr.participant_id === p.id);
      const realResolved = resolveRealResults(mergedMatches);
      const predResolved = resolvePredictions(userPreds, mergedMatches);
      let pts = 0;
      mergedMatches.forEach(m => {
        if (m.id <= 72 && m.is_finished) {
          pts += getMatchPointsUnified(m.id, predResolved, realResolved);
        }
      });
      return { ...p, pts };
    }).sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name));
    return list[0] || null;
  };

  const groupStageWinner = getGroupStageWinner();
  const groupStageFinishedCount = mergedMatches.filter(m => m.id <= 72 && m.is_finished).length;

  const GS=["ALL","A","B","C","D","E","F","G","H","I","J","K","L"];
  const fm = grp==="ALL"?mergedMatches:mergedMatches.filter(m=>m.group_name===grp);
  const fin=mergedMatches.filter(m=>m.is_finished).length;
  const pendN=Object.entries(drafts).filter(([mid,d])=>d.home!==undefined&&d.home!==""&&d.away!==undefined&&d.away!==""&&!hasPred(parseInt(mid))).length;

  const filteredMatches = fm.filter(match => {
    const matchesSearch = searchQuery.trim() === "" ||
      match.team_home.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.team_away.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;
    
    const pred = getPred(match.id);
    const locked = !!pred;
    const finished = match.is_finished;
    
    if (statusFilter === "pending") {
      return !locked && !finished;
    }
    if (statusFilter === "locked") {
      return locked && !finished;
    }
    if (statusFilter === "finished") {
      return finished;
    }
    return true;
  });

  // Group standings calculation (real results)
  const getGroupStandings = (groupName) => {
    const groupMatches = mergedMatches.filter(m => m.group_name === groupName && m.is_finished);
    const teams = {};
    mergedMatches.filter(m => m.group_name === groupName).forEach(m => {
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
    mergedMatches.filter(m => m.group_name === groupName).forEach(m => {
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
          ⚽ Acertar ganador = <span className="text-blue">3 pts</span> | Acertar empate (no exacto) = <span className="text-blue">1 pt</span><br/>
          🎯 Marcador exacto = <span className="text-green">6 pts</span> (Grupos y Brackets)<br/>
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
          {[{id:"ranking",l:"🏅 Ranking",s:true},{id:"predictions",l:"📝 Predicciones",s:true},{id:"real_bracket",l:"🌳 Bracket Real",s:true},{id:"groups",l:"⚽ Grupos",s:true},{id:"results",l:"📊 Resultados",s:true},{id:"transparency",l:"👁️ Quinielas",s:true},{id:"admin",l:"👑 Admin",s:user.is_admin}].filter(t=>t.s).map(tab=>(
            <button key={tab.id} onClick={()=>{setView(tab.id); setSearchQuery(""); setStatusFilter("all"); setCompareMode(false); setTransparencyTab("list");}} className={`nav-btn ${view===tab.id?'active':''}`}>{tab.l}</button>
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
            {groupStageWinner && (
              <div className="glass-card group-stage-winner-card fade-in" style={{ marginBottom: 24, border: "2px solid var(--gold)", background: "linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(9, 11, 24, 0.7) 100%)", padding: "20px 24px", position: "relative", overflow: "hidden" }}>
                <div className="winner-glow-effect"></div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ fontSize: "40px", animation: "floatLogo 3s infinite ease-in-out" }}>👑</div>
                  <div>
                    <h3 className="text-bebas" style={{ margin: 0, fontSize: "20px", color: "var(--gold)", letterSpacing: "1.5px" }}>
                      {groupStageFinishedCount >= 72 ? "🏆 GANADOR DE FASE DE GRUPOS" : "🏆 GANADOR DE FASE DE GRUPOS (PROVISIONAL)"}
                    </h3>
                    <h2 className="text-bebas" style={{ margin: "4px 0 0 0", fontSize: "28px", color: "#fff", textShadow: "0 0 10px rgba(255, 215, 0, 0.3)", letterSpacing: "1px" }}>
                      {groupStageWinner.name} <span style={{ color: "var(--gold)", fontSize: "20px" }}>({groupStageWinner.pts} PTS)</span>
                    </h2>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-dim)", fontWeight: "500" }}>
                      {groupStageFinishedCount >= 72 ? "¡Felicidades por dominar la primera etapa de la copa mundial!" : `Calculado en base a ${groupStageFinishedCount} de 72 partidos jugados.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-card progress-card">
              <div className="progress-details">
                <span className="text-dim text-sm">Progreso del torneo</span>
                <span className="progress-count text-bebas">{fin}/{mergedMatches.length} partidos</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{width:`${mergedMatches.length>0?(fin/mergedMatches.length)*100:0}%`}}/>
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
                  <div 
                    key={p.id} 
                    className={rankClass}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setView("transparency");
                      setSelectedPart(p);
                      setSearchQuery("");
                      setStatusFilter("all");
                      setCompareMode(false);
                      setTransparencyTab("list");
                    }}
                    title={`Ver quiniela de ${p.name}`}
                  >
                    <div className="rank-badge-container">
                      <div className={badgeClass}>{i===0?"👑":i+1}</div>
                    </div>
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

        {/* PREDICTIONS (GROUP STAGE - TEMPORARILY DISABLED) */}
        {view==="predictions_old"&&(
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
                
                <div className="search-filter-bar">
                  <input 
                    type="text" 
                    placeholder="🔍 Buscar país (ej: México)..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Todos los partidos</option>
                    <option value="pending">⏳ Pendientes</option>
                    <option value="locked">🔒 Enviados</option>
                    <option value="finished">✅ Finalizados</option>
                  </select>
                </div>

                <GF gs={GS} sel={grp} set={setGrp}/>
                <div className="fixtures-list">
                  {filteredMatches.filter(m => m.id <= 72).map(match=>{
                    const pred=getPred(match.id), locked=!!pred, draft=drafts[match.id]||{}, finished=match.is_finished, isLive=match.is_live;
                    let pts=null; 
                    let isExact = false;
                    let isWinner = false;
                    if ((finished || isLive) && pred) {
                      if (pred.pred_home !== null && pred.pred_away !== null && match.score_home !== null && match.score_away !== null) {
                        if (pred.pred_home === match.score_home && pred.pred_away === match.score_away) {
                          pts = 6;
                          isExact = true;
                        } else {
                          const pSide = pred.pred_home > pred.pred_away ? "H" : (pred.pred_home < pred.pred_away ? "A" : "D");
                          const rSide = match.score_home > match.score_away ? "H" : (match.score_home < match.score_away ? "A" : "D");
                          pts = pSide === rSide ? (pSide === "D" ? 1 : 3) : 0;
                          isWinner = pSide === rSide;
                        }
                      }
                    }
                    
                    let matchCardClass = "match-card";
                    if(isLive){
                      matchCardClass += " match-card-live";
                    } else if(finished){
                      if(isExact) matchCardClass += " match-card-exact";
                      else if(isWinner) matchCardClass += " match-card-winner";
                      else matchCardClass += " match-card-incorrect";
                    } else if(locked){
                      matchCardClass += " match-card-locked";
                    }
                    
                    let liveGlowClass = "";
                    if (isLive && pred) {
                      if (isExact) liveGlowClass = "live-glow-exact";
                      else if (isWinner) liveGlowClass = "live-glow-winner";
                    }

                    return(
                      <div key={match.id} className={matchCardClass}>
                        <div className="match-card-header">
                          <span className="match-meta">
                            Grupo {match.group_name} · #{match.match_number} · {match.match_date}
                            {isLive && <span className="live-minute-badge"> {match.time_elapsed}'</span>}
                          </span>
                          {isLive && <span className="badge badge-live">● EN VIVO</span>}
                          {finished&&pts!==null&&<span className={`badge ${isExact?'badge-success':isWinner?'badge-info':'badge-danger'} badge-pts-earned`}>{isExact?`🎯 EXACTO +${pts}`:isWinner?`✓ +${pts}`:"✗ 0"}</span>}
                          {isLive&&pts!==null&&pts>0&&<span className={`badge ${isExact?'badge-success-glow':'badge-info-glow'} badge-pts-earned`}>{isExact?`🎯 EXACTO +${pts} (Parcial)`:`✓ +${pts} (Parcial)`}</span>}
                          {!finished&&!isLive&&locked&&<span className="badge badge-success">🔒 Enviado</span>}
                          {!finished&&!isLive&&!locked&&!draft.home&&!draft.away&&<span className="badge badge-neutral">Pendiente</span>}
                          {!finished&&!isLive&&!locked&&(draft.home!==undefined||draft.away!==undefined)&&<span className="badge badge-warning">Sin guardar</span>}
                        </div>
                        <div className="match-fixture-row">
                          <div className="team-home">
                            <span className="team-name">{match.team_home}</span>
                            <span className="flag-emoji large">{gf(match.team_home)}</span>
                          </div>
                          <div className="score-inputs-container">
                            {locked?(
                              <div className={`locked-prediction text-bebas ${liveGlowClass}`}>
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
                        {(finished || isLive) && <div className="real-score-row">Resultado {isLive ? "parcial" : "real"}: <span className="real-score-accent text-bebas" style={{color: isLive ? "var(--green)" : "var(--accent)"}}>{match.score_home} - {match.score_away}</span></div>}
                        {!locked&&draft.home!==undefined&&draft.home!==""&&draft.away!==undefined&&draft.away!==""&&(
                          <div className="match-card-actions">
                            <button onClick={()=>submitOne(match.id)} className="btn-success btn-sm-action">Enviar 🔒</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!filteredMatches.length&&<div className="no-data">No se encontraron partidos</div>}
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
            
            <div className="search-filter-bar">
              <input 
                type="text" 
                placeholder="🔍 Buscar país..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <GF gs={GS} sel={grp} set={setGrp}/>
            <div className="fixtures-list">
              {filteredMatches.map(m=>{
                const isLive = m.is_live;
                let cardClass = "match-card";
                if (isLive) {
                  cardClass += " match-card-live";
                } else if (m.is_finished) {
                  cardClass += " match-card-locked";
                } else {
                  cardClass += " match-card-finished opacity-60";
                }
                
                return(
                  <div key={m.id} className={cardClass}>
                    <div className="match-card-header">
                      <span className="match-meta">
                        {m.id <= 72 ? `Grupo ${m.group_name}` : "Eliminación Directa"} · #{m.match_number} · {m.match_date}
                        {isLive && <span className="live-minute-badge"> {m.time_elapsed}'</span>}
                      </span>
                      {isLive ? (
                        <span className="badge badge-live">● EN VIVO</span>
                      ) : m.is_finished ? (
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
                          {(m.is_finished || isLive) ? (
                            <>
                              <span className="predicted-score" style={{color: isLive ? "var(--green)" : "var(--accent)"}}>{m.score_home}</span>
                              <span className="score-separator">-</span>
                              <span className="predicted-score" style={{color: isLive ? "var(--green)" : "var(--accent)"}}>{m.score_away}</span>
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
              {!filteredMatches.length&&<div className="no-data">No se encontraron partidos</div>}
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
              const stats = getParticipantStats(selectedPart.id, allPreds, mergedMatches);
              let totalPts = stats.pts;
              let exactos = stats.ex;
              let aciertos = stats.ac;
              
              const selectedPartResolved = resolvePredictions(partPreds, mergedMatches);
              const realResolved = resolveRealResults(mergedMatches);
              const myPredsResolved = resolvePredictions(preds, mergedMatches);
              
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
                  
                  {/* Sub-pestañas: Lista de Predicciones vs Bracket del Participante */}
                  <div className="subtabs-bar" style={{ marginBottom: "24px", display: "flex", gap: "10px" }}>
                    <button onClick={()=>setTransparencyTab("list")} className={`btn-tab-pill ${transparencyTab==='list'?'active':''}`}>📝 Predicciones (Lista)</button>
                    <button onClick={()=>setTransparencyTab("bracket")} className={`btn-tab-pill ${transparencyTab==='bracket'?'active':''}`}>🌳 Bracket Visual</button>
                  </div>

                  {transparencyTab === "list" ? (
                    <>
                      <div className="search-filter-bar">
                        <input 
                          type="text" 
                          placeholder="🔍 Buscar país..." 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="search-input"
                        />
                      </div>

                      {selectedPart.id !== user.id && (
                        <div className="compare-toggle-row">
                          <button onClick={() => setCompareMode(!compareMode)} className={`btn-tab-pill ${compareMode ? 'active' : ''}`}>
                            ⚔️ {compareMode ? "Desactivar comparación" : "Comparar conmigo"}
                          </button>
                        </div>
                      )}

                      <GF gs={GS} sel={grp} set={setGrp}/>
                      <div className="fixtures-list">
                        {filteredMatches.map(match=>{
                          const pResS = selectedPartResolved[match.id];
                          const pResM = myPredsResolved[match.id];
                          const rRes = realResolved[match.id];
                          
                          // COMPARISON MODE RENDERING
                          if (compareMode) {
                            const scoreS = pResS && pResS.score_home !== null && pResS.score_away !== null ? `${pResS.score_home} - ${pResS.score_away}${pResS.winner && pResS.score_home === pResS.score_away ? ` (${pResS.winner === pResS.home ? "L" : "V"})` : ""}` : "- : -";
                            const scoreM = pResM && pResM.score_home !== null && pResM.score_away !== null ? `${pResM.score_home} - ${pResM.score_away}${pResM.winner && pResM.score_home === pResM.score_away ? ` (${pResM.winner === pResM.home ? "L" : "V"})` : ""}` : "- : -";
                            const hasMyPred = pResM && pResM.score_home !== null;
                            const hasPartPred = pResS && pResS.score_home !== null;
                            
                            let compClass = "match-card-conflict";
                            let compBadgeText = "Diferente";
                            let compBadgeClass = "badge-danger";
                            
                            if (!hasPartPred || !hasMyPred) {
                              compClass = "";
                              compBadgeText = "Sin predicción";
                              compBadgeClass = "badge-neutral";
                            } else {
                              const sameScore = pResS.score_home === pResM.score_home && pResS.score_away === pResM.score_away;
                              const outcomeS = pResS.score_home > pResS.score_away ? "H" : (pResS.score_home < pResS.score_away ? "A" : (pResS.winner === pResS.home ? "H" : "A"));
                              const outcomeM = pResM.score_home > pResM.score_away ? "H" : (pResM.score_home < pResM.score_away ? "A" : (pResM.winner === pResM.home ? "H" : "A"));
                              const sameOutcome = outcomeS === outcomeM;
                              
                              if (sameScore) {
                                compClass = "match-card-exact-match";
                                compBadgeText = "🎯 Coincidencia Exacta";
                                compBadgeClass = "badge-success";
                              } else if (sameOutcome) {
                                compClass = "match-card-outcome-match";
                                compBadgeText = "🔵 Mismo Ganador";
                                compBadgeClass = "badge-info";
                              }
                            }
                            
                            return (
                              <div key={match.id} className={`match-card ${compClass} ${match.is_live ? "match-card-live" : ""}`}>
                                <div className="match-card-header">
                                  <span className="match-meta">
                                    {match.id <= 72 ? `Grupo ${match.group_name}` : "Eliminación Directa"} · #{match.match_number} · {match.match_date}
                                    {match.is_live && <span className="live-minute-badge"> {match.time_elapsed}'</span>}
                                  </span>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    {match.is_live && <span className="badge badge-live">● EN VIVO</span>}
                                    <span className={`badge ${compBadgeClass}`}>{compBadgeText}</span>
                                  </div>
                                </div>
                                <div className="comparison-fixture-row">
                                  <div className="comparison-team-side">
                                    <span className="team-name">{match.id <= 72 ? match.team_home : (pResS?.home || pResM?.home || match.team_home)}</span>
                                    <span className="flag-emoji large">{gf(match.id <= 72 ? match.team_home : (pResS?.home || pResM?.home || match.team_home))}</span>
                                  </div>
                                  <div className="comparison-vs-badge">VS</div>
                                  <div className="comparison-team-side text-left">
                                    <span className="flag-emoji large">{gf(match.id <= 72 ? match.team_away : (pResS?.away || pResM?.away || match.team_away))}</span>
                                    <span className="team-name">{match.id <= 72 ? match.team_away : (pResS?.away || pResM?.away || match.team_away)}</span>
                                  </div>
                                </div>
                                <div className="comparison-predictions-grid">
                                  <div className="comparison-user-prediction">
                                    <div className="comparison-user-name">{selectedPart.name}</div>
                                    <div className="comparison-score text-bebas" style={{ color: "var(--accent)" }}>{scoreS}</div>
                                  </div>
                                  <div className="comparison-user-prediction my-prediction-column">
                                    <div className="comparison-user-name">Tú</div>
                                    <div className="comparison-score text-bebas" style={{ color: hasMyPred ? "var(--green)" : "var(--accent)" }}>{scoreM}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // STANDARD VIEW RENDERING
                          const hasPartPred = pResS && pResS.score_home !== null;
                          if(!hasPartPred) return(
                            <div key={match.id} className={`match-card ${match.is_live ? "match-card-live" : "match-card-finished opacity-60"}`}>
                              <div className="match-card-header">
                                <span className="match-meta">
                                  {match.id <= 72 ? `Grupo ${match.group_name}` : "Eliminación Directa"} · #{match.match_number}
                                  {match.is_live && <span className="live-minute-badge"> {match.time_elapsed}'</span>}
                                </span>
                                {match.is_live ? (
                                  <span className="badge badge-live">● EN VIVO</span>
                                ) : (
                                  <span className="badge badge-neutral">Sin predicción</span>
                                )}
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
                          const isLive = match.is_live;
                          let pts = null;
                          let isExact = false;
                          let isWinner = false;
                          let wasDemoted = false;
                          
                          if ((finished || isLive) && pResS && pResS.score_home !== null && pResS.score_away !== null && rRes && rRes.score_home !== null && rRes.score_away !== null) {
                            pts = getMatchPointsUnified(match.id, selectedPartResolved, realResolved);
                            
                            if (match.id <= 72) {
                              isExact = pts === 5;
                              isWinner = pts === 3;
                            } else {
                              const isWinnerCorrect = (pResS.winner === rRes.winner && rRes.winner !== null);
                              if (isWinnerCorrect) {
                                const isMatchupCorrect = (pResS.home === rRes.home && pResS.away === rRes.away) || (pResS.home === rRes.away && pResS.away === rRes.home);
                                if (isMatchupCorrect) {
                                  if (pResS.home === rRes.home) {
                                    isExact = (pResS.score_home === rRes.score_home && pResS.score_away === rRes.score_away);
                                  } else {
                                    isExact = (pResS.score_home === rRes.score_away && pResS.score_away === rRes.score_home);
                                  }
                                }
                                
                                let hasAncestorError = false;
                                if (isExact) {
                                  const ancestors = getAncestors(match.id);
                                  for (const aId of ancestors) {
                                    const pAnc = selectedPartResolved[aId];
                                    const rAnc = realResolved[aId];
                                    if (!pAnc || !rAnc) { hasAncestorError = true; break; }
                                    const isAncMatchupCorrect = (pAnc.home === rAnc.home && pAnc.away === rAnc.away) || (pAnc.home === rAnc.away && pAnc.away === rAnc.home);
                                    if (!isAncMatchupCorrect) { hasAncestorError = true; break; }
                                  }
                                }
                                
                                if (isExact && hasAncestorError) {
                                  isExact = false;
                                  isWinner = true;
                                  wasDemoted = true;
                                } else {
                                  isWinner = !isExact;
                                }
                              }
                            }
                          }
                          
                          let matchCardClass = "match-card";
                          if(isLive){
                            matchCardClass += " match-card-live";
                          } else if(finished){
                            if(isExact) matchCardClass += " match-card-exact";
                            else if(isWinner) matchCardClass += " match-card-winner";
                            else matchCardClass += " match-card-incorrect";
                          } else {
                            matchCardClass += " match-card-locked";
                          }

                          let liveGlowClass = "";
                          if (isLive && pResS) {
                            if (isExact) liveGlowClass = "live-glow-exact";
                            else if (isWinner) liveGlowClass = "live-glow-winner";
                          }

                          return(
                            <div key={match.id} className={matchCardClass}>
                              <div className="match-card-header">
                                <span className="match-meta">
                                  {match.id <= 72 ? `Grupo ${match.group_name}` : "Eliminación Directa"} · #{match.match_number} · {match.match_date}
                                  {isLive && <span className="live-minute-badge"> {match.time_elapsed}'</span>}
                                </span>
                                {isLive && <span className="badge badge-live">● EN VIVO</span>}
                                {finished&&pts!==null&&<span className={`badge ${isExact?'badge-success':isWinner?'badge-info':'badge-danger'} badge-pts-earned`}>
                                  {isExact ? `🎯 +${pts}` : isWinner ? (wasDemoted ? `✓ +${pts} (⚠️ Rival diferente)` : `✓ +${pts}`) : "✗ 0"}
                                </span>}
                                {isLive&&pts!==null&&pts>0&&<span className={`badge ${isExact?'badge-success-glow':'badge-info-glow'} badge-pts-earned`}>{isExact?`🎯 +${pts} (Parcial)`:`✓ +${pts} (Parcial)`}</span>}
                                {!finished&&!isLive&&<span className="badge badge-success">🔒 Enviado</span>}
                              </div>
                              <div className="match-fixture-row">
                                <div className="team-home">
                                  <span className="team-name">{match.id <= 72 ? match.team_home : pResS.home}</span>
                                  <span className="flag-emoji large">{gf(match.id <= 72 ? match.team_home : pResS.home)}</span>
                                </div>
                                <div className="score-inputs-container">
                                  <div className={`locked-prediction text-bebas ${liveGlowClass}`}>
                                    <span className="predicted-score">{pResS.score_home}</span>
                                    <span className="score-separator">:</span>
                                    <span className="predicted-score">{pResS.score_away}</span>
                                  </div>
                                  {match.id >= 73 && pResS && pResS.score_home !== null && pResS.score_home === pResS.score_away && (
                                    <div className="penalty-winner-text" style={{ fontSize: "10px", color: "var(--accent)", marginTop: "4px", textAlign: "center" }}>
                                      Pasa: {pResS.winner}
                                    </div>
                                  )}
                                </div>
                                <div className="team-away">
                                  <span className="flag-emoji large">{gf(match.id <= 72 ? match.team_away : pResS.away)}</span>
                                  <span className="team-name">{match.id <= 72 ? match.team_away : pResS.away}</span>
                                </div>
                              </div>
                              {(finished || isLive) && <div className="real-score-row">Resultado {isLive ? "parcial" : "real"}: <span className="real-score-accent text-bebas" style={{color: isLive ? "var(--green)" : "var(--accent)"}}>{rRes ? rRes.score_home : match.score_home} - {rRes ? rRes.score_away : match.score_away}</span></div>}
                            </div>
                          );
                        })}
                      </div>
                      {!filteredMatches.length&&<div className="no-data">No se encontraron partidos</div>}
                    </>
                  ) : (
                    (() => {
                      const hasMatches = matches.some(m => m.id === 73);
                      const partBracket = resolvePredictionsWithSource(partPreds, mergedMatches, hasMatches ? "db" : "real");
                      
                      const renderPartMatchCardCompact = (matchId) => {
                        const m = partBracket[matchId];
                        if (!m) return null;
                        const r = realResolved[matchId];
                        const isTie = m.score_home !== null && m.score_away !== null && m.score_home === m.score_away;
                        const isHomeWinner = m.winner === m.home && m.winner !== null;
                        const isAwayWinner = m.winner === m.away && m.winner !== null;
                        
                        let hasAncestorError = false;
                        if (r && r.is_finished) {
                          const ancestors = getAncestors(m.id);
                          for (const aId of ancestors) {
                            const pAnc = partBracket[aId];
                            const rAnc = realResolved[aId];
                            if (!pAnc || !rAnc) { hasAncestorError = true; break; }
                            const isAncMatchupCorrect = (pAnc.home === rAnc.home && pAnc.away === rAnc.away) || (pAnc.home === rAnc.away && pAnc.away === rAnc.home);
                            if (!isAncMatchupCorrect) { hasAncestorError = true; break; }
                          }
                        }
                        
                        return (
                          <div key={m.id} className={`bracket-match-card ${m.winner ? "has-winner" : ""}`} style={{ minHeight: isTie ? "130px" : "110px", height: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "14px" }}>
                              <span className="bracket-match-num">Match #{m.id}</span>
                              {hasAncestorError && <span className="badge badge-warning" style={{ fontSize: "8.5px", padding: "1px 4px" }} title="Rival diferente en ronda previa. No sumará exacto.">⚠️ Rival diff</span>}
                            </div>
                            
                            <div className="bracket-match-teams">
                              <div className={`bracket-team-row ${isHomeWinner ? "is-winner" : ""}`}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                                  <span className="flag-emoji">{m.home ? gf(m.home) : "🏳️"}</span>
                                  <span className="team-name" title={m.home}>{m.home || "-"}</span>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: "bold", paddingRight: 4, color: "var(--accent)" }}>
                                  {m.score_home !== null ? m.score_home : "-"}
                                </span>
                              </div>
                              
                              <div className={`bracket-team-row ${isAwayWinner ? "is-winner" : ""}`}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                                  <span className="flag-emoji">{m.away ? gf(m.away) : "🏳️"}</span>
                                  <span className="team-name" title={m.away}>{m.away || "-"}</span>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: "bold", paddingRight: 4, color: "var(--accent)" }}>
                                  {m.score_away !== null ? m.score_away : "-"}
                                </span>
                              </div>
                            </div>
                            {isTie && (
                              <div className="penalty-winner-text" style={{ fontSize: "11px", color: "var(--green)", marginTop: "4px", textAlign: "center", fontWeight: "bold" }}>
                                🏆 Pasa: {m.winner}
                              </div>
                            )}
                          </div>
                        );
                      };
                      
                      const renderPartTreeView = () => {
                        const leftR32 = [73, 75, 74, 77, 83, 84, 81, 82];
                        const leftR16 = [90, 89, 93, 94];
                        const leftQF  = [97, 98];
                        const leftSF  = [101];

                        const rightR32 = [76, 78, 79, 80, 86, 88, 85, 87];
                        const rightR16 = [91, 92, 95, 96];
                        const rightQF  = [99, 100];
                        const rightSF  = [102];

                        return (
                          <div className="tree-mode-wrapper">
                            <div className="bracket-viewport">
                              <div className="bracket-container">
                                <div className="bracket-col col-r32">
                                  <div className="bracket-col-title">R32 (Izq)</div>
                                  <div className="bracket-col-matches">
                                    {leftR32.map(id => renderPartMatchCardCompact(id))}
                                  </div>
                                </div>

                                <div className="bracket-col col-r16">
                                  <div className="bracket-col-title">Octavos (Izq)</div>
                                  <div className="bracket-col-matches">
                                    {leftR16.map(id => renderPartMatchCardCompact(id))}
                                  </div>
                                </div>

                                <div className="bracket-col col-qf">
                                  <div className="bracket-col-title">Cuartos (Izq)</div>
                                  <div className="bracket-col-matches">
                                    {leftQF.map(id => renderPartMatchCardCompact(id))}
                                  </div>
                                </div>

                                <div className="bracket-col col-sf">
                                  <div className="bracket-col-title">Semis (Izq)</div>
                                  <div className="bracket-col-matches">
                                    {leftSF.map(id => renderPartMatchCardCompact(id))}
                                  </div>
                                </div>

                                <div className="bracket-col col-finals">
                                  <div className="bracket-col-title">Finales</div>
                                  <div className="bracket-col-matches finals-grid">
                                    <div className="finals-group main-final-grid">
                                      <div className="finals-title gold-text">🏆 FINAL</div>
                                      {renderPartMatchCardCompact(104)}
                                    </div>
                                    <div className="finals-group third-place-grid">
                                      <div className="finals-title text-dim">🥉 TERCER PUESTO</div>
                                      {renderPartMatchCardCompact(103)}
                                    </div>
                                  </div>
                                </div>

                                <div className="bracket-col col-sf">
                                  <div className="bracket-col-title">Semis (Der)</div>
                                  <div className="bracket-col-matches">
                                    {rightSF.map(id => renderPartMatchCardCompact(id))}
                                  </div>
                                </div>

                                <div className="bracket-col col-qf">
                                  <div className="bracket-col-title">Cuartos (Der)</div>
                                  <div className="bracket-col-matches">
                                    {rightQF.map(id => renderPartMatchCardCompact(id))}
                                  </div>
                                </div>

                                <div className="bracket-col col-r16">
                                  <div className="bracket-col-title">Octavos (Der)</div>
                                  <div className="bracket-col-matches">
                                    {rightR16.map(id => renderPartMatchCardCompact(id))}
                                  </div>
                                </div>

                                <div className="bracket-col col-r32">
                                  <div className="bracket-col-title">R32 (Der)</div>
                                  <div className="bracket-col-matches">
                                    {rightR32.map(id => renderPartMatchCardCompact(id))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      };
                      
                      const rounds = [
                        { name: "Dieciseisavos de Final (R32)", ids: [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88] },
                        { name: "Octavos de Final (R16)", ids: [89, 90, 91, 92, 93, 94, 95, 96] },
                        { name: "Cuartos de Final (QF)", ids: [97, 98, 99, 100] },
                        { name: "Semifinales (SF)", ids: [101, 102] },
                        { name: "Tercer Puesto y Final", ids: [103, 104] }
                      ];
                      
                      return (
                        <div className="list-mode-wrapper fade-in" style={{ marginTop: "16px" }}>
                          <details style={{ marginBottom: "24px", border: "1px solid var(--border)", borderRadius: "16px", background: "rgba(9, 11, 24, 0.3)" }} className="glass-card" open>
                            <summary style={{ cursor: "pointer", padding: "8px 12px", fontWeight: "bold", color: "var(--accent)", outline: "none", display: "list-item" }} className="text-bebas">
                              👁️ DIAGRAMA VISUAL DEL BRACKET DE {selectedPart.name.toUpperCase()}
                            </summary>
                            <div style={{ marginTop: "16px" }}>
                              {renderPartTreeView()}
                            </div>
                          </details>

                          {rounds.map(round => (
                            <div key={round.name} className="bracket-round-section" style={{ marginBottom: "32px" }}>
                              <h4 className="text-bebas" style={{ fontSize: "20px", color: "var(--accent)", borderBottom: "1px solid var(--border)", paddingBottom: "6px", marginBottom: "16px" }}>
                                {round.name}
                              </h4>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                                {round.ids.map(id => renderPartMatchCardCompact(id))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
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

        {/* BRACKETS PREDICTIONS / SIMULATOR */}
        {view==="predictions"&&(
          <div className="view-brackets fade-in">
            <div className="view-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <h3 className="section-title text-bebas" style={{ margin: 0 }}>{hasKnockoutMatches ? "🌳 PREDICCIONES DE BRACKETS" : "🌳 SIMULADOR DE BRACKETS"}</h3>
              <div style={{ display: "flex", gap: "10px" }}>
                {user.is_admin && (
                  <button onClick={publishKnockoutMatches} disabled={sending} className="btn-success">
                    {sending ? "Guardando..." : hasKnockoutMatches ? "Actualizar Cruces Oficiales 🔄" : "Publicar Bracket Oficial 🔒"}
                  </button>
                )}
                <button onClick={() => { if(window.confirm("¿Restablecer la simulación/borrador?")) { setDrafts({}); } }} className="btn-secondary">
                  Restablecer Borrador 🗑️
                </button>
              </div>
            </div>
            
            <div className="glass-card rules-alert-card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
              <h4 style={{ margin: "0 0 8px 0", color: "var(--accent)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>💡</span> REGLAS DE PUNTUACIÓN Y CONTINUIDAD
              </h4>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", lineHeight: "1.6", color: "var(--text-dim)" }}>
                <li><strong>Fase de Grupos:</strong> Acierto ganador = 3 pts. Acierto empate (no exacto) = 1 pt. Marcador exacto = 6 pts.</li>
                <li><strong>Eliminatoria (Brackets):</strong> Acierto ganador = +3 pts base. Marcador exacto (con cruce correcto) = +3 pts base (Máx: 6 pts base).</li>
                <li><strong>Multiplicadores de Llave:</strong> R32 (x1), Octavos (x2), Cuartos (x3), Semis y 3er puesto (x4), Final (x5).</li>
                <li><strong>Regla de Continuidad:</strong> Si fallás el rival de un equipo en la ronda anterior (ej. pusiste España pero pasó Inglaterra en la realidad), ya no podés sumar los +3 pts de <em>Marcador Exacto</em> en ese equipo, solo sumarás por <em>Ganador</em> si el equipo avanza en la realidad.</li>
                <li><strong>Empates (Penales):</strong> Si pones empate en el marcador, debes elegir cuál de los dos equipos avanza a la siguiente ronda haciendo clic en los botones de penales.</li>
              </ul>
            </div>

            {(() => {
              const hasMatches = matches.some(m => m.id === 73);
              const isBracketLocked = preds.some(p => p.match_id >= 73);
              const merged = getBracketDraftsMerged();
              const userBracket = resolvePredictionsWithSource(merged, mergedMatches, hasMatches ? "db" : "real");
              const realResolved = resolveRealResults(mergedMatches);

              const handleScoreChange = (mid, side, value) => {
                setDrafts(prev => {
                  const updated = { ...prev };
                  if (!updated[mid]) updated[mid] = {};
                  updated[mid][side] = value;
                  
                  const h = updated[mid].home;
                  const a = updated[mid].away;
                  if (h !== undefined && a !== undefined && h !== "" && a !== "") {
                    if (parseInt(h) !== parseInt(a)) {
                      delete updated[mid].penaltyWinner;
                    }
                  }
                  return updated;
                });
              };

              const handleSelectPenaltyWinner = (mid, winnerSide) => {
                setDrafts(prev => {
                  const updated = { ...prev };
                  if (!updated[mid]) updated[mid] = {};
                  updated[mid].penaltyWinner = winnerSide;
                  return updated;
                });
              };

              const renderMatchCardCompact = (matchId, readOnly = false) => {
                const m = userBracket[matchId];
                if (!m) return null;
                const r = realResolved[matchId];
                
                const isHomePlaceholder = !m.home || m.home.startsWith("Ganador P") || m.home.startsWith("Perdedor P") || m.home === "";
                const isAwayPlaceholder = !m.away || m.away.startsWith("Ganador P") || m.away.startsWith("Perdedor P") || m.away === "";
                const isDisabled = isHomePlaceholder || isAwayPlaceholder || readOnly || isBracketLocked;
                
                const draft = drafts[m.id] || {};
                const dbPred = preds.find(p => p.match_id === m.id);
                let initialHome = "";
                let initialAway = "";
                let initialPenaltyWinner = null;
                
                if (dbPred) {
                  const decoded = decodePrediction(dbPred.pred_home, dbPred.pred_away);
                  if (decoded) {
                    initialHome = String(decoded.homeScore);
                    initialAway = String(decoded.awayScore);
                    initialPenaltyWinner = decoded.winnerIsHome ? "home" : "away";
                  }
                }
                
                const hScoreVal = draft.home !== undefined ? draft.home : initialHome;
                const aScoreVal = draft.away !== undefined ? draft.away : initialAway;
                const penaltyWinner = draft.penaltyWinner !== undefined ? draft.penaltyWinner : (hScoreVal === aScoreVal && hScoreVal !== "" ? initialPenaltyWinner : null);
                
                const isTie = hScoreVal !== "" && aScoreVal !== "" && parseInt(hScoreVal) === parseInt(aScoreVal);
                
                const isHomeWinner = m.winner === m.home && m.winner !== null;
                const isAwayWinner = m.winner === m.away && m.winner !== null;
                
                let hasAncestorError = false;
                if (r && r.is_finished) {
                  const ancestors = getAncestors(m.id);
                  for (const aId of ancestors) {
                    const pAnc = userBracket[aId];
                    const rAnc = realResolved[aId];
                    if (!pAnc || !rAnc) { hasAncestorError = true; break; }
                    const isAncMatchupCorrect = (pAnc.home === rAnc.home && pAnc.away === rAnc.away) || (pAnc.home === rAnc.away && pAnc.away === rAnc.home);
                    if (!isAncMatchupCorrect) { hasAncestorError = true; break; }
                  }
                }
                
                return (
                  <div key={m.id} className={`bracket-match-card ${m.winner ? "has-winner" : ""} ${isDisabled && !readOnly ? "is-disabled" : ""}`} style={{ minHeight: isTie ? "170px" : "110px", height: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "14px" }}>
                      <span className="bracket-match-num">Match #{m.id}</span>
                      {hasAncestorError && <span className="badge badge-warning" style={{ fontSize: "8.5px", padding: "1px 4px" }} title="Rival diferente en ronda previa. No sumará exacto.">⚠️ Rival diff</span>}
                    </div>
                    
                    <div className="bracket-match-teams">
                      <div className={`bracket-team-row ${isHomeWinner ? "is-winner" : ""} ${isHomePlaceholder ? "is-placeholder" : ""}`}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                          <span className="flag-emoji">{!isHomePlaceholder ? gf(m.home) : "🏳️"}</span>
                          <span className="team-name" title={m.home}>{m.home}</span>
                        </div>
                        <input 
                          type="number" 
                          min="0"
                          max="20"
                          value={hScoreVal}
                          disabled={isDisabled}
                          onChange={e => handleScoreChange(m.id, "home", e.target.value)}
                          className="bracket-score-input-inline"
                          placeholder="-"
                        />
                      </div>
                      
                      <div className={`bracket-team-row ${isAwayWinner ? "is-winner" : ""} ${isAwayPlaceholder ? "is-placeholder" : ""}`}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                          <span className="flag-emoji">{!isAwayPlaceholder ? gf(m.away) : "🏳️"}</span>
                          <span className="team-name" title={m.away}>{m.away}</span>
                        </div>
                        <input 
                          type="number" 
                          min="0"
                          max="20"
                          value={aScoreVal}
                          disabled={isDisabled}
                          onChange={e => handleScoreChange(m.id, "away", e.target.value)}
                          className="bracket-score-input-inline"
                          placeholder="-"
                        />
                      </div>
                    </div>
                    
                    {isTie && (
                      readOnly ? (
                        <div className="penalty-winner-text" style={{ fontSize: "11px", color: "var(--green)", marginTop: "8px", textAlign: "center", fontWeight: "bold" }}>
                          🏆 Pasa: {m.winner}
                        </div>
                      ) : (
                        !isDisabled && (
                          <div className="penalty-tiebreaker-inline">
                            <div className="penalty-label">⚡ Empate - Clasifica:</div>
                            <div className="penalty-buttons-container">
                              <button 
                                type="button"
                                onClick={() => handleSelectPenaltyWinner(m.id, "home")} 
                                className={`penalty-btn-choice ${penaltyWinner === "home" ? "active" : ""}`}
                              >
                                🏆 Avanza {m.home}
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleSelectPenaltyWinner(m.id, "away")} 
                                className={`penalty-btn-choice ${penaltyWinner === "away" ? "active" : ""}`}
                              >
                                🏆 Avanza {m.away}
                              </button>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>
                );
              };

              const saveButton = isBracketLocked ? (
                <div className="glass-card text-center" style={{ margin: "20px 0", border: "1px solid var(--green)", padding: "16px 20px" }}>
                  <span style={{ fontSize: 14, color: "var(--green)", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span>🔒</span> TU BRACKET ESTÁ GUARDADO Y BLOQUEADO OFICIALMENTE
                  </span>
                </div>
              ) : hasMatches ? (
                <div style={{ display: "flex", justifyContent: "center", margin: "24px 0" }}>
                  <button onClick={saveBracketPredictions} disabled={sending} className="btn-primary" style={{ padding: "12px 32px", fontSize: "16px", borderRadius: "14px", fontWeight: "bold", width: "100%", maxWidth: "400px" }}>
                    {sending ? "Guardando..." : "🔒 Guardar Todo el Bracket"}
                  </button>
                </div>
              ) : (
                <div className="glass-card text-center" style={{ margin: "20px 0", border: "1px dashed var(--border)", padding: "16px 20px" }}>
                  <span style={{ fontSize: 13, color: "var(--text-dim)", fontWeight: "500" }}>
                    🔒 El guardado oficial de predicciones se habilitará cuando finalice la fase de grupos y el administrador publique los cruces reales de octavos. ¡Mientras tanto, podés probar tu simulación arriba!
                  </span>
                </div>
              );

              const renderTreeView = () => {
                const leftR32 = [73, 75, 74, 77, 83, 84, 81, 82];
                const leftR16 = [90, 89, 93, 94];
                const leftQF  = [97, 98];
                const leftSF  = [101];

                const rightR32 = [76, 78, 79, 80, 86, 88, 85, 87];
                const rightR16 = [91, 92, 95, 96];
                const rightQF  = [99, 100];
                const rightSF  = [102];

                return (
                  <div className="tree-mode-wrapper">
                    <div className="bracket-viewport">
                      <div className="bracket-container">
                        <div className="bracket-col col-r32">
                          <div className="bracket-col-title">R32 (Izq)</div>
                          <div className="bracket-col-matches">
                            {leftR32.map(id => renderMatchCardCompact(id, true))}
                          </div>
                        </div>

                        <div className="bracket-col col-r16">
                          <div className="bracket-col-title">Octavos (Izq)</div>
                          <div className="bracket-col-matches">
                            {leftR16.map(id => renderMatchCardCompact(id, true))}
                          </div>
                        </div>

                        <div className="bracket-col col-qf">
                          <div className="bracket-col-title">Cuartos (Izq)</div>
                          <div className="bracket-col-matches">
                            {leftQF.map(id => renderMatchCardCompact(id, true))}
                          </div>
                        </div>

                        <div className="bracket-col col-sf">
                          <div className="bracket-col-title">Semis (Izq)</div>
                          <div className="bracket-col-matches">
                            {leftSF.map(id => renderMatchCardCompact(id, true))}
                          </div>
                        </div>

                        <div className="bracket-col col-finals">
                          <div className="bracket-col-title">Finales</div>
                          <div className="bracket-col-matches finals-grid">
                            <div className="finals-group main-final-grid">
                              <div className="finals-title gold-text">🏆 FINAL</div>
                              {renderMatchCardCompact(104, true)}
                            </div>
                            <div className="finals-group third-place-grid">
                              <div className="finals-title text-dim">🥉 TERCER PUESTO</div>
                              {renderMatchCardCompact(103, true)}
                            </div>
                          </div>
                        </div>

                        <div className="bracket-col col-sf">
                          <div className="bracket-col-title">Semis (Der)</div>
                          <div className="bracket-col-matches">
                            {rightSF.map(id => renderMatchCardCompact(id, true))}
                          </div>
                        </div>

                        <div className="bracket-col col-qf">
                          <div className="bracket-col-title">Cuartos (Der)</div>
                          <div className="bracket-col-matches">
                            {rightQF.map(id => renderMatchCardCompact(id, true))}
                          </div>
                        </div>

                        <div className="bracket-col col-r16">
                          <div className="bracket-col-title">Octavos (Der)</div>
                          <div className="bracket-col-matches">
                            {rightR16.map(id => renderMatchCardCompact(id, true))}
                          </div>
                        </div>

                        <div className="bracket-col col-r32">
                          <div className="bracket-col-title">R32 (Der)</div>
                          <div className="bracket-col-matches">
                            {rightR32.map(id => renderMatchCardCompact(id, true))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              };

              const rounds = [
                { name: "Dieciseisavos de Final (R32)", ids: [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88] },
                { name: "Octavos de Final (R16)", ids: [89, 90, 91, 92, 93, 94, 95, 96] },
                { name: "Cuartos de Final (QF)", ids: [97, 98, 99, 100] },
                { name: "Semifinales (SF)", ids: [101, 102] },
                { name: "Tercer Puesto y Final", ids: [103, 104] }
              ];
              
              return (
                <div className="list-mode-wrapper fade-in">
                  {!hasMatches && (
                    <div className="glass-card" style={{ marginBottom: "24px", border: "1px dashed var(--pink)", padding: "16px 20px" }}>
                      <h4 style={{ margin: "0 0 6px 0", color: "var(--pink)", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }} className="text-bebas">
                        <span>🧪</span> MODO SIMULACIÓN ACTIVO
                      </h4>
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.5" }}>
                        Los partidos oficiales de eliminación directa aún no se publican. Abajo podés simular tu bracket en base a <strong>tus predicciones de fase de grupos</strong> (los clasificados se calculan automáticamente según el reglamento FIFA).
                      </p>
                    </div>
                  )}
                  {rounds.map(round => (
                    <div key={round.name} className="bracket-round-section" style={{ marginBottom: "32px" }}>
                      <h4 className="text-bebas" style={{ fontSize: "20px", color: "var(--accent)", borderBottom: "1px solid var(--border)", paddingBottom: "6px", marginBottom: "16px" }}>
                        {round.name}
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                        {round.ids.map(id => renderMatchCardCompact(id, false))}
                      </div>
                    </div>
                  ))}
                  
                  {saveButton}

                  <details style={{ marginTop: "40px", border: "1px solid var(--border)", borderRadius: "16px", background: "rgba(9, 11, 24, 0.3)" }} className="glass-card">
                    <summary style={{ cursor: "pointer", padding: "8px 12px", fontWeight: "bold", color: "var(--accent)", outline: "none", display: "list-item" }} className="text-bebas">
                      👁️ VER DIAGRAMA VISUAL DEL BRACKET (VISTA PREVIA DE CONTROL)
                    </summary>
                    <div style={{ marginTop: "16px" }}>
                      <p style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "16px" }}>
                        Esta es una vista previa gráfica de cómo va avanzando tu bracket. Completá los resultados en la lista superior para ver las actualizaciones en el diagrama.
                      </p>
                      {renderTreeView()}
                    </div>
                  </details>
                </div>
              );
            })()}
          </div>
        )}

        {/* REAL BRACKET VIEW */}
        {view==="real_bracket"&&(
          <div className="view-brackets fade-in">
            <div className="view-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <h3 className="section-title text-bebas" style={{ margin: 0 }}>🌳 BRACKET REAL DEL MUNDIAL</h3>
            </div>
            
            <p className="section-subtitle" style={{ marginBottom: "20px" }}>
              Seguí el avance oficial de la copa. Aquí se muestran los cruces, marcadores y clasificados reales según se van registrando los resultados del torneo.
            </p>

            {(() => {
              const hasMatches = matches.some(m => m.id === 73);
              if (!hasMatches) {
                return (
                  <div className="glass-card text-center" style={{ padding: "30px 20px", border: "1px dashed var(--border)" }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>⏳</div>
                    <h4 className="text-bebas" style={{ color: "var(--accent)", margin: "0 0 8px 0" }}>EL BRACKET OFICIAL AÚN NO HA COMENZADO</h4>
                    <p style={{ color: "var(--text-dim)", fontSize: "14px", margin: 0, lineHeight: "1.5" }}>
                      Los cruces reales del Round of 32 se habilitarán y mostrarán aquí tan pronto como finalice la fase de grupos y el administrador los publique oficialmente.
                    </p>
                  </div>
                );
              }

              const realResolved = resolveRealResults(mergedMatches);

              const renderRealMatchCardCompact = (matchId) => {
                const m = realResolved[matchId];
                if (!m) return null;
                const isTie = m.score_home !== null && m.score_away !== null && m.score_home === m.score_away;
                const isHomeWinner = m.winner === m.home && m.winner !== null;
                const isAwayWinner = m.winner === m.away && m.winner !== null;
                
                return (
                  <div key={m.id} className={`bracket-match-card ${m.winner ? "has-winner" : ""}`} style={{ minHeight: isTie ? "130px" : "110px", height: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "14px" }}>
                      <span className="bracket-match-num">Match #{m.id}</span>
                      {m.is_finished && <span className="badge badge-success" style={{ fontSize: "8px", padding: "1px 4px" }}>✓ FINAL</span>}
                    </div>
                    
                    <div className="bracket-match-teams">
                      <div className={`bracket-team-row ${isHomeWinner ? "is-winner" : ""} is-placeholder`}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                          <span className="flag-emoji">{m.home ? gf(m.home) : "🏳️"}</span>
                          <span className="team-name" title={m.home}>{m.home || "-"}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: "bold", paddingRight: 4, color: "var(--accent)" }}>
                          {m.score_home !== null ? m.score_home : "-"}
                        </span>
                      </div>
                      
                      <div className={`bracket-team-row ${isAwayWinner ? "is-winner" : ""} is-placeholder`}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                          <span className="flag-emoji">{m.away ? gf(m.away) : "🏳️"}</span>
                          <span className="team-name" title={m.away}>{m.away || "-"}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: "bold", paddingRight: 4, color: "var(--accent)" }}>
                          {m.score_away !== null ? m.score_away : "-"}
                        </span>
                      </div>
                    </div>
                    {isTie && (
                      <div className="penalty-winner-text" style={{ fontSize: "11px", color: "var(--green)", marginTop: "4px", textAlign: "center", fontWeight: "bold" }}>
                        🏆 Pasa: {m.winner}
                      </div>
                    )}
                  </div>
                );
              };

              const renderRealTreeView = () => {
                const leftR32 = [73, 75, 74, 77, 83, 84, 81, 82];
                const leftR16 = [90, 89, 93, 94];
                const leftQF  = [97, 98];
                const leftSF  = [101];

                const rightR32 = [76, 78, 79, 80, 86, 88, 85, 87];
                const rightR16 = [91, 92, 95, 96];
                const rightQF  = [99, 100];
                const rightSF  = [102];

                return (
                  <div className="tree-mode-wrapper">
                    <div className="bracket-viewport">
                      <div className="bracket-container">
                        <div className="bracket-col col-r32">
                          <div className="bracket-col-title">R32 (Izq)</div>
                          <div className="bracket-col-matches">
                            {leftR32.map(id => renderRealMatchCardCompact(id))}
                          </div>
                        </div>

                        <div className="bracket-col col-r16">
                          <div className="bracket-col-title">Octavos (Izq)</div>
                          <div className="bracket-col-matches">
                            {leftR16.map(id => renderRealMatchCardCompact(id))}
                          </div>
                        </div>

                        <div className="bracket-col col-qf">
                          <div className="bracket-col-title">Cuartos (Izq)</div>
                          <div className="bracket-col-matches">
                            {leftQF.map(id => renderRealMatchCardCompact(id))}
                          </div>
                        </div>

                        <div className="bracket-col col-sf">
                          <div className="bracket-col-title">Semis (Izq)</div>
                          <div className="bracket-col-matches">
                            {leftSF.map(id => renderRealMatchCardCompact(id))}
                          </div>
                        </div>

                        <div className="bracket-col col-finals">
                          <div className="bracket-col-title">Finales</div>
                          <div className="bracket-col-matches finals-grid">
                            <div className="finals-group main-final-grid">
                              <div className="finals-title gold-text">🏆 FINAL</div>
                              {renderRealMatchCardCompact(104)}
                            </div>
                            <div className="finals-group third-place-grid">
                              <div className="finals-title text-dim">🥉 TERCER PUESTO</div>
                              {renderRealMatchCardCompact(103)}
                            </div>
                          </div>
                        </div>

                        <div className="bracket-col col-sf">
                          <div className="bracket-col-title">Semis (Der)</div>
                          <div className="bracket-col-matches">
                            {rightSF.map(id => renderRealMatchCardCompact(id))}
                          </div>
                        </div>

                        <div className="bracket-col col-qf">
                          <div className="bracket-col-title">Cuartos (Der)</div>
                          <div className="bracket-col-matches">
                            {rightQF.map(id => renderRealMatchCardCompact(id))}
                          </div>
                        </div>

                        <div className="bracket-col col-r16">
                          <div className="bracket-col-title">Octavos (Der)</div>
                          <div className="bracket-col-matches">
                            {rightR16.map(id => renderRealMatchCardCompact(id))}
                          </div>
                        </div>

                        <div className="bracket-col col-r32">
                          <div className="bracket-col-title">R32 (Der)</div>
                          <div className="bracket-col-matches">
                            {rightR32.map(id => renderRealMatchCardCompact(id))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              };

              const rounds = [
                { name: "Dieciseisavos de Final (R32)", ids: [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88] },
                { name: "Octavos de Final (R16)", ids: [89, 90, 91, 92, 93, 94, 95, 96] },
                { name: "Cuartos de Final (QF)", ids: [97, 98, 99, 100] },
                { name: "Semifinales (SF)", ids: [101, 102] },
                { name: "Tercer Puesto y Final", ids: [103, 104] }
              ];

              return (
                <div className="list-mode-wrapper fade-in">
                  <details style={{ marginBottom: "24px", border: "1px solid var(--border)", borderRadius: "16px", background: "rgba(9, 11, 24, 0.3)" }} className="glass-card" open>
                    <summary style={{ cursor: "pointer", padding: "8px 12px", fontWeight: "bold", color: "var(--accent)", outline: "none", display: "list-item" }} className="text-bebas">
                      👁️ DIAGRAMA GRÁFICO REAL DE LA COPA
                    </summary>
                    <div style={{ marginTop: "16px" }}>
                      {renderRealTreeView()}
                    </div>
                  </details>

                  {rounds.map(round => (
                    <div key={round.name} className="bracket-round-section" style={{ marginBottom: "32px" }}>
                      <h4 className="text-bebas" style={{ fontSize: "20px", color: "var(--accent)", borderBottom: "1px solid var(--border)", paddingBottom: "6px", marginBottom: "16px" }}>
                        {round.name}
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                        {round.ids.map(id => renderRealMatchCardCompact(id))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ADMIN */}
        {view==="admin"&&user.is_admin&&(
          <div className="view-admin fade-in">
            <h3 className="section-title text-bebas">👑 PANEL DE ADMIN</h3>
            <p className="section-subtitle">Ingresá los resultados reales. Los puntos se recalculan para todos.</p>
            
            <div className="glass-card admin-summary-card" style={{ marginBottom: 24 }}>
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

            <div className="search-filter-bar">
              <input 
                type="text" 
                placeholder="🔍 Buscar país..." 
                value={adminSearch}
                onChange={e => setAdminSearch(e.target.value)}
                className="search-input"
              />
              <select 
                value={adminStatus} 
                onChange={e => setAdminStatus(e.target.value)}
                className="filter-select"
              >
                <option value="pending">⏳ Pendientes de resultado</option>
                <option value="finished">✅ Finalizados</option>
                <option value="all">Todos los partidos</option>
              </select>
            </div>

            <GF gs={GS} sel={grp} set={setGrp}/>
            <div className="fixtures-list">
              {(() => {
                const adminFilteredMatches = fm.filter(match => {
                  const matchesSearch = adminSearch.trim() === "" ||
                    match.team_home.toLowerCase().includes(adminSearch.toLowerCase()) ||
                    match.team_away.toLowerCase().includes(adminSearch.toLowerCase());
                    
                  if (!matchesSearch) return false;
                  
                  if (adminStatus === "pending") {
                    return !match.is_finished;
                  }
                  if (adminStatus === "finished") {
                    return match.is_finished;
                  }
                  return true;
                });
                
                return adminFilteredMatches.map(m => (
                  <AMC key={m.id} m={m} onU={updResult} winner={getRealWinnerTeam(m, matches)}/>
                ));
              })()}
              {fm.length === 0 && <div className="no-data">No hay partidos en este grupo</div>}
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

function AMC({m,onU,winner}){
  const [h,sH]=useState("");
  const [a,sA]=useState("");
  const [penaltyWinner, setPenaltyWinner] = useState(null);
  
  useEffect(() => {
    sH(m.score_home !== null ? String(m.score_home) : "");
    sA(m.score_away !== null ? String(m.score_away) : "");
    if (m.score_home !== null && m.score_away !== null && m.score_home === m.score_away) {
      if (winner === m.team_home) setPenaltyWinner("home");
      else if (winner === m.team_away) setPenaltyWinner("away");
      else setPenaltyWinner(null);
    } else {
      setPenaltyWinner(null);
    }
  }, [m, winner]);

  const decH = () => sH(prev => Math.max(0, (parseInt(prev) || 0) - 1).toString());
  const incH = () => sH(prev => ((parseInt(prev) || 0) + 1).toString());
  const decA = () => sA(prev => Math.max(0, (parseInt(prev) || 0) - 1).toString());
  const incA = () => sA(prev => ((parseInt(prev) || 0) + 1).toString());

  const handleSave = () => {
    if(h!=="" && a!=="") {
      const isTie = parseInt(h) === parseInt(a);
      if (m.id >= 73 && isTie && !penaltyWinner) {
        alert("Por favor, selecciona al ganador de penales.");
        return;
      }
      const winTeam = isTie ? (penaltyWinner === "home" ? m.team_home : m.team_away) : (parseInt(h) > parseInt(a) ? m.team_home : m.team_away);
      onU(m.id, h, a, winTeam);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  let cardClass = "match-card";
  if (m.is_finished) {
    cardClass += " match-card-exact";
  }

  const isTie = h !== "" && a !== "" && parseInt(h) === parseInt(a);

  return(
    <div className={cardClass}>
      <div className="match-card-header">
        <span className="match-meta">{m.id <= 72 ? `Grupo ${m.group_name}` : "Eliminación Directa"} · #{m.match_number} · {m.match_date}</span>
        {m.is_finished&&<span className="badge badge-success">✓ FINAL</span>}
      </div>
      <div className="match-fixture-row">
        <div className="team-home">
          <span className="team-name">{m.team_home}</span>
          <span className="flag-emoji large">{gf(m.team_home)}</span>
        </div>
        <div className="score-inputs-container">
          <div className="inputs-row" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button onClick={decH} className="btn-secondary admin-adjust-btn" style={{ padding: "4px 8px", fontSize: "11px", fontWeight: "bold" }}>-</button>
              <input 
                type="number" 
                min="0" 
                value={h} 
                onChange={e=>sH(e.target.value)} 
                onKeyDown={handleKeyDown}
                className="score-box" 
                placeholder="-"
              />
              <button onClick={incH} className="btn-secondary admin-adjust-btn" style={{ padding: "4px 8px", fontSize: "11px", fontWeight: "bold" }}>+</button>
            </div>
            
            <span className="score-separator">:</span>
            
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button onClick={decA} className="btn-secondary admin-adjust-btn" style={{ padding: "4px 8px", fontSize: "11px", fontWeight: "bold" }}>-</button>
              <input 
                type="number" 
                min="0" 
                value={a} 
                onChange={e=>sA(e.target.value)} 
                onKeyDown={handleKeyDown}
                className="score-box" 
                placeholder="-"
              />
              <button onClick={incA} className="btn-secondary admin-adjust-btn" style={{ padding: "4px 8px", fontSize: "11px", fontWeight: "bold" }}>+</button>
            </div>
          </div>
        </div>
        <div className="team-away">
          <span className="flag-emoji large">{gf(m.team_away)}</span>
          <span className="team-name">{m.team_away}</span>
        </div>
      </div>

      {m.id >= 73 && isTie && (
        <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", borderTop: "1px dashed var(--border)", paddingTop: "12px", marginTop: "-4px" }}>
          <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "bold", letterSpacing: "0.5px" }}>🏆 GANADOR REAL DE PENALES:</span>
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              onClick={() => setPenaltyWinner("home")} 
              className={`penalty-btn-choice ${penaltyWinner === "home" ? "active" : ""}`}
              style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }}
            >
              {m.team_home}
            </button>
            <button 
              onClick={() => setPenaltyWinner("away")} 
              className={`penalty-btn-choice ${penaltyWinner === "away" ? "active" : ""}`}
              style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }}
            >
              {m.team_away}
            </button>
          </div>
        </div>
      )}

      <div className="match-card-actions">
        <button onClick={handleSave} className="btn-success btn-sm-action">{m.is_finished?"Actualizar resultado":"Registrar resultado"}</button>
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
