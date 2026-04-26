d3.csv("data/WHR26_Data_Figure_2.1.csv")
    .then(function (data) {
        //neem alle nodige kolommen uit de dataset
        data.forEach((d) => {
            d.year = new Date(+d["Year"], 0, 1);
        });

        data.forEach((d) => {
            d["country"] = d["Country name"].trim();
        })

        data.forEach((d) => {
            d["life_eval"] = +d["Life evaluation (3-year average)"];
        })

        const filtered = data.filter(d => d.year >= new Date(2019, 0, 1)); // begin vanaf 2019 met data
        //plaats de data vanaf 2019 in een nieuw data ding
        const life_per_country = filtered.map(({ year, country, life_eval }) => ({ year, country, life_eval }));

        renderLinePlot(life_per_country);
    })
    .catch((error) => console.error("Error loading CSV:", error));

const continentMap = {
    "Belgium": "Europe",
    "Netherlands": "Europe",
    "France": "Europe",
    "Germany": "Europe",
    "Albania": "Europe",
    "Austria": "Europe",
    "Belarus": "Europe",
    "Bosnia and Herzegovina": "Europe",
    "Bulgaria": "Europe",
    "Croatia": "Europe",
    "Czechia": "Europe",
    "Denmark": "Europe",
    "Estonia": "Europe",
    "Finland": "Europe",
    "Greece": "Europe",
    "Hungary": "Europe",
    "Iceland": "Europe",
    "Ireland": "Europe",
    "Italy": "Europe",
    "Kosovo": "Europe",
    "Latvia": "Europe",
    "Lithuania": "Europe",
    "Luxembourg": "Europe",
    "Malta": "Europe",
    "Montenegro": "Europe",
    "North Macedonia": "Europe",
    "Norway": "Europe",
    "Poland": "Europe",
    "Portugal": "Europe",
    "Moldova": "Europe",
    "Romania": "Europe",
    "Serbia": "Europe",
    "Slovakia": "Europe",
    "Slovenia": "Europe",
    "Spain": "Europe",
    "Sweden": "Europe",
    "Switzerland": "Europe",
    "Ukraine": "Europe",
    "United Kingdom": "Europe",
    "Georgia": "Europe",
    "Russia": "Europe",

    "United States": "North America",
    "Canada": "North America",
    "Cuba": "North America",
    "Dominican Republic": "North America",
    "Haiti": "North America",
    "Jamaica": "North America",
    "Mexico": "North America",

    "Brazil": "South America",
    "Argentina": "South America",
    "Bolivia": "South America",
    "Chile": "South America",
    "Colombia": "South America",
    "Ecuador": "South America",
    "Guyana": "South America",
    "Paraguay": "South America",
    "Peru": "South America",
    "Trinidad and Tobago": "South America",
    "Uruguay": "South America",
    "Venezuela": "South America",

    "China": "Asia",
    "India": "Asia",
    "Japan": "Asia",
    "Afghanistan": "Asia",
    "Bangladesh": "Asia",
    "Bhutan": "Asia",
    "Cambodia": "Asia",
    "Hong Kong": "Asia",
    "Indonesia": "Asia",
    "Kyrgyzstan": "Asia",
    "Laos": "Asia",
    "Malaysia": "Asia",
    "Maldives": "Asia",
    "Mongolia": "Asia",
    "Myanmar": "Asia",
    "Nepal": "Asia",
    "Pakistan": "Asia",
    "Philippines": "Asia",
    "South Korea": "Asia",
    "Singapore": "Asia",
    "Sri Lanka": "Asia",
    "Taiwan": "Asia",
    "Tajikistan": "Asia",
    "Thailand": "Asia",
    "Turkmenistan": "Asia",
    "Uzbekistan": "Asia",
    "Vietnam": "Asia",
    "Armenia": "Asia",
    "Azerbaijan": "Asia",
    "Kazakhstan": "Asia",

    "South Africa": "Africa",
    "Nigeria": "Africa",
    "Algeria": "Africa",
    "Benin": "Africa",
    "Botswana": "Africa",
    "Burkina Faso": "Africa",
    "Burundi": "Africa",
    "Cameroon": "Africa",
    "Central African Republic": "Africa",
    "Chad": "Africa",
    "Comoros": "Africa",
    "Congo": "Africa",
    "Côte d’Ivoire": "Africa", //negeer deze error want het werkt wel
    "DR Congo": "Africa",
    "Djibouti": "Africa",
    "Eswatini": "Africa",
    "Ethiopia": "Africa",
    "Gabon": "Africa",
    "Gambia": "Africa",
    "Ghana": "Africa",
    "Guinea": "Africa",
    "Kenya": "Africa",
    "Lesotho": "Africa",
    "Liberia": "Africa",
    "Libya": "Africa",
    "Madagascar": "Africa",
    "Malawi": "Africa",
    "Mali": "Africa",
    "Mauritania": "Africa",
    "Mauritius": "Africa",
    "Morocco": "Africa",
    "Mozambique": "Africa",
    "Namibia": "Africa",
    "Niger": "Africa",
    "Rwanda": "Africa",
    "Senegal": "Africa",
    "Sierra Leone": "Africa",
    "South Sudan": "Africa",
    "Somalia": "Africa",
    "Tanzania": "Africa",
    "Togo": "Africa",
    "Tunisia": "Africa",
    "Uganda": "Africa",
    "Zambia": "Africa",
    "Zimbabwe": "Africa",

    "Australia": "Oceania",
    "New Zealand": "Oceania",

    "Saudi Arabia": "Middle East",
    "United Arab Emirates": "Middle East",
    "Bahrain": "Middle East",
    "Cyprus": "Middle East",
    "Egypt": "Middle East",
    "Iran": "Middle East",
    "Iraq": "Middle East",
    "Israel": "Middle East",
    "Jordan": "Middle East",
    "Kuwait": "Middle East",
    "Lebanon": "Middle East",
    "Oman": "Middle East",
    "Palestine": "Middle East",
    "Yemen": "Middle East",

    "Belize": "Central America",
    "Costa Rica": "Central America",
    "Guatemala": "Central America",
    "Honduras": "Central America",
    "El Salvador": "Central America",
    "Panama": "Central America",
    "Nicaragua": "Central America"
};

