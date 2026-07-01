const jwt = require('jsonwebtoken');

function extractToken(req) {
  // Primary: httpOnly cookie
  const cookieToken = req.cookies?.token;
  if (typeof cookieToken === 'string' && cookieToken.trim()) {
    return cookieToken.trim();
  }

  // Fallback: Authorization: Bearer <token> header (for API clients)
  const authorization = typeof req.headers.authorization === 'string'
    ? req.headers.authorization.trim()
    : '';
  const [scheme, headerToken, ...extraParts] = authorization.split(/\s+/);

  if (scheme?.toLowerCase() === 'bearer' && headerToken && extraParts.length === 0) {
    return headerToken;
  }

  return null;
}

module.exports = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
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
