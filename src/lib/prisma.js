import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query'],
  })
}

const globalForPrisma = global

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export { prisma }

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma