const { validationResult } = require('express-validator');

function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map((err) => ({
          field: err.path ?? err.param ?? 'unknown',
          message: err.msg,
          value: err.value,
        })),
      });
    }

    return next();
  };
}

module.exports = { validate };
