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

  const akcEstimatedRegistrationCounts = {
    'seed-flat-coated-retriever': {
      label: 'AKC estimated count',
      points: [
        { year: 2020, registrationCount: 3000 },
        { year: 2021, registrationCount: 3450 },
        { year: 2022, registrationCount: 3000 },
        { year: 2023, registrationCount: 3800 },
        { year: 2024, registrationCount: 2600 },
        { year: 2025, registrationCount: 1950 },
      ],
      noteJa:
        '※ AKCの登録頭数は公式ランキングページでは公開されていないため、この線は公開順位と一部報道値をアンカーにした中間推計です。公式登録頭数ではありません。',
      noteEn:
        'Estimated AKC counts are midpoint estimates derived from public ranking positions and limited published anchor counts. They are not official AKC registration counts.',
    },
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
    positioningChartCaption: document.getElementById('positioningChartCaption'),
    trendCanvas: document.getElementById('trendCanvas'),
    rankingCanvas: document.getElementById('rankingCanvas'),
    positioningCanvas: document.getElementById('positioningCanvas'),
    estimatedCountNote: document.getElementById('estimatedCountNote'),
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

  async function fetchOptionalJson(path, fallback) {
    const response = await fetch(path);
    if (response.status === 401 || response.status === 403) {
      return fallback;
    }
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
    state.selectedBreedId = getDefaultBreedId(breeds);
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

  function getDefaultBreedId(breeds) {
    const flatCoatedRetriever = breeds.find(
      (breed) => breed.nameEn === 'Flat-Coated Retriever',
    );

    return flatCoatedRetriever?.id ?? breeds[0]?.id ?? '';
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

    const positioningParams = new URLSearchParams({
      year: '2025',
      latestOnly: 'true',
    });
    if (state.selectedClubCode) positioningParams.set('kennelClubCode', state.selectedClubCode);

    const [
      trends,
      rows,
      popularityTrends,
      positioningRows,
      aliases,
      imports,
      unresolved,
    ] = await Promise.all([
      fetchJson(\`\${apiBase}/registration-statistics/trends?\${params.toString()}\`),
      fetchJson(\`\${apiBase}/registration-statistics?\${params.toString()}\`),
      fetchJson(\`\${apiBase}/popularity-trends?\${popularityParams.toString()}\`),
      fetchJson(\`\${apiBase}/registration-statistics?\${positioningParams.toString()}\`),
      state.selectedBreedId
        ? fetchJson(\`\${apiBase}/breeds/\${state.selectedBreedId}/aliases\`)
        : Promise.resolve([]),
      fetchOptionalJson(
        \`\${apiBase}/import-jobs\${state.selectedClubCode ? \`?kennelClubCode=\${state.selectedClubCode}\` : ''}\`,
        [],
      ),
      fetchOptionalJson(
        \`\${apiBase}/unresolved-breed-aliases?\${unresolvedParams.toString()}\`,
        [],
      ),
    ]);

    renderMetrics(trends, rows, popularityTrends, unresolved);
    renderChart(trends, popularityTrends, selectedBreed);
    renderRankingChart(popularityTrends, selectedBreed);
    renderPositioningChart(positioningRows, selectedBreed);
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

  function renderChart(trends, rankingTrends, selectedBreed) {
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
    const estimatedPoints = getAkcEstimatedRegistrationPoints(
      selectedBreed,
      rankingTrends,
    );
    const allChartPoints = [...points, ...estimatedPoints];

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#141c25';
    context.fillRect(0, 0, width, height);

    renderEstimatedCountNote(selectedBreed, estimatedPoints);

    if (allChartPoints.length === 0) {
      context.fillStyle = '#9aaab6';
      context.font = '14px sans-serif';
      context.fillText('No data', padding.left, padding.top + 20);
      elements.chartCaption.textContent = selectedBreed?.nameEn ?? '';
      return;
    }

    const years = [...new Set(allChartPoints.map((point) => point.year))].sort((a, b) => a - b);
    const maxCount = Math.max(...allChartPoints.map((point) => point.registrationCount), 1);
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    drawGrid(context, padding, width, height, maxCount);

    const groupedByClub = new Map();
    for (const point of points) {
      const key = point.trend.kennelClubId;
      groupedByClub.set(key, [...(groupedByClub.get(key) ?? []), point]);
    }

    const colors = ['#4fb7c5', '#e07861', '#62c587', '#caa6ff'];
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

    if (estimatedPoints.length > 0) {
      drawEstimatedRegistrationSeries(
        context,
        estimatedPoints,
        years,
        padding,
        plotWidth,
        plotHeight,
        maxCount,
      );
      legendItems.push({
        color: '#f0cf65',
        label: 'AKC est.',
      });
    }

    drawAxisLabels(context, padding, width, height, years, maxCount);
    drawLegend(context, width, padding, legendItems);
    elements.chartCaption.textContent = selectedBreed?.nameEn ?? '';
  }

  function getAkcEstimatedRegistrationPoints(selectedBreed, rankingTrends) {
    if (!selectedBreed || state.selectedClubCode && state.selectedClubCode !== 'AKC') {
      return [];
    }

    const estimate = akcEstimatedRegistrationCounts[selectedBreed.id];
    if (!estimate) {
      return [];
    }

    const hasAkcRanking = rankingTrends.some((trend) => {
      return trend.breedId === selectedBreed.id && trend.kennelClubCode === 'AKC';
    });

    if (!hasAkcRanking) {
      return [];
    }

    return estimate.points.map((point) => ({
      ...point,
      sourceType: 'estimated_registration_count',
    }));
  }

  function renderEstimatedCountNote(selectedBreed, estimatedPoints) {
    const estimate = selectedBreed
      ? akcEstimatedRegistrationCounts[selectedBreed.id]
      : null;

    if (!estimate || estimatedPoints.length === 0) {
      elements.estimatedCountNote.hidden = true;
      elements.estimatedCountNote.innerHTML = '';
      return;
    }

    const values = estimatedPoints
      .map((point) => \`\${point.year}: \${formatNumber(point.registrationCount)}\`)
      .join(' / ');

    elements.estimatedCountNote.hidden = false;
    elements.estimatedCountNote.innerHTML = \`
      <p>\${estimate.noteJa}</p>
      <p>\${estimate.noteEn}</p>
      <p>AKC estimate midpoint values: \${values}</p>
    \`;
  }

  function drawEstimatedRegistrationSeries(
    context,
    estimatedPoints,
    years,
    padding,
    plotWidth,
    plotHeight,
    maxCount,
  ) {
    const sorted = [...estimatedPoints].sort((a, b) => a.year - b.year);

    context.save();
    context.strokeStyle = '#f0cf65';
    context.fillStyle = '#f0cf65';
    context.lineWidth = 2.5;
    context.setLineDash([7, 5]);
    context.beginPath();
    sorted.forEach((point, index) => {
      const x = padding.left + getYearPosition(point.year, years, plotWidth);
      const y = padding.top + plotHeight - (point.registrationCount / maxCount) * plotHeight;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
    context.setLineDash([]);
    sorted.forEach((point) => {
      const x = padding.left + getYearPosition(point.year, years, plotWidth);
      const y = padding.top + plotHeight - (point.registrationCount / maxCount) * plotHeight;
      context.beginPath();
      context.rect(x - 4, y - 4, 8, 8);
      context.fill();
    });
    context.restore();
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
    context.fillStyle = '#141c25';
    context.fillRect(0, 0, width, height);

    if (points.length === 0) {
      context.fillStyle = '#9aaab6';
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

    const colors = ['#caa6ff', '#e07861', '#4fb7c5', '#62c587'];
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

  function getBreedLabel(breedId, fallback) {
    const breed = state.breeds.find((candidate) => candidate.id === breedId);
    return breed?.nameEn ?? fallback ?? breedId.slice(0, 8);
  }

  function isComparisonBreedRow(row) {
    const breed = state.breeds.find((candidate) => candidate.id === row.breedId);
    const values = [
      breed?.nameEn,
      breed?.nameJa,
      breed?.groupName,
      breed?.fciGroup,
      row.rawBreedName,
    ].filter(Boolean);

    return values.some((value) =>
      /retriever|レトリーバー|siberian husky|samoyed|シベリアン[・･\s]?ハスキー|サモエド/i.test(
        value,
      ),
    );
  }

  function renderPositioningChart(rows, selectedBreed) {
    const canvas = elements.positioningCanvas;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    context.scale(ratio, ratio);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 34, right: 36, bottom: 48, left: 72 };
    const aggregatedRows = aggregatePositioningRows(rows);
    const sortedRows = aggregatedRows
      .filter((row) => row.registrationCount > 0)
      .sort((left, right) => right.registrationCount - left.registrationCount);

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#141c25';
    context.fillRect(0, 0, width, height);

    if (sortedRows.length === 0) {
      context.fillStyle = '#9aaab6';
      context.font = '14px sans-serif';
      context.fillText('No 2025 registration positioning data', padding.left, padding.top + 20);
      elements.positioningChartCaption.textContent = '2025';
      return;
    }

    const maxCount = Math.max(...sortedRows.map((row) => row.registrationCount), 1);
    const minCount = Math.max(Math.min(...sortedRows.map((row) => row.registrationCount)), 1);
    const logMin = Math.log10(minCount);
    const logMax = Math.log10(maxCount);
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const highlightedRows = sortedRows.filter(
      (row) => isComparisonBreedRow(row) || row.breedId === selectedBreed?.id,
    );

    drawPositioningGrid(context, padding, width, height, minCount, maxCount);

    sortedRows.forEach((row, index) => {
      const x = padding.left + getPositionX(index, sortedRows.length, plotWidth);
      const y =
        padding.top +
        plotHeight -
        getLogRatio(row.registrationCount, logMin, logMax) * plotHeight;
      const highlighted = highlightedRows.includes(row);
      const selected = row.breedId === selectedBreed?.id;

      context.fillStyle = selected ? '#e07861' : highlighted ? '#4fb7c5' : '#465667';
      context.beginPath();
      context.arc(x, y, selected ? 5 : highlighted ? 4 : 3, 0, Math.PI * 2);
      context.fill();
    });

    drawPositioningLabels(
      context,
      padding,
      plotWidth,
      plotHeight,
      sortedRows,
      highlightedRows,
      logMin,
      logMax,
      selectedBreed,
    );
    drawPositioningAxisLabels(context, padding, width, height, sortedRows, maxCount);

    const clubLabel = state.selectedClubCode || 'All clubs';
    elements.positioningChartCaption.textContent = \`2025 · \${clubLabel} · \${sortedRows.length} breeds\`;
  }

  function aggregatePositioningRows(rows) {
    const rowsByBreedId = new Map();

    for (const row of rows) {
      const existing = rowsByBreedId.get(row.breedId);
      if (!existing) {
        rowsByBreedId.set(row.breedId, {
          ...row,
          registrationCount: row.registrationCount,
          sourceClubLabels: [getClubLabel(row.kennelClubId)],
        });
        continue;
      }

      existing.registrationCount += row.registrationCount;
      const clubLabel = getClubLabel(row.kennelClubId);
      if (!existing.sourceClubLabels.includes(clubLabel)) {
        existing.sourceClubLabels.push(clubLabel);
      }
      if (!existing.rawBreedName && row.rawBreedName) {
        existing.rawBreedName = row.rawBreedName;
      }
    }

    return [...rowsByBreedId.values()];
  }

  function getPositionX(index, rowCount, plotWidth) {
    if (rowCount <= 1) return plotWidth / 2;
    return (index / (rowCount - 1)) * plotWidth;
  }

  function getLogRatio(value, logMin, logMax) {
    if (logMax === logMin) return 0.5;
    return (Math.log10(Math.max(value, 1)) - logMin) / (logMax - logMin);
  }

  function drawPositioningGrid(context, padding, width, height, minCount, maxCount) {
    const plotHeight = height - padding.top - padding.bottom;
    const logMin = Math.log10(Math.max(minCount, 1));
    const logMax = Math.log10(Math.max(maxCount, 1));
    const tickValues = buildLogTicks(minCount, maxCount);

    context.strokeStyle = '#344250';
    context.lineWidth = 1;
    context.font = '12px sans-serif';
    context.fillStyle = '#9aaab6';

    for (const tick of tickValues) {
      const y =
        padding.top +
        plotHeight -
        getLogRatio(tick, logMin, logMax) * plotHeight;
      context.beginPath();
      context.moveTo(padding.left, y);
      context.lineTo(width - padding.right, y);
      context.stroke();
      context.fillText(formatNumber(tick), 10, y + 4);
    }
  }

  function buildLogTicks(minCount, maxCount) {
    const ticks = [];
    const minPower = Math.floor(Math.log10(Math.max(minCount, 1)));
    const maxPower = Math.ceil(Math.log10(Math.max(maxCount, 1)));

    for (let power = minPower; power <= maxPower; power += 1) {
      const value = 10 ** power;
      if (value >= minCount && value <= maxCount) {
        ticks.push(value);
      }
    }

    if (!ticks.includes(maxCount)) ticks.push(maxCount);
    if (!ticks.includes(minCount)) ticks.unshift(minCount);

    return [...new Set(ticks)].sort((left, right) => left - right);
  }

  function drawPositioningLabels(
    context,
    padding,
    plotWidth,
    plotHeight,
    sortedRows,
    highlightedRows,
    logMin,
    logMax,
    selectedBreed,
  ) {
    context.font = '11px sans-serif';
    context.textBaseline = 'middle';

    highlightedRows.forEach((row) => {
      const index = sortedRows.indexOf(row);
      const x = padding.left + getPositionX(index, sortedRows.length, plotWidth);
      const y =
        padding.top +
        plotHeight -
        getLogRatio(row.registrationCount, logMin, logMax) * plotHeight;
      const label = getBreedLabel(row.breedId, row.rawBreedName)
        .replace(' Retriever', '')
        .replace('Nova Scotia Duck Tolling', 'Toller');
      const selected = row.breedId === selectedBreed?.id;

      context.fillStyle = selected ? '#e07861' : '#4fb7c5';
      context.fillText(label, Math.min(x + 8, padding.left + plotWidth - 88), y - 8);
    });
  }

  function drawPositioningAxisLabels(context, padding, width, height, sortedRows, maxCount) {
    const plotWidth = width - padding.left - padding.right;
    context.fillStyle = '#9aaab6';
    context.font = '12px sans-serif';
    context.fillText('registration count (log scale)', padding.left, 18);
    context.fillText('higher registration count', padding.left, height - 18);
    context.fillText('lower registration count', width - padding.right - 138, height - 18);
    context.fillText('1', padding.left - 4, height - padding.bottom + 20);
    context.fillText(String(sortedRows.length), padding.left + plotWidth - 8, height - padding.bottom + 20);
    context.fillText(formatNumber(maxCount), 10, padding.top + 4);
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
      context.fillStyle = '#eef4f8';
      context.fillText(item.label, x + 22, y);
      x -= 10;
    }

    context.restore();
  }

  function drawGrid(context, padding, width, height, maxCount) {
    const plotHeight = height - padding.top - padding.bottom;
    context.strokeStyle = '#344250';
    context.lineWidth = 1;
    context.font = '12px sans-serif';
    context.fillStyle = '#9aaab6';
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
    context.fillStyle = '#9aaab6';
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
    context.strokeStyle = '#344250';
    context.lineWidth = 1;
    context.font = '12px sans-serif';
    context.fillStyle = '#9aaab6';
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
    context.fillStyle = '#9aaab6';
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
