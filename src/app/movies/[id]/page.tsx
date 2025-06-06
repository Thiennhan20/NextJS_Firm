import { Suspense } from 'react'
import { MovieDetailClient } from './index'

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Movie ${params.id}`,
  }
}

export default async function MovieDetail({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MovieDetailClient movieId={params.id} />
    </Suspense>
  )
} 