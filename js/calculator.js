function ready(readyListener) {
    if (document.readyState !== "loading") {
        readyListener();
    } else {
        document.addEventListener("DOMContentLoaded", readyListener);
    }
};

ready(function () {

    // These are the tiers used to calculate the monthly water bill. An allowed water allotment
    // is calculated and then every 1000 gal used within the tiered percentage of the allotment
    // is billed at the value listed. (So someone who used 50% of their allotment would pay $0.5/1000gal)
    const tiers = {
        0: 0.70,
        75: 1.00,
        100: 1.50,
        150: 2.50,
        200: 3.10,
        250: 3.95
    };

    // Update this to update the base rate. The key is the lot size while the value is the cost.
    // The first entry is the base rate for all customers. Each additional entry is the amount
    // added to the base rate for lots less than or equal to the lot size in the key.
    const lotSizeBaseRates = {
        0: 38.58,
        1: 5
    }

    // These are the volumes of water needed per acre (in kgal) for a healthy lawn each month.
    const monthlyVol = [0, 83.4, 125.1, 208.5, 208.5, 125.1, 83.4, 0];

    // const yearlyVol = 843;

    // The city determined this allotment factor to allow for a more generous rate structure.
    const allotmentFactor = 140;

    let addPlotlyGraph = function (irrigatedArea) {

        // Define the data for the plot
        let data = [{
            x: ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'],
            y: monthlyVol.map(element => Math.round(element * irrigatedArea * 100) / 100),
            type: 'bar'
        }];

        // Define the layout for the plot
        let layout = {
            autosize: true,
            margin: {
                l: 100, // left margin
                r: 50, // right margin
                b: 30, // bottom margin
                t: 10  // top margin reduced
            },
            xaxis: {
              title: {
                text: 'Month',
              },
            },
            yaxis: {
              title: {
                text: 'Monthly Usage (kgal)',
              }
            }
          };

        let config = {
            displayModeBar: false // Hide the toolbar
        };

        // Render the plot in the div with id 'plotly-graph'
        Plotly.newPlot('plotly-graph', data, layout, config);

        //document.getElementById('yearly-allotment').innerHTML = `Yearly Amount: ${Math.round(yearlyVol * irrigatedArea * 10) / 10} thousand gallons`;
    }

    let calculateIrrigatedArea = function (lotSize) {
        let irrigatedArea;
        //let isChecked = document.getElementById('oversized-lot').checked;

        //if (!isChecked && lotSize > 0.5) {
        //    document.getElementById('lot-size').style.backgroundColor = '#ff0000';
        //} else {
        //    document.getElementById('lot-size').style.backgroundColor = '#ffeee0';
        //}

        if (lotSize < 0.12) {
            irrigatedArea = 0.02;
        //} else if (isChecked) {
        //    irrigatedArea = document.getElementById('lot-size').value;
        } else {
            irrigatedArea = (lotSize * 0.707692) - 0.05828; 
        }
        return irrigatedArea;
    }

    let format = function(value) {
        const formattedValue = value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
        return formattedValue;
    }

    let calculateBaseRate = function (lotSize, waterUsage) {
        //let allotmentFactor = document.getElementById('allotment-facotr').value;
        //const baseRate = 23 + (40 * lotSize);
        //if (lotSize > 0.5) {
        //    document.getElementById("lot-size").style.backgroundColor = "red";
        //} else if (lotSize === 0) {

        //    updateMonthlyBill(lotSizeBaseRates[0], Array(tiers.length).fill(0));
        //} else {
        document.getElementById("lot-size").style.backgroundColor = "#ffeee0";

        let baseRate = lotSizeBaseRates[0] + ( lotSizeBaseRates[0] * lotSize );

        //const keys = Object.keys(lotSizeBaseRates).map(Number).sort((a, b) => a - b);
        
        //for (let key of keys) {
        //    if (lotSize > 0) {
        //        if (key >= lotSize && key !== 0) {
        //            baseRate += lotSizeBaseRates[key];
        //            break;
        //        }
        //    }
        //}

        const irrigatedArea = calculateIrrigatedArea(lotSize);
        const allotment = lotSize * allotmentFactor;

        const formattedAllotment = Math.round(allotment * 100) / 100;
        const formattedBaseRate = format(baseRate);


        document.getElementById('base-rate').innerHTML = `<p>${formattedBaseRate}`;
        document.getElementById('water-allotment').innerHTML = `<p>${formattedAllotment}`;
        
        calculateTiers(waterUsage, allotment * 1000, baseRate);
        addPlotlyGraph(irrigatedArea);
        //}
    }

    let calculateTiers = function (waterUsage, allotment, baseRate) {
        let lowerVol;
        let upperVol;
        let amount;
        let formatted;

        if (waterUsage === '') {
            waterUsage = 0;
        }

        let tierValues = [];

        const percentageOfAllotment = allotment === 0 ? 0 : (waterUsage / allotment) * 100;
        
        let tierCounter = 0;
        debugger
        for (let tier in tiers) {
            if (percentageOfAllotment < tier) {
                tierValues.push(0);
            } else if (percentageOfAllotment >= tier && (percentageOfAllotment < Object.keys(tiers)[tierCounter + 1] || tierCounter + 1 >= Object.keys(tiers).length)) {
                lowerVol = tier * allotment / 100;
                upperVol = waterUsage;
                amount = (upperVol - lowerVol) * tiers[tier] / 1000;
                tierValues.push(amount);
            } else {
                lowerVol = tier * allotment / 100;
                upperVol = Object.keys(tiers)[tierCounter + 1] * allotment / 100;
                amount = (upperVol - lowerVol) * tiers[tier] / 1000;
                tierValues.push(amount);
            }
            tierCounter += 1;
        }
        
        let tierAmountCounter = 1;

        for (let tierAmount in tierValues) {
            formatted = format(tierValues[tierAmount]);
            document.getElementById(`tier${tierAmountCounter}`).innerHTML = `<p>${formatted}</p>`;
            tierAmountCounter += 1;
        }

        updateMonthlyBill(baseRate, tierValues);
    };

    let updateMonthlyBill = function (monthlyRate, tierValues) {
        let monthlyBill = parseFloat(monthlyRate);

        for (let value in tierValues) {
            monthlyBill += parseFloat(tierValues[value]);
        }
        
        const formattedMonthlyBill = format(monthlyBill);
        document.getElementById("est-bill").innerHTML = `<p>${formattedMonthlyBill}</p>`;
    };

    document.getElementById('lot-size').addEventListener("input", (event) => {
        let lotSize = event.target.value;
        const waterUsage = document.getElementById('water-usage').value * 1000;
        calculateBaseRate(lotSize, waterUsage);
    });

    document.getElementById('water-usage').addEventListener("input", (event) => {
        let waterUsage = event.target.value * 1000;
        const lotSize = document.getElementById('lot-size').value;
        calculateBaseRate(lotSize, waterUsage);
    });
/*
    document.getElementById('allotment-facotr').addEventListener("input", (event) => {
        const waterUsage = document.getElementById('water-usage').value * 1000;
        const lotSize = document.getElementById('lot-size').value;
        calculateBaseRate(lotSize, waterUsage);
    });

    document.getElementById('oversized-lot').addEventListener("click", (event) => {
        let isChecked = event.target.checked;

        if (isChecked) {
            document.getElementById('lot-description').innerHTML = '<p>Irrigated area in lot:</p>';

        } else {
            document.getElementById('lot-description').innerHTML = '<p>Your lot size:</p>';
        }

        const waterUsage = document.getElementById('water-usage').value * 1000;
        const lotSize = document.getElementById('lot-size').value;
        calculateBaseRate(lotSize, waterUsage);
    });*/
});
