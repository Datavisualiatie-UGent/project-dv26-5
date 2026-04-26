let selectedCountry = null;
let latestDataGlobal = [];
let allCountries = [];
let fullDataGlobal = [];
let selectedYear = 2025; //standaard als pagina opent

d3.csv("data/WHR26_Data_Figure_2.1.csv")
    .then(function(data) {
        data.forEach(d => {
            d.year = +d["Year"];
            d.rank = +d["Rank"];
            d.country = d["Country name"].trim();
            d.life_eval = +d["Life evaluation (3-year average)"];
            d.gdp = +d["Explained by: Log GDP per capita"];
            d.social_support = +d["Explained by: Social support"];
            d.health = +d["Explained by: Healthy life expectancy"];
            d.freedom = +d["Explained by: Freedom to make life choices"];
            d.generosity = +d["Explained by: Generosity"];
            d.corruption = +d["Explained by: Perceptions of corruption"];
        });
        //geselecteerde data op de nodige jaartallen
        fullDataGlobal = data.filter(d => d.year >= 2019 && d.year <= 2025);
        //alle landen voor de zoekbalk
        allCountries = Array.from(new Set(fullDataGlobal.map(d => d.country))).sort();

        //meest recente jaar om weer te geven
        const latestYear = d3.max(fullDataGlobal, d => d.year);
        latestDataGlobal = fullDataGlobal.filter(d => d.year === latestYear);

        updateCountryPanel(latestDataGlobal, selectedCountry)

    })
    .catch((error) => console.error("Error loading CSV:", error));



//update de informatie
function updateCountryPanel(latestDataGlobal, country, d) {
    if (!country) return;

    //vind de data voor dit land in het laatste jaar
    const l = latestDataGlobal.find(c => c.country === country);

    //bereken alle nodige dingen voor de gemiddelde score + samenvatting tabel
    const avgscore = calculateAverageLifeEval(country);
    const hoogste = getHoogste(country);
    const laagste = getLaagste(country);
    const avgpos = calculateAveragePos(country);
    const sterksteStijg = calculateSterksteStijg(country);
    const sterksteDaal = calculateSterksteDaal(country);

    //naam van het land
    d3.select("#country_name").text(country);

    //geeft de gemiddelde score weer
    const avgText = (avgscore !== null && !isNaN(avgscore))
        ? `Gemiddelde life evaluation: ${avgscore.toFixed(3)} (op 10)`
        : "Gemiddelde life evaluation: -";
    d3.select("#average").text(avgText);

    //SAMENVATTING TABEL
    const headers = ["Huidige", "Hoogste", "Laagste", "Gemiddelde", "Sterkste stijging",
        "Sterkste daling"];

    //huidige rank wordt enkel weergegeven als deze bestaat, anders -
    const huidigeRank = (l && l.rank != null && !isNaN(l.rank)) ? l.rank : "-";
    const sterksteStijgT = (sterksteStijg != null && !isNaN(sterksteStijg)) ? sterksteStijg : "-";
    const sterksteDaalT = (sterksteDaal != null && !isNaN(sterksteDaal)) ? sterksteDaal : "-";

    //ook hier wordt enkel de waarde weergegeven als deze bestaat
    const values = [huidigeRank, laagste, hoogste, avgpos, sterksteStijgT, sterksteDaalT];

    const samenvatting = d3.select("#samenvatting");
    samenvatting.html("");

    samenvatting.append("caption").text("Happiness ranking");

    samenvatting.append("thead").append("tr")
        .selectAll("th").data(headers).enter()
        .append("th").text(h => h);

    samenvatting.append("tbody").append("tr")
        .selectAll("td").data(values).enter()
        .append("td").text(v => v);

    drawPieChart(d);
    drawLinePlot(country);
}

//update als je een nieuw land selecteert
function selectCountry(country) {
    selectedCountry = country;
    d3.select("#country_list").html("");
    createYearButtons();
    updateCountryPanelByYear(selectedCountry, selectedYear);
}

