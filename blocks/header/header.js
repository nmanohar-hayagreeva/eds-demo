import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

const DEFAULT_UTILITY_LINKS = [
  { label: 'Be a Member', href: 'https://www.safra.sg/membership/applications-renewals' },
  { label: 'Login to m.SAFRA', href: 'https://m.safra.sg/', external: true },
  { label: 'Feedback', href: 'https://m.safra.sg/feedback', external: true },
  { label: 'Volunteer With Us', href: 'https://www.safra.sg/volunteer' },
];

const DEFAULT_CLUBS = [
  { label: 'SAFRA Choa Chu Kang', href: 'https://www.safra.sg/clubs/choa-chu-kang' },
  { label: 'SAFRA Mount Faber', href: 'https://www.safra.sg/clubs/mtfaber' },
  { label: 'SAFRA Jurong', href: 'https://www.safra.sg/clubs/jurong' },
  { label: 'SAFRA Punggol', href: 'https://www.safra.sg/clubs/punggol' },
  { label: 'SAFRA Tampines', href: 'https://www.safra.sg/clubs/tampines' },
  { label: 'SAFRA Toa Payoh', href: 'https://www.safra.sg/clubs/toapayoh' },
  { label: 'SAFRA Yishun', href: 'https://www.safra.sg/clubs/yishun' },
  { label: 'SAFRA@29 Carpenter Street', href: 'https://www.safra.sg/clubs/safra-29-carpenter-street' },
  { label: 'SAFRA@CMPB', href: 'https://www.safra.sg/clubs/safra-cmpb' },
];

function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-drop').forEach((section) => {
    section.setAttribute('aria-expanded', String(expanded));
  });
}

function closeClubsMenu(wrapper) {
  const clubsBtn = wrapper.querySelector('.safra-clubs-toggle');
  if (clubsBtn) clubsBtn.setAttribute('aria-expanded', 'false');
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, false);
  if (button) {
    button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  }
}

function buildUtilityBar(utilityFragmentSection) {
  const bar = document.createElement('div');
  bar.className = 'safra-utility-bar';

  const inner = document.createElement('div');
  inner.className = 'safra-utility-inner';

  const leftList = document.createElement('ul');
  leftList.className = 'safra-utility-links';

  const authoredLinks = utilityFragmentSection
    ? [...utilityFragmentSection.querySelectorAll('a')]
    : [];

  if (authoredLinks.length > 0) {
    authoredLinks.forEach((a) => {
      const li = document.createElement('li');
      li.append(a.cloneNode(true));
      leftList.append(li);
    });
  } else {
    DEFAULT_UTILITY_LINKS.forEach((item) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      if (item.external) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      li.append(a);
      leftList.append(li);
    });
  }

  const rightGroup = document.createElement('div');
  rightGroup.className = 'safra-utility-right';

  const appLink = document.createElement('a');
  appLink.className = 'safra-app-link';
  appLink.href = 'https://www.safra.sg/facilities-services/safra-mobile-app';
  appLink.textContent = 'Get the App';

  const clubsDropdown = document.createElement('div');
  clubsDropdown.className = 'safra-clubs-dropdown';

  const clubsBtn = document.createElement('button');
  clubsBtn.type = 'button';
  clubsBtn.className = 'safra-clubs-toggle';
  clubsBtn.setAttribute('aria-expanded', 'false');
  clubsBtn.setAttribute('aria-haspopup', 'true');
  clubsBtn.innerHTML = '<span>Our Clubs</span><span class="safra-chevron" aria-hidden="true"></span>';

  const clubsList = document.createElement('ul');
  clubsList.className = 'safra-clubs-menu';
  DEFAULT_CLUBS.forEach((club) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = club.href;
    a.textContent = club.label;
    li.append(a);
    clubsList.append(li);
  });

  clubsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = clubsBtn.getAttribute('aria-expanded') === 'true';
    clubsBtn.setAttribute('aria-expanded', String(!isOpen));
  });

  clubsDropdown.append(clubsBtn, clubsList);
  rightGroup.append(appLink, clubsDropdown);
  inner.append(leftList, rightGroup);
  bar.append(inner);

  return bar;
}

