function renderWorldChart(){
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;


    const svg = d3
        .select("#world_chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    const projection = d3.geoNaturalEarth1()
        .fitSize([width, height], { type: 'Sphere' });

    const pathGenerator = d3.geoPath().projection(projection);


    const g = svg.append('g')

    // Use d.name for title
    // Use d.iso_n3 for id
    g.append('path')
        .attr('class', 'sphere')
        .attr('d', pathGenerator({type: 'Sphere'}));

    svg.call(
        d3.zoom().on("zoom", (event) => {
            g.attr('transform', event.transform);
        }))


    Promise.all([
        d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/110m.tsv'),
        d3.json('https://unpkg.com/world-atlas@1.1.4/world/110m.json')
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