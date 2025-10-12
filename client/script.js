(() => {
  const state = {
    cart: [],
    products: [],
    productMap: new Map(),
    user: null
  };

  const views = Array.from(document.querySelectorAll('.route-view'));
  const navLinks = Array.from(document.querySelectorAll('[data-route-link]'));
  const accountLink = navLinks.find(link => link.dataset.routeLink === 'account');
  const loginLink = navLinks.find(link => link.dataset.routeLink === 'login');
  const signupLink = navLinks.find(link => link.dataset.routeLink === 'signup');
  const userGreeting = document.getElementById('user-greeting');
  const logoutBtn = document.getElementById('logout-btn');
  const checkoutBtn = document.getElementById('checkout-btn');
  const orderStatus = document.getElementById('order-status');

  function setUser(user) {
    state.user = user;
    updateHeader();
    updateCartUI();
  }

  function updateHeader() {
    if (state.user) {
      userGreeting.textContent = `Signed in as ${state.user.username}`;
      userGreeting.hidden = false;
      logoutBtn.hidden = false;
      accountLink?.classList.remove('hidden');
      loginLink?.classList.add('hidden');
      signupLink?.classList.add('hidden');
    } else {
      userGreeting.hidden = true;
      logoutBtn.hidden = true;
      accountLink?.classList.add('hidden');
      loginLink?.classList.remove('hidden');
      signupLink?.classList.remove('hidden');
    }
  }

  function navigate(route) {
    const target = document.getElementById(route) || document.getElementById('home');
    const requiresAuth = target.classList.contains('requires-auth-view') || route === 'account';
    if (requiresAuth && !state.user) {
      window.location.hash = '#login';
      showView('login');
      return;
    }
    window.location.hash = `#${route}`;
    showView(route);
  }

  function showView(route) {
    views.forEach(view => {
      view.classList.toggle('active', view.id === route);
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.routeLink === route);
    });
    if (route === 'account' && state.user) {
      loadAccountData();
    }
    if (route === 'login') {
      document.getElementById('login-status').textContent = '';
    }
    if (route === 'signup') {
      document.getElementById('signup-status').textContent = '';
    }
  }

  function updateCartUI() {
    const cartList = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    cartList.innerHTML = '';
    let total = 0;
    state.cart.forEach(item => {
      const li = document.createElement('li');
      li.className = 'cart-item';
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
    checkoutBtn.disabled = state.cart.length === 0 || !state.user;
    if (!state.user) {
      orderStatus.textContent = 'Log in to place your order.';
    } else {
      orderStatus.textContent = '';
    }
  }

  function addToCart(product) {
    const existing = state.cart.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({ product, quantity: 1 });
    }
    updateCartUI();
  }

  function renderProducts(products) {
    const container = document.getElementById('product-list');
    container.innerHTML = '';
    state.products = products;
    state.productMap = new Map(products.map(product => [product.id, product]));
    products.forEach(product => {
      const card = document.createElement('article');
      card.className = 'product-card';
      const img = document.createElement('img');
      img.src = product.image;
      img.alt = product.name;
      const name = document.createElement('h3');
      name.textContent = product.name;
      const desc = document.createElement('p');
      desc.textContent = product.description;
      const price = document.createElement('p');
      price.className = 'price';
      price.textContent = `$${product.price.toFixed(2)}`;
      const btn = document.createElement('button');
      btn.className = 'primary';
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

  async function checkout() {
    if (state.cart.length === 0) return;
    if (!state.user) {
      navigate('login');
      return;
    }
    checkoutBtn.disabled = true;
    orderStatus.textContent = 'Processing your order...';
    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.cart.map(item => ({ id: item.product.id, quantity: item.quantity })))
      });
      const data = await response.json();
      if (response.ok && data.success) {
        state.cart = [];
        updateCartUI();
        orderStatus.textContent = `Order placed successfully! Your order ID is ${data.orderId}.`;
        if (window.location.hash === '#account') {
          await loadOrders();
        }
      } else {
        orderStatus.textContent = `Error placing order: ${data.error || 'Unknown error'}`;
      }
    } catch (err) {
      orderStatus.textContent = 'An error occurred while placing your order.';
    } finally {
      checkoutBtn.disabled = state.cart.length === 0 || !state.user;
    }
  }

  function renderOrders(orders) {
    const list = document.getElementById('orders-list');
    const emptyState = document.getElementById('orders-empty');
    list.innerHTML = '';
    if (!orders || orders.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;
    orders.forEach(order => {
      const li = document.createElement('li');
      li.className = 'order-card';
      const header = document.createElement('div');
      header.className = 'order-card-header';
      const title = document.createElement('h4');
      title.textContent = `Order #${order.id}`;
      const date = document.createElement('span');
      date.className = 'order-date';
      const createdAt = new Date(order.createdAt);
      date.textContent = createdAt.toLocaleString();
      header.appendChild(title);
      header.appendChild(date);

      const itemsList = document.createElement('ul');
      itemsList.className = 'order-items';
      order.items.forEach(item => {
        const product = state.productMap.get(item.id);
        const itemLi = document.createElement('li');
        const name = product ? product.name : `Product ${item.id}`;
        itemLi.textContent = `${name} x${item.quantity}`;
        itemsList.appendChild(itemLi);
      });

      const total = document.createElement('p');
      total.className = 'order-total';
      total.textContent = `Total: $${Number(order.total).toFixed(2)}`;

      li.appendChild(header);
      li.appendChild(itemsList);
      li.appendChild(total);
      list.appendChild(li);
    });
  }

  async function loadOrders() {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) {
        if (res.status === 401) {
          setUser(null);
          navigate('login');
        }
        return;
      }
      const data = await res.json();
      renderOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    }
  }

  async function loadAccountData() {
    try {
      const [accountRes, ordersRes] = await Promise.all([fetch('/api/account'), fetch('/api/orders')]);
      if (accountRes.status === 401) {
        setUser(null);
        navigate('login');
        return;
      }
      const accountData = await accountRes.json();
      if (accountData.user) {
        setUser(accountData.user);
        const profileForm = document.getElementById('profile-form');
        profileForm.username.value = accountData.user.username;
        profileForm.email.value = accountData.user.email;
      }
      if (ordersRes.status === 401) {
        renderOrders([]);
        return;
      }
      const ordersData = await ordersRes.json();
      renderOrders(ordersData.orders || []);
    } catch (err) {
      console.error('Failed to load account data', err);
    }
  }

  async function loadSession() {
    try {
      const res = await fetch('/api/session');
      if (!res.ok) return;
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error('Failed to fetch session', err);
    }
  }

  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      const products = await res.json();
      renderProducts(products);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    const form = event.target;
    const status = document.getElementById('signup-status');
    status.textContent = 'Creating your account...';
    const payload = {
      username: form.username.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value
    };
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        status.textContent = data.error || 'Failed to sign up.';
        return;
      }
      form.reset();
      status.textContent = 'Account created! Redirecting to your dashboard...';
      setUser(data.user);
      setTimeout(() => navigate('account'), 600);
    } catch (err) {
      status.textContent = 'An unexpected error occurred.';
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const status = document.getElementById('login-status');
    status.textContent = 'Signing you in...';
    const payload = {
      email: form.email.value.trim(),
      password: form.password.value
    };
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        status.textContent = data.error || 'Failed to log in.';
        return;
      }
      form.reset();
      status.textContent = 'Login successful!';
      setUser(data.user);
      setTimeout(() => navigate('account'), 400);
    } catch (err) {
      status.textContent = 'An unexpected error occurred.';
    }
  }

  async function handleProfileUpdate(event) {
    event.preventDefault();
    if (!state.user) {
      navigate('login');
      return;
    }
    const form = event.target;
    const status = document.getElementById('profile-status');
    status.textContent = 'Saving changes...';
    const payload = {
      username: form.username.value.trim(),
      email: form.email.value.trim()
    };
    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        status.textContent = data.error || 'Failed to update profile.';
        return;
      }
      status.textContent = 'Profile updated successfully.';
      setUser(data.user);
    } catch (err) {
      status.textContent = 'An unexpected error occurred.';
    }
  }

  async function handleDeleteAccount(event) {
    event.preventDefault();
    if (!state.user) {
      navigate('login');
      return;
    }
    const form = event.target;
    const status = document.getElementById('delete-status');
    status.textContent = 'Deleting account...';
    const payload = { password: form.password.value };
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status === 204) {
        status.textContent = 'Account deleted.';
        form.reset();
        setUser(null);
        state.cart = [];
        updateCartUI();
        setTimeout(() => navigate('home'), 500);
        return;
      }
      const data = await res.json();
      status.textContent = data.error || 'Failed to delete account.';
    } catch (err) {
      status.textContent = 'An unexpected error occurred.';
    }
  }

  async function handleLogout() {
    try {
      const res = await fetch('/api/logout', { method: 'POST' });
      if (res.status === 204) {
        setUser(null);
        state.cart = [];
        updateCartUI();
        navigate('home');
      }
    } catch (err) {
      console.error('Failed to log out', err);
    }
  }

  function handleRouteFromHash() {
    const hash = window.location.hash.replace('#', '') || 'home';
    if (hash === 'account' && !state.user) {
      showView('login');
      window.location.hash = '#login';
      return;
    }
    showView(hash);
  }

  function bindEvents() {
    document.getElementById('checkout-btn').addEventListener('click', checkout);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
    document.getElementById('delete-form').addEventListener('submit', handleDeleteAccount);
    logoutBtn.addEventListener('click', handleLogout);
    navLinks.forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        navigate(link.dataset.routeLink);
      });
    });
    window.addEventListener('hashchange', handleRouteFromHash);
  }

  function initFooter() {
    const year = new Date().getFullYear();
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
      yearSpan.textContent = String(year);
    }
  }

  async function init() {
    bindEvents();
    initFooter();
    await loadSession();
    await loadProducts();
    updateCartUI();
    handleRouteFromHash();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
