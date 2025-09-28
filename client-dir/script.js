// script.js
//
// Handles client‑side logic for the mini e‑commerce application.  It
// fetches the product catalogue from the server, renders product cards
// and manages a shopping cart in memory.  When the user checks out,
// the cart is sent to the backend via a JSON POST request.

(() => {
  /**
   * In‑memory representation of the shopping cart.  Each entry has
   * the structure { product: Product, quantity: number }.
   * @type {Array<{product: any, quantity: number}>}
   */
  const cart = [];

  /**
   * Update the cart UI in the sidebar.  Recomputes totals and
   * enables/disables the checkout button accordingly.
   */
  function updateCartUI() {
    const cartList = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const orderStatus = document.getElementById('order-status');

    // Clear existing items
    cartList.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
      const li = document.createElement('li');
      const nameSpan = document.createElement('span');
      nameSpan.textContent = `${item.product.name} (x${item.quantity})`;
      const priceSpan = document.createElement('span');
      const subtotal = item.product.price * item.quantity;
      priceSpan.textContent = `$${subtotal.toFixed(2)}`;
      total += subtotal;
      li.appendChild(nameSpan);
      li.appendChild(priceSpan);
      cartList.appendChild(li);
    });
    cartTotal.textContent = `Total: $${total.toFixed(2)}`;
    checkoutBtn.disabled = cart.length === 0;
    orderStatus.textContent = '';
  }

  /**
   * Add a product to the cart.  If the product already exists in the
   * cart, increment its quantity.
   *
   * @param {any} product
   */
  function addToCart(product) {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ product, quantity: 1 });
    }
    updateCartUI();
  }

  /**
   * Render the list of products fetched from the API.
   *
   * @param {Array<any>} products
   */
  function renderProducts(products) {
    const container = document.getElementById('product-list');
    container.innerHTML = '';
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      const img = document.createElement('img');
      img.src = product.image;
      img.alt = product.name;
      const name = document.createElement('h3');
      name.textContent = product.name;
      const desc = document.createElement('p');
      desc.textContent = product.description;
      const price = document.createElement('p');
      price.textContent = `$${product.price.toFixed(2)}`;
      const btn = document.createElement('button');
      btn.textContent = 'Add to Cart';
      btn.addEventListener('click', () => addToCart(product));
      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(desc);
      card.appendChild(price);
      card.appendChild(btn);
      container.appendChild(card);
    });
  }

  /**
   * Submit the current cart to the backend for order processing.
   */
  async function checkout() {
    const checkoutBtn = document.getElementById('checkout-btn');
    const orderStatus = document.getElementById('order-status');
    checkoutBtn.disabled = true;
    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cart.map(item => ({ id: item.product.id, quantity: item.quantity })))
      });
      const data = await response.json();
      if (data.success) {
        orderStatus.textContent = `Order placed successfully! Your order ID is ${data.orderId}.`;
        cart.length = 0;
        updateCartUI();
      } else {
        orderStatus.textContent = `Error placing order: ${data.error || 'Unknown error'}`;
      }
    } catch (err) {
      orderStatus.textContent = 'An error occurred while placing your order.';
    }
  }

  /**
   * Initialize the application: fetch products and bind event listeners.
   */
  async function init() {
    try {
      const res = await fetch('/api/products');
      const products = await res.json();
      renderProducts(products);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
    document.getElementById('checkout-btn').addEventListener('click', checkout);
    updateCartUI();
  }

  // Run the app once the DOM is fully loaded.
  window.addEventListener('DOMContentLoaded', init);
})();