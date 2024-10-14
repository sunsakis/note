export async function POST(request) {
    // Implement your logging logic here
    return new Response(JSON.stringify({ status: 'logged' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }