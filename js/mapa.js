// Mapa-rompecabezas de la ruta, con estilo de carta portulana (siglo XIII).
// Cada parada es una pieza: se destapa cuando su evento ya se hizo.
// Requiere d3 y topojson-client.
// Uso: const mapa = await dibujarMapa(svg, datos, { alElegir }); mapa.modo("rompecabezas" | "completo")

const MAPA = {
  W: 1000,
  H: 470,
  M: 14, // margen del marco
  extent: [[-20, -12], [140, 62]],
  land: "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-50m.json",
  tinta: "#4a3220",
  rojo: "#9c2414",
  azul: "#1f4f7a",
  verde: "#2e6b3a",
  agua: "#7a5a3a",
  halo: "#f6ead0",
  dorso: "#d3bd8f",
};

// Tramos: puntos [lon, lat] o ids de paradas/escalas.
const TRAMOS = {
  padre: [
    ["venecia", [15.2, 42.6], [18.6, 39.9], [21.2, 36.9], [24.2, 37.7], [26, 39.9], "constantinopla", [31.5, 42.6],
     "soldaia", [40, 46.6], "sarai", [52, 44.6], [58, 42.6], "bujara", [69, 40.8], [75, 43.2], [82, 44.2], [90, 43.6],
     [97, 42.7], [105, 43], [112, 42.8], [116.18, 42.36], "khanbaliq"],
    ["khanbaliq", [108, 39.3], [100, 38.3], [94.66, 39.5], [87, 38.6], [80, 36.6], [75.5, 38.8], [70, 38.6], [64, 37.3],
     [56, 36.3], [48, 37.4], [41, 37.6], "ayas", "acre", [32, 33.3], [27, 34.6], [21.2, 35.7], [18.3, 39], [15, 41.6], "venecia"],
  ],
  ida: [["venecia", [16, 42.3], [19.3, 39.7], [21.8, 36.6], [28, 35.3], [33, 34], "acre", "ayas",
        [41, 38.5], "tabriz", [50, 33], [54, 30], "ormuz", [57, 30.3], [60.5, 33], [64, 35.5], "balj",
        [72, 37.5], "kashgar", [80, 37.3], [88, 39.4], "gobi", [100.4, 39], [108, 41.5], [116.18, 42.36], "khanbaliq"]],
  misiones: [
    ["khanbaliq", [113, 35], [108, 31], [104, 28.5], "yunnan"],
    ["khanbaliq", [117.5, 35], [119, 32], "hangzhou"],
  ],
  regreso: [["hangzhou", [119.8, 27.5], "zaiton", [114, 20], [110, 15], [109, 11.5], [105.5, 7], [104, 1.6],
            [100.5, 3.5], "sumatra", [92, 6.3], [84, 5.6], [81, 5.6], "ceilan", [78, 7.8], "malabar", [74, 13],
            [72.5, 19], [68, 23.5], [62, 25], [57.6, 26.2], "ormuz", [53, 29.3], [49.5, 33.8], "tabriz", [43, 40],
            "trebisonda", [35, 42.1], [31, 41.4], "constantinopla", [26.3, 40.1], [25, 38], [23.5, 36], [21.4, 36.1],
            [18.8, 39.4], [15.5, 42], [13, 45], "venecia"]],
  carcel: [["venecia", [11, 44.6], "genova"]],
};

const ESTILO_TRAMO = {
  padre: { stroke: MAPA.verde, "stroke-width": 3.2, "stroke-dasharray": "10 3 2 3" },
  ida: { stroke: MAPA.rojo, "stroke-width": 3.6 },
  misiones: { stroke: MAPA.rojo, "stroke-width": 2.6, "stroke-dasharray": "1 5" },
  regreso: { stroke: MAPA.azul, "stroke-width": 3.4, "stroke-dasharray": "9 5" },
  carcel: { stroke: MAPA.tinta, "stroke-width": 2.2, "stroke-dasharray": "1 5" },
};
const GRUPO_TRAMO = { padre: "padre", ida: "marco", misiones: "marco", regreso: "marco", carcel: "marco" };

