const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = [...document.querySelectorAll('.reveal')];
document.documentElement.classList.add('js-ready');

if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((element) => element.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });
  reveals.forEach((element) => observer.observe(element));

  // Use anime.js for a subtle, one-time hero entrance. Scroll reveals above
  // remain native and readable when the library or network is unavailable.
  import('https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js')
    .then(({ default: anime }) => {
      if (!anime || reduceMotion) return;
      anime({ targets: '.hero-copy .eyebrow, .hero-copy h1, .hero-copy .hero-intro, .hero-copy .hero-actions',
        opacity: [0, 1], translateY: [10, 0], delay: anime.stagger(90), duration: 560, easing: 'easeOutQuad' });
    }).catch(() => {});
}

document.querySelector('.resume-link')?.addEventListener('click', () => {
  const status = document.querySelector('#resume-status');
  status.querySelector('.resume-small').textContent = 'Résumé PDF not added yet';
});
document.querySelector('#year').textContent = new Date().getFullYear();
