d3.csv("data/WHR26_Data_Figure_2.1.csv")
    .then(function (data) {
        data.forEach((d) => {
            d["life_eval"] = +d["Life evaluation (3-year average)"];
        });

        data.forEach((d) => {
            d["log_gdp"] = +d["Explained by: Log GDP per capita"];
        })

        const filtered = data.filter((d) => d["Year"] >= 2019);
        const life_per_gdp = filtered.map(({ life_eval, log_gdp }) => ({ life_eval, log_gdp }));

        renderScatterPlot(life_per_gdp);
    })
    .catch((error) => console.error("Error loading CSV:", error));


function renderScatterPlot(data) {
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
        .domain([0, 10])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, 2.75])
        .range([height, 0]);

    const svg= d3
        .select("#example_scatter_plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.life_eval))
        .attr("cy", d => yScale(d.log_gdp))
        .attr("r", d => 3)
        .attr("fill", d => "orange")
        .attr("fill-opacity", d => 0.5)

    svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .text("Explained by Log GDP");

    svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("text-anchor", "middle")
        .text("Life evaluation");

    svg
        .append("text")
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
