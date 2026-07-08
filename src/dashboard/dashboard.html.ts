export const dashboardHtml = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>World Dog Statistics</title>
    <link rel="stylesheet" href="/api/v1/dashboard/styles.css" />
  </head>
  <body>
    <main class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">World Dog Statistics</p>
          <h1>Registration Trends</h1>
        </div>
        <div class="status-strip" aria-live="polite">
          <span id="apiStatus" class="status-dot"></span>
          <span id="statusText">Loading</span>
        </div>
      </header>

      <section class="control-panel" aria-label="Filters">
        <label>
          <span>Breed search</span>
          <input id="breedSearchInput" type="search" placeholder="Retriever, ラブラドール..." />
        </label>
        <label>
          <span>Breed</span>
          <select id="breedSelect"></select>
        </label>
        <label>
          <span>Kennel club</span>
          <select id="clubSelect"></select>
        </label>
        <label class="toggle">
          <input id="latestOnlyInput" type="checkbox" checked />
          <span>Latest source only</span>
        </label>
        <button id="refreshButton" type="button">Refresh</button>
      </section>

      <section class="metrics-grid" aria-label="Summary">
        <div class="metric">
          <span>Latest count</span>
          <strong id="latestCount">-</strong>
        </div>
        <div class="metric">
          <span>Latest rank</span>
          <strong id="latestRank">-</strong>
        </div>
        <div class="metric">
          <span>Trend points</span>
          <strong id="pointCount">-</strong>
        </div>
        <div class="metric">
          <span>Unresolved aliases</span>
          <strong id="unresolvedCount">-</strong>
        </div>
      </section>

      <section class="workspace">
        <div class="chart-stack">
          <div class="chart-panel">
            <div class="panel-heading">
              <h2>Registrations</h2>
              <span id="chartCaption"></span>
            </div>
            <canvas id="trendCanvas" width="960" height="420"></canvas>
          </div>
          <div class="chart-panel">
            <div class="panel-heading">
              <h2>Popularity Rank Comparison</h2>
              <span id="rankingChartCaption"></span>
            </div>
            <canvas id="rankingCanvas" width="960" height="300"></canvas>
          </div>
        </div>

        <aside class="side-panel">
          <section>
            <div class="panel-heading compact">
              <h2>Aliases</h2>
            </div>
            <ul id="aliasList" class="data-list"></ul>
          </section>
          <section>
            <div class="panel-heading compact">
              <h2>Recent Imports</h2>
            </div>
            <ul id="importList" class="data-list"></ul>
          </section>
        </aside>
      </section>

      <section class="table-panel">
        <div class="panel-heading">
          <h2>Popularity Rank Rows</h2>
          <span id="rankingRowCaption"></span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Club</th>
                <th>Country</th>
                <th>Rank</th>
                <th>Source type</th>
                <th>Source document</th>
              </tr>
            </thead>
            <tbody id="rankingsTableBody"></tbody>
          </table>
        </div>
      </section>

      <section class="table-panel">
        <div class="panel-heading">
          <h2>Latest Rows</h2>
          <span id="rowCaption"></span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Country</th>
                <th>Count</th>
                <th>Rank</th>
                <th>Raw breed name</th>
                <th>Source document</th>
              </tr>
            </thead>
            <tbody id="statisticsTableBody"></tbody>
          </table>
        </div>
      </section>
    </main>
    <script src="/api/v1/dashboard/app.js"></script>
  </body>
</html>`;
