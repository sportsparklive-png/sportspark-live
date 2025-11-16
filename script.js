// SportSpark Live - Expert JS
const API_KEY = '6d3559b8cb2f476fae444c696e1f0d93';  // YOUR NEW KEY!

// DOM Elements
const matchesContainer = document.getElementById('matches-container');
const upcomingContainer = document.getElementById('upcoming-container');
const noMatchesLive = document.getElementById('no-matches-live');
const noUpcoming = document.getElementById('no-upcoming');
const lastUpdatedLive = document.getElementById('last-updated-live');
const lastUpdatedUpcoming = document.getElementById('last-updated-upcoming');
const standingsBody = document.getElementById('standings-body');
const leagueSelect = document.getElementById('league-select');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const darkModeBtn = document.getElementById('dark-mode-btn');

// Format Time
function formatTime(date) {
  return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
}

function updateTimestamp(element) {
  element.textContent = formatTime(new Date());
}

// Fetch with CORS fix
async function fetchData(url) {
  try {
    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, {
      headers: { 'X-Auth-Token': API_KEY }
    });
    if (!response.ok) throw new Error('API Error');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Render Match
function renderMatch(match, container, isUpcoming = false) {
  const home = match.homeTeam.shortName || match.homeTeam.name;
  const away = match.awayTeam.shortName || match.awayTeam.name;
  const homeLogo = match.homeTeam.crest ? `<img src="${match.homeTeam.crest}" alt="${home}">` : '';
  const awayLogo = match.awayTeam.crest ? `<img src="${match.awayTeam.crest}" alt="${away}">` : '';
  let score = '0 - 0', status = 'LIVE';
  if (isUpcoming) {
    score = new Date(match.utcDate).toLocaleString('en-NG', { dateStyle: 'short', timeStyle: 'short' });
    status = 'UPCOMING';
  } else {
    score = (match.score.fullTime.home ?? 0) + ' - ' + (match.score.fullTime.away ?? 0);
    status = match.status === 'IN_PLAY' ? 'LIVE' : 'HT';
  }

  const card = document.createElement('div');
  card.className = 'match-card';
  card.innerHTML = `
    <div class="match-teams">
      <span class="team home">${homeLogo}${home}</span>
      <span class="vs">VS</span>
      <span class="team away">${away}${awayLogo}</span>
    </div>
    <div class="match-score">${score}</div>
    <div class="match-status">${status}</div>
    <div class="match-bet">
      <a href="https://www.sportybet.com/m/register?referralCode=YOUR_SPORTY_CODE" target="_blank">
        Bet Now on SportyBet
      </a>
    </div>
  `;
  container.appendChild(card);
}

// Load functions
async function loadLiveMatches() {
  matchesContainer.innerHTML = '<div class="match-card loading"><p>Fetching...</p></div>';
  const data = await fetchData('https://api.football-data.org/v4/matches');
  matchesContainer.innerHTML = '';
  if (!data || !data.matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED').length) {
    noMatchesLive.classList.remove('hidden');
    return;
  }
  noMatchesLive.classList.add('hidden');
  data.matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED').forEach(m => renderMatch(m, matchesContainer));
  updateTimestamp(lastUpdatedLive);
}

async function loadUpcoming() {
  upcomingContainer.innerHTML = '<div class="match-card loading"><p>Fetching...</p></div>';
  const data = await fetchData('https://api.football-data.org/v4/matches?status=SCHEDULED');
  upcomingContainer.innerHTML = '';
  if (!data || data.matches.length === 0) {
    noUpcoming.classList.remove('hidden');
    return;
  }
  noUpcoming.classList.add('hidden');
  data.matches.slice(0, 10).forEach(m => renderMatch(m, upcomingContainer, true));
  updateTimestamp(lastUpdatedUpcoming);
}

async function loadStandings(code) {
  standingsBody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
  const data = await fetchData(`https://api.football-data.org/v4/competitions/${code}/standings`);
  standingsBody.innerHTML = '';
  if (!data || !data.standings || !data.standings[0]) {
    standingsBody.innerHTML = '<tr><td colspan="6">No standings.</td></tr>';
    return;
  }
  data.standings[0].table.forEach((t, i) => {
    const logo = t.team.crest ? `<img src="${t.team.crest}" alt="">` : '';
    const row = `<tr><td>${i+1}</td><td>${logo} ${t.team.shortName || t.team.name}</td><td>${t.points}</td><td>${t.won}</td><td>${t.draw}</td><td>${t.lost}</td></tr>`;
    standingsBody.innerHTML += row;
  });
}

function performSearch() {
  const q = searchInput.value.toLowerCase();
  [matchesContainer, upcomingContainer].forEach(c => {
    Array.from(c.children).forEach(card => {
      card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

// Dark Mode
darkModeBtn.addEventListener('change', () => {
  document.body.setAttribute('data-theme', darkModeBtn.checked ? 'dark' : 'light');
});

// Listeners
leagueSelect.addEventListener('change', () => loadStandings(leagueSelect.value));
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keyup', e => e.key === 'Enter' && performSearch());

// Start
loadLiveMatches();
loadUpcoming();
loadStandings('PL');

setInterval(() => {
  loadLiveMatches();
  loadUpcoming();
}, 30000);