// Posición de cada etiqueta respecto del punto [dx, dy, anchor]
const ETIQUETAS = {
  venecia: [8, -9, "start"], genova: [-9, -6, "end"], acre: [-9, 12, "end"], tabriz: [9, -8, "start"],
  ormuz: [6, 18, "start"], balj: [0, -13, "middle"], kashgar: [6, -11, "start"], gobi: [0, -13, "middle"],
  khanbaliq: [9, -7, "start"], hangzhou: [10, 4, "start"], yunnan: [-10, 4, "end"], sumatra: [0, 22, "middle"],
  ceilan: [6, 22, "start"], malabar: [-10, -2, "end"], trebisonda: [8, -8, "start"],
  constantinopla: [-6, -6, "end"], soldaia: [0, -8, "middle"], sarai: [7, -5, "start"], bujara: [0, -8, "middle"],
  ayas: [6, -6, "start"], zaiton: [7, 9, "start"],
};

const MONTES = [[7, 46.2], [10, 46.6], [13, 47], [42, 43], [45, 42.4], [48, 33.5], [51, 31.5], [33, 37.3],
  [69.5, 35.8], [72.5, 38.6], [74, 36.4], [80, 41.5], [84, 42], [88, 42.2], [79.5, 31], [83, 29.6],
  [86.5, 28.6], [90, 28.4], [93, 29], [86, 35.8], [91, 35.6], [99.5, 27.5], [60, 36.5]];

const DESIERTOS = [[92, 46, 112, 41], [79, 40.3, 88, 37.8], [45, 27, 54, 21]]; // [lon0, lat0, lon1, lat1]

const LEYENDAS = [
  { t: "Mare Mediterraneum", p: [16, 33], s: 11 },
  { t: "Mare Maius", p: [33.5, 43.9], s: 10 },
  { t: "Mare de Bacu", p: [50.8, 41], s: 9, r: -70 },
  { t: "Mare Indicum", p: [63, 15], s: 15 },
  { t: "Mare Cin", p: [125, 15], s: 13 },
  { t: "Oceanus", p: [-12, 30], s: 13, r: -90 },
  { t: "Terra Incognita", p: [95, 57], s: 14 },
  { t: "Terra Incognita", p: [27, 1], s: 12 },
  { t: "Cataio", p: [110, 36.5], s: 16 },
  { t: "Manzi", p: [112, 27], s: 14 },
  { t: "India Maior", p: [80.5, 22.5], s: 14 },
  { t: "Persia", p: [55, 33.6], s: 13 },
  { t: "Tartaria", p: [72, 51], s: 16 },
  { t: "Horda de Oro", p: [44, 51], s: 11 },
];

const fuente = (sel, sc, size, italic) => sel.attr("font-family", sc ? "'IM Fell English SC', Georgia, serif" : "'IM Fell English', Georgia, serif")
  .attr("font-size", size).attr("font-style", italic ? "italic" : null);

