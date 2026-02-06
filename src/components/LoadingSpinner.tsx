interface LoadingSpinnerProps {
    message?: string;
    title?: string;
}

export default function LoadingSpinner({
    message = "Loading...",
    title = "Loading",
}: LoadingSpinnerProps) {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm transition-all duration-500">
            <div className="relative">
                {/* Outer ring */}
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>

                {/* Inner pulsed dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-1">
                <span className="text-sm font-bold text-slate-800 uppercase tracking-widest animate-pulse">
                    {title}
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em] opacity-60">
                    {message}
                </span>
            </div>
        </div>
    );
}
