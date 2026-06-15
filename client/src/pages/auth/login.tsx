/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/static-components */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
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
    role = 'customer',
}: {
    label: string;
    type: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    isPassword?: boolean;
    showPassword?: boolean;
    setShowPassword?: (show: boolean) => void;
    role?: 'customer' | 'vendor';
}) => {
    const [focused, setFocused] = useState(false);
    const isFilled = value && value.length > 0;

    const isCustomer = role === 'customer';
    const focusRingClass = isCustomer
        ? 'focus:border-[#5C7A52] focus:ring-[#5C7A52]/30'
        : 'focus:border-[#E0653A] focus:ring-[#E0653A]/30';

    const labelColorClass = isCustomer
        ? focused || isFilled
            ? 'text-[#5C7A52]'
            : 'text-charcoal/60'
        : focused || isFilled
          ? 'text-[#E0653A]'
          : 'text-charcoal/60';

    return (
        <div className="relative w-full group">
            <input
                type={isPassword && showPassword ? 'text' : type}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={disabled}
                className={`w-full bg-[#FBF4EC]/80 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 ${focusRingClass} transition-all duration-300 backdrop-blur-sm placeholder-transparent font-body shadow-inner select-text`}
                placeholder={label}
            />
            <label
                className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                    focused || isFilled
                        ? `top-2 text-[10px] font-bold uppercase tracking-wider ${labelColorClass}`
                        : 'top-4 text-sm text-charcoal/60'
                }`}
            >
                {label}
            </label>
            {isPassword && setShowPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors z-20 ${
                        role === 'customer'
                            ? 'text-leaf hover:text-leaf/80'
                            : 'text-spice hover:text-spice/80'
                    }`}
                >
                    {showPassword ? (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
};

export default function Login() {
    const navigate = useNavigate();
    const setUser = useAuthStore((state) => state.setUser);

    // Form and auth states
    const [role, setRole] = useState<'customer' | 'vendor'>('customer');
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [otpToast, setOtpToast] = useState<{
        emailOTP?: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const [resendTimer, setResendTimer] = useState(0);

    // Countdown timer for resending OTP
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    useEffect(() => {
        if (!otpToast) return;
        const timer = setTimeout(() => setOtpToast(null), 60000);
        return () => clearTimeout(timer);
    }, [otpToast]);

    const showOtpToast = (data: any) => {
        if (data?.emailOTP) {
            setOtpToast({ emailOTP: data.emailOTP });
        }
    };

    const [step, setStep] = useState(1);
    const [userId, setUserId] = useState('');
    const [otp, setOtp] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

    // UI Visual States
    const [showPassword, setShowPassword] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isLatching, setIsLatching] = useState(false);
    const [btnHovered, setBtnHovered] = useState(false);
    const [btnOtpHovered, setBtnOtpHovered] = useState(false);

    // Track cursor movement for parallax floating elements
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const x = (clientX - window.innerWidth / 2) / 30; // normalized offsets
        const y = (clientY - window.innerHeight / 2) / 30;
        setMousePos({ x, y });
    };

    // Update OTP string whenever digits change
    useEffect(() => {
        setOtp(otpDigits.join(''));
    }, [otpDigits]);

    // Handle OTP character input
    const handleOtpChange = (index: number, val: string) => {
        if (/^[0-9]?$/.test(val)) {
            const newDigits = [...otpDigits];
            newDigits[index] = val;
            setOtpDigits(newDigits);

            // Auto focus next input
            if (val !== '' && index < 5) {
                const nextInput = document.getElementById(`otp-${index + 1}`);
                nextInput?.focus();
            }
        }
    };

    // Handle OTP backspacing
    const handleOtpKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === 'Backspace') {
            if (otpDigits[index] === '' && index > 0) {
                const newDigits = [...otpDigits];
                newDigits[index - 1] = '';
                setOtpDigits(newDigits);
                const prevInput = document.getElementById(`otp-${index - 1}`);
                prevInput?.focus();
            } else {
                const newDigits = [...otpDigits];
                newDigits[index] = '';
                setOtpDigits(newDigits);
            }
        }
    };

    const handleCustomerLogin = async () => {
        setLoading(true);
        setError('');
        setIsLatching(true);
        // Add a slight delay to allow latch snapping animation to play out
        setTimeout(async () => {
            try {
                const res = await api.post('/auth/login/customer', {
                    emailOrPhone,
                    password,
                });
                setUser(res.data.data);
                navigate('/customer/home');
            } catch (err: any) {
                const errMsg =
                    err.response?.data?.message ||
                    err.message ||
                    'Login failed';
                const errors = err.response?.data?.errors;
                if (Array.isArray(errors) && errors.length > 0) {
                    setError(`${errMsg}: ${errors.join(', ')}`);
                } else {
                    setError(errMsg);
                }
            } finally {
                setLoading(false);
                setIsLatching(false);
            }
        }, 400);
    };

    const handleVendorLoginStep1 = async () => {
        setLoading(true);
        setError('');
        setIsLatching(true);
        setTimeout(async () => {
            try {
                const res = await api.post('/auth/login/vendor', {
                    emailOrPhone,
                    password,
                });
                setUserId(res.data.data.userId);
                showOtpToast(res.data.data);
                setStep(2);
            } catch (err: any) {
                if (
                    err.response?.status === 403 &&
                    err.response?.data?.message ===
                        'Registration fee not paid yet'
                ) {
                    const retrievedUserId = err.response?.data?.errors?.[0];
                    if (retrievedUserId) {
                        setUserId(retrievedUserId);
                        setStep(3); // Go to Payment Step!
                        return;
                    }
                }
                const errMsg =
                    err.response?.data?.message ||
                    err.message ||
                    'Login failed';
                const errors = err.response?.data?.errors;
                if (Array.isArray(errors) && errors.length > 0) {
                    setError(`${errMsg}: ${errors.join(', ')}`);
                } else {
                    setError(errMsg);
                }
            } finally {
                setLoading(false);
                setIsLatching(false);
            }
        }, 400);
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setLoading(true);
        setError('');
        try {
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                setError(
                    'Failed to load Razorpay SDK. Check your internet connection.',
                );
                setLoading(false);
                return;
            }

            const res = await api.post('/payments/create-order', { userId });
            const orderData = res.data.data;

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'TiffinWala',
                description: 'Vendor Onboarding Fee',
                order_id: orderData.orderId,
                handler: async (response: any) => {
                    setLoading(true);
                    try {
                        const verifyRes = await api.post('/payments/verify', {
                            userId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        setError('');
                        alert(
                            verifyRes.data.message ||
                                'Payment verified! Account activated.',
                        );
                        setStep(1);
                    } catch (err: any) {
                        const errMsg =
                            err.response?.data?.message ||
                            err.message ||
                            'Payment verification failed';
                        const errors = err.response?.data?.errors;
                        if (Array.isArray(errors) && errors.length > 0) {
                            setError(`${errMsg}: ${errors.join(', ')}`);
                        } else {
                            setError(errMsg);
                        }
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: 'Vendor',
                    email: emailOrPhone.includes('@') ? emailOrPhone : '',
                    contact: !emailOrPhone.includes('@') ? emailOrPhone : '',
                },
                theme: {
                    color: '#E0653A',
                },
                modal: {
                    ondismiss: () => {
                        setError('Payment cancelled by user.');
                        setLoading(false);
                    },
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err: any) {
            const errMsg =
                err.response?.data?.message ||
                err.message ||
                'Failed to initiate payment';
            const errors = err.response?.data?.errors;
            if (Array.isArray(errors) && errors.length > 0) {
                setError(`${errMsg}: ${errors.join(', ')}`);
            } else {
                setError(errMsg);
            }
            setLoading(false);
        }
    };

    const handleVendorLoginStep2 = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login/vendor/verify-otp', {
                userId,
                otp,
            });
            setUser(res.data.data);
            navigate('/vendor/home');
        } catch (err: any) {
            const errMsg =
                err.response?.data?.message ||
                err.message ||
                'OTP verification failed';
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

    const handleResendEmailOTP = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await api.post('/auth/resend-email-otp', { userId });
            showOtpToast(res.data.data);
            setSuccess(res.data.message || 'OTP resent to email successfully');
            setOtpDigits(['', '', '', '', '', '']);
            setResendTimer(30);
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || 'Failed to resend OTP';
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div
            onMouseMove={handleMouseMove}
            className="min-h-screen flex items-center justify-center font-body bg-cream p-4 relative overflow-hidden transition-all duration-700"
        >
            {otpToast && (
                <div className="fixed top-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-spice/25 bg-[#FBF4EC]/95 p-4 text-charcoal shadow-2xl backdrop-blur-md font-body">
                    <div className="text-[10px] font-bold uppercase text-spice tracking-wider mb-2">
                        OTP for testing
                    </div>
                    <div className="text-sm font-semibold">Email OTP: {otpToast.emailOTP}</div>
                    <div className="mt-2 text-[11px] text-charcoal/55">
                        This message stays for 1 minute.
                    </div>
                </div>
            )}
            {/* Background Ambient Glows - Shifts based on role */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div
                    className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] transition-all duration-1000 ease-in-out"
                    style={{
                        backgroundColor:
                            role === 'customer'
                                ? 'rgba(92, 122, 82, 0.45)'
                                : 'rgba(224, 101, 58, 0.35)',
                    }}
                />
                <div
                    className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-1000 ease-in-out"
                    style={{
                        backgroundColor: 'rgba(242, 179, 64, 0.35)',
                    }}
                />
            </div>

            {/* Custom Embedded Keyframes and animations */}
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(5deg); }
                }
                @keyframes float-medium {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-22px) rotate(-8deg); }
                }
                @keyframes steam-rise {
                    0% { transform: translateY(10px) scaleX(0.8); opacity: 0; }
                    15% { opacity: 0.7; }
                    50% { transform: translateY(-20px) scaleX(1.2); opacity: 0.4; }
                    100% { transform: translateY(-45px) scaleX(1.5); opacity: 0; }
                }
                .floating-leaf { animation: float-slow 7s ease-in-out infinite; }
                .floating-anise { animation: float-medium 9s ease-in-out infinite; }
                .floating-cardamom { animation: float-slow 6s ease-in-out infinite; }
                .steam-wave { animation: steam-rise 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                .steam-delay-1 { animation-delay: 0.8s; }
                .steam-delay-2 { animation-delay: 1.6s; }
                
                /* Metallic custom gradients for SVG tiffin */
                .metal-shimmer {
                    background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%);
                }
            `}</style>

            {/* Content Container Card */}
            <div className="w-full max-w-5xl bg-white/40 border border-white/30 backdrop-blur-xl shadow-[0_24px_70px_-15px_rgba(43,33,24,0.15)] rounded-[32px] overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[600px]">
                {/* LEFT SIDE: Typography & Ambient Parallax Spice Canvas */}
                <div className="w-full md:w-1/2 bg-gradient-to-br from-[#1F1710] to-[#2E2218] p-8 md:p-12 text-cream flex flex-col justify-between relative overflow-hidden min-h-[500px] select-none">
                    {/* Dark textured image background with mix-blend */}
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
                        <svg
                            width="45"
                            height="45"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
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
                            <path
                                d="M10 15C10 15 13 14 15 11"
                                stroke="#FBF4EC"
                                strokeWidth="0.5"
                            />
                            <path
                                d="M6 18C6 18 8 17 10 15"
                                stroke="#FBF4EC"
                                strokeWidth="0.5"
                            />
                            <path
                                d="M14 12C14 12 17 11 18 9"
                                stroke="#FBF4EC"
                                strokeWidth="0.5"
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
                        <svg
                            width="60"
                            height="60"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path d="M12 2L14 9H10L12 2Z" fill="#8C5B3E" />
                            <path d="M12 22L10 15H14L12 22Z" fill="#8C5B3E" />
                            <path d="M2 12L9 10V14L2 12Z" fill="#8C5B3E" />
                            <path d="M22 12L15 14V10L22 12Z" fill="#8C5B3E" />
                            <path d="M5 5L10 10L9 11L4 6L5 5Z" fill="#A46E4D" />
                            <path
                                d="M19 19L14 14L15 13L20 18L19 19Z"
                                fill="#A46E4D"
                            />
                            <path
                                d="M5 19L10 14L9 13L4 18L5 19Z"
                                fill="#A46E4D"
                            />
                            <path
                                d="M19 5L14 10L15 11L20 6L19 5Z"
                                fill="#A46E4D"
                            />
                            <circle cx="12" cy="12" r="3" fill="#D2996A" />
                        </svg>
                    </div>

                    {/* Floating Parallax Spice 3: Cardamom Pod */}
                    <div
                        style={{
                            transform: `translate3d(${mousePos.x * 0.9}px, ${mousePos.y * -0.4}px, 0)`,
                            transition: 'transform 0.15s ease-out',
                        }}
                        className="absolute top-[28%] right-10 floating-cardamom opacity-80 pointer-events-none z-10"
                    >
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M12 2C7 5 5 11 7 16C9 21 15 22 17 17C19 12 17 5 12 2Z"
                                fill="#758F69"
                            />
                            <path
                                d="M12 2C10 6 10 12 12 22"
                                stroke="#52664A"
                                strokeWidth="0.8"
                                strokeDasharray="1 1"
                            />
                            <path
                                d="M7 16C9 14 13 14 17 17"
                                stroke="#52664A"
                                strokeWidth="0.5"
                            />
                            <path
                                d="M8 11C10 10 13 11 15 13"
                                stroke="#52664A"
                                strokeWidth="0.5"
                            />
                        </svg>
                    </div>

                    {/* Centered Typography Content */}
                    <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center py-6">
                        <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
                            <span style={{ color: '#FBF4EC' }}>Tiffin</span>
                            <span
                                className="transition-colors duration-500"
                                style={{
                                    color:
                                        role === 'customer'
                                            ? '#7E9C73'
                                            : '#E0653A',
                                }}
                            >
                                Wala
                            </span>
                        </h1>
                        <div
                            className="w-12 h-1 rounded-full mb-6 transition-colors duration-500"
                            style={{
                                backgroundColor:
                                    role === 'customer' ? '#7E9C73' : '#E0653A',
                            }}
                        />
                        <p
                            className="text-sm max-w-sm leading-relaxed font-body"
                            style={{ color: '#C7CCD1' }}
                        >
                            Connect with vetted local kitchens, manage
                            subscriptions, and enjoy fresh home-cooked meals
                            delivered daily.
                        </p>
                    </div>

                    {/* Footer Info details (reactive to current role) */}
                    <div className="relative z-10 w-full">
                        <div
                            className="transition-all duration-500 bg-white/5 border rounded-2xl p-6 backdrop-blur-md max-w-sm mx-auto shadow-sm"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                            {role === 'customer' ? (
                                <div className="space-y-1 text-center">
                                    <h3
                                        className="text-xs font-bold uppercase tracking-widest font-body"
                                        style={{ color: '#7E9C73' }}
                                    >
                                        Customer Access
                                    </h3>
                                    <p
                                        className="text-xs leading-relaxed font-body"
                                        style={{ color: '#C7CCD1' }}
                                    >
                                        Subscribe to tailored, hot meal
                                        schedules and split invoices instantly
                                        with roommates.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1 text-center">
                                    <h3
                                        className="text-xs font-bold uppercase tracking-widest font-body"
                                        style={{ color: '#E0653A' }}
                                    >
                                        Vendor Access
                                    </h3>
                                    <p
                                        className="text-xs leading-relaxed font-body"
                                        style={{ color: '#C7CCD1' }}
                                    >
                                        Coordinate menu calendars, scale
                                        subscriber lists, and track daily
                                        payouts transparently.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Translucent Credentials Card */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
                    {/* Header of credentials */}
                    <div className="mb-8 relative">
                        <div className="md:hidden flex items-center justify-center space-x-2 mb-6">
                            <h1 className="font-display text-3xl font-extrabold text-charcoal">
                                Tiffin<span className="text-spice">Wala</span>
                            </h1>
                        </div>
                        <h2 className="font-display text-3xl font-bold text-charcoal tracking-tight">
                            {step === 1 ? 'Welcome Back' : 'Verify Identity'}
                        </h2>
                        <p className="text-charcoal/60 text-xs mt-1.5 font-body">
                            {step === 1
                                ? 'Authenticate credentials to enter the culinary pipeline.'
                                : 'A verification code has been dispatched to your vendor email.'}
                        </p>
                    </div>

                    {/* Role toggle button inside form (syncs with Tiffin stack) */}
                    {step === 1 && (
                        <div className="mb-6 bg-charcoal/5 p-1 rounded-2xl flex items-center relative border border-charcoal/10">
                            {/* Animated background slider block */}
                            <div
                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-500 ease-out shadow-sm ${
                                    role === 'customer'
                                        ? 'left-1'
                                        : 'left-[calc(50%+2px)]'
                                }`}
                                style={{
                                    backgroundColor:
                                        role === 'customer'
                                            ? '#5C7A52'
                                            : '#E0653A',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setRole('customer')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 relative z-10 ${
                                    role === 'customer'
                                        ? 'text-white'
                                        : 'text-charcoal/60 hover:text-charcoal'
                                }`}
                            >
                                Customer
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('vendor')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 relative z-10 ${
                                    role === 'vendor'
                                        ? 'text-white'
                                        : 'text-charcoal/60 hover:text-charcoal'
                                }`}
                            >
                                Vendor
                            </button>
                        </div>
                    )}

                    {/* Error Messages */}
                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-spice/15 border border-spice/20 text-spice text-xs flex items-start space-x-2 font-body animate-pulse">
                            <svg
                                className="w-4 h-4 mt-0.5 shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success Messages */}
                    {success && (
                        <div className="mb-6 p-4 rounded-2xl bg-leaf/15 border border-leaf/20 text-leaf text-xs flex items-start space-x-2 font-body">
                            <svg
                                className="w-4 h-4 mt-0.5 shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Step 1: Input forms */}
                    {step === 1 && (
                        <form
                            onSubmit={(e) => e.preventDefault()}
                            className="space-y-5"
                        >
                            <FloatingInput
                                label="Email address or Phone number"
                                type="text"
                                value={emailOrPhone}
                                onChange={(e) =>
                                    setEmailOrPhone(e.target.value)
                                }
                                disabled={loading}
                                role={role}
                            />

                            <FloatingInput
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                isPassword={true}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                role={role}
                            />

                            <div className="flex justify-end pr-1 -mt-2">
                                <a
                                    href="/forget-password"
                                    className="text-xs font-semibold text-charcoal/50 hover:text-charcoal/75 transition-colors"
                                >
                                    Forgot Password?
                                </a>
                            </div>

                            {/* Tactile Latch Submit Button */}
                            <button
                                onClick={
                                    role === 'customer'
                                        ? handleCustomerLogin
                                        : handleVendorLoginStep1
                                }
                                disabled={loading || !emailOrPhone || !password}
                                onMouseEnter={() => setBtnHovered(true)}
                                onMouseLeave={() => setBtnHovered(false)}
                                className="w-full relative py-4 rounded-2xl font-display font-bold text-sm text-cream transition-all duration-300 transform active:scale-95 shadow-md flex items-center justify-center space-x-2 border border-black/10 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor:
                                        role === 'customer'
                                            ? btnHovered
                                                ? '#4A6242'
                                                : '#5C7A52'
                                            : btnHovered
                                              ? '#C5512B'
                                              : '#E0653A',
                                }}
                            >
                                {/* Shimmer highlight effect on hover */}
                                <div className="absolute inset-0 metal-shimmer opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                {loading ? (
                                    <>
                                        <svg
                                            className="animate-spin h-5 w-5 text-cream"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        <span>Securing Latch...</span>
                                    </>
                                ) : (
                                    <>
                                        {/* Tiffin Clasp locking icon details */}
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-300 ${isLatching ? 'rotate-90' : 'group-hover:scale-110'}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                        <span>
                                            {role === 'customer'
                                                ? 'Lock Latch & Login'
                                                : 'Secure & Send OTP'}
                                        </span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Step 2: Split OTP field grid */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center space-x-2">
                                {otpDigits.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        id={`otp-${idx}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) =>
                                            handleOtpChange(idx, e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            handleOtpKeyDown(idx, e)
                                        }
                                        disabled={loading}
                                        className={`w-12 h-14 bg-cream/30 border border-charcoal/20 text-charcoal text-center text-xl font-bold rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                                            role === 'customer'
                                                ? 'focus:ring-leaf/40 focus:border-leaf'
                                                : 'focus:ring-spice/40 focus:border-spice'
                                        }`}
                                    />
                                ))}
                            </div>

                            <div className="flex flex-col space-y-3">
                                <button
                                    onClick={handleVendorLoginStep2}
                                    disabled={loading || otp.length < 6}
                                    onMouseEnter={() => setBtnOtpHovered(true)}
                                    onMouseLeave={() => setBtnOtpHovered(false)}
                                    className="w-full py-4 text-cream font-display font-bold text-sm rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
                                    style={{
                                        backgroundColor: btnOtpHovered
                                            ? '#C5512B'
                                            : '#E0653A',
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <svg
                                                className="animate-spin h-5 w-5 text-cream"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            <span>Unlocking Tiffin...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2.5}
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            <span>Verify & Login</span>
                                        </>
                                    )}
                                </button>

                                <div className="flex justify-between items-center px-1 text-xs">
                                    <button
                                        type="button"
                                        onClick={handleResendEmailOTP}
                                        disabled={loading || resendTimer > 0}
                                        className={`font-semibold transition-colors py-2 ${
                                            resendTimer > 0 
                                                ? 'text-charcoal/40 cursor-not-allowed' 
                                                : 'text-spice hover:text-spice/80'
                                        }`}
                                    >
                                        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP to Email'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep(1);
                                            setOtpDigits(['', '', '', '', '', '']);
                                        }}
                                        disabled={loading}
                                        className="font-semibold text-charcoal/60 hover:text-charcoal transition-colors py-2"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Payment screen */}
                    {step === 3 && (
                        <div className="space-y-6 text-center select-none">
                            <div className="mx-auto w-16 h-16 rounded-full bg-spice/10 flex items-center justify-center text-spice mb-4 animate-pulse">
                                <svg
                                    className="w-8 h-8"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-charcoal font-display">
                                    One-Time Onboarding Fee
                                </h3>
                                <p className="text-xs text-charcoal/60 leading-relaxed max-w-sm mx-auto font-body">
                                    To activate your Vendor Kitchen profile on
                                    TiffinWala, a one-time onboarding fee of{' '}
                                    <strong className="text-spice">
                                        ₹9,999.00
                                    </strong>{' '}
                                    is required.
                                </p>
                                <p className="text-[11px] text-leaf font-semibold bg-leaf/10 py-1.5 px-3 rounded-xl max-w-xs mx-auto font-body">
                                    ✓ ₹9,999 will be credited directly to your
                                    Vendor Wallet.
                                </p>
                            </div>

                            <div className="flex flex-col space-y-3">
                                <button
                                    onClick={handlePayment}
                                    disabled={loading}
                                    className="w-full py-4 text-cream font-display font-bold text-sm rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2"
                                    style={{
                                        backgroundColor: '#E0653A',
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <svg
                                                className="animate-spin h-5 w-5 text-cream"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            <span>Processing Payment...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2.5}
                                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                />
                                            </svg>
                                            <span>Pay ₹9,999 via Razorpay</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                    className="text-center text-xs font-semibold text-charcoal/60 hover:text-spice transition-colors py-2 font-body"
                                >
                                    Cancel & Return
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Registration redirection link */}
                    {step === 1 && (
                        <p className="text-center text-xs text-charcoal/60 mt-8 font-body">
                            New to TiffinWala?{' '}
                            <a
                                href="/register"
                                className={`font-bold underline transition-colors ${
                                    role === 'customer'
                                        ? 'text-leaf hover:text-leaf/80'
                                        : 'text-spice hover:text-spice/80'
                                }`}
                            >
                                Register your account
                            </a>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
