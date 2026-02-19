mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsbHloMjMiLCJhIjoiY21obDBjN2ttMW1kdDJxcHI3a2s3YjR1dCJ9.1afNW3K_mxg4u55J1MPeaA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [-120.7401, 47.7511], 
    zoom: 6
});

let chart = null;

map.on('load', function() {
    map.addSource('smoke-data', {
        type: 'geojson',
        data: 'assets/wildfireexposure.geojson'
    });

    map.addLayer({
        'id': 'smoke-layer',
        'type': 'circle',
        'source': 'smoke-data',
        'paint': {
            // Constant small radius to handle 1700+ points without overlap
            'circle-radius': 4.5,
            // Color gradient based on Rank (1 is highest/worst)
            'circle-color': [
                'interpolate', ['linear'], ['to-number', ['get', 'Rank']],
                1, '#800026',
                50, '#bd0026',
                150, '#fd8d3c',
                300, '#fed976',
                500, '#ffffcc'
            ],
            'circle-opacity': 0.8,
            'circle-stroke-width': 0.5,
            'circle-stroke-color': '#ffffff'
        }
    });

    chart = c3.generate({
        bindto: '#chart',
        data: {
            columns: [['score', 0]],
            type: 'bar',
            colors: { 'score': '#f7941d' }
        },
        axis: {
            x: { show: false },
            y: { tick: { color: 'white' } }
        }
    });

    map.on('idle', updateDashboard);
});

function updateDashboard() {
    const features = map.queryRenderedFeatures({ layers: ['smoke-layer'] });
    let totalScore = 0;
    let scores = [];

    features.forEach(f => {
        let val = parseFloat(f.properties['Cumulative Smoke Score']) || 0; 
        totalScore += val;
        scores.push(val);
    });

    document.getElementById('total-count').innerText = Math.round(totalScore).toLocaleString();

    // Sort descending for the bar chart
    scores.sort((a, b) => b - a);
    chart.load({
        columns: [['score', ...scores.slice(0, 10)]]
    });
}

document.getElementById('reset').addEventListener('click', () => {
    map.flyTo({ center: [-120.7401, 47.7511], zoom: 6 });
});