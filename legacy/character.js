(() => {

  function setupPhone(phone) {
    if (!phone) return;
    const mask = '+7 (___) ___ - __ - __';
    const positions = [...mask.matchAll(/_/g)].map(match => match.index);
    const size = positions.length;
    phone.pattern = String.raw`\+7 \([0-9]{3}\) [0-9]{3} - [0-9]{2} - [0-9]{2}`;
    phone.title = 'Введите 10 цифр российского номера после +7';

    function parsePhone(value) {
      const digits = value.replace(/\D/g, '');
      if (value.trimStart().startsWith('+')) return digits.startsWith('7') ? digits.slice(1) : null;
      return digits.length === size + 1 && /^[78]/.test(digits) ? digits.slice(1) : digits;
    }

    function render(digits, caret = digits.length) {
      let index = 0;
      phone.value = mask.replace(/_/g, () => digits[index++] ?? '_');
      if (document.activeElement === phone) {
        const position = positions[caret] ?? mask.length;
        phone.setSelectionRange(position, position);
      }
    }

    function edit(text, direction = 0, pasted = false) {
      const current = (parsePhone(phone.value) ?? '').slice(0, size);
      const start = Math.min(current.length, positions.filter(index => index < phone.selectionStart).length);
      const end = Math.min(current.length, positions.filter(index => index < phone.selectionEnd).length);
      const from = start === end && direction < 0 ? Math.max(0, start - 1) : start;
      const to = start === end && direction > 0 ? end + 1 : end;
      const digits = pasted ? parsePhone(text) : text.replace(/\D/g, '');
      if (digits === null || (pasted && digits.length > size)) {
        phone.setCustomValidity('Введите российский номер в формате +7.');
        phone.reportValidity();
        return;
      }
      phone.setCustomValidity('');
      const suffix = current.slice(to);
      const inserted = digits.slice(0, size - from - suffix.length);
      render(current.slice(0, from) + inserted + suffix, from + inserted.length);
    }

    phone.addEventListener('focus', () => {
      const digits = parsePhone(phone.value);
      if (!phone.value || (digits !== null && digits.length <= size && phone.validity.patternMismatch && !phone.value.includes('_'))) {
        render(digits ?? '');
      }
    });
    phone.addEventListener('blur', () => {
      if (parsePhone(phone.value) === '') phone.value = '';
    });
    phone.addEventListener('beforeinput', event => {
      if (!event.cancelable || event.isComposing) return;
      const type = event.inputType;
      if ((type === 'insertText' || type === 'insertReplacementText') && event.data !== null) {
        event.preventDefault();
        edit(event.data, 0, type === 'insertReplacementText' || event.data.length > 1);
      } else if (type === 'deleteContentBackward' || type === 'deleteContentForward') {
        event.preventDefault();
        edit('', type === 'deleteContentBackward' ? -1 : 1);
      }
    });
    phone.addEventListener('paste', event => {
      if (!event.clipboardData) return;
      event.preventDefault();
      edit(event.clipboardData.getData('text'), 0, true);
    });
    phone.addEventListener('input', () => {
      const digits = parsePhone(phone.value);
      phone.setCustomValidity(digits === null || digits.length > size ? 'Введите российский номер в формате +7.' : '');
      if (digits !== null && digits.length <= size) render(digits);
    });
  }

  function setupArea(form) {
    const slider = form.querySelector('[data-area-range]');
    if (!slider) return;
    const number = form.elements.area;
    const placeholder = slider.closest('.area-slider');
    const exact = form.querySelector('[data-area-exact]');
    const output = form.querySelector('[data-area-value]');
    const limit = Number(slider.max);
    const floor = Number(slider.min);

    function sync() {
      const area = number.valueAsNumber;
      const above = area >= limit;
      const below = area < floor;
      slider.value = Number.isFinite(area) ? String(area) : slider.defaultValue;
      exact.hidden = !above && !below;
      number.min = above ? String(limit) : '1';
      number.required = above || below;
      const description = above ? 'Более 500 м²' : (Number.isFinite(area) ? area : slider.value) + ' м²';
      output.textContent = description;
      slider.setAttribute('aria-valuetext', description);
      placeholder.style.setProperty('--area-progress', (Number(slider.value) - floor) / (limit - floor) * 100 + '%');
    }

    slider.addEventListener('input', () => {
      number.value = slider.value;
      sync();
    });
    placeholder.hidden = false;
    sync();
    return sync;
  }

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

    const form = document.getElementById('contact-form');
    if (form) setupPhone(form.elements.phone);
    const syncContactArea = form && setupArea(form);
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
        syncContactArea?.();
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
      const consentNote = `Согласие на обработку данных для этой заявки отмечено (версия ${values.get('consent')}).`;
      const draft = `${message}\n\n${consentNote}`;
      document.getElementById('draft-text').textContent = draft;
      document.getElementById('draft-email').href = 'mailto:juliamanedesign@gmail.com?subject=' + encodeURIComponent('Объект для MANE') + '&body=' + encodeURIComponent(draft);
      document.getElementById('draft-dialog').showModal();
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('arrived'); observer.unobserve(entry.target); } });
    }, { threshold: .08 });
    document.querySelectorAll('[data-reveal]').forEach(e => observer.observe(e));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCharacter, { once: true });
  } else {
    initCharacter();
  }
})();
