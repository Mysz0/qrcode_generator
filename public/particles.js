particlesJS('particles-js', {
    "particles": {
      "number": {
        "value": 150,
        "density": {
          "enable": true,
          "value_area": 800
        }
      },
      "color": {
        "value": "#000100"
      },
      "shape": {
        "type": "circle",
        "stroke": {
          "width": 0,
          "color": "#000000"
        }
      },
      "opacity": {
        "value": 0.5,
        "random": false
      },
      "size": {
        "value": 3,
        "random": true
      },
      "line_linked": {
        "enable": false
      },
      "move": {
        "enable": true,
        "speed": 1, 
        "direction": "none",
        "random": true,
        "straight": false,
        "out_mode": "out",
        "bounce": true
      }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": {
          "enable": false
        },
        "onclick": {
          "enable": false
        },
        "resize": true
      }
    },
    "retina_detect": true
  });
  
  const influenceFactor = 0.2;  
  const influenceDistance = 150;  
  const maxSpeed = 1;  
  
  document.addEventListener('mousemove', function(event) {
      const particles = window.pJSDom[0].pJS.particles.array;
      const mouseX = event.clientX;
      const mouseY = event.clientY;
  
      particles.forEach(particle => {
          const dx = particle.x - mouseX;
          const dy = particle.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
  
          if (dist < influenceDistance) {
              const angle = Math.atan2(dy, dx);
              // Dodawanie subtelnego wpływu ruchu myszy do prędkości cząsteczek
              particle.vx += Math.cos(angle) * influenceFactor;
              particle.vy += Math.sin(angle) * influenceFactor;
          }
  
          // Ograniczenie maksymalnej prędkości
          const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
          if (speed > maxSpeed) {
              particle.vx = (particle.vx / speed) * maxSpeed;
              particle.vy = (particle.vy / speed) * maxSpeed;
          }
      });
  });
  