function buildSearchPanel() {
  const panel = document.createElement('div');
  panel.className = 'safra-search-panel';
  panel.setAttribute('aria-hidden', 'true');

  const form = document.createElement('form');
  form.className = 'safra-search-form';
  form.setAttribute('role', 'search');
  form.action = 'https://www.safra.sg/search';
  form.method = 'get';

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'Search within the SAFRA website...';
  input.setAttribute('aria-label', 'Search within the SAFRA website');

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'safra-search-submit';
  submitBtn.textContent = 'Search';

  form.append(input, submitBtn);
  panel.append(form);
  return panel;
}

/**
 * Loads and decorates the SAFRA two-tier header.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';

  const sections = fragment ? [...fragment.children] : [];
  let utilitySection = null;
  let brandSection = null;
  let navLinksSection = null;
  let toolsSection = null;

  if (sections.length >= 4) {
    [utilitySection, brandSection, navLinksSection, toolsSection] = sections;
  } else {
    [brandSection, navLinksSection, toolsSection] = sections;
  }

  // 1. Top red utility bar
  const utilityBar = buildUtilityBar(utilitySection);
  navWrapper.append(utilityBar);

  // 2. Main navigation bar
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // Brand
  const navBrand = brandSection || document.createElement('div');
  navBrand.classList.add('nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-wrapper, .button-container')?.classList.remove('button-wrapper', 'button-container');
  }
  if (!navBrand.textContent.trim() && !navBrand.querySelector('img')) {
    const a = document.createElement('a');
    a.href = '/';
    a.className = 'safra-wordmark';
    a.textContent = 'SAFRA';
    navBrand.append(a);
  }
  nav.append(navBrand);

  // Primary nav sections
  const navSections = navLinksSection || document.createElement('div');
  navSections.classList.add('nav-sections');
  navSections.querySelectorAll(':scope .default-content-wrapper > ul > li, :scope > ul > li').forEach((item) => {
    if (item.querySelector('ul')) {
      item.classList.add('nav-drop');
      item.setAttribute('aria-expanded', 'false');
      item.setAttribute('tabindex', '0');

      item.addEventListener('click', (e) => {
        if (e.target.closest('ul ul')) return;
        const expanded = item.getAttribute('aria-expanded') === 'true';
        if (isDesktop.matches) {
          toggleAllNavSections(navSections, false);
        }
        item.setAttribute('aria-expanded', String(!expanded));
      });

      item.addEventListener('keydown', (e) => {
        if (e.code === 'Enter' || e.code === 'Space') {
          if (e.target !== item) return;
          e.preventDefault();
          const expanded = item.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections, false);
          item.setAttribute('aria-expanded', String(!expanded));
        }
      });
    }
  });
  nav.append(navSections);

  // Tools + Search button
  const navTools = toolsSection || document.createElement('div');
  navTools.classList.add('nav-tools');

  const searchPanel = buildSearchPanel();
  const searchBtn = document.createElement('button');
  searchBtn.type = 'button';
  searchBtn.className = 'safra-search-toggle';
  searchBtn.setAttribute('aria-expanded', 'false');
  searchBtn.setAttribute('aria-label', 'Toggle site search');
  searchBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>`;

  searchBtn.addEventListener('click', () => {
    const isOpen = searchBtn.getAttribute('aria-expanded') === 'true';
    searchBtn.setAttribute('aria-expanded', String(!isOpen));
    searchPanel.setAttribute('aria-hidden', String(isOpen));
    if (!isOpen) {
      searchPanel.querySelector('input')?.focus();
    }
  });

  navTools.append(searchBtn);
  nav.append(navTools);

  // Mobile hamburger
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
    <span class="nav-hamburger-icon"></span>
  </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);

  nav.setAttribute('aria-expanded', 'false');
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  // Global dismiss handlers
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      toggleAllNavSections(navSections, false);
      closeClubsMenu(navWrapper);
      searchBtn.setAttribute('aria-expanded', 'false');
      searchPanel.setAttribute('aria-hidden', 'true');
      if (!isDesktop.matches) toggleMenu(nav, navSections, false);
    }
  });

  document.addEventListener('click', (e) => {
    if (!navWrapper.contains(e.target)) {
      toggleAllNavSections(navSections, false);
      closeClubsMenu(navWrapper);
    }
  });

  // Sticky shadow on scroll
  window.addEventListener('scroll', () => {
    navWrapper.classList.toggle('is-scrolled', window.scrollY > 12);
  }, { passive: true });

  navWrapper.append(nav, searchPanel);
  block.append(navWrapper);
}
