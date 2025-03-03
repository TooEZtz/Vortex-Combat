document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            // Redirect to the player selection page
            window.location.href = 'playerselection.html';
        }
    });
}); 