async function dibujarMapa(svgEl, datos, { alElegir } = {}) {
  const { W, H, M } = MAPA;
  const { paradas, escalas = [], evento } = datos;
  const svg = d3.select(svgEl).attr("viewBox", `0 0 ${W} ${H}`);
  svg.selectAll("*").remove();
  const proj = d3.geoEquirectangular().fitExtent([[0, 0], [W, H]], { type: "MultiPoint", coordinates: MAPA.extent });
  const geo = d3.geoPath(proj);
  const P = c => proj(c);
  const lugares = Object.fromEntries([...paradas, ...escalas].map(p => [p.id, p]));
  const pt = x => (typeof x === "string" ? lugares[x].coords : x);
  const proxima = (evento.ediciones || []).find(e => !paradas.find(p => p.id === e.parada && p.estado === "hecha"));
  const ediciones = Object.fromEntries((evento.ediciones || []).map(e => [e.parada, e]));
  const estadoPieza = p => (p.estado === "hecha" ? "entregada" : proxima && proxima.parada === p.id ? "proxima" : "tapada");

  // --- defs
  const defs = svg.append("defs");
  const papel = defs.append("filter").attr("id", "papel").attr("x", 0).attr("y", 0).attr("width", "100%").attr("height", "100%");
  papel.append("feTurbulence").attr("type", "fractalNoise").attr("baseFrequency", 0.035).attr("numOctaves", 4).attr("seed", 7);
  papel.append("feColorMatrix").attr("values", "0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.18  0 0 0 0.55 -0.12");
  const aspero = defs.append("filter").attr("id", "aspero");
  aspero.append("feTurbulence").attr("type", "fractalNoise").attr("baseFrequency", 0.9).attr("numOctaves", 2).attr("result", "n");
  aspero.append("feDisplacementMap").attr("in", "SourceGraphic").attr("in2", "n").attr("scale", 2.2);
  const carton = defs.append("pattern").attr("id", "carton").attr("width", 6).attr("height", 6).attr("patternUnits", "userSpaceOnUse");
  carton.append("rect").attr("width", 6).attr("height", 6).attr("fill", MAPA.dorso);
  carton.append("path").attr("d", "M0,6 L6,0").attr("stroke", "#b89c68").attr("stroke-width", 0.6);
  const sombra = defs.append("filter").attr("id", "sombra").attr("x", "-10%").attr("y", "-10%").attr("width", "120%").attr("height", "120%");
  sombra.append("feDropShadow").attr("dx", 0).attr("dy", 1.5).attr("stdDeviation", 1.5).attr("flood-color", "#3a2510").attr("flood-opacity", 0.45);
  const vin = defs.append("radialGradient").attr("id", "vineta").attr("r", "75%");
  vin.append("stop").attr("offset", "55%").attr("stop-color", "#ecdcb6");
  vin.append("stop").attr("offset", "100%").attr("stop-color", "#c7a26a");
  defs.append("clipPath").attr("id", "marco").append("rect").attr("x", M).attr("y", M).attr("width", W - 2 * M).attr("height", H - 2 * M);

  svg.append("rect").attr("width", W).attr("height", H).attr("fill", "url(#vineta)");
  svg.append("rect").attr("width", W).attr("height", H).attr("filter", "url(#papel)");
  const g = svg.append("g").attr("clip-path", "url(#marco)");

  // --- líneas de rumbo (portulano)
  const colorRumbo = i => (i % 4 === 0 ? MAPA.tinta : i % 2 === 0 ? "#3d6b45" : MAPA.rojo);
  [[66, -3], [18, 38], [112, 12], [45, 50]].forEach(r => {
    const [cx, cy] = P(r);
    for (let i = 0; i < 32; i++) {
      const a = (i * Math.PI) / 16;
      g.append("line").attr("x1", cx).attr("y1", cy).attr("x2", cx + Math.cos(a) * 1400).attr("y2", cy + Math.sin(a) * 1400)
        .attr("stroke", colorRumbo(i)).attr("stroke-width", i % 4 === 0 ? 0.5 : 0.35).attr("opacity", 0.22);
    }
  });

  // --- tierra con líneas de agua
  const topo = await d3.json(MAPA.land);
  const land = topojson.feature(topo, topo.objects.land);
  [[16, 0.07], [10, 0.1], [5, 0.16]].forEach(([w, o]) =>
    g.append("path").attr("d", geo(land)).attr("fill", "none").attr("stroke", MAPA.agua).attr("stroke-width", w).attr("opacity", o).attr("stroke-linejoin", "round"));
  g.append("path").attr("d", geo(land)).attr("fill", "#e6d1a2").attr("stroke", MAPA.tinta).attr("stroke-width", 0.9).attr("filter", "url(#aspero)");

  // --- desiertos y montañas
  const rnd = d3.randomLcg(42);
  DESIERTOS.forEach(([a, b, c, d]) => {
    for (let i = 0; i < 160; i++) {
      const [x, y] = P([a + (c - a) * rnd(), d + (b - d) * rnd()]);
      g.append("circle").attr("cx", x).attr("cy", y).attr("r", 0.7).attr("fill", "#8a6a3e").attr("opacity", 0.55);
    }
  });
  MONTES.forEach(m => {
    const [x, y] = P(m);
    const s = 7 + rnd() * 3;
    g.append("path").attr("d", `M${x - s},${y + 3} L${x},${y - s} L${x + s},${y + 3}`)
      .attr("fill", "#d9bf8a").attr("stroke", MAPA.tinta).attr("stroke-width", 0.8).attr("stroke-linejoin", "round").attr("opacity", 0.85);
    g.append("path").attr("d", `M${x},${y - s} L${x + s * 0.55},${y + 3} L${x + s},${y + 3} Z`).attr("fill", "#9b7444").attr("opacity", 0.45);
  });

  LEYENDAS.forEach(l => {
    const [x, y] = P(l.p);
    fuente(g.append("text"), false, l.s, true).attr("x", x).attr("y", y).attr("text-anchor", "middle")
      .attr("transform", l.r ? `rotate(${l.r},${x},${y})` : null)
      .attr("letter-spacing", l.s > 13 ? 3 : 1).attr("fill", MAPA.tinta).attr("opacity", 0.6).text(l.t);
  });
  rosaVientos(g, ...P([66, -3]), 46);
  [[59, 6], [128, 22], [5, 38.3]].forEach(b => barco(g, ...P(b)));

  // --- rutas (halo claro + trazo fuerte para que se lean sobre el pergamino)
  const linea = d3.line().curve(d3.curveCatmullRom.alpha(0.5));
  const rutas = { padre: g.append("g").attr("class", "ruta-padre"), marco: g.append("g").attr("class", "ruta-marco") };
  ["padre", "ida", "misiones", "regreso", "carcel"].forEach(k => TRAMOS[k].forEach(pts => {
    const d = linea(pts.map(x => P(pt(x))));
    const capa = rutas[GRUPO_TRAMO[k]];
    capa.append("path").attr("d", d).attr("fill", "none").attr("stroke", MAPA.halo).attr("stroke-width", ESTILO_TRAMO[k]["stroke-width"] + 4)
      .attr("stroke-linecap", "round").attr("stroke-linejoin", "round").attr("opacity", 0.85);
    const p = capa.append("path").attr("d", d).attr("fill", "none").attr("stroke-linecap", "round").attr("stroke-linejoin", "round");
    Object.entries(ESTILO_TRAMO[k]).forEach(([a, v]) => p.attr(a, v));
  }));

  // --- escalas (sin pieza propia)
  const esc = g.selectAll(".escala").data(escalas).join("g").attr("class", "escala")
    .attr("transform", e => `translate(${P(e.coords)})`).style("cursor", "pointer")
    .on("click", (_, e) => elegir(e));
  esc.append("title").text(e => `${e.antiguo} · ${e.lugar} · ${e.anio}`);
  esc.append("circle").attr("r", 9).attr("fill", "transparent");
  esc.append("path").attr("d", "M0,-4.5 L4.5,0 L0,4.5 L-4.5,0 Z")
    .attr("fill", e => (e.viaje === "marco" ? MAPA.azul : MAPA.verde)).attr("stroke", MAPA.halo).attr("stroke-width", 1.2);
  etiqueta(esc, e => e.id, e => e.antiguo, 11, true);

  // --- paradas
  const nodo = g.selectAll(".parada").data(paradas).join("g").attr("class", "parada")
    .attr("transform", p => `translate(${P(p.coords)})`).style("cursor", "pointer")
    .on("click", (_, p) => elegir(p));
  nodo.append("title").text(p => `${p.nombre_antiguo} · ${p.lugar} · ${p.anio}`);
  nodo.append("circle").attr("r", 9).attr("fill", "#f6ead0").attr("stroke", MAPA.rojo).attr("stroke-width", 2);
  fuente(nodo.append("text"), true, 10, false).attr("text-anchor", "middle").attr("dy", "0.35em").attr("fill", MAPA.rojo).text(p => p.orden);
  etiqueta(nodo, p => p.id, p => p.nombre_antiguo, 13.5, false);

  // --- piezas del rompecabezas
  const { piezas, centros } = cortarPiezas(paradas.map(p => P(p.coords)), [M, M, W - M, H - M]);
  const capaPiezas = svg.append("g");
  const pieza = capaPiezas.selectAll(".pieza").data(paradas).join("g").attr("class", p => "pieza " + estadoPieza(p))
    .style("cursor", "pointer").on("click", (_, p) => elegir(p));
  pieza.append("path").attr("class", "dorso").attr("d", (_, i) => piezas[i]).attr("fill", "url(#carton)")
    .attr("stroke", "#8a6a3e").attr("stroke-width", 0.8).attr("filter", "url(#sombra)");
  pieza.append("path").attr("class", "corte").attr("d", (_, i) => piezas[i]).attr("fill", "transparent")
    .attr("stroke", MAPA.tinta).attr("stroke-width", 1).attr("stroke-linejoin", "round").attr("pointer-events", "none");
  // Rótulos en una capa aparte, por encima de todos los dorsos, en el centro de cada pieza
  const etiquetaPieza = svg.append("g").attr("pointer-events", "none").selectAll(".rotulo").data(paradas).join("g")
    .attr("class", "rotulo").attr("transform", (_, i) => `translate(${centros[i]})`);
  fuente(etiquetaPieza.append("text"), true, 22, false).attr("text-anchor", "middle").attr("dy", 2).attr("fill", "#7a5a34").text(p => p.orden);
  fuente(etiquetaPieza.append("text"), false, 11, true).attr("text-anchor", "middle").attr("dy", 17).attr("fill", "#6a4c2a").text(p => p.nombre_antiguo);
  pieza.filter(p => estadoPieza(p) === "proxima").append("path").attr("class", "brillo").attr("d", p => piezas[paradas.indexOf(p)])
    .attr("fill", "none").attr("stroke", "#e0a526").attr("stroke-width", 3).attr("stroke-dasharray", "8 6").attr("pointer-events", "none");

  // --- cartela y marco
  const laCartela = cartela(svg, P([-18.5, 9]));
  svg.append("rect").attr("x", 8).attr("y", 8).attr("width", W - 16).attr("height", H - 16).attr("fill", "none").attr("stroke", MAPA.tinta).attr("stroke-width", 2);
  svg.append("rect").attr("x", M).attr("y", M).attr("width", W - 2 * M).attr("height", H - 2 * M).attr("fill", "none").attr("stroke", MAPA.tinta).attr("stroke-width", 0.7);

  function elegir(lugar) {
    svg.selectAll(".parada circle").attr("stroke-width", p => (p === lugar ? 3.5 : 2));
    if (alElegir) alElegir(lugar, lugar.orden ? { estado: estadoPieza(lugar), edicion: ediciones[lugar.id] } : null);
  }

  function modo(m) {
    const rompe = m === "rompecabezas";
    const tapada = p => rompe && estadoPieza(p) === "tapada";
    pieza.style("pointer-events", p => (tapada(p) ? "all" : "none"));
    pieza.select(".dorso").style("display", p => (tapada(p) ? null : "none"));
    etiquetaPieza.style("display", p => (tapada(p) ? null : "none"));
    pieza.select(".corte").attr("opacity", rompe ? 0.7 : 0.18);
    laCartela.style("display", rompe ? "none" : null);
  }

  function rutasVisibles(cual, visible) { rutas[cual].style("display", visible ? null : "none"); }

  modo("rompecabezas");
  return { modo, rutasVisibles, elegir, proxima, estadoPieza };
}

