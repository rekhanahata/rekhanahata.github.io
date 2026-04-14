// Shared UI behavior for home and project pages.
document.addEventListener("DOMContentLoaded", () => {
  setCurrentYear();
  initTheme();
  initRevealAnimations();
  initContactForm();
  initProjectPages();
});

function setCurrentYear() {
  const yearEl = document.querySelector("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function initTheme() {
  const root = document.documentElement;
  const toggles = document.querySelectorAll(".theme-toggle");
  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const current = stored || (prefersDark ? "dark" : "light");

  setTheme(current);

  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next);
      localStorage.setItem("theme", next);
    });
  });

  function setTheme(value) {
    root.setAttribute("data-theme", value);
    toggles.forEach((btn) => {
      btn.textContent = value === "dark" ? "Light" : "Dark";
    });
  }
}

function initRevealAnimations() {
  const elements = document.querySelectorAll(".fade-in");
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  elements.forEach((el) => observer.observe(el));
}

function initContactForm() {
  const form = document.querySelector("#contact-form");
  const status = document.querySelector("#contact-status");
  if (!form || !status) return;
  const submitBtn = form.querySelector('button[type="submit"]');
  const defaultBtnLabel = submitBtn ? submitBtn.textContent : "Submit";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      status.dataset.state = "error";
      status.textContent = "Please complete all required fields.";
      return;
    }

    const formData = new FormData(form);
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }
    status.dataset.state = "";
    status.textContent = "Sending your message...";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (response.ok) {
        status.dataset.state = "success";
        status.textContent = "Thanks, your message has been sent.";
        form.reset();
        return;
      }

      const data = await response.json().catch(() => null);
      if (data && Array.isArray(data.errors) && data.errors.length) {
        status.dataset.state = "error";
        status.textContent = data.errors.map((error) => error.message).join(" ");
      } else {
        status.dataset.state = "error";
        status.textContent = "Unable to send right now. Please try again in a moment.";
      }
    } catch (error) {
      status.dataset.state = "error";
      status.textContent = "Network error while sending. Please try again.";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = defaultBtnLabel;
      }
    }
  });
}

function initProjectPages() {
  const projectRoot = document.querySelector(".project");
  if (!projectRoot) return;

  document.body.classList.add("project-page");
  injectThemeToggleOnProjectPage();
  const backLink = document.querySelector(".header a");
  if (backLink) backLink.setAttribute("href", "../index.html#work");

  const titleEl = projectRoot.querySelector("h1");
  const gallery = projectRoot.querySelector(".gallery");
  if (!titleEl || !gallery) return;

  // Pull year from title text where available (e.g., "Recipe Book 2020").
  const rawTitle = titleEl.textContent.trim();
  const yearMatch = rawTitle.match(/\b(19|20)\d{2}\b$/);
  const cleanTitle = rawTitle.replace(/\s*\b(19|20)\d{2}\b$/, "").trim();
  titleEl.textContent = cleanTitle || rawTitle;

  if (yearMatch) {
    const yearText = document.createElement("p");
    yearText.className = "project-year";
    yearText.textContent = yearMatch[0];
    titleEl.insertAdjacentElement("afterend", yearText);
  }

  // Source project pages do not include written descriptions, so we add a factual note.
  const description = document.createElement("p");
  description.className = "project-description";
  description.textContent = "Original portfolio entry. The source page did not include a written project description.";
  if (yearMatch) {
    titleEl.nextElementSibling?.insertAdjacentElement("afterend", description);
  } else {
    titleEl.insertAdjacentElement("afterend", description);
  }

  const imageButtons = [];
  const images = [...gallery.querySelectorAll("img")];
  images.forEach((img, index) => {
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = img.alt || `${cleanTitle} image ${index + 1}`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-item fade-in";
    button.setAttribute("aria-label", `Open image ${index + 1} of ${cleanTitle}`);
    img.replaceWith(button);
    button.appendChild(img);
    imageButtons.push(button);
  });

  initRevealAnimations();
  initLightbox(imageButtons);
}

function injectThemeToggleOnProjectPage() {
  const header = document.querySelector(".header");
  if (!header || header.querySelector(".theme-toggle")) return;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "theme-toggle";
  toggle.setAttribute("aria-label", "Toggle color theme");
  toggle.textContent = "Dark";
  header.appendChild(toggle);

  initTheme();
}

function initLightbox(items) {
  if (!items.length) return;

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <div class="lightbox-toolbar">
      <p class="lightbox-counter" aria-live="polite"></p>
      <div class="lightbox-actions">
        <button class="lightbox-btn js-zoom" type="button" aria-label="Toggle zoom">+</button>
        <button class="lightbox-btn js-close" type="button" aria-label="Close lightbox">✕</button>
      </div>
    </div>
    <div class="lightbox-stage">
      <button class="lightbox-btn lightbox-nav prev js-prev" type="button" aria-label="Previous image">←</button>
      <img class="lightbox-image" alt="">
      <button class="lightbox-btn lightbox-nav next js-next" type="button" aria-label="Next image">→</button>
    </div>
    <p class="lightbox-help">Use arrow keys for navigation, +/- for zoom, and Esc to close.</p>
  `;
  document.body.appendChild(lightbox);

  const imgEl = lightbox.querySelector(".lightbox-image");
  const counter = lightbox.querySelector(".lightbox-counter");
  const zoomBtn = lightbox.querySelector(".js-zoom");
  const closeBtn = lightbox.querySelector(".js-close");
  const prevBtn = lightbox.querySelector(".js-prev");
  const nextBtn = lightbox.querySelector(".js-next");

  let index = 0;
  let zoom = 1;

  const update = () => {
    const sourceImage = items[index].querySelector("img");
    imgEl.src = sourceImage.currentSrc || sourceImage.src;
    imgEl.alt = sourceImage.alt;
    counter.textContent = `${index + 1} / ${items.length}`;
    setZoom(1);
  };

  const setZoom = (value) => {
    zoom = Math.min(3, Math.max(1, value));
    imgEl.style.transform = `scale(${zoom})`;
    zoomBtn.textContent = zoom > 1 ? "−" : "+";
    zoomBtn.setAttribute("aria-label", zoom > 1 ? "Reset zoom" : "Zoom image");
  };

  const open = (nextIndex) => {
    index = nextIndex;
    update();
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  };

  const close = () => {
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setZoom(1);
  };

  const goPrev = () => {
    index = (index - 1 + items.length) % items.length;
    update();
  };

  const goNext = () => {
    index = (index + 1) % items.length;
    update();
  };

  items.forEach((item, itemIndex) => {
    item.addEventListener("click", () => open(itemIndex));
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", goPrev);
  nextBtn.addEventListener("click", goNext);
  zoomBtn.addEventListener("click", () => setZoom(zoom > 1 ? 1 : 2));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  imgEl.addEventListener("wheel", (event) => {
    event.preventDefault();
    const next = zoom + (event.deltaY < 0 ? 0.25 : -0.25);
    setZoom(next);
  });

  document.addEventListener("keydown", (event) => {
    if (lightbox.getAttribute("aria-hidden") === "true") return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") goPrev();
    if (event.key === "ArrowRight") goNext();
    if (event.key === "+" || event.key === "=") setZoom(zoom + 0.25);
    if (event.key === "-") setZoom(zoom - 0.25);
  });
}
