mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsbHloMjMiLCJhIjoiY21obDBjN2ttMW1kdDJxcHI3a2s3YjR1dCJ9.1afNW3K_mxg4u55J1MPeaA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [-122.3321, 47.6062], 
    zoom: 12
});

let chart = null;

map.on('load', function() {
    d3.csv('assets/Paid_Parking_Transaction_Data.csv').then(rawData => {
        
        // LIMIT TO FIRST 30 DATA POINTS
        const data = rawData.slice(0, 30);
        
        const features = data.map(row => {
            return {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [parseFloat(row.Longitude), parseFloat(row.Latitude)]
                },
                'properties': {
                    'amount': parseFloat(row.amount_paid) || 0,
                    'duration': parseInt(row.durationinminutes) || 0,
                    'method': row.payment_mean, // 'phone', 'credit card', etc.
                    'block': row.blockface_name
                }
            };
        });

        map.addSource('parking-data', {
            type: 'geojson',
            data: { 'type': 'FeatureCollection', 'features': features }
        });

        map.addLayer({
            'id': 'parking-layer',
            'type': 'circle',
            'source': 'parking-data',
            'paint': {
                // SIZE: Proportional to Amount Paid
                'circle-radius': [
                    'interpolate', ['linear'], ['get', 'amount_paid'],
                    0, 5,
                    5, 15,
                    20, 40
                ],
                // COLOR: Categorical based on Payment Mean
                'circle-color': [
                    'match', ['get', 'payment_mean'],
                    'phone', '#f39c12',       // Orange for Phone
                    'credit card', '#3498db', // Blue for Credit Card
                    /* default */ '#95a5a6'   // Grey for others
                ],
                'circle-opacity': 0.8,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });

        // Initialize Chart
        chart = c3.generate({
            bindto: '#chart',
            data: {
                x: 'x',
                columns: [['x'], ['duration']],
                type: 'bar',
                colors: { 'duration': '#1abc9c' }
            },
            axis: {
                x: { type: 'category' },
                y: { label: 'Duration (Min)' }
            }
        });

        map.on('idle', updateDashboard);
    });
});

function updateDashboard() {
    const features = map.queryRenderedFeatures({ layers: ['parking-layer'] });
    document.getElementById('total-count').innerText = features.length;

    let sorted = features
        .map(f => ({
            block: f.properties.block,
            duration: f.properties.duration
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5);

    if (sorted.length > 0) {
        chart.load({
            columns: [
                ['x', ...sorted.map(d => d.block)],
                ['duration', ...sorted.map(d => d.duration)]
            ]
        });
    }
}