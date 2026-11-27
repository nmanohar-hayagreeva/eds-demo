import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const VISITING_OPTIONS = [
  'All',
  'for me-time',
  'with my buddies',
  'with my partner',
  'with my family',
];

const INTEREST_OPTIONS = [
  'All',
  'Sports & Fitness',
  'Education',
  'F&B',
  'Leisure & Entertainment',
];

const CLUB_OPTIONS = [
  'All',
  'SAFRA Choa Chu Kang',
  'SAFRA Jurong',
  'SAFRA Mount Faber',
  'SAFRA Punggol',
  'SAFRA Tampines',
  'SAFRA Toa Payoh',
  'SAFRA Yishun',
  'SAFRA@CMPB',
];

const BADGE_MODIFIER_MAP = {
  promotion: 'red',
  event: 'orange',
  facility: 'blue',
  club: 'green',
  article: 'purple',
};

function getText(el) {
  return el ? el.textContent.trim() : '';
}

function buildSelectField(id, labelText, options, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'explore-filter-field';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;

  const select = document.createElement('select');
  select.id = id;
  select.className = 'explore-filter-select';

  options.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt === 'All' ? '' : opt;
    option.textContent = opt;
    select.append(option);
  });

  select.addEventListener('change', onChange);
  wrap.append(label, select);
  return { wrap, select };
}

/**
 * Decorates the complex "Explore SAFRA" multi-filter + card carousel block.
 *
 * Expected row structure per card item:
 * Col 0: Image (picture)
 * Col 1: Badge / Type (e.g. "Promotion", "Event", "Facility", "Club", "Article")
 * Col 2: Title & optional link (h3/p/a)
 * Col 3: Metadata — Visiting | Interest | Clubs | Date (4 paragraphs or pipe-separated)
 *
 * @param {Element} block The explore-safra block element
 */
