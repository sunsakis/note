import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { articleId } = await request.json()

    // Use transaction for all operations
    const result = await prisma.$transaction(async (tx) => {
      // Get current user credits
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { credits: true }
      })

      if (!user || user.credits < 1) {
        throw new Error('Insufficient credits')
      }

      try {
        // Try to create the read record first
        await tx.articleRead.create({
          data: {
            userId: session.user.id,
            articleId: parseInt(articleId)
          }
        })

        // If successful, deduct credit
        const updatedUser = await tx.user.update({
          where: { id: session.user.id },
          data: {
            credits: { decrement: 1 }
          }
        })

        return { credits: updatedUser.credits, alreadyRead: false }
      } catch (e) {
        // If unique constraint error, article was already read
        if (e.code === 'P2002') {
          return { credits: user.credits, alreadyRead: true }
        }
        throw e // Re-throw other errors
      }
    })

    return NextResponse.json({ 
      success: true,
      credits: result.credits,
      alreadyRead: result.alreadyRead
    })

  } catch (error) {
    console.error('Error deducting credits:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to deduct credits',
      code: error.code
    }, { 
      status: error.message === 'Insufficient credits' ? 402 : 500 
    })
  }
}