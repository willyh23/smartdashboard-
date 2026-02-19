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
                    // Use Number() to ensure Mapbox recognizes these for scaling
                    'amount': Number(row['Amount Paid']) || 0,
                    'duration': Number(row['Duration In Minutes']) || 0,
                    'method': (row['Payment Mean'] || "").toLowerCase(), 
                    'block': row['Blockface Name']
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
                // Increased the max radius to 50 to make differences obvious
                'circle-radius': [
                    'interpolate', ['linear'], ['get', 'amount'],
                    0, 4,
                    2, 10,
                    5, 20,
                    15, 50 
                ],
                'circle-color': [
                    'match', ['get', 'method'],
                    'phone', '#f39c12',
                    'credit card', '#3498db',
                    '#95a5a6'
                ],
                'circle-opacity': 0.8,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });

        // Initialize Chart with fixes for cramped labels
        chart = c3.generate({
            bindto: '#chart',
            padding: {
                bottom: 60 // Extra space for rotated labels
            },
            data: {
                x: 'x',
                columns: [['x'], ['duration']],
                type: 'bar',
                colors: { 'duration': '#1abc9c' }
            },
            axis: {
                x: { 
                    type: 'category',
                    tick: {
                        rotate: 45, // Rotate labels so they don't overlap
                        multiline: false
                    }
                },
                y: { label: 'Min' }
            }
        });

        // Popup logic
        map.on('click', 'parking-layer', (e) => {
            const props = e.features[0].properties;
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div style="color:#333">
                        <strong>${props.block}</strong><br>
                        Paid: $${props.amount}<br>
                        Time: ${props.duration} mins
                    </div>
                `)
                .addTo(map);
        });

        map.on('mouseenter', 'parking-layer', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'parking-layer', () => { map.getCanvas().style.cursor = ''; });

        map.on('idle', updateDashboard);
    });
});

function updateDashboard() {
    const features = map.queryRenderedFeatures({ layers: ['parking-layer'] });
    
    const totalElement = document.getElementById('total-count');
    if (totalElement) totalElement.innerText = features.length;

    // Sort by duration for the chart
    let sorted = features
        .map(f => ({
            block: f.properties.block,
            duration: f.properties.duration
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5); // Show top 5 so bars aren't too skinny

    if (sorted.length > 0 && chart) {
        chart.load({
            columns: [
                ['x', ...sorted.map(d => d.block)],
                ['duration', ...sorted.map(d => d.duration)]
            ]
        });
    }
}

document.getElementById('reset').addEventListener('click', () => {
    map.flyTo({ center: [-122.3321, 47.6062], zoom: 12 });
});