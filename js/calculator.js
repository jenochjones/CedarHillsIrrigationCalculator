function ready(readyListener) {
    if (document.readyState !== "loading") {
        readyListener();
    } else {
        document.addEventListener("DOMContentLoaded", readyListener);
    }
};

ready(function () {

    const tiers = {
        0: 0.30,
        75: 0.70,
        100: 1.15,
        150: 2.50,
        200: 3.10,
        250: 3.95
    };

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
        let allotmentFactor = document.getElementById('allotment-facotr').value;
        const baseRate = 23 + (40 * lotSize);
        const irrigatedArea = calculateIrrigatedArea(lotSize);
        const allotment = irrigatedArea * allotmentFactor; //153;

        const formattedAllotment = Math.round(allotment * 100) / 100;
        const formattedBaseRate = format(baseRate);

        document.getElementById('base-rate').innerHTML = `<p>${formattedBaseRate}`;
        document.getElementById('water-allotment').innerHTML = `<p>${formattedAllotment}`;

        calculateTiers(waterUsage, allotment * 1000, baseRate);
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

        const percentageOfAllotment = (waterUsage / allotment) * 100;
        
        let tierCounter = 0;
        
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

    document.getElementById('allotment-facotr').addEventListener("input", (event) => {
        const waterUsage = document.getElementById('water-usage').value * 1000;
        const lotSize = document.getElementById('lot-size').value;
        calculateBaseRate(lotSize, waterUsage);
    });

    /*document.getElementById('oversized-lot').addEventListener("click", (event) => {
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
