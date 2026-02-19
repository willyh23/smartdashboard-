mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsbHloMjMiLCJhIjoiY21obDBjN2ttMW1kdDJxcHI3a2s3YjR1dCJ9.1afNW3K_mxg4u55J1MPeaA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [-120.7401, 47.7511],
    zoom: 6.5
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
            'circle-radius': 6,
            // COLOR GRADIENT based on Cumulative Smoke Score
            'circle-color': [
                'interpolate', ['linear'], ['to-number', ['get', 'Cumulative Smoke Score']],
                0, '#fed976',   // Low Score
                100, '#fd8d3c',
                500, '#bd0026',
                1000, '#800026'  // High Score
            ],
            'circle-opacity': 0.85,
            'circle-stroke-width': 0.5,
            'circle-stroke-color': '#fff'
        }
    });

    // Initialize Chart with categorical colors like your example
    chart = c3.generate({
        bindto: '#chart',
        data: {
            x: 'x',
            columns: [
                ['x', 'Rank 1', 'Rank 2', 'Rank 3'],
                ['score', 0, 0, 0]
            ],
            type: 'bar',
            colors: { 'score': '#1abc9c' } // Teal color from your example
        },
        axis: {
            x: { type: 'category' },
            y: { label: { text: 'Score', position: 'outer-middle' } }
        }
    });

    // POPUP logic: Shows Rank and Score
    map.on('click', 'smoke-layer', (e) => {
        const props = e.features[0].properties;
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
                <strong>Rank:</strong> ${props.Rank}<br>
                <strong>Score:</strong> ${props['Cumulative Smoke Score']}
            `)
            .addTo(map);
    });

    map.on('idle', updateDashboard);
});

function updateDashboard() {
    const features = map.queryRenderedFeatures({ layers: ['smoke-layer'] });
    
    document.getElementById('total-count').innerText = features.length;

    // Get top 10 features by Score for the chart
    let sorted = features
        .map(f => ({
            rank: f.properties.Rank,
            score: parseFloat(f.properties['Cumulative Smoke Score']) || 0
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Limit to top 5 for cleaner bars

    if (sorted.length > 0) {
        chart.load({
            columns: [
                ['x', ...sorted.map(d => "Rank " + d.rank)],
                ['score', ...sorted.map(d => d.score)]
            ]
        });
    }
}

document.getElementById('reset').addEventListener('click', () => {
    map.flyTo({ center: [-120.7401, 47.7511], zoom: 6.5 });
});