function createYearButtons() {
    const years = d3.range(2019, 2026);

    const container = d3.select("#year_buttons");
    container.html("");

    container.selectAll("button")
        .data(years)
        .enter()
        .append("button")
        .attr("class", d =>
            d === selectedYear ? "year-btn-land year-btn-active"
                : "year-btn-land year-btn-inactive"
        )
        .text(d => d)
        .on("click", function(event, year) {
            selectedYear = year;

            //reset de knoppen
            d3.selectAll(".year-btn-land")
                .classed("year-btn-active", false)
                .classed("year-btn-inactive", true);

            //activeer degene waarop geklikt is
            d3.select(this)
                .classed("year-btn-active", true)
                .classed("year-btn-inactive", false);

            if (selectedCountry) {
                updateCountryPanelByYear(selectedCountry, selectedYear);
            }
        });
}

function updateCountryPanelByYear(country, year) {
    const yearData = fullDataGlobal.filter(d => d.year === year);
    const d = yearData.find(c => c.country === country);
    updateCountryPanel(yearData, country, d, year); // keep table logic
}

//dit is de clear button
d3.select("#clear_btn").on("click", () => {
    selectedCountry = null;

    d3.select("#country_name").text("");
    d3.select("#average").text("");

    d3.select("#samenvatting").html("");
    d3.select("#overzicht").html("");
    d3.select("#lijnplot").html("");
    d3.select("#year_buttons").html("");
});

