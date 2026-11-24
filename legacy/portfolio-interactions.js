// Loaded by the browser for the server-rendered portfolio pages.
(() => {
  function initPortfolio() {
    const methods = {
      place: ["01 / Источник идеи", "Что делает это место особенным?", "Изучаем окружение, историю района и архитектуру здания. Выбираем идею, которая связывает особенности места с характером бренда."],
      guest: ["02 / Опыт посетителя", "Что нужно посетителю?", "Разбираем путь посетителя: как он находит вход, ориентируется в пространстве, выбирает товар или получает услугу. Продумываем, где ему нужна подсказка, а где важно дать время освоиться."],
      business: ["03 / Задача собственника", "Какие задачи должен решить интерьер?", "Уточняем цели собственника, формат работы и бюджет. Планируем потоки посетителей и сотрудников, работу сервиса и возможности для развития бизнеса."],
      design: ["04 / Воплощение идеи", "Как воплотить идею в интерьере?", "Выражаем характер бренда через планировку, свет, материалы и детали. Разрабатываем навигацию и учитываем, как пространство будут использовать каждый день."],
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

    function reserveMethodPanelSpace() {
      const panel = document.getElementById("method-panel");
      if (!panel) return;

      const stack = document.createElement("div");
      stack.className = "method-panel-stack";
      panel.before(stack);
      stack.append(panel);

      // Hidden panels share the same grid cell so its height follows the longest copy.
      for (const [index, title, text] of Object.values(methods)) {
        const sizer = document.createElement("div");
        sizer.className = "method-panel method-panel-sizer";
        sizer.setAttribute("aria-hidden", "true");

        const label = document.createElement("span");
        const question = document.createElement("h3");
        const description = document.createElement("p");
        label.textContent = index;
        question.textContent = title;
        description.textContent = text;
        sizer.append(label, question, description);
        stack.append(sizer);
      }
    }

    reserveMethodPanelSpace();

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
    function reserveReviewTextSpace(id, sizerClass, field) {
      const text = document.getElementById(id);
      if (!text || reviews.length < 2) return;

      // Size each visible row from all variants at the current column width.
      const stack = document.createElement("div");
      stack.className = "review-text-stack";
      text.before(stack);
      stack.append(text);

      for (const review of reviews) {
        const sizer = document.createElement(text.localName);
        sizer.className = "review-text-sizer " + sizerClass;
        sizer.setAttribute("aria-hidden", "true");
        sizer.textContent = review[field];
        stack.append(sizer);
      }
    }

    reserveReviewTextSpace("review-quote", "review-quote-sizer", "quote");
    reserveReviewTextSpace("review-author", "review-author-sizer", "author");

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
