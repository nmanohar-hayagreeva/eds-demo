import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function buildAnnouncementTicker(items) {
  if (!items.length) return null;

  let current = 0;
  const bar = document.createElement('aside');
  bar.className = 'hero-announcement';
  bar.setAttribute('aria-label', 'SAFRA announcements');

  const controls = document.createElement('div');
  controls.className = 'hero-announcement-controls';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'hero-announcement-btn';
  prevBtn.setAttribute('aria-label', 'Previous announcement');
  prevBtn.textContent = '‹';

  const counter = document.createElement('span');
  counter.className = 'hero-announcement-counter';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'hero-announcement-btn';
  nextBtn.setAttribute('aria-label', 'Next announcement');
  nextBtn.textContent = '›';

  const message = document.createElement('p');
  message.className = 'hero-announcement-text';

  const dismissBtn = document.createElement('button');
  dismissBtn.type = 'button';
  dismissBtn.className = 'hero-announcement-dismiss';
  dismissBtn.setAttribute('aria-label', 'Dismiss announcement');
  dismissBtn.textContent = '×';

  const render = () => {
    counter.textContent = `${current + 1}/${items.length}`;
    message.textContent = items[current];
  };

  prevBtn.addEventListener('click', () => {
    current = (current - 1 + items.length) % items.length;
    render();
  });

  nextBtn.addEventListener('click', () => {
    current = (current + 1) % items.length;
    render();
  });

  dismissBtn.addEventListener('click', () => {
    bar.remove();
  });

  controls.append(prevBtn, counter, nextBtn);
  bar.append(controls, message, dismissBtn);
  render();
  return bar;
}

/**
 * Decorates the SAFRA Hero block with optional eyebrow and floating announcement ticker.
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const pictureRow = rows.find((r) => r.querySelector('picture'));
  const mediaContainer = document.createElement('div');
  mediaContainer.className = 'hero-media';

  if (pictureRow) {
    const img = pictureRow.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt || '', true, [
        { media: '(min-width: 900px)', width: '2000' },
        { width: '900' },
      ]);
      moveInstrumentation(img, optimized.querySelector('img'));
      mediaContainer.append(optimized);
    }
    pictureRow.remove();
  }

  const contentContainer = document.createElement('div');
  contentContainer.className = 'hero-content';

  const remainingRows = [...block.children];
  let announcementItems = [];

  remainingRows.forEach((row) => {
    const text = row.textContent.trim();
    if (!text) {
      row.remove();
      return;
    }

    // If a row contains pipe-separated announcements (e.g. "Notice 1 | Notice 2")
    // or is the 3rd+ text-only row without headings/links, render as ticker
    const hasHeadingOrLink = row.querySelector('h1, h2, h3, a');
    if (!hasHeadingOrLink && text.includes('|')) {
      announcementItems = text.split('|').map((s) => s.trim()).filter(Boolean);
      row.remove();
      return;
    }

    moveInstrumentation(row, contentContainer);
    while (row.firstElementChild) {
      const cell = row.firstElementChild;
      if (cell.textContent.trim() || cell.querySelector('a, picture')) {
        contentContainer.append(cell);
      } else {
        cell.remove();
      }
    }
    row.remove();
  });

  // Style CTA links inside hero content as SAFRA buttons
  contentContainer.querySelectorAll('a[href]').forEach((a, idx) => {
    if (!a.classList.contains('button')) {
      a.classList.add('button', idx === 0 ? 'safra-hero-cta-primary' : 'safra-hero-cta-secondary');
    }
  });

  block.textContent = '';
  block.append(mediaContainer, contentContainer);

  const ticker = buildAnnouncementTicker(announcementItems);
  if (ticker) {
    block.append(ticker);
  }
}
