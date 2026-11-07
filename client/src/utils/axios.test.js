jest.mock('axios', () => {
  const instance = {
    interceptors: { request: { use: jest.fn() } },
  };
  return { create: jest.fn(() => instance), __instance: instance };
});

import axios from 'axios';
import './axios';

// Capture at import time — CRA resets mocks before every test
const handler = axios.__instance.interceptors.request.use.mock.calls[0][0];

test('request interceptor attaches the stored token', () => {
  localStorage.setItem('token', 'abc123');
  expect(handler({ headers: {} }).headers.Authorization).toBe('Bearer abc123');

  // an explicit header is never overwritten
  const kept = handler({ headers: { Authorization: 'Bearer other' } });
  expect(kept.headers.Authorization).toBe('Bearer other');

  localStorage.removeItem('token');
  expect(handler({ headers: {} }).headers.Authorization).toBeUndefined();
});
