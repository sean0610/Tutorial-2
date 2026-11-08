var globalData = [];
d3.csv("ExampleData.csv", function(data) {
    globalData.push(data);
});

// New JS Below
function modularAddD3VisToPage(elementID){
    //PRE: Pass the string of the ID we want to append the new D3 Vis to
    //POST: Updated the web page to include the D3 vis as a child of the element whose ID we pass

    d3.json("flare-2.json").then(function(data){processD3Vis(data,elementID)}); 
}

function processD3Vis(data,elementID){
    //PRE: Nothing needed to be passed to this function when called
    //POST: Parses the code provided below and returns an SVG that includes information about the data to be visualized


    var containerParent = document.getElementById(elementID);

    // CODE DIRECTLY FROM: https://observablehq.com/@d3/zoomable-sunburst

    // Specify the chart’s dimensions.
    const width = containerParent.offsetHeight
    const height = width;
    const radius = width / 6;

    // Create the color scale.
    const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));

    // Compute the layout.
    const hierarchy = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
    const root = d3.partition()
        .size([2 * Math.PI, hierarchy.height + 1])
        (hierarchy);
    root.each(d => d.current = d);

    // Create the arc generator.
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius * 1.5)
        .innerRadius(d => d.y0 * radius)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("viewBox", [-width / 2, -height / 2, width, width])
        .style("font", "10px sans-serif");

    // Append the arcs.
    const path = svg.append("g")
        .selectAll("path")
        .data(root.descendants().slice(1))
        .join("path")
        .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
        .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
        .attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")
        .attr("d", d => arc(d.current));

    // Make them clickable if they have children.
    path.filter(d => d.children)
        .style("cursor", "pointer")
        .on("click", clicked);

    const format = d3.format(",d");
    path.append("title")
        .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

    const label = svg.append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
        .selectAll("text")
        .data(root.descendants().slice(1))
        .join("text")
        .attr("dy", "0.35em")
        .attr("fill-opacity", d => +labelVisible(d.current))
        .attr("transform", d => labelTransform(d.current))
        .text(d => d.data.name);

    const parent = svg.append("circle")
        .datum(root)
        .attr("r", radius)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("click", clicked);

    // Handle zoom on click.
    function clicked(event, p) {
        parent.datum(p.parent || root);

        root.each(d => d.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth)
        });

        const t = svg.transition().duration(event.altKey ? 7500 : 750);

        // Transition the data on all arcs, even the ones that aren’t visible,
        // so that if this transition is interrupted, entering arcs will start
        // the next transition from the desired position.
        path.transition(t)
            .tween("data", d => {
            const i = d3.interpolate(d.current, d.target);
            return t => d.current = i(t);
            })
        .filter(function(d) {
            return +this.getAttribute("fill-opacity") || arcVisible(d.target);
        })
            .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
            .attr("pointer-events", d => arcVisible(d.target) ? "auto" : "none") 

            .attrTween("d", d => () => arc(d.current));

        label.filter(function(d) {
            return +this.getAttribute("fill-opacity") || labelVisible(d.target);
        }).transition(t)
            .attr("fill-opacity", d => +labelVisible(d.target))
            .attrTween("transform", d => () => labelTransform(d.current));
    }
    
    function arcVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    function labelTransform(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2 * radius;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }
    containerParent.appendChild(svg.node());
};

function staticAddD3VisToPage(){
    //PRE: When a D3 Function you pass needs to be stapled to a specific ID to make it work, put that code here and update the HTML accordingly

    //EXAMPLE:  This link (https://d3-graph-gallery.com/graph/choropleth_basic.html) requires you to add some scripts to the HTML and
    //          already have an SVG element in your HTML with an id of "my_dataviz"


    // CODE DIRECTLY FROM: https://d3-graph-gallery.com/graph/choropleth_basic.html
    // The svg
    var svg = d3.select("#my_dataviz"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

    // Map and projection
    const path = d3.geoPath();
    const projection = d3.geoMercator()
    .scale(70)
    .center([0,20])
    .translate([width / 2, height / 2]);

    // Data and color scale
    let data = new Map()
    const colorScale = d3.scaleThreshold()
    .domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
    .range(d3.schemeBlues[7]);

    // Load external data and boot
    Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv", function(d) {
        data.set(d.code, +d.pop)
    })
    ]).then(function(loadData){
        let topo = loadData[0]

        // Draw the map
    svg.append("g")
        .selectAll("path")
        .data(topo.features)
        .join("path")
        // draw each country
        .attr("d", d3.geoPath()
            .projection(projection)
        )
        // set the color of each country
        .attr("fill", function (d) {
            d.total = data.get(d.id) || 0;
            return colorScale(d.total);
        })
    })
}

