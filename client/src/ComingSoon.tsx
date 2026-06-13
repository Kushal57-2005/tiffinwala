function ComingSoon() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
            <div className="text-center p-8 bg-white shadow-xl rounded-2xl max-w-md w-full">
                {/* Icon */}
                <div className="text-6xl mb-4 animate-bounce">🚧</div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    TiffinWala
                </h1>

                {/* Subtitle */}
                <p className="text-lg text-gray-600 mb-4">
                    We're cooking something amazing for you 🍱
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
