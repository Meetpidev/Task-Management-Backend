/**
 * Parses pagination params from query string.
 * @param {object} query - req.query
 * @param {object} opts - { defaultLimit, maxLimit }
 */
const getPagination = (query, opts = {}) => {
  const defaultLimit = opts.defaultLimit || 10;
  const maxLimit = opts.maxLimit || 100;

  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  page = Number.isNaN(page) || page < 1 ? 1 : page;
  limit = Number.isNaN(limit) || limit < 1 ? defaultLimit : Math.min(limit, maxLimit);

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

module.exports = { getPagination, buildPaginationMeta };