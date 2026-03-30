d3.csv("data/WHR26_Data_Figure_2.1.csv")
    .then(function (data) {
        data.forEach((d) => {
            d["Academic Pressure"] = +d["Academic Pressure"];
        });

        const genders = ["Male", "Female"];
        const averages = genders.map((gender) => {
            const filtered = data.filter((d) => d["Gender"] === gender);
            const avg =
                filtered.reduce((sum, d) => sum + d["Academic Pressure"], 0) /
                filtered.length;
            return { gender, avg };
        });

        renderBarChart(averages);
    })
    .catch((error) => console.error("Error loading CSV:", error));


function renderBarChart(data) {
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
        .select("#example_bar_chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3
        .scaleBand()
        .domain(data.map((d) => d.gender))
        .range([0, width])
        .padding(0.4);

    const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.avg) * 1.2])
        .range([height, 0]);

    svg
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    svg.append("g").call(d3.axisLeft(y).ticks(5));

    svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .text("Average Academic Pressure");

    svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Average Academic Pressure by Gender");

    svg
        .selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.gender))
        .attr("y", (d) => y(d.avg))
        .attr("width", x.bandwidth())
        .attr("height", (d) => height - y(d.avg))
        .attr("fill", (d) => (d.gender === "Male" ? "#4a90d9" : "#e87d9b"));

    svg
        .selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", (d) => x(d.gender) + x.bandwidth() / 2)
        .attr("y", (d) => y(d.avg) - 8)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text((d) => d.avg.toFixed(2));
}
