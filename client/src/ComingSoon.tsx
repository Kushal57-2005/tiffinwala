import { Construction, UtensilsCrossed } from 'lucide-react';

function ComingSoon() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
            <div className="text-center p-8 bg-white shadow-xl rounded-2xl max-w-md w-full">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <Construction className="w-16 h-16 text-amber-500 animate-bounce" />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    TiffinWala
                </h1>

                {/* Subtitle */}
                <p className="text-lg text-gray-600 mb-4 inline-flex items-center justify-center gap-2">
                    We're cooking something amazing for you <UtensilsCrossed className="w-5 h-5 text-spice inline" />
                </p>

                {/* Status */}
                <p className="text-sm text-gray-500 mb-6">
                    Currently under construction. Stay tuned!
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-blue-500 h-3 w-2/3 animate-pulse"></div>
                </div>

                {/* Footer */}
                <p className="text-xs text-gray-400 mt-4">© 2026 TiffinWala</p>
            </div>
        </div>
    );
}

export default ComingSoon;