function drawLinePlot(country){
    d3.select("#lijnplot").html("");
    const data = fullDataGlobal
        .filter(d => d.country === country)
        .map(d => ({
            ...d,
            date: new Date(d.year, 0, 1)
        }))
        .sort((a,b) => a.year - b.year);

    //dimensies en marges voor grafiek zetten
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#lijnplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    //maak de schalen en domeinen voor x en y
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .domain([0,10])
        .range([height, 0]);

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

    const linesGroup = chart.append("g");
    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.life_eval));

    linesGroup.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "purple")
        .attr("stroke-width", 2)
        .attr("d", line)

    //punten met hover
    linesGroup.selectAll(null)
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.date))
        .attr("cy", d => yScale(d.life_eval))
        .attr("r", 5)
        .style("cursor", "pointer")
        .attr("fill", "#93368D")
        .on("mouseover", function (event, d) {
            tooltipGroup.style("display", null);
            tooltipGroup.raise();
            tooltipText.selectAll("*").remove();

            const lines = [
                country,
                `Year: ${d.year}`,
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

}

//zoek lijst
function updateCountryList(filterText = "") {
    const listContainer = d3.select("#country_list");
    if (filterText.trim() === "") {
        listContainer.selectAll(".country-item").remove();
        return;
    }
    const filtered = allCountries.filter(c =>
        c.toLowerCase().includes(filterText.toLowerCase())
    );

    const items = listContainer.selectAll(".country-item")
        .data(filtered, d => d);

    const enter = items.enter()
        .append("div")
        .attr("class", "country-item")
        .style("padding", "8px")
        .style("cursor", "pointer")
        .style("background", "white")
        .style("border-bottom", "1px solid #eee");

    enter.merge(items)
        .text(d => d)
        .on("click", function(event, d) {
            selectCountry(d);
            d3.select("#search_country").property("value", "");
            updateCountryList("");
        });
    items.exit().remove();
}

d3.select("#search_country")
    .on("input", function() {
        updateCountryList(this.value);
    })
    .on("keydown", function(event) {
        if (event.key === "Enter") {
            const typed = this.value;
            const match = allCountries.find(c => c.toLowerCase() === typed.toLowerCase());
            const fallback = allCountries.find(c => c.toLowerCase().includes(typed.toLowerCase()));
            const selected = match || fallback;

            if (selected) {
                selectCountry(selected);
                this.value = "";
                updateCountryList("");
            }
        }
    });


//bereken de gemiddelde life evaluation
function calculateAverageLifeEval(country) {
    //enkel dat land nemen
    const countryData = fullDataGlobal.filter(d => d.country === country);

    //kijken of er wel data is
    if (countryData.length === 0) {
        console.warn(`Geen data gevonden voor: ${country}`);
        return null;
    }
    const totalScore = countryData.reduce((sum, d) => sum + d.life_eval, 0);
    return totalScore / countryData.length;
}

//bereken de hoogste rank (dit geeft eigenlijk laagste)
function getHoogste(country){
    //enkel dat land nemen
    const countryData = fullDataGlobal.filter(d => d.country === country);

    //kijken of er wel data is
    if (countryData.length === 0) {
        console.warn(`Geen data gevonden voor: ${country}`);
        return null;
    }
    return Math.max(...countryData.map(d => +d.rank));
}

//bereken de laagste rank (dit geeft eigenlijk hoogste)
function getLaagste(country){
    //enkel dat land nemen
    const countryData = fullDataGlobal.filter(d => d.country === country);

    //kijken of er wel data is
    if (countryData.length === 0) {
        console.warn(`Geen data gevonden voor: ${country}`);
        return null;
    }
    return Math.min(...countryData.map(d => +d.rank));
}

//bereken de gemiddelde rank
function calculateAveragePos(country) {
    //enkel dat land nemen
    const countryData = fullDataGlobal.filter(d => d.country === country);

    //kijken of er wel data is
    if (countryData.length === 0) {
        console.warn(`Geen data gevonden voor: ${country}`);
        return null;
    }
    const totalPos = countryData.reduce((sum, d) => sum + (+d.rank || 0), 0);
    return Math.round(totalPos / countryData.length);
}

//bereken de sterkste stijging in rank
function calculateSterksteStijg(country){
    const countryData = getCountryData(country)

    let maxDiff = -Infinity;
    let year = null;

    for (let i = 1; i < countryData.length; i++) {
        const diff = countryData[i].life_eval - countryData[i-1].life_eval;
        if (diff > maxDiff) {
            maxDiff = diff;
            year = countryData[i].year;
        }
    }
    return year;
}

//bereken sterkste daling in rank
function calculateSterksteDaal(country){
    const countryData = getCountryData(country)

    let minDiff = Infinity;
    let year = null;

    for (let i = 1; i < countryData.length; i++) {
        const diff = countryData[i].life_eval - countryData[i-1].life_eval;
        if (diff < minDiff) {
            minDiff = diff;
            year = countryData[i].year;
        }
    }
    return year;
}

//hulpfunctie om snel de data van een land op te halen
function getCountryData(country) {
    return fullDataGlobal
        .filter(d => d.country === country)
        .sort((a,b) => a.year - b.year);
}

function drawPieChart(d) {
    const width = 400;
    const height = 250;
    const radius = Math.min(width, height) / 2 - 20;

    d3.select("#overzicht").html("");

    if (d) {
        const overzichtData = [
            {v: "Social support", w: d.social_support},
            {v: "GDP per capita", w: d.gdp},
            {v: "Healthy life expectation", w: d.health},
            {v: "Freedom", w: d.freedom},
            {v: "Generosity", w: d.generosity},
            {v: "Perceived corruption", w: d.corruption}
        ];

        const svg = d3.select("#overzicht")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const g = svg.append("g")
            .attr("transform", "translate(" + width / 3 + "," + height / 2 + ")");

        const colorDomain = overzichtData.map(item => item.v);
        color = d3.scaleOrdinal(d3.schemeCategory10).domain(colorDomain);

        var pie = d3.pie().value((d) => d.w);
        var data_ready = pie(overzichtData);

        let pathElements = g.selectAll("path")
            .data(data_ready, (d) => d.data.v);

        let paths = pathElements.enter()
            .append('path')
            .merge(pathElements);

        paths
            .attr('d', d3.arc()
                .innerRadius(2)
                .outerRadius(radius)
            )
            .attr('fill', (d) => color(d.data.v))
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .style("opacity", 1);

        pathElements.exit().remove();

        const legendContainer = svg.append("g")
            .attr("transform", `translate(${width / 2 + 50}, 40)`);

        const legendSpacing = 20;
        const itemWidth = 15;
        const itemHeight = 15;
        let currentY = 0;

        overzichtData.forEach(item => {
            const variableName = item.v;
            const colorValue = color(variableName);

            legendContainer.append("rect")
                .attr("width", itemWidth)
                .attr("height", itemHeight)
                .attr("fill", colorValue)
                .attr("x", itemWidth - 10)
                .attr("y", currentY + 5)
                .style("vertical-align", "middle");

            legendContainer.append("text")
                .attr("x", itemWidth + legendSpacing / 2)
                .attr("y", currentY + itemHeight / 2 + 5)
                .attr("alignment-baseline", "middle")
                .style("font-size", "12px")
                .text(variableName);

            currentY += legendSpacing;
        });

    } else {
        d3.select("#overzicht").append("p")
            .style("text-align", "center")
            .text("Geen gedetailleerde data beschikbaar voor dit jaar.");
    }
}
