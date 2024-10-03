import { NextResponse } from 'next/server';
import axios from 'axios';
import xml2js from 'xml2js';

export async function GET() {
  try {
    const response = await axios.get('https://timdenning.substack.com/feed');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    const items = result.rss.channel[0].item;
    
    return NextResponse.json(items);
  } catch (error) {
    console.error('Detailed error in API route:', error);
    return NextResponse.json({ error: 'Error fetching RSS feed', details: error.message }, { status: 500 });
  }
}