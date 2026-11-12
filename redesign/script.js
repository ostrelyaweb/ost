/**
 * OSTRELYA STUDIO — INTERACTION CONTROLLER
 * Restrained, high-performance, accessible JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initSiteHeader();

  // 3. Subtle Hero Parallax (Maximum 6px, respecting prefers-reduced-motion)
  const heroEmblem = document.querySelector('.emblem-stage');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shineToggle = document.querySelector('.hero-motion-toggle');

  if (shineToggle) {
    const emblemWrap = shineToggle.closest('.hero-emblem-wrap');
    for (const light of emblemWrap.querySelectorAll('[data-rim]')) {
      const rim = document.getElementById(light.dataset.rim);
      light.style.offsetPath = `path("${rim.getAttribute('d')}")`;
    }
    shineToggle.hidden = false;
    shineToggle.addEventListener('click', () => {
      const paused = emblemWrap.toggleAttribute('data-shine-paused');
      shineToggle.textContent = paused ? 'Play reflections' : 'Pause reflections';
    });
  }

  if (heroEmblem && !prefersReducedMotion) {
    let ticking = false;
    window.addEventListener('mousemove', (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const { innerWidth, innerHeight } = window;
          const xOffset = ((e.clientX / innerWidth) - 0.5) * 8; // max ±4px
          const yOffset = ((e.clientY / innerHeight) - 0.5) * 8; // max ±4px
          heroEmblem.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // 4. Back to Top Smooth Scroll
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  initEditorialHome();
  initProjectEnquiry();
  initEditorialSections();
  initServicesPage();

  // 6. Interactive Full-Screen Service Detail Modal
  initServiceModal();

  // 7. Services Section Custom Follower Cursor (Ostrelya Logo Mark)
  initServicesCustomCursor();
});

function initSiteHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const root = document.documentElement;
  const menuButton = document.getElementById('mobileToggle');
  const menu = document.getElementById('mobileMenu');
  let turningPoint = Math.max(0, window.scrollY);
  let compact = false;
  let scrollFrame = 0;

  function updateHeader() {
    scrollFrame = 0;
    const position = Math.max(0, window.scrollY);

    if (position <= 16 || root.classList.contains('studio-intro') || menu.classList.contains('open')) {
      compact = false;
      turningPoint = position;
    } else if (compact) {
      turningPoint = Math.max(turningPoint, position);
      if (turningPoint - position >= 14) {
        compact = false;
        turningPoint = position;
      }
    } else {
      turningPoint = Math.min(turningPoint, position);
      if (position >= 52 && position - turningPoint >= 14) {
        compact = true;
        turningPoint = position;
      }
    }

    header.classList.toggle('is-compact', compact);
  }

  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateHeader);
  }, { passive: true });

  function setMenuOpen(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.classList.toggle('active', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    menu.classList.toggle('open', open);
    if (open) updateHeader();
  }

  menuButton.addEventListener('click', () => setMenuOpen(!menu.classList.contains('open')));
  header.addEventListener('click', (event) => {
    if (event.target.closest('a') && menu.classList.contains('open')) setMenuOpen(false);
  });
  matchMedia('(max-width: 768px)').addEventListener('change', () => setMenuOpen(false));

  function finishIntro() {
    root.classList.remove('studio-intro');
    document.removeEventListener('focusin', finishIntro);
  }

  if (root.classList.contains('studio-intro')) {
    header.addEventListener('animationend', (event) => {
      if (event.animationName === 'intro-backdrop') finishIntro();
    });
    document.addEventListener('focusin', finishIntro);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (root.classList.contains('studio-intro')) finishIntro();
    if (menu.classList.contains('open')) {
      setMenuOpen(false);
      menuButton.focus();
    }
  });
}

function initEditorialHome() {
  const work = document.querySelector('.editorial-work');
  if (!work) return;

  const choices = Array.from(work.querySelectorAll('.project-choice'));
  const projects = choices.map((choice) => document.getElementById(choice.getAttribute('aria-controls')));
  const detailButtons = work.querySelectorAll('.project-open');
  const previewButton = work.querySelector('.project-preview');
  const detailDialog = document.getElementById('work-detail-dialog');
  const prototypeLink = document.getElementById('work-detail-prototype');
  const coverStage = work.querySelector('.selected-projects');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeIndex = 0;
  let previewIndex = projects.length - 1;

  function selectProject(index) {
    if (index === activeIndex) return;

    if (!reduceMotion.matches) {
      coverStage.querySelector('.project-cover-outgoing')?.remove();
      const outgoing = projects[activeIndex].querySelector('.project-cover').cloneNode(true);
      outgoing.classList.add('project-cover-outgoing');
      outgoing.setAttribute('aria-hidden', 'true');
      outgoing.addEventListener('animationend', () => outgoing.remove(), { once: true });
      coverStage.append(outgoing);
    }

    activeIndex = index;
    choices.forEach((choice, position) => {
      const selected = position === index;
      choice.setAttribute('aria-pressed', String(selected));
      detailButtons[position].hidden = !selected;
      projects[position].hidden = !selected;
    });

    previewIndex = (index + projects.length - 1) % projects.length;
    previewButton.querySelector('img').src = projects[previewIndex].querySelector('img').src;
    previewButton.setAttribute('aria-label', `Select ${choices[previewIndex].textContent}`);
  }

  choices.forEach((choice, index) => {
    choice.addEventListener('click', () => selectProject(index));
  });
  previewButton.addEventListener('click', () => selectProject(previewIndex));

  const requestedProject = new URLSearchParams(location.search).get('project');
  const requestedIndex = projects.findIndex((project) => project.id === `project-${requestedProject}`);
  if (requestedIndex >= 0) selectProject(requestedIndex);

  detailButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const project = projects[index];
      document.getElementById('work-detail-title').textContent = project.querySelector('h3').textContent;
      const category = project.querySelector('figcaption p').textContent;
      document.getElementById('work-detail-category').textContent = project.dataset.prototype ? `Studio concept · ${category}` : category;
      document.getElementById('work-detail-description').textContent = project.dataset.description;
      prototypeLink.hidden = !project.dataset.prototype;
      if (project.dataset.prototype) prototypeLink.href = project.dataset.prototype;
      document.getElementById('work-detail-preview').replaceChildren(project.querySelector('.project-cover').cloneNode(true));
      detailDialog.showModal();
    });
  });

  initServiceExamples(reduceMotion);
}

function initProjectEnquiry() {
  const enquiryLinks = document.querySelectorAll('#project-enquiry, [data-project-enquiry]');
  const enquiryDialog = document.getElementById('project-enquiry-dialog');
  if (enquiryDialog) {
    for (const link of enquiryLinks) {
      link.addEventListener('click', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        event.preventDefault();
        enquiryDialog.showModal();
      });
    }
  }

  for (const form of document.querySelectorAll('[data-enquiry-form]')) {
    form.hidden = false;
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[role="status"]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (button.disabled) return;
      const fields = Object.fromEntries(new FormData(form));
      button.disabled = true;
      status.textContent = form.dataset.pending;
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...fields, page: location.pathname, locale: form.dataset.locale }),
          signal: AbortSignal.timeout(12000),
        });
        if (response.status === 202 && (await response.json()).accepted) {
          status.textContent = form.dataset.success;
          form.reset();
        } else {
          status.textContent = response.status === 429 ? form.dataset.rate : form.dataset.failure;
        }
      } catch {
        status.textContent = form.dataset.failure;
      } finally {
        button.disabled = false;
      }
    });
  }
}

function initEditorialSections() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const reveal = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('editorial-revealed');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: .25 });
    document.querySelectorAll('[data-editorial-reveal]').forEach((heading) => reveal.observe(heading));
  }

  const track = document.querySelector('.editorial-process-track');
  if (!track) return;
  const steps = Array.from(track.children);
  const vertical = window.matchMedia('(max-width: 760px)');
  let frame = 0;

  function updateProcess() {
    frame = 0;
    if (reduceMotion.matches) {
      track.style.setProperty('--process-progress', '0%');
      steps.forEach((step) => step.classList.remove('is-reached'));
      return;
    }

    const bounds = track.getBoundingClientRect();
    const travel = Math.max(bounds.height, window.innerHeight * .5);
    const progress = Math.max(0, Math.min(1, (window.innerHeight * .78 - bounds.top) / travel));
    track.style.setProperty('--process-progress', `${progress * 100}%`);

    for (const step of steps) {
      const offset = vertical.matches ? step.offsetTop / bounds.height : step.offsetLeft / bounds.width;
      step.classList.toggle('is-reached', progress >= offset);
    }
  }

  function requestProcessUpdate() {
    if (!frame) frame = requestAnimationFrame(updateProcess);
  }

  window.addEventListener('scroll', requestProcessUpdate, { passive: true });
  window.addEventListener('resize', requestProcessUpdate);
  reduceMotion.addEventListener('change', requestProcessUpdate);
  requestProcessUpdate();
}

function initServicesPage() {
  const index = document.querySelector('.services-project-paths');
  if (!index) return;

  function openService(hash) {
    const service = document.getElementById(hash.slice(1));
    if (service?.matches('.services-disciplines details')) service.open = true;
  }

  index.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link) openService(link.hash);
  });
  window.addEventListener('hashchange', () => openService(location.hash));
  if (matchMedia('(min-width: 761px)').matches && (!location.hash || location.hash === '#disciplines')) {
    openService('#strategy');
  }
  openService(location.hash);
}

function initServiceExamples(reduceMotion) {
  const widths = document.querySelector('.example-view-controls');
  const viewport = document.querySelector('.example-viewport');
  const widthButtons = widths.querySelectorAll('button');
  widths.hidden = false;

  widthButtons.forEach((button) => {
    button.addEventListener('click', () => {
      viewport.dataset.exampleLayout = button.dataset.exampleWidth;
      widthButtons.forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)));
    });
  });

  const replay = document.querySelector('.example-replay');
  const frame = document.getElementById('loader-example-frame');
  const poster = document.querySelector('.loader-example-poster');
  const header = document.querySelector('.site-header').cloneNode(true);
  const stylesheets = Array.from(document.querySelectorAll('head link[rel="stylesheet"]'))
    .map((link) => link.outerHTML).join('');
  header.classList.remove('is-compact');
  header.setAttribute('inert', '');
  replay.hidden = false;

  replay.addEventListener('click', () => {
    const intro = reduceMotion.matches ? '' : ' studio-intro';
    frame.srcdoc = `<!doctype html>
      <html lang="en" class="loader-demo-page${intro}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Ostrelya intro</title>
          ${stylesheets}
        </head>
        <body>${header.outerHTML}<p class="loader-example-heading">Design with direction.</p></body>
      </html>`;
    poster.hidden = true;
    frame.hidden = false;
    replay.querySelector('span').textContent = 'Replay intro';
  });
}

/**
 * 6. INTERACTIVE FULL-SCREEN SERVICE DETAIL MODAL
 */
