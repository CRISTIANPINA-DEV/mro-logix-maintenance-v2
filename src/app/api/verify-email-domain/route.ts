import { NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const domain = email.split('@')[1];
    if (!domain) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    try {
      // Check if the domain has MX records
      const mxRecords = await resolveMx(domain);
      const hasValidMx = mxRecords && mxRecords.length > 0;

      if (!hasValidMx) {
        return NextResponse.json(
          { 
            isValid: false,
            error: 'Invalid email domain - no mail server found'
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { 
          isValid: true,
          domain,
          mxRecords: mxRecords.map(record => record.exchange)
        },
        { status: 200 }
      );

    } catch {
      // If DNS lookup fails, the domain likely doesn't exist
      return NextResponse.json(
        { 
          isValid: false,
          error: 'Invalid email domain - domain not found'
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Email domain verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 