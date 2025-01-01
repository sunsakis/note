import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const config = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    EmailProvider({
      server: {
        host: "smtp.postmarkapp.com",
        port: 587,
        auth: {
          user: process.env.POSTMARK_API_TOKEN,
          pass: process.env.POSTMARK_API_TOKEN,
        },
      },
      from: process.env.EMAIL_FROM, // Your Proton Mail address
      // Customize the magic link email
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const { host } = new URL(url)
        
        const response = await fetch("https://api.postmarkapp.com/email", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': process.env.POSTMARK_API_TOKEN,
          },
          body: JSON.stringify({
            From: provider.from,
            To: identifier,
            Subject: `Sign in to ${host}`,
            TextBody: `Sign in to ${host}\n\n${url}\n\n`,
            HtmlBody: `
              <html>
                <body style="font-family: sans-serif; padding: 20px;">
                  <h2>Sign in to Note</h2>
                  <p>Click the link below to sign in:</p>
                  <p>
                    <a 
                      href="${url}"
                      style="display: inline-block; padding: 12px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;"
                    >
                      Sign in
                    </a>
                  </p>
                  <p style="color: #666; font-size: 14px;">
                    If you didn't request this email, you can safely ignore it.
                  </p>
                </body>
              </html>
            `,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send verification email');
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.credits = user.credits;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(config)

export { config as authOptions }
export { handler as GET, handler as POST }