function initServiceModal() {
  const modalOverlay = document.getElementById('serviceModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalPrevBtn = document.getElementById('modalPrevBtn');
  const modalNextBtn = document.getElementById('modalNextBtn');
  const modalPrevLabel = document.getElementById('modalPrevLabel');
  const modalNextLabel = document.getElementById('modalNextLabel');
  const modalCtaBtn = document.getElementById('modalCtaBtn');
  const modalBodyScroll = document.querySelector('.modal-body-scroll');

  const modalIndex = document.getElementById('modalServiceIndex');
  const modalTag = document.getElementById('modalServiceTag');
  const modalTitle = document.getElementById('modalServiceTitle');
  const modalTagline = document.getElementById('modalServiceTagline');
  const modalNarrative = document.getElementById('modalServiceNarrative');
  const modalDeliverablesList = document.getElementById('modalDeliverablesList');
  const modalBadgesGrid = document.getElementById('modalBadgesGrid');
  const modalOutcomeText = document.getElementById('modalOutcomeText');

  const serviceElements = document.querySelectorAll('.service-row, .service-card');

  if (!modalOverlay || !serviceElements.length) return;

  // 1. Concise version for index.html ("sažeta verzija" with overview summaries and core highlights)
  const CONCISE_SERVICES_DATA = [
    {
      num: "01",
      tag: "DISCIPLINE OVERVIEW",
      title: "Brand Strategy",
      tagline: "Positioning, creative direction and strategic market clarity.",
      narrative: [
        "We establish why your brand exists, uncover audience blindspots, and shape a crystalline commercial foundation that commands premium trust and eliminates price competition."
      ],
      deliverables: [
        "Market Landscape & Blindspot Audit",
        "Brand Positioning & Value Matrix",
        "Strategic Narrative & Art Direction"
      ],
      standards: [
        "Audience Mapping", "Brand Architecture", "Value Engineering"
      ],
      outcome: "A definitive market position that commands authority and aligns your entire digital presence."
    },
    {
      num: "02",
      tag: "DISCIPLINE OVERVIEW",
      title: "Web Design",
      tagline: "Swiss editorial precision meets responsive digital craft.",
      narrative: [
        "Bespoke digital flagships engineered with architectural restraint. Every typographic hierarchy, grid alignment, and negative space is calculated for effortless legibility and prestige visual power."
      ],
      deliverables: [
        "Bespoke Responsive Layouts (Mobile & Desktop)",
        "Comprehensive Design Systems & Tokens",
        "Interactive Clickable Prototypes & Specs"
      ],
      standards: [
        "Figma Systems", "Design Tokens", "Prestige Editorial"
      ],
      outcome: "A visually arresting online flagship that elevates brand perception and drives qualified inquiries."
    },
    {
      num: "03",
      tag: "DISCIPLINE OVERVIEW",
      title: "Web Development",
      tagline: "Lightning-fast static performance with zero framework bloat.",
      narrative: [
        "Modern, ultra-lightweight static engineering deployed globally across edge CDNs. We score 95-100 on Google Lighthouse, eliminate CMS vulnerabilities, and guarantee sub-second page loads."
      ],
      deliverables: [
        "100/100 Google Lighthouse Optimization",
        "Semantic HTML5 & Hardware-Accelerated JS",
        "Global Edge CDN Deployment & Automated SSL"
      ],
      standards: [
        "Jamstack", "Edge Networks", "Lighthouse 100"
      ],
      outcome: "Sub-second page loads, zero plugin breakage or hosting maintenance costs, and top organic search visibility."
    },
    {
      num: "04",
      tag: "DISCIPLINE OVERVIEW",
      title: "Motion & Interaction",
      tagline: "Purposeful movement that makes digital spaces feel alive.",
      narrative: [
        "Hardware-accelerated kinetic typography, tactile hover feedback, and smooth scroll-driven curves running at 60 FPS on GPU. Movement that guides attention and rewards exploration without decorative noise."
      ],
      deliverables: [
        "Dynamic Bézier SVG Trajectories & Needle Tracers",
        "Tactile Hover Feedback & RAF Micro-Physics",
        "Full Prefers-Reduced-Motion Accessibility"
      ],
      standards: [
        "GPU Transform3D", "RAF Physics", "Reduced Motion"
      ],
      outcome: "An immersive, tactile user journey that increases dwell time, builds emotional resonance, and leaves a lasting impression."
    }
  ];

  // 2. Full deep-dive version for services.html ("full verzija" with exhaustive specifications, 6 disciplines)
  const FULL_SERVICES_DATA = [
    {
      num: "01",
      tag: "FULL SPECIFICATION",
      title: "Brand Strategy",
      tagline: "Architecting the foundation for ambitious digital brands.",
      narrative: [
        "Before writing a line of code or designing a wireframe, we establish why your brand exists and how it should win. Strategy transforms websites from standard digital brochures into authoritative commercial assets.",
        "We analyze your competitive landscape, uncover audience expectations, and articulate a crystalline positioning matrix. The result is a unified commercial foundation that commands premium trust and eliminates price competition."
      ],
      deliverables: [
        "Market Landscape & Competitor Blindspot Audit",
        "Brand Positioning Architecture & Value Matrix",
        "Tone of Voice & Strategic Narrative Guidelines",
        "Art Direction & Creative Atmosphere Direction",
        "Digital Conversion Roadmap & Information Hierarchy"
      ],
      standards: [
        "Audience Mapping", "Competitive Audit", "Brand Architecture", "Information Flow", "Value Engineering"
      ],
      outcome: "A definitive market position that commands authority, builds enduring credibility, and aligns your entire digital presence."
    },
    {
      num: "02",
      tag: "FULL SPECIFICATION",
      title: "Web Design",
      tagline: "Swiss editorial precision meets responsive digital craft.",
      narrative: [
        "We craft bespoke digital flagships with architectural restraint and visual power. No generic templates, no cookie-cutter themes—every typographic hierarchy, whitespace ratio, grid alignment, and negative space is calculated.",
        "Our work focuses relentlessly on user clarity, legibility, and natural intuitive momentum. We create websites that read like prestige publications: sophisticated, memorable, and effortless to navigate across all devices."
      ],
      deliverables: [
        "Information Architecture & User Flow Mapping",
        "Bespoke Responsive Layouts (Mobile, Tablet, Desktop)",
        "Comprehensive Design Systems & Component Tokens",
        "Interactive Clickable Prototypes & Motion Specs",
        "High-Fidelity Production Asset Packages"
      ],
      standards: [
        "Figma Systems", "Design Tokens", "Mobile-First UX", "WCAG 2.1 AA", "Swiss Asymmetry", "Prestige Editorial"
      ],
      outcome: "A visually arresting online flagship that elevates brand perception, captivates discerning clients, and significantly drives qualified inquiries."
    },
    {
      num: "03",
      tag: "FULL SPECIFICATION",
      title: "Web Development",
      tagline: "Lightning-fast static performance with zero framework bloat.",
      narrative: [
        "A brilliant design is only as strong as its technical foundation. We build modern, lightweight static websites that load instantaneously, score 95-100 on Google Lighthouse, and avoid the security risks and bloat of slow CMS systems.",
        "Deployed globally across edge CDNs, our sites require zero maintenance headaches, deliver enterprise uptime, and offer clean, semantic code that search engine algorithms favor for top organic rankings."
      ],
      deliverables: [
        "100/100 Google Lighthouse Speed & Best Practices",
        "Semantic HTML5, Modular CSS3 & Hardware-Accelerated JS",
        "Automated Edge CDN Deployment (Netlify / Vercel)",
        "Enterprise SSL, Custom Domain & Resilient Forms",
        "On-Page Technical SEO & Schema Structured Data"
      ],
      standards: [
        "Jamstack", "Astro / Next.js", "Edge Networks", "Zero Plugin Bloat", "Lighthouse 100", "Clean Semantics"
      ],
      outcome: "Sub-second page loads, zero plugin breakage or hosting maintenance costs, and an impregnable foundation for search visibility."
    },
    {
      num: "04",
      tag: "FULL SPECIFICATION",
      title: "Motion & Interaction",
      tagline: "Purposeful movement that makes digital spaces feel alive.",
      narrative: [
        "Motion in our work is never decorative noise—it is architectural punctuation. We implement smooth scroll-driven curves, kinetic typography, and tactile hover feedback that guide attention and reward user exploration.",
        "All animations are hardware-accelerated (60 FPS on GPU), ultra-lightweight, and strictly adhere to accessibility guidelines including full prefers-reduced-motion fallbacks."
      ],
      deliverables: [
        "Dynamic Bézier SVG Trajectories & Scroll Tracers",
        "Hardware-Accelerated RAF Physics & Hover Micro-States",
        "Kinetic Header & Progress Bar Fluid Transitions",
        "Prefers-Reduced-Motion Accessibility Conformance",
        "Custom SVG Line-Art & Interactive Geometry"
      ],
      standards: [
        "RequestAnimationFrame", "GPU Transform3D", "SVG Path Math", "CSS Custom Properties", "Reduced Motion"
      ],
      outcome: "An immersive, tactile user journey that increases dwell time, builds emotional resonance, and leaves an unforgettable impression."
    },
    {
      num: "05",
      tag: "FULL SPECIFICATION",
      title: "Content Systems",
      tagline: "Modular architectures that empower dynamic storytelling and rapid scale.",
      narrative: [
        "Content should never be constrained by rigid code or fragmented tools. We build streamlined, component-based editorial systems that give marketing and creative teams absolute freedom to publish without sacrificing design integrity or performance.",
        "From headless CMS integrations to modular block architecture, every component is engineered to maintain typographic balance, brand coherence, and sub-second page rendering across every global touchpoint."
      ],
      deliverables: [
        "Headless CMS Architecture (Sanity / Strapi / Contentful)",
        "Modular Content Schema & Component Block Library",
        "Automated Asset Optimization & Edge Delivery Pipeline",
        "Editorial Workflow & Role-Based Governance",
        "Multi-Language & Localization Architecture"
      ],
      standards: [
        "Headless CMS", "Structured Data", "Modular Blocks", "Editorial UX", "Global Edge CDN", "Brand Governance"
      ],
      outcome: "Empowered internal teams with zero developer dependencies for daily publishing, while guaranteeing 100% brand fidelity and rock-solid performance."
    },
    {
      num: "06",
      tag: "FULL SPECIFICATION",
      title: "Ongoing Support",
      tagline: "Strategic evolution and technical stewardship for continuous market leadership.",
      narrative: [
        "Launching your flagship digital experience is only day one. As your market evolves, your platform must adapt with agility. We act as your dedicated digital partner, continuously refining performance, expanding features, and elevating visual craft.",
        "Our ongoing retainer ensures high-priority response times, proactive security audits, Lighthouse performance monitoring, and iterative CRO enhancements that compound your commercial return month over month."
      ],
      deliverables: [
        "Proactive 99.9% Uptime & Lighthouse Monitoring",
        "Conversion Rate Optimization & Micro-Iterative Sprints",
        "Quarterly UX/UI Enhancements & Component Expansion",
        "Priority Technical Engineering & Edge Maintenance",
        "SEO Authority Tracking & Performance Audits"
      ],
      standards: [
        "Continuous Delivery", "Lighthouse SLA", "Security Audits", "CRO Analytics", "Retainer Agility", "Edge Health"
      ],
      outcome: "A perpetually optimized digital flagship that compounds in value, maintains peak technical health, and never becomes outdated."
    }
  ];

  // If on services.html (has .service-card elements), use the full version; otherwise on index.html use concise version
  const isServicesPage = document.querySelectorAll('.service-card').length > 0;
  const SERVICES_DATA = isServicesPage ? FULL_SERVICES_DATA : CONCISE_SERVICES_DATA;

  let currentServiceIndex = 0;
  let lastFocusedElement = null;
  let isSwitching = false;

  function applyServiceData(index) {
    currentServiceIndex = index;
    const data = SERVICES_DATA[index];
    if (!data) return;

    const totalCount = String(SERVICES_DATA.length).padStart(2, '0');
    if (modalIndex) modalIndex.textContent = `${data.num} / ${totalCount}`;
    if (modalTag) modalTag.textContent = data.tag;
    if (modalTitle) modalTitle.textContent = data.title;
    if (modalTagline) modalTagline.textContent = data.tagline;

    if (modalNarrative) {
      modalNarrative.innerHTML = data.narrative.map(p => `<p>${p}</p>`).join('');
    }

    if (modalDeliverablesList) {
      modalDeliverablesList.innerHTML = data.deliverables.map(item => `
        <li class="deliverable-item">
          <span class="check-circle" aria-hidden="true">✓</span>
          <span>${item}</span>
        </li>
      `).join('');
    }

    const modalSpecTitle = document.getElementById('modalSpecTitle');
    if (modalSpecTitle) {
      modalSpecTitle.textContent = isServicesPage ? 'Core Deliverables' : 'Key Highlights';
    }

    if (modalBadgesGrid) {
      modalBadgesGrid.innerHTML = data.standards.map(tag => `
        <span class="tag-pill">${tag}</span>
      `).join('');
    }

    if (modalOutcomeText) {
      modalOutcomeText.textContent = data.outcome;
    }

    // Dynamic link to deep-dive service in services.html
    const modalLearnMoreBtn = document.getElementById('modalLearnMoreBtn');
    if (modalLearnMoreBtn) {
      modalLearnMoreBtn.href = `/services/?service=${index + 1}`;
    }
    const modalFullScopeLink = document.getElementById('modalFullScopeLink');
    if (modalFullScopeLink) {
      modalFullScopeLink.href = `/services/?service=${index + 1}`;
    }

    // Update Prev / Next Labels
    const prevIndex = (index - 1 + SERVICES_DATA.length) % SERVICES_DATA.length;
    const nextIndex = (index + 1) % SERVICES_DATA.length;
    if (modalPrevLabel) modalPrevLabel.textContent = `${SERVICES_DATA[prevIndex].num} ${SERVICES_DATA[prevIndex].title}`;
    if (modalNextLabel) modalNextLabel.textContent = `${SERVICES_DATA[nextIndex].num} ${SERVICES_DATA[nextIndex].title}`;
  }

  function renderService(index, animate = false) {
    if (animate && modalBodyScroll) {
      if (isSwitching) return;
      isSwitching = true;
      modalBodyScroll.classList.add('is-switching');
      setTimeout(() => {
        applyServiceData(index);
        modalBodyScroll.scrollTop = 0;
        requestAnimationFrame(() => {
          modalBodyScroll.classList.remove('is-switching');
          setTimeout(() => {
            isSwitching = false;
          }, 180);
        });
      }, 120);
    } else {
      applyServiceData(index);
      if (modalBodyScroll) {
        modalBodyScroll.scrollTop = 0;
      }
    }
  }

  function openModal(index, clickedElement = null) {
    lastFocusedElement = document.activeElement;

    // Tactile item feedback: micro-scale, arrow translation & tinted glow
    const targetItem = clickedElement || (serviceElements && serviceElements[index]);
    if (targetItem && targetItem.classList) {
      targetItem.classList.add('is-clicked');
      setTimeout(() => {
        targetItem.classList.remove('is-clicked');
      }, 350);
    }

    // Soft dissolving pulse for custom cursor instead of abrupt disappearance
    const customCursor = document.getElementById('servicesCustomCursor');
    if (customCursor) {
      customCursor.classList.remove('is-active');
      customCursor.classList.add('is-dissolving');
      setTimeout(() => {
        customCursor.classList.remove('is-dissolving');
        customCursor.classList.add('is-leaving');
      }, 180);
    }

    renderService(index, false);
    modalOverlay.classList.add('is-open');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus close button for accessibility
    setTimeout(() => {
      if (modalCloseBtn) modalCloseBtn.focus();
    }, 50);
  }

  // Expose openModal globally for external triggers (e.g., Brand Strategy Mark)
  window.openServiceModalByIndex = openModal;

  function closeModal() {
    modalOverlay.classList.remove('is-open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Reset cursor transition states
    const customCursor = document.getElementById('servicesCustomCursor');
    if (customCursor) {
      customCursor.classList.remove('is-dissolving');
      customCursor.classList.remove('is-leaving');
    }

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  // Bind service items (rows on index.html, cards on services.html)
  serviceElements.forEach(item => {
    const serviceNumAttr = item.getAttribute('data-service');
    const serviceIdx = serviceNumAttr ? parseInt(serviceNumAttr, 10) - 1 : 0;

    item.addEventListener('click', () => {
      openModal(serviceIdx, item);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(serviceIdx, item);
      }
    });
  });

  // Close handlers
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', () => {
      closeModal();
    });
  }

  // Click outside dialog window closes modal
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Prev / Next button handlers with silky crossfade
  if (modalPrevBtn) {
    modalPrevBtn.addEventListener('click', () => {
      const newIdx = (currentServiceIndex - 1 + SERVICES_DATA.length) % SERVICES_DATA.length;
      renderService(newIdx, true);
    });
  }

  if (modalNextBtn) {
    modalNextBtn.addEventListener('click', () => {
      const newIdx = (currentServiceIndex + 1) % SERVICES_DATA.length;
      renderService(newIdx, true);
    });
  }

  // CTA button inside modal scrolls to contact
  if (modalCtaBtn) {
    modalCtaBtn.addEventListener('click', (e) => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        e.preventDefault();
        closeModal();
        setTimeout(() => {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        // Page does not contain #contact (e.g. services.html)
        closeModal();
      }
    });
  }

  // Global Keyboard shortcuts when modal is open
  window.addEventListener('keydown', (e) => {
    if (!modalOverlay.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newIdx = (currentServiceIndex - 1 + SERVICES_DATA.length) % SERVICES_DATA.length;
      renderService(newIdx, true);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newIdx = (currentServiceIndex + 1) % SERVICES_DATA.length;
      renderService(newIdx, true);
    }
  });

  // URL deep-linking: If opened with ?service=X (e.g. from index.html concise modal), open full modal automatically
  const urlParams = new URLSearchParams(window.location.search);
  const serviceParam = urlParams.get('service');
  if (serviceParam && isServicesPage) {
    const sIdx = parseInt(serviceParam, 10) - 1;
    if (sIdx >= 0 && sIdx < SERVICES_DATA.length) {
      setTimeout(() => {
        openModal(sIdx);
      }, 350);
    }
  }
}

