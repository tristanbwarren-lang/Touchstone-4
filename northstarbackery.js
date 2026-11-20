/* North Star Bakery - Touchstone 4
   1. Pre-order list builder (products.html): filter the menu and save items.
   2. Pre-order form (contact.html): JavaScript validation and saved details.
   Data is kept in localStorage so it survives refreshes and page changes. */

'use strict';

/* ---------- Data: two arrays and two objects ---------- */

// Array of objects: every item on the menu (prices are approximate ranges)
const menuItems = [
  { id: 'signature-loaf', name: 'Signature Sourdough Loaf', category: 'Breads',   low: 6,  high: 10, note: 'Golden sourdough scored with our star.' },
  { id: 'honey-oat',      name: 'Honey Oat Loaf',           category: 'Breads',   low: 6,  high: 10, note: 'Soft, lightly sweet, great for toast.' },
  { id: 'whole-wheat',    name: 'Whole Wheat Loaf',         category: 'Breads',   low: 6,  high: 9,  note: 'Hearty everyday sandwich bread.' },
  { id: 'croissant',      name: 'Butter Croissant',         category: 'Pastries', low: 3,  high: 5,  note: 'Flaky and baked before sunrise.' },
  { id: 'cinnamon-roll',  name: 'Cinnamon Roll',            category: 'Pastries', low: 4,  high: 6,  note: 'Warm, gooey, and made by hand.' },
  { id: 'fruit-danish',   name: 'Seasonal Fruit Danish',    category: 'Pastries', low: 4,  high: 6,  note: 'Made with fruit from nearby farms.' },
  { id: 'cupcake',        name: 'Cupcake',                  category: 'Cakes',    low: 4,  high: 6,  note: 'Sold individually or by the dozen.' },
  { id: 'layer-cake',     name: 'Whole Layer Cake',         category: 'Cakes',    low: 35, high: 90, note: 'Order at least five days ahead.' }
];

// Array of strings: filter choices
const categories = ['All', 'Breads', 'Pastries', 'Cakes'];

// Object: localStorage keys
const STORAGE_KEYS = {
  orderList: 'northStarOrderList',
  contact: 'northStarContact'
};

// Object: current state of the page. list is an array of { id, qty } objects.
const state = {
  filter: 'All',
  list: []
};

/* ---------- Storage helpers (wrapped in try/catch in case storage is blocked) ---------- */

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    /* Storage unavailable: the page still works, it just will not remember. */
  }
}

function removeData(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    /* ignore */
  }
}

/* ---------- Order list logic ---------- */

function findMenuItem(id) {
  return menuItems.find(function (item) { return item.id === id; });
}

function loadList() {
  const saved = loadData(STORAGE_KEYS.orderList, []);
  // Keep only entries that still match a real menu item
  state.list = Array.isArray(saved)
    ? saved.filter(function (entry) { return findMenuItem(entry.id) && entry.qty > 0; })
    : [];
}

function saveList() {
  saveData(STORAGE_KEYS.orderList, state.list);
}

function getQty(id) {
  const entry = state.list.find(function (e) { return e.id === id; });
  return entry ? entry.qty : 0;
}

function changeQty(id, amount) {
  const entry = state.list.find(function (e) { return e.id === id; });
  if (entry) {
    entry.qty += amount;
    if (entry.qty <= 0) {
      state.list = state.list.filter(function (e) { return e.id !== id; });
    }
  } else if (amount > 0) {
    state.list.push({ id: id, qty: amount });
  }
  saveList();
}

function removeFromList(id) {
  state.list = state.list.filter(function (e) { return e.id !== id; });
  saveList();
}

function clearList() {
  state.list = [];
  saveList();
}

function calculateEstimate() {
  return state.list.reduce(function (total, entry) {
    const item = findMenuItem(entry.id);
    total.low += item.low * entry.qty;
    total.high += item.high * entry.qty;
    total.count += entry.qty;
    return total;
  }, { low: 0, high: 0, count: 0 });
}

function listToText() {
  return state.list.map(function (entry) {
    return entry.qty + ' x ' + findMenuItem(entry.id).name;
  }).join(', ');
}

/* ---------- Order list display ---------- */

function renderFilters() {
  const container = document.getElementById('filters');
  container.innerHTML = '';
  categories.forEach(function (category) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter';
    button.textContent = category;
    button.dataset.category = category;
    button.setAttribute('aria-pressed', String(category === state.filter));
    container.appendChild(button);
  });
}

