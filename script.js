// SportSpark Live - Expert JS
// API Key
const API_KEY = 'a31b0355d3504160ad0348a74931a1a0';

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

// Format Time in WAT
function formatTime(date) {
  return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
}

// Update Timestamp
function updateTimestamp(element) {
  element.textContent = formatTime(new Date());
}

// Fetch Data
async function fetchData(url) {
  try {
    const response = await fetch(url, { headers: { 'X-Auth-Token': API_KEY } });
    if (!response.ok) throw new Error('API Error');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Render Match Card
function renderMatch(match, container, isUpcoming = false) {
  const home = match.homeTeam.shortName || match.homeTeam.name;
  const away = match.awayTeam.shortName || match.awayTeam.name;
  const homeLogo = match.homeTeam.crest ? `<img src="${match.homeTeam.crest}" alt="${home}">` : '';
  const awayLogo = match.awayTeam.crest ? `<img src="${match.awayTeam.crest}" alt="${away}">` : '';
  let score = '0 - 0';
  let status = 'LIVE';
  if (!isUpcoming) {
    score = match.score.fullTime.home !== null ? `${match.score.fullTime.home} - ${match.score.fullTime.away}` : '0 - 0';
    status = match.status === 'IN_PLAY' ? 'LIVE' : 'HT';
  } else {
    score = new Date(match.utcDate).toLocaleString('en-NG', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Lagos' });
    status = 'UPCOMING';
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

// Load Live Matches
async function loadLiveMatches() {
  matchesContainer.innerHTML = '<div class="match-card loading"><p>Fetching live matches...</p></div>';
  const data = await fetchData('https://api.football-data.org/v4/matches');
  matchesContainer.innerHTML = '';
  if (!data || data.matches.length === 0) {
    noMatchesLive.classList.remove('hidden');
    return;
  }
  noMatchesLive.classList.add('hidden');
  const live = data.matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED');
  live.forEach(m => renderMatch(m, matchesContainer));
  updateTimestamp(lastUpdatedLive);
}

// Load Upcoming Matches
async function loadUpcoming() {
  upcomingContainer.innerHTML = '<div class="match-card loading"><p>Fetching upcoming fixtures...</p></div>';
  const data = await fetchData('https://api.football-data.org/v4/matches?status=SCHEDULED');
  upcomingContainer.innerHTML = '';
  if (!data || data.matches.length === 0) {
    noUpcoming.classList.remove('hidden');
    return;
  }
  noUpcoming.classList.add('hidden');
  data.matches.forEach(m => renderMatch(m, upcomingContainer, true));
  updateTimestamp(lastUpdatedUpcoming);
}

// Load Standings
async function loadStandings(code) {
  standingsBody.innerHTML = '<tr><td colspan="6">Loading standings...</td></tr>';
  const data = await fetchData(`https://api.football-data.org/v4/competitions/${code}/standings`);
  standingsBody.innerHTML = '';
  if (!data || !data.standings) {
    standingsBody.innerHTML = '<tr><td colspan="6">No standings available.</td></tr>';
    return;
  }
  data.standings[0].table.forEach((team, index) => {
    const logo = team.team.crest ? `<img src="${team.team.crest}" alt="">` : '';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${logo}${team.team.shortName || team.team.name}</td>
      <td>${team.points}</td>
      <td>${team.won}</td>
      <td>${team.draw}</td>
      <td>${team.lost}</td>
    `;
    standingsBody.appendChild(row);
  });
}

// Perform Search
function performSearch() {
  const query = searchInput.value.toLowerCase();
  [matchesContainer, upcomingContainer].forEach(container => {
    Array.from(container.children).forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? '' : 'none';
    });
  });
}

// Dark Mode Toggle (Fixed to Work)
darkModeBtn.addEventListener('change', () => {
  document.body.setAttribute('data-theme', darkModeBtn.checked ? 'dark' : 'light');
});

// Event Listeners
leagueSelect.addEventListener('change', () => loadStandings(leagueSelect.value));
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') performSearch();
});

// Initial Load
loadLiveMatches();
loadUpcoming();
loadStandings('PL');  // Default EPL

// Auto Refresh
setInterval(() => {
  loadLiveMatches();
  loadUpcoming();
}, 30000);