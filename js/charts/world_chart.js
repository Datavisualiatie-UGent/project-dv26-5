let dataByYear = {};
let tsvDataGlobal = [];
let idToName = {};




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




    function clicked(event, d) {
        let geometry = d.geometry;

        if (geometry.type === "MultiPolygon") {
            const mainland = geometry.coordinates.reduce((a, b) => {
                return pathGenerator.area({ type: "Polygon", coordinates: a }) >
                pathGenerator.area({ type: "Polygon", coordinates: b }) ? a : b;
            });

            geometry = { type: "Polygon", coordinates: mainland };
        }

        const [[x0, y0], [x1, y1]] = pathGenerator.bounds(geometry);

        event.stopPropagation();

        const dx = x1 - x0;
        const dy = y1 - y0;
        const x = (x0 + x1) / 2;
        const y = (y0 + y1) / 2;

        let scale = Math.max(1, Math.min(8, 0.8 / Math.max(dx / width, dy / height)));
        let translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg_base.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
                .translate(translate[0], translate[1])
                .scale(scale)
        );
        g.selectAll(".country").transition().style("fill", "#2c3e50");
        d3.select(this).transition().style("fill", "red");
    }


    d3.select("#reset_button").on("click", () => {
        g.selectAll(".country").transition().style("fill", "#2c3e50");

        svg_base.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
    });


    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, 10]);

    const nameAliases = {
        "united states": "united states of america",
        "us": "united states of america",
        "south korea": "korea",
        "Côte d'Ivoire": "Côte d'Ivoire",
        "central african republic": "central african rep.",
        "congo (brazzaville)": "congo",
        "DR Congo": "dem. rep. congo"
    };

    Promise.all([
        d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/110m.tsv'),
        d3.json('https://unpkg.com/world-atlas@1.1.4/world/50m.json'),
        d3.csv('data/WHR26_Data_Figure_2.1.csv')
    ]).then(([tsvData, topoJSONdata, csvData]) => {

        tsvDataGlobal = tsvData;

        const years = csvData.map(d => +d["Year"]).filter(d => !isNaN(d));
        const minYear = 2019;
        const maxYear = d3.max(years);

        const slider = d3.select("#year_slider")
            .attr("min", minYear)
            .attr("max", maxYear)
            .attr("value", maxYear)
            .attr("step", 1);

        d3.select("#year_label").text(maxYear);

        updateMap(maxYear);

        const nameToId = {};
        tsvData.forEach(d => {
            nameToId[d.name.toLowerCase().trim()] = d.iso_n3;
            idToName[d.iso_n3] = d.name;
        });

        csvData.forEach(d => {
            let rawName = d["Country name"];
            if (!rawName) return;
            if (rawName.includes("Ivoire")) {
                console.log("Found Ivory Coast in CSV! Target ID:", nameToId["Côte d'Ivoire"]);
            }
            let name = rawName.toLowerCase().trim();

            if (/cote d'ivoire/i.test(name) || /ivory coast/i.test(name)) {
                name = "cote d'ivoire";
            }

            const year = d["Year"];
            const id = nameToId[ name];

            if (id) {
                if (!dataByYear[year]) dataByYear[year] = {};
                dataByYear[year][id] = +d["Life evaluation (3-year average)"];
            }
        });


        const countries = topojson.feature(topoJSONdata, topoJSONdata.objects.countries);

        const countryPaths = g.selectAll('.country')
            .data(countries.features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', pathGenerator)
            .attr('fill', d => {
                const score = dataByYear[maxYear][d.id];

                return score ? colorScale(+score) : "#ffffff";
            })
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 0.5)
            .style("cursor", "pointer")
            .on("click", clicked);
        countryPaths.append("title")
            .text(d => getTooltipText(d, maxYear))

    }).catch(err => console.error("Error loading data:", err));

    function updateMap(selectedYear) {
        d3.select("#year_label").text(selectedYear);
        const currentYearData = dataByYear[selectedYear] || {};

        const countries = g.selectAll('.country');

        countries.transition()
            .duration(200)
            .attr('fill', d => {
                const val = currentYearData[d.id];
                return val ? d3.interpolateBlues(val / 10) : "#cccccc";
            });

        countries.select("title")
            .text(d => {
                const name = idToName[d.id] || "Unknown Country";
                return `${name}`;
            });
    }

    d3.select("#year_slider").on("input", function() {
        updateMap(this.value);
    });


    function getTooltipText(d) {
        const name = idToName[d.id] || "Unknown";
        return `${name}`;
    }



    //chloropleth Code


}
renderWorldChart();