"""
stress_test.py
===============

This script exercises the e‑commerce API by sending a mixture of
valid and invalid order requests.  It uses Python’s built‑in
``urllib`` module so no external dependencies are required.  The
tests include concurrency (via threading) to simulate multiple users
ordering at once and verify that the server responds correctly
under load.

Usage::

    python stress_test.py

Before running the test, ensure that the server is running on the
default port (3000) by executing ``node server.js`` in another
terminal.
"""

import json
import threading
import time
import urllib.request
import urllib.error

BASE_URL = 'http://localhost:3000'


def send_order(order_data):
    """Send a single order and print the response."""
    req = urllib.request.Request(
        f'{BASE_URL}/api/order',
        data=json.dumps(order_data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = resp.read().decode('utf-8')
            print(f'Order {order_data} → {body}')
    except urllib.error.HTTPError as e:
        print(f'Order {order_data} → HTTP {e.code}: {e.read().decode()}')
    except Exception as e:
        print(f'Order {order_data} → Error: {e}')


def run_concurrent_tests():
    """Dispatch a series of orders concurrently to the API."""
    test_orders = [
        # Valid orders
        [{'id': 1, 'quantity': 1}],
        [{'id': 2, 'quantity': 3}, {'id': 3, 'quantity': 2}],
        [{'id': 4, 'quantity': 1}, {'id': 5, 'quantity': 1}],
        # Invalid orders
        [],  # empty order
        [{'id': 99, 'quantity': 1}],  # unknown product
        [{'id': 1, 'quantity': -1}],  # invalid quantity
    ]
    threads = []
    for order in test_orders:
        t = threading.Thread(target=send_order, args=(order,))
        threads.append(t)
        t.start()
        time.sleep(0.1)  # small delay to stagger requests
    for t in threads:
        t.join()


if __name__ == '__main__':
    run_concurrent_tests()