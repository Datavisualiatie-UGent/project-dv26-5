let dataByYear = {};
let tsvDataGlobal = [];
let idToName = {};
let currentYear = 0;
let idToCsvName = {};




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


    const colorScale = d3.scaleSequential()
        .domain([0, 10])
        .interpolator(d3.interpolateHsl("red", "green"));

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


    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");

    if (section === "map") {
        document.querySelector("#map").scrollIntoView();
    }


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
        g.selectAll(".country").transition().attr("fill", "#2c3e50");
        d3.select(this).transition().attr("fill", "red");


        g.selectAll(".map-popup").remove();

        const [p, s] = pathGenerator.centroid(geometry);

        let offsetY = 0;

        if (s > height ) {
            offsetY = -80;
        }

        const popupGroup = g.append("g")
            .datum(d)
            .attr("class", "map-popup")
            .attr("transform", `translate(${p}, ${s + offsetY}) scale(${1/scale})`);

        popupGroup.append("rect")
            .attr("x", -75)
            .attr("y", -50)
            .attr("width", 150)
            .attr("height", 60)
            .attr("fill", "white")
            .attr("stroke", "#333")
            .attr("stroke-width", 2)
            .attr("rx", 10);

        popupGroup.append("text")
            .attr("text-" +
                "anchor", "middle")
            .attr("y", -30)
            .style("font-size", "14px")
            .style("font-family", "sans-serif")
            .text(idToName[d.id]);

        popupGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -10)
            .style("font-size", "12px")
            .text(`Score: ${dataByYear[currentYear]?.[d.id] || "No Data"}`);



        const hasDataAtAll = Object.values(dataByYear).some(yearData => {
            return yearData && yearData[d.id] !== undefined && yearData[d.id] !== null;
        });

        const xStrokeWidth = 2;

        if (hasDataAtAll){

            const otherPgGroup = popupGroup.append("a")
                .attr("transform", "translate(0, 0)")
                .style("cursor", "pointer")
                .on("click", (e) => {
                    const url = new URL(window.location);
                    url.searchParams.set("country", idToCsvName[d.id]);

                    window.history.pushState({}, '', url);
                    showPage('landen');
                    reset();
                    setTimeout(() => {
                        handleCountryChange();
                    }, 0);
                });

            otherPgGroup.append("rect")

                .attr("x", -50)
                .attr("y", 0)
                .attr("width", 100)
                .attr("height", 15)
                .attr("fill", "url(#line-theme-gradient)")
                .style("filter", "url(#drop-shadow)")
                .on("mouseover", function() {
                    d3.select(this)
                        .attr("fill", "#93368D")

                    otherPgGroup
                        .transition()
                        .duration(150)
                        .attr("transform", "scale(1.05)");
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .attr("fill", "url(#line-theme-gradient)")
                        .style("filter", "url(#drop-shadow)");

                    otherPgGroup
                        .transition()
                        .duration(150)
                        .attr("transform", "scale(1)");
                });

            otherPgGroup.append("text")
                .attr("x", 0)
                .attr("y", 13)
                .attr("text-anchor", "middle")
                .attr("fill", "#E4D9E6")
                .style("font-family", "sans-serif")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .style("pointer-events", "none")
                .text("See More    →");

        }


        const closeBtnGroup = popupGroup.append("g")
            .attr("transform", "translate(62, -40)")
            .style("cursor", "pointer")
            .on("click", (e) => {
                e.stopPropagation();

                popupGroup.remove();
                reset();
            });
        closeBtnGroup.append("rect")
            .attr("x", -10)
            .attr("y", -10)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "transparent")
            .style("pointer-events", "all");


        closeBtnGroup.append("line")
            .attr("x1", -6).attr("y1", -6)
            .attr("x2", 6).attr("y2", 6)
            .attr("stroke", "#e74c3c")
            .attr("stroke-width", xStrokeWidth)
            .attr("stroke-linecap", "round");

        closeBtnGroup.append("line")
            .attr("x1", -6).attr("y1", 6)
            .attr("x2", 6).attr("y2", -6)
            .attr("stroke", "#e74c3c")
            .attr("stroke-width", xStrokeWidth)
            .attr("stroke-linecap", "round");
    }



    function reset(){
        g.selectAll(".map-popup").remove();
        g.selectAll(".country").transition().attr("fill", d => {
            const score = dataByYear[currentYear][d.id];

            return score ? colorScale(+score) : "#ffffff";
        });

        svg_base.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
    }


    const nameAliases = {
        "czechia": "czech rep.",
        "south korea": "korea",
        "côte d’ivoire": "côte d'ivoire",
        "central african republic": "central african rep.",
        "congo (brazzaville)": "congo",
        "dr congo": "dem. rep. congo",
        "bosnia and herzegovina": "bosnia and herz.",
        "dominican republic": "dominican rep.",
        "north macedonia": "macedonia",
        "south sudan": "s. sudan",
        "laos": "lao pdr",
        "north cyprus": "n. cyprus"
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
        currentYear = maxYear

        d3.select("#year_slider")
            .attr("min", minYear)
            .attr("max", maxYear)
            .attr("value", maxYear)
            .attr("step", 1);

        d3.select("#year_label").text(maxYear);

        updateMap(currentYear);

        const nameToId = {};
        tsvData.forEach(d => {
            nameToId[d.name.toLowerCase().trim()] = d.iso_n3;
            idToName[d.iso_n3] = d.name;
        });




        csvData.forEach(d => {
            let rawName = d["Country name"];
            let year = d["Year"];

            if (year < minYear || year > maxYear) return;


            if (rawName) {
                let cleanName = rawName.toLowerCase().trim();

                if (nameAliases[cleanName]) {
                    cleanName = nameAliases[cleanName];
                }

                const id = nameToId[cleanName];

                if (id) {
                    idToCsvName[id] = rawName;

                    if (!dataByYear[year]) dataByYear[year] = {};
                    dataByYear[year][id] = +d["Life evaluation (3-year average)"];
                }
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
        currentYear = selectedYear

        d3.select("#year_label").text(selectedYear);
        const currentYearData = dataByYear[selectedYear] || {};

        const countries = g.selectAll('.country');
        countries.transition()
            .duration(200)
            .attr('fill', d => {
                const val = currentYearData[d.id];
                return val ? colorScale(+val) : "#ffffff";
            });

        countries.select("title")
            .text(d => {
                const name = idToName[d.id] || "Unknown Country";
                const val = currentYearData[d.id] ? currentYearData[d.id].toFixed(2) : "No Data";
                return `${name}\nScore: ${val}`;
            });
        g.selectAll(".map-popup text").each(function() {
            const popup = d3.select(this);
            if (popup.text().includes("Score:")) {
                const d = d3.select(this.parentNode).datum();
                const newVal = currentYearData[d.id] ? currentYearData[d.id].toFixed(2) : "No Data";
                popup.text(`Score: ${newVal}`);
            }
        });
    }

    d3.select("#year_slider").on("input", function() {
        updateMap(this.value);
    });


    function getTooltipText(d) {
        const name = idToName[d.id] || "Unknown";
        return `${name}`;
    }








    //Colors

    const defs = svg_base.append("defs");

    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient");

    linearGradient.selectAll("stop")
        .data(d3.range(0, 10, 0.1))
        .enter()
        .append("stop")
        .attr("offset", d => `${d*100 }%`)
        .attr("stop-color", d => colorScale(d*10));

    const themeGradient = defs.append("linearGradient")
        .attr("id", "line-theme-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

    themeGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#93368D");

    themeGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#4A8CA3");

    const glow = defs.append("filter")
        .attr("id", "drop-shadow-hover")
        .attr("height", "130%");

    glow.append("feDropShadow")
        .attr("dx", 0)
        .attr("dy", 2)
        .attr("stdDeviation", 3)
        .attr("flood-color", "#93368D")
        .attr("flood-opacity", 0.5);


    // Legend




    const legend = svg_base.append("g")
        .attr("transform", "translate(10, 370)");

    const legendScale = d3.scaleLinear()
        .domain([0, 10])
        .range([0, 200]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(6);

    legend.append("g")
        .attr("transform", "translate(0, 10)")
        .call(legendAxis);
    legend.append("rect")
        .attr("width", 200)
        .attr("height", 10)
        .style("fill", "url(#legend-gradient)");




    //Schadow

    const filter = defs.append("filter")
        .attr("id", "drop-shadow")
        .attr("height", "130%");

    filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 3) // Softness of shadow
        .attr("result", "blur");

    filter.append("feOffset")
        .attr("in", "blur")
        .attr("dx", 2) // Horizontal shift
        .attr("dy", 2) // Vertical shift
        .attr("result", "offsetBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
}
renderWorldChart();