/* Bounded MapLibre terrain renderer for the US + Region atlas scopes.
   Loaded on demand by app.js; Local deliberately remains a separate game-space view. */
(() => {
  "use strict";

  const SCOPE = {
    us: {
      container: "map-terrain-us",
      panel: "map-panel-us",
      fallback: "map-svg",
      bounds: [[-125, 24], [-66, 50]],
      maxBounds: [[-132, 19], [-59, 55]],
      minZoom: 2,
      maxZoom: 10,
      tileMaxZoom: 5,
      tileRoot: "media/map-terrain/us/",
      label: "Interactive terrain map of the continental United States",
    },
    region: {
      container: "map-terrain-region",
      panel: "map-panel-region",
      fallback: "map-region-svg",
      bounds: [[-114.18, 40.58], [-113.72, 40.86]],
      tileBounds: [[-114.9, 39.4], [-112.4, 41.6]],
      maxBounds: [[-115.4, 39.0], [-111.9, 42.0]],
      minZoom: 6,
      maxZoom: 9,
      tileRoot: "media/map-terrain/region/",
      label: "Interactive terrain map of the Wendover region",
    },
  };
  const REGION_IDS = new Set([
    "misfits_wendover_town",
    "misfits_great_salt_flats",
    "misfits_toana_range_overlook",
    "misfits_vault_facility",
  ]);

  let options = null;
  let dataPromise = null;
  let firstMount = true;
  const scopes = new Map();

  function assetUrl(path) {
    return new URL(path, document.baseURI).href;
  }

  async function loadJson(path) {
    const response = await fetch(assetUrl(path), { cache: "force-cache" });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function loadData() {
    if (!dataPromise) {
      dataPromise = Promise.all([
        loadJson("data/world.json?v=1"),
        loadJson("data/atlas-migration.json?v=1"),
      ]).then(([world, migration]) => ({ world, migration }));
    }
    return dataPromise;
  }

  function terrainStyle(config) {
    const tileBase = assetUrl(config.tileRoot);
    return {
      version: 8,
      sources: {
        land: {
          type: "geojson",
          data: assetUrl("data/geography/natural-earth-110m-land.geojson?v=9e0729ee"),
        },
        lakes: {
          type: "geojson",
          data: assetUrl("data/geography/natural-earth-110m-lakes.geojson?v=eb02ecc8"),
        },
        rivers: {
          type: "geojson",
          data: assetUrl("data/geography/natural-earth-110m-rivers.geojson?v=55aa4497"),
        },
        terrain: {
          type: "raster",
          tiles: [`${tileBase}{z}/{x}/{y}.webp?v=2`],
          bounds: (config.tileBounds || config.bounds).flat(),
          minzoom: config.minZoom,
          maxzoom: config.tileMaxZoom || config.maxZoom,
          tileSize: 256,
          attribution: "USGS National Map 3DEP (public domain)",
        },
      },
      layers: [
        {
          id: "water",
          type: "background",
          paint: { "background-color": "#11171a" },
        },
        {
          id: "land",
          type: "fill",
          source: "land",
          paint: { "fill-color": "#675f4d", "fill-opacity": 1 },
        },
        {
          id: "terrain",
          type: "raster",
          source: "terrain",
          paint: {
            "raster-opacity": 0.84,
            "raster-contrast": 0.12,
            "raster-saturation": -0.15,
            "raster-fade-duration": 0,
            "raster-resampling": "linear",
          },
        },
        {
          id: "rivers",
          type: "line",
          source: "rivers",
          paint: {
            "line-color": "#657d82",
            "line-opacity": 0.66,
            "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.35, 9, 1.05],
          },
        },
        {
          id: "lakes",
          type: "fill",
          source: "lakes",
          paint: { "fill-color": "#182327", "fill-opacity": 0.94 },
        },
        {
          id: "lake-shore",
          type: "line",
          source: "lakes",
          paint: { "line-color": "#81969a", "line-opacity": 0.62, "line-width": 0.65 },
        },
        {
          id: "coast",
          type: "line",
          source: "land",
          paint: {
            "line-color": "#c1b28d",
            "line-opacity": 0.58,
            "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.45, 9, 1.1],
          },
        },
      ],
    };
  }

  function webglSupported() {
    if (!window.WebGLRenderingContext) return false;
    const canvas = document.createElement("canvas");
    try {
      const attributes = { failIfMajorPerformanceCaveat: true };
      const context = canvas.getContext("webgl2", attributes) || canvas.getContext("webgl", attributes);
      return Boolean(context && typeof context.getParameter === "function");
    } catch (_) {
      return false;
    }
  }

  function setFallbackEnabled(state, enabled) {
    const fallback = document.getElementById(state.config.fallback);
    if (!fallback) return;
    fallback.setAttribute("aria-hidden", enabled ? "false" : "true");
    fallback.querySelectorAll("[tabindex]").forEach((element) => {
      if (!element.dataset.fallbackTabindex) {
        element.dataset.fallbackTabindex = element.getAttribute("tabindex") || "0";
      }
      element.setAttribute(
        "tabindex",
        enabled ? element.dataset.fallbackTabindex : "-1"
      );
    });
  }

  function setPanelState(state, status) {
    const panel = document.getElementById(state.config.panel);
    if (!panel) return;
    panel.classList.toggle("terrain-ready", status === "ready");
    panel.classList.toggle("terrain-failed", status === "failed");
    state.container.setAttribute("aria-hidden", status === "ready" ? "false" : "true");
    setFallbackEnabled(state, status !== "ready");
    if (options.onStatus) options.onStatus(state.scope, status);
  }

  function markerElement(marker, scope) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `terrain-marker ${marker.className || "pin-other"}`;
    if (marker.labelled || marker.hero) button.classList.add("terrain-marker--labelled");
    if (marker.hero) button.classList.add("terrain-marker--hero");
    button.dataset.id = marker.id;
    button.setAttribute("aria-label", marker.ariaLabel || marker.name);

    const dot = document.createElement("span");
    dot.className = "terrain-marker-dot";
    dot.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.className = "terrain-marker-label";
    label.textContent = marker.name;
    label.setAttribute("aria-hidden", "true");
    button.append(dot, label);
    button.addEventListener("click", () => {
      select(scope, marker.id);
      marker.onSelect();
    });
    return button;
  }

  function addMarker(state, marker) {
    const element = markerElement(marker, state.scope);
    const instance = new maplibregl.Marker({ element, anchor: "center" })
      .setLngLat(marker.coordinates)
      .addTo(state.map);
    state.markers.set(marker.id, { element, instance, marker });
  }

  function clearClusters(state) {
    state.clusters.forEach((cluster) => cluster.remove());
    state.clusters.length = 0;
    state.markers.forEach(({ element }) => { element.hidden = false; });
  }

  function reflowClusters(state) {
    if (state.scope !== "us" || !state.map || state.failed) return;
    clearClusters(state);
    const zoom = state.map.getZoom();
    const threshold = zoom >= 9.5 ? 18 : 34;
    const entries = [...state.markers.values()].map((entry) => ({
      ...entry,
      point: state.map.project(entry.marker.coordinates),
    }));
    const remaining = new Set(entries);
    const groups = [];
    while (remaining.size) {
      const seed = remaining.values().next().value;
      remaining.delete(seed);
      const group = [seed], queue = [seed];
      while (queue.length) {
        const current = queue.pop();
        for (const candidate of [...remaining]) {
          const dx = current.point.x - candidate.point.x;
          const dy = current.point.y - candidate.point.y;
          if (Math.hypot(dx, dy) < threshold) {
            remaining.delete(candidate); group.push(candidate); queue.push(candidate);
          }
        }
      }
      groups.push(group);
    }

    groups.filter((group) => group.length > 1).forEach((group) => {
      group.forEach(({ element }) => { element.hidden = true; });
      const center = group.reduce((sum, entry) => [
        sum[0] + entry.marker.coordinates[0],
        sum[1] + entry.marker.coordinates[1],
      ], [0, 0]).map((value) => value / group.length);
      const names = group.map((entry) => entry.marker.name);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "terrain-cluster";
      button.textContent = String(group.length);
      button.setAttribute("aria-label", `${group.length} nearby locations: ${names.join(", ")}. Zoom in.`);
      button.addEventListener("click", () => {
        state.map.easeTo({
          center,
          zoom: Math.min(state.config.maxZoom, state.map.getZoom() + 2),
          duration: document.body.dataset.reducemotion === "on" ? 0 : 320,
        });
      });
      state.clusters.push(
        new maplibregl.Marker({ element: button, anchor: "center" }).setLngLat(center).addTo(state.map)
      );
    });
  }

  function validCoordinates(location) {
    const coordinates = location && location.coordinates;
    return coordinates && Number.isFinite(coordinates.longitude) && Number.isFinite(coordinates.latitude);
  }

  function usMarkers(data) {
    const worldById = new Map(data.world.locations.map((location) => [location.id, location]));
    const migrationByLegacy = new Map(
      data.migration.markers
        .filter((marker) => marker.status === "matched")
        .map((marker) => [marker.legacy_id, marker.world_location_id])
    );
    const markers = options.locations.flatMap((location) => {
      const world = worldById.get(migrationByLegacy.get(location.id));
      if (!validCoordinates(world)) return [];
      return [{
        id: location.id,
        name: location.name,
        coordinates: [world.coordinates.longitude, world.coordinates.latitude],
        className: options.factions[location.faction]?.cls || "pin-other",
        ariaLabel: `${location.name} — ${world.placement?.basis?.replaceAll("_", " ") || "reviewed atlas point"}`,
        onSelect: () => options.onUsSelect(location.id),
      }];
    });

    const home = worldById.get("misfits_wendover_town");
    if (validCoordinates(home)) {
      markers.push({
        id: "wendover-home",
        name: "WENDOVER",
        coordinates: [home.coordinates.longitude, home.coordinates.latitude],
        className: "pin-other",
        hero: true,
        ariaLabel: "Wendover — open the regional terrain map",
        onSelect: options.onOpenRegion,
      });
    }
    return markers;
  }

  function regionMarkers(data) {
    return data.world.locations.filter(
      (location) => REGION_IDS.has(location.id) && validCoordinates(location)
    ).map((location) => ({
      id: location.id,
      name: location.name.replace(" Ruins", ""),
      coordinates: [location.coordinates.longitude, location.coordinates.latitude],
      className: location.id === "misfits_vault_facility" ? "pin-ncr" : "pin-other",
      labelled: location.id === "misfits_wendover_town",
      ariaLabel: `${location.name} — ${location.source_confidence || "provisional"} confidence`,
      onSelect: () => options.onRegionSelect(location),
    }));
  }

  function applyContrast(state) {
    if (!state.ready || !state.map.getLayer("terrain")) return;
    const high = document.body.dataset.contrast === "high";
    state.map.setPaintProperty("water", "background-color", high ? "#020303" : "#11171a");
    state.map.setPaintProperty("land", "fill-color", high ? "#5f5a4d" : "#675f4d");
    state.map.setPaintProperty("coast", "line-color", high ? "#ffffff" : "#c1b28d");
    state.map.setPaintProperty("lakes", "fill-color", high ? "#000000" : "#182327");
    state.map.setPaintProperty("lake-shore", "line-color", high ? "#ffffff" : "#81969a");
    state.map.setPaintProperty("rivers", "line-color", high ? "#ffffff" : "#657d82");
    state.map.setPaintProperty("terrain", "raster-opacity", high ? 0.68 : 0.84);
    state.map.setPaintProperty("terrain", "raster-contrast", high ? 0.3 : 0.12);
  }

  function recordMetrics(state) {
    const resources = performance.getEntriesByType("resource").filter((entry) =>
      /\/(?:vendor\/maplibre|map-terrain\.js|media\/map-terrain|data\/(?:world|atlas-migration|geography))/.test(entry.name)
    );
    state.metrics = {
      firstOpenMs: Math.round(performance.now() - state.startedAt),
      requestCount: resources.length,
      transferBytes: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
      decodedBytes: resources.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), 0),
    };
    state.container.dataset.terrainReadyMs = String(state.metrics.firstOpenMs);
    state.container.dataset.terrainRequests = String(state.metrics.requestCount);
    state.container.dataset.terrainTransferBytes = String(state.metrics.transferBytes);
    state.container.dataset.terrainDecodedBytes = String(state.metrics.decodedBytes);
  }

  function fail(state, error) {
    if (state.failed) return;
    state.failed = true;
    clearTimeout(state.timeout);
    state.resizeObserver?.disconnect();
    state.contrastObserver?.disconnect();
    state.markers.forEach(({ instance }) => instance.remove());
    clearClusters(state);
    state.markers.clear();
    try { state.map.remove(); } catch (_) { /* already torn down */ }
    setPanelState(state, "failed");
    console.warn(`Terrain renderer (${state.scope}) fell back to SVG:`, error);
  }

  async function mount(scope) {
    if (!SCOPE[scope] || scopes.has(scope)) return scopes.get(scope);
    const config = SCOPE[scope];
    const container = document.getElementById(config.container);
    if (!container) return null;
    const startedAt = firstMount && options.startedAt ? options.startedAt : performance.now();
    firstMount = false;
    const state = {
      scope,
      config,
      container,
      map: null,
      markers: new Map(),
      clusters: [],
      ready: false,
      failed: false,
      timeout: null,
      resizeObserver: null,
      contrastObserver: null,
      metrics: null,
      startedAt,
    };
    scopes.set(scope, state);
    setPanelState(state, "loading");

    try {
      const data = await loadData();
      if (!maplibregl || !webglSupported()) {
        throw new Error("WebGL is unavailable or software-rendered");
      }

      state.map = new maplibregl.Map({
        container,
        style: terrainStyle(config),
        bounds: config.bounds,
        fitBoundsOptions: { padding: scope === "us" ? 22 : 28, duration: 0 },
        maxBounds: config.maxBounds,
        minZoom: config.minZoom,
        maxZoom: config.maxZoom,
        pitch: 0,
        bearing: 0,
        renderWorldCopies: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        cooperativeGestures: true,
        attributionControl: false,
        fadeDuration: document.body.dataset.reducemotion === "on" ? 0 : 120,
      });
      state.map.addControl(
        new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }),
        "top-right"
      );
      state.map.getCanvas().setAttribute("aria-label", config.label);

      state.map.once("load", () => {
        const markers = scope === "us" ? usMarkers(data) : regionMarkers(data);
        markers.forEach((marker) => addMarker(state, marker));
        reflowClusters(state);
        applyContrast(state);
      });
      state.map.on("moveend", () => reflowClusters(state));
      state.map.once("idle", () => {
        if (state.failed) return;
        clearTimeout(state.timeout);
        state.ready = true;
        recordMetrics(state);
        setPanelState(state, "ready");
        applyContrast(state);
      });
      state.map.on("error", (event) => {
        if (!state.ready) fail(state, event.error || new Error("terrain asset failed"));
      });
      state.map.getCanvas().addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        fail(state, new Error("WebGL context lost"));
      });
      state.timeout = setTimeout(
        () => fail(state, new Error("terrain did not become idle within 12 seconds")),
        12000
      );
      state.resizeObserver = new ResizeObserver(() => state.map?.resize());
      state.resizeObserver.observe(container);
      state.contrastObserver = new MutationObserver(() => applyContrast(state));
      state.contrastObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["data-contrast"],
      });
      return state;
    } catch (error) {
      fail(state, error);
      return state;
    }
  }

  function show(scope) {
    if (scope === "us" || scope === "region") {
      return mount(scope).then((state) => {
        if (state?.map && !state.failed) requestAnimationFrame(() => state.map.resize());
        return state;
      });
    }
    return Promise.resolve(null);
  }

  function select(scope, id) {
    const state = scopes.get(scope);
    if (!state) return;
    state.markers.forEach(({ element }, markerId) => {
      element.classList.toggle("sel", markerId === id);
    });
  }

  function init(nextOptions) {
    options = nextOptions;
    return { show, select, metrics: (scope) => scopes.get(scope)?.metrics || null };
  }

  window.OracularTerrain = { init };
})();
