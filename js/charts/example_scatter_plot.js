d3.csv("data/final_depression_dataset_1.csv")
    .then(function (data) {
        data.forEach((d) => {
            d["CGPA"] = +d["CGPA"];
        });

        data.forEach((d) => {
            d["Age"] = +d["Age"];
        })

        const filtered = data.filter((d) => d["Working Professional or Student"] === "Student");
        const agePerCGPA = filtered.toArray().map((d) => {
            CGPA = d["CGPA"];
            Age = d["Age"];
            return {CGPA, Age}
        })

        renderScatterPlot(agePerCGPA);
    })
    .catch((error) => console.error("Error loading CSV:", error));


function renderScatterPlot(data) {
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const graph = d3.select(DOM.svg(width, height));

    graph.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => d.CGPA)
        .attr("cy", d => d.Age)
        // .attr("r", d => Math.sqrt(height - d.Age));

    graph.selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .text(d => d.CGPA + "," + d.Age)
        .attr("x", d => d.CGPA)
        .attr("y", d => d.Age)
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "hotpink");

}
