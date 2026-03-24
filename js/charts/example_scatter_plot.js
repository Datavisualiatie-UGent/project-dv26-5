d3.csv("data/final_depression_dataset_1.csv")
    .then(function (data) {
        data.forEach((d) => {
            d["CGPA"] = +d["CGPA"];
        });

        data.forEach((d) => {
            d["Age"] = +d["Age"];
        })

        const filtered = data.filter((d) => d["Working Professional or Student"] === "Student");
        const agePerCGPA = filtered.map(({ CGPA, Age, Gender }) => ({ CGPA, Age, Gender }));

        renderScatterPlot(agePerCGPA);
    })
    .catch((error) => console.error("Error loading CSV:", error));


function renderScatterPlot(data) {
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
        .domain([5, 10])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([18, 35])
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
        .attr("cx", d => xScale(d.CGPA))
        .attr("cy", d => yScale(d.Age))
        .attr("r", d => 3)
        .attr("fill", (d) => (d.Gender === "Male" ? "#4a90d9" : "#e87d9b"));

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

}
