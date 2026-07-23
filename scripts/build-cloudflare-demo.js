const fs = require("fs");
const path = require("path");

const API_BASE = "http://localhost:3000/api/v1";
const OUTPUT_DIR = path.join(process.cwd(), "cloudflare-demo");

async function fetchJson(route) {
  const response = await fetch(`${API_BASE}${route}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${route}: ${response.status}`);
  }
  return response.json();
}

async function fetchText(route) {
  const response = await fetch(`${API_BASE}${route}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${route}: ${response.status}`);
  }
  return response.text();
}

function toLiteral(value) {
  return JSON.stringify(value);
}

async function main() {
  const breeds = await fetchJson("/breeds");
  const [
    root,
    clubs,
    registrationRows,
    registrationTrends,
    rankingRows,
    rankingTrends,
    popularityTrends,
  ] = await Promise.all([
    fetchJson(""),
    fetchJson("/kennel-clubs"),
    fetchJson("/registration-statistics"),
    fetchJson("/registration-statistics/trends"),
    fetchJson("/rankings?latestOnly=true"),
    fetchJson("/rankings/trends?latestOnly=true"),
    fetchJson("/popularity-trends?latestOnly=true"),
  ]);

  const aliasesByBreedId = {};
  for (const breed of breeds) {
    aliasesByBreedId[breed.id] = await fetchJson(`/breeds/${breed.id}/aliases`);
  }

  const [dashboardHtml, dashboardStyles, dashboardScript] = await Promise.all([
    fetchText("/dashboard"),
    fetchText("/dashboard/styles.css"),
    fetchText("/dashboard/app.js"),
  ]);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "worker.js"),
    buildWorker({
      root,
      breeds,
      clubs,
      registrationRows,
      registrationTrends,
      rankingRows,
      rankingTrends,
      popularityTrends,
      aliasesByBreedId,
      dashboardHtml,
      dashboardStyles,
      dashboardScript,
      generatedAt: new Date().toISOString(),
    }),
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "wrangler.jsonc"),
    `{
  "$schema": "../node_modules/wrangler/config-schema.json",
  "name": "world-dog-registry",
  "main": "worker.js",
  "compatibility_date": "2026-07-08"
}
`,
  );
}

