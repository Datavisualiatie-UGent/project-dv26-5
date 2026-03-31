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

function renderLinePlot(data) {
    //dimensies en marges voor grafiek zetten
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    //maak de schalen en domeinen voor x en y
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .domain([0,8])
        .range([height, 0]); //omdat de y-as omgedraaid staat, moet 0 achteraan

    //maak het svg element voor de grafiek
    const svg = d3
        .select("#line_plot_eva")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const linesGroup = svg.append("g");

    //x- en y-as toevoegen
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale)
            .ticks(d3.timeYear.every(1))
            .tickFormat(d3.timeFormat("%Y")));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    //gridlines toevoegen
    svg.selectAll("xGrid")
        .data(xScale.ticks().slice(1))
        .join("line")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", 0.5);
    svg.selectAll("yGrid")
        .data(yScale.ticks())
        .join("line")
        .attr("x1",0)
        .attr("x2", width)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d))
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", 0.5);

    //titel maken
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", margin.left)
        .attr("y", margin.top - 44)
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Life evaluation doorheen de tijd");

    //y-as label geven
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -45)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Life evaluation");

    //maak een tooltip
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("display", "none");

    //zet alle data per land en maak de landen
    const grouped = d3.group(data, d => d.country);
    const countries = Array.from(grouped.keys()).sort(d3.ascending);

    //maak selectie ding om landen al dan niet te selecteren
    const select = d3.select("#line_plot_eva")
        .append("select")
        .attr("multiple", true);

    select.selectAll("option")
        .data(["ALL", ...countries])
        .enter()
        .append("option")
        .text(d => d)
        .property("selected", true);

    let selectedCountries = new Set(countries);

    select.on("change", function () {

        const selected = Array.from(this.selectedOptions).map(d => d.value);

        if (selected.includes("ALL")) {
            selectedCountries = new Set(countries);

            // reselect everything visually
            select.selectAll("option").property("selected", true);
        } else {
            selectedCountries = new Set(selected);
        }

        update();
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
                .on("mouseover", function (event) {
                    tooltip.style("display", "block")
                        .html(`<strong>${key}</strong>`);
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY + 10) + "px");
                })
                .on("mouseout", function () {
                    tooltip.style("display", "none");
                });

            //punten met hover
            linesGroup.selectAll(`.dot-${key}`)
                .data(values)
                .enter()
                .append("circle")
                .attr("cx", d => xScale(d.year))
                .attr("cy", d => yScale(d.life_eval))
                .attr("r", 4)
                .attr("fill", color(key))
                .on("mouseover", function (event, d) {
                    tooltip.style("display", "block")
                        .html(`
                            <strong>${key}</strong><br>
                            Year: ${d.year.getFullYear()}<br>
                            Value: ${d.life_eval.toFixed(2)}
                        `);
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY + 10) + "px");
                })
                .on("mouseout", function () {
                    tooltip.style("display", "none");
                });
        });
    }

    update();

    //maak lijn en bolletjes per land
    // grouped.forEach((values, key) => {
        //sorteren
       // values.sort((a, b) => a.year - b.year);
        //maak een lijne
       // svg.append("path")
          //  .datum(values)
           // .attr("fill", "none")
            //.attr("stroke", color(key))
            ///.attr("stroke-width", 1.5)
            //.attr("d", line);
        //voeg bolletjes toe voor elke life evaluation
        //svg.selectAll(`.dot-${key}`)
         //   .data(values)
          //  .enter()
           // .append("circle")
           // .attr("cx", d => xScale(d.year))
           // .attr("cy", d => yScale(d.life_eval))
           // .attr("r", 3)
           // .attr("fill", color(key));
   // });
}