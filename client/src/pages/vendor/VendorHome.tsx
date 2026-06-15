/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import tiffinBg from '../../assets/slate_spices_bg.png';
import { api } from '../../utils/api';

// ==========================================
// TYPES & PROP INTERFACES
// ==========================================

export interface ITier {
    name: string;
    items: string[];
    price: number;
    maxQuantity: number;
    remainingQuantity: number;
}

export interface IAddOn {
    name: string;
    price: number;
}

export interface MenuData {
    tiers: ITier[];
    addOns: IAddOn[];
    description: string;
    session: 'Lunch' | 'Dinner';
}

export interface OrderItem {
    name: string;
    quantity: number;
}

export interface Order {
    id: string;
    customerName: string;
    items: OrderItem[];
    totalQuantity: number;
    price: number;
    time: string;
    status: 'pending' | 'accepted' | 'rejected';
}

export interface VendorHomeProps {
    initialBusinessName?: string;
    initialIsOpen?: boolean;
    initialOrders?: Order[];
}

// Default dummy data for orders (orders backend not built yet — keep as placeholder)
const DEFAULT_ORDERS: Order[] = [
    {
        id: 'TFL-9821',
        customerName: 'Kushal Sharma',
        items: [
            { name: 'Chapati-Bhaji Deluxe', quantity: 1 },
            { name: 'Extra Butter Chapati', quantity: 2 },
        ],
        totalQuantity: 3,
        price: 150,
        time: '12:15 PM',
        status: 'pending',
    },
    {
        id: 'TFL-9824',
        customerName: 'Aditya Patel',
        items: [{ name: 'Rice-Dal-Chapati Special', quantity: 2 }],
        totalQuantity: 2,
        price: 280,
        time: '12:30 PM',
        status: 'pending',
    },
    {
        id: 'TFL-9799',
        customerName: 'Sneha Reddy',
        items: [{ name: 'Rice-Dal-Chapati Special', quantity: 1 }],
        totalQuantity: 1,
        price: 130,
        time: '11:45 AM',
        status: 'accepted',
    },
    {
        id: 'TFL-9790',
        customerName: 'Rahul Verma',
        items: [{ name: 'Chapati-Bhaji Deluxe', quantity: 1 }],
        totalQuantity: 1,
        price: 90,
        time: '11:15 AM',
        status: 'rejected',
    },
];

// ==========================================
// INTERACTIVE MAP PICKER COMPONENT (LEAFLET)
// ==========================================

interface MapPickerProps {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number) => void;
    address?: string;
}

function MapPicker({ lat, lng, onChange, address }: MapPickerProps) {
    const mapRef = React.useRef<HTMLDivElement>(null);
    const mapInstance = React.useRef<any>(null);
    const markerInstance = React.useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [geocoding, setGeocoding] = useState(false);

    // Load Leaflet dynamically
    useEffect(() => {
        if ((window as any).L) {
            setIsLoaded(true);
            return;
        }

        // Add Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        // Add Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.onload = () => {
            setIsLoaded(true);
        };
        document.body.appendChild(script);
    }, []);

    // Initialize Map
    useEffect(() => {
        if (!isLoaded || !mapRef.current) return;
        const L = (window as any).L;
        if (!L) return;

        const initialLat = lat || 19.0760; // Mumbai default
        const initialLng = lng || 72.8777;

        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
            markerInstance.current = null;
        }

        const map = L.map(mapRef.current, {
            zoomControl: true,
        }).setView([initialLat, initialLng], 13);
        mapInstance.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Custom SVG Marker (Theme aligned and fully self-contained)
        const customIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
                <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transform: translate(0px, 0px);">
                    <div style="position: absolute; width: 14px; height: 14px; background-color: rgba(224, 101, 58, 0.4); border-radius: 50%; animation: ripple-ring 1.5s infinite ease-out; top: 9px; left: 9px; pointer-events: none;"></div>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.25)); position: relative; z-index: 10;">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#E0653A"/>
                    </svg>
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });

        const marker = L.marker([initialLat, initialLng], {
            draggable: true,
            icon: customIcon
        }).addTo(map);
        markerInstance.current = marker;

        marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onChange(pos.lat, pos.lng);
        });

        map.on('click', (e: any) => {
            const pos = e.latlng;
            marker.setLatLng(pos);
            onChange(pos.lat, pos.lng);
        });

        setTimeout(() => {
            map.invalidateSize();
        }, 350);

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerInstance.current = null;
            }
        };
    }, [isLoaded]);

    // Handle lat/lng prop changes from outside (e.g. geocoder)
    useEffect(() => {
        if (mapInstance.current && markerInstance.current) {
            const currentLatLng = markerInstance.current.getLatLng();
            const targetLat = lat || 19.0760;
            const targetLng = lng || 72.8777;

            if (Math.abs(currentLatLng.lat - targetLat) > 0.0001 || Math.abs(currentLatLng.lng - targetLng) > 0.0001) {
                markerInstance.current.setLatLng([targetLat, targetLng]);
                mapInstance.current.setView([targetLat, targetLng], mapInstance.current.getZoom());
            }
        }
    }, [lat, lng]);

    const locateAddress = async () => {
        if (!address || address.trim() === '') return;
        setGeocoding(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
            );
            const data = await response.json();
            if (data && data.length > 0) {
                const result = data[0];
                onChange(Number(result.lat), Number(result.lon));
            } else {
                alert('Could not locate address on map. Please position pin manually.');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        } finally {
            setGeocoding(false);
        }
    };

    return (
        <div className="space-y-2 select-none">
            <div className="flex justify-between items-center">
                <span className="text-[10px] text-charcoal/50 font-bold uppercase tracking-wider font-body">
                    Kitchen Location Pin
                </span>
                {address && address.trim().length > 3 && (
                    <button
                        type="button"
                        onClick={locateAddress}
                        disabled={geocoding}
                        className="text-[10px] text-spice hover:underline font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                        {geocoding ? 'Locating...' : 'Locate Address on Map'}
                    </button>
                )}
            </div>
            
            <div 
                ref={mapRef} 
                className="w-full h-48 rounded-2xl border border-charcoal/15 overflow-hidden shadow-inner bg-charcoal/5 z-0"
            />
            
            <div className="flex justify-between text-[10px] text-charcoal/50 font-semibold font-body px-1">
                <span>Lat: {lat ? lat.toFixed(6) : '0.000000'}</span>
                <span>Lng: {lng ? lng.toFixed(6) : '0.000000'}</span>
                <span className="text-spice font-bold">Drag pin or click map to reposition</span>
            </div>
        </div>
    );
}

