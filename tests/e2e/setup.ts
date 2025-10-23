import { execSync } from 'child_process';
import path from 'path';

const E2E_DIR = path.resolve(__dirname);
const ROOT_DIR = path.resolve(__dirname, '../..');

beforeAll(async () => {
  console.log('Setting up E2E test environment...');
  
  try {
    console.log('Starting test services with Docker Compose...');
    execSync(
      `docker-compose -f ${E2E_DIR}/docker-compose.test.yml up -d --build`,
      { 
        stdio: 'inherit',
        cwd: ROOT_DIR
      }
    );
    
    console.log('Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Failed to setup E2E environment:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('Cleaning up E2E test environment...');
  
  try {
    execSync(
      `docker-compose -f ${E2E_DIR}/docker-compose.test.yml down -v`,
      { 
        stdio: 'inherit',
        cwd: ROOT_DIR
      }
    );
  } catch (error) {
    console.error('Failed to cleanup E2E environment:', error);
  }
});