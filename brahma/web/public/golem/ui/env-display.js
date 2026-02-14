/**
 * SVG ADSR envelope polyline display
 */
export function createEnvDisplay({ a = 0.01, d = 0.2, s = 0.5, r = 0.1, color }) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.classList.add("env-display");

    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    if (color) {
        poly.style.fill = color;
        line.style.stroke = color;
    }
    svg.append(poly, line);

    function update(env) {
        const { a: atk, d: dec, s: sus, r: rel } = env;
        const total = atk + dec + rel + 0.2;
        const pts = [
            [0, 100],
            [(atk / total) * 100, 0],
            [((atk + dec) / total) * 100, (1 - sus) * 100],
            [((atk + dec + 0.2) / total) * 100, (1 - sus) * 100],
            [100, 100]
        ];
        const ptStr = pts.map(p => p.join(",")).join(" ");
        poly.setAttribute("points", `0,100 ${ptStr}`);
        line.setAttribute("points", ptStr);
    }

    update({ a, d, s, r });

    return { el: svg, update };
}
