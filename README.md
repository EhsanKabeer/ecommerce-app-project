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

The app is a single Express server that serves both the API and the static
front end. As long as the host provides Node.js 18+ you can run it without a
separate build step. The guides below walk through, click-by-click, how to ship
the project to popular hosting services and how to confirm everything is
working once traffic reaches the live instance.

### Prepare your repository

1. **Sync your code** – commit the version you want to deploy and push it to a
   Git hosting service (GitHub, GitLab, Bitbucket). Most platforms connect
   directly to those providers.
2. **Capture required secrets** – at minimum generate a random string for
   `SESSION_SECRET`. If you plan to store the SQLite database somewhere other
   than the default `data/app.db`, decide on the new path before you deploy.
3. **Choose a persistence location** – the application will create the SQLite
   file on first write. For production environments, pick storage that survives
   restarts (volumes or attached disks). Note the mount path because you will
   reference it as the `DATABASE_PATH` environment variable.

### Option 1: Deploy with Render (web dashboard)

Render’s Web Service product is a good fit for full-stack Node apps. You only
need a Git repository—Render handles builds, SSL, and scaling.

1. Sign in at [render.com](https://render.com) and click **New ➝ Web Service**.
2. Connect your GitHub/GitLab account (if prompted) and pick the repository that
   contains this project. Select the branch you want to deploy (e.g. `main`).
3. In the **Environment** dropdown choose **Node**. Leave the **Build Command**
   blank (Render runs `npm install` automatically) and set the **Start Command**
   to `node server.js`.
4. Expand **Advanced** ➝ **Environment Variables** and add:
   * `SESSION_SECRET` with the random value you generated earlier.
   * `DATABASE_PATH=/data/app.db` (or another filename) so the database lives on
     the persistent disk you will attach next.
   * You can leave `PORT` empty—Render supplies it automatically.
5. Scroll to **Add a Disk**, choose a size (e.g. 1 GB), and mount it at
   `/data`. This ensures your SQLite database persists across redeployments.
6. Click **Create Web Service**. Render will install dependencies and boot the
   app. Wait until the service status shows **Live**.
7. Open the generated `onrender.com` URL. Create an account, add items to the
   cart, and place an order. Confirm the data persists by refreshing the page or
   logging back in—orders should still be listed under “My Account”.

### Option 2: Deploy with Railway (web dashboard or CLI)

Railway provides a streamlined workflow for hosting Node apps with optional
persistent volumes.

1. Visit [railway.app](https://railway.app) and create a project. Choose **New ➝
   GitHub Repo** (web) or run `railway init` from your local clone if you prefer
   the CLI.
2. Select the repository and branch to deploy. Railway detects the Node runtime
   and will run `npm install` followed by your start command.
3. Open **Service Settings ➝ Variables** and add:
   * `SESSION_SECRET=<your random value>`
   * `DATABASE_PATH=/mnt/data/app.db` (replace `/mnt/data` with the mount path
     you configure in the next step)
4. Go to **Service Settings ➝ Volumes**, click **Add Volume**, choose a size, and
   mount it to `/mnt/data`. This directory now persists between deployments.
5. In **Deployments ➝ Settings**, ensure the **Start Command** is `node
   server.js`. Trigger a deployment if one is not already running.
6. Once the build succeeds and the container is healthy, click the generated
   Railway domain. Sign up for a new account in the app, complete a checkout, and
   revisit the **My Account** page to verify that the order remains after a page
   refresh.

### Option 3: Deploy with Fly.io (Docker-based)

If you prefer to run the service close to end users with automatic regional
replication, Fly.io is a solid choice. It uses Docker images built from a
`fly.toml` configuration.

1. Install the Fly CLI (`curl -L https://fly.io/install.sh | sh`) and log in via
   `fly auth login`.
2. From the project root run `fly launch --no-deploy`. When prompted:
   * Choose a unique app name.
   * Pick a region near your users.
   * Answer “No” when asked if you want to deploy now (so you can edit the
     configuration first).
3. Fly will generate a `fly.toml` and `Dockerfile`. Edit `fly.toml` so that:
   * `PORT` is set to `3000` (Fly maps it to the public address).
   * Add a `[mounts]` section pointing to a volume, e.g.:

     ```toml
     [mounts]
       source = "sqldata"
       destination = "/data"
     ```

4. Create the volume with `fly volumes create sqldata --size 1`. This will hold
   the SQLite database. Update the app’s environment variables in `fly.toml`:

   ```toml
   [env]
     SESSION_SECRET = "<random string>"
     DATABASE_PATH = "/data/app.db"
   ```

5. Deploy with `fly deploy`. The CLI builds the Docker image, uploads it, and
   starts the VM. Watch the logs to ensure the server boots without errors.
6. When deployment finishes, run `fly open` to launch the public URL in your
   browser. Sign up and place an order to confirm persistence. You can also SSH
   into the instance (`fly ssh console`) to inspect `/data/app.db` directly.

### Self-hosted / Virtual Machine

You can also manage the deployment yourself on infrastructure like DigitalOcean
Droplets, AWS EC2, or a home server.

1. Provision a machine running Linux with Node.js 18+ (install via `nvm` or your
   package manager). Ensure the firewall allows inbound traffic on the port you
   intend to use.
2. Clone the repository onto the server and install dependencies:

   ```bash
   git clone <your repo url>
   cd ecommerce-app-project
   npm install
   ```

3. Export production environment variables before starting the service:

   ```bash
   export SESSION_SECRET="<random string>"
   export DATABASE_PATH="/var/lib/ecommerce/app.db"  # adjust as needed
   export PORT=3000
   ```

4. Start the app with `node server.js` for a quick test. For long-running
   production use, wrap it in a process manager like `pm2` or `systemd` so it
   restarts automatically after crashes or reboots.
5. Configure your reverse proxy (Nginx, Caddy, Traefik) to terminate TLS and
   forward HTTPS traffic to `localhost:3000`. Point your domain’s DNS to the
   server’s public IP.
6. Visit your domain, create an account, and place an order. Confirm the app
   writes to the SQLite file you configured.

### Post-deployment verification checklist

* Visit the `/api/health` endpoint (or the home page) to confirm the process is
  running.
* Create a new account, add products to the cart, and place an order to test
  the entire flow.
* Inspect the SQLite database at the configured path to ensure rows are being
  written (`sqlite3 /path/to/app.db 'SELECT * FROM orders;'`).

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