// Voronoi relajado (cada parada queda en su propia pieza) + encastres de rompecabezas en los bordes internos.
function cortarPiezas(puntos, [x0, y0, x1, y1]) {
  const semillas = puntos.map(p => [...p]);
  const masCercana = (q, ss) => d3.minIndex(ss, s => (s[0] - q[0]) ** 2 + (s[1] - q[1]) ** 2);
  for (let it = 0; it < 120; it++) {
    const vor = d3.Delaunay.from(semillas).voronoi([x0, y0, x1, y1]);
    semillas.forEach((s, i) => {
      const c = d3.polygonCentroid(vor.cellPolygon(i));
      const prev = [...s];
      s[0] += (c[0] - s[0]) * 0.4; s[1] += (c[1] - s[1]) * 0.4;
      if (!puntos.every((q, j) => masCercana(q, semillas) === j)) { s[0] = prev[0]; s[1] = prev[1]; }
    });
  }
  const vor = d3.Delaunay.from(semillas).voronoi([x0, y0, x1, y1]);
  const r = v => Math.round(v * 10) / 10;
  const enBorde = (a, b) => [[0, x0], [0, x1], [1, y0], [1, y1]].some(([k, v]) => Math.abs(a[k] - v) < 0.5 && Math.abs(b[k] - v) < 0.5);
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

  function encastre(a, b) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 34) return [a, b];
    const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = [-u[1], u[0]];
    const s = hash(`${r(a[0])},${r(a[1])}|${r(b[0])},${r(b[1])}`) % 2 ? 1 : -1;
    const t = Math.min(L * 0.22, 18), m = L / 2;
    const loc = [[0, 0]];
    const quad = (p0, c, p1) => { for (let k = 1; k <= 6; k++) { const q = k / 6; loc.push([(1 - q) ** 2 * p0[0] + 2 * (1 - q) * q * c[0] + q * q * p1[0], (1 - q) ** 2 * p0[1] + 2 * (1 - q) * q * c[1] + q * q * p1[1]]); } };
    loc.push([m - 0.3 * t, 0]);
    quad([m - 0.3 * t, 0], [m - 0.12 * t, s * 0.2 * t], [m - 0.3 * t, s * 0.4 * t]);
    const a0 = Math.atan2(-0.4 * s, -0.3), span = 2 * Math.PI - 2 * Math.atan2(0.3, 0.4);
    for (let k = 1; k <= 20; k++) { const th = a0 - s * span * (k / 20); loc.push([m + 0.5 * t * Math.cos(th), s * 0.8 * t + 0.5 * t * Math.sin(th)]); }
    quad([m + 0.3 * t, s * 0.4 * t], [m + 0.12 * t, s * 0.2 * t], [m + 0.3 * t, 0]);
    loc.push([L, 0]);
    return loc.map(([x, y]) => [a[0] + u[0] * x + n[0] * y, a[1] + u[1] * x + n[1] * y]);
  }
  const borde = (a, b) => {
    if (enBorde(a, b)) return [a, b];
    const ka = `${r(a[0])},${r(a[1])}`, kb = `${r(b[0])},${r(b[1])}`;
    return ka < kb ? encastre(a, b) : encastre(b, a).reverse();
  };
  const centros = puntos.map((_, i) => d3.polygonCentroid(vor.cellPolygon(i)));
  const piezas = puntos.map((_, i) => {
    const poly = vor.cellPolygon(i);
    const pts = [];
    for (let k = 0; k < poly.length - 1; k++) pts.push(...borde(poly[k], poly[k + 1]).slice(0, -1));
    return "M" + pts.map(p => p.map(v => v.toFixed(1)).join(",")).join("L") + "Z";
  });
  return { piezas, centros };
}

