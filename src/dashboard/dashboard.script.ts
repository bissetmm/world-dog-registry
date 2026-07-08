export const dashboardScript = `(() => {
  const apiBase = '/api/v1';
  const state = {
    breeds: [],
    clubs: [],
    breedSearch: '',
    selectedBreedId: '',
    selectedClubCode: '',
    latestOnly: true,
  };

  const elements = {
    apiStatus: document.getElementById('apiStatus'),
    statusText: document.getElementById('statusText'),
    breedSearchInput: document.getElementById('breedSearchInput'),
    breedSelect: document.getElementById('breedSelect'),
    clubSelect: document.getElementById('clubSelect'),
    latestOnlyInput: document.getElementById('latestOnlyInput'),
    refreshButton: document.getElementById('refreshButton'),
    latestCount: document.getElementById('latestCount'),
    latestRank: document.getElementById('latestRank'),
    pointCount: document.getElementById('pointCount'),
    unresolvedCount: document.getElementById('unresolvedCount'),
    chartCaption: document.getElementById('chartCaption'),
    rankingChartCaption: document.getElementById('rankingChartCaption'),
    trendCanvas: document.getElementById('trendCanvas'),
    rankingCanvas: document.getElementById('rankingCanvas'),
    aliasList: document.getElementById('aliasList'),
    importList: document.getElementById('importList'),
    rowCaption: document.getElementById('rowCaption'),
    rankingRowCaption: document.getElementById('rankingRowCaption'),
    statisticsTableBody: document.getElementById('statisticsTableBody'),
    rankingsTableBody: document.getElementById('rankingsTableBody'),
  };

  function formatNumber(value) {
    return value === null || value === undefined
      ? '-'
      : new Intl.NumberFormat('en-US').format(value);
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(\`Request failed: \${response.status}\`);
    }
    return response.json();
  }

  function setStatus(text, ready) {
    elements.statusText.textContent = text;
    elements.apiStatus.classList.toggle('ready', ready);
  }

  async function initialize() {
    setStatus('Loading', false);
    const [breeds, clubs] = await Promise.all([
      fetchJson(\`\${apiBase}/breeds\`),
      fetchJson(\`\${apiBase}/kennel-clubs\`),
    ]);

    state.breeds = breeds;
    state.clubs = clubs.filter((club) => club.supportsRegistration);
    state.selectedBreedId = breeds[0]?.id ?? '';
    state.selectedClubCode = '';

    renderBreedOptions();
    renderClubOptions();
    bindEvents();
    await refresh();
  }

  function renderBreedOptions() {
    const filteredBreeds = getFilteredBreeds();
    if (
      filteredBreeds.length > 0 &&
      !filteredBreeds.some((breed) => breed.id === state.selectedBreedId)
    ) {
      state.selectedBreedId = filteredBreeds[0].id;
    }

    elements.breedSelect.innerHTML =
      filteredBreeds
        .map((breed) => \`<option value="\${breed.id}">\${breed.nameEn} / \${breed.nameJa ?? '-'}</option>\`)
        .join('') || '<option value="">No matching breeds</option>';
    elements.breedSelect.value = state.selectedBreedId;
  }

  function getFilteredBreeds() {
    const query = state.breedSearch.trim().toLowerCase();

    if (!query) {
      return state.breeds;
    }

    return state.breeds.filter((breed) => {
      return [breed.nameEn, breed.nameJa, breed.groupName, breed.fciGroup]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }

  function renderClubOptions() {
    elements.clubSelect.innerHTML = [
      '<option value="">All clubs</option>',
      ...state.clubs.map(
        (club) => \`<option value="\${club.code}">\${club.code} - \${club.name}</option>\`,
      ),
    ].join('');
    elements.clubSelect.value = state.selectedClubCode;
  }

  function bindEvents() {
    elements.breedSearchInput.addEventListener('input', () => {
      state.breedSearch = elements.breedSearchInput.value;
      renderBreedOptions();
      void refresh();
    });
    elements.breedSelect.addEventListener('change', () => {
      state.selectedBreedId = elements.breedSelect.value;
      void refresh();
    });
    elements.clubSelect.addEventListener('change', () => {
      state.selectedClubCode = elements.clubSelect.value;
      void refresh();
    });
    elements.latestOnlyInput.addEventListener('change', () => {
      state.latestOnly = elements.latestOnlyInput.checked;
      void refresh();
    });
    elements.refreshButton.addEventListener('click', () => {
      void refresh();
    });
  }

  async function refresh() {
    setStatus('Refreshing', false);
    const params = new URLSearchParams();
    if (state.selectedBreedId) params.set('breedId', state.selectedBreedId);
    if (state.selectedClubCode) params.set('kennelClubCode', state.selectedClubCode);
    if (state.latestOnly) params.set('latestOnly', 'true');

    const selectedBreed = state.breeds.find((breed) => breed.id === state.selectedBreedId);
    const unresolvedParams = new URLSearchParams({ status: 'unresolved' });
    if (state.selectedClubCode) unresolvedParams.set('kennelClubCode', state.selectedClubCode);

    const popularityParams = new URLSearchParams(params);

    const [trends, rows, popularityTrends, aliases, imports, unresolved] = await Promise.all([
      fetchJson(\`\${apiBase}/registration-statistics/trends?\${params.toString()}\`),
      fetchJson(\`\${apiBase}/registration-statistics?\${params.toString()}\`),
      fetchJson(\`\${apiBase}/popularity-trends?\${popularityParams.toString()}\`),
      state.selectedBreedId
        ? fetchJson(\`\${apiBase}/breeds/\${state.selectedBreedId}/aliases\`)
        : Promise.resolve([]),
      fetchJson(
        \`\${apiBase}/import-jobs\${state.selectedClubCode ? \`?kennelClubCode=\${state.selectedClubCode}\` : ''}\`,
      ),
      fetchJson(\`\${apiBase}/unresolved-breed-aliases?\${unresolvedParams.toString()}\`),
    ]);

    renderMetrics(trends, rows, popularityTrends, unresolved);
    renderChart(trends, selectedBreed);
    renderRankingChart(popularityTrends, selectedBreed);
    renderAliases(aliases);
    renderImports(imports);
    renderRows(rows);
    renderRankingRows(popularityTrends);
    setStatus('Ready', true);
  }

  function renderMetrics(trends, rows, rankingTrends, unresolved) {
    const allPoints = trends.flatMap((trend) => trend.points);
    const latestPoint = [...allPoints].sort((a, b) => b.year - a.year)[0];
    const rankingPoints = rankingTrends.flatMap((trend) => trend.points);
    const latestRankingPoint = [...rankingPoints].sort((a, b) => b.year - a.year)[0];

    elements.latestCount.textContent = formatNumber(latestPoint?.registrationCount);
    elements.latestRank.textContent = latestRankingPoint?.rank
      ? \`#\${latestRankingPoint.rank}\`
      : latestPoint?.rank
        ? \`#\${latestPoint.rank}\`
        : '-';
    elements.pointCount.textContent = formatNumber(allPoints.length + rankingPoints.length);
    elements.unresolvedCount.textContent = formatNumber(unresolved.length);
    elements.rowCaption.textContent = \`\${rows.length} rows\`;
  }

  function renderChart(trends, selectedBreed) {
    const canvas = elements.trendCanvas;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    context.scale(ratio, ratio);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 42, right: 28, bottom: 44, left: 64 };
    const points = trends.flatMap((trend) =>
      trend.points.map((point) => ({ ...point, trend })),
    );

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    if (points.length === 0) {
      context.fillStyle = '#60707d';
      context.font = '14px sans-serif';
      context.fillText('No data', padding.left, padding.top + 20);
      elements.chartCaption.textContent = selectedBreed?.nameEn ?? '';
      return;
    }

    const years = [...new Set(points.map((point) => point.year))].sort((a, b) => a - b);
    const maxCount = Math.max(...points.map((point) => point.registrationCount), 1);
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    drawGrid(context, padding, width, height, maxCount);

    const groupedByClub = new Map();
    for (const point of points) {
      const key = point.trend.kennelClubId;
      groupedByClub.set(key, [...(groupedByClub.get(key) ?? []), point]);
    }

    const colors = ['#176b87', '#b44d3b', '#2f7d52', '#7155a3'];
    let colorIndex = 0;
    const legendItems = [];
    for (const clubPoints of groupedByClub.values()) {
      const color = colors[colorIndex % colors.length];
      colorIndex += 1;
      const sorted = clubPoints.sort((a, b) => a.year - b.year);
      legendItems.push({
        color,
        label: getClubLabel(sorted[0].trend.kennelClubId),
      });
      context.strokeStyle = color;
      context.fillStyle = color;
      context.lineWidth = 2.5;
      context.beginPath();
      sorted.forEach((point, index) => {
        const x = padding.left + getYearPosition(point.year, years, plotWidth);
        const y = padding.top + plotHeight - (point.registrationCount / maxCount) * plotHeight;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
      sorted.forEach((point) => {
        const x = padding.left + getYearPosition(point.year, years, plotWidth);
        const y = padding.top + plotHeight - (point.registrationCount / maxCount) * plotHeight;
        context.beginPath();
        context.arc(x, y, 4, 0, Math.PI * 2);
        context.fill();
      });
    }

    drawAxisLabels(context, padding, width, height, years, maxCount);
    drawLegend(context, width, padding, legendItems);
    elements.chartCaption.textContent = selectedBreed?.nameEn ?? '';
  }

  function renderRankingChart(trends, selectedBreed) {
    const canvas = elements.rankingCanvas;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    context.scale(ratio, ratio);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 42, right: 28, bottom: 44, left: 64 };
    const points = trends.flatMap((trend) =>
      trend.points.map((point) => ({ ...point, trend })),
    );

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    if (points.length === 0) {
      context.fillStyle = '#60707d';
      context.font = '14px sans-serif';
      context.fillText('No popularity rank data', padding.left, padding.top + 20);
      elements.rankingChartCaption.textContent = selectedBreed?.nameEn ?? '';
      elements.rankingRowCaption.textContent = '0 rows';
      return;
    }

    const years = [...new Set(points.map((point) => point.year))].sort((a, b) => a - b);
    const maxRank = Math.max(...points.map((point) => point.rank), 1);
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    drawRankGrid(context, padding, width, height, maxRank);

    const groupedByClub = new Map();
    for (const point of points) {
      const key = point.trend.kennelClubId;
      groupedByClub.set(key, [...(groupedByClub.get(key) ?? []), point]);
    }

    const colors = ['#7155a3', '#b44d3b', '#176b87', '#2f7d52'];
    let colorIndex = 0;
    const legendItems = [];
    for (const clubPoints of groupedByClub.values()) {
      const color = colors[colorIndex % colors.length];
      colorIndex += 1;
      const sorted = clubPoints.sort((a, b) => a.year - b.year);
      legendItems.push({
        color,
        label: sorted[0].trend.kennelClubCode,
      });
      context.strokeStyle = color;
      context.fillStyle = color;
      context.lineWidth = 2.5;
      context.beginPath();
      sorted.forEach((point, index) => {
        const x = padding.left + getYearPosition(point.year, years, plotWidth);
        const y = padding.top + ((point.rank - 1) / Math.max(maxRank - 1, 1)) * plotHeight;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
      sorted.forEach((point) => {
        const x = padding.left + getYearPosition(point.year, years, plotWidth);
        const y = padding.top + ((point.rank - 1) / Math.max(maxRank - 1, 1)) * plotHeight;
        context.beginPath();
        context.arc(x, y, 4, 0, Math.PI * 2);
        context.fill();
      });
    }

    drawRankAxisLabels(context, padding, width, height, years, maxRank);
    drawLegend(context, width, padding, legendItems);
    elements.rankingChartCaption.textContent = selectedBreed?.nameEn ?? '';
  }

  function getClubLabel(kennelClubId) {
    const club = state.clubs.find((candidate) => candidate.id === kennelClubId);
    return club?.code ?? kennelClubId.slice(0, 6);
  }

  function drawLegend(context, width, padding, items) {
    if (items.length === 0) return;

    const uniqueItems = [];
    for (const item of items) {
      if (!uniqueItems.some((candidate) => candidate.label === item.label)) {
        uniqueItems.push(item);
      }
    }

    context.save();
    context.font = '12px sans-serif';
    context.textBaseline = 'middle';
    let x = width - padding.right;
    const y = padding.top - 12;

    for (const item of [...uniqueItems].reverse()) {
      const textWidth = context.measureText(item.label).width;
      const itemWidth = textWidth + 28;
      x -= itemWidth;
      context.strokeStyle = item.color;
      context.fillStyle = item.color;
      context.lineWidth = 2.5;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 16, y);
      context.stroke();
      context.beginPath();
      context.arc(x + 8, y, 3, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#1d252c';
      context.fillText(item.label, x + 22, y);
      x -= 10;
    }

    context.restore();
  }

  function drawGrid(context, padding, width, height, maxCount) {
    const plotHeight = height - padding.top - padding.bottom;
    context.strokeStyle = '#d9e0e5';
    context.lineWidth = 1;
    context.font = '12px sans-serif';
    context.fillStyle = '#60707d';
    for (let index = 0; index <= 4; index += 1) {
      const y = padding.top + (plotHeight / 4) * index;
      context.beginPath();
      context.moveTo(padding.left, y);
      context.lineTo(width - padding.right, y);
      context.stroke();
      const label = Math.round(maxCount - (maxCount / 4) * index);
      context.fillText(formatNumber(label), 10, y + 4);
    }
  }

  function drawAxisLabels(context, padding, width, height, years, maxCount) {
    const plotWidth = width - padding.left - padding.right;
    context.fillStyle = '#60707d';
    context.font = '12px sans-serif';
    for (const year of years) {
      const x = padding.left + getYearPosition(year, years, plotWidth);
      context.fillText(String(year), x - 12, height - 18);
    }
    context.fillText('0', 10, height - padding.bottom + 4);
    context.fillText(formatNumber(maxCount), 10, padding.top + 4);
  }

  function drawRankGrid(context, padding, width, height, maxRank) {
    const plotHeight = height - padding.top - padding.bottom;
    context.strokeStyle = '#d9e0e5';
    context.lineWidth = 1;
    context.font = '12px sans-serif';
    context.fillStyle = '#60707d';
    for (let index = 0; index <= 4; index += 1) {
      const y = padding.top + (plotHeight / 4) * index;
      context.beginPath();
      context.moveTo(padding.left, y);
      context.lineTo(width - padding.right, y);
      context.stroke();
      const label = Math.max(1, Math.round(1 + ((maxRank - 1) / 4) * index));
      context.fillText(\`#\${label}\`, 10, y + 4);
    }
  }

  function drawRankAxisLabels(context, padding, width, height, years, maxRank) {
    const plotWidth = width - padding.left - padding.right;
    context.fillStyle = '#60707d';
    context.font = '12px sans-serif';
    for (const year of years) {
      const x = padding.left + getYearPosition(year, years, plotWidth);
      context.fillText(String(year), x - 12, height - 18);
    }
    context.fillText('#1', 10, padding.top + 4);
    context.fillText(\`#\${maxRank}\`, 10, height - padding.bottom + 4);
  }

  function getYearPosition(year, years, plotWidth) {
    if (years.length === 1) return plotWidth / 2;
    const minYear = years[0];
    const maxYear = years[years.length - 1];
    return ((year - minYear) / (maxYear - minYear)) * plotWidth;
  }

  function renderSourceLink(row) {
    if (row.sourceUrl) {
      const label = row.sourceTitle || row.sourceDocumentId || 'Source';
      return \`<a class="source-link" href="\${row.sourceUrl}" target="_blank" rel="noopener noreferrer">\${label}</a>\`;
    }

    return row.sourceDocumentId ?? '-';
  }

  function renderAliases(aliases) {
    elements.aliasList.innerHTML =
      aliases
        .map(
          (alias) => \`<li><span class="item-title">\${alias.aliasName}</span><span class="item-meta">\${alias.languageCode ?? '-'} · \${alias.sourceType ?? '-'}</span></li>\`,
        )
        .join('') || '<li><span class="item-title">No aliases</span></li>';
  }

  function renderImports(imports) {
    elements.importList.innerHTML =
      imports
        .slice(0, 6)
        .map(
          (job) => \`<li><span class="item-title">\${job.kennelClubCode} \${job.targetYear ?? '-'}</span><span class="item-meta">\${job.status} · parsed \${job.rowsParsed} · imported \${job.rowsImported}</span></li>\`,
        )
        .join('') || '<li><span class="item-title">No imports</span></li>';
  }

  function renderRows(rows) {
    elements.statisticsTableBody.innerHTML =
      rows
        .map(
          (row) => \`<tr><td>\${row.year}</td><td>\${row.countryCode}</td><td>\${formatNumber(row.registrationCount)}</td><td>\${row.rank ? \`#\${row.rank}\` : '-'}</td><td>\${row.rawBreedName ?? '-'}</td><td>\${renderSourceLink(row)}</td></tr>\`,
        )
        .join('') || '<tr><td colspan="6">No rows</td></tr>';
  }

  function renderRankingRows(trends) {
    const rows = trends.flatMap((trend) =>
      trend.points.map((point) => ({ ...point, trend })),
    );
    elements.rankingRowCaption.textContent = \`\${rows.length} rows\`;
    elements.rankingsTableBody.innerHTML =
      rows
        .sort((a, b) => a.year - b.year || a.rank - b.rank)
        .map(
          (row) => \`<tr><td>\${row.year}</td><td>\${row.trend.kennelClubCode}</td><td>\${row.trend.countryCode}</td><td>#\${row.rank}</td><td>\${row.sourceType}</td><td>\${renderSourceLink(row)}</td></tr>\`,
        )
        .join('') || '<tr><td colspan="6">No popularity rank rows</td></tr>';
  }

  initialize().catch((error) => {
    setStatus(error.message, false);
  });
})();`;
