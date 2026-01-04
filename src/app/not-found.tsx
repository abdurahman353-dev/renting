import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl font-bold text-blue-600">404</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
                <p className="text-slate-500 mb-8">
                    The page you are looking for doesn't exist or has been moved.
                </p>
                <Link href="/">
                    <Button className="w-full h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700">
                        <Home className="w-5 h-5 mr-2" />
                        Return Home
                    </Button>
                </Link>
            </div>
        </div>
    )
}
