export const checkSupabaseConnection = async () => {
  try {
    // Check if environment variables are set
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl) {
      return {
        success: false,
        error: 'Missing Supabase URL environment variable',
        details: 'VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL not found'
      };
    }
    
    if (!supabaseKey) {
      return {
        success: false,
        error: 'Missing Supabase Anon Key environment variable',
        details: 'VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY not found'
      };
    }
    
    // Validate URL format
    try {
      new URL(supabaseUrl);
    } catch (e) {
      return {
        success: false,
        error: 'Invalid Supabase URL format',
        details: 'The Supabase URL is not a valid URL'
      };
    }
    
    return {
      success: true,
      url: supabaseUrl,
      details: 'Environment variables are properly configured'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unexpected error during connection check',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};