function etiqueta(sel, id, texto, size, italic) {
  fuente(sel.append("text"), !italic, size, italic)
    .attr("x", d => (ETIQUETAS[id(d)] || [10, -8])[0]).attr("y", d => (ETIQUETAS[id(d)] || [10, -8])[1])
    .attr("text-anchor", d => (ETIQUETAS[id(d)] || [0, 0, "start"])[2]).attr("fill", MAPA.tinta)
    .attr("paint-order", "stroke").attr("stroke", "#f1e3c2").attr("stroke-width", 3.5).attr("stroke-linejoin", "round")
    .text(texto);
}

function cartela(svg, [x, y]) {
  const c = svg.append("g").attr("transform", `translate(${x},${y})`);
  c.append("rect").attr("width", 250).attr("height", 128).attr("rx", 4).attr("fill", "#efe0bd").attr("stroke", MAPA.tinta).attr("stroke-width", 1.2);
  c.append("rect").attr("x", 4).attr("y", 4).attr("width", 242).attr("height", 120).attr("rx", 2).attr("fill", "none").attr("stroke", MAPA.rojo).attr("stroke-width", 0.6);
  fuente(c.append("text"), true, 17, false).attr("x", 125).attr("y", 25).attr("text-anchor", "middle").attr("fill", MAPA.rojo).text("Itinerarium Polorum");
  fuente(c.append("text"), false, 11, true).attr("x", 125).attr("y", 40).attr("text-anchor", "middle").attr("fill", MAPA.tinta).text("Anno Domini MCCLX – MCCXCV");
  [["Niccolò et Maffeo, 1260–1269", ESTILO_TRAMO.padre], ["Marcus, iter per terram, 1271–75", ESTILO_TRAMO.ida],
   ["Marcus, legationes in Cataio", ESTILO_TRAMO.misiones], ["Reditus per mare, 1292–95", ESTILO_TRAMO.regreso]].forEach(([t, a], i) => {
    const y = 58 + i * 17;
    const l = c.append("line").attr("x1", 16).attr("x2", 54).attr("y1", y).attr("y2", y).attr("stroke-linecap", "round");
    Object.entries(a).forEach(([k, v]) => l.attr(k, v));
    fuente(c.append("text"), false, 11, true).attr("x", 62).attr("y", y + 4).attr("fill", MAPA.tinta).text(t);
  });
  return c;
}

