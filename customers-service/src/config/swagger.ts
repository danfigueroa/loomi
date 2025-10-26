import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Customers Service API',
    version: '1.0.0',
    description: 'API para gerenciamento de clientes no sistema Loomi',
    contact: {
      name: 'Loomi Team',
      email: 'dev@loomi.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Servidor de desenvolvimento'
    },
    {
      url: 'http://localhost/api/customers',
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
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID único do usuário'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email do usuário'
          },
          name: {
            type: 'string',
            description: 'Nome completo do usuário'
          },
          profilePicture: {
            type: 'string',
            nullable: true,
            description: 'URL da foto de perfil'
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
      UserUpdateRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Nome completo do usuário'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email do usuário'
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
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/routes/userRoutes.ts',
    './src/controllers/userController.ts',
    './src/controllers/healthController.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);