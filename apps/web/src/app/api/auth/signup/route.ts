import { NextResponse } from 'next/server';
import { prisma } from '@tokiflow/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
          id: crypto.randomUUID(),
        email,
        name: name || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Create a credentials account for password-based auth
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: user.email,
        access_token: hashedPassword, // Store hashed password in access_token
        updatedAt: new Date(),
      },
    });

    // Create a default organization for the user
    const org = await prisma.org.create({
      data: {
          id: crypto.randomUUID(),
        name: `${name || email.split('@')[0]}'s Organization`,
        slug: `${email.split('@')[0]}-${Date.now()}`,
        updatedAt: new Date(),
        Membership: {
          create: {
            id: crypto.randomUUID(),
            userId: user.id,
            role: 'OWNER',
            updatedAt: new Date(),
          },
        },
        SubscriptionPlan: {
          create: {
            id: crypto.randomUUID(),
            plan: 'FREE',
            monitorLimit: 5,
            userLimit: 1,
            updatedAt: new Date(),
          },
        },
      },
    });

    return NextResponse.json(
      { 
        message: 'User created successfully',
        User: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { error: 'An error occurred during sign up' },
      { status: 500 }
    );
  }
}

