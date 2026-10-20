// Mapa de la ruta con estilo de carta portulana (siglo XIII).
// Requiere d3 y topojson-client. Uso: dibujarMapa(svgElement, paradas, alClickear)

const MAPA = {
  W: 1000,
  H: 470,
  extent: [[-20, -12], [140, 62]],
  land: "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-50m.json",
  tinta: "#4a3220",
  rojo: "#8b2a1a",
  agua: "#7a5a3a",
};

// Tramos del viaje: puntos [lon, lat]. Los ids se reemplazan por las coords de la parada.
const TRAMOS = {
  ida: ["venecia", [16, 42.3], [19.3, 39.7], [21.8, 36.6], [28, 35.3], [33, 34], "acre", [35.8, 36.8],
        [41, 38.5], "tabriz", [50, 33], [54, 30], "ormuz", [57, 30.3], [60.5, 33], [64, 35.5], "balj",
        [72, 37.5], "kashgar", [80, 37.3], [88, 39.4], "gobi", [100.4, 39], [108, 41.5], [116.18, 42.36], "khanbaliq"],
  misiones: [
    ["khanbaliq", [113, 35], [108, 31], [104, 28.5], "yunnan"],
    ["khanbaliq", [117.5, 35], [119, 32], "hangzhou"],
  ],
  regreso: ["hangzhou", [119.8, 27.5], [118.6, 24.9], [114, 20], [110, 15], [109, 11.5], [105.5, 7], [104, 1.6],
            [100.5, 3.5], "sumatra", [92, 6.3], [84, 5.6], [81, 5.6], "ceilan", [78, 7.8], "malabar", [74, 13],
            [72.5, 19], [68, 23.5], [62, 25], [57.6, 26.2], "ormuz", [53, 29.3], [49.5, 33.8], "tabriz", [43, 40],
            "trebisonda", [35, 42.1], [31, 41.4], [28.97, 41.0], [26.3, 40.1], [25, 38], [23.5, 36], [21.4, 36.1],
            [18.8, 39.4], [15.5, 42], [13, 45], "venecia"],
  carcel: ["venecia", [11, 44.6], "genova"],
};

// Posición de cada etiqueta respecto del punto [dx, dy, anchor]
const ETIQUETAS = {
  venecia: [8, -8, "start"], genova: [-8, -6, "end"], acre: [-8, 12, "end"], tabriz: [8, -8, "start"],
  ormuz: [6, 16, "start"], balj: [0, -12, "middle"], kashgar: [6, -10, "start"], gobi: [0, -12, "middle"],
  khanbaliq: [8, -6, "start"], hangzhou: [9, 4, "start"], yunnan: [-9, 4, "end"], sumatra: [0, 20, "middle"],
  ceilan: [6, 20, "start"], malabar: [-9, -2, "end"], trebisonda: [8, -7, "start"],
};

const MONTES = [[7, 46.2], [10, 46.6], [13, 47], [42, 43], [45, 42.4], [48, 33.5], [51, 31.5], [33, 37.3],
  [69.5, 35.8], [72.5, 38.6], [74, 36.4], [80, 42.3], [84, 43], [88, 43.2], [79.5, 31], [83, 29.6],
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
  { t: "Tartaria", p: [65, 48], s: 16 },
];

