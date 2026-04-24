d3.csv("data/WHR26_Data_Figure_2.1.csv")
    .then(function (data) {
        data.forEach((d) => {
            d.year = new Date(+d["Year"], 0, 1);
        });

        data.forEach((d) => {
            d["country"] = d["Country name"].trim();
        })
        data.forEach((d) => {
            d["life_eval"] = +d["Life evaluation (3-year average)"];
        })

        // Collecting position of country per year
        const groupedData = data.reduce((acc, d) => {
            const yearKey = d["Year"];
            if (!acc[yearKey]) {
                acc[yearKey] = [];
            }
            acc[yearKey].push(d);
            return acc;
        }, {});
        Object.keys(groupedData).forEach(year => {
            const yearGroup = groupedData[year];
            yearGroup.sort((a, b) => b.life_eval - a.life_eval);
            yearGroup.forEach((d, index) => {
                d["position"] = index + 1;
            });
        });

        const filtered = data.filter(d => d.year >= new Date(2019, 0, 1)); // begin vanaf 2019 met data
        const life_per_country = filtered.map(({ year, country, life_eval, position }) => ({ year, country, life_eval, position }));

        renderPositionPlot(life_per_country);
    })
    .catch((error) => console.error("Error loading CSV:", error));

function renderPositionPlot(data) {
    d3.select("#position_plot").html("");
    const container = d3.select("#position_plot")
        .append("div")
        .style("display", "flex")
        .style("gap", "20px")
        .style("align-items", "flex-start");

    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .domain([153,1])
        .range([height, 0]);

    const controls = container
        .append("div")
        .style("margin-right", "20px")
        .style("display", "flex")
        .style("gap", "10px")
        .attr("class", "sidebar");

    const continentControls = controls.append("div");
    const countryControls = controls.append("div");

    const svg = container
        .append("svg")
        .style("flex-shrink", 0)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    const chart = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const linesGroup = chart.append("g");

    chart.append("g")
        .attr("class", "grid")
        .selectAll("line")
        .data(xScale.ticks().slice(1))
        .join("line")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", 0)
        .attr("y2", height);

    chart.append("g")
        .attr("class", "grid")
        .selectAll("line")
        .data(yScale.ticks())
        .join("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d));

    //x- en y-as toevoegen
    chart.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale)
            .ticks(d3.timeYear.every(1))
            .tickFormat(d3.timeFormat("%Y")));

    chart.append("g")
        .call(d3.axisLeft(yScale));

    //titel maken
    chart.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .attr("y", margin.top - 44)
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Positionering van landen doorheen de tijd");

    //y-as label geven
    chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -45)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Positie");

    //maak een tooltip
    const tooltipGroup = chart.append("g")
        .attr("class", "tooltip-group")
        .style("pointer-events", "none")
        .style("display", "none");

    const tooltip = tooltipGroup.append("g")
        .attr("class", "tooltip");

    tooltip.append("rect")
        .attr("width", 120)
        .attr("height", 50);

    const tooltipText = tooltip.append("text")
        .attr("x", 5)
        .attr("y", 0);

    //zet alle data per land en maak de landen
    const grouped = d3.group(data, d => d.country);
    const countries = Array.from(grouped.keys()).sort(d3.ascending);

    //deselecteer alles knop
    countryControls.append("button")
        .text("Clear All")
        .on("click", () => {
            selectedCountries.clear();
            update();
            updateList(searchInput.property("value"));
        });

    const continents = ["Africa", "Asia", "Central America", "Europe", "Middle East", "North America", "Oceania",
        "South America"]

    continentControls.append("div")
        .style("margin-top", "10px")
        .selectAll("button")
        .data(continents)
        .enter()
        .append("button")
        .text(d => d)
        .style("display", "block")
        .style("margin-bottom", "4px")
        .on("click", (event, continent) => {

            selectedCountries = new Set(
                countries.filter(c => continentMap[c] === continent)
            );

            update();
            updateList(searchInput.property("value"));
        });

    const searchInput = countryControls.append("input")
        .attr("type", "text")
        .attr("placeholder", "Zoek land...")
        .style("display", "block")
        .style("margin-bottom", "5px");


    //maak selectie ding om landen al dan niet te selecteren
    const list = countryControls.append("div")
        .style("border", "1px solid #ccc")
        .style("height", "200px")
        .style("overflow-y", "scroll")
        .style("padding", "5px");

    let selectedCountries = new Set(["Belgium", "Afghanistan", "New Zealand", "Vietnam",
        "United States"]);

    function updateList(filterText = "") {
        const filteredCountries = countries.filter(c =>
            c.toLowerCase().includes(filterText.toLowerCase())
        );

        const items = list.selectAll(".country-item")
            .data(filteredCountries, d => d);

        const enter = items.enter()
            .append("div")
            .attr("class", "country-item")
            .style("cursor", "pointer")
            .style("padding", "2px");

        const merged = enter.merge(items);

        merged
            .text(d => d)
            .style("background", d =>
                selectedCountries.has(d) ? "#d3e5ff" : "transparent"
            )
            .on("click", function (event, d) {
                if (selectedCountries.has(d)) {
                    selectedCountries.delete(d);
                } else {
                    selectedCountries.add(d);
                }

                update();
                updateList(searchInput.property("value"));
            });

        items.exit().remove();
    }

    searchInput.on("input", function () {
        updateList(this.value);
    });

    //kleurenschaal
    const color = d3.scaleOrdinal(d3.schemeCategory10)
        .domain([...grouped.keys()]);

    //helper voor de lijn
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.position));

    function update() {

        linesGroup.selectAll("*").remove();

        grouped.forEach((values, key) => {

            if (!selectedCountries.has(key)) return;

            values.sort((a, b) => a.year - b.year);

            //lijn met hover
            linesGroup.append("path")
                .datum(values)
                .attr("fill", "none")
                .attr("stroke", color(key))
                .attr("stroke-width", 2)
                .attr("d", line)
                .style("cursor", "pointer")
                .style("opacity", "0.55")
                .on("mouseover", function (event) {
                    tooltipGroup.style("display", null);
                    tooltipGroup.raise();

                    // clear previous content
                    tooltipText.selectAll("*").remove();

                    // only country name
                    tooltipText.append("tspan")
                        .attr("x", 5)
                        .attr("y", 15)
                        .text(key);

                    // resize box
                    const bbox = tooltipText.node().getBBox();
                    tooltip.select("rect")
                        .attr("width", bbox.width + 12)
                        .attr("height", bbox.height + 10);
                })
                .on("mousemove", function (event) {
                    const [x, y] = d3.pointer(event, chart.node());
                    tooltipGroup.attr("transform", `translate(${x + 15}, ${y + 10})`);
                })
                .on("mouseout", function () {
                    tooltipGroup.style("display", "none");
                });

            //punten met hover
            linesGroup.selectAll(null)
                .data(values)
                .enter()
                .append("circle")
                .attr("cx", d => xScale(d.year))
                .attr("cy", d => yScale(d.position))
                .attr("r", 5)
                .style("cursor", "pointer")
                .style("opacity", "0.55")
                .attr("fill", color(key))
                .on("mouseover", function (event, d) {
                    tooltipGroup.style("display", null);
                    tooltipGroup.raise();
                    tooltipText.selectAll("*").remove();

                    const lines = [
                        key,
                        `Year: ${d.year.getFullYear()}`,
                        `Value: ${d.life_eval.toFixed(2)}`,
                        `Position: ${d.position}`,
                    ];

                    lines.forEach((line, i) => {
                        tooltipText.append("tspan")
                            .attr("x", 5)
                            .attr("y", 15 + i * 15)
                            .text(line);
                    });

                    const bbox = tooltipText.node().getBBox();
                    tooltip.select("rect")
                        .attr("width", bbox.width + 12)
                        .attr("height", bbox.height + 10);
                })
                .on("mousemove", function (event) {
                    const [x, y] = d3.pointer(event, chart.node());
                    tooltipGroup.attr("transform", `translate(${x + 10}, ${y + 10})`);
                })
                .on("mouseout", function () {
                    tooltipGroup.style("display", "none");
                });
            linesGroup.raise()
        });
        updateList();
        updateLegend();
    }

    const legendContainer = container
        .append("div")
        .style("margin-left", "45px")
        .style("max-height", (height + margin.bottom) + "px")   //splitst in kolommen die niet verder gaan dan
        .style("column-width", "120px")       //lengte van de grafiek
        .style("column-gap", "10px");

    function updateLegend() {
        const selected = Array.from(selectedCountries);

        const items = legendContainer.selectAll(".legend-item")
            .data(selected, d => d);

        const enter = items.enter()
            .append("div")
            .attr("class", "legend-item")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin-bottom", "5px")
            .style("break-inside", "avoid");

        enter.append("div")
            .style("width", "10px")
            .style("height", "10px")
            .style("margin-right", "5px");

        enter.append("span")
            .style("font-size", "12px");

        const merged = enter.merge(items);

        merged.select("div")
            .style("background-color", d => color(d));

        merged.select("span")
            .text(d => d);

        items.exit().remove();
    }
    update();
}