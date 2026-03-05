/* --------------------------------------------------------------------------
 * SynapseJS Landing — JavaScript
 * Antigravity Design: GSAP + Particles + Magnetic + Theme Toggle
 * -------------------------------------------------------------------------- */

// ── Theme ──────────────────────────────────────────────────────────────────
const savedTheme = localStorage.getItem('synapse-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('synapse-theme', next);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = next === 'light' ? '☀️' : '🌙';
}

window.addEventListener('DOMContentLoaded', () => {
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = savedTheme === 'light' ? '☀️' : '🌙';
});

// ── Particle System ────────────────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const particles = [];
  const COUNT = window.innerWidth < 600 ? 30 : 70;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() { this.reset(true); }
    reset(randomY = false) {
      this.x = Math.random() * canvas.width;
      this.y = randomY ? Math.random() * canvas.height : canvas.height + 10;
      this.r = Math.random() * 2 + 0.5;
      this.dx = (Math.random() - 0.5) * 0.4;
      this.dy = -(Math.random() * 0.5 + 0.2);
      this.alpha = Math.random() * 0.5 + 0.1;
      this.life = 1;
      this.decay = Math.random() * 0.002 + 0.001;
    }
    update() {
      this.x += this.dx;
      this.y += this.dy;
      this.life -= this.decay;
      if (this.life <= 0 || this.y < -10) this.reset();
    }
    draw() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const col = isLight ? `rgba(234,88,12,${this.alpha * this.life})` : `rgba(249,115,22,${this.alpha * this.life})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = col;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  (function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  })();
})();

// ── GSAP Animations ────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // Hero entrance — staggered cascade
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.to('#hero-badge',   { opacity: 1, y: 0, duration: 0.8 }, 0.2)
    .to('#hero-title',   { opacity: 1, y: 0, duration: 1.0 }, 0.45)
    .to('#hero-desc',    { opacity: 1, y: 0, duration: 0.9 }, 0.65)
    .to('#hero-actions', { opacity: 1, y: 0, duration: 0.8 }, 0.80)
    .to('#hero-code',    { opacity: 1, y: 0, duration: 1.2 }, 0.95);

  // Scroll reveal for all .reveal elements
  document.querySelectorAll('.reveal').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none reverse',
      },
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
    });
  });

  // Stagger feature cards
  gsap.utils.toArray('.card').forEach((card, i) => {
    gsap.to(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 90%',
        toggleActions: 'play none none reverse',
      },
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: i * 0.08,
      ease: 'power3.out',
    });
  });

  // 3D Hero Card parallax on mouse move
  const heroCode = document.getElementById('hero-code');
  if (heroCode) {
    window.addEventListener('mousemove', (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const rx = ((e.clientY - cy) / cy) * -8;
      const ry = ((e.clientX - cx) / cx) * 8;
      gsap.to(heroCode, {
        rotateX: 14 + rx,
        rotateY: ry,
        duration: 2,
        ease: 'power2.out',
      });
    });
  }

  // Navbar scroll effect
  const navbar = document.getElementById('navbar');
  if (navbar) {
    ScrollTrigger.create({
      start: 100,
      onToggle({ isActive }) {
        navbar.style.boxShadow = isActive ? '0 1px 0 rgba(255,255,255,0.04)' : 'none';
      }
    });
  }
});

// ── Physics Magnetic Buttons ───────────────────────────────────────────────
window.addEventListener('load', () => {
  if (typeof gsap === 'undefined') return;
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = (e.clientX - left - width / 2) * 0.45;
      const y = (e.clientY - top - height / 2) * 0.45;
      gsap.to(el, { x, y, duration: 0.9, ease: 'power3.out', overwrite: 'auto' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 1.5, ease: 'elastic.out(1, 0.3)' });
    });
  });
});

// ── Assistant Demo ─────────────────────────────────────────────────────────
const assistant = document.getElementById('synapse-assistant');
const chatBox   = document.getElementById('chat-box');
const aiInput   = document.getElementById('ai-input');

function toggleAssistant() {
  if (!assistant) return;
  const isOpen = assistant.classList.toggle('active');
  if (isOpen && aiInput) aiInput.focus();
}

function addMsg(text, role) {
  if (!chatBox) return;
  const div = document.createElement('div');
  div.className = `msg msg-${role}`;
  div.innerHTML = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

async function sendMessage() {
  const text = aiInput?.value?.trim();
  if (!text) return;
  addMsg(text, 'user');
  aiInput.value = '';

  const thinking = addMsg('<em>Thinking...</em>', 'ai');
  await new Promise(r => setTimeout(r, 500));
  thinking?.remove();

  const q = text.toLowerCase();

  if (q.includes('highlight') || q.includes('feature')) {
    addMsg('Emitting <strong>HIGHLIGHT_ELEMENT</strong> signal… ⚡', 'ai');
    document.querySelectorAll('.card').forEach(c => c.classList.add('synapse-highlight'));
    setTimeout(() => document.querySelectorAll('.card').forEach(c => c.classList.remove('synapse-highlight')), 2500);

  } else if (q.includes('top') || q.includes('hero')) {
    addMsg('Emitting <strong>SCROLL_TO</strong> signal — navigating to top.', 'ai');
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } else if (q.includes('how') || q.includes('step') || q.includes('work')) {
    addMsg('Scrolling to <em>How It Works</em> section…', 'ai');
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });

  } else if (q.includes('stat') || q.includes('number')) {
    addMsg('Here\'s a snapshot: <strong>20+ tools</strong>, <strong>3 providers</strong>, setup in <strong>5 min</strong>.', 'ai');

  } else {
    addMsg('I can control this page in real time! Try: <em>"Highlight features"</em>, <em>"Scroll to steps"</em>, or <em>"Go to top"</em>.', 'ai');
  }
}