function createMenuCard(item) {
  const qty = getQty(item.id);
  const card = document.createElement('article');
  card.className = 'menu-item';
  card.innerHTML =
    '<p class="tag">' + item.category + '</p>' +
    '<h3>' + item.name + '</h3>' +
    '<p>' + item.note + '</p>' +
    '<p class="price">About $' + item.low + '&ndash;$' + item.high + ' each</p>' +
    '<button type="button" data-action="add" data-id="' + item.id + '" aria-label="Add ' + item.name + ' to pre-order list">' +
    (qty > 0 ? 'Add another (' + qty + ' in list)' : 'Add to list') + '</button>';
  return card;
}

function renderMenu() {
  const grid = document.getElementById('menu-grid');
  const visible = menuItems.filter(function (item) {
    return state.filter === 'All' || item.category === state.filter;
  });
  grid.innerHTML = '';
  visible.forEach(function (item) { grid.appendChild(createMenuCard(item)); });
  document.getElementById('menu-status').textContent =
    'Showing ' + visible.length + ' ' + (state.filter === 'All' ? 'items' : state.filter.toLowerCase()) + '.';
}

function renderList(containerId, editable) {
  const container = document.getElementById(containerId);
  if (!container) { return; }

  if (state.list.length === 0) {
    container.innerHTML = '<p class="empty">Your list is empty.' +
      (editable ? ' Choose items above to start your pre-order.' : '') + '</p>';
    return;
  }

  const estimate = calculateEstimate();
  const rows = state.list.map(function (entry) {
    const item = findMenuItem(entry.id);
    const controls = editable
      ? '<span class="qty">' +
          '<button type="button" class="small secondary" data-action="decrease" data-id="' + item.id + '" aria-label="Decrease quantity of ' + item.name + '">&minus;</button>' +
          '<span aria-label="Quantity">' + entry.qty + '</span>' +
          '<button type="button" class="small secondary" data-action="increase" data-id="' + item.id + '" aria-label="Increase quantity of ' + item.name + '">+</button>' +
          '<button type="button" class="small secondary" data-action="remove" data-id="' + item.id + '" aria-label="Remove ' + item.name + ' from list">Remove</button>' +
        '</span>'
      : '<span class="qty"><span>x ' + entry.qty + '</span></span>';
    return '<li><span>' + item.name + '</span>' + controls + '</li>';
  }).join('');

  container.innerHTML =
    '<ul class="list-rows">' + rows + '</ul>' +
    '<p class="price">' + estimate.count + ' item' + (estimate.count === 1 ? '' : 's') +
    ' &middot; Estimated total: $' + estimate.low + '&ndash;$' + estimate.high + '</p>' +
    (editable ? '<p><button type="button" class="secondary small" data-action="clear">Clear list</button></p>' : '');
}

function refreshProductsPage() {
  renderFilters();
  renderMenu();
  renderList('order-list', true);
}

function handleProductsClick(event) {
  const target = event.target.closest('button');
  if (!target) { return; }

  if (target.classList.contains('filter')) {
    state.filter = target.dataset.category;
    refreshProductsPage();
    return;
  }

  const id = target.dataset.id;
  switch (target.dataset.action) {
    case 'add':
    case 'increase': changeQty(id, 1); break;
    case 'decrease': changeQty(id, -1); break;
    case 'remove': removeFromList(id); break;
    case 'clear': clearList(); break;
    default: return;
  }
  refreshProductsPage();
}

function initProductsPage() {
  loadList();
  refreshProductsPage();
  document.getElementById('order-builder').addEventListener('click', handleProductsClick);
}

/* ---------- Form validation (contact.html) ---------- */

