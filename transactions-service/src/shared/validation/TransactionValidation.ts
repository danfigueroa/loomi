import Joi from 'joi';

export const createTransactionSchema = Joi.object({
  fromUserId: Joi.string().uuid().required().messages({
    'string.guid': 'From user ID must be a valid UUID',
    'any.required': 'From user ID is required',
  }),
  toUserId: Joi.string().uuid().required().messages({
    'string.guid': 'To user ID must be a valid UUID',
    'any.required': 'To user ID is required',
  }),
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required',
  }),
  description: Joi.string().max(255).optional(),
  type: Joi.string().valid('TRANSFER', 'DEPOSIT', 'WITHDRAWAL').optional(),
});

export const getTransactionsByUserSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.guid': 'User ID must be a valid UUID',
    'any.required': 'User ID is required',
  }),
});

export const getTransactionByIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Transaction ID must be a valid UUID',
    'any.required': 'Transaction ID is required',
  }),
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
});