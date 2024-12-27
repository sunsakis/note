// scripts/reset-credits.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetCredits() {
  try {
    const result = await prisma.user.updateMany({
      data: {
        credits: 0
      }
    })
    console.log('Credits reset successfully:', result)
  } catch (error) {
    console.error('Error resetting credits:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetCredits()