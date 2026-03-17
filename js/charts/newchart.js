d3.csv("data/dsd.csv")
    .then(function (data) {
        // Convert Academic Pressure to number
        data.forEach((d) => {
            d["Academic Pressure"] = +d["Academic Pressure"];
        });

        // Group by Gender and calculate averages
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
    // Dimensions
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
        .select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale
    const x = d3
        .scaleBand()
        .domain(data.map((d) => d.gender))
        .range([0, width])
        .padding(0.4);

    // Y scale — start from 0, end slightly above max value
    const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.avg) * 1.2])
        .range([height, 0]);

    // X axis
    svg
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // Y axis
    svg.append("g").call(d3.axisLeft(y).ticks(5));

    // Y axis label
    svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .text("Average Academic Pressure");

    // Title
    svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Average Academic Pressure by Gender");

    // Bars
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

    // Value labels on top of bars
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