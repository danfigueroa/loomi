-- Script de inicialização dos bancos de dados
-- Este script é executado automaticamente quando o container PostgreSQL é iniciado

-- Criar banco de dados para o serviço de customers
CREATE DATABASE customers_db;

-- Criar banco de dados para o serviço de transactions
CREATE DATABASE transactions_db;

-- Conceder permissões para o usuário postgres
GRANT ALL PRIVILEGES ON DATABASE customers_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE transactions_db TO postgres;

-- Conectar ao banco customers_db e criar extensões necessárias
\c customers_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conectar ao banco transactions_db e criar extensões necessárias
\c transactions_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";