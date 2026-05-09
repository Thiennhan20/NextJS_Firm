'use client'

import { KoreanFrame, USUKFrame, ChinaFrame } from './frames'

export default function CategoryRows() {
  return (
    <section className="py-8 sm:py-12 bg-black">
      <div className="max-w-7xl mx-auto">
        <KoreanFrame />
        <USUKFrame />
        <ChinaFrame />
      </div>
    </section>
  );
}
