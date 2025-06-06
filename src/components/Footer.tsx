export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 py-8 mt-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <div className="text-lg font-bold text-red-500 mb-2">MovieWorld</div>
          <div className="text-sm">© {new Date().getFullYear()} MovieWorld. All rights reserved.</div>
        </div>
        <div className="flex gap-4 items-center">
          <a href="#" className="hover:text-red-500 transition-colors">Facebook</a>
          <a href="#" className="hover:text-red-500 transition-colors">Instagram</a>
          <a href="#" className="hover:text-red-500 transition-colors">YouTube</a>
        </div>
      </div>
    </footer>
  )
} 