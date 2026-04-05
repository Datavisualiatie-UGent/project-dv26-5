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
        .fitSize([width, height], { type: "Sphere" });

    const pathGenerator = d3.geoPath().projection(projection);

    g.append("path")
        .datum({ type: "Sphere" })
        .attr("class", "background")
        .attr("d", pathGenerator)
        .attr("fill", "#EEEEEE")
        .attr("stroke", "none");

    const zoom = d3.zoom()
        .scaleExtent([1.55, 7])
        .translateExtent([[-width, -height], [width * 2, height * 2]])
        .extent([[50,0], [width, height]])
        .on("zoom", (event) => {
            if (event.transform.k <= 1.55) {
                event.transform.x = - 125;
                event.transform.y = -50;
            } else{
                const xMin = width * (1 - event.transform.k);
                const yMin = height * (1 - event.transform.k);

                event.transform.x = Math.max(xMin, Math.min(0, event.transform.x));
                event.transform.y = Math.max(yMin, Math.min(0, event.transform.y));
            }
            g.attr('transform', event.transform)
        });
    svg_base.call(zoom);

    svg_base.call(zoom.transform, d3.zoomIdentity
        .translate( width / 2, height / 2)
        .scale(1.55)
        .translate(- 125, -50 )
    );


    Promise.all([
        d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/110m.tsv'),
        d3.json('https://unpkg.com/world-atlas@1.1.4/world/50m.json')
    ]).then(([tsvData, topoJSONdata]) =>{
        const countryName = {};
        tsvData.forEach(d => {
            countryName[d.iso_n3] = d.name
        })
        const countries = topojson.feature(topoJSONdata, topoJSONdata.objects.countries);
        g.selectAll('.country').data(countries.features)
            .enter().append('path')
                .attr('class', 'country')
                .attr('d', pathGenerator)
            .append('title')
                .text(d => countryName[d.id]);
    })

}
renderWorldChart();