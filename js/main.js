mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsbHloMjMiLCJhIjoiY21obDBjN2ttMW1kdDJxcHI3a2s3YjR1dCJ9.1afNW3K_mxg4u55J1MPeaA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [-122.3321, 47.6062], 
    zoom: 12
});

let chart = null;

map.on('load', function() {
    // 1. Load the CSV
    d3.csv('assets/Paid_Parking_Transaction_Data.csv').then(rawData => {
        
        // 2. LIMIT TO FIRST 30 DATA POINTS
        const data = rawData.slice(0, 30);
        
        // 3. Convert CSV to GeoJSON features
        const features = data.map(row => {
            return {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    // Note: Use exact CSV header names for coordinates
                    'coordinates': [parseFloat(row.Longitude), parseFloat(row.Latitude)]
                },
                'properties': {
                    // Using exact names from your dataset
                    'amount': parseFloat(row['Amount Paid']) || 0,
                    'duration': parseInt(row['Duration In Minutes']) || 0,
                    'method': (row['Payment Mean'] || "").toLowerCase(), 
                    'block': row['Blockface Name']
                }
            };
        });

        // 4. Add the GeoJSON Source
        map.addSource('parking-data', {
            type: 'geojson',
            data: { 'type': 'FeatureCollection', 'features': features }
        });

        // 5. Add the Layer
        map.addLayer({
            'id': 'parking-layer',
            'type': 'circle',
            'source': 'parking-data',
            'paint': {
                // SIZE: Proportional to 'amount' property
                'circle-radius': [
                    'interpolate', ['linear'], ['get', 'amount'],
                    0, 5,
                    5, 15,
                    20, 40
                ],
                // COLOR: Categorical based on 'method' property
                'circle-color': [
                    'match', ['get', 'method'],
                    'phone', '#f39c12',
                    'credit card', '#3498db',
                    /* default */ '#95a5a6'
                ],
                'circle-opacity': 0.8,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });

        // 6. POPUP Logic
        map.on('click', 'parking-layer', (e) => {
            const props = e.features[0].properties;
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div style="color:#333">
                        <strong>Block:</strong> ${props.block}<br>
                        <strong>Amount Paid:</strong> $${props.amount}<br>
                        <strong>Method:</strong> ${props.method.toUpperCase()}
                    </div>
                `)
                .addTo(map);
        });

        // Change cursor to pointer on hover
        map.on('mouseenter', 'parking-layer', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'parking-layer', () => { map.getCanvas().style.cursor = ''; });

        // 7. Initialize Chart
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
    
    // Update total count in sidebar
    const totalElement = document.getElementById('total-count');
    if (totalElement) totalElement.innerText = features.length;

    // Prepare data for the bar chart
    let sorted = features
        .map(f => ({
            block: f.properties.block,
            duration: f.properties.duration
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5);

    if (sorted.length > 0 && chart) {
        chart.load({
            columns: [
                ['x', ...sorted.map(d => d.block)],
                ['duration', ...sorted.map(d => d.duration)]
            ]
        });
    }
}

// Reset view button logic
document.getElementById('reset').addEventListener('click', () => {
    map.flyTo({ center: [-122.3321, 47.6062], zoom: 12 });
});