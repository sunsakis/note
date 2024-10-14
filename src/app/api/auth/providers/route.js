import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session:", session);

    const providers = authOptions.providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      type: provider.type,
    }));

    console.log("Providers:", providers);

    if (!providers || providers.length === 0) {
      return new Response(JSON.stringify({ error: 'No providers found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(providers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}