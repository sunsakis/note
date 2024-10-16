import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET(request) {
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
      return NextResponse.json({ error: 'No providers found' }, { status: 404 });
    }

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}