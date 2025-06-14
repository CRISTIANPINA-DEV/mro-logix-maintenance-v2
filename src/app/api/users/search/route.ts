import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';

// Helper function to normalize text for comparison
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Helper function to calculate word similarity
function calculateWordSimilarity(word1: string, word2: string): number {
  const normalized1 = normalizeText(word1);
  const normalized2 = normalizeText(word2);
  
  // Exact match
  if (normalized1 === normalized2) return 1;
  
  // One contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.8;
  }
  
  // Check for common prefixes (at least 3 characters)
  const minLength = Math.min(normalized1.length, normalized2.length);
  if (minLength >= 3) {
    let commonPrefixLength = 0;
    for (let i = 0; i < minLength; i++) {
      if (normalized1[i] === normalized2[i]) {
        commonPrefixLength++;
      } else {
        break;
      }
    }
    if (commonPrefixLength >= 3) {
      return 0.6;
    }
  }
  
  return 0;
}

export async function GET(request: Request) {
  try {
    // Authenticate user to get company info
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    // Clean and normalize the search query
    const searchQuery = normalizeText(query);
    
    // Split the query into words and filter out very short words
    const searchWords = searchQuery.split(/\s+/).filter(word => word.length >= 2);

    // If no valid search words after filtering, return empty results
    if (searchWords.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Build the search conditions
    const searchConditions: Prisma.UserWhereInput[] = [];

    // Add conditions for each search word
    searchWords.forEach(word => {
      searchConditions.push(
        // First name matches
        { firstName: { contains: word, mode: 'insensitive' } },
        // Last name matches
        { lastName: { contains: word, mode: 'insensitive' } },
        // Username matches
        { username: { contains: word, mode: 'insensitive' } },
        // Email matches
        { email: { contains: word, mode: 'insensitive' } }
      );
    });

    // Add full name combination search
    if (searchWords.length > 1) {
      searchConditions.push({
        AND: [
          { firstName: { contains: searchWords[0], mode: 'insensitive' } },
          { lastName: { contains: searchWords.slice(1).join(' '), mode: 'insensitive' } }
        ]
      });
    }

    // Search users within the same company
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { companyId: session.user.companyId },
          { verified: true },
          { OR: searchConditions }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true
      },
      take: 20, // Increased limit for better filtering
    });

    // Format and score the results
    const formattedUsers = users.map((user: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
      email: string;
    }) => {
      const fullName = normalizeText(`${user.firstName} ${user.lastName}`);
      const username = normalizeText(user.username);
      const email = normalizeText(user.email);

      // Calculate detailed relevance scores
      let score = 0;
      const matchDetails = {
        exactFullName: false,
        exactUsername: false,
        exactEmail: false,
        partialFullName: false,
        partialUsername: false,
        partialEmail: false,
        wordMatches: 0
      };

      // Check exact matches
      if (fullName === searchQuery) {
        score += 100;
        matchDetails.exactFullName = true;
      }
      if (username === searchQuery) {
        score += 80;
        matchDetails.exactUsername = true;
      }
      if (email === searchQuery) {
        score += 60;
        matchDetails.exactEmail = true;
      }

      // Check partial matches
      if (fullName.includes(searchQuery)) {
        score += 40;
        matchDetails.partialFullName = true;
      }
      if (username.includes(searchQuery)) {
        score += 30;
        matchDetails.partialUsername = true;
      }
      if (email.includes(searchQuery)) {
        score += 20;
        matchDetails.partialEmail = true;
      }

      // Check word matches with similarity scoring
      searchWords.forEach(word => {
        const fullNameWords = fullName.split(/\s+/);
        const usernameWords = username.split(/[._-]/);
        const emailWords = email.split(/[@._-]/);

        // Check each word against all fields
        [fullNameWords, usernameWords, emailWords].forEach(words => {
          words.forEach(fieldWord => {
            const similarity = calculateWordSimilarity(word, fieldWord);
            if (similarity > 0) {
              score += similarity * 15; // Weight word matches
              matchDetails.wordMatches++;
            }
          });
        });
      });

      // Boost score for verified users
      score += 10;

      return {
        id: user.id,
        fullName: `${user.firstName} ${user.lastName}`,
        username: user.username,
        email: user.email,
        score,
        matchDetails
      };
    });

    // Sort by score and filter out low-scoring results
    formattedUsers.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
    
    // Filter out results with very low scores (less than 15)
    const filteredUsers = formattedUsers.filter((user: { score: number }) => user.score >= 15);

    // Take top 10 results after filtering
    const finalUsers = filteredUsers
      .slice(0, 10)
      .map(({ ...user }) => user);

    return NextResponse.json({ 
      users: finalUsers,
      totalFound: filteredUsers.length
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
} 