export const dashboardStyles = `:root {
  color-scheme: light;
  --background: #f7f8fa;
  --surface: #ffffff;
  --surface-muted: #f1f5f7;
  --ink: #1d252c;
  --muted: #60707d;
  --line: #d9e0e5;
  --accent: #176b87;
  --accent-2: #b44d3b;
  --ok: #2f7d52;
  --shadow: 0 12px 30px rgba(29, 37, 44, 0.08);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--background);
  color: var(--ink);
}

button,
select,
input {
  font: inherit;
}

.app-shell {
  width: min(1320px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 40px;
}

.topbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 4px;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  letter-spacing: 0;
}

h1 {
  font-size: clamp(1.8rem, 2.6vw, 2.6rem);
  line-height: 1.05;
}

h2 {
  font-size: 1rem;
}

.status-strip {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--muted);
  white-space: nowrap;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent-2);
}

.status-dot.ready {
  background: var(--ok);
}

.control-panel,
.metrics-grid,
.workspace,
.table-panel {
  margin-top: 16px;
}

.control-panel {
  display: grid;
  grid-template-columns: minmax(180px, 260px) minmax(220px, 1fr) minmax(180px, 260px) auto auto;
  align-items: end;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
}

select {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface-muted);
  color: var(--ink);
  padding: 0 10px;
}

input[type='search'] {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface-muted);
  color: var(--ink);
  padding: 0 10px;
}

.toggle {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface-muted);
}

.toggle input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--accent);
}

button {
  min-height: 40px;
  border: 0;
  border-radius: 6px;
  padding: 0 16px;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric,
.chart-panel,
.side-panel,
.table-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.metric {
  padding: 16px;
}

.metric span {
  display: block;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.metric strong {
  display: block;
  margin-top: 8px;
  font-size: 1.7rem;
  line-height: 1;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
}

.chart-stack {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.chart-panel {
  min-width: 0;
  padding: 16px;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-heading span {
  color: var(--muted);
  font-size: 0.84rem;
}

.panel-heading.compact {
  margin: 0 0 10px;
}

canvas {
  display: block;
  width: 100%;
  height: 360px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: linear-gradient(#ffffff, #f8fafb);
}

.side-panel {
  display: grid;
  align-content: start;
  gap: 18px;
  padding: 16px;
}

.data-list {
  display: grid;
  gap: 8px;
  max-height: 280px;
  overflow: auto;
  margin: 0;
  padding: 0;
  list-style: none;
}

.data-list li {
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface-muted);
}

.item-title {
  display: block;
  font-weight: 700;
}

.item-meta {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.82rem;
}

.table-panel {
  padding: 16px;
}

.table-wrap {
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 6px;
}

table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  font-size: 0.9rem;
  vertical-align: top;
}

th {
  background: var(--surface-muted);
  color: var(--muted);
  font-size: 0.74rem;
  text-transform: uppercase;
}

tbody tr:last-child td {
  border-bottom: 0;
}

.source-link {
  color: var(--accent);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (max-width: 920px) {
  .topbar,
  .workspace {
    display: grid;
  }

  .control-panel {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .app-shell {
    width: min(100% - 20px, 1320px);
    padding-top: 14px;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  canvas {
    height: 300px;
  }
}`;
