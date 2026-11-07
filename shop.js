(() => {
  'use strict';
  const catalog = {
    crema: {name: 'Crema de sebo de res · 50 g', image: 'assets/crema-floral-v2.webp', images: {lavanda: 'assets/crema-floral-v2.webp', limon: 'assets/crema-limon-foto.webp', jazmin: 'assets/crema-jazmin-foto.webp'}, aromas: {lavanda: 'Lavanda', limon: 'Limón', jazmin: 'Jazmín'}},
    sales: {name: 'Sales de baño · 250 g', image: 'assets/sales-producto.webp', images: {lavanda: 'assets/sales-producto.webp', limon: 'assets/sales-limon-foto.webp', jazmin: 'assets/sales-jazmin-foto.webp'}, aromas: {lavanda: 'Susurro de Lavanda', limon: 'Amanecer de Limón', jazmin: 'Caricia de Jazmín'}},
    bomba: {name: 'Bomba de baño efervescente · 100 g', image: 'assets/bomba-lavanda-foto.webp', images: {lavanda: 'assets/bomba-lavanda-foto.webp', limon: 'assets/bomba-limon-foto.webp', jazmin: 'assets/bomba-jazmin-foto.webp'}, aromas: {lavanda: 'Lavanda Nocturna', limon: 'Brisas de Limón', jazmin: 'Jazmín Serena'}},
    kit1: {name: 'Kit 1 · El ritual completo · Con collar', image: 'assets/kit-1-v2.webp', aromas: {coordinar: 'Aroma por coordinar'}},
    kit2: {name: 'Kit 2 · Un detalle para ti · Con manilla o moña', image: 'assets/kit-2-v2.webp', aromas: {coordinar: 'Aroma por coordinar'}}
  };
  const imageFor = (product, aroma) => catalog[product].images?.[aroma] || catalog[product].image;
  const storageKey = 'yselea-cart-v1';
  const dialog = document.querySelector('#cart-dialog');
  const itemsList = document.querySelector('#cart-items');
  const notes = document.querySelector('#cart-notes');
  const send = document.querySelector('#cart-send');
  const status = document.querySelector('#cart-status');
  let cart = [];
  let toastTimer;
  const valid = (item) => item && Object.hasOwn(catalog, item.product) && Object.hasOwn(catalog[item.product].aromas, item.aroma) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Array.isArray(saved.items)) {
      for (const item of saved.items.slice(0, 20).filter(valid)) {
        const existing = cart.find(row => row.product === item.product && row.aroma === item.aroma);
        if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity);
        else cart.push({product: item.product, aroma: item.aroma, quantity: item.quantity});
      }
      notes.value = typeof saved.notes === 'string' ? saved.notes.slice(0, 500) : '';
    }
  } catch { /* The shop also works when browser storage is unavailable. */ }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify({items: cart, notes: notes.value})); } catch {}
  }
  function notify(message) {
    clearTimeout(toastTimer);
    status.textContent = message;
    status.classList.add('is-visible');
    toastTimer = setTimeout(() => status.classList.remove('is-visible'), 4000);
  }
  function updateMessage() {
    const lines = cart.map(item => `${item.quantity} × ${catalog[item.product].name} — ${catalog[item.product].aromas[item.aroma]}`);
    let message = '¡Hola, Yseléa! Me gustaría consultar este pedido:\n\n' + lines.join('\n');
    if (notes.value.trim()) message += '\n\nDetalles: ' + notes.value.trim();
    message += '\n\n¿Me confirman disponibilidad y el total, por favor?';
    send.href = 'https://wa.me/59161328386?text=' + encodeURIComponent(message);
  }
  function node(tag, cls, text) {
    const result = document.createElement(tag);
    if (cls) result.className = cls;
    if (text !== undefined) result.textContent = text;
    return result;
  }
  function render() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = String(count); });
    document.querySelectorAll('[data-open-cart]').forEach(el => { el.setAttribute('aria-label', `Abrir carrito, ${count} ${count === 1 ? 'producto' : 'productos'}`); });
    document.querySelector('#cart-empty').hidden = count > 0;
    document.querySelector('#cart-summary').hidden = count === 0;
    document.querySelector('#cart-units').textContent = `${count} ${count === 1 ? 'producto seleccionado' : 'productos seleccionados'}`;
    itemsList.replaceChildren();
    cart.forEach(item => {
      const product = catalog[item.product];
      const row = node('li', 'cart-item');
      const img = node('img'); img.src = imageFor(item.product, item.aroma); img.alt = ''; img.width = 72; img.height = 90;
      const details = node('div', 'cart-item-details');
      details.append(node('h3', '', product.name), node('p', '', product.aromas[item.aroma]));
      const controls = node('div', 'cart-item-controls');
      const minus = node('button', 'quantity-button', '−'); minus.type = 'button'; minus.setAttribute('aria-label', `Quitar una unidad de ${product.name}, ${product.aromas[item.aroma]}`); minus.disabled = item.quantity <= 1;
      const number = node('span', 'quantity-value', String(item.quantity));
      const plus = node('button', 'quantity-button', '+'); plus.type = 'button'; plus.setAttribute('aria-label', `Añadir una unidad de ${product.name}, ${product.aromas[item.aroma]}`); plus.disabled = item.quantity >= 99;
      function change(delta) {
        item.quantity += delta; persist(); render();
        const updated = itemsList.children[cart.indexOf(item)];
        const selector = delta < 0 ? '.quantity-button:first-child' : '.quantity-button:nth-child(3)';
        const next = updated.querySelector(selector);
        (next.disabled ? updated.querySelector('.remove-item') : next).focus();
      }
      minus.addEventListener('click', () => change(-1));
      plus.addEventListener('click', () => change(1));
      const remove = node('button', 'remove-item', 'Quitar'); remove.type = 'button'; remove.setAttribute('aria-label', `Quitar ${product.name}, ${product.aromas[item.aroma]} del carrito`);
      remove.addEventListener('click', () => {
        const position = cart.indexOf(item); cart.splice(position, 1); persist(); render();
        const next = itemsList.children[Math.min(position, cart.length - 1)];
        (next ? next.querySelector('.remove-item') : document.querySelector('[data-close-cart]')).focus();
        notify('Producto quitado del carrito.');
      });
      controls.append(minus, number, plus, remove); details.append(controls); row.append(img, details); itemsList.append(row);
    });
    updateMessage();
  }
  function add(product, aroma, quantity) {
    const existing = cart.find(item => item.product === product && item.aroma === aroma);
    if (existing && existing.quantity + quantity > 99) {
      notify('Puedes seleccionar hasta 99 unidades por producto y aroma.'); return;
    }
    if (existing) existing.quantity += quantity;
    else cart.push({product, aroma, quantity});
    persist(); render(); notify(`${quantity === 1 ? 'Añadido' : 'Añadidos'}: ${quantity} × ${catalog[product].name}.`);
  }
  document.querySelectorAll('[data-product-form]').forEach(form => {
    const product = form.dataset.productForm;
    let selected = 'lavanda';
    form.querySelectorAll('[data-aroma]').forEach(button => {
      button.addEventListener('click', () => {
        selected = button.dataset.aroma;
        form.querySelectorAll('[data-aroma]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
        form.querySelector('[data-selected-aroma]').textContent = catalog[product].aromas[selected];
        const image = form.closest('[data-product]').querySelector('.catalog-photo img');
        image.src = imageFor(product, selected);
        image.alt = `${catalog[product].name}, aroma ${catalog[product].aromas[selected]}`;
      });
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const quantity = Number(form.elements.quantity.value);
      if (valid({product, aroma: selected, quantity})) add(product, selected, quantity);
    });
  });
  document.querySelectorAll('[data-add-kit]').forEach(button => button.addEventListener('click', () => add(button.dataset.addKit, 'coordinar', 1)));
  document.querySelectorAll('[data-open-cart]').forEach(button => button.addEventListener('click', () => { render(); dialog.showModal(); }));
  document.querySelectorAll('[data-close-cart]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.classList.remove('cart-is-open'); });
  document.querySelectorAll('[data-open-cart]').forEach(button => button.addEventListener('click', () => { document.body.classList.add('cart-is-open'); }));
  notes.addEventListener('input', () => { persist(); updateMessage(); });
  send.addEventListener('click', event => { if (!cart.length) event.preventDefault(); });
  render();
})();
