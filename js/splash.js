document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            // Redirect to the main game page
            window.location.href = 'playerselection.html';
        }
    });
}); 