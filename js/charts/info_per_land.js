let selectedCountry = null;
let latestDataGlobal = [];
let allCountries = [];
let fullDataGlobal = [];

d3.csv("data/WHR26_Data_Figure_2.1.csv")
    .then(function(data) {
        data.forEach(d => {
            d.country = d["Country name"].trim();
            d.year = +d["Year"];
            d.life_eval = +d["Life evaluation (3-year average)"];
            d.social_support = +d["Social support"];
            d.gdp = +d["Log GDP per capita"];
            d.health = +d["Healthy life expectancy at birth"];
            d.freedom = +d["Freedom to make life choices"];
            d.generosity = +d["Generosity"];
            d.corruption = +d["Perceptions of corruption"];
        });

        fullDataGlobal = data;
        //alle landen voor de zoekbalk
        allCountries = Array.from(new Set(data.map(d => d.country))).sort();

        //meest recente jaar om weer te geven
        const latestYear = d3.max(data, d => d.year);
        latestDataGlobal = data.filter(d => d.year === latestYear);

        //zorgen dat er nog geen land opstaat als je pagina opent
        d3.select("#country_name").text("Selecteer een land");
        d3.select("#country_score").text("");
        d3.select("average").text("");
        d3.select("#country_table tbody").selectAll("tr").remove();

    })
    .catch((error) => console.error("Error loading CSV:", error));


//update de informatie
function updateCountryPanel(data, country) {
    const d = data.find(c => c.country === country);
    if (!d) {
        d3.select("#country_name").text("Geen data gevonden voor " + countryName);
        return;
    }

    d3.select("#country_name").text(d.country);
    d3.select("#country_score").text("Laatste Life Evaluation: " + d.life_eval.toFixed(3));
    const avgscore = calculateAverageLifeEval(countryName);
    d3.select("#average").text("Gemiddelde life evaluation: ") + (avgScore ? avgScore.toFixed(3) : "-");

    const tableData = [
        { factor: "Social support", value: d.social_support },
        { factor: "GDP per capita", value: d.gdp },
        { factor: "Healthy life expectancy", value: d.health },
        { factor: "Freedom", value: d.freedom },
        { factor: "Generosity", value: d.generosity },
        { factor: "Corruption", value: d.corruption }
    ];

    const rows = d3.select("#country_table tbody")
        .selectAll("tr")
        .data(tableData, d => d.factor);

    const enterRows = rows.enter().append("tr");

    enterRows.merge(rows)
        .html(d => `
            <td>${d.factor}</td>
            <td>${formatValue(d.factor, d.value)}</td>
        `);
    rows.exit().remove();
}

//update als je een nieuw land selecteert
function selectCountry(country) {
    selectedCountry = country;
    //tabel invullen
    updateCountryPanel(latestDataGlobal, selectedCountry);
    //lijn plot geven (via andere functie)
    if (typeof drawLinePlot === "function") {
        renderLinePlot(selectedCountry);
    }
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
function calculateAverageLifeEval(countryName) {
    //enkel dat land nemen
    const countryData = fullDataGlobal.filter(d => d.country.toLowerCase() === countryName.toLowerCase());

    //kijken of er wel data is
    if (countryData.length === 0) {
        console.warn(`No data found for country: ${countryName}`);
        return null;
    }
    const totalScore = countryData.reduce((sum, d) => sum + d.life_eval, 0);
    return totalScore / countryData.length;
}


//helpt
function formatValue(factor, v) {
    // Check if value is truly missing
    if (v === null || v === undefined || isNaN(v) || v === 0) return "-";

    if (factor === "Healthy life expectancy") {
        return v.toFixed(1) + " jaar";
    }

    // Most factors in WHR are 0.0 to 1.0 (percentages)
    // GDP is usually a log value (around 7.0 - 11.0)
    if (v < 2 && v > -1) {
        return (v * 100).toFixed(1) + "%";
    }

    return v.toFixed(2);
}