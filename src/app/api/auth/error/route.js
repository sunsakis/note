export async function GET(request) {
    // Implement your error handling logic here
    return new Response(JSON.stringify({ error: 'Authentication error' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }