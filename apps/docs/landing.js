// ── GSAP Initialization ───────────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// ── Reveal Animations ────────────────────────────────────────────────────
const reveals = document.querySelectorAll('.reveal');

reveals.forEach((el) => {
  gsap.from(el, {
    scrollTrigger: {
      trigger: el,
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
    y: 50,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
  });
});

// ── Hero Asset Tilt ──────────────────────────────────────────────────────
const heroAsset = document.querySelector('#heroAsset');
if (heroAsset) {
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 15;
    const y = (e.clientY / window.innerHeight - 0.5) * -15;
    gsap.to(heroAsset, {
      rotateY: x,
      rotateX: y + 15, // Base 15deg tilt
      duration: 1.2,
      ease: 'power2.out',
    });
  });
}

// ── Magnetic Buttons ─────────────────────────────────────────────────────
const magneticEls = document.querySelectorAll('.magnetic');
magneticEls.forEach((el) => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, { x: x * 0.35, y: y * 0.35, duration: 0.5, ease: 'power2.out' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
  });
});

// ── Assistant Logic ──────────────────────────────────────────────────────
const assistant = document.getElementById('synapse-assistant');
const chatBox = document.getElementById('chat-box');
const aiInput = document.getElementById('ai-input');

function toggleAssistant() {
  assistant.classList.toggle('active');
  if (assistant.classList.contains('active')) {
    aiInput.focus();
  }
}

function addMessage(text, role) {
  const div = document.createElement('div');
  div.className = `msg msg-${role}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

async function sendMessage() {
  const text = aiInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  aiInput.value = '';

  // Simulate AI Thinking
  const thinking = addMessage('...', 'ai');
  await new Promise(r => setTimeout(r, 800));
  thinking.remove();

  // Simple Pattern Matching for Demo
  const input = text.toLowerCase();
  
  if (input.includes('highlight') || input.includes('show features')) {
    addMessage('Highlighting the features grid for you. Emitting HIGHLIGHT_ELEMENT signal...', 'ai');
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => card.classList.add('synapse-highlight'));
    setTimeout(() => cards.forEach(card => card.classList.remove('synapse-highlight')), 3000);
  } else if (input.includes('scroll') && input.includes('top')) {
    addMessage('Scrolling to the top. Emitting SCROLL_TO signal...', 'ai');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (input.includes('scroll') && (input.includes('feature') || input.includes('down'))) {
    addMessage('Scrolling to features. Emitting SCROLL_TO signal...', 'ai');
    document.querySelector('.features').scrollIntoView({ behavior: 'smooth' });
  } else if (input.includes('docs') || input.includes('documentation')) {
    addMessage('Documentation is available via the Documentation link. Emitting NAVIGATE signal...', 'ai');
    document.querySelector('.nav-link[href="intro.html"]').classList.add('synapse-highlight');
    setTimeout(() => document.querySelector('.nav-link[href="intro.html"]').classList.remove('synapse-highlight'), 3000);
  } else {
    addMessage("I can highlight parts of this page or scroll to sections. Try: 'Highlight features' or 'Scroll to bottom'.", 'ai');
  }
}

// ── Hover Orbs ───────────────────────────────────────────────────────────
const orbs = document.querySelectorAll('.glow-orb');
window.addEventListener('mousemove', (e) => {
  const { clientX, clientY } = e;
  const xPercent = (clientX / window.innerWidth - 0.5) * 100;
  const yPercent = (clientY / window.innerHeight - 0.5) * 100;

  orbs.forEach((orb, i) => {
    const factor = (i + 1) * 0.2;
    gsap.to(orb, {
      x: xPercent * factor,
      y: yPercent * factor,
      duration: 2,
      ease: 'power1.out'
    });
  });
});
