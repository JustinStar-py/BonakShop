// prisma.config.ts
// Prisma configuration file - replaces deprecated package.json#prisma block
// Reference: https://pris.ly/prisma-config

import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
    // Path to the Prisma schema file
    schema: path.join(__dirname, 'prisma', 'schema.prisma'),
});
