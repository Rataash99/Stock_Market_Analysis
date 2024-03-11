const stocks = ["AAPL", "MSFT", "GOOGL", "AMZN", "PYPL", "TSLA", "JPM", "NVDA", "NFLX", "DIS"];
const currStock = "";
async function fetchData(url, query){
    try{
        const data = await fetch(url);
        const result = await data.json();
        return result[query][0];
    }
    catch(err){
        console.error("Error Fetching Data :", err);
        throw err;
    }
}
async function getChartData(stock, duration) {

    const url = "https://stocks3.onrender.com/api/stocks/getstocksdata";
    const stockData = await fetchData(url, "stocksData");

    const traces = [];
    // Extracting data for the current stock
    const stockInfo = stockData[stock][duration];
    // Creating a trace for the current stock
    const trace = {
        x: convertToDate(stockInfo["timeStamp"]),
        y: stockInfo["value"],
        type: 'line', 
        mode: 'lines', 
        name: `${stock}`, // Stock name
        hovertemplate: `${stock}: $%{y}<extra></extra>`,
     };
      // Process data to find high and low points
    let high = stockInfo["value"][0];
    let low = stockInfo["value"][0];
    let highIndex = 0;
    let lowIndex = 0;

    stockInfo["value"].forEach((value, index) => {
        if (value > high) {
            high = value;
            highIndex = index;
        }
        if (value < low) {
            low = value;
            lowIndex = index;
        }
    });

    highIndex = stockInfo["value"].indexOf(high);//getting high index
    lowIndex = stockInfo["value"].indexOf(low);//getting low index

    // marker for high index in graph
     const highMarker = {
        x:stockInfo["value"][highIndex],
        y: [high],
        mode: 'markers',
        marker: {
            color: 'green',
            size: 10,
            symbol: 'triangle-up',
            opacity: 0.9
        },
        name: 'All-Time High'
    };

    // marker for low index in graph
    const lowMarker = {
        x: stockInfo["value"][lowIndex],
        y: [low],
        mode: 'markers',
        marker: {
            color: 'red',
            size: 10,
            symbol: 'triangle-down',
            opacity: 0.7
        },
        name: 'All-Time Low'
    };

    // Adding the trace and markers to the traces array
    traces.push(trace, highMarker, lowMarker);

    // Layout configuration
    const layout = {
        title: 'Stock Value Over Time',
        plot_bgcolor: "black",
        paper_bgcolor: "black",
        font: {
            color: 'white' // Change text color to red
        },
        xaxis: {
            showticklabels: false, // Hide x-axis tick labels
            showline: false, // Hide x-axis line
            zeroline: false, // Hide x-axis zero line
        },
        yaxis: {
            showticklabels: false, // Hide y-axis tick labels
            showline: false, // Hide y-axis line
            zeroline: false, // Hide y-axis zero line
        }
    };
    const config = {
        displayModeBar: false,
    };

    // Render Plotly chart with all traces
    Plotly.newPlot('stock-chart', traces, layout, config);
}
getChartData("AAPL", "5y"); // initial rendering 

// converting timestamps of chart to human readable date 
function convertToDate(timeStamp){
    const dateArray = timeStamp.map(time => {
        const date = new Date(time * 1000);
        return date.toDateString();
    })
    return dateArray;
}

// handling timespan(yr, month) of stock to reflect on chart
const timeSpan = document.querySelector('#time-span');
timeSpan.addEventListener('click', (e) => {
    if(e.target.id !== "time-span"){
        const stockName = document.querySelector('#stock-name').textContent;
        const duration = e.target.id;
        getChartData(stockName, duration);
    }
})

// function for getting summary of stocks 
async function showStats(url){
    const stats = await fetchData(url, "stocksStatsData");
    return stats;
}

async function displayStats(currStock) {
    let url = "https://stocks3.onrender.com/api/stocks/getstockstatsdata"; // url for stats
    const stocksList = document.querySelector('#stocks-list');
    const name = document.querySelector("#stock-name");
    const bookVal = document.querySelector("#book-value");
    const prof = document.querySelector("#profit");

    try {
        const getStats = await showStats(url);

        // Assuming getStats is an object with stock names as properties
        Object.getOwnPropertyNames(getStats).forEach(stock => {
            const div = document.createElement('div');
            const profit = Number(getStats[stock].profit).toFixed(2);
            const bookValue = Number(getStats[stock].bookValue);
            div.innerHTML = `
                <button class="p-2 bg-slate-800 rounded-md px-4 hover:scale-105 duration-150 hover:text-cyan-500 cursor-pointer min-w-[5.6rem] text-[0.9rem] text-left">${stock}</button>
                <p class = "min-w-[4.7rem] text-left">$ ${bookValue}</p>
                <p class="${profit > 0 ? 'text-green-500' : 'text-red-500'}">${profit}%</p>
                `;
                div.classList.add('flex', "gap-4", "items-center", "summary");
            stocksList.appendChild(div);
            if(stock == currStock) {
                name.textContent = stock;
                bookVal.textContent = "$" + bookValue;
                prof.textContent = profit + "%";
                if(profit == 0){
                    prof.classList.add("text-red-500");
                    prof.classList.remove("text-green-500");
                }
                else {
                    prof.classList.add("text-green-500");
                    prof.classList.remove("text-red-500");
                }
                displaySummary(stock);
            }
        });

        // handling different stocks to show chart and info accordingly
        stocksList.addEventListener('click', (e) => {
            if(e.target.id !== 'stocks-list'){
                    const stockName = e.target.textContent;
                    getChartData(stockName, '5y');
                    Object.getOwnPropertyNames(getStats).forEach(stock => {
                        const profit = Number(getStats[stock].profit).toFixed(2);
                        const bookValue = Number(getStats[stock].bookValue);                        if(stock == stockName){
                            name.textContent = stockName;
                            bookVal.textContent = "$" + bookValue;
                            prof.textContent = profit + "%";
                            if(profit == 0){
                                prof.classList.add("text-red-500");
                                prof.classList.remove("text-green-500");
                            }
                            else {
                                prof.classList.add("text-green-500");
                                prof.classList.remove("text-red-500");
                            }
                            displaySummary(stock);
                        }
                    })
                }
            })
    } catch (error) {
        console.error('Error fetching summary:', error);
    }
    const lastChild = stocksList.lastChild;
    stocksList.removeChild(lastChild); // Remove the last child node from the parent div
}
// Call the displayStats function
displayStats('AAPL');

async function showSummary(url){
    const summary = await fetchData(url, "stocksProfileData");
    return summary;
}

async function displaySummary(currStock) {
    let url = "https://stocks3.onrender.com/api/stocks/getstocksprofiledata"; // url for summary
    const stocksList = document.querySelector('#stocks-list');
    try {
        const getSummary = await showSummary(url);
        // Assuming getStats is an object with stock names as properties
        Object.getOwnPropertyNames(getSummary).forEach(stock => {
            if(stock == currStock){
                const about = document.querySelector('#about');
                about.innerHTML = getSummary[stock].summary;
            }
        });
        
    } catch (error) {
        console.error('Error fetching summary:', error);
    }
}