export default function decorate(block) {
  const rows = [...block.children].filter((r) => r.children.length > 0);
  if (!rows.length) return;

  const state = {
    visiting: '',
    interest: '',
    club: '',
    badge: '',
    scrollIndex: 0,
  };

  // Parse authored rows into structured card descriptors while preserving UE instrumentation
  const items = rows.map((row) => {
    const cols = [...row.children];
    const [imgCol, badgeCol, titleCol, metaCol] = cols;

    const badgeText = getText(badgeCol) || 'Promotion';
    const badgeKey = badgeText.toLowerCase();
    const badgeTone = BADGE_MODIFIER_MAP[badgeKey] || 'red';

    const link = titleCol?.querySelector('a') || row.querySelector('a');
    const titleText = getText(titleCol) || 'SAFRA Experience';
    const href = link?.getAttribute('href') || '#';

    // Extract facets from metaCol: 4 separate <p> lines or pipe-delimited string
    let visiting = '';
    let interest = '';
    let clubs = '';
    let dateText = '';

    if (metaCol) {
      const paragraphs = [...metaCol.querySelectorAll('p')].map((p) => p.textContent.trim()).filter(Boolean);
      if (paragraphs.length >= 2) {
        [visiting = '', interest = '', clubs = '', dateText = ''] = paragraphs;
      } else {
        const parts = getText(metaCol).split('|').map((s) => s.trim());
        [visiting = '', interest = '', clubs = '', dateText = ''] = parts;
      }
    }

    const card = document.createElement('article');
    card.className = 'explore-card';
    moveInstrumentation(row, card);

    // Card Image (4:3)
    const media = document.createElement('div');
    media.className = 'explore-card-media';
    const img = imgCol?.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt || titleText, false, [{ width: '600' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      media.append(optimized);
    }

    // Card Body
    const body = document.createElement('div');
    body.className = 'explore-card-body';

    const badge = document.createElement('span');
    badge.className = `explore-badge explore-badge-${badgeTone}`;
    badge.textContent = badgeText;

    const heading = document.createElement('h3');
    heading.className = 'explore-card-title';
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.textContent = titleText;
    heading.append(anchor);

    body.append(badge, heading);

    if (clubs) {
      const loc = document.createElement('p');
      loc.className = 'explore-card-location';
      loc.textContent = clubs;
      body.append(loc);
    }

    if (dateText) {
      const dateEl = document.createElement('p');
      dateEl.className = 'explore-card-date';
      dateEl.textContent = dateText;
      body.append(dateEl);
    }

    card.append(media, body);

    return {
      el: card,
      badge: badgeText,
      visiting: visiting.toLowerCase(),
      interest: interest.toLowerCase(),
      clubs: clubs.toLowerCase(),
    };
  });

  // Collect unique badges for quick-filter pills
  const uniqueBadges = [...new Set(items.map((item) => item.badge))];

  // Build Header Row (Two-tone SAFRA Section Title + "See all" CTA)
  const header = document.createElement('div');
  header.className = 'explore-header';

  const heading = document.createElement('h2');
  heading.className = 'explore-title';
  heading.innerHTML = '<span class="explore-title-muted">EXPLORE</span> <span class="explore-title-accent">SAFRA</span>';

  const seeAll = document.createElement('a');
  seeAll.className = 'explore-see-all';
  seeAll.href = 'https://www.safra.sg/facilities-services/explore-safra';
  seeAll.textContent = 'See all';

  header.append(heading, seeAll);

  // Build 3-Dropdown Interactive Filter Bar
  const filterBar = document.createElement('div');
  filterBar.className = 'explore-filter-bar';

  const uid = `explore-${Math.random().toString(36).slice(2, 7)}`;

  const applyFilters = () => {
    // eslint-disable-next-line no-use-before-define
    renderGrid();
  };

  const visitingField = buildSelectField(`${uid}-visiting`, 'I AM VISITING', VISITING_OPTIONS, (e) => {
    state.visiting = e.target.value.toLowerCase();
    applyFilters();
  });

  const interestField = buildSelectField(`${uid}-interest`, 'I AM INTERESTED IN', INTEREST_OPTIONS, (e) => {
    state.interest = e.target.value.toLowerCase();
    applyFilters();
  });

  const clubField = buildSelectField(`${uid}-club`, 'I AM GOING TO', CLUB_OPTIONS, (e) => {
    state.club = e.target.value.toLowerCase();
    applyFilters();
  });

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'explore-reset-btn';
  resetBtn.setAttribute('aria-label', 'Reset all filters');
  resetBtn.title = 'Reset filters';
  resetBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>';

  filterBar.append(visitingField.wrap, interestField.wrap, clubField.wrap, resetBtn);

  // Quick Category Pill Bar + Result Count
  const subBar = document.createElement('div');
  subBar.className = 'explore-subbar';

  const pillsWrap = document.createElement('div');
  pillsWrap.className = 'explore-pills';
  pillsWrap.setAttribute('role', 'tablist');
  pillsWrap.setAttribute('aria-label', 'Filter by category');

  const pillButtons = ['All', ...uniqueBadges].map((label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `explore-pill${label === 'All' ? ' is-active' : ''}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', label === 'All' ? 'true' : 'false');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      state.badge = label === 'All' ? '' : label;
      pillButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      applyFilters();
    });
    pillsWrap.append(btn);
    return btn;
  });

  const countBadge = document.createElement('span');
  countBadge.className = 'explore-count';
  countBadge.setAttribute('aria-live', 'polite');

  subBar.append(pillsWrap, countBadge);

  // Carousel Viewport + Track + Prev/Next Buttons
  const stage = document.createElement('div');
  stage.className = 'explore-stage';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'explore-arrow explore-arrow-prev';
  prevBtn.setAttribute('aria-label', 'Scroll cards left');
  prevBtn.innerHTML = '<span aria-hidden="true">&#8249;</span>';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'explore-arrow explore-arrow-next';
  nextBtn.setAttribute('aria-label', 'Scroll cards right');
  nextBtn.innerHTML = '<span aria-hidden="true">&#8250;</span>';

  const grid = document.createElement('div');
  grid.className = 'explore-grid';

  const emptyState = document.createElement('div');
  emptyState.className = 'explore-empty';
  emptyState.hidden = true;
  emptyState.innerHTML = '<p>No SAFRA activities match your selected filters.</p>';
  const emptyReset = document.createElement('button');
  emptyReset.type = 'button';
  emptyReset.className = 'explore-empty-reset';
  emptyReset.textContent = 'Show all activities';
  emptyState.append(emptyReset);

  stage.append(prevBtn, grid, nextBtn, emptyState);

  const resetAll = () => {
    state.visiting = '';
    state.interest = '';
    state.club = '';
    state.badge = '';
    visitingField.select.value = '';
    interestField.select.value = '';
    clubField.select.value = '';
    pillButtons.forEach((b, idx) => {
      b.classList.toggle('is-active', idx === 0);
      b.setAttribute('aria-selected', String(idx === 0));
    });
    applyFilters();
  };

  resetBtn.addEventListener('click', resetAll);
  emptyReset.addEventListener('click', resetAll);

  const updateArrowState = () => {
    const maxScroll = grid.scrollWidth - grid.clientWidth;
    prevBtn.disabled = grid.scrollLeft <= 2;
    nextBtn.disabled = maxScroll <= 2 || grid.scrollLeft >= maxScroll - 2;
  };

  prevBtn.addEventListener('click', () => {
    grid.scrollBy({ left: -Math.max(280, grid.clientWidth * 0.75), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    grid.scrollBy({ left: Math.max(280, grid.clientWidth * 0.75), behavior: 'smooth' });
  });

  grid.addEventListener('scroll', updateArrowState, { passive: true });
  window.addEventListener('resize', updateArrowState);

  const renderGrid = () => {
    const matched = items.filter((item) => {
      if (state.badge && item.badge !== state.badge) return false;
      if (state.visiting && !item.visiting.includes(state.visiting)) return false;
      if (state.interest && !item.interest.includes(state.interest)) return false;
      if (state.club && !item.clubs.includes(state.club)) return false;
      return true;
    });

    grid.textContent = '';
    matched.forEach((item) => grid.append(item.el));
    grid.scrollLeft = 0;

    countBadge.textContent = `Showing ${matched.length} of ${items.length}`;
    emptyState.hidden = matched.length > 0;
    prevBtn.hidden = matched.length === 0;
    nextBtn.hidden = matched.length === 0;

    window.requestAnimationFrame(updateArrowState);
  };

  block.textContent = '';
  block.append(header, filterBar, subBar, stage);
  renderGrid();
}
