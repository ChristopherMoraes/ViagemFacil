const bipAudio = new Audio(new URL('../audio/bip.mp3', import.meta.url).href);
const sucessoAudio = new Audio(new URL('../audio/sucesso.mp3', import.meta.url).href);
const alertaAudio = new Audio(new URL('../audio/alerta.mp3', import.meta.url).href);

export const playSound = (type = 'tap') => {
  try {
    // Ao toque ou seleção de qualquer botão
    if (type === 'tap' || type === 'select' || type === 'bip') {
      bipAudio.currentTime = 0;
      bipAudio.play().catch(() => { });
      return;
    }

    // pagamento concluído 
    if (type === 'success') {
      sucessoAudio.currentTime = 0;
      sucessoAudio.play().catch(() => { });
      return;
    }

    // Som de alerta 
    if (type === 'warning' || type === 'alerta') {
      alertaAudio.currentTime = 0;
      alertaAudio.play().catch(() => { });
      return;
    }
  } catch (err) { }
};


// efeito de confeti 


export const triggerConfetti = () => {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '99999';
  canvas.style.pointerEvents = 'none';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#0d9488', '#14b8a6', '#2dd4bf', '#10b981', '#f59e0b', '#38bdf8', '#06b6d4'];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: canvas.width * 0.5,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 18,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  let animationFrame;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.vx *= 0.98;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.009;

      if (p.opacity > 0) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrame);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  };

  animate();
};
