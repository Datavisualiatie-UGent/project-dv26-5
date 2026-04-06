function renderWorldChart(){
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg_base = d3.select("#world_chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    svg_base.append("rect")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("fill", "#EEEEEE");

    const main_container = svg_base.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const g = main_container.append("g");
    const projection = d3.geoMercator()
        .scale(80)
        .translate([width / 2 -15, height / 1.5]);

    const pathGenerator = d3.geoPath().projection(projection);
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[-30, -20], [width + 100, height + 100]])
        .on("zoom", (event) => {
            const { transform } = event;
            if (transform.k <= 1) {
                g.attr("transform", "translate(0,0) scale(1)");
            } else {
                g.attr("transform", transform);
            }
            g.selectAll('.country').style("stroke-width", 0.5 / transform.k);
        });

    svg_base.call(zoom);

    Promise.all([
        d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/110m.tsv'),
        d3.json('https://unpkg.com/world-atlas@1.1.4/world/50m.json')
    ]).then(([tsvData, topoJSONdata]) => {

        const countryName = {};
        tsvData.forEach(d => {
            countryName[d.iso_n3] = d.name;
        });

        const countries = topojson.feature(topoJSONdata, topoJSONdata.objects.countries);

        g.selectAll('.country')
            .data(countries.features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', pathGenerator)
            .attr('fill', '#2c3e50')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 0.5)
            .append('title')
            .text(d => countryName[d.id] || "Unknown");

        console.log("Map successfully rendered.");
    }).catch(err => console.error("Loading error:", err));

}
renderWorldChart();