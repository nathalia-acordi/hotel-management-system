import Joi from 'joi';

export const strongPassword = Joi.string()
  .min(8)
  .pattern(/[a-z]/, 'minúscula')
  .pattern(/[A-Z]/, 'maiúscula')
  .pattern(/[0-9]/, 'dígito')
  .required()
  .messages({
    'string.min': 'Senha deve conter ao menos 8 caracteres',
    'any.required': 'Senha é obrigatória',
  });

export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(100).required().messages({
    'string.base': 'Username deve ser uma string',
    'string.min': 'Username deve ter ao menos 3 caracteres',
    'any.required': 'Username é obrigatório'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'Email é obrigatório'
  }),
  document: Joi.string()
    .required()
    .custom((value, helpers) => {
      const digits = String(value).replace(/\D/g, '');
      if (digits.length < 5 || digits.length > 20) {
        return helpers.message('Documento deve conter apenas dígitos');
      }
      return value;
    }),
  phone: Joi.string()
    .required()
    .custom((value, helpers) => {
      const digits = String(value).replace(/[^+\d]/g, '');
      const digitCount = digits.replace(/\D/g, '').length;
      if (digitCount < 8 || digitCount > 20) {
        return helpers.message('Telefone inválido (use formato semelhante ao E.164)');
      }
      return value;
    }),
  password: strongPassword,
  role: Joi.string().valid('guest', 'receptionist', 'admin').default('guest')
});
