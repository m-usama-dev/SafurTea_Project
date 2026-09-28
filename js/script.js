/* =====================================================================
   Safura Tea — Shared site script
   Handles: mobile nav, toast notifications, cart drawer, offer badge
   Loaded on every page so behaviour stays consistent everywhere.
===================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.section-reveal');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- Mobile nav toggle ---------- */
  var hamburger = document.getElementById('hamburger');
  var navLinks = document.getElementById('navLinks');

  function setNav(open) {
    if (!navLinks || !hamburger) return;
    navLinks.classList.toggle('open', open);
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (hamburger && navLinks) {
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('tabindex', '0');
    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      setNav(!navLinks.classList.contains('open'));
    });
    hamburger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setNav(!navLinks.classList.contains('open'));
      }
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setNav(false);
      });
    });
    document.addEventListener('click', function (e) {
      if (!navLinks.classList.contains('open')) return;
      if (navLinks.contains(e.target) || hamburger.contains(e.target)) return;
      setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setNav(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setNav(false);
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

  /* ---------- Video spotlight ---------- */
  var spotlightTrack = document.getElementById('spotlightTrack');
  if (spotlightTrack) {
    var spotlightCards = Array.prototype.slice.call(spotlightTrack.querySelectorAll('.spotlight-video'));
    function setSpotlightActive(nextIndex) {
      var length = spotlightCards.length;
      nextIndex = (nextIndex + length) % length;
      spotlightCards.forEach(function (card, index) {
        var video = card.querySelector('video');
        card.classList.toggle('is-active', index === nextIndex);
        var position = (index - nextIndex + length) % length;
        card.classList.toggle('is-prev', position === length - 1);
        card.classList.toggle('is-next', position === 1);
        if (video) video.pause();
        if (video) video.currentTime = 0;
      });
    }
    function moveSpotlight(step) {
      var current = spotlightCards.findIndex(function (card) { return card.classList.contains('is-active'); });
      setSpotlightActive(current + step);
    }
    var prevSpotlight = document.querySelector('.spotlight-prev');
    var nextSpotlight = document.querySelector('.spotlight-next');
    if (prevSpotlight) prevSpotlight.addEventListener('click', function () { moveSpotlight(-1); });
    if (nextSpotlight) nextSpotlight.addEventListener('click', function () { moveSpotlight(1); });
    spotlightCards.forEach(function (card, index) {
      card.addEventListener('click', function () {
        if (!card.classList.contains('is-active')) setSpotlightActive(index);
      });
      var playButton = card.querySelector('.spotlight-play');
      if (playButton) playButton.addEventListener('click', function (event) {
        event.stopPropagation();
        var video = card.querySelector('video');
        if (!video) return;
        if (video.paused) video.play().catch(function () {});
        else video.pause();
      });
    });
    setSpotlightActive(spotlightCards.findIndex(function (card) {
      return card.classList.contains('is-active');
    }));
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
