/* =====================================================================
   Safura Tea — Shared site script
   Handles: mobile nav, toast notifications, cart drawer, offer badge
   Loaded on every page so behaviour stays consistent everywhere.
===================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Mobile nav toggle ---------- */
  var hamburger = document.getElementById('hamburger');
  var navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
      });
    });
  }

  /* ---------- Toast helper (reused for cart + contact form) ---------- */
  function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    if (message) toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove('show');
    }, 2500);
  }

  /* ---------- Contact form (index.html + contact.html) ---------- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      this.reset();
      showToast('Message sent successfully!');
    });
  }

  /* =====================================================================
     CART
     Stored in localStorage as an array of { id, name, price, img, qty }
  ===================================================================== */
  var CART_KEY = 'safura_cart';

  function getCart() {
    try {
      var data = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCartCount(cart);
    renderCartDrawer(cart);
  }

  function renderCartCount(cart) {
    var count = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
    document.querySelectorAll('.cart-count').forEach(function (el) {
      el.textContent = count;
    });
  }

  function addToCart(product) {
    var cart = getCart();
    var existing = cart.find(function (item) { return item.id === product.id; });
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        img: product.img,
        qty: 1
      });
    }
    saveCart(cart);
    showToast(product.name + ' added to cart');
    openCartDrawer();
  }

  function updateQty(id, delta) {
    var cart = getCart();
    var item = cart.find(function (i) { return i.id === id; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(function (i) { return i.id !== id; });
    }
    saveCart(cart);
  }

  function removeFromCart(id) {
    var cart = getCart().filter(function (i) { return i.id !== id; });
    saveCart(cart);
  }

  /* ---------- Cart drawer (injected once per page) ---------- */
  var drawer, overlay, itemsWrap, totalEl, emptyEl;

  function buildCartDrawer() {
    if (document.getElementById('cartDrawer')) return;

    overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    overlay.id = 'cartOverlay';

    drawer = document.createElement('aside');
    drawer.className = 'cart-drawer';
    drawer.id = 'cartDrawer';
    drawer.innerHTML =
      '<div class="cart-drawer-head">' +
        '<h3>Your Cart</h3>' +
        '<button class="cart-drawer-close" id="cartDrawerClose" aria-label="Close cart">&times;</button>' +
      '</div>' +
      '<div class="cart-drawer-empty" id="cartDrawerEmpty">Your cart is empty.<br>Add a blend to get started.</div>' +
      '<div class="cart-drawer-items" id="cartDrawerItems"></div>' +
      '<div class="cart-drawer-footer" id="cartDrawerFooter">' +
        '<div class="cart-drawer-total"><span>Subtotal</span><span id="cartDrawerTotal">Rs. 0</span></div>' +
        '<a class="cart-checkout-btn" id="cartCheckoutBtn" target="_blank" rel="noopener">Order via WhatsApp</a>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    itemsWrap = document.getElementById('cartDrawerItems');
    totalEl = document.getElementById('cartDrawerTotal');
    emptyEl = document.getElementById('cartDrawerEmpty');

    overlay.addEventListener('click', closeCartDrawer);
    document.getElementById('cartDrawerClose').addEventListener('click', closeCartDrawer);
  }

  function openCartDrawer() {
    buildCartDrawer();
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderCartDrawer(cart) {
    if (!document.getElementById('cartDrawer')) buildCartDrawer();

    if (cart.length === 0) {
      itemsWrap.innerHTML = '';
      emptyEl.style.display = 'block';
      document.getElementById('cartDrawerFooter').style.display = 'none';
      return;
    }

    emptyEl.style.display = 'none';
    document.getElementById('cartDrawerFooter').style.display = 'block';

    var total = 0;
    itemsWrap.innerHTML = cart.map(function (item) {
      total += item.price * item.qty;
      return (
        '<div class="cart-drawer-item">' +
          '<img src="' + item.img + '" alt="' + item.name + '">' +
          '<div class="cart-drawer-item-info">' +
            '<p class="cart-drawer-item-name">' + item.name + '</p>' +
            '<p class="cart-drawer-item-price">Rs. ' + item.price + '</p>' +
            '<div class="cart-qty-control">' +
              '<button data-action="dec" data-id="' + item.id + '">-</button>' +
              '<span>' + item.qty + '</span>' +
              '<button data-action="inc" data-id="' + item.id + '">+</button>' +
            '</div>' +
          '</div>' +
          '<button class="cart-drawer-item-remove" data-action="remove" data-id="' + item.id + '" aria-label="Remove">&times;</button>' +
        '</div>'
      );
    }).join('');

    totalEl.textContent = 'Rs. ' + total;

    var whatsappNumber = '923208378383';
    var lines = cart.map(function (item) {
      return item.qty + 'x ' + item.name + ' — Rs. ' + (item.price * item.qty);
    });
    var message = 'Hi Safura Tea, I would like to order:%0A' +
      lines.join('%0A') + '%0A%0ATotal: Rs. ' + total;
    document.getElementById('cartCheckoutBtn').href =
      'https://wa.me/' + whatsappNumber + '?text=' + message;

    itemsWrap.querySelectorAll('button[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        var action = btn.getAttribute('data-action');
        if (action === 'inc') updateQty(id, 1);
        if (action === 'dec') updateQty(id, -1);
        if (action === 'remove') removeFromCart(id);
      });
    });
  }

  /* ---------- Wire up Add to Cart buttons ---------- */
  document.querySelectorAll('.add-cart-btn, .shop-add-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-product-id');
      var name = btn.getAttribute('data-product-name');
      var price = parseFloat(btn.getAttribute('data-product-price'));
      var img = btn.getAttribute('data-product-img');
      if (!id || !name || isNaN(price)) return;
      addToCart({ id: id, name: name, price: price, img: img });
    });
  });

  /* ---------- Wire up cart icon in navbar ---------- */
  document.querySelectorAll('.cart-btn').forEach(function (btn) {
    btn.addEventListener('click', openCartDrawer);
  });

  /* ---------- Initial render on page load ---------- */
  renderCartCount(getCart());
  buildCartDrawer();
  renderCartDrawer(getCart());

  /* ---------- Scroll reveal (used on about page) ---------- */
  var revealEls = document.querySelectorAll('.section-reveal, .reveal-left, .reveal-right');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach(function (el) { revealObserver.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  /* ---------- Offer: load from admin localStorage ---------- */
  var offerNum = document.getElementById('offerNum');
  if (!offerNum) return;

  try {
    var saved = JSON.parse(localStorage.getItem('safura_offer'));
    if (saved && saved.number) offerNum.textContent = saved.number;
  } catch (e) {}

  /* ---------- Count-up animation ---------- */
  var target = parseInt(offerNum.textContent, 10);
  if (target > 0) {
    offerNum.textContent = '0';
    var cur = 0;
    var inc = Math.max(1, Math.floor(target / 30));
    var counter = setInterval(function () {
      cur += inc;
      if (cur >= target) { cur = target; clearInterval(counter); }
      offerNum.textContent = cur;
    }, 40);
  }
});
