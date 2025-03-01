document.addEventListener('DOMContentLoaded', function() {
  // Get selected map from session storage
  const selectedMap = sessionStorage.getItem('selectedMap');
  
  // Set up the canvas
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size to match window
  function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  }
  
  // Initial resize
  resizeCanvas();
  
  // Resize canvas when window size changes
  window.addEventListener('resize', resizeCanvas);
  
  // Load and draw background image
  const backgroundImage = new Image();
  backgroundImage.src = `../assets/images/maps/${selectedMap}.png`;
  backgroundImage.onload = function() {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  };
  
  // Set up game timer
  let timeLeft = 99;
  const timerElement = document.getElementById('timer');
  
  const gameTimer = setInterval(() => {
      timeLeft--;
      timerElement.textContent = timeLeft;
      
      if (timeLeft <= 0) {
          clearInterval(gameTimer);
          // Handle time over
      }
  }, 1000);
});