async function dibujarMapa(svgEl, paradas, alClickear) {
  const { W, H } = MAPA;
  const svg = d3.select(svgEl).attr("viewBox", `0 0 ${W} ${H}`);
  const proj = d3.geoEquirectangular().fitExtent([[0, 0], [W, H]], { type: "MultiPoint", coordinates: MAPA.extent });
  const geo = d3.geoPath(proj);
  const P = c => proj(c);
  const porId = Object.fromEntries(paradas.map(p => [p.id, p]));
  const pt = x => (typeof x === "string" ? porId[x].coords : x);

  // --- defs: pergamino, bordes irregulares, viñeta
  const defs = svg.append("defs");
  const papel = defs.append("filter").attr("id", "papel").attr("x", 0).attr("y", 0).attr("width", "100%").attr("height", "100%");
  papel.append("feTurbulence").attr("type", "fractalNoise").attr("baseFrequency", 0.035).attr("numOctaves", 4).attr("seed", 7);
  papel.append("feColorMatrix").attr("values", "0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.18  0 0 0 0.55 -0.12");
  const aspero = defs.append("filter").attr("id", "aspero");
  aspero.append("feTurbulence").attr("type", "fractalNoise").attr("baseFrequency", 0.9).attr("numOctaves", 2).attr("result", "n");
  aspero.append("feDisplacementMap").attr("in", "SourceGraphic").attr("in2", "n").attr("scale", 2.2);
  const vin = defs.append("radialGradient").attr("id", "vineta").attr("r", "75%");
  vin.append("stop").attr("offset", "55%").attr("stop-color", "#ecdcb6");
  vin.append("stop").attr("offset", "100%").attr("stop-color", "#c7a26a");
  defs.append("clipPath").attr("id", "marco").append("rect").attr("x", 14).attr("y", 14).attr("width", W - 28).attr("height", H - 28);

  svg.append("rect").attr("width", W).attr("height", H).attr("fill", "url(#vineta)");
  svg.append("rect").attr("width", W).attr("height", H).attr("filter", "url(#papel)");
  const g = svg.append("g").attr("clip-path", "url(#marco)");

  // --- líneas de rumbo (portulano): 32 rumbos desde algunas rosas
  const rosas = [[66, -3], [18, 38], [112, 12], [45, 50]];
  const colorRumbo = i => (i % 4 === 0 ? MAPA.tinta : i % 2 === 0 ? "#3d6b45" : MAPA.rojo);
  rosas.forEach(r => {
    const [cx, cy] = P(r);
    for (let i = 0; i < 32; i++) {
      const a = (i * Math.PI) / 16;
      g.append("line").attr("x1", cx).attr("y1", cy).attr("x2", cx + Math.cos(a) * 1400).attr("y2", cy + Math.sin(a) * 1400)
        .attr("stroke", colorRumbo(i)).attr("stroke-width", i % 4 === 0 ? 0.6 : 0.4).attr("opacity", 0.32);
    }
  });

  // --- tierra con líneas de agua alrededor de la costa
  const topo = await d3.json(MAPA.land);
  const land = topojson.feature(topo, topo.objects.land);
  [[16, 0.07], [10, 0.1], [5, 0.16]].forEach(([w, o]) =>
    g.append("path").attr("d", geo(land)).attr("fill", "none").attr("stroke", MAPA.agua).attr("stroke-width", w).attr("opacity", o).attr("stroke-linejoin", "round"));
  g.append("path").attr("d", geo(land)).attr("fill", "#e6d1a2").attr("stroke", MAPA.tinta).attr("stroke-width", 0.9).attr("filter", "url(#aspero)");
  g.append("path").attr("d", geo(land)).attr("fill", "none").attr("stroke", "#a5793f").attr("stroke-width", 3).attr("opacity", 0.25)
    .attr("transform", "translate(0.8,0.8)");

  // --- desiertos (puntillado) y montañas
  const rnd = d3.randomLcg(42);
  DESIERTOS.forEach(([a, b, c, d]) => {
    for (let i = 0; i < 160; i++) {
      const [x, y] = P([a + (c - a) * rnd(), d + (b - d) * rnd()]);
      g.append("circle").attr("cx", x).attr("cy", y).attr("r", 0.7).attr("fill", "#8a6a3e").attr("opacity", 0.6);
    }
  });
  MONTES.forEach(m => {
    const [x, y] = P(m);
    const s = 7 + rnd() * 3;
    g.append("path").attr("d", `M${x - s},${y + 3} L${x},${y - s} L${x + s},${y + 3}`)
      .attr("fill", "#d9bf8a").attr("stroke", MAPA.tinta).attr("stroke-width", 0.9).attr("stroke-linejoin", "round");
    g.append("path").attr("d", `M${x},${y - s} L${x + s * 0.55},${y + 3} L${x + s},${y + 3} Z`).attr("fill", "#9b7444").attr("opacity", 0.55);
  });

  // --- leyendas de mares y regiones
  LEYENDAS.forEach(l => {
    const [x, y] = P(l.p);
    g.append("text").attr("x", x).attr("y", y).attr("text-anchor", "middle")
      .attr("transform", l.r ? `rotate(${l.r},${x},${y})` : null)
      .attr("font-family", "'IM Fell English', Georgia, serif").attr("font-style", "italic")
      .attr("font-size", l.s).attr("letter-spacing", l.s > 13 ? 3 : 1).attr("fill", MAPA.tinta).attr("opacity", 0.7).text(l.t);
  });

  // --- rosa de los vientos
  rosaVientos(g, ...P([66, -3]), 46);

  // --- barcos
  [[59, 6], [128, 22], [5, 38.3]].forEach(b => barco(g, ...P(b)));

  // --- la ruta
  const linea = d3.line().curve(d3.curveCatmullRom.alpha(0.5));
  const trazo = (pts, attrs) => {
    const p = g.append("path").attr("d", linea(pts.map(x => P(pt(x))))).attr("fill", "none").attr("stroke-linecap", "round");
    Object.entries(attrs).forEach(([k, v]) => p.attr(k, v));
    return p;
  };
  trazo(TRAMOS.ida, { stroke: "#f3e6c8", "stroke-width": 5, opacity: 0.8 });
  trazo(TRAMOS.ida, { stroke: MAPA.rojo, "stroke-width": 2.4 });
  TRAMOS.misiones.forEach(m => trazo(m, { stroke: MAPA.rojo, "stroke-width": 1.6, "stroke-dasharray": "1 4" }));
  trazo(TRAMOS.regreso, { stroke: "#f3e6c8", "stroke-width": 5, opacity: 0.8 });
  trazo(TRAMOS.regreso, { stroke: "#2f4f6b", "stroke-width": 2.2, "stroke-dasharray": "7 4" });
  trazo(TRAMOS.carcel, { stroke: MAPA.tinta, "stroke-width": 1.4, "stroke-dasharray": "1 4" });

  // Constantinopla, escala sin número
  const [kx, ky] = P([28.97, 41.0]);
  g.append("circle").attr("cx", kx).attr("cy", ky).attr("r", 2.5).attr("fill", MAPA.tinta);
  g.append("text").attr("x", kx - 5).attr("y", ky - 6).attr("text-anchor", "end").attr("font-family", "'IM Fell English', Georgia, serif")
    .attr("font-style", "italic").attr("font-size", 11).attr("fill", MAPA.tinta).text("Costantinopoli");

  // --- paradas
  const nodo = g.selectAll(".parada").data(paradas).join("g").attr("class", "parada")
    .attr("transform", p => `translate(${P(p.coords)})`).style("cursor", "pointer")
    .on("click", (_, p) => alClickear && alClickear(p));
  nodo.append("title").text(p => `${p.orden}. ${p.lugar} (${p.nombre_antiguo}) · ${p.anio}`);
  nodo.append("circle").attr("r", 8.5).attr("fill", "#f3e6c8").attr("stroke", MAPA.rojo).attr("stroke-width", 1.6);
  nodo.append("text").attr("text-anchor", "middle").attr("dy", "0.35em").attr("font-family", "'IM Fell English SC', Georgia, serif")
    .attr("font-size", 10).attr("fill", MAPA.rojo).text(p => p.orden);
  nodo.append("text").attr("x", p => (ETIQUETAS[p.id] || [10, -8])[0]).attr("y", p => (ETIQUETAS[p.id] || [10, -8])[1])
    .attr("text-anchor", p => (ETIQUETAS[p.id] || [0, 0, "start"])[2])
    .attr("font-family", "'IM Fell English SC', Georgia, serif").attr("font-size", 13).attr("fill", MAPA.tinta)
    .attr("paint-order", "stroke").attr("stroke", "#efe0bd").attr("stroke-width", 3).attr("stroke-linejoin", "round")
    .text(p => p.nombre_antiguo);

  // --- cartela y leyenda
  const c = g.append("g").attr("transform", `translate(${P([-18.5, 7])})`);
  c.append("rect").attr("width", 236).attr("height", 112).attr("rx", 4).attr("fill", "#efe0bd").attr("stroke", MAPA.tinta).attr("stroke-width", 1.2);
  c.append("rect").attr("x", 4).attr("y", 4).attr("width", 228).attr("height", 104).attr("rx", 2).attr("fill", "none").attr("stroke", MAPA.rojo).attr("stroke-width", 0.6);
  c.append("text").attr("x", 118).attr("y", 26).attr("text-anchor", "middle").attr("font-family", "'IM Fell English SC', Georgia, serif")
    .attr("font-size", 17).attr("fill", MAPA.rojo).text("Itinerarium Marci Poli");
  c.append("text").attr("x", 118).attr("y", 42).attr("text-anchor", "middle").attr("font-family", "'IM Fell English', Georgia, serif")
    .attr("font-style", "italic").attr("font-size", 11).attr("fill", MAPA.tinta).text("Anno Domini MCCLXXI – MCCXCV");
  [["Iter per terram", { stroke: MAPA.rojo, "stroke-width": 2.4 }],
   ["Reditus per mare", { stroke: "#2f4f6b", "stroke-width": 2.2, "stroke-dasharray": "7 4" }],
   ["Legationes in Cataio", { stroke: MAPA.rojo, "stroke-width": 1.6, "stroke-dasharray": "1 4" }]].forEach(([t, a], i) => {
    const y = 62 + i * 16;
    const l = c.append("line").attr("x1", 18).attr("x2", 58).attr("y1", y).attr("y2", y).attr("stroke-linecap", "round");
    Object.entries(a).forEach(([k, v]) => l.attr(k, v));
    c.append("text").attr("x", 68).attr("y", y + 4).attr("font-family", "'IM Fell English', Georgia, serif").attr("font-style", "italic")
      .attr("font-size", 11.5).attr("fill", MAPA.tinta).text(t);
  });

  // --- marco doble
  svg.append("rect").attr("x", 8).attr("y", 8).attr("width", W - 16).attr("height", H - 16).attr("fill", "none").attr("stroke", MAPA.tinta).attr("stroke-width", 2);
  svg.append("rect").attr("x", 14).attr("y", 14).attr("width", W - 28).attr("height", H - 28).attr("fill", "none").attr("stroke", MAPA.tinta).attr("stroke-width", 0.7);
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
  rosa.append("text").attr("y", -r - 5).attr("text-anchor", "middle").attr("font-family", "'IM Fell English SC', Georgia, serif")
    .attr("font-size", 12).attr("fill", MAPA.rojo).text("Tramontana");
}

function barco(g, x, y) {
  const b = g.append("g").attr("transform", `translate(${x},${y})`).attr("stroke", MAPA.tinta).attr("stroke-width", 0.8);
  b.append("path").attr("d", "M-14,0 Q0,8 14,0 L10,-3 L-11,-3 Z").attr("fill", "#9b7444");
  b.append("line").attr("x1", 0).attr("y1", -3).attr("x2", 0).attr("y2", -22);
  b.append("path").attr("d", "M0,-21 Q9,-14 0,-6 Z").attr("fill", "#f3e6c8");
  b.append("path").attr("d", "M0,-22 L6,-24 L0,-26").attr("fill", MAPA.rojo).attr("stroke-width", 0.5);
  b.append("path").attr("d", "M-20,4 q3,-2 6,0 t6,0 M10,5 q3,-2 6,0 t6,0").attr("fill", "none").attr("stroke-width", 0.6).attr("opacity", 0.7);
}
