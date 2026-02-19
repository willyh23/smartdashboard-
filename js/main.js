mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsbHloMjMiLCJhIjoiY21obDBjN2ttMW1kdDJxcHI3a2s3YjR1dCJ9.1afNW3K_mxg4u55J1MPeaA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [-75.1652, 39.9526], // Centered on Seattle, change as needed
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
            'circle-radius': [
                'interpolate', ['linear'], ['get', 'count'],
                0, 4,
                50, 15,
                100, 30
            ],
            'circle-color': '#5eb2a0', // Matching the teal-ish color in the demo
            'circle-opacity': 0.7,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
        }
    });

    // Initialize the Chart
    chart = c3.generate({
        bindto: '#chart',
        data: {
            columns: [['deaths', 0]],
            type: 'bar',
            colors: { 'deaths': '#5eb2a0' }
        },
        axis: {
            x: { show: false },
            y: { tick: { color: 'white' } }
        }
    });

    // Update Dashboard when map moves
    map.on('idle', updateDashboard);
});

function updateDashboard() {
    const features = map.queryRenderedFeatures({ layers: ['deaths-layer'] });
    let totalDeaths = 0;
    let deathCounts = [];

    features.forEach(f => {
        totalDeaths += f.properties.deaths;
        deathCounts.push(f.properties.deaths);
    });

    // Update the Big Number
    document.getElementById('total-count').innerText = totalDeaths.toLocaleString();

    // Update the Chart (sorting top 10 zip codes in view)
    deathCounts.sort((a, b) => b - a);
    chart.load({
        columns: [['count', ...deathCounts.slice(0, 10)]]
    });
}

// Reset Function
document.getElementById('reset').addEventListener('click', () => {
    map.flyTo({ center: [-75.1652, 39.9526], zoom: 11 });
});