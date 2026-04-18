d3.csv("data/WHR26_Data_Figure_2.1.csv")
    .then(function (data) {
        data.forEach((d) => {
            d["life_eval"] = +d["Life evaluation (3-year average)"];
            d["log_gdp"] = +d["Explained by: Log GDP per capita"];
            d["social_support"] = +d["Explained by: Social support"];
            d["healthy_life"] = +d["Explained by: Healthy life expectancy"];
            d["freedom"] = +d["Explained by: Freedom to make life choices"];
            d["generosity"] = +d["Explained by: Generosity"];
            d["corruption"] = +d["Explained by: Perceptions of corruption"];
            d["year"] = d["Year"];
            d["country"] = d["Country name"];
        });

        const filtered = data.filter((d) => d["Year"] >= 2019);
        const mapped = filtered.map(({ life_eval, log_gdp, social_support, healthy_life, freedom, generosity, corruption, year, country }) =>
            ({ life_eval, log_gdp, social_support, healthy_life, freedom, generosity, corruption, year, country })
        );

        renderPlots(mapped);
    })
    .catch((error) => console.error("Error loading CSV:", error));

function renderScatterPlot(data, yCol, selYears, color) {
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
        .domain([0, 10])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(yCol.domain)
        .range([height, 0]);

    const plot = d3.select("#scatter_plot").append("div");

    const svg = plot.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale)
            .tickSize(-height)
            .tickFormat("")
        );

    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat("")
        );

    var filtered = data.filter((d) =>  selYears.has(d.year));
    svg.selectAll("circle")
        .data(filtered)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.life_eval))
        .attr("cy", d => yScale(d[yCol.key]))
        .attr("r", 6)
        .attr("fill", d => color(d.year))
        .attr("fill-opacity", 0.6)
        .on("mouseover", (event, d) => {
            const padding = 5;
            tooltipText.text(`${d.country}; ${d.year}`);
            const bbox = tooltipText.node().getBBox();

            tooltipRect
                .attr("width", bbox.width + padding * 2)
                .attr("height", bbox.height + padding * 2);

            tooltipText
                .attr("x", padding)
                .attr("y", bbox.height + padding / 2);

            tooltip
                .attr("transform", `translate(${xScale(d.life_eval)}, ${yScale(d[yCol.key])})`)
                .style("opacity", 1);
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        });

    const tooltip = svg.append("g")
        .attr("class", "tooltip")
        .style("opacity", 0);
    const tooltipRect = tooltip.append("rect");
    const tooltipText = tooltip.append("text");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .text(`Explained by: ${yCol.label}`);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("text-anchor", "middle")
        .text("Life evaluation");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Happiness score");

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));
}


function renderPlots(mapped) {
    const yColumns = [
        { key: "log_gdp",       label: "Log GDP per capita",              domain: [0, 2.75]},
        { key: "social_support",label: "Social support",                  domain: [0, 2.75]},
        { key: "healthy_life",  label: "Healthy life expectancy",         domain: [0, 2.75]},
        { key: "freedom",       label: "Freedom to make life choices",    domain: [0, 2.75]},
        { key: "generosity",    label: "Generosity",                      domain: [0, 2.75]},
        { key: "corruption",    label: "Perceptions of corruption",       domain: [0, 2.75]},
    ];

    const container = d3.select("#scatter_plot");

    const sidebar = container.append("div")
        .attr("class", "sidebar");

    sidebar.append("div")
        .text("Y-axis")
        .style("font-weight", "bold")
        .style("font-size", "10px")
        .style("text-transform", "uppercase")
        .style("color", "#555");

    const list = sidebar.append("div")
        .style("display", "flex")
        .style("gap", "6px")
        .style("flex-wrap", "wrap")
        .style("font-size", "10px")
        .style("flex-direction", "column");

    sidebar.append("div")
        .attr("class", "separator-bar")
        .style("margin", "5px 0");


    let years = new Set(mapped.map(d => d.year));
    const allColors = d3.scaleOrdinal().domain(years)
        .range(d3.schemeObservable10);

    const yearButtons = sidebar.selectAll("button")
        .data(years)
        .enter()
        .append("button")
        .attr("class", "year-btn selected")
        .style("background-color", d => allColors(d))
        .text(d => d)
        .on("click", function (event, d) {
            event.target.classList.toggle("selected");
            event.target.classList.toggle("unselected");
            if (years.has(d)) {
                years.delete(d);
            } else {
                years.add(d);
            }
            d3.select("#scatter_plot div:has(svg)").remove();
            renderScatterPlot(mapped, selected, years, allColors);
        });

    let selected = yColumns[0];

    const items = list.selectAll("span")
        .data(yColumns)
        .enter()
        .append("span")
        .text(d => d.label)
        .style("cursor", "pointer")
        .style("font-weight", d => d === selected ? "bold" : "normal")
        .on("click", function (event, d) {
            selected = d;
            items.style("font-weight", c => c === selected ? "bold" : "normal");
            d3.select("#scatter_plot div:has(svg)").remove();
            renderScatterPlot(mapped, selected, years, allColors);
        });

    renderScatterPlot(mapped, selected, years, allColors);
}
