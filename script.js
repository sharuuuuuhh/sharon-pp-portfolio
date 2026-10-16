const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = [...document.querySelectorAll('.reveal')];
const projectVisuals = [...document.querySelectorAll('.project-visual')];
document.documentElement.classList.add('js-ready');

if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((element) => element.classList.add('is-visible'));
} else {
  let animateWithAnime;
  let staggerWithAnime;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target;
        element.classList.add('is-visible');
        if (animateWithAnime) {
          animateWithAnime(element, {
            opacity: [0, 1],
            y: [18, 0],
            delay: staggerWithAnime(55),
            duration: 620,
            ease: 'outCubic',
          });
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });
  reveals.forEach((element) => observer.observe(element));

  // Scroll reveal stays usable if the CDN is unavailable; anime.js enriches
  // each newly visible section with a short fade and lift.
  import('https://cdn.jsdelivr.net/npm/animejs/+esm')
    .then(({ animate, stagger }) => {
      if (typeof animate !== 'function' || reduceMotion) return;
      animateWithAnime = animate;
      staggerWithAnime = stagger;
      document.documentElement.classList.add('anime-ready');
    }).catch(() => {});
}

// A restrained perspective tilt on pointer devices adds depth to project art.
// Touch and reduced-motion users keep the static artwork and normal scrolling.
if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  projectVisuals.forEach((visual) => {
    visual.addEventListener('pointermove', (event) => {
      const bounds = visual.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      visual.style.setProperty('--tilt-x', `${(-y * 4).toFixed(2)}deg`);
      visual.style.setProperty('--tilt-y', `${(x * 4).toFixed(2)}deg`);
    });
    visual.addEventListener('pointerleave', () => {
      visual.style.setProperty('--tilt-x', '0deg');
      visual.style.setProperty('--tilt-y', '0deg');
    });
  });
}

document.querySelector('.resume-link')?.addEventListener('click', () => {
  const status = document.querySelector('#resume-status');
  status.querySelector('.resume-small').textContent = 'Résumé PDF not added yet';
});
document.querySelector('#year').textContent = new Date().getFullYear();
