(() => {
  function initCharacter() {
    const menu = document.querySelector('.menu-toggle');
    const nav = document.getElementById('navigation');
    function closeMenu() {
      nav?.classList.remove('open');
      menu?.setAttribute('aria-expanded', 'false');
      if (menu) menu.innerHTML = 'Меню <span aria-hidden="true">≡</span>';
    }
    menu?.addEventListener('click', event => {
      if (nav.classList.contains('open')) {
        closeMenu();
        menu.focus();
        return;
      }
      nav.classList.add('open');
      menu.setAttribute('aria-expanded', 'true');
      menu.innerHTML = 'Закрыть <span aria-hidden="true">×</span>';
      if (event.detail === 0) nav.querySelector('a')?.focus();
    });
    nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', event => {
      if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) closeMenu();
    }));
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !nav?.classList.contains('open') || !menu?.getClientRects().length) return;
      if (event.target instanceof Element && event.target.closest('dialog[open]')) return;
      closeMenu();
      menu.focus();
    });

    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
    document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }));
    document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
      document.getElementById('large-image').src = button.dataset.image;
      document.getElementById('image-dialog').showModal();
    }));

    const galleryData = document.getElementById('gallery-data');
    if (galleryData) {
      const photos = JSON.parse(galleryData.textContent);
      const lightbox = document.getElementById('lightbox');
      let current = 0;
      function showPhoto() {
        const img = document.getElementById('lightbox-image'); img.src = photos[current].src; img.alt = photos[current].alt;
        document.getElementById('lightbox-count').textContent = `${current + 1} / ${photos.length}`;
      }
      function movePhoto(direction) { current = (current + direction + photos.length) % photos.length; showPhoto(); }
      document.querySelectorAll('[data-gallery-index]').forEach(b => b.addEventListener('click', () => {
        current = Number(b.dataset.galleryIndex); showPhoto(); lightbox.showModal();
      }));
      document.getElementById('lightbox-prev').addEventListener('click', () => movePhoto(-1));
      document.getElementById('lightbox-next').addEventListener('click', () => movePhoto(1));
      document.getElementById('lightbox-close').addEventListener('click', () => lightbox.close());
      lightbox.addEventListener('keydown', event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); movePhoto(event.key === 'ArrowRight' ? 1 : -1); }
      });
    }

    const form = document.getElementById('contact-form');
    const quiz = document.getElementById('quiz-dialog');
    const quizForm = document.getElementById('quiz-form');
    if (quiz && quizForm && form) {
      document.getElementById('open-quiz')?.addEventListener('click', () => quiz.showModal());
      const area = quizForm.elements.area;
      function step(i) {
        document.getElementById('quiz-step-1').hidden = i !== 1;
        document.getElementById('quiz-step-2').hidden = i !== 2;
        if (i === 2) {
          area.focus();
        } else {
          quizForm.querySelector('[name=type]:checked')?.focus();
        }
      }
      document.getElementById('quiz-next').addEventListener('click', () => {
        if (!quizForm.elements.type.value) { document.getElementById('quiz-error').textContent = 'Выберите тип объекта.'; return; }
        document.getElementById('quiz-error').textContent = ''; step(2);
      });
      document.getElementById('quiz-back').addEventListener('click', () => step(1));
      function estimate() {
        const a = Number(area.value), valid = area.validity.valid && a > 0;
        document.getElementById('design-estimate').textContent = valid ? 'от ' + (a * 5000).toLocaleString('ru-RU') + ' ₽' : '—';
        document.getElementById('supply-estimate').textContent = valid ? 'от ' + (a * 1500).toLocaleString('ru-RU') + ' ₽' : '—';
      }
      area.addEventListener('input', estimate); estimate();
      quizForm.addEventListener('submit', event => {
        event.preventDefault(); if (!quizForm.reportValidity()) return;
        form.elements.area.value = area.value;
        const objectTypes = { 'Отеля': 'Отель', 'СПА центра': 'SPA / wellness', 'Ресторана': 'Ресторан', 'Магазина': 'Шоурум или магазин', 'Офиса': 'Офис', 'Дома': 'Квартира или дом', 'Квартиры': 'Квартира или дом' };
        form.elements.object.value = objectTypes[quizForm.elements.type.value];
        form.elements.message.value = `Интересует дизайн ${quizForm.elements.type.value.toLowerCase()}, площадь ${area.value} м². Хочу обсудить концепцию и точную стоимость работ.`;
        quiz.close(); document.getElementById('contacts').scrollIntoView(); form.elements.name.focus({ preventScroll: true });
      });
    }
    form?.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const message = `Здравствуйте! Хочу обсудить объект со студией MANE.\n\nИмя: ${values.get('name')}\nТелефон: ${values.get('phone')}\nТип объекта: ${values.get('object')}\nЛокация: ${values.get('location') || 'Обсудим'}\nПлощадь: ${values.get('area') ? values.get('area') + ' м²' : 'Обсудим'}\nСтадия: ${values.get('stage')}\n\n${values.get('message') || ''}`;
      document.getElementById('draft-text').textContent = message;
      document.getElementById('draft-email').href = 'mailto:juliamanedesign@gmail.com?subject=' + encodeURIComponent('Объект для MANE') + '&body=' + encodeURIComponent(message);
      document.getElementById('draft-dialog').showModal();
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('arrived'); observer.unobserve(entry.target); } });
    }, { threshold: .08 });
    document.querySelectorAll('[data-reveal]').forEach(e => observer.observe(e));
    let frame = false;
    function progress() {
      if (frame) return; frame = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        document.querySelector('.reading-progress')?.style.setProperty('--read', max > 0 ? scrollY / max : 0);
        frame = false;
      });
    }
    addEventListener('scroll', progress, { passive: true }); addEventListener('resize', progress, { passive: true });
    progress();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCharacter, { once: true });
  } else {
    initCharacter();
  }
})();
