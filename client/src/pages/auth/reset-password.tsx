/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../utils/api';
import tiffinBg from '../../assets/slate_spices_bg.png';

// Custom Input Component with Floating Label
const FloatingInput = ({
    label,
    type,
    value,
    onChange,
    disabled,
    isPassword = false,
    showPassword = false,
    setShowPassword,
}: {
    label: string;
    type: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    isPassword?: boolean;
    showPassword?: boolean;
    setShowPassword?: (show: boolean) => void;
}) => {
    const [focused, setFocused] = useState(false);
    const isFilled = value && value.toString().length > 0;

    return (
        <div className="relative w-full group">
            <input
                type={isPassword && showPassword ? 'text' : type}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={disabled}
                className="w-full bg-[#FBF4EC]/80 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:ring-cinnamon/30 focus:border-cinnamon transition-all duration-300 backdrop-blur-sm placeholder-transparent font-body shadow-inner select-text"
                placeholder={label}
            />
            <label
                className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                    focused || isFilled
                        ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-cinnamon'
                        : 'top-4 text-sm text-charcoal/60'
                }`}
            >
                {label}
            </label>
            {isPassword && setShowPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-charcoal/50 hover:text-cinnamon transition-colors z-20"
                >
                    {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
};

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();

    // Extract state passed from forget-password screen
    const { email, resetToken } = (location.state as { email?: string; resetToken?: string }) || {};

    // States
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // UI Visual States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [btnHovered, setBtnHovered] = useState(false);

    // Track cursor movement for parallax floating elements
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const x = (clientX - window.innerWidth / 2) / 30;
        const y = (clientY - window.innerHeight / 2) / 30;
        setMousePos({ x, y });
    };

    const handleResetPassword = async () => {
        if (!email || !resetToken) {
            setError('Missing password reset session context. Please go back.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await api.post('/auth/reset-password', {
                email,
                resetToken,
                password,
            });
            setSuccess(res.data.message || 'Password reset successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || 'Password reset failed';
            const errors = err.response?.data?.errors;
            if (Array.isArray(errors) && errors.length > 0) {
                setError(`${errMsg}: ${errors.join(', ')}`);
            } else {
                setError(errMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const isValidSession = email && resetToken;

    return (
        <div
            onMouseMove={handleMouseMove}
            className="min-h-screen flex items-center justify-center font-body bg-cream p-4 relative overflow-hidden transition-all duration-700"
        >
            {/* Background Ambient Glows */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] bg-cinnamon/25" />
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-[140px] bg-turmeric/20" />
            </div>

            {/* Custom Embedded Keyframes */}
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(5deg); }
                }
                @keyframes float-medium {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-22px) rotate(-8deg); }
                }
                .floating-leaf { animation: float-slow 7s ease-in-out infinite; }
                .floating-anise { animation: float-medium 9s ease-in-out infinite; }
                .floating-cardamom { animation: float-slow 6s ease-in-out infinite; }
                .metal-shimmer {
                    background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%);
                }
            `}</style>

            {/* Content Container Card */}
            <div className="w-full max-w-5xl bg-white/40 border border-white/30 backdrop-blur-xl shadow-[0_24px_70px_-15px_rgba(43,33,24,0.15)] rounded-[32px] overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[600px]">
                
                {/* LEFT SIDE: Typography & Ambient Parallax Spice Canvas */}
                <div className="w-full md:w-1/2 bg-gradient-to-br from-[#1F1710] to-[#2E2218] p-8 md:p-12 text-cream flex flex-col justify-between relative overflow-hidden min-h-[500px] select-none">
                    <img
                        src={tiffinBg}
                        alt="Gourmet Tiffin Background"
                        className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity pointer-events-none"
                    />

                    {/* Floating Parallax Spice 1: Mint Leaf */}
                    <div
                        style={{
                            transform: `translate3d(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px, 0)`,
                            transition: 'transform 0.15s ease-out',
                        }}
                        className="absolute top-[20%] left-8 floating-leaf opacity-85 pointer-events-none z-10"
                    >
                        <svg width="45" height="45" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M2 22C2 22 7 21 12 16C17 11 20 6 22 2C22 2 17 2 12 6C7 10 3 15 2 22Z"
                                fill="#5C7A52"
                                opacity="0.9"
                            />
                            <path
                                d="M2 22C6 18 12 14 22 2"
                                stroke="#FBF4EC"
                                strokeWidth="0.8"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>

                    {/* Floating Parallax Spice 2: Star Anise */}
                    <div
                        style={{
                            transform: `translate3d(${mousePos.x * -0.6}px, ${mousePos.y * -0.6}px, 0)`,
                            transition: 'transform 0.15s ease-out',
                        }}
                        className="absolute bottom-[25%] right-12 floating-anise opacity-75 pointer-events-none z-10"
                    >
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L14 9H10L12 2Z" fill="#8C5B3E" />
                            <path d="M12 22L10 15H14L12 22Z" fill="#8C5B3E" />
                            <path d="M2 12L9 10V14L2 12Z" fill="#8C5B3E" />
                            <path d="M22 12L15 14V10L22 12Z" fill="#8C5B3E" />
                            <circle cx="12" cy="12" r="3" fill="#D2996A" />
                        </svg>
                    </div>

                    {/* Centered Typography Content */}
                    <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center py-6">
                        <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-[#FBF4EC]">
                            Tiffin<span style={{ color: '#9e6f46' }}>Wala</span>
                        </h1>
                        <div className="w-12 h-1 rounded-full mb-6 bg-cinnamon" />
                        <p className="text-sm max-w-sm leading-relaxed font-body" style={{ color: '#C7CCD1' }}>
                            Secure your account with a new access passcode. Set a robust password to re-enter the culinary pipeline.
                        </p>
                    </div>

                    <div className="relative z-10 w-full">
                        <div
                            className="bg-white/5 border rounded-2xl p-6 backdrop-blur-md max-w-sm mx-auto shadow-sm text-center border-white/10 text-xs"
                            style={{ color: '#C7CCD1' }}
                        >
                            Ensure your new password uses mixed character cases, numbers, and symbols for maximum security.
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Translucent Credentials Card */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
                    {/* Header */}
                    <div className="mb-8 relative">

                        <h2 className="font-display text-3xl font-bold text-charcoal tracking-tight">
                            Reset Password
                        </h2>
                        <p className="text-charcoal/60 text-xs mt-1.5 font-body">
                            {isValidSession
                                ? `Setting new credentials for ${email}`
                                : 'Missing token context. Please return to the forget password page.'}
                        </p>
                    </div>

                    {/* Feedback Messages */}
                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-cinnamon/15 border border-cinnamon/20 text-cinnamon text-xs flex items-start space-x-2 font-body animate-pulse">
                            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 rounded-2xl bg-leaf/15 border border-leaf/20 text-leaf text-xs flex items-start space-x-2 font-body">
                            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{success}</span>
                        </div>
                    )}

                    {isValidSession ? (
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                            <FloatingInput
                                label="New Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                isPassword={true}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                            />

                            <FloatingInput
                                label="Confirm New Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                isPassword={true}
                                showPassword={showConfirmPassword}
                                setShowPassword={setShowConfirmPassword}
                            />

                            <button
                                onClick={handleResetPassword}
                                disabled={loading || !password || !confirmPassword}
                                onMouseEnter={() => setBtnHovered(true)}
                                onMouseLeave={() => setBtnHovered(false)}
                                className="w-full relative py-4 rounded-2xl font-display font-bold text-sm text-cream transition-all duration-300 transform active:scale-95 shadow-md flex items-center justify-center space-x-2 border border-black/10 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: btnHovered ? '#825b39' : '#9e6f46'
                                }}
                            >
                                <div className="absolute inset-0 metal-shimmer opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-cream" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Resetting Password...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <span>Complete Reset & Save</span>
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-6">
                            <button
                                onClick={() => navigate('/forget-password')}
                                className="px-6 py-3 rounded-2xl font-bold bg-cinnamon text-cream font-display text-sm shadow-md active:scale-95 transition-all"
                            >
                                Go to Forget Password
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