function inClassExampleOfStaticAddD3VisToPage(){
    //PRE: When a D3 Function you pass needs to be stapled to a specific ID to make it work, put that code here and update the HTML accordingly

    //EXAMPLE:  This link (https://d3-graph-gallery.com/graph/choropleth_basic.html) requires you to add some scripts to the HTML and
    //          already have an SVG element in your HTML with an id of "my_dataviz"


    // Adapted from: https://d3-graph-gallery.com/graph/barplot_basic.html
    // The svg
    // set the dimensions and margins of the graph
    const margin = {top: 30, right: 30, bottom: 70, left: 60},
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const svg = d3.select("#in_class_walkthrough_viz")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse the Data
    d3.csv("ExampleData.csv").then( function(data) {
        // X axis
        const x = d3.scaleBand()
            .range([ 0, width ])
            .domain(data.map(d => d.Customer))
            .padding(0.2);
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([0, 100])
            .range([ height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));
        
        // Add X axis label:
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width/2)
            .attr("y", height + margin.top + 20)
            .text("X axis title");

        // Y axis label:
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left+20)
            .attr("x", -height/2)
            .text("Purchase Amount ($USD)")

        // Bars
        // Bars
    const bars = svg.selectAll("mybar")
    .data(data)      
    .join("rect")
        .attr("x", d => x(d.Customer))
        .attr("y", d => y(parseFloat(d.PurchaseAmount.replace("$", ""))))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(parseFloat(d.PurchaseAmount.replace("$", ""))))
        .attr("fill", "#69b3a2")
    
    const tooltipContainer = svg
        .append("g")
        .attr('visibility','hidden')
    
    const tooltipBox = tooltipContainer
        .append('rect')
        .attr('width',100)
        .attr('height',40)
        .attr('fill',"lightgray")
        .attr('opacity',"50%")
        .attr('rx',8)
            // .append("text")
            // .attr("class", "tooltip")
            // .attr("fill", "black")
            // .style("pointer-events", "none");
    
    const tooltipText = tooltipContainer
        .append('text')
        .attr("x",50)
        .attr('y',25)
        .attr("text-anchor", "middle")
        .attr('display','table-cell')
        .text("")

    bars.on("mouseover", (evt, d) => {
        const [mx, my] = d3.pointer(evt);
        const fixedYPos = my - 40;
        tooltipContainer
            .attr("transform", "translate(" + mx + ", " + fixedYPos + ")" )
            .style("visibility","initial");
        tooltipText
            .text(d.PurchaseAmount);
            
        })
        .on("mousemove", (evt, d) => {
            const [mx, my] = d3.pointer(evt);
            const fixedYPos = my - 40;
            tooltipContainer
                .attr("transform", "translate(" + mx + ", " + fixedYPos + ")" );
        })
        .on("mouseout", () => {
        // clear the tooltip
        tooltipText.text("");
        tooltipContainer.style("visibility","hidden")
        });
    })
}

// Old JS Below


function sort(compareObject,display) {
    var table = document.getElementById("recordsTable"),
    tbody = table.getElementsByTagName("tbody")[0];
    
    if(display)
        tbody.innerHTML = "";

    let tempArray = globalData.slice();

    if(compareObject == "Date"){
        tempArray.sort(compareDate);
    } else if(compareObject == "Amount"){
        tempArray.sort(compareAmount);
    } else if(compareObject == "Name"){
        tempArray.sort(compareName);
    }



    if(display==true){
        for (var i=0;i<tempArray.length;i++) {
            var row = document.createElement("tr");
            row.id = tempArray[i].ID
            var cell1 = document.createElement("td");
            var cell2 = document.createElement("td");
            var cell3 = document.createElement("td");
            cell1.innerHTML = tempArray[i].Customer
            cell2.innerHTML = tempArray[i].PurchaseDate
            cell3.innerHTML = tempArray[i].PurchaseAmount
            row.appendChild(cell1);
            row.appendChild(cell2);
            row.appendChild(cell3);
            tbody.appendChild(row);  
        }
    } else {
        return tempArray;
    }
}

function highlightHighest(compareObject){
    let id = sort(compareObject,false)[0].ID;
    possibleCurrentHighlight = document.getElementsByClassName("highlighter")[0]
    if(possibleCurrentHighlight != undefined)
        possibleCurrentHighlight.classList.remove("highlighter")

    document.getElementById(id).classList.add("highlighter")
}

function dropLowest(compareObject){
    let id = sort(compareObject,false)[globalData.length-1].ID;
    var idColumn = globalData.map(function(value,index) { return value.ID; });
    globalData.splice(idColumn.indexOf(id),1)
    document.getElementById(id).remove();
}


function compareDate(a, b){
    var aDate = new Date(a.PurchaseDate)
    var bDate = new Date(b.PurchaseDate)

    if (aDate < bDate) {
        return -1;
    } else if (aDate > bDate) {
        return 1;
    }
    // a must be equal to b
    return 0;
}

function compareAmount(a,b){
    var aAmount = parseFloat(a.PurchaseAmount.replace("$", ""))
    var bAmount = parseFloat(b.PurchaseAmount.replace("$", "")) 
    if (aAmount < bAmount) {
        return -1;
    } else if (aAmount > bAmount) {
        return 1;
    }
    // a must be equal to b
    return 0;
}

function compareName(a,b){
    if (a.Customer < b.Customer) {
        return -1;
    } else if (a.Customer > b.Customer) {
        return 1;
    }
    // a must be equal to b
    return 0;
}