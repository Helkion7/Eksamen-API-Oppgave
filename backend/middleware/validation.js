const Joi = require("joi");

// Define validation schemas
const schemas = {
  userRegistration: Joi.object({
    username: Joi.string().required().trim(),
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("user", "admin").optional(), // Add this line
  }),

  userLogin: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),

  userUpdate: Joi.object({
    email: Joi.string().email().lowercase(),
    password: Joi.string().min(6),
    role: Joi.string().valid("user", "admin"),
  }).min(1), // At least one field is required
};

// Validation middleware creator
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      return res.status(400).json({ error: errorMessage });
    }

    next();
  };
};

// Export validation middlewares
module.exports = {
  validateUserRegistration: validate(schemas.userRegistration),
  validateUserLogin: validate(schemas.userLogin),
  validateUserUpdate: validate(schemas.userUpdate),
};
