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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let motionChoice = null;
    try {
      const saved = sessionStorage.getItem("mane-motion-paused");
      if (saved !== null) motionChoice = saved === "true";
    } catch { /* Storage can be disabled. */ }
    let motionPaused = motionChoice ?? reducedMotion.matches;
    let previewedCard = null;
    let lastTouchCard = null;

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

    function applyMotion() {
      document.body.dataset.motion = motionPaused ? "paused" : "running";
      document.querySelectorAll(".motion-toggle").forEach((button) => {
        button.textContent = motionPaused ? "Включить анимацию" : "Остановить анимацию";
        button.setAttribute("aria-pressed", String(motionPaused));
      });
    }

    function clearCardPreview() {
      previewedCard?.removeAttribute("data-preview");
      previewedCard = null;
    }

    function onPointerDown(event) {
      lastTouchCard = event.pointerType === "touch" && event.target instanceof Element
        ? event.target.closest("a.case-card") : null;
    }

    function onClick(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const card = target.closest("a.case-card");
      const touchActivation = event.pointerType === "touch"
        || (!event.pointerType && event.detail > 0 && card === lastTouchCard);
      lastTouchCard = null;
      if (card && touchActivation && !event.defaultPrevented && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        const alreadyPreviewed = card === previewedCard;
        clearCardPreview();
        if (!alreadyPreviewed) {
          event.preventDefault();
          card.setAttribute("data-preview", "");
          previewedCard = card;
        }
        return;
      }
      clearCardPreview();

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
      if (target.closest(".motion-toggle")) {
        motionPaused = !motionPaused;
        motionChoice = motionPaused;
        try { sessionStorage.setItem("mane-motion-paused", String(motionPaused)); } catch { /* Storage can be disabled. */ }
        applyMotion();
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") clearCardPreview();
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

    function onReducedMotionChange(event) {
      if (motionChoice === null) { motionPaused = event.matches; applyMotion(); }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
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
