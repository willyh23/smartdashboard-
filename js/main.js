mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsbHloMjMiLCJhIjoiY21obDBjN2ttMW1kdDJxcHI3a2s3YjR1dCJ9.1afNW3K_mxg4u55J1MPeaA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [-75.1652, 39.9526], // Philadelphia Center City
    zoom: 11
});

let chart = null;

map.on('load', function() {
    map.addSource('covid-data', {
        type: 'geojson',
        data: 'assets/covid_deaths_by_zip.geojson'
    });

    map.addLayer({
        'id': 'deaths-layer',
        'type': 'circle',
        'source': 'covid-data',
        'paint': {
            // Updated to use 'count' from your dataset
            'circle-radius': [
                'interpolate', ['linear'], ['get', 'count'],
                0, 4,
                50, 15,
                100, 30
            ],
            'circle-color': '#5eb2a0', 
            'circle-opacity': 0.7,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
        }
    });

    // Initialize the Chart with 'count'
    chart = c3.generate({
        bindto: '#chart',
        data: {
            columns: [['count', 0]],
            type: 'bar',
            colors: { 'count': '#5eb2a0' }
        },
        axis: {
            x: { show: false },
            y: { tick: { color: 'white' } }
        }
    });

    map.on('idle', updateDashboard);
});

function updateDashboard() {
    const features = map.queryRenderedFeatures({ layers: ['deaths-layer'] });
    let totalCount = 0;
    let dataPoints = [];

    features.forEach(f => {
        // Accessing the 'count' property directly
        let val = f.properties.count || 0; 
        totalCount += val;
        dataPoints.push(val);
    });

    // Update the Big Number
    document.getElementById('total-count').innerText = totalCount.toLocaleString();

    // Update the Chart with sorted top values
    dataPoints.sort((a, b) => b - a);
    chart.load({
        columns: [['count', ...dataPoints.slice(0, 10)]]
    });
}

document.getElementById('reset').addEventListener('click', () => {
    map.flyTo({ center: [-75.1652, 39.9526], zoom: 11 });
});