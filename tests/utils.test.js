const jwt = require('jsonwebtoken');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const generateToken = require('../utils/generateToken');


describe('Pagination utility - getPagination()', () => {
  test('1. returns default page and limit when none provided', () => {
    const { page, limit, skip } = getPagination({});
    expect(page).toBe(1);
    expect(limit).toBe(10);
    expect(skip).toBe(0);
  });

  test('2. parses valid page and limit from query correctly', () => {
    const { page, limit, skip } = getPagination({ page: '3', limit: '5' });
    expect(page).toBe(3);
    expect(limit).toBe(5);
    expect(skip).toBe(10); // (3-1) * 5
  });

  test('3. falls back to default values on invalid/non-numeric input', () => {
    const { page, limit } = getPagination({ page: 'abc', limit: '-5' });
    expect(page).toBe(1);
    expect(limit).toBe(10);
  });

  test('4. caps limit at the configured maxLimit', () => {
    const { limit } = getPagination({ limit: '500' }, { maxLimit: 50 });
    expect(limit).toBe(50);
  });
});

describe('Pagination utility - buildPaginationMeta()', () => {
  test('5. computes totalPages and next/prev flags correctly', () => {
    const meta = buildPaginationMeta(25, 2, 10);
    expect(meta.totalPages).toBe(3);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(true);
  });

  test('6. handles zero total records without errors', () => {
    const meta = buildPaginationMeta(0, 1, 10);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });
});


describe('generateToken utility', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_key';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  test('7. generates a valid JWT that decodes to the given user id', () => {
    const userId = '64f1a2b3c4d5e6f7a8b9c0d1';
    const token = generateToken(userId);

    expect(typeof token).toBe('string');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(userId);
  });

  test('8. throws when verifying with an incorrect secret', () => {
    const token = generateToken('64f1a2b3c4d5e6f7a8b9c0d1');

    expect(() => {
      jwt.verify(token, 'wrong_secret');
    }).toThrow();
  });
});