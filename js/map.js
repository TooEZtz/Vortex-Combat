let selectedMap = null;

document.addEventListener('DOMContentLoaded', function() {
    createMapPlaceholders();
    setupMapSelection();
});

function createMapPlaceholders() {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    const maps = [
        { name: 'TEMPLE', color: '#3a2f23' },
        { name: 'PALACE', color: '#4a1522' },
        { name: 'THE PIT', color: '#1a1a1a' },
        { name: 'DEAD POOL', color: '#162436' }
    ];
    
    maps.forEach((map, i) => {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 400, 300);
        gradient.addColorStop(0, map.color);
        gradient.addColorStop(1, '#000000');
        
        // Fill background
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 300);
        
        // Add map name watermark
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(map.name, 200, 150);
        
        // Save the placeholder
        const img = canvas.toDataURL('image/png');
        const imgElement = document.querySelector(`img[src="../assets/images/maps/placeholder-${map.name.toLowerCase().replace(' ', '-')}.png"]`);
        if (imgElement) {
            imgElement.src = img;
        }
    });
}

function setupMapSelection() {
    const mapCards = document.querySelectorAll('.map-card');
    const startFight = document.getElementById('startFight');
    
    mapCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove previous selection
            mapCards.forEach(c => c.classList.remove('selected'));
            
            // Add new selection
            this.classList.add('selected');
            selectedMap = this.dataset.map;
            
            // Show fight button
            startFight.style.display = 'block';
        });
    });
    
    startFight.addEventListener('click', function() {
        if (selectedMap) {
            // Store selected map in session storage
            sessionStorage.setItem('selectedMap', selectedMap);
            // Navigate to fight screen
            window.location.href = 'fight.html';
        }
    });
}