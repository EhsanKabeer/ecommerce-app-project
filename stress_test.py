"""Stress test utility for the mini e-commerce API with authentication support."""

import json
import threading
import time
import urllib.error
import urllib.request
from http import cookiejar
from typing import List

BASE_URL = 'http://localhost:3000'


def create_session_opener() -> urllib.request.OpenerDirector:
  jar = cookiejar.CookieJar()
  return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def post_json(opener: urllib.request.OpenerDirector, path: str, payload: dict | List[dict]):
  data = json.dumps(payload).encode('utf-8')
  req = urllib.request.Request(
      f'{BASE_URL}{path}',
      data=data,
      headers={'Content-Type': 'application/json'},
      method='POST'
  )
  with opener.open(req, timeout=5) as resp:
    body = resp.read().decode('utf-8')
    return resp.getcode(), body


def delete_json(opener: urllib.request.OpenerDirector, path: str, payload: dict):
  data = json.dumps(payload).encode('utf-8')
  req = urllib.request.Request(
      f'{BASE_URL}{path}',
      data=data,
      headers={'Content-Type': 'application/json'},
      method='DELETE'
  )
  with opener.open(req, timeout=5) as resp:
    body = resp.read().decode('utf-8')
    return resp.getcode(), body


def bootstrap_user(opener: urllib.request.OpenerDirector):
  timestamp = int(time.time() * 1000)
  payload = {
      'username': f'Tester{timestamp}',
      'email': f'tester{timestamp}@example.com',
      'password': 'P@ssword123'
  }
  status, body = post_json(opener, '/api/signup', payload)
  if status not in (200, 201):
    raise RuntimeError(f'Failed to bootstrap user: {status} {body}')


def send_order(opener: urllib.request.OpenerDirector, order_data: List[dict]):
  try:
    status, body = post_json(opener, '/api/order', order_data)
    print(f'Order {order_data} → HTTP {status}: {body}')
  except urllib.error.HTTPError as exc:
    print(f'Order {order_data} → HTTP {exc.code}: {exc.read().decode()}')
  except Exception as exc:  # pragma: no cover - diagnostic only
    print(f'Order {order_data} → Error: {exc}')


def run_concurrent_tests(opener: urllib.request.OpenerDirector):
  test_orders = [
      [{'id': 1, 'quantity': 1}],
      [{'id': 2, 'quantity': 3}, {'id': 3, 'quantity': 2}],
      [{'id': 4, 'quantity': 1}, {'id': 5, 'quantity': 1}],
      [],  # empty order
      [{'id': 99, 'quantity': 1}],  # unknown product
      [{'id': 1, 'quantity': -1}],  # invalid quantity
  ]
  threads = []
  for order in test_orders:
    thread = threading.Thread(target=send_order, args=(opener, order))
    threads.append(thread)
    thread.start()
    time.sleep(0.1)
  for thread in threads:
    thread.join()


def cleanup(opener: urllib.request.OpenerDirector):
  try:
    delete_json(opener, '/api/account', {'password': 'P@ssword123'})
  except Exception:
    pass


if __name__ == '__main__':
  opener = create_session_opener()
  bootstrap_user(opener)
  try:
    run_concurrent_tests(opener)
  finally:
    cleanup(opener)