function renderLinePlot(data) {
    //om te zorgen dat alles mooi naast elkaar staat
    d3.select("#line_plot_landen").html("");
    const container = d3.select("#line_plot_landen")
        .append("div")
        .style("display", "flex")
        .style("gap", "20px")
        .style("align-items", "flex-start");


    //dimensies en marges voor grafiek zetten
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    //maak de schalen en domeinen voor x en y
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .domain([0,10])
        .range([height, 0]); //omdat de y-as omgedraaid staat, moet 0 achteraan

    //voor layout selectie - grafiek - legende te krijgen
    const controls = container
        .append("div")
        .style("margin-right", "20px")
        .style("display", "flex")
        .style("gap", "10px")
        .attr("class", "sidebar");

    const continentControls = controls.append("div");
    const countryControls = controls.append("div");

    //maak het svg element voor de grafiek
    const svg = container
        .append("svg")
        .style("flex-shrink", 0)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    const chart = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const linesGroup = chart.append("g");


    //gridlines toevoegen
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
        .text("Life evaluation doorheen de tijd");

    //y-as label geven
    chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -45)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Life evaluation");

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
        .text("Clear")
        .on("click", () => {
            selectedCountries.clear();
            update();
            updateList(searchInput.property("value"));
            d3.selectAll(".continent-btn")
                .classed("continent-active", false)
                .classed("continent-inactive", true);
        });

    const continents = ["Africa", "Asia", "Central America", "Europe", "Middle East", "North America", "Oceania",
        "South America"]

    continentControls.append("div")
        .style("margin-top", "10px")
        .selectAll("button")
        .data(continents)
        .enter()
        .append("button")
        .attr("class", d =>
            d === selectedContinent
                ? "continent-btn continent-active"
                : "continent-btn continent-inactive"
        )
        .text(d => d)
        .style("display", "block")
        .style("margin-bottom", "4px")
        .on("click", function(event, continent) {

            selectedContinent = continent;

            selectedCountries = new Set(
                countries.filter(c => continentMap[c] === continent)
            );

            //reset
            d3.selectAll(".continent-btn")
                .classed("continent-active", false)
                .classed("continent-inactive", true);

            //activeer als op geklikt
            d3.select(this)
                .classed("continent-active", true)
                .classed("continent-inactive", false);

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

    //landen die al te zien zijn als je plot opent
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
        .y(d => yScale(d.life_eval));

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
                .on("mouseover", function () {
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
                .attr("cy", d => yScale(d.life_eval))
                .attr("r", 5)
                .style("cursor", "pointer")
                .attr("fill", color(key))
                .on("mouseover", function (event, d) {
                    tooltipGroup.style("display", null);
                    tooltipGroup.raise();
                    tooltipText.selectAll("*").remove();

                    const lines = [
                        key,
                        `Year: ${d.year.getFullYear()}`,
                        `Value: ${d.life_eval.toFixed(2)}`
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

    //legende maken wanneer meerdere landen geselecteerd zijn
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