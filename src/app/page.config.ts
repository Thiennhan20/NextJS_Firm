/**
 * Page-level configuration for home page
 * Optimizes for fast document response and static generation
 */

// Force static generation with ISR (Incremental Static Regeneration)
export const dynamic = 'force-static'

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300

// Use Edge Runtime for faster response times
export const runtime = 'edge'

// Fetch cache configuration
export const fetchCache = 'force-cache'
