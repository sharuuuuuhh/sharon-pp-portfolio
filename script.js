const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = [...document.querySelectorAll('.reveal')];
const projectVisuals = [...document.querySelectorAll('.project-visual')];
const hero = document.querySelector('#top');
const heroCanvas = document.querySelector('#hero-3d');
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

// Scroll-linked depth: subtle panel parallax and a hero sculpture turn, with
// all updates coalesced into one animation frame for smooth native scrolling.
let scrollTicking = false;
let heroScrollProgress = 0;
let renderHeroScene;
function updateScrollDepth() {
  scrollTicking = false;
  const viewportHeight = window.innerHeight || 1;
  if (hero) {
    const heroRect = hero.getBoundingClientRect();
    heroScrollProgress = Math.min(1, Math.max(0, 1 - heroRect.top / viewportHeight));
  }
  if (!reduceMotion) {
    projectVisuals.forEach((visual) => {
      const rect = visual.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
      visual.style.setProperty('--scroll-progress', progress.toFixed(3));
      visual.style.setProperty('--scroll-tilt', `${((0.5 - progress) * 3).toFixed(2)}deg`);
      visual.style.setProperty('--scroll-y', `${((0.5 - progress) * 12).toFixed(1)}px`);
    });
  }
  renderHeroScene?.();
}
function requestScrollDepth() {
  if (!scrollTicking) {
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollDepth);
  }
}
if (!reduceMotion) {
  window.addEventListener('scroll', requestScrollDepth, { passive: true });
  window.addEventListener('resize', requestScrollDepth, { passive: true });
  requestScrollDepth();
}

// Original Three.js hero sculpture. If WebGL is blocked, the existing vector
// illustration remains visible as a lightweight fallback.
if (heroCanvas && !reduceMotion) {
  import('https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js')
    .then((THREE) => {
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, alpha: true, antialias: true, powerPreference: 'low-power' });
      } catch {
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30);
      camera.position.set(0, 0, 4.1);
      scene.add(new THREE.AmbientLight(0xf4ead7, 1.55));
      const keyLight = new THREE.DirectionalLight(0xffe2c0, 2.6);
      keyLight.position.set(2.2, 2.6, 3.5);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0x8193a3, 1.15);
      fillLight.position.set(-2.5, -1.5, 2);
      scene.add(fillLight);

      const sculpture = new THREE.Group();
      sculpture.scale.setScalar(0.78);
      scene.add(sculpture);
      const copper = new THREE.MeshStandardMaterial({ color: 0xa34332, metalness: 0.62, roughness: 0.3 });
      const brass = new THREE.MeshStandardMaterial({ color: 0xa88b56, metalness: 0.7, roughness: 0.31 });
      const darkMetal = new THREE.MeshStandardMaterial({ color: 0x30332f, metalness: 0.74, roughness: 0.34 });

      const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.72, 0.115, 180, 14, 2, 3), copper);
      sculpture.add(knot);
      const orbitA = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.014, 7, 144), brass);
      orbitA.rotation.set(0.9, 0.25, -0.35);
      sculpture.add(orbitA);
      const orbitB = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.011, 7, 144), darkMetal);
      orbitB.rotation.set(0.25, 1.05, 0.7);
      sculpture.add(orbitB);
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), brass);
      pin.position.set(0.99, 0.22, 0.08);
      pin.rotation.set(0.45, 0.35, 0.6);
      sculpture.add(pin);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      const resizeScene = () => {
        const width = heroCanvas.clientWidth || 1;
        const height = heroCanvas.clientHeight || 1;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      };
      const resizeObserver = new ResizeObserver(resizeScene);
      resizeObserver.observe(heroCanvas.parentElement);
      resizeScene();
      document.documentElement.classList.add('three-ready');

      let active = false;
      let lastFrame = 0;
      let pointerX = 0;
      let pointerY = 0;
      const loop = (time) => {
        if (!active || document.hidden || time - lastFrame < 32) return;
        lastFrame = time;
        sculpture.rotation.y = time * 0.00012 + heroScrollProgress * 1.05 + pointerX * 0.16;
        sculpture.rotation.x = 0.13 + heroScrollProgress * 0.28 + pointerY * 0.12;
        sculpture.rotation.z = heroScrollProgress * 0.14;
        pin.rotation.y = time * 0.0002;
        renderer.render(scene, camera);
      };
      const visibility = new IntersectionObserver(([entry]) => {
        active = entry.isIntersecting;
        renderer.setAnimationLoop(active ? loop : null);
        if (!active) renderer.render(scene, camera);
      }, { threshold: 0.01 });
      visibility.observe(heroCanvas);
      heroCanvas.parentElement.addEventListener('pointermove', (event) => {
        const bounds = heroCanvas.getBoundingClientRect();
        pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      }, { passive: true });
      heroCanvas.parentElement.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && active) renderer.setAnimationLoop(loop);
        else if (document.hidden) renderer.setAnimationLoop(null);
      });
      renderHeroScene = () => renderer.render(scene, camera);
      requestScrollDepth();
    }).catch(() => {});
}

document.querySelector('.resume-link')?.addEventListener('click', () => {
  const status = document.querySelector('#resume-status');
  status.querySelector('.resume-small').textContent = 'Résumé PDF not added yet';
});
document.querySelector('#year').textContent = new Date().getFullYear();
