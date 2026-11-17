// Loaded by the browser for the server-rendered portfolio pages.
(() => {
  function initPortfolio() {
    const methods = {
      place: ["01 / Источник идеи", "Что делает это место особенным?", "Изучаем ландшафт, локальную историю, традиции и ремёсла. Находим один смысловой центр, вокруг которого выстраивается концепция отеля."],
      guest: ["02 / Сценарий гостя", "Для кого создаётся отель?", "Изучаем привычки гостя, причины путешествия и ожидания от поездки. Продумываем его день: от входной группы и лобби до ресторана, SPA и номера."],
      business: ["03 / Задача собственника", "Что важно для вашего объекта?", "Учитываем формат, вместимость, сезонность, питание, логистику персонала, коммуникации, сроки и бюджет. Формулируем общие цели до начала проектирования."],
      design: ["04 / Воплощение идеи", "Как история станет интерьером?", "Переводим смысл в палитру, материалы, зонирование и детали. Прорабатываем точки касания, навигацию, айдентику и образ пространства."],
    };

    const methodButtons = Array.from(document.querySelectorAll("[data-method]"));
    const filters = Array.from(document.querySelectorAll("[data-filter]"));
    const reviewButtons = Array.from(document.querySelectorAll("[data-review]"));
    const slides = Array.from(document.querySelectorAll(".hotel-slide"));
    const slideButtons = Array.from(document.querySelectorAll("[data-slide-to]"));
    const slidePause = document.getElementById("slide-pause");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let motionChoice = null;
    try {
      const saved = sessionStorage.getItem("mane-motion-paused");
      if (saved !== null) motionChoice = saved === "true";
    } catch { /* Storage can be disabled. */ }
    let motionPaused = motionChoice ?? reducedMotion.matches;
    let slidePaused = false;
    let slideIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("active")));
    let timer;

    function selectMethod(key) {
      const data = methods[key];
      if (!data) return;
      const index = document.getElementById("method-index");
      const title = document.getElementById("method-title");
      const body = document.getElementById("method-text");
      const panel = document.getElementById("method-panel");
      if (!index || !title || !body || !panel) return;
      index.textContent = data[0];
      title.textContent = data[1];
      body.textContent = data[2];
      panel.setAttribute("aria-labelledby", `method-tab-${key}`);
      methodButtons.forEach((button) => button.setAttribute("aria-selected", String(button.dataset.method === key)));
    }

    function selectFilter(button) {
      filters.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      document.querySelectorAll(".business-case-grid .case-card").forEach((card) => {
        card.hidden = button.dataset.filter !== "all" && card.dataset.category !== button.dataset.filter;
      });
      document.querySelectorAll("[data-portfolio-group]").forEach((group) => {
        group.hidden = !group.querySelector(".case-card:not([hidden])");
      });
      const count = document.getElementById("portfolio-count");
      if (count) count.textContent = `Показано проектов: ${document.querySelectorAll(".business-case-grid .case-card:not([hidden])").length}`;
    }

    function filterFromHash() {
      const button = filters.find((item) => item.dataset.filter === location.hash.slice(1)) ?? filters.find((item) => item.dataset.filter === "all");
      if (button) selectFilter(button);
    }

    let reviews = [];
    const reviewData = document.getElementById("reviews-data");
    if (reviewData?.textContent) {
      try { reviews = JSON.parse(reviewData.textContent); } catch { /* Keep the static first review. */ }
    }
    function selectReview(index) {
      const review = reviews[index];
      const quote = document.getElementById("review-quote");
      const author = document.getElementById("review-author");
      const full = document.getElementById("review-full");
      const panel = document.getElementById("review-panel");
      if (!review || !quote || !author || !full || !panel) return;
      quote.textContent = review.quote;
      author.textContent = review.author;
      full.replaceChildren(...review.paragraphs.map((text) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        return paragraph;
      }));
      const details = document.getElementById("full-review");
      if (details) details.open = false;
      panel.setAttribute("aria-labelledby", `review-tab-${index}`);
      reviewButtons.forEach((button) => button.setAttribute("aria-selected", String(Number(button.dataset.review) === index)));
    }

    function slideTo(index) {
      if (!slides.length) return;
      slideIndex = ((index % slides.length) + slides.length) % slides.length;
      slides.forEach((slide, position) => {
        const active = position === slideIndex;
        slide.classList.toggle("active", active);
        slide.setAttribute("aria-hidden", String(!active));
        slide.tabIndex = active ? 0 : -1;
      });
      slideButtons.forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.slideTo) === slideIndex)));
    }

    function runSlides() {
      if (timer) clearInterval(timer);
      const stopped = motionPaused || slidePaused;
      if (slidePause) {
        slidePause.textContent = stopped ? "▷" : "Ⅱ";
        slidePause.setAttribute("aria-label", stopped ? "Возобновить смену проектов" : "Приостановить смену проектов");
      }
      if (slides.length > 1 && !stopped && !document.hidden) timer = setInterval(() => slideTo(slideIndex + 1), 7000);
    }

    function applyMotion() {
      document.body.dataset.motion = motionPaused ? "paused" : "running";
      document.querySelectorAll(".motion-toggle").forEach((button) => {
        button.textContent = motionPaused ? "Включить анимацию" : "Остановить анимацию";
        button.setAttribute("aria-pressed", String(motionPaused));
      });
      runSlides();
    }

    function onClick(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const method = target.closest("[data-method]");
      if (method) { selectMethod(method.dataset.method ?? ""); return; }
      const filter = target.closest("[data-filter]");
      if (filter) {
        selectFilter(filter);
        history.replaceState(null, "", filter.dataset.filter === "all" ? location.pathname : `#${filter.dataset.filter}`);
        return;
      }
      const review = target.closest("[data-review]");
      if (review) { selectReview(Number(review.dataset.review)); return; }
      const slide = target.closest("[data-slide-to]");
      if (slide) { slideTo(Number(slide.dataset.slideTo)); runSlides(); return; }
      if (target.closest("#slide-pause")) {
        if (motionPaused) { motionPaused = false; motionChoice = false; slidePaused = false; applyMotion(); }
        else { slidePaused = !slidePaused; runSlides(); }
        return;
      }
      if (target.closest(".motion-toggle")) {
        motionPaused = !motionPaused;
        motionChoice = motionPaused;
        try { sessionStorage.setItem("mane-motion-paused", String(motionPaused)); } catch { /* Storage can be disabled. */ }
        applyMotion();
      }
    }

    function onKeyDown(event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const method = target.closest("[data-method]");
      if (method) {
        event.preventDefault();
        const index = methodButtons.indexOf(method);
        const next = methodButtons[(index + direction + methodButtons.length) % methodButtons.length];
        if (next) { selectMethod(next.dataset.method ?? ""); next.focus(); }
        return;
      }
      const review = target.closest("[data-review]");
      if (review) {
        event.preventDefault();
        const index = reviewButtons.indexOf(review);
        const next = reviewButtons[(index + direction + reviewButtons.length) % reviewButtons.length];
        if (next) { selectReview(Number(next.dataset.review)); next.focus(); }
      }
    }

    function onFocusIn(event) {
      if (event.target instanceof Element && event.target.closest(".hotel-stage .hotel-slide")) {
        slidePaused = true;
        runSlides();
      }
    }

    function onReducedMotionChange(event) {
      if (motionChoice === null) { motionPaused = event.matches; applyMotion(); }
    }

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("visibilitychange", runSlides);
    window.addEventListener("hashchange", filterFromHash);
    reducedMotion.addEventListener("change", onReducedMotionChange);
    filterFromHash();
    applyMotion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPortfolio, { once: true });
  } else {
    initPortfolio();
  }
})();
