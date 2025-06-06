import { Suspense } from 'react'
import { MovieDetailClient } from './index'

export async function generateMetadata() {
  return {
    title: 'Movie Detail',
  }
}

export default async function MovieDetail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MovieDetailClient />
    </Suspense>
  )
}