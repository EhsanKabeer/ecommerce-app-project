# Mini E‑Commerce Application

This project is a minimalist full‑stack e‑commerce web application built
without any third‑party libraries.  It demonstrates how to implement
client–server communication, routing and data persistence using only the
standard Node.js modules and browser APIs.  By avoiding heavy
frameworks, the application highlights core software engineering
concepts that are applicable across many languages and frameworks.

## Features

* **Product catalogue API** — a JSON endpoint (`/api/products`) that
  serves a hard‑coded list of products including names, descriptions,
  prices and image URLs.
- **Static file serving** — the Node server delivers HTML, CSS and
  JavaScript assets from the `client` directory.
- **Shopping cart** — implemented entirely on the front end; users can
  add products, view quantities and see a running total.
- **Checkout flow** — sends the cart contents to the server via a
  JSON POST request (`/api/order`).  The server validates product
  IDs and quantities, calculates the order total and returns a mock
  order ID and total amount.  Invalid orders (empty cart, unknown
  products or negative quantities) result in descriptive error
  responses.

## Technology Stack

| Layer       | Technology                             |
| ----------- | -------------------------------------- |
| Back end    | Node.js (built‑in `http` module)        |
| Front end   | Vanilla JavaScript, HTML and CSS        |
| Data store  | In‑memory objects (no external database) |

## Running the Application

1. **Navigate to the project directory**

   ```bash
   cd ecommerce-app
   ```

2. **Start the server**

   Run the Node server.  It listens on port 3000 by default:

   ```bash
   node server.js
   ```

   You should see a message similar to:

   ```
   E‑Commerce server running at http://localhost:3000
   ```

3. **Open the application in a browser**

   Navigate to `http://localhost:3000` in your web browser.  The product
   catalogue will load automatically.  Add items to your cart and click
   the **Checkout** button to place a mock order.  The server validates
   the order and returns an order ID along with the total cost.  Invalid
   carts trigger error messages.

## Extending the Project

This skeleton can be expanded in numerous ways to create a more
production‑ready system:

1. **Replace the hard‑coded catalogue** with a database such as
   MongoDB or PostgreSQL and implement CRUD APIs for managing products.
2. **Implement user authentication** using sessions or JSON Web Tokens.
3. **Persist orders** to a database and integrate payment processing via
   a service like Stripe.
4. **Automated testing** — review the `stress_test.py` script in the
   repository.  It uses Python’s built‑in `urllib` and `threading`
   modules to send concurrent valid and invalid orders to the API,
   demonstrating how to simulate load and ensure the server responds
   correctly under edge cases.
4. **Add search and filtering** to the product list and implement
   pagination for large catalogues.
5. **Transition to a modern front‑end framework** (React, Angular,
   Vue, etc.) while preserving the existing API contract to
   demonstrate understanding of client–server separation.

## License

This project is provided under the MIT license.  Feel free to use it
as a starting point for your own experiments and portfolio projects.