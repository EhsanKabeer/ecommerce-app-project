# Mini E‑Commerce Application

This project is a minimalist full‑stack e‑commerce web application.  The
latest iteration layers user accounts, authentication and SQLite backed
data persistence on top of the original catalogue and order flow.  The
goal is to keep the technology footprint approachable while showcasing
how the core pieces of a modern e‑commerce experience fit together.

## Features

* **Product catalogue API** — a JSON endpoint (`/api/products`) that
  serves a curated list of demo products including names, descriptions,
  prices and image URLs.
* **Static front end** — the Node server delivers HTML, CSS and
  JavaScript assets from the `client` directory.
* **Shopping cart** — maintained on the front end; users can add
  products, view quantities and see a running total in real time.
* **Authenticated checkout** — orders are submitted through
  `/api/order`.  The server validates each line item and persists the
  order together with the authenticated user who placed it.
* **Account management** — REST APIs for signing up, logging in/out,
  reading/updating profile details and deleting an account (with order
  history cleanup).  Session state is backed by cookie‑based Express
  sessions and passwords are hashed with PBKDF2.
* **Order history UI** — the “My Account” page surfaces saved orders and
  profile information using authenticated fetch requests.

## Technology Stack

| Layer       | Technology                             |
| ----------- | -------------------------------------- |
| Back end    | Node.js + Express + express-session     |
| Front end   | Vanilla JavaScript, HTML and CSS        |
| Data store  | SQLite (via the `sqlite3` Node module)  |

## Running the Application

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the server**

   The Node server listens on port 3000 by default:

   ```bash
   node server.js
   ```

   You should see a message similar to:

   ```
   E‑Commerce server running at http://localhost:3000
   ```

3. **Open the application in a browser**

   Navigate to `http://localhost:3000` in your web browser.  The product
   catalogue will load automatically.  Create an account or log in to
   unlock checkout and the account dashboard.  Orders and profile
   changes persist to the SQLite database found in `data/app.db` by default.
   To store the database in a different location, set the `DATABASE_PATH`
   environment variable before starting the server (relative paths resolve from
   the project root).

## Deployment

The app is a single Express server that also serves the static front-end
files, so deployment only requires running `node server.js` on a host with
Node.js 18+ available. The steps below walk through a typical deployment to
an all-in-one Node hosting service such as [Render](https://render.com),
[Railway](https://railway.app) or a generic virtual machine.

1. **Prepare the repository**

   * Commit all changes so the hosting provider can pull directly from your
     Git repository.
   * Ensure the `sqlite3` dependency is listed in `package.json`; the build
     step installs it automatically.

2. **Configure the service**

   * Create a new “Web Service” (Render/Railway) or VM.
   * Point it at your Git repository or push the repo to the host.
   * Set the start command to:

     ```bash
     node server.js
     ```

   * (Optional) define environment variables:
     * `PORT` – override the default `3000` port if your platform requires a
       different listening port.
     * `SESSION_SECRET` – customize the session secret used by Express.
     * `DATABASE_PATH` – set an absolute or relative path for the SQLite
       database file. Relative paths resolve from the project directory.

3. **Persist the SQLite database**

   The default database path is `data/app.db`. Most hosts mount the
   application directory on ephemeral storage, so configure a persistent
   volume if you need data to survive restarts:

   * Render: add a “Disk” mounted to `/data` and set `DATABASE_PATH=/data/app.db`.
   * Railway: add a volume and set `DATABASE_PATH` to a path on that volume.

4. **Deploy**

   * Trigger the initial build/deploy from the host UI. The service will run
     `npm install` followed by your start command.
   * Once the instance is healthy, open the provided URL. You should see the
     same UI you get locally, and the APIs will use the deployed SQLite
     database for persistence.

For bare-metal or VM deployments, install Node.js 18+, run `npm install`,
start the app with `node server.js`, and configure your process manager of
choice (e.g. `pm2`, `systemd`) to keep it running.

## Deployment

The app is a single Express server that also serves the static front-end
files, so deployment only requires running `node server.js` on a host with
Node.js 18+ available. The steps below walk through a typical deployment to
an all-in-one Node hosting service such as [Render](https://render.com),
[Railway](https://railway.app) or a generic virtual machine.

1. **Prepare the repository**

   * Commit all changes so the hosting provider can pull directly from your
     Git repository.
   * Ensure the `sqlite3` dependency is listed in `package.json`; the build
     step installs it automatically.

2. **Configure the service**

   * Create a new “Web Service” (Render/Railway) or VM.
   * Point it at your Git repository or push the repo to the host.
   * Set the start command to:

     ```bash
     node server.js
     ```

   * (Optional) define environment variables:
     * `PORT` – override the default `3000` port if your platform requires a
       different listening port.
     * `SESSION_SECRET` – customize the session secret used by Express.

3. **Persist the SQLite database**

   The default database path is `data/app.db`. Most hosts mount the
   application directory on ephemeral storage, so configure a persistent
   volume if you need data to survive restarts:

   * Render: add a “Disk” mounted to `/data` and set `DATABASE_PATH=/data/app.db`.
   * Railway: add a volume and update the start command to copy the database
     there (or set `DATABASE_PATH`).

   Update `server.js` to read the `DATABASE_PATH` environment variable if you
   plan on using a custom location.

4. **Deploy**

   * Trigger the initial build/deploy from the host UI. The service will run
     `npm install` followed by your start command.
   * Once the instance is healthy, open the provided URL. You should see the
     same UI you get locally, and the APIs will use the deployed SQLite
     database for persistence.

For bare-metal or VM deployments, install Node.js 18+, run `npm install`,
start the app with `node server.js`, and configure your process manager of
choice (e.g. `pm2`, `systemd`) to keep it running.

## Extending the Project

This foundation is intentionally lightweight so it can serve as a
springboard for experimentation:

1. Replace the static catalogue with product CRUD endpoints backed by
   the database.
2. Swap the session‑based authentication flow for JWTs or integrate a
   third‑party identity provider.
3. Expand the order data model to include shipping addresses, payment
   status and fulfilment workflows.
4. Add automated testing (API + front end).  The included
   `stress_test.py` script illustrates how to exercise the endpoints with
   concurrent, authenticated requests.
5. Transition to a modern front‑end framework (React, Vue, etc.) while
   preserving the API contract.

## License

This project is provided under the MIT license.  Feel free to use it
as a starting point for your own experiments and portfolio projects.