export default function VendorHome({
    initialBusinessName = 'Annapurna Rasoi',
    initialIsOpen = true,
    initialOrders = DEFAULT_ORDERS,
}: VendorHomeProps) {
    // ==========================================
    // LOCAL STATES
    // ==========================================
    const [isOpen, setIsOpen] = useState(initialIsOpen);
    const [businessName, setBusinessName] = useState(initialBusinessName);
    const [selectedSession, setSelectedSession] = useState<'Lunch' | 'Dinner'>(
        () => {
            const hour = new Date().getHours();
            return hour < 3 || hour > 22 ? 'Dinner' : 'Lunch';
        },
    );
    const [menu, setMenu] = useState<MenuData | null>(null);
    const [menuLoading, setMenuLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>(initialOrders);

    // Form Modal states
    const [showMenuModal, setShowMenuModal] = useState(false);

    // Greeting state calculated lazily
    const [greeting] = useState(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    });

    // Repeatable Tiers state
    interface IFormTier {
        name: string;
        items: string[];
        price: number | '';
        maxQuantity: number | '';
        itemInput: string;
    }
    const [formTiers, setFormTiers] = useState<IFormTier[]>([
        { name: '', items: [], price: '', maxQuantity: '', itemInput: '' },
    ]);

    // Repeatable Add-ons state
    interface IFormAddOn {
        name: string;
        price: number | '';
    }
    const [formAddOns, setFormAddOns] = useState<IFormAddOn[]>([]);

    const [formDesc, setFormDesc] = useState('');
    const [formSession, setFormSession] = useState<'Lunch' | 'Dinner'>('Lunch');
    const [formError, setFormError] = useState('');
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Profile Modal states
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileSubmitting, setProfileSubmitting] = useState(false);
    const [profileError, setProfileError] = useState('');

    // Profile form states
    const [formFirstname, setFormFirstname] = useState('');
    const [formLastname, setFormLastname] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formBusinessName, setFormBusinessName] = useState('');
    const [formRadius, setFormRadius] = useState<number | ''>('');
    const [formAddress, setFormAddress] = useState('');
    const [formLat, setFormLat] = useState<number | ''>('');
    const [formLng, setFormLng] = useState<number | ''>('');

    // Notification State (simulated unread count)
    const [notificationCount, setNotificationCount] = useState(3);
    const [showNotifications, setShowNotifications] = useState(false);

    // Filter for Orders Section ('all' | 'pending' | 'completed')
    const [orderFilter, setOrderFilter] = useState<
        'all' | 'pending' | 'completed'
    >('all');

    // Visual Parallax State
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Open/Close Tactile toggle ripple state
    const [ripple, setRipple] = useState(false);

    // Focus state indicator for floating labels in modals
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [descFocused, setDescFocused] = useState(false);

    // Date formatting for top bar
    const formattedDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    // ==========================================
    // EFFECTS
    // ==========================================

    // Fetch profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileRes = await api.get('/vendor/profile');
                if (profileRes.data.data) {
                    const profile = profileRes.data.data;
                    setBusinessName(profile.businessName || 'Annapurna Rasoi');
                    setIsOpen(profile.isOpen);

                    // Pre-populate profile form state
                    setFormFirstname(profile.userId?.firstName || '');
                    setFormLastname(profile.userId?.lastName || '');
                    setFormEmail(profile.userId?.email || '');
                    setFormPhone(profile.userId?.phone || '');
                    setFormBusinessName(profile.businessName || '');
                    setFormRadius(profile.deliveryRadiuskm || 5);
                    setFormAddress(profile.location?.address || '');
                    setFormLat(profile.location?.coordinates?.[1] ?? 0);
                    setFormLng(profile.location?.coordinates?.[0] ?? 0);
                }
            } catch (err) {
                console.error('Failed to fetch vendor profile', err);
            }
        };
        fetchProfile();
    }, []);

    // Fetch today's menu when selected session changes

    useEffect(() => {
        const fetchMenu = async () => {
            setMenuLoading(true);
            try {
                const menuRes = await api.get(
                    `/vendor/menu/today?session=${selectedSession.toLowerCase()}`,
                );
                if (menuRes.data.data) {
                    const mappedMenu: MenuData = {
                        ...menuRes.data.data,
                        session:
                            menuRes.data.data.session === 'lunch'
                                ? 'Lunch'
                                : 'Dinner',
                    };
                    setMenu(mappedMenu);
                } else {
                    setMenu(null);
                }
            } catch (err) {
                console.error('Failed to fetch menu', err);
                setMenu(null);
            } finally {
                setMenuLoading(false);
            }
        };
        fetchMenu();
    }, [selectedSession]);

    // ==========================================
    // HANDLERS
    // ==========================================

    // Track cursor movement for parallax floating elements
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const x = (clientX - window.innerWidth / 2) / 45; // subtle offsets
        const y = (clientY - window.innerHeight / 2) / 45;
        setMousePos({ x, y });
    };

    // Toggle Open/Closed with Ripple animation — wired to backend
    const handleStatusToggle = async () => {
        try {
            const res = await api.put('/vendor/toggle');
            setIsOpen(res.data.data.isOpen);
            setRipple(true);
        } catch (err) {
            console.error('Failed to toggle status', err);
        }
    };

    // repeatable Tier logic
    const addTierRow = () => {
        setFormTiers([
            ...formTiers,
            { name: '', items: [], price: '', maxQuantity: '', itemInput: '' },
        ]);
    };

    const removeTierRow = (index: number) => {
        if (formTiers.length > 1) {
            setFormTiers(formTiers.filter((_, idx) => idx !== index));
        }
    };

    const handleTierKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const value = formTiers[index].itemInput.trim().replace(/,$/, '');
            if (value) {
                if (formTiers[index].items.includes(value)) {
                    setFormError(`"${value}" is already added to this tier`);
                } else {
                    const updated = [...formTiers];
                    updated[index].items = [...updated[index].items, value];
                    updated[index].itemInput = '';
                    setFormTiers(updated);
                    setFormError('');
                }
            }
        }
    };

    const handleRemoveTierTag = (tierIndex: number, tagIndex: number) => {
        const updated = [...formTiers];
        updated[tierIndex].items = updated[tierIndex].items.filter(
            (_, idx) => idx !== tagIndex,
        );
        setFormTiers(updated);
    };

    // repeatable Add-on logic
    const addAddOnRow = () => {
        setFormAddOns([...formAddOns, { name: '', price: '' }]);
    };

    const removeAddOnRow = (index: number) => {
        setFormAddOns(formAddOns.filter((_, idx) => idx !== index));
    };

    const updateAddOn = (
        index: number,
        field: keyof IFormAddOn,
        value: string | number,
    ) => {
        const updated = [...formAddOns];
        updated[index] = { ...updated[index], [field]: value };
        setFormAddOns(updated);
    };

    // Form Submit Handler — wired to backend (upsert support)
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Tiers validation
        if (formTiers.length === 0) {
            setFormError('Please add at least one menu tier.');
            return;
        }

        for (let i = 0; i < formTiers.length; i++) {
            const t = formTiers[i];
            if (!t.name.trim()) {
                setFormError(`Tier ${i + 1} must have a name.`);
                return;
            }
            if (t.items.length === 0) {
                setFormError(
                    `Tier "${t.name}" must have at least one menu item tag.`,
                );
                return;
            }
            if (t.price === '' || Number(t.price) <= 0) {
                setFormError(`Tier "${t.name}" must have a valid price.`);
                return;
            }
            if (t.maxQuantity === '' || Number(t.maxQuantity) <= 0) {
                setFormError(
                    `Tier "${t.name}" must have a valid maximum capacity.`,
                );
                return;
            }
        }

        // Add-ons validation
        for (let i = 0; i < formAddOns.length; i++) {
            const ad = formAddOns[i];
            if (!ad.name.trim() || ad.price === '' || Number(ad.price) <= 0) {
                setFormError(
                    `Add-on row ${i + 1} must have a name and a valid price.`,
                );
                return;
            }
        }

        if (!formDesc.trim()) {
            setFormError('Please write a brief menu description.');
            return;
        }

        // Build payload — strip remainingQuantity, backend calculates it
        const tiersPayload = formTiers.map((t) => ({
            name: t.name,
            items: t.items,
            price: Number(t.price),
            maxQuantity: Number(t.maxQuantity),
        }));

        const addOnsPayload: IAddOn[] = formAddOns.map((ad) => ({
            name: ad.name,
            price: Number(ad.price),
        }));

        setFormSubmitting(true);
        setFormError('');

        try {
            const res = await api.post('/vendor/menu/create-menu', {
                tiers: tiersPayload,
                addOns: addOnsPayload,
                description: formDesc,
                session: formSession.toLowerCase(),
            });

            const savedMenu = res.data.data;
            const mappedMenu: MenuData = {
                ...savedMenu,
                session: savedMenu.session === 'lunch' ? 'Lunch' : 'Dinner',
            };
            setMenu(mappedMenu);
            setShowMenuModal(false);
            resetForm();
        } catch (err: any) {
            setFormError(
                err.response?.data?.message || 'Failed to upload menu',
            );
        } finally {
            setFormSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormTiers([
            { name: '', items: [], price: '', maxQuantity: '', itemInput: '' },
        ]);
        setFormAddOns([]);
        setFormDesc('');
        setFormSession(selectedSession);
        setFormError('');
    };

    // Profile Settings Submit Handler — wired to backend
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formFirstname.trim() || !formLastname.trim()) {
            setProfileError('First and Last names are required.');
            return;
        }
        if (!formEmail.trim() || !formPhone.trim()) {
            setProfileError('Email and Phone number are required.');
            return;
        }
        if (!formBusinessName.trim()) {
            setProfileError('Business name is required.');
            return;
        }

        setProfileSubmitting(true);
        setProfileError('');

        try {
            const res = await api.put('/vendor/profile', {
                firstname: formFirstname,
                lastname: formLastname,
                email: formEmail,
                phone: formPhone,
                businessName: formBusinessName,
                deliveryRadiuskm: formRadius === '' ? 5 : Number(formRadius),
                address: formAddress,
                coordinates: [
                    formLng === '' ? 0 : Number(formLng),
                    formLat === '' ? 0 : Number(formLat),
                ],
            });

            const updatedVendor = res.data.data;
            setBusinessName(updatedVendor.businessName || 'Annapurna Rasoi');
            setIsOpen(updatedVendor.isOpen);

            // Sync form fields with response
            setFormFirstname(updatedVendor.userId?.firstName || '');
            setFormLastname(updatedVendor.userId?.lastName || '');
            setFormEmail(updatedVendor.userId?.email || '');
            setFormPhone(updatedVendor.userId?.phone || '');
            setFormBusinessName(updatedVendor.businessName || '');
            setFormRadius(updatedVendor.deliveryRadiuskm || 5);
            setFormAddress(updatedVendor.location?.address || '');
            setFormLat(updatedVendor.location?.coordinates?.[1] ?? 0);
            setFormLng(updatedVendor.location?.coordinates?.[0] ?? 0);

            setShowProfileModal(false);
        } catch (err: any) {
            console.error('Failed to update profile', err);
            const msg =
                err.response?.data?.message ||
                'Failed to update profile. Please try again.';
            setProfileError(msg);
        } finally {
            setProfileSubmitting(false);
        }
    };

    // Simulated Order Actions with stock deduction logic (orders backend not built yet)
    const handleAcceptOrder = (orderId: string) => {
        setOrders((prev) =>
            prev.map((ord) =>
                ord.id === orderId ? { ...ord, status: 'accepted' } : ord,
            ),
        );
        // Reduce remaining count of matching tier if menu exists
        if (menu) {
            const acceptedOrder = orders.find((o) => o.id === orderId);
            if (acceptedOrder) {
                setMenu((prev) => {
                    if (!prev) return null;

                    // Deduct from matched tier using name matching, or default to first tier
                    const updatedTiers = prev.tiers.map((tier) => {
                        const isTarget = acceptedOrder.items.some(
                            (item) =>
                                item.name
                                    .toLowerCase()
                                    .includes(tier.name.toLowerCase()) ||
                                tier.name
                                    .toLowerCase()
                                    .includes(item.name.toLowerCase()),
                        );

                        if (isTarget) {
                            return {
                                ...tier,
                                remainingQuantity: Math.max(
                                    0,
                                    tier.remainingQuantity -
                                        acceptedOrder.totalQuantity,
                                ),
                            };
                        }
                        return tier;
                    });

                    const hasMatched = prev.tiers.some((tier) =>
                        acceptedOrder.items.some(
                            (item) =>
                                item.name
                                    .toLowerCase()
                                    .includes(tier.name.toLowerCase()) ||
                                tier.name
                                    .toLowerCase()
                                    .includes(item.name.toLowerCase()),
                        ),
                    );

                    if (!hasMatched && updatedTiers.length > 0) {
                        updatedTiers[0] = {
                            ...updatedTiers[0],
                            remainingQuantity: Math.max(
                                0,
                                updatedTiers[0].remainingQuantity -
                                    acceptedOrder.totalQuantity,
                            ),
                        };
                    }

                    return {
                        ...prev,
                        tiers: updatedTiers,
                    };
                });
            }
        }
    };

    const handleRejectOrder = (orderId: string) => {
        setOrders((prev) =>
            prev.map((ord) =>
                ord.id === orderId ? { ...ord, status: 'rejected' } : ord,
            ),
        );
    };

    // Helper for initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Filtered orders list
    const filteredOrders = orders.filter((ord) => {
        if (orderFilter === 'pending') return ord.status === 'pending';
        if (orderFilter === 'completed')
            return ord.status === 'accepted' || ord.status === 'rejected';
        return true;
    });

    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const completedCount = orders.filter(
        (o) => o.status === 'accepted' || o.status === 'rejected',
    ).length;
    const totalEarnings = orders.reduce(
        (sum, o) => (o.status === 'accepted' ? sum + o.price : sum),
        0,
    );

    return (
        <div
            onMouseMove={handleMouseMove}
            className="min-h-screen bg-cream font-body text-charcoal pb-16 transition-all duration-300 relative overflow-hidden select-text"
        >
            {/* Custom Embedded Keyframes */}
            <style>{`
                @keyframes scale-up {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes pulse-dot {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.8; }
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(5deg); }
                }
                @keyframes float-medium {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-22px) rotate(-8deg); }
                }
                @keyframes ripple-ring {
                    0% { transform: scale(0.7); opacity: 0.8; }
                    100% { transform: scale(2.4); opacity: 0; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-scale-up { animation: scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-pulse-dot { animation: pulse-dot 2s infinite ease-in-out; }
                .floating-leaf { animation: float-slow 7s ease-in-out infinite; }
                .floating-anise { animation: float-medium 9s ease-in-out infinite; }
                .floating-cardamom { animation: float-slow 6s ease-in-out infinite; }
                .animate-ripple { animation: ripple-ring 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
                .animate-fade-in-up { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                /* Premium Scrollbar */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(224, 101, 58, 0.2);
                    border-radius: 9999px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(224, 101, 58, 0.4);
                }
            `}</style>

            {/* Background Texture Overlay */}
            <img
                src={tiffinBg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-[0.035] mix-blend-multiply pointer-events-none select-none z-0"
            />

            {/* Background Ambient Glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[130px] bg-spice/15 transition-all duration-1000" />
                <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full blur-[150px] bg-turmeric/10 transition-all duration-1000" />
            </div>

            {/* Floating Parallax Spices */}
            <div
                style={{
                    transform: `translate3d(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px, 0)`,
                    transition: 'transform 0.15s ease-out',
                }}
                className="absolute top-[15%] left-[8%] floating-leaf opacity-[0.85] pointer-events-none z-10 hidden md:block"
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

            <div
                style={{
                    transform: `translate3d(${mousePos.x * -0.6}px, ${mousePos.y * -0.6}px, 0)`,
                    transition: 'transform 0.15s ease-out',
                }}
                className="absolute bottom-[20%] right-[6%] floating-anise opacity-75 pointer-events-none z-10 hidden md:block"
            >
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L14 9H10L12 2Z" fill="#8C5B3E" />
                    <path d="M12 22L10 15H14L12 22Z" fill="#8C5B3E" />
                    <path d="M2 12L9 10V14L2 12Z" fill="#8C5B3E" />
                    <path d="M22 12L15 14V10L22 12Z" fill="#8C5B3E" />
                    <path d="M5 5L10 10L9 11L4 6L5 5Z" fill="#A46E4D" />
                    <path d="M19 19L14 14L15 13L20 18L19 19Z" fill="#A46E4D" />
                    <path d="M5 19L10 14L9 13L4 18L5 19Z" fill="#A46E4D" />
                    <path d="M19 5L14 10L15 11L20 6L19 5Z" fill="#A46E4D" />
                    <circle cx="12" cy="12" r="3" fill="#D2996A" />
                </svg>
            </div>

            <div
                style={{
                    transform: `translate3d(${mousePos.x * 0.9}px, ${mousePos.y * -0.4}px, 0)`,
                    transition: 'transform 0.15s ease-out',
                }}
                className="absolute top-[35%] right-[10%] floating-cardamom opacity-80 pointer-events-none z-10 hidden md:block"
            >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
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

            <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10 relative z-10">
                {/* ==========================================
                    1. TOP BAR SECTION (Glassmorphic & Detailed)
                   ========================================== */}
                <header className="relative z-30 bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-5 md:p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.15)] mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        {/* Interactive Avatar / Kitchen Badge */}
                        <button
                            onClick={() => setShowProfileModal(true)}
                            title="Edit Profile Settings"
                            className="w-14 h-14 rounded-2xl bg-spice/10 hover:bg-spice/20 border border-spice/20 flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
                        >
                            <span className="text-2xl font-display font-extrabold text-spice select-none">
                                {businessName ? getInitials(businessName) : 'A'}
                            </span>
                        </button>
                        <div className="text-center sm:text-left">
                            <p className="text-[10px] text-charcoal/50 font-bold uppercase tracking-wider font-body">
                                {greeting}
                            </p>
                            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-charcoal">
                                {businessName}
                            </h1>

                            {/* Today's Date & Dynamic Stats inline line */}
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs text-charcoal/60 mt-1 font-body">
                                <span>{formattedDate}</span>
                                <span className="w-1 h-1 rounded-full bg-charcoal/20" />
                                <span>{orders.length} orders today</span>
                                <span className="w-1 h-1 rounded-full bg-charcoal/20" />
                                <span className="text-spice font-bold">
                                    ₹{totalEarnings} earned
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Open/Close tactile animated switch with tactile ripple */}
                        <div className="flex items-center space-x-3 bg-charcoal/5 px-4 py-2.5 rounded-2xl border border-charcoal/10 relative overflow-visible select-none">
                            <span
                                className={`text-xs font-bold tracking-wider uppercase transition-colors duration-300 ${isOpen ? 'text-spice' : 'text-charcoal/55'}`}
                            >
                                {isOpen ? 'Open' : 'Closed'}
                            </span>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={handleStatusToggle}
                                    aria-label="Toggle store status"
                                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${
                                        isOpen ? 'bg-spice' : 'bg-charcoal/20'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md transform flex items-center justify-center ${
                                            isOpen
                                                ? 'translate-x-7'
                                                : 'translate-x-0'
                                        }`}
                                    >
                                        {/* Tactile detail indicator */}
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full transition-colors ${isOpen ? 'bg-spice' : 'bg-charcoal/30'}`}
                                        />
                                    </span>
                                </button>
                                {/* Radiating ripple ring */}
                                {ripple && (
                                    <span
                                        onAnimationEnd={() => setRipple(false)}
                                        className="absolute inset-0 -m-1 rounded-full bg-spice/30 animate-ripple pointer-events-none z-10"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    if (notificationCount > 0)
                                        setNotificationCount(0); // clear indicator on click
                                }}
                                className="w-12 h-12 rounded-2xl bg-white/70 hover:bg-cream/50 border border-charcoal/10 flex items-center justify-center text-charcoal/80 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm relative"
                            >
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
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                                {notificationCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-spice text-white text-[10px] font-bold flex items-center justify-center animate-pulse-dot border-2 border-cream">
                                        {notificationCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown panel */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-3 w-80 bg-white border border-charcoal/10 rounded-[24px] shadow-xl p-4 z-50 animate-scale-up">
                                    <div className="flex justify-between items-center border-b border-charcoal/5 pb-2 mb-2">
                                        <h3 className="font-display font-bold text-sm text-charcoal">
                                            Notifications
                                        </h3>
                                        <button
                                            onClick={() =>
                                                setShowNotifications(false)
                                            }
                                            className="text-[10px] text-spice hover:underline font-bold uppercase tracking-wider"
                                        >
                                            Close
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        <div className="text-xs p-2.5 rounded-xl hover:bg-cream/40 bg-spice/5 border border-spice/10 transition-colors">
                                            <p className="font-bold text-charcoal">
                                                New Order Received!
                                            </p>
                                            <p className="text-charcoal/60 mt-0.5">
                                                Aditya Patel ordered 2x Premium
                                                Lunch Box
                                            </p>
                                            <span className="text-[9px] text-charcoal/40 font-semibold block mt-1">
                                                12:30 PM
                                            </span>
                                        </div>
                                        <div className="text-xs p-2.5 rounded-xl hover:bg-cream/40 transition-colors">
                                            <p className="font-bold text-charcoal">
                                                Order accepted
                                            </p>
                                            <p className="text-charcoal/60 mt-0.5">
                                                You accepted Kushal Sharma's
                                                order
                                            </p>
                                            <span className="text-[9px] text-charcoal/40 font-semibold block mt-1">
                                                12:18 PM
                                            </span>
                                        </div>
                                        <div className="text-xs p-2.5 rounded-xl hover:bg-cream/40 transition-colors">
                                            <p className="font-bold text-charcoal">
                                                Menu Reminder
                                            </p>
                                            <p className="text-charcoal/60 mt-0.5">
                                                Don't forget to upload today's
                                                menu to accept orders.
                                            </p>
                                            <span className="text-[9px] text-charcoal/40 font-semibold block mt-1 font-body">
                                                11:00 AM
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* ==========================================
                        LEFT COLUMN: TODAY'S MENU (lg:col-span-5)
                       ========================================== */}
                    <div className={`lg:col-span-5 space-y-6 transition-all duration-300 ${!isOpen ? 'opacity-65 grayscale-[35%]' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                            <h2 className="font-display text-xl font-bold text-charcoal flex items-center space-x-2">
                                <span>Today's Culinary Pitch</span>
                            </h2>

                            {/* Session selection tabs */}
                            <div className="flex bg-charcoal/5 p-1 rounded-2xl border border-charcoal/10 select-none w-full sm:w-48 shrink-0">
                                {(['Lunch', 'Dinner'] as const).map(
                                    (session) => {
                                        const isActive =
                                            selectedSession === session;
                                        return (
                                            <button
                                                key={session}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedSession(session)
                                                }
                                                className={`flex-1 py-1.5 text-center text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                                                    isActive
                                                        ? 'bg-spice text-white shadow-sm'
                                                        : 'text-charcoal/50 hover:text-charcoal/80'
                                                }`}
                                            >
                                                {session}
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        </div>

                        {menuLoading ? (
                            /* Loading State */
                            <div className="bg-white/30 backdrop-blur-md border border-charcoal/10 rounded-[32px] p-8 text-center flex flex-col items-center justify-center min-h-[400px] shadow-sm">
                                <div className="w-10 h-10 border-3 border-spice/20 border-t-spice rounded-full animate-spin mb-4" />
                                <p className="text-xs text-charcoal/50 font-body">
                                    Loading today's menu...
                                </p>
                            </div>
                        ) : menu ? (
                            /* Menu Uploaded State - Multiple Tiers & Add-ons */
                            <div className="bg-white/40 border border-white/30 backdrop-blur-xl shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)] rounded-[32px] p-6 relative overflow-hidden transition-all duration-300">
                                {/* Corner design accent */}
                                <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-spice/5 border border-spice/10 pointer-events-none" />

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="px-3 py-1 rounded-full bg-spice text-white text-xs font-bold uppercase tracking-wider shadow-sm select-none">
                                            {menu.session}
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-leaf/10 border border-leaf/20 text-leaf text-xs font-bold uppercase tracking-wider select-none">
                                            Active
                                        </span>
                                        {!isOpen && (
                                            <span className="px-3 py-1 rounded-full bg-charcoal/10 border border-charcoal/20 text-charcoal/60 text-xs font-bold uppercase tracking-wider flex items-center gap-1 select-none">
                                                <svg
                                                    className="w-3 h-3"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                    />
                                                </svg>
                                                Locked
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Vertical stack of tier cards */}
                                <div className="space-y-4 mb-5">
                                    {menu.tiers.map((tier, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-cream/40 border border-charcoal/10 rounded-2xl p-4 relative overflow-hidden shadow-sm hover:border-spice/20 transition-all duration-300"
                                        >
                                            {/* Tier Header and Price */}
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-[9px] text-spice font-bold uppercase tracking-widest block font-body">
                                                        Tier {idx + 1}
                                                    </span>
                                                    <h3 className="font-display text-base font-extrabold text-charcoal">
                                                        {tier.name}
                                                    </h3>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-lg font-display font-extrabold text-charcoal">
                                                        ₹{tier.price}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Tier Item Chips */}
                                            <div className="mb-3 flex flex-wrap gap-1.5">
                                                {tier.items.map(
                                                    (item, tagIdx) => (
                                                        <span
                                                            key={tagIdx}
                                                            className="px-2.5 py-1 rounded-xl bg-white/90 border border-charcoal/5 text-charcoal text-[11px] font-semibold select-none shadow-sm"
                                                        >
                                                            {item}
                                                        </span>
                                                    ),
                                                )}
                                            </div>

                                            {/* Tier Stock Bar */}
                                            <div className="bg-charcoal/5 p-3 rounded-xl border border-charcoal/5">
                                                <div className="flex justify-between items-center text-[10px] font-bold mb-1 font-body">
                                                    <span className="text-charcoal/50">
                                                        Tiffins Remaining
                                                    </span>
                                                    <span
                                                        className={`${tier.remainingQuantity < 10 ? 'text-spice animate-pulse' : 'text-charcoal'}`}
                                                    >
                                                        {tier.remainingQuantity}{' '}
                                                        / {tier.maxQuantity}{' '}
                                                        Left
                                                    </span>
                                                </div>
                                                <div className="w-full bg-charcoal/10 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-spice to-turmeric h-full rounded-full transition-all duration-500 ease-out"
                                                        style={{
                                                            width: `${(tier.remainingQuantity / tier.maxQuantity) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add-ons horizontal list below tiers */}
                                {menu.addOns && menu.addOns.length > 0 && (
                                    <div className="mb-6 border-t border-charcoal/10 pt-4">
                                        <h3 className="text-xs font-bold text-charcoal/40 uppercase tracking-wider mb-2.5 font-body">
                                            Available Add-ons
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {menu.addOns.map(
                                                (addOn, addOnIdx) => (
                                                    <span
                                                        key={addOnIdx}
                                                        className="px-3 py-1.5 rounded-xl bg-charcoal/5 border border-dashed border-charcoal/20 text-charcoal text-xs font-semibold flex items-center gap-1 select-none"
                                                    >
                                                        <span>
                                                            {addOn.name}
                                                        </span>
                                                        <span className="text-spice font-bold">
                                                            +₹{addOn.price}
                                                        </span>
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Menu Description */}
                                <div className="mb-6">
                                    <h3 className="text-xs font-bold text-charcoal/40 uppercase tracking-wider mb-1.5 font-body">
                                        Description
                                    </h3>
                                    <p className="text-sm text-charcoal/70 leading-relaxed font-body">
                                        {menu.description}
                                    </p>
                                </div>

                                {/* Update Menu button */}
                                <button
                                    disabled={!isOpen}
                                    onClick={() => {
                                        setFormTiers(
                                            menu.tiers.map((t) => ({
                                                name: t.name,
                                                items: t.items,
                                                price: t.price,
                                                maxQuantity: t.maxQuantity,
                                                itemInput: '',
                                            })),
                                        );
                                        setFormAddOns(
                                            menu.addOns.map((ad) => ({
                                                name: ad.name,
                                                price: ad.price,
                                            })),
                                        );
                                        setFormDesc(menu.description);
                                        setFormSession(menu.session);
                                        setShowMenuModal(true);
                                    }}
                                    className={`w-full py-4 rounded-2xl border-2 transition-all duration-300 font-bold text-sm flex items-center justify-center space-x-2 ${
                                        isOpen
                                            ? 'border-spice text-spice hover:bg-spice hover:text-white hover:shadow-[0_8px_25px_rgba(224,101,58,0.2)] cursor-pointer'
                                            : 'border-charcoal/20 text-charcoal/40 bg-charcoal/5 cursor-not-allowed'
                                    }`}
                                >
                                    {isOpen ? (
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="w-4 h-4 text-charcoal/40"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    )}
                                    <span>{isOpen ? 'Update Active Menu' : 'Menu Locked (Store Closed)'}</span>
                                </button>
                            </div>
                        ) : (
                            /* Menu Empty State (Custom illustrated tiffin box & drop zone feel) */
                            <div className={`bg-white/30 backdrop-blur-md border-2 border-dashed rounded-[32px] p-8 text-center flex flex-col items-center justify-center min-h-[400px] shadow-sm transition-all duration-300 group relative ${
                                isOpen ? 'border-charcoal/10 hover:border-spice/30' : 'border-charcoal/20 opacity-70'
                            }`}>
                                {!isOpen && (
                                    <div className="absolute top-4 right-4 bg-charcoal/10 backdrop-blur-md px-3 py-1 rounded-full border border-charcoal/20 flex items-center space-x-1 text-charcoal/60 text-xs font-bold uppercase tracking-wider select-none">
                                        <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                        <span>Locked</span>
                                    </div>
                                )}
                                {/* Detailed Grayscale Stacked 3-tier Tiffin SVG */}
                                <div className="w-24 h-24 mb-6 text-charcoal/30 stroke-current group-hover:text-spice/55 transition-colors duration-300">
                                    <svg
                                        viewBox="0 0 100 120"
                                        fill="none"
                                        className="w-full h-full"
                                    >
                                        {/* Top grip arch */}
                                        <path
                                            d="M 32,32 C 32,13 68,13 68,32"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            fill="none"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M 44,14 L 56,14"
                                            stroke="currentColor"
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                        />

                                        {/* Main bracket bars down the sides holding tins together */}
                                        <path
                                            d="M 27,32 L 27,105"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M 73,32 L 73,105"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M 27,32 L 73,32"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />

                                        {/* Tier 1 (Top container) */}
                                        <rect
                                            x="30"
                                            y="34"
                                            width="40"
                                            height="20"
                                            rx="3"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />
                                        <line
                                            x1="30"
                                            y1="50"
                                            x2="70"
                                            y2="50"
                                            stroke="currentColor"
                                            strokeWidth="1"
                                        />

                                        {/* Tier 2 (Middle container) */}
                                        <rect
                                            x="30"
                                            y="58"
                                            width="40"
                                            height="20"
                                            rx="3"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />
                                        <line
                                            x1="30"
                                            y1="74"
                                            x2="70"
                                            y2="74"
                                            stroke="currentColor"
                                            strokeWidth="1"
                                        />

                                        {/* Tier 3 (Bottom container) */}
                                        <rect
                                            x="30"
                                            y="82"
                                            width="40"
                                            height="22"
                                            rx="4"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />
                                        <line
                                            x1="30"
                                            y1="99"
                                            x2="70"
                                            y2="99"
                                            stroke="currentColor"
                                            strokeWidth="1"
                                        />

                                        {/* Side tension clips */}
                                        <path
                                            d="M 23,40 C 23,40 25,48 27,51"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        />
                                        <path
                                            d="M 77,40 C 77,40 75,48 73,51"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        />

                                        {/* Rivet Details */}
                                        <circle
                                            cx="27"
                                            cy="68"
                                            r="1.5"
                                            fill="currentColor"
                                        />
                                        <circle
                                            cx="73"
                                            cy="68"
                                            r="1.5"
                                            fill="currentColor"
                                        />
                                        <circle
                                            cx="27"
                                            cy="92"
                                            r="1.5"
                                            fill="currentColor"
                                        />
                                        <circle
                                            cx="73"
                                            cy="92"
                                            r="1.5"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </div>
                                <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                                    No Active Menu Posted
                                </h3>
                                <p className="text-xs text-charcoal/50 max-w-xs leading-relaxed mb-6 font-body">
                                    Upload today's dishes to populate your
                                    storefront and activate your subscription
                                    orders pipeline.
                                </p>
                                <button
                                    disabled={!isOpen}
                                    onClick={() => {
                                        resetForm();
                                        setShowMenuModal(true);
                                    }}
                                    className={`px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center space-x-2 ${
                                        isOpen
                                            ? 'bg-spice hover:bg-spice/90 text-white shadow-[0_8px_25px_rgba(224,101,58,0.25)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                                            : 'bg-charcoal/20 text-charcoal/40 cursor-not-allowed'
                                    }`}
                                >
                                    {isOpen ? (
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="w-4 h-4 text-charcoal/40"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    )}
                                    <span>{isOpen ? "Upload Today's Menu" : 'Menu Locked (Store Closed)'}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ==========================================
                        RIGHT COLUMN: TODAY'S ORDERS (lg:col-span-7)
                       ========================================== */}
                    <div className={`lg:col-span-7 space-y-6 transition-all duration-300 ${!isOpen ? 'opacity-65 grayscale-[35%]' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                            <h2 className="font-display text-xl font-bold text-charcoal flex items-center space-x-2">
                                <span>Incoming Orders Pipeline</span>
                            </h2>

                            {/* Segmented Underlined Filter Controls */}
                            <div className="flex border-b border-charcoal/10 w-full sm:w-auto relative mb-1 shrink-0 select-none">
                                {(['all', 'pending', 'completed'] as const).map(
                                    (filter) => {
                                        const count =
                                            filter === 'all'
                                                ? orders.length
                                                : filter === 'pending'
                                                  ? pendingCount
                                                  : completedCount;

                                        const isActive = orderFilter === filter;

                                        return (
                                            <button
                                                key={filter}
                                                onClick={() =>
                                                    setOrderFilter(filter)
                                                }
                                                className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 relative ${
                                                    isActive
                                                        ? 'text-spice'
                                                        : 'text-charcoal/40 hover:text-charcoal/70'
                                                }`}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    {filter}
                                                    <span
                                                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                            isActive
                                                                ? 'bg-spice/15 text-spice'
                                                                : 'bg-charcoal/5 text-charcoal/50'
                                                        }`}
                                                    >
                                                        {count}
                                                    </span>
                                                </span>
                                                {isActive && (
                                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-spice rounded-t-full transition-all duration-300" />
                                                )}
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        </div>

                        {filteredOrders.length === 0 ? (
                            /* Orders Empty State */
                            <div className="bg-white/30 backdrop-blur-md border border-charcoal/10 border-dashed rounded-[32px] p-8 text-center flex flex-col items-center justify-center min-h-[360px] shadow-sm">
                                <div className="w-16 h-16 rounded-full bg-charcoal/5 flex items-center justify-center mb-4 text-charcoal/40 shadow-inner">
                                    <svg
                                        className="w-8 h-8"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                        />
                                    </svg>
                                </div>
                                <h3 className="font-display text-lg font-bold text-charcoal mb-2">
                                    No Matching Orders
                                </h3>
                                <p className="text-xs text-charcoal/50 max-w-xs leading-relaxed font-body">
                                    Subscriptions and on-demand orders matching
                                    this filter will stream here in real time.
                                </p>
                            </div>
                        ) : (
                            /* Orders Pipeline List with staggered fade-in animations */
                            <div className="max-h-[430px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                                {filteredOrders.map((order, index) => {
                                    // Custom color formatting depending on urgency/status
                                    let borderStyle =
                                        'border-l-4 border-l-spice bg-[#FFF9F6]/80 hover:bg-[#FFF4ED]/90 hover:border-r-spice/20'; // pending & new
                                    let badgeStyle =
                                        'bg-spice/10 text-spice border border-spice/20';

                                    if (order.status === 'accepted') {
                                        borderStyle =
                                            'border-l-4 border-l-leaf bg-[#F2F9F2]/75 hover:bg-[#EBF7EB]/90';
                                    } else if (order.status === 'rejected') {
                                        borderStyle =
                                            'border-l-4 border-l-charcoal/20 bg-charcoal/[0.03] opacity-60';
                                    } else if (order.id === 'TFL-9821') {
                                        // Older pending order gets warning red border tint
                                        borderStyle =
                                            'border-l-4 border-l-[#D9383A] bg-[#FFF5F5]/60 hover:bg-[#FFEBEB]/80';
                                        badgeStyle =
                                            'bg-[#D9383A]/10 text-[#D9383A] border border-[#D9383A]/20';
                                    }

                                    return (
                                        <div
                                            key={order.id}
                                            style={{
                                                animationDelay: `${index * 80}ms`,
                                            }}
                                            className={`bg-white/40 border border-white/20 shadow-[0_8px_25px_-5px_rgba(43,33,24,0.04)] hover:shadow-[0_12px_35px_-5px_rgba(43,33,24,0.08)] rounded-2xl p-5 transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up ${borderStyle}`}
                                        >
                                            {/* Left: Customer Info, Initials Avatar & Order Items */}
                                            <div className="flex items-start gap-4">
                                                {/* Customer Avatar Initials Circle */}
                                                <div
                                                    className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-sm font-bold shadow-inner border select-none ${
                                                        order.status ===
                                                        'accepted'
                                                            ? 'bg-leaf/10 text-leaf border-leaf/25'
                                                            : order.status ===
                                                                'rejected'
                                                              ? 'bg-charcoal/10 text-charcoal/50 border-charcoal/15'
                                                              : order.id ===
                                                                  'TFL-9821'
                                                                ? 'bg-[#D9383A]/10 text-[#D9383A] border-[#D9383A]/25'
                                                                : 'bg-spice/10 text-spice border-spice/25'
                                                    }`}
                                                >
                                                    {getInitials(
                                                        order.customerName,
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        <span
                                                            className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-lg select-none ${badgeStyle}`}
                                                        >
                                                            {order.id}
                                                        </span>
                                                        <h3 className="font-display text-base font-bold text-charcoal">
                                                            {order.customerName}
                                                        </h3>
                                                        <span className="text-[10px] text-charcoal/40 font-bold uppercase tracking-wider">
                                                            {order.time}
                                                        </span>
                                                    </div>

                                                    {/* Items list */}
                                                    <div className="space-y-1 pl-0.5">
                                                        {order.items.map(
                                                            (it, idx) => (
                                                                <p
                                                                    key={idx}
                                                                    className="text-xs text-charcoal/80 font-medium"
                                                                >
                                                                    <span className="text-spice font-bold pr-1">
                                                                        {
                                                                            it.quantity
                                                                        }
                                                                        x
                                                                    </span>{' '}
                                                                    {it.name}
                                                                </p>
                                                            ),
                                                        )}
                                                    </div>

                                                    {/* Bottom stats summary */}
                                                    <div className="text-[10px] text-charcoal/55 flex items-center space-x-2.5">
                                                        <span>
                                                            Items:{' '}
                                                            <strong>
                                                                {
                                                                    order.totalQuantity
                                                                }
                                                            </strong>
                                                        </span>
                                                        <span>•</span>
                                                        <span className="text-xs text-charcoal font-bold bg-white/60 px-2 py-0.5 rounded-md border border-charcoal/5">
                                                            Payout:{' '}
                                                            <span className="text-sm text-charcoal font-extrabold font-display">
                                                                ₹{order.price}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Actions or Status Labels */}
                                            <div className="w-full sm:w-auto shrink-0 flex sm:flex-col items-end gap-2.5">
                                                {order.status === 'pending' ? (
                                                    <div className="flex sm:flex-row gap-2 w-full justify-end">
                                                        <button
                                                            disabled={!isOpen}
                                                            onClick={() =>
                                                                handleRejectOrder(
                                                                    order.id,
                                                                )
                                                            }
                                                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 select-none ${
                                                                isOpen
                                                                    ? 'text-charcoal/60 hover:text-spice hover:bg-spice/10 border border-charcoal/15 hover:border-spice/25 cursor-pointer'
                                                                    : 'text-charcoal/30 bg-charcoal/5 border border-charcoal/10 cursor-not-allowed opacity-50'
                                                            }`}
                                                            title={!isOpen ? 'Store is closed' : ''}
                                                        >
                                                            <svg
                                                                className="w-3.5 h-3.5"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                    d="M6 18L18 6M6 6l12 12"
                                                                />
                                                            </svg>
                                                            <span>Reject</span>
                                                        </button>
                                                        <button
                                                            disabled={!isOpen}
                                                            onClick={() =>
                                                                handleAcceptOrder(
                                                                    order.id,
                                                                )
                                                            }
                                                            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 select-none ${
                                                                isOpen
                                                                    ? 'text-white bg-spice hover:bg-[#c2502c] shadow-[0_3px_8px_rgba(224,101,58,0.2)] cursor-pointer'
                                                                    : 'text-charcoal/30 bg-charcoal/10 cursor-not-allowed opacity-50'
                                                            }`}
                                                            title={!isOpen ? 'Store is closed' : ''}
                                                        >
                                                            {isOpen ? (
                                                                <svg
                                                                    className="w-3.5 h-3.5"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                        d="M5 13l4 4L19 7"
                                                                    />
                                                                </svg>
                                                            ) : (
                                                                <svg
                                                                    className="w-3.5 h-3.5 text-charcoal/30"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                                    />
                                                                </svg>
                                                            )}
                                                            <span>Accept</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs px-3.5 py-1.5 rounded-full select-none font-body">
                                                        {order.status ===
                                                        'accepted' ? (
                                                            <div className="text-leaf bg-leaf/10 border border-leaf/20 flex items-center gap-1 px-3.5 py-1 rounded-full shadow-inner">
                                                                <svg
                                                                    className="w-3.5 h-3.5"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                        d="M5 13l4 4L19 7"
                                                                    />
                                                                </svg>
                                                                <span>
                                                                    Accepted
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-charcoal/50 bg-charcoal/5 border border-charcoal/10 flex items-center gap-1 px-3.5 py-1 rounded-full">
                                                                <svg
                                                                    className="w-3.5 h-3.5"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                        d="M6 18L18 6M6 6l12 12"
                                                                    />
                                                                </svg>
                                                                <span>
                                                                    Rejected
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ==========================================
                3. UPLOAD MENU FORM MODAL (Multiple Tiers & Add-ons)
               ========================================== */}
            {showMenuModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-md transition-opacity duration-300"
                    onClick={() => setShowMenuModal(false)}
                >
                    <div
                        className="bg-white/95 border border-white/30 shadow-[0_24px_70px_rgba(43,33,24,0.3)] rounded-[32px] w-full max-w-lg overflow-hidden transform transition-all duration-300 scale-100 flex flex-col animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Dark Graphic Header */}
                        <div className="bg-gradient-to-br from-[#1F1710] to-[#2E2218] p-6 text-cream relative select-none">
                            <img
                                src={tiffinBg}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity pointer-events-none"
                            />
                            <div className="relative z-10">
                                <h3 className="font-display text-xl md:text-2xl font-bold">
                                    Configure Culinary Pitch
                                </h3>
                                <p className="text-xs text-cream/60 mt-1">
                                    Specify tiers, add-ons, pricing, and stock
                                    capacities for today's session. The session
                                    (Lunch/Dinner) is detected automatically
                                    based on the current time.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowMenuModal(false)}
                                className="absolute right-5 top-5 text-cream/70 hover:text-white transition-colors z-20"
                            >
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
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body / Form */}
                        <form
                            onSubmit={handleFormSubmit}
                            className="p-6 space-y-5 overflow-y-auto max-h-[72vh] bg-cream/10 custom-scrollbar"
                        >
                            {/* Validation Errors banner */}
                            {formError && (
                                <div className="p-3 rounded-2xl bg-spice/15 border border-spice/20 text-spice text-xs flex items-start space-x-2 font-semibold animate-pulse">
                                    <svg
                                        className="w-4 h-4 shrink-0 mt-0.5"
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
                                    <span>{formError}</span>
                                </div>
                            )}

                            {/* Session selector toggle */}
                            <div>
                                <label className="text-[10px] text-charcoal/50 font-bold uppercase tracking-wider block mb-2 font-body">
                                    Active Session
                                </label>
                                <div className="flex bg-charcoal/5 p-1 rounded-xl border border-charcoal/10 w-60 relative select-none">
                                    {(['Lunch', 'Dinner'] as const).map(
                                        (session) => (
                                            <button
                                                key={session}
                                                type="button"
                                                onClick={() =>
                                                    setFormSession(session)
                                                }
                                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                                                    formSession === session
                                                        ? 'bg-spice text-white shadow-sm'
                                                        : 'text-charcoal/50 hover:text-charcoal'
                                                }`}
                                            >
                                                {session}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>

                            {/* Repeatable Pricing Tiers */}
                            <div className="space-y-4">
                                <label className="text-[10px] text-charcoal/50 font-bold uppercase tracking-wider block font-body">
                                    Pricing Tiers (At least 1 required)
                                </label>

                                {formTiers.map((tier, index) => (
                                    <div
                                        key={index}
                                        className="bg-[#FBF4EC]/30 border border-charcoal/15 rounded-[24px] p-4 relative space-y-3.5 shadow-inner"
                                    >
                                        {/* Tier Row Header & Remove button */}
                                        <div className="flex justify-between items-center select-none">
                                            <span className="text-xs font-bold text-spice/80 uppercase tracking-widest font-body">
                                                Tier #{index + 1}
                                            </span>
                                            {formTiers.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeTierRow(index)
                                                    }
                                                    className="w-6 h-6 rounded-full hover:bg-charcoal/5 flex items-center justify-center text-charcoal/45 hover:text-spice transition-colors"
                                                    title="Remove this tier"
                                                >
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
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        {/* Tier Name input with floating label style */}
                                        <div className="relative w-full group">
                                            <input
                                                type="text"
                                                value={tier.name}
                                                onChange={(e) => {
                                                    const updated = [
                                                        ...formTiers,
                                                    ];
                                                    updated[index].name =
                                                        e.target.value;
                                                    setFormTiers(updated);
                                                }}
                                                onFocus={() =>
                                                    setFocusedField(
                                                        `tier-${index}-name`,
                                                    )
                                                }
                                                onBlur={() =>
                                                    setFocusedField(null)
                                                }
                                                className="w-full bg-[#FBF4EC]/70 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-spice focus:ring-spice/20 transition-all font-body select-text placeholder-transparent focus:placeholder-charcoal/30"
                                                placeholder="e.g. Chapati-Bhaji Deluxe"
                                            />
                                            <label
                                                className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                                                    focusedField ===
                                                        `tier-${index}-name` ||
                                                    tier.name !== ''
                                                        ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-spice'
                                                        : 'top-4 text-sm text-charcoal/60'
                                                }`}
                                            >
                                                Tier Name
                                            </label>
                                        </div>

                                        {/* Tag-style items input per tier */}
                                        <div>
                                            <div className="border border-charcoal/15 focus-within:border-spice focus-within:ring-2 focus-within:ring-spice/20 rounded-2xl p-3 bg-[#FBF4EC]/50 transition-all min-h-[80px] flex flex-wrap gap-2 items-start content-start">
                                                {tier.items.map(
                                                    (item, tagIdx) => (
                                                        <span
                                                            key={tagIdx}
                                                            className="px-2.5 py-1 rounded-xl bg-spice text-white text-xs font-bold flex items-center space-x-1 hover:bg-spice/90 transition-colors shadow-sm select-none"
                                                        >
                                                            <span>{item}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveTierTag(
                                                                        index,
                                                                        tagIdx,
                                                                    )
                                                                }
                                                                className="hover:bg-white/20 rounded-full p-0.5 focus:outline-none transition-colors"
                                                            >
                                                                <svg
                                                                    className="w-3 h-3"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </span>
                                                    ),
                                                )}
                                                <input
                                                    type="text"
                                                    value={tier.itemInput}
                                                    onChange={(e) => {
                                                        const updated = [
                                                            ...formTiers,
                                                        ];
                                                        updated[
                                                            index
                                                        ].itemInput =
                                                            e.target.value;
                                                        setFormTiers(updated);
                                                    }}
                                                    onKeyDown={(e) =>
                                                        handleTierKeyDown(
                                                            index,
                                                            e,
                                                        )
                                                    }
                                                    placeholder={
                                                        tier.items.length === 0
                                                            ? 'Type item & press Enter (e.g. Chapati)'
                                                            : 'Add more...'
                                                    }
                                                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xs text-charcoal min-w-[120px] py-1 select-text"
                                                />
                                            </div>
                                        </div>

                                        {/* Price & Max Capacity grid inside tier card */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="relative w-full group">
                                                <input
                                                    type="number"
                                                    value={tier.price}
                                                    onChange={(e) => {
                                                        const updated = [
                                                            ...formTiers,
                                                        ];
                                                        updated[index].price =
                                                            e.target.value ===
                                                            ''
                                                                ? ''
                                                                : Number(
                                                                      e.target
                                                                          .value,
                                                                  );
                                                        setFormTiers(updated);
                                                    }}
                                                    onFocus={() =>
                                                        setFocusedField(
                                                            `tier-${index}-price`,
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        setFocusedField(null)
                                                    }
                                                    className="w-full bg-[#FBF4EC]/70 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-spice focus:ring-spice/20 transition-all font-body select-text placeholder-transparent focus:placeholder-charcoal/30"
                                                    placeholder="Price (₹)"
                                                />
                                                <label
                                                    className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                                                        focusedField ===
                                                            `tier-${index}-price` ||
                                                        tier.price !== ''
                                                            ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-spice'
                                                            : 'top-4 text-sm text-charcoal/60'
                                                    }`}
                                                >
                                                    Price (₹)
                                                </label>
                                            </div>

                                            <div className="relative w-full group">
                                                <input
                                                    type="number"
                                                    value={tier.maxQuantity}
                                                    onChange={(e) => {
                                                        const updated = [
                                                            ...formTiers,
                                                        ];
                                                        updated[
                                                            index
                                                        ].maxQuantity =
                                                            e.target.value ===
                                                            ''
                                                                ? ''
                                                                : Number(
                                                                      e.target
                                                                          .value,
                                                                  );
                                                        setFormTiers(updated);
                                                    }}
                                                    onFocus={() =>
                                                        setFocusedField(
                                                            `tier-${index}-max`,
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        setFocusedField(null)
                                                    }
                                                    className="w-full bg-[#FBF4EC]/70 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-spice focus:ring-spice/20 transition-all font-body select-text placeholder-transparent focus:placeholder-charcoal/30"
                                                    placeholder="Max Capacity"
                                                />
                                                <label
                                                    className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                                                        focusedField ===
                                                            `tier-${index}-max` ||
                                                        tier.maxQuantity !== ''
                                                            ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-spice'
                                                            : 'top-4 text-sm text-charcoal/60'
                                                    }`}
                                                >
                                                    Max Capacity
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* dashed "+ Add Another Tier" button */}
                                <button
                                    type="button"
                                    onClick={addTierRow}
                                    className="w-full py-3 border-2 border-dashed border-charcoal/20 hover:border-spice/40 text-charcoal/50 hover:text-spice rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 select-none"
                                >
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
                                            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span>+ Add Another Tier</span>
                                </button>
                            </div>

                            {/* Repeatable Add-ons Section */}
                            <div className="space-y-3 pt-2">
                                <label className="text-[10px] text-charcoal/50 font-bold uppercase tracking-wider block font-body">
                                    Add-ons (Optional)
                                </label>

                                {formAddOns.map((addOn, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 animate-scale-up"
                                    >
                                        {/* Add-on Name input */}
                                        <div className="relative flex-1 group">
                                            <input
                                                type="text"
                                                value={addOn.name}
                                                onChange={(e) =>
                                                    updateAddOn(
                                                        index,
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                onFocus={() =>
                                                    setFocusedField(
                                                        `addon-${index}-name`,
                                                    )
                                                }
                                                onBlur={() =>
                                                    setFocusedField(null)
                                                }
                                                className="w-full bg-[#FBF4EC]/60 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-spice focus:ring-spice/20 transition-all font-body select-text placeholder-transparent focus:placeholder-charcoal/30"
                                                placeholder="e.g. Extra Chapati"
                                            />
                                            <label
                                                className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                                                    focusedField ===
                                                        `addon-${index}-name` ||
                                                    addOn.name !== ''
                                                        ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-spice'
                                                        : 'top-4 text-sm text-charcoal/60'
                                                }`}
                                            >
                                                Add-on Name
                                            </label>
                                        </div>

                                        {/* Add-on Price input */}
                                        <div className="relative w-24 group">
                                            <input
                                                type="number"
                                                value={addOn.price}
                                                onChange={(e) =>
                                                    updateAddOn(
                                                        index,
                                                        'price',
                                                        e.target.value === ''
                                                            ? ''
                                                            : Number(
                                                                  e.target
                                                                      .value,
                                                              ),
                                                    )
                                                }
                                                onFocus={() =>
                                                    setFocusedField(
                                                        `addon-${index}-price`,
                                                    )
                                                }
                                                onBlur={() =>
                                                    setFocusedField(null)
                                                }
                                                className="w-full bg-[#FBF4EC]/60 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-spice focus:ring-spice/20 transition-all font-body select-text placeholder-transparent focus:placeholder-charcoal/30"
                                                placeholder="10"
                                            />
                                            <label
                                                className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                                                    focusedField ===
                                                        `addon-${index}-price` ||
                                                    addOn.price !== ''
                                                        ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-spice'
                                                        : 'top-4 text-sm text-charcoal/60'
                                                }`}
                                            >
                                                Price (₹)
                                            </label>
                                        </div>

                                        {/* Remove Add-on button */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeAddOnRow(index)
                                            }
                                            className="p-3 bg-charcoal/5 hover:bg-spice/15 border border-charcoal/10 hover:border-spice/25 text-charcoal/60 hover:text-spice rounded-xl transition-all"
                                            title="Remove add-on"
                                        >
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
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addAddOnRow}
                                    className="px-4 py-2.5 border border-charcoal/15 hover:border-spice/30 text-charcoal/60 hover:text-spice rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 select-none"
                                >
                                    <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2.5}
                                            d="M12 4v16m8-8H4"
                                        />
                                    </svg>
                                    <span>+ Add Add-on</span>
                                </button>
                            </div>

                            {/* Description textarea */}
                            <div className="relative w-full group">
                                <textarea
                                    value={formDesc}
                                    onChange={(e) =>
                                        setFormDesc(e.target.value)
                                    }
                                    onFocus={() => setDescFocused(true)}
                                    onBlur={() => setDescFocused(false)}
                                    rows={3}
                                    className="w-full bg-[#FBF4EC]/80 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-spice focus:ring-spice/20 transition-all leading-relaxed font-body select-text placeholder-transparent focus:placeholder-charcoal/30"
                                    placeholder="Menu Description"
                                />
                                <label
                                    className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                                        descFocused || formDesc.length > 0
                                            ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-spice'
                                            : 'top-4 text-sm text-charcoal/60'
                                    }`}
                                >
                                    Menu Description
                                </label>
                            </div>

                            {/* Form Actions */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowMenuModal(false)}
                                    className="flex-1 py-3.5 rounded-2xl border border-charcoal/15 text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5 font-bold text-sm transition-all select-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formSubmitting}
                                    className="flex-1 py-3.5 rounded-2xl bg-spice hover:bg-spice/90 text-white font-bold text-sm shadow-[0_8px_25px_rgba(224,101,58,0.25)] transition-all flex items-center justify-center space-x-2 select-none disabled:opacity-50"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    <span>
                                        {formSubmitting
                                            ? 'Uploading...'
                                            : 'Upload & Launch'}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==========================================
                4. PROFILE SETTINGS MODAL
               ========================================== */}
            {showProfileModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-md transition-opacity duration-300"
                    onClick={() => setShowProfileModal(false)}
                >
                    <div
                        className="bg-white/95 border border-white/30 shadow-[0_24px_70px_rgba(43,33,24,0.3)] rounded-[32px] w-full max-w-lg overflow-hidden transform transition-all duration-300 scale-100 flex flex-col animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Dark Graphic Header */}
                        <div className="bg-gradient-to-br from-[#1F1710] to-[#2E2218] p-6 text-cream relative select-none">
                            <img
                                src={tiffinBg}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity pointer-events-none"
                            />
                            <div className="relative z-10">
                                <h3 className="font-display text-xl md:text-2xl font-bold">
                                    Profile Settings
                                </h3>
                                <p className="text-xs text-cream/60 mt-1">
                                    Update your personal information, business
                                    details, and service location settings.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="absolute right-5 top-5 text-cream/70 hover:text-white transition-colors z-20"
                            >
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
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body / Form */}
                        <form
                            onSubmit={handleProfileSubmit}
                            className="p-6 space-y-4 overflow-y-auto max-h-[72vh] bg-cream/10 custom-scrollbar"
                        >
                            {/* Validation Errors banner */}
                            {profileError && (
                                <div className="p-3 rounded-2xl bg-spice/15 border border-spice/20 text-spice text-xs flex items-start space-x-2 font-semibold animate-pulse">
                                    <svg
                                        className="w-4 h-4 shrink-0 mt-0.5"
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
                                    <span>{profileError}</span>
                                </div>
                            )}

                            {/* Section: Personal Details */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] text-spice font-bold uppercase tracking-wider block font-body border-b border-charcoal/5 pb-1">
                                    Personal Details
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative w-full group">
                                        <input
                                            type="text"
                                            value={formFirstname}
                                            onChange={(e) =>
                                                setFormFirstname(e.target.value)
                                            }
                                            onFocus={() =>
                                                setFocusedField(
                                                    'profile-firstname',
                                                )
                                            }
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full bg-[#FBF4EC]/70 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-spice focus:ring-spice/20 transition-all font-body select-text placeholder-transparent focus:placeholder-charcoal/30"
                                            placeholder="First Name"
                                        />
                                        <label
                                            className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                                                focusedField ===
                                                    'profile-firstname' ||
                                                formFirstname !== ''
                                                    ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-spice'
                                                    : 'top-4 text-sm text-charcoal/60'
                                            }`}
                                        >
                                            First Name
                                        </label>
                                    </div>
                                    <div className="relative w-full group">
                                        <input
                                            type="text"
                                            value={formLastname}
                                            onChange={(e) =>
                                                setFormLastname(e.target.value)
                                            }
                                            onFocus={() =>
                                                setFocusedField(
                                                    'profile-lastname',
                                                )
                                            }
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full bg-[#FBF4EC]/70 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-spice focus:ring-spice/20 transition-all font-body select-text placeholder-transparent focus:placeholder-charcoal/30"
                                            placeholder="Last Name"
                                        />
                                        <label
                                            className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                                                focusedField ===
                                                    'profile-lastname' ||
                                                formLastname !== ''
                                                    ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-spice'
                                                    : 'top-4 text-sm text-charcoal/60'
                                            }`}
                                        >
                                            Last Name
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="relative w-full group">
                                        <input
                                            type="email"
                                            value={formEmail}
                                            onChange={(e) =>
                                                setFormEmail(e.target.value)
                                            }
                                            onFocus={() =>
                                                setFocusedField('profile-email')
                                            }
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full bg-[#FBF4EC]/70 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-spice focus:ring-spice/20 transition-all font-body select-text placeholder-transparent focus:placeholder-charcoal/30"
                                            placeholder="Email Address"
                                        />
                                        <label
                                            className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                                                focusedField ===
                                                    'profile-email' ||
                                                formEmail !== ''
                                                    ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-spice'
                                                    : 'top-4 text-sm text-charcoal/60'
                                            }`}
                                        >
                                            Email Address
                                        </label>
                                    </div>
                                    <div className="relative w-full group">
                                        <input
                                            type="text"
                                            value={formPhone}
                                            onChange={(e) =>
                                                setFormPhone(e.target.value)
                                            }
                                            onFocus={() =>
                                                setFocusedField('profile-phone')
                                            }
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full bg-[#FBF4EC]/70 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-spice focus:ring-spice/20 transition-all font-body select-text placeholder-transparent focus:placeholder-charcoal/30"
                                            placeholder="Phone Number"
                                        />
                                        <label
                                            className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                                                focusedField ===
                                                    'profile-phone' ||
                                                formPhone !== ''
                                                    ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-spice'
                                                    : 'top-4 text-sm text-charcoal/60'
                                            }`}
                                        >
                                            Phone Number
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Business Details */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-[10px] text-spice font-bold uppercase tracking-wider block font-body border-b border-charcoal/5 pb-1">
                                    Business Details
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="relative w-full group sm:col-span-2">
                                        <input
                                            type="text"
                                            value={formBusinessName}
                                            onChange={(e) =>
                                                setFormBusinessName(
                                                    e.target.value,
                                                )
                                            }
                                            onFocus={() =>
                                                setFocusedField(
                                                    'profile-bizname',
                                                )
                                            }
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full bg-[#FBF4EC]/70 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-spice focus:ring-spice/20 transition-all font-body select-text placeholder-transparent focus:placeholder-charcoal/30"
                                            placeholder="Business Name"
                                        />
                                        <label
                                            className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                                                focusedField ===
                                                    'profile-bizname' ||
                                                formBusinessName !== ''
                                                    ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-spice'
                                                    : 'top-4 text-sm text-charcoal/60'
                                            }`}
                                        >
                                            Business Name
                                        </label>
                                    </div>
                                    <div className="relative w-full group">
                                        <input
                                            type="number"
                                            value={formRadius}
                                            onChange={(e) =>
                                                setFormRadius(
                                                    e.target.value === ''
                                                        ? ''
                                                        : Number(
                                                              e.target.value,
                                                          ),
                                                )
                                            }
                                            onFocus={() =>
                                                setFocusedField(
                                                    'profile-radius',
                                                )
                                            }
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full bg-[#FBF4EC]/70 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-spice focus:ring-spice/20 transition-all font-body select-text placeholder-transparent focus:placeholder-charcoal/30"
                                            placeholder="Delivery Radius (km)"
                                        />
                                        <label
                                            className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                                                focusedField ===
                                                    'profile-radius' ||
                                                formRadius !== ''
                                                    ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-spice'
                                                    : 'top-4 text-sm text-charcoal/60'
                                            }`}
                                        >
                                            Radius (km)
                                        </label>
                                    </div>
                                </div>

                                <div className="relative w-full group">
                                    <input
                                        type="text"
                                        value={formAddress}
                                        onChange={(e) =>
                                            setFormAddress(e.target.value)
                                        }
                                        onFocus={() =>
                                            setFocusedField('profile-address')
                                        }
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full bg-[#FBF4EC]/70 border border-charcoal/15 text-charcoal rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-spice focus:ring-spice/20 transition-all font-body select-text placeholder-transparent focus:placeholder-charcoal/30"
                                        placeholder="Business Address"
                                    />
                                    <label
                                        className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${
                                            focusedField ===
                                                'profile-address' ||
                                            formAddress !== ''
                                                ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-spice'
                                                : 'top-4 text-sm text-charcoal/60'
                                        }`}
                                    >
                                        Business Address
                                    </label>
                                </div>

                                <MapPicker
                                    lat={formLat === '' ? 0 : formLat}
                                    lng={formLng === '' ? 0 : formLng}
                                    onChange={(lat, lng) => {
                                        setFormLat(lat);
                                        setFormLng(lng);
                                    }}
                                    address={formAddress}
                                />
                            </div>

                            {/* Form Actions */}
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowProfileModal(false)}
                                    className="flex-1 py-3.5 rounded-2xl border border-charcoal/15 text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5 font-bold text-sm transition-all select-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={profileSubmitting}
                                    className="flex-1 py-3.5 rounded-2xl bg-spice hover:bg-spice/90 text-white font-bold text-sm shadow-[0_8px_25px_rgba(224,101,58,0.25)] transition-all flex items-center justify-center space-x-2 select-none disabled:opacity-50"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    <span>
                                        {profileSubmitting
                                            ? 'Saving...'
                                            : 'Save Settings'}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
