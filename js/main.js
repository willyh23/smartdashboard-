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
        
        // Limit to 30 for performance
        const data = rawData.slice(0, 30);
        
        const features = data.map(row => {
            // Helper function to shorten those long Seattle block names
            // This takes "6TH AVE N BETWEEN ST AND ST" and just keeps "6TH AVE N"
            let shortName = row['Blockface Name'] ? row['Blockface Name'].split(' BETWEEN')[0] : "Unknown";

            return {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [parseFloat(row.Longitude), parseFloat(row.Latitude)]
                },
                'properties': {
                    'amount': Number(row['Amount Paid']) || 0,
                    'duration': Number(row['Duration In Minutes']) || 0,
                    'method': (row['Payment Mean'] || "").toLowerCase(), 
                    'block': shortName 
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
                // FIXED SIZE LOGIC: More aggressive scaling for small dollar amounts
                'circle-radius': [
                    'interpolate', ['linear'], ['get', 'amount'],
                    0, 4,
                    2, 8,
                    5, 18,
                    10, 35,
                    20, 60
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

        // Initialize Chart with better spacing and shortened names
        chart = c3.generate({
            bindto: '#chart',
            size: {
                height: 250 // Slightly taller to fit names
            },
            padding: {
                bottom: 40,
                left: 40
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
                        rotate: 30, // Less steep rotation for readability
                        multiline: false
                    }
                },
                y: { 
                    label: { text: 'Min', position: 'outer-middle' }
                }
            },
            legend: { show: false }
        });

        // Click for Popup
        map.on('click', 'parking-layer', (e) => {
            const props = e.features[0].properties;
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div style="color:#333; font-family:sans-serif;">
                        <strong style="color:#2c3e50;">${props.block}</strong><br>
                        <b>Paid:</b> $${props.amount}<br>
                        <b>Time:</b> ${props.duration} mins
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

    // Grab top 5 longest stays to keep the chart clean
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

document.getElementById('reset').addEventListener('click', () => {
    map.flyTo({ center: [-122.3321, 47.6062], zoom: 12 });
});