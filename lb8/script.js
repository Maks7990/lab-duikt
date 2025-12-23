const burger = document.getElementById('burger');
const menu = document.getElementById('menu');
const overlay = document.getElementById('overlay');

function openMenu() {
  menu.classList.add('open');
  burger.setAttribute('aria-expanded', 'true');
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeMenu() {
  menu.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  overlay.classList.remove('show');
  setTimeout(() => { overlay.hidden = true; }, 200);
}

function toggleMenu() {
  const isOpen = menu.classList.contains('open');
  isOpen ? closeMenu() : openMenu();
}

burger.addEventListener('click', toggleMenu);

// Закриття: клік по пункту меню
menu.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') closeMenu();
});

// Закриття: клік по затемненню
overlay.addEventListener('click', closeMenu);

// Закриття: Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});

// Якщо перейшли на desktop — закриваємо меню/оверлей
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) closeMenu();
});
