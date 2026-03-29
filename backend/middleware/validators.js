const { body, param, validationResult } = require('express-validator');

// ─── Validation error handler ─────────────────────────────────────────────────

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// ─── UUID param rule (reusable) ───────────────────────────────────────────────

const uuidParam = param('id')
  .isUUID()
  .withMessage(':id must be a valid UUID');

// ─── Auth validators ──────────────────────────────────────────────────────────

const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email adresi girin'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Şifre en az 8 karakter olmalıdır'),
  handleValidation,
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email adresi girin'),
  body('password')
    .notEmpty()
    .withMessage('Şifre boş olamaz'),
  handleValidation,
];

// ─── Diagram validators ───────────────────────────────────────────────────────

const validateDiagramCreate = [
  body('title')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('title en fazla 200 karakter olabilir'),
  body('nodes')
    .optional()
    .isArray()
    .withMessage('nodes bir dizi olmalıdır'),
  body('edges')
    .optional()
    .isArray()
    .withMessage('edges bir dizi olmalıdır'),
  handleValidation,
];

const validateDiagramUpdate = [
  uuidParam,
  body('title')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('title en fazla 200 karakter olabilir'),
  body('nodes')
    .optional()
    .isArray()
    .withMessage('nodes bir dizi olmalıdır'),
  body('edges')
    .optional()
    .isArray()
    .withMessage('edges bir dizi olmalıdır'),
  handleValidation,
];

const validateDiagramId = [
  uuidParam,
  handleValidation,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateDiagramCreate,
  validateDiagramUpdate,
  validateDiagramId,
};