function buildWorker(data) {
  return `const SNAPSHOT = ${toLiteral(data)};

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=300",
};

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "public, max-age=300",
};

const JS_HEADERS = {
  "content-type": "application/javascript; charset=utf-8",
  "cache-control": "public, max-age=300",
};

const CSS_HEADERS = {
  "content-type": "text/css; charset=utf-8",
  "cache-control": "public, max-age=300",
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\\/$/, "") || "/";

    if (path === "/" || path === "/api/v1") {
      return json(SNAPSHOT.root);
    }

    if (path === "/api/v1/dashboard") {
      return new Response(SNAPSHOT.dashboardHtml, { headers: HTML_HEADERS });
    }

    if (path === "/api/v1/dashboard/styles.css") {
      return new Response(SNAPSHOT.dashboardStyles, { headers: CSS_HEADERS });
    }

    if (path === "/api/v1/dashboard/app.js") {
      return new Response(SNAPSHOT.dashboardScript, { headers: JS_HEADERS });
    }

    if (path === "/api/v1/breeds") {
      return json(SNAPSHOT.breeds);
    }

    const breedAliasMatch = path.match(/^\\/api\\/v1\\/breeds\\/([^/]+)\\/aliases$/);
    if (breedAliasMatch) {
      return json(SNAPSHOT.aliasesByBreedId[decodeURIComponent(breedAliasMatch[1])] ?? []);
    }

    const breedMatch = path.match(/^\\/api\\/v1\\/breeds\\/([^/]+)$/);
    if (breedMatch) {
      const breed = SNAPSHOT.breeds.find((item) => item.id === decodeURIComponent(breedMatch[1]));
      return breed ? json(breed) : json({ message: "Not found" }, 404);
    }

    if (path === "/api/v1/kennel-clubs") {
      return json(SNAPSHOT.clubs);
    }

    if (path === "/api/v1/registration-statistics") {
      return json(filterRows(SNAPSHOT.registrationRows, url.searchParams));
    }

    if (path === "/api/v1/registration-statistics/trends") {
      return json(filterTrends(SNAPSHOT.registrationTrends, url.searchParams, "registrationCount"));
    }

    if (path === "/api/v1/rankings") {
      return json(filterRows(SNAPSHOT.rankingRows, url.searchParams));
    }

    if (path === "/api/v1/rankings/trends") {
      return json(filterTrends(SNAPSHOT.rankingTrends, url.searchParams, "rank"));
    }

    if (path === "/api/v1/popularity-trends") {
      return json(filterTrends(SNAPSHOT.popularityTrends, url.searchParams, "rank"));
    }

    if (path === "/api/v1/import-jobs" || path === "/api/v1/unresolved-breed-aliases") {
      return json([]);
    }

    return json({ message: "Not found" }, 404);
  },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function filterRows(rows, params) {
  const breedId = params.get("breedId");
  const kennelClubCode = params.get("kennelClubCode");
  const year = params.get("year");
  const latestOnly = params.get("latestOnly") === "true";
  const filteredRows = rows.filter((row) => {
    return (!breedId || row.breedId === breedId)
      && (!kennelClubCode || getKennelClubCode(row.kennelClubId) === kennelClubCode)
      && (!year || String(row.year) === year);
  });

  return latestOnly ? latestRowsByBreedClubYear(filteredRows) : filteredRows;
}

function getKennelClubCode(kennelClubId) {
  return SNAPSHOT.clubs.find((club) => club.id === kennelClubId)?.code ?? kennelClubId;
}

function latestRowsByBreedClubYear(rows) {
  const latestRows = new Map();

  for (const row of rows) {
    const key = [row.breedId, row.kennelClubId, row.year].join("|");
    const existing = latestRows.get(key);
    if (!existing || String(row.id) > String(existing.id)) {
      latestRows.set(key, row);
    }
  }

  return [...latestRows.values()].sort((left, right) => {
    return left.year - right.year
      || getKennelClubCode(left.kennelClubId).localeCompare(getKennelClubCode(right.kennelClubId))
      || left.breedId.localeCompare(right.breedId);
  });
}

function filterTrends(trends, params, pointField) {
  const breedId = params.get("breedId");
  const kennelClubCode = params.get("kennelClubCode");
  const latestOnly = params.get("latestOnly") === "true";
  return trends
    .filter((trend) => {
      return (!breedId || trend.breedId === breedId)
        && (!kennelClubCode || getTrendKennelClubCode(trend) === kennelClubCode);
    })
    .map((trend) => ({
      ...trend,
      points: filterTrendPoints(trend.points, pointField, latestOnly),
    }))
    .filter((trend) => trend.points.length > 0);
}

function getTrendKennelClubCode(trend) {
  return trend.kennelClubCode ?? getKennelClubCode(trend.kennelClubId);
}

function filterTrendPoints(points, pointField, latestOnly) {
  const filteredPoints = points.filter((point) => point[pointField] !== null && point[pointField] !== undefined);

  if (!latestOnly) {
    return filteredPoints;
  }

  const latestPoints = new Map();
  for (const point of filteredPoints) {
    const existing = latestPoints.get(point.year);
    const sourceKey = point.sourceDocumentId ?? point.id ?? "";
    const existingSourceKey = existing?.sourceDocumentId ?? existing?.id ?? "";
    if (!existing || String(sourceKey) > String(existingSourceKey)) {
      latestPoints.set(point.year, point);
    }
  }

  return [...latestPoints.values()].sort((left, right) => left.year - right.year);
}
`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
