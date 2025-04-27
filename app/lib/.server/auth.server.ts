import { supabase } from '../supabase'; // Import the shared Supabase client
import { json } from '@remix-run/cloudflare';
import { parse } from 'cookie'; // Utility to parse cookies

/**
 * Retrieves the user ID from the request's cookies containing Supabase auth token.
 * Throws a JSON response with 401 status if the user is not authenticated.
 *
 * @param request The incoming Request object.
 * @returns The authenticated user's ID.
 * @throws {Response} A Remix JSON response if authentication fails.
 */
export async function requireUserId(request: Request): Promise<string> {
    const cookies = parse(request.headers.get('Cookie') || '');
    // Adjust cookie name based on how Supabase auth tokens are actually stored
    // Common names include 'sb-access-token' or similar prefixes.
    // Check your browser's dev tools for the exact cookie name.
    const accessToken = cookies['sb-access-token']; // <-- ADJUST THIS COOKIE NAME IF NEEDED

    if (!accessToken) {
        console.log('RequireUserId: No access token cookie found.');
        throw json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error) {
        console.error('RequireUserId: Error getting user from token:', error.message);
        // Handle specific errors like expired token if needed
        throw json({ error: 'Invalid session or token expired.' }, { status: 401 });
    }

    if (!user) {
        console.log('RequireUserId: No user found for the provided token.');
        throw json({ error: 'Authentication required.' }, { status: 401 });
    }

    // console.log('RequireUserId: User authenticated:', user.id);
    return user.id;
}

/**
 * Retrieves the user ID from the request if available, otherwise returns null.
 *
 * @param request The incoming Request object.
 * @returns The authenticated user's ID or null if not authenticated.
 */
export async function getUserId(request: Request): Promise<string | null> {
    try {
        const userId = await requireUserId(request);
        return userId;
    } catch (error) {
        // If requireUserId throws (which it does on auth failure), return null.
        // We expect Response objects to be thrown on auth errors.
        if (error instanceof Response) { 
            return null;
        }
        // Re-throw unexpected errors
        throw error;
    }
} 