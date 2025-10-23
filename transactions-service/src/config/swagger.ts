import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Transactions Service API',
    version: '1.0.0',
    description: 'API para gerenciamento de transações no sistema Loomi',
    contact: {
      name: 'Loomi Team',
      email: 'dev@loomi.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3002',
      description: 'Servidor de desenvolvimento'
    },
    {
      url: 'http://localhost/api/transactions',
      description: 'Servidor via proxy Nginx'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Transaction: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID único da transação'
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'ID do usuário proprietário'
          },
          amount: {
            type: 'number',
            format: 'decimal',
            minimum: 0.01,
            description: 'Valor da transação'
          },
          description: {
            type: 'string',
            description: 'Descrição da transação'
          },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            description: 'Status da transação'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Data de criação'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Data da última atualização'
          }
        }
      },
      TransactionCreateRequest: {
        type: 'object',
        required: ['amount', 'description'],
        properties: {
          amount: {
            type: 'number',
            format: 'decimal',
            minimum: 0.01,
            maximum: 999999.99,
            description: 'Valor da transação'
          },
          description: {
            type: 'string',
            minLength: 1,
            maxLength: 500,
            description: 'Descrição da transação'
          }
        }
      },
      TransactionListResponse: {
        type: 'object',
        properties: {
          transactions: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Transaction'
            }
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                description: 'Página atual'
              },
              limit: {
                type: 'number',
                description: 'Itens por página'
              },
              total: {
                type: 'number',
                description: 'Total de itens'
              },
              totalPages: {
                type: 'number',
                description: 'Total de páginas'
              }
            }
          }
        }
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'unhealthy'],
            description: 'Status geral do serviço'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp da verificação'
          },
          uptime: {
            type: 'number',
            description: 'Tempo de atividade em segundos'
          },
          version: {
            type: 'string',
            description: 'Versão do serviço'
          },
          dependencies: {
            type: 'object',
            properties: {
              database: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['healthy', 'unhealthy']
                  },
                  responseTime: {
                    type: 'number',
                    description: 'Tempo de resposta em ms'
                  }
                }
              },
              redis: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['healthy', 'unhealthy']
                  },
                  responseTime: {
                    type: 'number',
                    description: 'Tempo de resposta em ms'
                  }
                }
              },
              customersService: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['healthy', 'unhealthy']
                  },
                  responseTime: {
                    type: 'number',
                    description: 'Tempo de resposta em ms'
                  }
                }
              }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Mensagem de erro'
          },
          code: {
            type: 'string',
            description: 'Código do erro'
          },
          correlationId: {
            type: 'string',
            description: 'ID de correlação para rastreamento'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp do erro'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJSDoc(options);