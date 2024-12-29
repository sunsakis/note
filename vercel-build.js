import { execSync } from 'child_process';

execSync('npx prisma generate', { stdio: 'inherit' });