function rosaVientos(g, x, y, r) {
  const rosa = g.append("g").attr("transform", `translate(${x},${y})`);
  rosa.append("circle").attr("r", r * 0.62).attr("fill", "#efe0bd").attr("stroke", MAPA.tinta).attr("stroke-width", 0.8);
  const punta = (ang, largo, ancho, fill) => {
    const a = (ang * Math.PI) / 180;
    const px = Math.sin(a) * largo, py = -Math.cos(a) * largo;
    const lx = Math.sin(a - Math.PI / 2) * ancho, ly = -Math.cos(a - Math.PI / 2) * ancho;
    rosa.append("path").attr("d", `M${lx},${ly} L${px},${py} L${-lx},${-ly} Z`).attr("fill", fill).attr("stroke", MAPA.tinta).attr("stroke-width", 0.6);
  };
  for (let i = 0; i < 8; i++) punta(i * 45 + 22.5, r * 0.55, r * 0.07, i % 2 ? "#3d6b45" : "#e6d1a2");
  for (let i = 0; i < 4; i++) punta(i * 90 + 45, r * 0.75, r * 0.1, "#e6d1a2");
  for (let i = 0; i < 4; i++) punta(i * 90, r, r * 0.13, i === 0 ? MAPA.rojo : MAPA.tinta);
  rosa.append("circle").attr("r", 3).attr("fill", MAPA.rojo);
  fuente(rosa.append("text"), true, 12, false).attr("y", -r - 5).attr("text-anchor", "middle").attr("fill", MAPA.rojo).text("Tramontana");
}

function barco(g, x, y) {
  const b = g.append("g").attr("transform", `translate(${x},${y})`).attr("stroke", MAPA.tinta).attr("stroke-width", 0.8);
  b.append("path").attr("d", "M-14,0 Q0,8 14,0 L10,-3 L-11,-3 Z").attr("fill", "#9b7444");
  b.append("line").attr("x1", 0).attr("y1", -3).attr("x2", 0).attr("y2", -22);
  b.append("path").attr("d", "M0,-21 Q9,-14 0,-6 Z").attr("fill", "#f3e6c8");
  b.append("path").attr("d", "M0,-22 L6,-24 L0,-26").attr("fill", MAPA.rojo).attr("stroke-width", 0.5);
  b.append("path").attr("d", "M-20,4 q3,-2 6,0 t6,0 M10,5 q3,-2 6,0 t6,0").attr("fill", "none").attr("stroke-width", 0.6).attr("opacity", 0.7);
}
