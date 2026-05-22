const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authorization = typeof req.headers.authorization === 'string'
    ? req.headers.authorization.trim()
    : '';
  const [scheme, token, ...extraParts] = authorization.split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || !token || extraParts.length > 0) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is required.',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload?.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    req.user = { id: String(payload.id) };
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};