// Object: one validation function per field id. Each returns an error message or ''.
const validators = {
  'name': function (value) {
    if (!value.trim()) { return 'Please enter your name.'; }
    if (value.trim().length < 2) { return 'Your name must be at least 2 characters.'; }
    return '';
  },
  'email': function (value) {
    if (!value.trim()) { return 'Please enter your email so we can confirm your order.'; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
      return 'Please enter a valid email, like name@example.com.';
    }
    return '';
  },
  'phone': function (value) {
    if (value && !/^\d{3}-\d{3}-\d{4}$/.test(value.trim())) {
      return 'Please use the phone format 555-123-4567, or leave it blank.';
    }
    return '';
  },
  'pickup-date': function (value) {
    if (!value) { return 'Please choose a pickup date.'; }
    const picked = new Date(value + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (picked < today) { return 'Pickup date cannot be in the past.'; }
    if (picked.getDay() === 1) { return 'We are closed on Mondays. Please choose another day.'; }
    return '';
  },
  'request-type': function (value) {
    return value ? '' : 'Please choose a request type.';
  },
  'item-details': function (value) {
    if (!value.trim()) { return 'Please list the items you would like, or use your saved list.'; }
    if (value.length > 500) { return 'Item details must be 500 characters or fewer (currently ' + value.length + ').'; }
    return '';
  },
  'allergies': function (value) {
    return value.length > 300 ? 'Allergy notes must be 300 characters or fewer (currently ' + value.length + ').' : '';
  }
};

const formState = { attempted: false };

function showFieldError(field, message) {
  const errorBox = document.getElementById(field.id + '-error');
  errorBox.textContent = message;
  if (message) {
    field.setAttribute('aria-invalid', 'true');
  } else {
    field.removeAttribute('aria-invalid');
  }
}

function validateField(field) {
  const message = validators[field.id](field.value);
  showFieldError(field, message);
  return message === '';
}

function validateForm(form) {
  const invalidFields = [];
  Object.keys(validators).forEach(function (id) {
    const field = form.elements[id];
    if (!validateField(field)) { invalidFields.push(field); }
  });
  return invalidFields;
}

function showFormStatus(message, isError) {
  const status = document.getElementById('form-status');
  status.textContent = message;
  status.className = 'form-status' + (message ? (isError ? ' is-error' : ' is-success') : '');
}

/* ---------- Saved contact details (localStorage) ---------- */

function loadContactDetails(form) {
  const saved = loadData(STORAGE_KEYS.contact, null);
  if (saved) {
    form.elements.name.value = saved.name || '';
    form.elements.email.value = saved.email || '';
    form.elements.remember.checked = true;
  }
}

function updateSavedContact(form) {
  if (form.elements.remember.checked) {
    saveData(STORAGE_KEYS.contact, {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim()
    });
  } else {
    removeData(STORAGE_KEYS.contact);
  }
}

/* ---------- Using the saved list in the form ---------- */

function setupSavedListPanel(form) {
  const panel = document.getElementById('saved-list-panel');
  if (state.list.length === 0) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  renderList('saved-list', false);
}

function useSavedList(form) {
  const details = form.elements['item-details'];
  details.value = listToText();
  if (form.elements['request-type'].value === '') {
    form.elements['request-type'].value = 'pre-order';
    if (formState.attempted) { validateField(form.elements['request-type']); }
  }
  if (formState.attempted) { validateField(details); }
  details.focus();
}

/* ---------- Form events ---------- */

function handleSubmit(event, form) {
  event.preventDefault();
  formState.attempted = true;
  const invalidFields = validateForm(form);

  if (invalidFields.length > 0) {
    showFormStatus('Please fix ' + invalidFields.length + ' field' +
      (invalidFields.length === 1 ? '' : 's') + ' below. Your other answers are still here.', true);
    invalidFields[0].focus();
    return;
  }

  updateSavedContact(form);
  const name = form.elements.name.value.trim();
  showFormStatus('Thank you, ' + name + '! Your pre-order request is ready. We will reply by email within one business day.', false);

  // Clear the request, but keep name and email if "remember me" is checked
  clearList();
  setupSavedListPanel(form);
  form.elements['pickup-date'].value = '';
  form.elements['request-type'].value = '';
  form.elements['item-details'].value = '';
  form.elements.allergies.value = '';
  if (!form.elements.remember.checked) {
    form.elements.name.value = '';
    form.elements.email.value = '';
    form.elements.phone.value = '';
  }
  formState.attempted = false;
  document.getElementById('form-status').focus();
}

function handleFieldChange(event) {
  const field = event.target;
  if (!validators[field.id]) { return; }
  // Re-check as soon as the user edits a field that already shows an error
  if (formState.attempted || field.hasAttribute('aria-invalid')) {
    validateField(field);
  }
}

function initContactPage() {
  const form = document.getElementById('order-form');
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  form.elements['pickup-date'].min = today.toISOString().slice(0, 10);

  loadList();
  loadContactDetails(form);
  setupSavedListPanel(form);

  form.addEventListener('submit', function (event) { handleSubmit(event, form); });
  form.addEventListener('input', handleFieldChange);
  form.addEventListener('change', handleFieldChange);
  // Errors are not shown on blur: a message appearing mid-click would push the Send button away.
  form.elements.remember.addEventListener('change', function () {
    // Saving happens only after a valid submit; unchecking forgets the saved details right away
    if (!form.elements.remember.checked) { removeData(STORAGE_KEYS.contact); }
  });

  document.getElementById('use-list').addEventListener('click', function () { useSavedList(form); });
}

/* ---------- Start the right code for the current page ---------- */

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('order-builder')) { initProductsPage(); }
  if (document.getElementById('order-form')) { initContactPage(); }
});