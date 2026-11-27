import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const AUTOPLAY_INTERVAL_MS = 6000;

/**
 * Builds and decorates the SAFRA Full-Bleed Promotional Carousel block.
 * Each child row represents a slide with [image, content].
 * @param {Element} block The carousel block element
 */
export default function decorate(block) {
  const rows = [...block.children].filter((r) => r.children.length > 0);
  if (!rows.length) return;

  const isSingleSlide = rows.length < 2;
  let activeIndex = 0;
  let autoplayTimer = null;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'SAFRA featured promotions');

  const viewport = document.createElement('div');
  viewport.className = 'carousel-viewport';

  const track = document.createElement('ul');
  track.className = 'carousel-track';

  rows.forEach((row, index) => {
    const slide = document.createElement('li');
    slide.className = 'carousel-slide';
    slide.dataset.slideIndex = String(index);
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${index + 1} of ${rows.length}`);
    moveInstrumentation(row, slide);

    const [mediaCol, contentCol] = [...row.children];

    // Media layer
    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'carousel-slide-media';
    const img = mediaCol?.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt || '', index === 0, [
        { media: '(min-width: 900px)', width: '1900' },
        { width: '900' },
      ]);
      moveInstrumentation(img, optimized.querySelector('img'));
      mediaWrap.append(optimized);
    }

    // Content overlay layer
    const contentWrap = document.createElement('div');
    contentWrap.className = 'carousel-slide-content';
    if (contentCol) {
      const inner = document.createElement('div');
      inner.className = 'carousel-slide-card';
      moveInstrumentation(contentCol, inner);
      while (contentCol.firstElementChild) {
        inner.append(contentCol.firstElementChild);
      }
      inner.querySelectorAll('a[href]').forEach((a) => {
        a.classList.add('carousel-slide-cta');
      });
      if (inner.textContent.trim() || inner.querySelector('a')) {
        contentWrap.append(inner);
      }
    }

    slide.append(mediaWrap, contentWrap);
    track.append(slide);
  });

  viewport.append(track);
  block.textContent = '';
  block.append(viewport);

  if (isSingleSlide) return;

  // Navigation arrows
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'carousel-nav carousel-nav-prev';
  prevBtn.setAttribute('aria-label', 'Previous slide');
  prevBtn.innerHTML = '<span aria-hidden="true">&#8249;</span>';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'carousel-nav carousel-nav-next';
  nextBtn.setAttribute('aria-label', 'Next slide');
  nextBtn.innerHTML = '<span aria-hidden="true">&#8250;</span>';

  // Pagination dots & counter
  const footer = document.createElement('div');
  footer.className = 'carousel-controls';

  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'carousel-dots';
  dotsWrap.setAttribute('role', 'tablist');
  dotsWrap.setAttribute('aria-label', 'Choose a slide to display');

  const dotButtons = rows.map((_, idx) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
    dot.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => {
      // eslint-disable-next-line no-use-before-define
      goToSlide(idx);
    });
    dotsWrap.append(dot);
    return dot;
  });

  const counter = document.createElement('span');
  counter.className = 'carousel-counter';
  counter.setAttribute('aria-live', 'polite');

  footer.append(dotsWrap, counter);
  block.append(prevBtn, nextBtn, footer);

  const goToSlide = (targetIndex) => {
    activeIndex = (targetIndex + rows.length) % rows.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    dotButtons.forEach((dot, idx) => {
      dot.setAttribute('aria-selected', idx === activeIndex ? 'true' : 'false');
      dot.classList.toggle('is-active', idx === activeIndex);
    });
    counter.textContent = `${activeIndex + 1} / ${rows.length}`;
  };

  prevBtn.addEventListener('click', () => goToSlide(activeIndex - 1));
  nextBtn.addEventListener('click', () => goToSlide(activeIndex + 1));

  // Keyboard arrows
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goToSlide(activeIndex - 1);
    if (e.key === 'ArrowRight') goToSlide(activeIndex + 1);
  });

  // Touch swipe support
  let touchStartX = 0;
  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 45) {
      goToSlide(delta < 0 ? activeIndex + 1 : activeIndex - 1);
    }
  }, { passive: true });

  // Autoplay (respects prefers-reduced-motion & pauses on hover/focus)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startAutoplay = () => {
    if (prefersReducedMotion || autoplayTimer) return;
    autoplayTimer = window.setInterval(() => goToSlide(activeIndex + 1), AUTOPLAY_INTERVAL_MS);
  };
  const stopAutoplay = () => {
    if (autoplayTimer) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  block.addEventListener('mouseenter', stopAutoplay);
  block.addEventListener('mouseleave', startAutoplay);
  block.addEventListener('focusin', stopAutoplay);
  block.addEventListener('focusout', startAutoplay);

  goToSlide(0);
  startAutoplay();
}