/**
 * 7. SERVICES TRUE CUSTOM CURSOR (Ostrelya Logo + "Explore ↗")
 * Replaces native cursor over service rows with bespoke agency cursor lockup
 * Smooth inertia lerping, instant row-to-row continuity, tactile click press
 */
function initServicesCustomCursor() {
  const servicesContainer = document.querySelector('.services-list, .services-grid');
  const serviceItems = document.querySelectorAll('.service-row, .service-card');
  const cursorEl = document.getElementById('servicesCustomCursor');
  const modalOverlay = document.getElementById('serviceModal');

  if (!servicesContainer || !cursorEl || !serviceItems.length) return;

  // Touch & mobile guard: only run on desktop devices with precision pointer
  if (window.innerWidth <= 860 || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return;
  }

  // Accessibility: respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const OFFSET_X = 16;
  const OFFSET_Y = 16;
  const LERP_FACTOR = 0.22; // Responsive, silky smooth inertia without lag

  let mouseX = -200;
  let mouseY = -200;
  let targetX = -200;
  let targetY = -200;
  let currentX = -200;
  let currentY = -200;

  let isInside = false;
  let isPressed = false;
  let isLoopRunning = false;
  let rafId = null;

  function updateCursor() {
    currentX += (targetX - currentX) * LERP_FACTOR;
    currentY += (targetY - currentY) * LERP_FACTOR;

    cursorEl.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0)`;

    const deltaX = Math.abs(targetX - currentX);
    const deltaY = Math.abs(targetY - currentY);

    if (isInside || deltaX > 0.1 || deltaY > 0.1) {
      rafId = requestAnimationFrame(updateCursor);
      isLoopRunning = true;
    } else {
      isLoopRunning = false;
      rafId = null;
    }
  }

  function startLoop() {
    if (!isLoopRunning) {
      isLoopRunning = true;
      rafId = requestAnimationFrame(updateCursor);
    }
  }

  function activateCursor(e) {
    if (modalOverlay && modalOverlay.classList.contains('is-open')) return;

    mouseX = e.clientX;
    mouseY = e.clientY;
    targetX = mouseX + OFFSET_X;
    targetY = mouseY + OFFSET_Y;

    if (!isInside) {
      isInside = true;
      // Start position right near the pointer instead of flying across screen
      currentX = targetX;
      currentY = targetY;
      cursorEl.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0)`;
      cursorEl.classList.remove('is-leaving');
      cursorEl.classList.add('is-active');

      const hoveredItem = e.target ? e.target.closest('.service-row, .service-card') : null;
      if (hoveredItem) {
        const serviceIndex = hoveredItem.getAttribute('data-service');
        cursorEl.setAttribute('data-active-service', serviceIndex);
      }
    }

    startLoop();
  }

  function deactivateCursor() {
    if (!isInside) return;
    isInside = false;
    isPressed = false;
    cursorEl.classList.remove('is-pressed');
    cursorEl.classList.remove('is-active');
    cursorEl.classList.add('is-leaving');
    cursorEl.removeAttribute('data-active-service');
  }

  // Bind directly to servicesContainer so cursor stays alive continuously across all rows/cards
  servicesContainer.addEventListener('mousemove', (e) => {
    if (modalOverlay && modalOverlay.classList.contains('is-open')) {
      if (isInside) deactivateCursor();
      return;
    }

    if (!isInside) {
      activateCursor(e);
    } else {
      mouseX = e.clientX;
      mouseY = e.clientY;
      targetX = mouseX + OFFSET_X;
      targetY = mouseY + OFFSET_Y;
      startLoop();
    }
  }, { passive: true });

  servicesContainer.addEventListener('mouseenter', (e) => {
    activateCursor(e);
  });

  servicesContainer.addEventListener('mouseleave', () => {
    deactivateCursor();
  });

  // Track active service item for subtle micro-state transforms
  serviceItems.forEach(item => {
    const serviceIndex = item.getAttribute('data-service');

    item.addEventListener('mouseenter', () => {
      if (isInside) {
        cursorEl.setAttribute('data-active-service', serviceIndex);
      }
    });
  });

  // Tactile click press feedback
  servicesContainer.addEventListener('mousedown', () => {
    if (isInside) {
      isPressed = true;
      cursorEl.classList.add('is-pressed');
    }
  });

  window.addEventListener('mouseup', () => {
    if (isPressed) {
      isPressed = false;
      cursorEl.classList.remove('is-pressed');
    }
  });

  // Track global mouse position so scroll checks always know exact pointer coordinates
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  // Scroll handler: immediately hides cursor if page is scrolled away while mouse is stationary
  function checkPointerUnderScroll() {
    if (modalOverlay && modalOverlay.classList.contains('is-open')) {
      if (isInside) deactivateCursor();
      return;
    }

    if (mouseX < 0 || mouseY < 0) return;

    const elementUnderPointer = document.elementFromPoint(mouseX, mouseY);
    const isInServices = elementUnderPointer && !!elementUnderPointer.closest('.services-list, .services-grid');

    if (isInside && !isInServices) {
      deactivateCursor();
    } else if (!isInside && isInServices) {
      // Mouse scrolled into services while remaining stationary
      targetX = mouseX + OFFSET_X;
      targetY = mouseY + OFFSET_Y;
      currentX = targetX;
      currentY = targetY;
      cursorEl.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0)`;
      cursorEl.classList.remove('is-leaving');
      cursorEl.classList.add('is-active');
      isInside = true;

      const hoveredItem = elementUnderPointer.closest('.service-row, .service-card');
      if (hoveredItem) {
        cursorEl.setAttribute('data-active-service', hoveredItem.getAttribute('data-service'));
      }
      startLoop();
    } else if (isInside && isInServices) {
      // Scrolled between items while stationary
      const hoveredItem = elementUnderPointer.closest('.service-row, .service-card');
      if (hoveredItem) {
        cursorEl.setAttribute('data-active-service', hoveredItem.getAttribute('data-service'));
      }
    }
  }

  let scrollRafId = null;
  window.addEventListener('scroll', () => {
    if (scrollRafId) return;
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = null;
      checkPointerUnderScroll();
    });
  }, { passive: true });

  // Edge cases
  window.addEventListener('blur', deactivateCursor);
  document.addEventListener('mouseleave', deactivateCursor);
}
