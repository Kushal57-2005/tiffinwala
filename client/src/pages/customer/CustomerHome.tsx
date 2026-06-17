/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../utils/api';
import tiffinBg from '../../assets/slate_spices_bg.png';

// ==========================================
// TYPES & PROP INTERFACES
// ==========================================

export interface ITier {
    name: string;
    items: string[];
    price: number;
}

export interface IAddOn {
    name: string;
    price: number;
}

export interface Vendor {
    id: string;
    businessName: string;
    ownerName: string;
    ownerPhone?: string;
    address?: string;
    rating: number;
    reviewsCount: number;
    distanceKm: number;
    isOpen: boolean;
    deliveryRadiusKm: number;
    tiers: ITier[];
    addOns: IAddOn[];
    description: string;
}

export interface CustomerHomeProps {
    initialCustomerName?: string;
    initialWalletBalance?: number;
}

// ==========================================
// DUMMY DATA
// ==========================================

const SAMPLE_MY_VENDORS = [
    {
        id: 'VND-001',
        businessName: 'Annapurna Rasoi',
        rating: 4.8,
        initials: 'AR',
    },
    {
        id: 'VND-002',
        businessName: 'Maa Ka Swaad',
        rating: 4.9,
        initials: 'MS',
    },
    {
        id: 'VND-003',
        businessName: 'Shree Tiffin Services',
        rating: 4.7,
        initials: 'ST',
    },
];

// Helper to map backend vendor object to frontend Vendor interface
const mapBackendVendor = (v: any): Vendor => {
    const ownerName = v.userInfo
        ? `${v.userInfo.firstName} ${v.userInfo.lastName}`
        : v.userId
          ? `${v.userId.firstName} ${v.userId.lastName}`
          : 'Unknown Vendor';

    const distanceKm =
        typeof v.distanceInMeters === 'number'
            ? parseFloat((v.distanceInMeters / 1000).toFixed(1))
            : 0;
    console.log('RAW VENDOR:', v);

    return {
        id: v._id,
        businessName: v.businessName || 'Tiffin Kitchen',
        ownerName: ownerName,
        ownerPhone: v.owner?.phone || v.userInfo?.phone || '',
        address: v.location?.address || '',
        rating:
            typeof v.averageRating === 'number' && v.averageRating > 0
                ? v.averageRating
                : 4.5,
        reviewsCount: typeof v.totalRatings === 'number' ? v.totalRatings : 0,
        distanceKm: distanceKm,
        isOpen: v.isOpen !== undefined ? v.isOpen : true,
        deliveryRadiusKm: v.deliveryRadiuskm || 5,
        tiers: v.tiers || [],
        addOns: v.addOns || [],
        description:
            v.description ||
            'Homely and hygienic meals delivered straight to your doorstep.',
    };
};

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

    useEffect(() => {
        if ((window as any).L) {
            setIsLoaded(true);
            return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity =
            'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.onload = () => setIsLoaded(true);
        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        if (!isLoaded || !mapRef.current) return;
        const L = (window as any).L;
        if (!L) return;
        const initialLat = lat || 19.076;
        const initialLng = lng || 72.8777;
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
            markerInstance.current = null;
        }
        const map = L.map(mapRef.current, { zoomControl: true }).setView(
            [initialLat, initialLng],
            13,
        );
        mapInstance.current = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        const customIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `<div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center">
                <div style="position:absolute;width:14px;height:14px;background:rgba(92,122,82,0.35);border-radius:50%;animation:ripple-ring 1.5s infinite ease-out;top:9px;left:9px"></div>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style="filter:drop-shadow(0px 3px 4px rgba(0,0,0,0.25));position:relative;z-index:10">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#5C7A52"/>
                </svg>
            </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        });
        const marker = L.marker([initialLat, initialLng], {
            draggable: true,
            icon: customIcon,
        }).addTo(map);
        markerInstance.current = marker;
        marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onChange(pos.lat, pos.lng);
        });
        map.on('click', (e: any) => {
            marker.setLatLng(e.latlng);
            onChange(e.latlng.lat, e.latlng.lng);
        });
        setTimeout(() => map.invalidateSize(), 350);
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerInstance.current = null;
            }
        };
    }, [isLoaded]);

    useEffect(() => {
        if (mapInstance.current && markerInstance.current) {
            const cur = markerInstance.current.getLatLng();
            const tLat = lat || 19.076;
            const tLng = lng || 72.8777;
            if (
                Math.abs(cur.lat - tLat) > 0.0001 ||
                Math.abs(cur.lng - tLng) > 0.0001
            ) {
                markerInstance.current.setLatLng([tLat, tLng]);
                mapInstance.current.setView(
                    [tLat, tLng],
                    mapInstance.current.getZoom(),
                );
            }
        }
    }, [lat, lng]);

    const locateAddress = async () => {
        if (!address || !address.trim()) return;
        setGeocoding(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
            );
            const data = await res.json();
            if (data && data.length > 0) {
                onChange(Number(data[0].lat), Number(data[0].lon));
            } else {
                alert(
                    'Could not locate address. Please position pin manually.',
                );
            }
        } catch (err) {
            console.error('Geocoding error:', err);
        } finally {
            setGeocoding(false);
        }
    };

    return (
        <div className="space-y-2 select-none">
            <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#2B2118]/50 font-bold uppercase tracking-wider font-body">
                    Delivery Location Pin
                </span>
                {address && address.trim().length > 3 && (
                    <button
                        type="button"
                        onClick={locateAddress}
                        disabled={geocoding}
                        className="text-[10px] text-[#5C7A52] hover:underline font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                        {geocoding ? 'Locating...' : 'Locate Address on Map'}
                    </button>
                )}
            </div>
            <div
                ref={mapRef}
                className="w-full h-48 rounded-2xl border border-[#2B2118]/15 overflow-hidden shadow-inner bg-[#2B2118]/5 z-0"
            />
            <div className="flex justify-between text-[10px] text-[#2B2118]/50 font-semibold font-body px-1">
                <span>Lat: {lat ? lat.toFixed(6) : '0.000000'}</span>
                <span>Lng: {lng ? lng.toFixed(6) : '0.000000'}</span>
                <span className="text-[#5C7A52] font-bold">
                    Drag pin or click map
                </span>
            </div>
        </div>
    );
}

export default function CustomerHome({
    initialCustomerName = '',
    initialWalletBalance = 0,
}: CustomerHomeProps) {
    const navigate = useNavigate();
    const storeLogout = useAuthStore((state) => state.logout);

    const handleLogout = async () => {
        try {
            await storeLogout();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
            navigate('/login');
        }
    };

    // ==========================================
    // LOCAL STATES
    // ==========================================
    const [customerName, setCustomerName] = useState(initialCustomerName);
    const [walletBalance, setWalletBalance] = useState(initialWalletBalance);
    const [profileLoading, setProfileLoading] = useState(true);
    const [friendProfiles, setFriendProfiles] = useState<any[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [menuLoading, setMenuLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [customerAddress, setCustomerAddress] = useState('');
    const [settingLocation, setSettingLocation] = useState(false);
    const [nearbyReloadKey, setNearbyReloadKey] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    // Modal states
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Order builder states inside modal
    const [orderQuantities, setOrderQuantities] = useState<
        Record<string, number>
    >({});
    const [selectedFriends, setSelectedFriends] = useState<string[]>([
        'Myself',
    ]);
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'token'>(
        'wallet',
    );
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderSubmitting, setOrderSubmitting] = useState(false);

    // Dynamic states for interactive demonstration
    const [simulateEmptyMyVendors, setSimulateEmptyMyVendors] = useState(false);
    const [simulateEmptyNearby, setSimulateEmptyNearby] = useState(false);

    // Parallax mouse state
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Notification states
    const [notificationCount, setNotificationCount] = useState(2);
    const [showNotifications, setShowNotifications] = useState(false);

    // Profile modal states
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileSubmitting, setProfileSubmitting] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Profile form fields
    const [formFirstname, setFormFirstname] = useState('');
    const [formLastname, setFormLastname] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formAddress, setFormAddress] = useState('');
    const [formLat, setFormLat] = useState<number | ''>('');
    const [formLng, setFormLng] = useState<number | ''>('');

    // Profile Modal tab state
    const [modalTab, setModalTab] = useState<'profile' | 'friends'>('profile');

    // Friends tab state
    const [friends, setFriends] = useState<
        { _id: string; name: string; phone?: string; nickname?: string }[]
    >([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [friendsError, setFriendsError] = useState('');

    // Friend inline form state
    const [friendFormMode, setFriendFormMode] = useState<'add' | 'edit' | null>(
        null,
    );
    const [editingFriendId, setEditingFriendId] = useState<string | null>(null);
    const [friendFormName, setFriendFormName] = useState('');
    const [friendFormNickname, setFriendFormNickname] = useState('');
    const [friendFormPhone, setFriendFormPhone] = useState('');
    const [friendFormSubmitting, setFriendFormSubmitting] = useState(false);
    const [friendFormError, setFriendFormError] = useState('');
    const [friendFocused, setFriendFocused] = useState<string | null>(null);

    // Delete confirmation state
    const [deletingFriendId, setDeletingFriendId] = useState<string | null>(
        null,
    );

    // Track cursor movement for parallax
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const x = (clientX - window.innerWidth / 2) / 45;
        const y = (clientY - window.innerHeight / 2) / 45;
        setMousePos({ x, y });
    };

    // Greeting state calculated lazily
    const [greeting] = useState(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    });

    const formattedDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    // Helper for initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Helper to determine active lunch/dinner session dynamically
    const getCurrentTimeSession = (): 'lunch' | 'dinner' => {
        const hour = new Date().getHours();
        return hour >= 15 ? 'dinner' : 'lunch';
    };

    // Load customer profile details
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setProfileLoading(true);
                const res = await api.get('/customer/profile');
                if (res.data.success && res.data.data) {
                    const profile = res.data.data;
                    const fullName = profile.userId
                        ? `${profile.userId.firstName} ${profile.userId.lastName}`
                        : 'Customer';
                    setCustomerName(fullName);
                    setWalletBalance(profile.walletBalance || 0);
                    setFriendProfiles(profile.friendProfiles || []);
                    // Pre-populate friends list from profile response
                    if (profile.friendProfiles?.length > 0) {
                        setFriends(profile.friendProfiles);
                    }
                    setCustomerAddress(profile.location?.address || '');
                    // Pre-populate profile form
                    setFormFirstname(profile.userId?.firstName || '');
                    setFormLastname(profile.userId?.lastName || '');
                    setFormEmail(profile.userId?.email || '');
                    setFormPhone(profile.userId?.phone || '');
                    setFormAddress(profile.location?.address || '');
                    setFormLat(profile.location?.coordinates?.[1] ?? '');
                    setFormLng(profile.location?.coordinates?.[0] ?? '');
                }
            } catch (err) {
                console.error('Error fetching customer profile:', err);
            } finally {
                setProfileLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // Fetch friends when modal opens on friends tab
    useEffect(() => {
        if (showProfileModal && modalTab === 'friends') {
            setFriendsLoading(true);
            setFriendsError('');
            api.get('/customer/friends')
                .then((r) =>
                    setFriends(
                        r.data.data?.friendProfiles || r.data.data || [],
                    ),
                )
                .catch(() =>
                    setFriendsError(
                        'Could not load friends. Please try again.',
                    ),
                )
                .finally(() => setFriendsLoading(false));
        }
    }, [showProfileModal, modalTab]);

    const handleSetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Your browser does not support location access.');
            return;
        }

        setSettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await api.patch('/customer/profile/location', {
                        address: customerAddress || 'Current location',
                        location: {
                            type: 'Point',
                            coordinates: [latitude, longitude],
                        },
                    });

                    if (res.data.success) {
                        setCustomerAddress(
                            res.data.data.location?.address ||
                                customerAddress ||
                                'Current location',
                        );
                        setLocationError(null);
                        setNearbyReloadKey((key) => key + 1);
                    }
                } catch (err: any) {
                    setLocationError(
                        err.response?.data?.message ||
                            'Failed to update location. Please try again.',
                    );
                } finally {
                    setSettingLocation(false);
                }
            },
            () => {
                setLocationError(
                    'Location permission was denied. Please allow location access and try again.',
                );
                setSettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    // Load nearby or search vendors with 400ms debounce
    useEffect(() => {
        if (!searchQuery) {
            const fetchNearby = async () => {
                try {
                    setLoading(true);
                    setLocationError(null);
                    const res = await api.get('/customer/vendors/nearby');
                    if (res.data.success) {
                        const mapped = res.data.data.map(mapBackendVendor);
                        setVendors(mapped);
                    }
                } catch (err: any) {
                    console.error('Error fetching nearby vendors:', err);
                    if (err.response?.status === 400) {
                        setLocationError(
                            err.response?.data?.message ||
                                'Please set your location first.',
                        );
                    } else {
                        setLocationError(
                            'Failed to load nearby vendors. Please check connection.',
                        );
                    }
                    setVendors([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchNearby();
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            try {
                setLoading(true);
                setLocationError(null);
                const res = await api.get(
                    `/customer/vendors/search?q=${encodeURIComponent(searchQuery)}`,
                );
                if (res.data.success) {
                    const mapped = res.data.data.map(mapBackendVendor);
                    setVendors(mapped);
                }
            } catch (err: any) {
                console.error('Error searching vendors:', err);
                setVendors([]);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, nearbyReloadKey]);

    // Toggle filter chip selection
    const toggleFilter = (filter: string) => {
        if (activeFilters.includes(filter)) {
            setActiveFilters(activeFilters.filter((f) => f !== filter));
        } else {
            setActiveFilters([...activeFilters, filter]);
        }
    };

    // Filtered vendors using the dynamic backend-loaded array
    const filteredVendors = vendors.filter((v) => {
        // Optional client-side secondary filter if query is active
        if (searchQuery) {
            const matchesQuery =
                v.businessName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                v.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                v.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesQuery) return false;
        }

        // Dynamic filters logic
        if (activeFilters.includes('Open Now') && !v.isOpen) return false;
        if (activeFilters.includes('Top Rated') && v.rating < 4.8) return false;
        if (activeFilters.includes('Within 2 km') && v.distanceKm > 2.0)
            return false;

        return true;
    });

    // Handle open details modal and fetch menu details + vendor profile
    const handleOpenDetails = async (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setShowDetailModal(true);
        setOrderSuccess(false);
        setOrderSubmitting(false);
        setSelectedFriends(['Myself']);
        setPaymentMethod('wallet');

        setOrderQuantities({});
        setMenuLoading(true);

        try {
            // Fetch vendor profile (address, phone, deliveryRadius) and today's menu in parallel
            const session = getCurrentTimeSession();
            const [detailRes, menuRes] = await Promise.allSettled([
                api.get(`/customer/vendors/${vendor.id}`),
                api.get(`/customer/vendors/${vendor.id}/menu?session=${session}`),
            ]);

            let updatedVendor = { ...vendor };

            // Merge vendor profile fields
            if (detailRes.status === 'fulfilled' && detailRes.value.data.success) {
                const d = detailRes.value.data.data;
                updatedVendor = {
                    ...updatedVendor,
                    ownerName: d.owner
                        ? `${d.owner.firstName} ${d.owner.lastName}`
                        : vendor.ownerName,
                    ownerPhone: d.owner?.phone || '',
                    address: d.location?.address || '',
                    deliveryRadiusKm: d.deliveryRadiuskm ?? vendor.deliveryRadiusKm,
                    isOpen: d.isOpen ?? vendor.isOpen,
                    rating:
                        typeof d.averageRating === 'number' && d.averageRating > 0
                            ? d.averageRating
                            : vendor.rating,
                    reviewsCount:
                        typeof d.totalRatings === 'number'
                            ? d.totalRatings
                            : vendor.reviewsCount,
                };
            }

            // Merge today's menu
            if (menuRes.status === 'fulfilled' && menuRes.value.data.success && menuRes.value.data.data) {
                const menuData = menuRes.value.data.data;
                updatedVendor = {
                    ...updatedVendor,
                    description: menuData.description || updatedVendor.description,
                    tiers:
                        menuData.tiers && menuData.tiers.length > 0
                            ? menuData.tiers
                            : updatedVendor.tiers,
                    addOns:
                        menuData.addOns && menuData.addOns.length > 0
                            ? menuData.addOns
                            : updatedVendor.addOns,
                };
            }

            setSelectedVendor(updatedVendor);

            // Re-populate quantities
            const initialQuants: Record<string, number> = {};
            updatedVendor.tiers.forEach((t) => {
                initialQuants[t.name] = 0;
            });
            updatedVendor.addOns.forEach((ad) => {
                initialQuants[ad.name] = 0;
            });
            if (updatedVendor.tiers.length > 0) {
                initialQuants[updatedVendor.tiers[0].name] = 1;
            }
            setOrderQuantities(initialQuants);
        } catch (err) {
            console.error('Error fetching vendor details:', err);
            // Fallback: keep current presets
            const initialQuants: Record<string, number> = {};
            vendor.tiers.forEach((t) => {
                initialQuants[t.name] = 0;
            });
            vendor.addOns.forEach((ad) => {
                initialQuants[ad.name] = 0;
            });
            if (vendor.tiers.length > 0) {
                initialQuants[vendor.tiers[0].name] = 1;
            }
            setOrderQuantities(initialQuants);
        } finally {
            setMenuLoading(false);
        }
    };

    // Calculate total order value
    const calculateOrderTotal = () => {
        if (!selectedVendor) return 0;
        let total = 0;
        selectedVendor.tiers.forEach((t) => {
            total += (orderQuantities[t.name] || 0) * t.price;
        });
        selectedVendor.addOns.forEach((ad) => {
            total += (orderQuantities[ad.name] || 0) * ad.price;
        });
        return total;
    };

    // Handle quantity steppers
    const updateQuantity = (key: string, delta: number) => {
        setOrderQuantities((prev) => {
            const current = prev[key] || 0;
            const newVal = Math.max(0, current + delta);
            return { ...prev, [key]: newVal };
        });
    };

    // Handle submitting simulated order
    const handleOrderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const total = calculateOrderTotal();
        if (total === 0) {
            alert('Please select at least one item to order.');
            return;
        }
        if (total > walletBalance && paymentMethod === 'wallet') {
            alert('Insufficient wallet balance. Please add money.');
            return;
        }

        setOrderSubmitting(true);
        setTimeout(() => {
            setOrderSubmitting(false);
            setOrderSuccess(true);
            // Deduct wallet balance if wallet payment
            if (paymentMethod === 'wallet') {
                setWalletBalance((prev) => Math.max(0, prev - total));
            }
            // Auto close modal after successful animation
            setTimeout(() => {
                setShowDetailModal(false);
                setSelectedVendor(null);
            }, 2000);
        }, 1500);
    };

    return (
        <>
            <div
                onMouseMove={handleMouseMove}
                className="min-h-screen bg-[#FBF4EC] font-body text-[#2B2118] pb-24 transition-all duration-300 relative overflow-hidden select-text"
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
                @keyframes float-fast {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(12deg); }
                }
                @keyframes float-reverse {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(18px) rotate(-6deg); }
                }
                @keyframes ripple-ring-green {
                    0% { transform: scale(0.7); opacity: 0.8; }
                    100% { transform: scale(2.4); opacity: 0; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.08; transform: scale(1); }
                    50% { opacity: 0.18; transform: scale(1.15); }
                }
                @keyframes float-sparkle {
                    0%, 100% { transform: translate(0px, 0px) scale(0.8); opacity: 0.2; }
                    50% { transform: translate(12px, -18px) scale(1.2); opacity: 0.6; }
                }
                .animate-scale-up { animation: scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-pulse-dot { animation: pulse-dot 2s infinite ease-in-out; }
                .floating-leaf { animation: float-slow 7s ease-in-out infinite; }
                .floating-anise { animation: float-medium 9s ease-in-out infinite; }
                .floating-cardamom { animation: float-slow 6s ease-in-out infinite; }
                .floating-clove { animation: float-medium 10s ease-in-out infinite; }
                .floating-chili { animation: float-reverse 9s ease-in-out infinite; }
                .floating-leaf-2 { animation: float-fast 6s ease-in-out infinite; }
                .pulse-glow-green { animation: pulse-glow 12s ease-in-out infinite; }
                .sparkle-slow { animation: float-sparkle 8s ease-in-out infinite; }
                .sparkle-fast { animation: float-sparkle 5s ease-in-out infinite; }
                .animate-ripple-green { animation: ripple-ring-green 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
                .animate-fade-in-up { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                /* Premium Scrollbar */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(92, 122, 82, 0.2);
                    border-radius: 9999px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(92, 122, 82, 0.4);
                }
            `}</style>

                {/* Background Texture Overlay */}
                <img
                    src={tiffinBg}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-[0.025] mix-blend-multiply pointer-events-none select-none z-0"
                />

                {/* Background Ambient Glows (Accentuated in Leaf Green #5C7A52) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[130px] bg-[#5C7A52]/10 pulse-glow-green transition-all duration-1000" />
                    <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full blur-[150px] bg-[#7E9C73]/10 pulse-glow-green transition-all duration-1000" />
                </div>

                {/* Floating Parallax Spices (Familiar from Vendor Home page, but themed around leaf accents) */}
                <div
                    style={{
                        transform: `translate3d(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px, 0)`,
                        transition: 'transform 0.15s ease-out',
                    }}
                    className="absolute top-[12%] left-[6%] floating-leaf opacity-[0.85] pointer-events-none z-10 hidden md:block"
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

                {/* Bay Leaf (floating-leaf-2) */}
                <div
                    style={{
                        transform: `translate3d(${mousePos.x * -0.7}px, ${mousePos.y * -0.7}px, 0)`,
                        transition: 'transform 0.15s ease-out',
                    }}
                    className="absolute top-[28%] right-[8%] floating-leaf-2 opacity-60 pointer-events-none z-10 hidden md:block"
                >
                    <svg width="40" height="50" viewBox="0 0 24 30" fill="none">
                        <path
                            d="M12 2C12 2 3 9 4 20C5 28 12 28 12 28C12 28 19 28 20 20C21 9 12 2 12 2Z"
                            fill="#5C7A52"
                            opacity="0.25"
                        />
                        <path
                            d="M12 2V28"
                            stroke="#5C7A52"
                            strokeWidth="0.8"
                            opacity="0.4"
                        />
                        <path
                            d="M12 10C9 12 7 15 6 19"
                            stroke="#5C7A52"
                            strokeWidth="0.5"
                            opacity="0.4"
                        />
                        <path
                            d="M12 14C15 16 17 19 18 23"
                            stroke="#5C7A52"
                            strokeWidth="0.5"
                            opacity="0.4"
                        />
                    </svg>
                </div>

                {/* Cardamom pod (floating-cardamom) */}
                <div
                    style={{
                        transform: `translate3d(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px, 0)`,
                        transition: 'transform 0.15s ease-out',
                    }}
                    className="absolute top-[42%] left-[4%] floating-cardamom opacity-80 pointer-events-none z-10 hidden md:block"
                >
                    <svg width="35" height="35" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 2C8 6 6 12 12 22C18 12 16 6 12 2Z"
                            fill="#7E9C73"
                            opacity="0.8"
                        />
                        <path
                            d="M12 2C10 6 9 12 12 22"
                            stroke="#5C7A52"
                            strokeWidth="0.8"
                        />
                        <path
                            d="M12 2C14 6 15 12 12 22"
                            stroke="#5C7A52"
                            strokeWidth="0.8"
                        />
                    </svg>
                </div>

                {/* Cinnamon bark stick (floating-chili) */}
                <div
                    style={{
                        transform: `translate3d(${mousePos.x * -0.5}px, ${mousePos.y * -0.5}px, 0)`,
                        transition: 'transform 0.15s ease-out',
                    }}
                    className="absolute top-[62%] right-[5%] floating-chili opacity-75 pointer-events-none z-10 hidden md:block"
                >
                    <svg width="50" height="25" viewBox="0 0 50 25" fill="none">
                        <path
                            d="M2 18C15 8 35 8 48 18"
                            stroke="#8C5B3E"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            opacity="0.75"
                        />
                        <path
                            d="M4 22C16 12 34 12 46 22"
                            stroke="#704328"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            opacity="0.65"
                        />
                    </svg>
                </div>

                {/* Star Anise (floating-anise) */}
                <div
                    style={{
                        transform: `translate3d(${mousePos.x * -0.6}px, ${mousePos.y * -0.6}px, 0)`,
                        transition: 'transform 0.15s ease-out',
                    }}
                    className="absolute bottom-[25%] right-[6%] floating-anise opacity-70 pointer-events-none z-10 hidden md:block"
                >
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L14 9H10L12 2Z" fill="#8C5B3E" />
                        <path d="M12 22L10 15H14L12 22Z" fill="#8C5B3E" />
                        <path d="M2 12L9 10V14L2 12Z" fill="#8C5B3E" />
                        <path d="M22 12L15 14V10L22 12Z" fill="#8C5B3E" />
                        <path
                            d="M5 5L10 10L9 11L4 6L5 5Z"
                            fill="#5C7A52"
                            opacity="0.4"
                        />
                        <path
                            d="M19 19L14 14L15 13L20 18L19 19Z"
                            fill="#5C7A52"
                            opacity="0.4"
                        />
                        <circle cx="12" cy="12" r="3" fill="#7E9C73" />
                    </svg>
                </div>

                {/* Clove (floating-clove) */}
                <div
                    style={{
                        transform: `translate3d(${mousePos.x * 0.6}px, ${mousePos.y * 0.6}px, 0)`,
                        transition: 'transform 0.15s ease-out',
                    }}
                    className="absolute bottom-[12%] left-[5%] floating-clove opacity-80 pointer-events-none z-10 hidden md:block"
                >
                    <svg width="30" height="40" viewBox="0 0 24 32" fill="none">
                        <path
                            d="M12 8V30"
                            stroke="#8C5B3E"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <circle
                            cx="12"
                            cy="6"
                            r="4"
                            fill="#5C7A52"
                            opacity="0.9"
                        />
                        <path
                            d="M7 6C7 4 17 4 17 6"
                            stroke="#2B2118"
                            strokeWidth="1.2"
                        />
                        <path
                            d="M9 12L15 12"
                            stroke="#8C5B3E"
                            strokeWidth="2"
                        />
                    </svg>
                </div>

                {/* Sparkles / Glowing Stars particles */}
                <div className="absolute top-[8%] left-[45%] sparkle-slow pointer-events-none z-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 0L15 9L24 12L15 15L12 24L9 15L0 12L9 9Z"
                            fill="#5C7A52"
                            opacity="0.4"
                        />
                    </svg>
                </div>

                <div className="absolute top-[55%] left-[10%] sparkle-fast pointer-events-none z-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 0L15 9L24 12L15 15L12 24L9 15L0 12L9 9Z"
                            fill="#7E9C73"
                            opacity="0.5"
                        />
                    </svg>
                </div>

                <div className="absolute bottom-[18%] right-[12%] sparkle-slow pointer-events-none z-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 0L15 9L24 12L15 15L12 24L9 15L0 12L9 9Z"
                            fill="#5C7A52"
                            opacity="0.3"
                        />
                    </svg>
                </div>

                <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10 relative z-10">
                    {/* ==========================================
                    1. TOP BAR SECTION (Glassmorphic & Themed)
                   ========================================== */}
                    <header className="relative z-30 bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-5 md:p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)] mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        {profileLoading ? (
                            <div className="flex items-center space-x-4 animate-pulse">
                                <div className="w-14 h-14 rounded-2xl bg-charcoal/10 shrink-0" />
                                <div className="text-left space-y-2">
                                    <div className="h-2.5 w-16 bg-charcoal/10 rounded" />
                                    <div className="h-6 w-36 bg-charcoal/10 rounded-lg" />
                                    <div className="h-3 w-24 bg-charcoal/10 rounded" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                {/* Interactive Avatar / Initials badge */}
                                <button
                                    onClick={() => {
                                        setShowProfileModal(true);
                                        setModalTab('profile');
                                        setFriendFormMode(null);
                                        setDeletingFriendId(null);
                                    }}
                                    title="Edit Profile & Friends"
                                    className="w-14 h-14 rounded-2xl bg-[#5C7A52]/10 hover:bg-[#5C7A52]/20 border border-[#5C7A52]/20 flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
                                >
                                    <span className="text-2xl font-display font-extrabold text-[#5C7A52] select-none">
                                        {customerName
                                            ? getInitials(customerName)
                                            : 'C'}
                                    </span>
                                </button>
                                <div className="text-center sm:text-left">
                                    <p className="text-[10px] text-[#2B2118]/50 font-bold uppercase tracking-wider font-body">
                                        {greeting}
                                    </p>
                                    <h1 className="font-display text-2xl md:text-3xl font-extrabold text-[#2B2118]">
                                        {customerName || 'Customer'}
                                    </h1>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs text-[#2B2118]/60 mt-1 font-body">
                                        <span>{formattedDate}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            {/* Wallet Balance Pill */}
                            {profileLoading ? (
                                <div className="h-[46px] w-[140px] bg-charcoal/10 rounded-2xl animate-pulse" />
                            ) : (
                                <div className="bg-[#5C7A52]/10 border border-[#5C7A52]/20 rounded-2xl px-4 py-2.5 flex items-center gap-2 select-none shadow-sm">
                                    <svg
                                        className="w-4 h-4 text-[#5C7A52]"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2.5}
                                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                    <div className="text-left font-body">
                                        <p className="text-[9px] uppercase tracking-wider font-bold text-[#2B2118]/40 leading-none">
                                            Wallet Balance
                                        </p>
                                        <p className="text-sm font-extrabold text-[#5C7A52] leading-none mt-1">
                                            ₹{walletBalance.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Notification Bell */}
                            <div className="static sm:relative">
                                <button
                                    onClick={() => {
                                        setShowNotifications(
                                            !showNotifications,
                                        );
                                        if (notificationCount > 0)
                                            setNotificationCount(0);
                                    }}
                                    className="w-12 h-12 rounded-2xl bg-white/70 hover:bg-[#FBF4EC]/50 border border-[#2B2118]/10 flex items-center justify-center text-[#2B2118]/80 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm relative"
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
                                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#5C7A52] text-white text-[10px] font-bold flex items-center justify-center animate-pulse-dot border-2 border-[#FBF4EC]">
                                            {notificationCount}
                                        </span>
                                    )}
                                </button>

                                {/* Dropdown panel */}
                                {showNotifications && (
                                    <div className="absolute right-4 left-4 sm:right-0 sm:left-auto mt-3 sm:w-80 bg-white border border-[#2B2118]/10 rounded-[24px] shadow-xl p-4 z-50 animate-scale-up">
                                        <div className="flex justify-between items-center border-b border-[#2B2118]/5 pb-2 mb-2">
                                            <h3 className="font-display font-bold text-sm text-[#2B2118]">
                                                Notifications
                                            </h3>
                                            <button
                                                onClick={() =>
                                                    setShowNotifications(false)
                                                }
                                                className="text-[10px] text-[#5C7A52] hover:underline font-bold uppercase tracking-wider"
                                            >
                                                Close
                                            </button>
                                        </div>
                                        <div className="space-y-3 max-h-60 overflow-y-auto">
                                            <div className="text-xs p-2.5 rounded-xl hover:bg-[#FBF4EC]/40 bg-[#5C7A52]/5 border border-[#5C7A52]/10 transition-colors">
                                                <p className="font-bold text-[#2B2118]">
                                                    Order Accepted!
                                                </p>
                                                <p className="text-[#2B2118]/60 mt-0.5">
                                                    Annapurna Rasoi has accepted
                                                    your deluxe lunch request.
                                                </p>
                                                <span className="text-[9px] text-[#2B2118]/40 font-semibold block mt-1">
                                                    Just Now
                                                </span>
                                            </div>
                                            <div className="text-xs p-2.5 rounded-xl hover:bg-[#FBF4EC]/40 transition-colors">
                                                <p className="font-bold text-[#2B2118]">
                                                    New Vendor Nearby!
                                                </p>
                                                <p className="text-[#2B2118]/60 mt-0.5">
                                                    Zaika Tiffin Corners is now
                                                    delivering to your area.
                                                </p>
                                                <span className="text-[9px] text-[#2B2118]/40 font-semibold block mt-1">
                                                    2 hours ago
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                title="Log Out"
                                className="w-12 h-12 rounded-2xl bg-white/70 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/20 border border-[#2B2118]/10 flex items-center justify-center text-[#2B2118]/80 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
                                </svg>
                            </button>
                        </div>
                    </header>

                    {/* Developer Toggles for empty state preview */}
                    <div className="mt-2 mb-8 flex flex-wrap gap-4 items-center justify-start bg-amber-500/5 border border-dashed border-amber-500/35 backdrop-blur-md px-5 py-3.5 rounded-2xl text-xs font-semibold text-[#2B2118]/70 shadow-sm relative z-20">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 text-[9px] font-extrabold tracking-wider uppercase flex items-center gap-1 select-none">
                            🛠 DEV ONLY
                        </span>
                        <span className="text-[10px] uppercase font-bold text-[#2B2118]/50 tracking-wider">
                            Dev Sandbox Tools:
                        </span>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={simulateEmptyMyVendors}
                                onChange={(e) =>
                                    setSimulateEmptyMyVendors(e.target.checked)
                                }
                                className="rounded border-amber-500/30 text-amber-600 focus:ring-amber-500/40"
                            />
                            <span>Empty "My Vendors" Row</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={simulateEmptyNearby}
                                onChange={(e) =>
                                    setSimulateEmptyNearby(e.target.checked)
                                }
                                className="rounded border-amber-500/30 text-amber-600 focus:ring-amber-500/40"
                            />
                            <span>Empty "Nearby Vendors" List</span>
                        </label>
                    </div>

                    {/* ==========================================
                    2. SEARCH BAR SECTION (Premium input styling)
                   ========================================== */}
                    <section className="mt-8 mb-12 max-w-2xl mx-auto">
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#2B2118]/40 group-focus-within:text-[#5C7A52] transition-colors">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search vendors by name, owner, or kitchen type..."
                                className="w-full pl-12 pr-6 py-4 bg-white/50 border border-white/40 focus:border-[#5C7A52] focus:bg-white text-charcoal rounded-3xl text-sm focus:outline-none focus:ring-4 focus:ring-[#5C7A52]/10 transition-all font-body select-text placeholder-[#2B2118]/45 shadow-sm"
                            />
                        </div>

                        {/* Filter chips container */}
                        <div className="flex flex-wrap justify-center gap-2 mt-3.5 px-1 select-none">
                            {['Open Now', 'Top Rated', 'Within 2 km'].map(
                                (filter) => {
                                    const isActive =
                                        activeFilters.includes(filter);
                                    return (
                                        <button
                                            key={filter}
                                            type="button"
                                            onClick={() => toggleFilter(filter)}
                                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-300 ${
                                                isActive
                                                    ? 'bg-[#5C7A52] text-white border-[#5C7A52] shadow-sm scale-105'
                                                    : 'bg-white/40 text-[#2B2118]/60 border-white/40 hover:bg-white/60 hover:text-charcoal'
                                            }`}
                                        >
                                            {filter}
                                        </button>
                                    );
                                },
                            )}
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* ==========================================
                        3. MY VENDORS SECTION (lg:col-span-12 or row)
                       ========================================== */}
                        <section className="lg:col-span-12 space-y-4">
                            <div className="px-1 flex items-center justify-between">
                                <h2 className="font-display text-2xl font-bold text-charcoal flex items-center space-x-2">
                                    <span>My Culinary Latches</span>
                                    <span className="text-xs font-bold font-body px-2 py-0.5 rounded-full bg-[#5C7A52]/15 text-[#5C7A52]">
                                        Active Subscribers
                                    </span>
                                </h2>
                            </div>

                            {loading ? (
                                /* Subscribed Vendors Loading Skeleton */
                                <div className="flex gap-4 overflow-x-auto pb-3 pt-1 animate-pulse">
                                    {[1, 2, 3].map((n) => (
                                        <div
                                            key={n}
                                            className="flex-shrink-0 bg-white/20 border border-white/10 rounded-2xl p-4 flex items-center space-x-3 w-64 h-20 shadow-sm"
                                        >
                                            <div className="w-11 h-11 rounded-full bg-charcoal/10 shrink-0" />
                                            <div className="space-y-2 flex-1">
                                                <div className="h-3.5 w-24 bg-charcoal/10 rounded" />
                                                <div className="h-2.5 w-16 bg-charcoal/10 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : simulateEmptyMyVendors ||
                              SAMPLE_MY_VENDORS.length === 0 ? (
                                /* Subscribed Vendors Empty State */
                                <div className="bg-white/30 backdrop-blur-md border border-[#2B2118]/10 border-dashed rounded-[32px] p-8 text-center flex flex-col items-center justify-center min-h-[180px] shadow-sm transition-all duration-300">
                                    {/* Leaf themed Tiffin box SVG */}
                                    <div className="w-16 h-16 mb-3 text-[#5C7A52]/40 stroke-current">
                                        <svg
                                            viewBox="0 0 100 120"
                                            fill="none"
                                            className="w-full h-full"
                                        >
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
                                            <rect
                                                x="30"
                                                y="34"
                                                width="40"
                                                height="20"
                                                rx="3"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            />
                                            <rect
                                                x="30"
                                                y="58"
                                                width="40"
                                                height="20"
                                                rx="3"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            />
                                            <rect
                                                x="30"
                                                y="82"
                                                width="40"
                                                height="22"
                                                rx="4"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="font-display text-lg font-bold text-charcoal mb-1">
                                        Order from a vendor to see them here
                                    </h3>
                                    <p className="text-xs text-[#2B2118]/50 max-w-xs leading-relaxed font-body">
                                        Subscribe to standard daily meal
                                        packages or place one-time orders to
                                        lock in your vendor shortcuts.
                                    </p>
                                </div>
                            ) : (
                                /* Horizontal Scroll Row of Vendor Cards */
                                <div className="flex gap-4 overflow-x-auto pb-3 pt-1 custom-scrollbar scroll-smooth">
                                    {SAMPLE_MY_VENDORS.map((mv) => (
                                        <button
                                            key={mv.id}
                                            onClick={() => {
                                                let match = vendors.find(
                                                    (n) => n.id === mv.id,
                                                );
                                                if (!match) {
                                                    match = {
                                                        id: mv.id,
                                                        businessName:
                                                            mv.businessName,
                                                        ownerName:
                                                            'Vendor Kitchen',
                                                        rating: mv.rating,
                                                        reviewsCount: 12,
                                                        distanceKm: 1.0,
                                                        isOpen: true,
                                                        deliveryRadiusKm: 5,
                                                        tiers: [],
                                                        addOns: [],
                                                        description: '',
                                                    };
                                                }
                                                handleOpenDetails(match);
                                            }}
                                            className="flex-shrink-0 bg-white/40 border border-white/30 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 w-64 hover:border-[#5C7A52]/30 hover:bg-white/60 transition-all duration-300 hover:shadow-sm text-left group"
                                        >
                                            <div className="w-11 h-11 rounded-full bg-[#5C7A52]/10 border border-[#5C7A52]/20 flex items-center justify-center font-display font-bold text-[#5C7A52] shadow-inner select-none transition-transform group-hover:scale-105">
                                                {mv.initials}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h3 className="font-display font-bold text-sm text-charcoal truncate">
                                                    {mv.businessName}
                                                </h3>
                                                <div className="flex items-center space-x-1.5 text-xs text-[#2B2118]/50 mt-0.5">
                                                    <span className="text-[#F2B340] font-bold">
                                                        ★ {mv.rating}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="text-[#5C7A52] font-semibold uppercase tracking-wider text-[9px]">
                                                        Subscribed
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* ==========================================
                        4. NEARBY VENDORS LIST (lg:col-span-12 main)
                       ========================================== */}
                        <section className="lg:col-span-12 space-y-5 pt-4">
                            <h2 className="font-display text-2xl font-bold text-charcoal px-1">
                                Culinary Hubs Near You
                            </h2>

                            {locationError ? (
                                /* Geolocation / Profile Configuration Alert */
                                <div className="bg-white/30 backdrop-blur-md border border-amber-500/35 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[350px] shadow-sm transition-all duration-300">
                                    <div className="w-20 h-20 mb-6 text-amber-500/50 flex items-center justify-center">
                                        <svg
                                            className="w-12 h-12"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                                        Location Configuration Required
                                    </h3>
                                    <p className="text-xs text-[#2B2118]/50 max-w-sm leading-relaxed mb-6 font-body">
                                        {locationError}
                                    </p>
                                    <button
                                        onClick={handleSetCurrentLocation}
                                        disabled={settingLocation}
                                        className="px-6 py-3.5 rounded-2xl bg-[#5C7A52] hover:bg-[#5C7A52]/90 text-white font-bold text-sm shadow-[0_8px_25px_rgba(92,122,82,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {settingLocation
                                            ? 'Setting Location...'
                                            : 'Use Current Location'}
                                    </button>
                                </div>
                            ) : loading ? (
                                /* Premium Loading Skeleton */
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[1, 2, 3, 4].map((n) => (
                                        <div
                                            key={n}
                                            className="border border-white/20 rounded-[32px] p-6 bg-white/25 backdrop-blur-sm shadow-[0_8px_25px_-5px_rgba(43,33,24,0.04)] animate-pulse min-h-[280px] flex flex-col justify-between"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <div className="h-4 w-24 bg-charcoal/10 rounded-lg" />
                                                    <div className="h-4 w-12 bg-charcoal/10 rounded-lg" />
                                                </div>
                                                <div className="h-6 w-3/4 bg-charcoal/10 rounded-lg mt-2" />
                                                <div className="space-y-2 mt-4">
                                                    <div className="h-3 w-full bg-charcoal/10 rounded-lg" />
                                                    <div className="h-3 w-5/6 bg-charcoal/10 rounded-lg" />
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    <div className="h-6 w-20 bg-charcoal/10 rounded-lg" />
                                                    <div className="h-6 w-24 bg-charcoal/10 rounded-lg" />
                                                </div>
                                            </div>
                                            <div className="h-11 w-full bg-charcoal/10 rounded-2xl mt-6" />
                                        </div>
                                    ))}
                                </div>
                            ) : simulateEmptyNearby ||
                              filteredVendors.length === 0 ? (
                                /* Nearby Vendors Empty State */
                                <div className="bg-white/30 backdrop-blur-md border border-[#2B2118]/10 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[350px] shadow-sm transition-all duration-300">
                                    <div className="w-24 h-24 mb-6 text-[#5C7A52]/30 stroke-current">
                                        <svg
                                            viewBox="0 0 100 120"
                                            fill="none"
                                            className="w-full h-full"
                                        >
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
                                            <rect
                                                x="30"
                                                y="34"
                                                width="40"
                                                height="20"
                                                rx="3"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            />
                                            <rect
                                                x="30"
                                                y="58"
                                                width="40"
                                                height="20"
                                                rx="3"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            />
                                            <rect
                                                x="30"
                                                y="82"
                                                width="40"
                                                height="22"
                                                rx="4"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                                        No vendors found near you yet
                                    </h3>
                                    <p className="text-xs text-[#2B2118]/50 max-w-sm leading-relaxed mb-6 font-body">
                                        We couldn't locate any active tiffin
                                        kitchens matching your filters. Try
                                        adjusting your coordinates or check back
                                        later as kitchens onboard!
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setActiveFilters([]);
                                            setSimulateEmptyNearby(false);
                                        }}
                                        className="px-6 py-3.5 rounded-2xl bg-[#5C7A52] hover:bg-[#5C7A52]/90 text-white font-bold text-sm shadow-[0_8px_25px_rgba(92,122,82,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                                    >
                                        Reset Search Filters
                                    </button>
                                </div>
                            ) : (
                                /* Staggered Vertically Stacked Vendor Cards */
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredVendors.map((vendor, index) => {
                                        // Visual card styles depending on status (closed goes semi-transparent/grayed)
                                        const cardStyle = vendor.isOpen
                                            ? 'bg-white/40 border-white/20 hover:border-[#5C7A52]/30 hover:bg-white/60 shadow-[0_8px_25px_-5px_rgba(43,33,24,0.04)] hover:shadow-[0_12px_35px_-5px_rgba(43,33,24,0.08)]'
                                            : 'bg-charcoal/[0.02] border-[#2B2118]/10 opacity-60';

                                        return (
                                            <div
                                                key={vendor.id}
                                                style={{
                                                    animationDelay: `${index * 80}ms`,
                                                }}
                                                className={`border rounded-[32px] p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[280px] animate-fade-in-up group ${cardStyle}`}
                                            >
                                                {/* Design accent */}
                                                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-[#5C7A52]/5 border border-[#5C7A52]/5 pointer-events-none group-hover:scale-105 transition-transform" />

                                                <div>
                                                    {/* Header Row: Badges, Distance, Status */}
                                                    <div className="flex justify-between items-start mb-3 select-none">
                                                        <div className="flex gap-1.5 items-center">
                                                            <span
                                                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                                                    vendor.isOpen
                                                                        ? 'bg-[#5C7A52]/10 border border-[#5C7A52]/20 text-[#5C7A52]'
                                                                        : 'bg-charcoal/10 border border-charcoal/15 text-charcoal/50'
                                                                }`}
                                                            >
                                                                {vendor.isOpen
                                                                    ? 'Open'
                                                                    : 'Closed'}
                                                            </span>
                                                            <span className="px-2.5 py-0.5 rounded-full bg-[#2B2118]/5 border border-[#2B2118]/10 text-charcoal/60 text-[10px] font-bold">
                                                                {
                                                                    vendor.distanceKm
                                                                }{' '}
                                                                km away
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xs font-bold text-[#F2B340]">
                                                                ★{' '}
                                                                {vendor.rating}
                                                            </span>
                                                            <span className="text-[10px] text-charcoal/40 font-semibold block">
                                                                (
                                                                {
                                                                    vendor.reviewsCount
                                                                }{' '}
                                                                reviews)
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Business Name and description */}
                                                    <h3 className="font-display text-xl font-extrabold text-charcoal mb-1.5 group-hover:text-[#5C7A52] transition-colors">
                                                        {vendor.businessName}
                                                    </h3>
                                                    <p className="text-xs text-[#2B2118]/60 line-clamp-2 leading-relaxed mb-4 font-body">
                                                        {vendor.description}
                                                    </p>

                                                    {/* Today's Menu Preview Tiers */}
                                                    <div className="mb-6 space-y-1.5">
                                                        <span className="text-[9px] uppercase tracking-widest font-bold text-[#2B2118]/45 block font-body">
                                                            Today's Offerings
                                                        </span>
                                                        {vendor.tiers.length >
                                                        0 ? (
                                                            <div className="flex flex-wrap gap-2 select-none">
                                                                {vendor.tiers.map(
                                                                    (
                                                                        t,
                                                                        tIdx,
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                tIdx
                                                                            }
                                                                            className="px-3 py-1 rounded-xl bg-white/80 border border-[#2B2118]/5 text-charcoal text-xs font-bold flex items-center gap-1 shadow-sm font-body"
                                                                        >
                                                                            <span>
                                                                                {
                                                                                    t.name
                                                                                }
                                                                            </span>
                                                                            <span className="text-[#5C7A52] font-extrabold">
                                                                                ₹
                                                                                {
                                                                                    t.price
                                                                                }
                                                                            </span>
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-[#2B2118]/40 italic">
                                                                Tap to view
                                                                today's menu
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* CTA Button */}
                                                <button
                                                    onClick={() =>
                                                        handleOpenDetails(
                                                            vendor,
                                                        )
                                                    }
                                                    className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
                                                        vendor.isOpen
                                                            ? 'bg-[#5C7A52] hover:bg-[#5C7A52]/90 text-white shadow-[0_8px_25px_rgba(92,122,82,0.18)] hover:shadow-[0_8px_25px_rgba(92,122,82,0.3)] hover:scale-[1.01]'
                                                            : 'bg-charcoal/10 border border-charcoal/15 text-charcoal/40 cursor-not-allowed'
                                                    }`}
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
                                                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                        />
                                                    </svg>
                                                    <span>
                                                        {vendor.isOpen
                                                            ? 'View Menu & Order'
                                                            : 'Kitchen Closed'}
                                                    </span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                {/* ==========================================
                5. VENDOR DETAIL MODAL (Modal Pattern)
               ========================================== */}
                {showDetailModal && selectedVendor && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-md transition-opacity duration-300"
                        onClick={() => {
                            if (!orderSubmitting) {
                                setShowDetailModal(false);
                                setSelectedVendor(null);
                            }
                        }}
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
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <div className="flex gap-1.5 items-center mb-1.5 flex-wrap">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                                    selectedVendor.isOpen
                                                        ? 'bg-[#5C7A52]/20 border border-[#5C7A52]/30 text-[#7E9C73]'
                                                        : 'bg-white/10 text-white/50'
                                                }`}
                                            >
                                                {selectedVendor.isOpen
                                                    ? 'Open'
                                                    : 'Closed'}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-cream/70 text-[9px] font-bold">
                                                {selectedVendor.distanceKm} km
                                                away
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-cream/70 text-[9px] font-bold">
                                                {
                                                    selectedVendor.deliveryRadiusKm
                                                }{' '}
                                                km delivery radius
                                            </span>
                                        </div>
                                        <h3 className="font-display text-xl md:text-2xl font-bold">
                                            {selectedVendor.businessName}
                                        </h3>
                                        <p className="text-xs text-cream/60 mt-0.5">
                                            Kitchen Lead:{' '}
                                            <strong>
                                                {selectedVendor.ownerName}
                                            </strong>
                                        </p>
                                        {selectedVendor.ownerPhone && (
                                            <p className="flex items-center gap-1 mt-0.5 text-[10px] text-cream/55 font-body">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="w-3 h-3 shrink-0"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={1.8}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                    />
                                                </svg>
                                                {selectedVendor.ownerPhone}
                                            </p>
                                        )}
                                        {selectedVendor.address && (
                                            <p className="flex items-center gap-1 mt-0.5 text-[10px] text-cream/45 font-body overflow-hidden">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="w-3 h-3 shrink-0"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={1.8}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                </svg>
                                                <span className="truncate">
                                                    {selectedVendor.address}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-[#F2B340]">
                                            ★ {selectedVendor.rating}
                                        </span>
                                        <span className="text-[10px] text-cream/50 block font-semibold">
                                            {selectedVendor.reviewsCount}{' '}
                                            reviews
                                        </span>
                                    </div>
                                </div>

                                {!orderSubmitting && (
                                    <button
                                        onClick={() => {
                                            setShowDetailModal(false);
                                            setSelectedVendor(null);
                                        }}
                                        className="absolute right-4 top-4 text-cream/70 hover:text-white transition-colors z-20"
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
                                )}
                            </div>

                            {/* Modal Body (Menu and Order form builder) */}
                            {orderSuccess ? (
                                /* Success State Animation */
                                <div className="p-8 text-center flex flex-col items-center justify-center min-h-[350px] bg-[#5C7A52]/5 transition-all">
                                    <div className="w-16 h-16 rounded-full bg-[#5C7A52]/10 border border-[#5C7A52]/20 flex items-center justify-center text-[#5C7A52] mb-4 animate-bounce">
                                        <svg
                                            className="w-8 h-8"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={3}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="font-display text-2xl font-extrabold text-[#2B2118] mb-2">
                                        Order Request Dispatched!
                                    </h3>
                                    <p className="text-xs text-[#2B2118]/60 max-w-xs leading-relaxed font-body">
                                        Your order request has been sent to{' '}
                                        <strong>
                                            {selectedVendor.businessName}
                                        </strong>
                                        . You will be notified once they accept
                                        it.
                                    </p>
                                </div>
                            ) : menuLoading ? (
                                /* Premium Skeleton/Loader */
                                <div className="p-8 text-center flex flex-col items-center justify-center min-h-[350px] space-y-4">
                                    <div className="w-12 h-12 rounded-full border-4 border-[#5C7A52]/20 border-t-[#5C7A52] animate-spin" />
                                    <p className="text-xs text-[#2B2118]/60 font-body uppercase tracking-wider font-semibold animate-pulse">
                                        Fetching today's fresh menu...
                                    </p>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleOrderSubmit}
                                    className="p-6 space-y-6 overflow-y-auto max-h-[68vh] bg-[#FBF4EC]/10 custom-scrollbar"
                                >
                                    {/* Description */}
                                    <div className="bg-[#FBF4EC]/50 border border-[#2B2118]/5 rounded-2xl p-4">
                                        <h4 className="text-[10px] text-[#2B2118]/40 font-bold uppercase tracking-wider mb-1 font-body">
                                            About Kitchen
                                        </h4>
                                        <p className="text-xs text-[#2B2118]/70 leading-relaxed font-body">
                                            {selectedVendor.description}
                                        </p>
                                    </div>

                                    {/* Menu Tiers (Read-Only) */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] text-[#2B2118]/50 font-bold uppercase tracking-wider block font-body border-b border-[#2B2118]/5 pb-1">
                                            Today's Tiffin Tiers
                                        </label>

                                        {selectedVendor.tiers.length > 0 ? (
                                            selectedVendor.tiers.map(
                                                (tier, idx) => {
                                                    const qty =
                                                        orderQuantities[
                                                            tier.name
                                                        ] || 0;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`border rounded-2xl p-4 transition-all duration-300 flex justify-between items-center ${
                                                                qty > 0
                                                                    ? 'bg-[#5C7A52]/5 border-[#5C7A52]/25 shadow-sm'
                                                                    : 'bg-[#FBF4EC]/20 border-charcoal/10'
                                                            }`}
                                                        >
                                                            <div className="flex items-start space-x-3 flex-1 pr-4">
                                                                {/* Selection Tick Box */}
                                                                <div className="pt-0.5">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`tier-select-${idx}`}
                                                                        checked={
                                                                            qty >
                                                                            0
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            if (
                                                                                e
                                                                                    .target
                                                                                    .checked
                                                                            ) {
                                                                                setOrderQuantities(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                        ...prev,
                                                                                        [tier.name]: 1,
                                                                                    }),
                                                                                );
                                                                            } else {
                                                                                setOrderQuantities(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                        ...prev,
                                                                                        [tier.name]: 0,
                                                                                    }),
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="rounded border-[#2B2118]/25 text-[#5C7A52] focus:ring-[#5C7A52]/40 w-4 h-4 cursor-pointer"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5 flex-1">
                                                                    <label
                                                                        htmlFor={`tier-select-${idx}`}
                                                                        className="flex justify-between items-baseline cursor-pointer select-none"
                                                                    >
                                                                        <h4 className="font-display text-sm font-extrabold text-charcoal">
                                                                            {
                                                                                tier.name
                                                                            }
                                                                        </h4>
                                                                        <span className="text-sm font-display font-extrabold text-[#5C7A52]">
                                                                            ₹
                                                                            {
                                                                                tier.price
                                                                            }
                                                                        </span>
                                                                    </label>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {tier.items.map(
                                                                            (
                                                                                item,
                                                                                tagIdx,
                                                                            ) => (
                                                                                <span
                                                                                    key={
                                                                                        tagIdx
                                                                                    }
                                                                                    className="px-2 py-0.5 rounded-lg bg-white border border-[#2B2118]/5 text-[#2B2118]/70 text-[10px] font-semibold font-body shadow-sm"
                                                                                >
                                                                                    {
                                                                                        item
                                                                                    }
                                                                                </span>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Quantity Stepper */}
                                                            <div
                                                                className={`flex items-center space-x-2.5 bg-white border border-[#2B2118]/10 rounded-xl p-1 shrink-0 select-none shadow-sm transition-all duration-200 ${qty === 0 ? 'opacity-40' : 'opacity-100'}`}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        qty ===
                                                                        0
                                                                    }
                                                                    onClick={() =>
                                                                        updateQuantity(
                                                                            tier.name,
                                                                            -1,
                                                                        )
                                                                    }
                                                                    className="w-7 h-7 rounded-lg hover:bg-[#FBF4EC] disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center text-charcoal/60 active:scale-90 transition-transform font-extrabold"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="text-xs font-bold w-4 text-center text-charcoal">
                                                                    {qty}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (
                                                                            qty ===
                                                                            0
                                                                        ) {
                                                                            setOrderQuantities(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [tier.name]: 1,
                                                                                }),
                                                                            );
                                                                        } else {
                                                                            updateQuantity(
                                                                                tier.name,
                                                                                1,
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="w-7 h-7 rounded-lg hover:bg-[#FBF4EC] flex items-center justify-center text-charcoal/60 active:scale-90 transition-transform font-extrabold"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )
                                        ) : (
                                            <div className="p-4 text-center bg-[#FBF4EC]/10 border border-[#2B2118]/5 rounded-2xl">
                                                <p className="text-xs text-[#2B2118]/45 italic font-body">
                                                    No menu tiers uploaded for
                                                    this session yet.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Add-ons Section */}
                                    {selectedVendor.addOns &&
                                        selectedVendor.addOns.length > 0 && (
                                            <div className="space-y-3">
                                                <label className="text-[10px] text-[#2B2118]/50 font-bold uppercase tracking-wider block font-body border-b border-[#2B2118]/5 pb-1">
                                                    Extra Delicacies
                                                </label>
                                                <div className="space-y-3.5">
                                                    {selectedVendor.addOns.map(
                                                        (ad, idx) => {
                                                            const qty =
                                                                orderQuantities[
                                                                    ad.name
                                                                ] || 0;
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="flex justify-between items-center px-1"
                                                                >
                                                                    <div className="text-left">
                                                                        <p className="text-xs font-bold text-charcoal leading-none">
                                                                            {
                                                                                ad.name
                                                                            }
                                                                        </p>
                                                                        <p className="text-[10px] text-[#5C7A52] font-extrabold mt-1">
                                                                            +₹
                                                                            {
                                                                                ad.price
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    {/* Simple Stepper */}
                                                                    <div className="flex items-center space-x-2 bg-white border border-[#2B2118]/10 rounded-xl p-1 select-none shadow-sm">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                updateQuantity(
                                                                                    ad.name,
                                                                                    -1,
                                                                                )
                                                                            }
                                                                            className="w-6 h-6 rounded-md hover:bg-[#FBF4EC] flex items-center justify-center text-charcoal/60 active:scale-90 transition-transform font-extrabold text-xs"
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <span className="text-xs font-bold w-4 text-center text-charcoal">
                                                                            {
                                                                                qty
                                                                            }
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                updateQuantity(
                                                                                    ad.name,
                                                                                    1,
                                                                                )
                                                                            }
                                                                            className="w-6 h-6 rounded-md hover:bg-[#FBF4EC] flex items-center justify-center text-charcoal/60 active:scale-90 transition-transform font-extrabold text-xs"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Friend Profile & Payment Toggle */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#2B2118]/10 pt-4">
                                        {/* Friend Selector */}
                                        <div className="space-y-1.5 text-left">
                                            <label className="text-[10px] text-[#2B2118]/50 font-bold uppercase tracking-wider flex justify-between items-center font-body">
                                                <span>Who is this for?</span>
                                                {selectedVendor &&
                                                    selectedVendor.tiers.reduce(
                                                        (acc, t) =>
                                                            acc +
                                                            (orderQuantities[
                                                                t.name
                                                            ] || 0),
                                                        0,
                                                    ) > 1 && (
                                                        <span className="text-[9px] text-[#5C7A52] lowercase font-semibold tracking-normal">
                                                            (select up to{' '}
                                                            {selectedVendor.tiers.reduce(
                                                                (acc, t) =>
                                                                    acc +
                                                                    (orderQuantities[
                                                                        t.name
                                                                    ] || 0),
                                                                0,
                                                            )}
                                                            )
                                                        </span>
                                                    )}
                                            </label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {[
                                                    'Myself',
                                                    ...friendProfiles.map(
                                                        (f: any) => f.name,
                                                    ),
                                                ].map((name: string) => {
                                                    const isSelected =
                                                        selectedFriends.includes(
                                                            name,
                                                        );
                                                    return (
                                                        <button
                                                            key={name}
                                                            type="button"
                                                            onClick={() => {
                                                                const totalTiffins =
                                                                    selectedVendor
                                                                        ? selectedVendor.tiers.reduce(
                                                                              (
                                                                                  acc,
                                                                                  t,
                                                                              ) =>
                                                                                  acc +
                                                                                  (orderQuantities[
                                                                                      t
                                                                                          .name
                                                                                  ] ||
                                                                                      0),
                                                                              0,
                                                                          )
                                                                        : 0;
                                                                if (
                                                                    totalTiffins <=
                                                                    1
                                                                ) {
                                                                    setSelectedFriends(
                                                                        [name],
                                                                    );
                                                                } else {
                                                                    if (
                                                                        isSelected
                                                                    ) {
                                                                        if (
                                                                            selectedFriends.length >
                                                                            1
                                                                        ) {
                                                                            setSelectedFriends(
                                                                                selectedFriends.filter(
                                                                                    (
                                                                                        n,
                                                                                    ) =>
                                                                                        n !==
                                                                                        name,
                                                                                ),
                                                                            );
                                                                        }
                                                                    } else {
                                                                        if (
                                                                            selectedFriends.length <
                                                                            totalTiffins
                                                                        ) {
                                                                            setSelectedFriends(
                                                                                [
                                                                                    ...selectedFriends,
                                                                                    name,
                                                                                ],
                                                                            );
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                                                                isSelected
                                                                    ? 'bg-[#5C7A52] text-white border-[#5C7A52] shadow-sm'
                                                                    : 'bg-[#FBF4EC]/50 text-charcoal/70 border-charcoal/15 hover:border-[#5C7A52]/50 hover:bg-[#FBF4EC]'
                                                            }`}
                                                        >
                                                            {name === 'Myself'
                                                                ? `Myself (${customerName})`
                                                                : name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Payment Method Selector */}
                                        <div className="space-y-1.5 text-left">
                                            <label className="text-[10px] text-[#2B2118]/50 font-bold uppercase tracking-wider block font-body">
                                                Billing Mode
                                            </label>
                                            <div className="flex bg-charcoal/5 p-1 rounded-2xl border border-charcoal/10 relative select-none">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPaymentMethod(
                                                            'wallet',
                                                        )
                                                    }
                                                    className={`flex-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                                                        paymentMethod ===
                                                        'wallet'
                                                            ? 'bg-[#5C7A52] text-white shadow-sm'
                                                            : 'text-charcoal/50 hover:text-charcoal/80'
                                                    }`}
                                                >
                                                    Wallet
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={true}
                                                    title="Subscription Token mode locked"
                                                    className="flex-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider rounded-xl text-charcoal/30 cursor-not-allowed flex items-center justify-center gap-1"
                                                >
                                                    <svg
                                                        className="w-2.5 h-2.5"
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
                                                    Token
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Actions and total checkout billing */}
                                    <div className="border-t border-[#2B2118]/10 pt-4 flex items-center justify-between gap-4">
                                        <div className="text-left font-body">
                                            <p className="text-[10px] uppercase font-bold text-[#2B2118]/45">
                                                Grand Total
                                            </p>
                                            <p className="text-2xl font-extrabold text-charcoal font-display">
                                                ₹
                                                {calculateOrderTotal().toFixed(
                                                    2,
                                                )}
                                            </p>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={
                                                orderSubmitting ||
                                                calculateOrderTotal() === 0
                                            }
                                            className="flex-1 py-4 rounded-2xl bg-[#5C7A52] hover:bg-[#5C7A52]/90 text-white font-bold text-sm shadow-[0_8px_25px_rgba(92,122,82,0.25)] transition-all flex items-center justify-center space-x-2 select-none disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {orderSubmitting ? (
                                                <>
                                                    <svg
                                                        className="animate-spin h-5 w-5 text-white animate-pulse"
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
                                                    <span>
                                                        Requesting Latch...
                                                    </span>
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
                                                            strokeWidth={2}
                                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
                                                        />
                                                    </svg>
                                                    <span>
                                                        Send Order Request
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ==========================================
                UNIFIED PROFILE MODAL (CENTERED)
                Two tabs: My Profile | My Friends
               ========================================== */}
            {showProfileModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2118]/60 backdrop-blur-md transition-opacity duration-300"
                    onClick={() => {
                        setShowProfileModal(false);
                        setFriendFormMode(null);
                        setDeletingFriendId(null);
                    }}
                >
                    <div
                        className="bg-white/95 border border-white/30 shadow-[0_24px_70px_rgba(43,33,24,0.3)] rounded-[32px] w-full max-w-lg overflow-hidden transform transition-all duration-300 flex flex-col animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Dark Header */}
                        <div className="bg-gradient-to-br from-[#1F1710] to-[#2E2218] px-6 pt-5 pb-8 rounded-t-[32px] relative overflow-hidden select-none">
                            <img
                                src={tiffinBg}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity pointer-events-none"
                            />
                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <h3 className="font-display text-2xl font-bold text-[#FBF4EC] mb-1 tracking-wide shadow-sm">
                                        Your Account
                                    </h3>
                                    <p className="text-[#FBF4EC]/60 text-[11px] font-body leading-relaxed max-w-[280px]">
                                        Manage your personal information,
                                        delivery address, and friends.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowProfileModal(false);
                                        setFriendFormMode(null);
                                        setDeletingFriendId(null);
                                    }}
                                    className="text-[#FBF4EC]/40 hover:text-white transition-colors"
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
                        </div>

                        {/* Tab Toggle */}
                        <div className="flex bg-[#FBF4EC] p-1 rounded-2xl mx-6 -mt-5 relative z-20 shadow-sm border border-[#2B2118]/5">
                            <button
                                onClick={() => {
                                    setModalTab('profile');
                                    setFriendFormMode(null);
                                    setDeletingFriendId(null);
                                }}
                                className={`flex-1 py-2 text-xs font-bold font-body rounded-xl transition-all ${
                                    modalTab === 'profile'
                                        ? 'bg-white text-[#5C7A52] shadow-sm'
                                        : 'text-[#2B2118]/50 hover:text-[#2B2118]'
                                }`}
                            >
                                👤 My Profile
                            </button>
                            <button
                                onClick={() => {
                                    setModalTab('friends');
                                    setFriendFormMode(null);
                                    setDeletingFriendId(null);
                                }}
                                className={`flex-1 py-2 text-xs font-bold font-body rounded-xl transition-all ${
                                    modalTab === 'friends'
                                        ? 'bg-white text-[#5C7A52] shadow-sm'
                                        : 'text-[#2B2118]/50 hover:text-[#2B2118]'
                                }`}
                            >
                                👥 My Friends
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[72vh] bg-[#FBF4EC]/30 custom-scrollbar">
                            {/* ── MY PROFILE TAB ── */}
                            {modalTab === 'profile' && (
                                <form
                                    className="space-y-4 animate-scale-up"
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (
                                            !formFirstname.trim() ||
                                            !formLastname.trim()
                                        ) {
                                            setProfileError(
                                                'First and Last names are required.',
                                            );
                                            return;
                                        }
                                        if (
                                            !formEmail.trim() ||
                                            !formPhone.trim()
                                        ) {
                                            setProfileError(
                                                'Email and Phone are required.',
                                            );
                                            return;
                                        }
                                        setProfileSubmitting(true);
                                        setProfileError('');
                                        try {
                                            const payload: any = {
                                                firstname: formFirstname,
                                                lastname: formLastname,
                                                email: formEmail,
                                                phone: formPhone,
                                                address: formAddress,
                                            };
                                            if (
                                                formLng !== '' &&
                                                formLat !== ''
                                            ) {
                                                payload.coordinates = [
                                                    Number(formLng),
                                                    Number(formLat),
                                                ];
                                            }
                                            const res = await api.put(
                                                '/customer/profile',
                                                payload,
                                            );
                                            const updated = res.data.data;
                                            const fullName = updated.userId
                                                ? `${updated.userId.firstName} ${updated.userId.lastName}`
                                                : customerName;
                                            setCustomerName(fullName);
                                            setCustomerAddress(
                                                updated.location?.address ||
                                                    formAddress,
                                            );
                                            setFormFirstname(
                                                updated.userId?.firstName || '',
                                            );
                                            setFormLastname(
                                                updated.userId?.lastName || '',
                                            );
                                            setFormEmail(
                                                updated.userId?.email || '',
                                            );
                                            setFormPhone(
                                                updated.userId?.phone || '',
                                            );
                                            setFormAddress(
                                                updated.location?.address || '',
                                            );
                                            setFormLat(
                                                updated.location
                                                    ?.coordinates?.[1] ?? '',
                                            );
                                            setFormLng(
                                                updated.location
                                                    ?.coordinates?.[0] ?? '',
                                            );
                                            setShowProfileModal(false);
                                        } catch (err: any) {
                                            setProfileError(
                                                err.response?.data?.message ||
                                                    'Failed to update profile.',
                                            );
                                        } finally {
                                            setProfileSubmitting(false);
                                        }
                                    }}
                                >
                                    {/* Error banner */}
                                    {profileError && (
                                        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-start space-x-2 font-semibold">
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

                                    {/* Personal Details */}
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] text-[#5C7A52] font-bold uppercase tracking-wider block font-body border-b border-[#2B2118]/5 pb-1">
                                            Personal Details
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="relative w-full group">
                                                <input
                                                    type="text"
                                                    value={formFirstname}
                                                    onChange={(e) =>
                                                        setFormFirstname(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onFocus={() =>
                                                        setFocusedField(
                                                            'p-firstname',
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        setFocusedField(null)
                                                    }
                                                    className="w-full bg-[#FBF4EC]/70 border border-[#2B2118]/15 text-[#2B2118] rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-[#5C7A52] focus:ring-[#5C7A52]/20 transition-all font-body select-text placeholder-transparent"
                                                    placeholder="First Name"
                                                />
                                                <label
                                                    className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${focusedField === 'p-firstname' || formFirstname !== '' ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-[#5C7A52]' : 'top-4 text-sm text-[#2B2118]/60'}`}
                                                >
                                                    First Name
                                                </label>
                                            </div>
                                            <div className="relative w-full group">
                                                <input
                                                    type="text"
                                                    value={formLastname}
                                                    onChange={(e) =>
                                                        setFormLastname(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onFocus={() =>
                                                        setFocusedField(
                                                            'p-lastname',
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        setFocusedField(null)
                                                    }
                                                    className="w-full bg-[#FBF4EC]/70 border border-[#2B2118]/15 text-[#2B2118] rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-[#5C7A52] focus:ring-[#5C7A52]/20 transition-all font-body select-text placeholder-transparent"
                                                    placeholder="Last Name"
                                                />
                                                <label
                                                    className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${focusedField === 'p-lastname' || formLastname !== '' ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-[#5C7A52]' : 'top-4 text-sm text-[#2B2118]/60'}`}
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
                                                        setFormEmail(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onFocus={() =>
                                                        setFocusedField(
                                                            'p-email',
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        setFocusedField(null)
                                                    }
                                                    className="w-full bg-[#FBF4EC]/70 border border-[#2B2118]/15 text-[#2B2118] rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-[#5C7A52] focus:ring-[#5C7A52]/20 transition-all font-body select-text placeholder-transparent"
                                                    placeholder="Email Address"
                                                />
                                                <label
                                                    className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${focusedField === 'p-email' || formEmail !== '' ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-[#5C7A52]' : 'top-4 text-sm text-[#2B2118]/60'}`}
                                                >
                                                    Email Address
                                                </label>
                                            </div>
                                            <div className="relative w-full group">
                                                <input
                                                    type="text"
                                                    value={formPhone}
                                                    onChange={(e) =>
                                                        setFormPhone(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onFocus={() =>
                                                        setFocusedField(
                                                            'p-phone',
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        setFocusedField(null)
                                                    }
                                                    className="w-full bg-[#FBF4EC]/70 border border-[#2B2118]/15 text-[#2B2118] rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-[#5C7A52] focus:ring-[#5C7A52]/20 transition-all font-body select-text placeholder-transparent"
                                                    placeholder="Phone Number"
                                                />
                                                <label
                                                    className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${focusedField === 'p-phone' || formPhone !== '' ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-[#5C7A52]' : 'top-4 text-sm text-[#2B2118]/60'}`}
                                                >
                                                    Phone Number
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivery Address */}
                                    <div className="space-y-3 pt-2">
                                        <h4 className="text-[10px] text-[#5C7A52] font-bold uppercase tracking-wider block font-body border-b border-[#2B2118]/5 pb-1">
                                            Delivery Address
                                        </h4>
                                        <div className="relative w-full group">
                                            <input
                                                type="text"
                                                value={formAddress}
                                                onChange={(e) =>
                                                    setFormAddress(
                                                        e.target.value,
                                                    )
                                                }
                                                onFocus={() =>
                                                    setFocusedField('p-address')
                                                }
                                                onBlur={() =>
                                                    setFocusedField(null)
                                                }
                                                className="w-full bg-[#FBF4EC]/70 border border-[#2B2118]/15 text-[#2B2118] rounded-2xl px-5 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 focus:border-[#5C7A52] focus:ring-[#5C7A52]/20 transition-all font-body select-text placeholder-transparent"
                                                placeholder="Delivery Address"
                                            />
                                            <label
                                                className={`absolute left-5 transition-all duration-300 pointer-events-none font-body ${focusedField === 'p-address' || formAddress !== '' ? 'top-2 text-[10px] font-bold uppercase tracking-wider text-[#5C7A52]' : 'top-4 text-sm text-[#2B2118]/60'}`}
                                            >
                                                Delivery Address
                                            </label>
                                        </div>

                                        <MapPicker
                                            lat={
                                                formLat === ''
                                                    ? 0
                                                    : Number(formLat)
                                            }
                                            lng={
                                                formLng === ''
                                                    ? 0
                                                    : Number(formLng)
                                            }
                                            onChange={(lat, lng) => {
                                                setFormLat(lat);
                                                setFormLng(lng);
                                            }}
                                            address={formAddress}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowProfileModal(false)
                                            }
                                            className="flex-1 py-3.5 rounded-2xl border border-[#2B2118]/15 text-[#2B2118]/70 hover:text-[#2B2118] hover:bg-[#2B2118]/5 font-bold text-sm transition-all select-none"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={profileSubmitting}
                                            className="flex-1 py-3.5 rounded-2xl bg-[#5C7A52] hover:bg-[#5C7A52]/90 text-white font-bold text-sm shadow-[0_8px_25px_rgba(92,122,82,0.25)] transition-all flex items-center justify-center space-x-2 select-none disabled:opacity-50"
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
                            )}

                            {/* ── MY FRIENDS TAB ── */}
                            {modalTab === 'friends' && (
                                <div className="space-y-4 animate-scale-up">
                                    {/* TODO: wire ProfileSelector to order modal */}
                                    {/* Friend chip selector row (horizontal scroll preview) */}
                                    {friends.length > 0 && (
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#2B2118]/40 font-body mb-2">
                                                Quick Select
                                            </p>
                                            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                                <div className="flex gap-2 shrink-0">
                                                    {friends.map((f) => (
                                                        <div
                                                            key={f._id}
                                                            className="flex flex-col items-center gap-1 shrink-0"
                                                        >
                                                            <div className="w-10 h-10 rounded-xl bg-[#5C7A52]/15 border border-[#5C7A52]/20 flex items-center justify-center">
                                                                <span className="text-sm font-display font-bold text-[#5C7A52]">
                                                                    {f.name
                                                                        .charAt(
                                                                            0,
                                                                        )
                                                                        .toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <span className="text-[9px] text-[#2B2118]/60 font-body font-semibold max-w-[40px] truncate text-center">
                                                                {f.nickname ||
                                                                    f.name.split(
                                                                        ' ',
                                                                    )[0]}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="border-b border-[#2B2118]/8 mt-3" />
                                        </div>
                                    )}

                                    {/* Loading */}
                                    {friendsLoading && (
                                        <div className="space-y-3">
                                            {[1, 2].map((i) => (
                                                <div
                                                    key={i}
                                                    className="h-20 rounded-2xl bg-[#2B2118]/6 animate-pulse"
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Error */}
                                    {friendsError && !friendsLoading && (
                                        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-600 text-xs font-semibold font-body">
                                            {friendsError}
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {!friendsLoading &&
                                        !friendsError &&
                                        friends.length === 0 &&
                                        friendFormMode === null && (
                                            <div className="flex flex-col items-center py-10 gap-3">
                                                <svg
                                                    width="64"
                                                    height="64"
                                                    viewBox="0 0 64 64"
                                                    fill="none"
                                                    className="opacity-30"
                                                >
                                                    <rect
                                                        x="8"
                                                        y="20"
                                                        width="48"
                                                        height="32"
                                                        rx="6"
                                                        fill="#5C7A52"
                                                    />
                                                    <rect
                                                        x="14"
                                                        y="14"
                                                        width="36"
                                                        height="10"
                                                        rx="4"
                                                        fill="#2B2118"
                                                        opacity="0.5"
                                                    />
                                                    <rect
                                                        x="20"
                                                        y="8"
                                                        width="24"
                                                        height="8"
                                                        rx="3"
                                                        fill="#2B2118"
                                                        opacity="0.3"
                                                    />
                                                    <line
                                                        x1="8"
                                                        y1="32"
                                                        x2="56"
                                                        y2="32"
                                                        stroke="#FBF4EC"
                                                        strokeWidth="2"
                                                        opacity="0.4"
                                                    />
                                                    <circle
                                                        cx="32"
                                                        cy="42"
                                                        r="5"
                                                        fill="#FBF4EC"
                                                        opacity="0.5"
                                                    />
                                                </svg>
                                                <p className="font-display font-bold text-[#2B2118]/40 text-base text-center">
                                                    No friends added yet
                                                </p>
                                                <p className="text-xs text-[#2B2118]/30 font-body text-center">
                                                    Add a friend to split tiffin
                                                    orders!
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        setFriendFormMode(
                                                            'add',
                                                        );
                                                        setFriendFormName('');
                                                        setFriendFormNickname(
                                                            '',
                                                        );
                                                        setFriendFormPhone('');
                                                        setFriendFormError('');
                                                    }}
                                                    className="mt-1 px-5 py-2.5 rounded-xl bg-[#5C7A52] hover:bg-[#5C7A52]/90 text-white text-xs font-bold font-body shadow-[0_6px_20px_rgba(92,122,82,0.25)] transition-all"
                                                >
                                                    + Add your first friend
                                                </button>
                                            </div>
                                        )}

                                    {/* Friends list */}
                                    {!friendsLoading && friends.length > 0 && (
                                        <div className="space-y-3">
                                            {friends.map((friend) => (
                                                <div key={friend._id}>
                                                    {/* Friend card */}
                                                    {(friendFormMode !==
                                                        'edit' ||
                                                        editingFriendId !==
                                                            friend._id) && (
                                                        <div className="bg-white/60 border border-white/50 rounded-2xl px-4 py-3.5 shadow-sm">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-9 h-9 rounded-xl bg-[#5C7A52]/15 border border-[#5C7A52]/20 flex items-center justify-center shrink-0">
                                                                        <span className="text-sm font-display font-bold text-[#5C7A52]">
                                                                            {friend.name
                                                                                .charAt(
                                                                                    0,
                                                                                )
                                                                                .toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-display font-bold text-[#2B2118] text-sm leading-tight truncate">
                                                                            {
                                                                                friend.name
                                                                            }
                                                                            {friend.nickname
                                                                                ? ` (${friend.nickname})`
                                                                                : ''}
                                                                        </p>
                                                                        <p className="text-[11px] text-[#2B2118]/50 font-body mt-0.5">
                                                                            {friend.phone ||
                                                                                'No phone added'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    {/* Edit */}
                                                                    <button
                                                                        onClick={() => {
                                                                            setFriendFormMode(
                                                                                'edit',
                                                                            );
                                                                            setEditingFriendId(
                                                                                friend._id,
                                                                            );
                                                                            setFriendFormName(
                                                                                friend.name,
                                                                            );
                                                                            setFriendFormNickname(
                                                                                friend.nickname ||
                                                                                    '',
                                                                            );
                                                                            setFriendFormPhone(
                                                                                friend.phone ||
                                                                                    '',
                                                                            );
                                                                            setFriendFormError(
                                                                                '',
                                                                            );
                                                                            setDeletingFriendId(
                                                                                null,
                                                                            );
                                                                        }}
                                                                        className="w-8 h-8 rounded-xl bg-[#5C7A52]/10 hover:bg-[#5C7A52]/20 border border-[#5C7A52]/15 flex items-center justify-center text-[#5C7A52] transition-all"
                                                                        title="Edit friend"
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
                                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                    {/* Delete */}
                                                                    <button
                                                                        onClick={() =>
                                                                            setDeletingFriendId(
                                                                                (
                                                                                    prev,
                                                                                ) =>
                                                                                    prev ===
                                                                                    friend._id
                                                                                        ? null
                                                                                        : friend._id,
                                                                            )
                                                                        }
                                                                        className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-400/15 flex items-center justify-center text-red-500 transition-all"
                                                                        title="Delete friend"
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
                                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Inline delete confirmation */}
                                                            {deletingFriendId ===
                                                                friend._id && (
                                                                <div className="mt-3 pt-3 border-t border-red-200/60 flex items-center justify-between gap-2 animate-scale-up">
                                                                    <p className="text-xs text-red-600 font-semibold font-body">
                                                                        Remove{' '}
                                                                        {
                                                                            friend.name
                                                                        }
                                                                        ?
                                                                    </p>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() =>
                                                                                setDeletingFriendId(
                                                                                    null,
                                                                                )
                                                                            }
                                                                            className="px-3 py-1.5 rounded-lg border border-[#2B2118]/15 text-[#2B2118]/60 text-xs font-bold font-body hover:bg-[#2B2118]/5 transition-all"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            onClick={async () => {
                                                                                try {
                                                                                    await api.delete(
                                                                                        `/customer/friends/${friend._id}`,
                                                                                    );
                                                                                    setDeletingFriendId(
                                                                                        null,
                                                                                    );
                                                                                    setFriendsLoading(
                                                                                        true,
                                                                                    );
                                                                                    const r =
                                                                                        await api.get(
                                                                                            '/customer/friends',
                                                                                        );
                                                                                    setFriends(
                                                                                        r
                                                                                            .data
                                                                                            .data
                                                                                            ?.friendProfiles ||
                                                                                            r
                                                                                                .data
                                                                                                .data ||
                                                                                            [],
                                                                                    );
                                                                                } catch {
                                                                                    setFriendsError(
                                                                                        'Could not delete friend',
                                                                                    );
                                                                                } finally {
                                                                                    setFriendsLoading(
                                                                                        false,
                                                                                    );
                                                                                }
                                                                            }}
                                                                            className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold font-body transition-all"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Inline edit form */}
                                                    {friendFormMode ===
                                                        'edit' &&
                                                        editingFriendId ===
                                                            friend._id && (
                                                            <form
                                                                className="bg-white/70 border border-[#5C7A52]/20 rounded-2xl px-4 py-4 shadow-sm space-y-3 animate-scale-up"
                                                                onSubmit={async (
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    if (
                                                                        !friendFormName.trim()
                                                                    ) {
                                                                        setFriendFormError(
                                                                            'Name is required',
                                                                        );
                                                                        return;
                                                                    }
                                                                    setFriendFormSubmitting(
                                                                        true,
                                                                    );
                                                                    setFriendFormError(
                                                                        '',
                                                                    );
                                                                    try {
                                                                        await api.put(
                                                                            `/customer/friends/${friend._id}`,
                                                                            {
                                                                                name: friendFormName,
                                                                                nickname:
                                                                                    friendFormNickname,
                                                                                phone: friendFormPhone,
                                                                            },
                                                                        );
                                                                        setFriendFormMode(
                                                                            null,
                                                                        );
                                                                        setEditingFriendId(
                                                                            null,
                                                                        );
                                                                        setFriendsLoading(
                                                                            true,
                                                                        );
                                                                        const r =
                                                                            await api.get(
                                                                                '/customer/friends',
                                                                            );
                                                                        setFriends(
                                                                            r
                                                                                .data
                                                                                .data
                                                                                ?.friendProfiles ||
                                                                                r
                                                                                    .data
                                                                                    .data ||
                                                                                [],
                                                                        );
                                                                    } catch {
                                                                        setFriendFormError(
                                                                            'Could not update friend',
                                                                        );
                                                                    } finally {
                                                                        setFriendFormSubmitting(
                                                                            false,
                                                                        );
                                                                        setFriendsLoading(
                                                                            false,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C7A52] font-body">
                                                                    Edit Friend
                                                                </p>
                                                                {friendFormError && (
                                                                    <p className="text-xs text-red-600 font-semibold">
                                                                        {
                                                                            friendFormError
                                                                        }
                                                                    </p>
                                                                )}
                                                                {/* Name */}
                                                                <div className="relative w-full">
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            friendFormName
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setFriendFormName(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        onFocus={() =>
                                                                            setFriendFocused(
                                                                                'ef-name',
                                                                            )
                                                                        }
                                                                        onBlur={() =>
                                                                            setFriendFocused(
                                                                                null,
                                                                            )
                                                                        }
                                                                        className="w-full bg-[#FBF4EC]/80 border border-[#2B2118]/15 text-[#2B2118] rounded-xl px-4 pt-5 pb-1.5 text-sm focus:outline-none focus:ring-2 focus:border-[#5C7A52] focus:ring-[#5C7A52]/20 transition-all font-body placeholder-transparent"
                                                                        placeholder="Name"
                                                                    />
                                                                    <label
                                                                        className={`absolute left-4 pointer-events-none font-body transition-all duration-200 ${friendFocused === 'ef-name' || friendFormName ? 'top-1.5 text-[9px] font-bold uppercase tracking-wider text-[#5C7A52]' : 'top-3.5 text-sm text-[#2B2118]/50'}`}
                                                                    >
                                                                        Name *
                                                                    </label>
                                                                </div>
                                                                {/* Nickname */}
                                                                <div className="relative w-full">
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            friendFormNickname
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setFriendFormNickname(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        onFocus={() =>
                                                                            setFriendFocused(
                                                                                'ef-nick',
                                                                            )
                                                                        }
                                                                        onBlur={() =>
                                                                            setFriendFocused(
                                                                                null,
                                                                            )
                                                                        }
                                                                        className="w-full bg-[#FBF4EC]/80 border border-[#2B2118]/15 text-[#2B2118] rounded-xl px-4 pt-5 pb-1.5 text-sm focus:outline-none focus:ring-2 focus:border-[#5C7A52] focus:ring-[#5C7A52]/20 transition-all font-body placeholder-transparent"
                                                                        placeholder="Nickname"
                                                                    />
                                                                    <label
                                                                        className={`absolute left-4 pointer-events-none font-body transition-all duration-200 ${friendFocused === 'ef-nick' || friendFormNickname ? 'top-1.5 text-[9px] font-bold uppercase tracking-wider text-[#5C7A52]' : 'top-3.5 text-sm text-[#2B2118]/50'}`}
                                                                    >
                                                                        Nickname
                                                                        (optional)
                                                                    </label>
                                                                </div>
                                                                {/* Phone */}
                                                                <div className="relative w-full">
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            friendFormPhone
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setFriendFormPhone(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        onFocus={() =>
                                                                            setFriendFocused(
                                                                                'ef-phone',
                                                                            )
                                                                        }
                                                                        onBlur={() =>
                                                                            setFriendFocused(
                                                                                null,
                                                                            )
                                                                        }
                                                                        className="w-full bg-[#FBF4EC]/80 border border-[#2B2118]/15 text-[#2B2118] rounded-xl px-4 pt-5 pb-1.5 text-sm focus:outline-none focus:ring-2 focus:border-[#5C7A52] focus:ring-[#5C7A52]/20 transition-all font-body placeholder-transparent"
                                                                        placeholder="Phone"
                                                                    />
                                                                    <label
                                                                        className={`absolute left-4 pointer-events-none font-body transition-all duration-200 ${friendFocused === 'ef-phone' || friendFormPhone ? 'top-1.5 text-[9px] font-bold uppercase tracking-wider text-[#5C7A52]' : 'top-3.5 text-sm text-[#2B2118]/50'}`}
                                                                    >
                                                                        Phone
                                                                        (optional)
                                                                    </label>
                                                                </div>
                                                                <div className="flex gap-2 pt-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setFriendFormMode(
                                                                                null,
                                                                            );
                                                                            setEditingFriendId(
                                                                                null,
                                                                            );
                                                                        }}
                                                                        className="flex-1 py-2.5 rounded-xl border border-[#2B2118]/15 text-[#2B2118]/60 hover:text-[#2B2118] hover:bg-[#2B2118]/5 text-xs font-bold font-body transition-all"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        type="submit"
                                                                        disabled={
                                                                            friendFormSubmitting
                                                                        }
                                                                        className="flex-1 py-2.5 rounded-xl bg-[#5C7A52] hover:bg-[#5C7A52]/90 text-white text-xs font-bold font-body shadow-[0_4px_15px_rgba(92,122,82,0.25)] transition-all disabled:opacity-50"
                                                                    >
                                                                        {friendFormSubmitting
                                                                            ? 'Saving…'
                                                                            : 'Save Changes'}
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Inline Add Friend form */}
                                    {friendFormMode === 'add' && (
                                        <form
                                            className="bg-white/70 border border-[#5C7A52]/25 rounded-2xl px-4 py-4 shadow-sm space-y-3 animate-scale-up"
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                if (!friendFormName.trim()) {
                                                    setFriendFormError(
                                                        'Name is required',
                                                    );
                                                    return;
                                                }
                                                setFriendFormSubmitting(true);
                                                setFriendFormError('');
                                                try {
                                                    await api.post(
                                                        '/customer/friends',
                                                        {
                                                            name: friendFormName,
                                                            nickname:
                                                                friendFormNickname,
                                                            phone: friendFormPhone,
                                                        },
                                                    );
                                                    setFriendFormMode(null);
                                                    setFriendsLoading(true);
                                                    const r =
                                                        await api.get(
                                                            '/customer/friends',
                                                        );
                                                    setFriends(
                                                        r.data.data
                                                            ?.friendProfiles ||
                                                            r.data.data ||
                                                            [],
                                                    );
                                                } catch {
                                                    setFriendFormError(
                                                        'Could not add friend. Please try again.',
                                                    );
                                                } finally {
                                                    setFriendFormSubmitting(
                                                        false,
                                                    );
                                                    setFriendsLoading(false);
                                                }
                                            }}
                                        >
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C7A52] font-body">
                                                New Friend
                                            </p>
                                            {friendFormError && (
                                                <p className="text-xs text-red-600 font-semibold font-body">
                                                    {friendFormError}
                                                </p>
                                            )}
                                            <div className="relative w-full">
                                                <input
                                                    type="text"
                                                    value={friendFormName}
                                                    onChange={(e) =>
                                                        setFriendFormName(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onFocus={() =>
                                                        setFriendFocused(
                                                            'af-name',
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        setFriendFocused(null)
                                                    }
                                                    className="w-full bg-[#FBF4EC]/80 border border-[#2B2118]/15 text-[#2B2118] rounded-xl px-4 pt-5 pb-1.5 text-sm focus:outline-none focus:ring-2 focus:border-[#5C7A52] focus:ring-[#5C7A52]/20 transition-all font-body placeholder-transparent"
                                                    placeholder="Name"
                                                    autoFocus
                                                />
                                                <label
                                                    className={`absolute left-4 pointer-events-none font-body transition-all duration-200 ${friendFocused === 'af-name' || friendFormName ? 'top-1.5 text-[9px] font-bold uppercase tracking-wider text-[#5C7A52]' : 'top-3.5 text-sm text-[#2B2118]/50'}`}
                                                >
                                                    Name *
                                                </label>
                                            </div>
                                            <div className="relative w-full">
                                                <input
                                                    type="text"
                                                    value={friendFormNickname}
                                                    onChange={(e) =>
                                                        setFriendFormNickname(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onFocus={() =>
                                                        setFriendFocused(
                                                            'af-nick',
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        setFriendFocused(null)
                                                    }
                                                    className="w-full bg-[#FBF4EC]/80 border border-[#2B2118]/15 text-[#2B2118] rounded-xl px-4 pt-5 pb-1.5 text-sm focus:outline-none focus:ring-2 focus:border-[#5C7A52] focus:ring-[#5C7A52]/20 transition-all font-body placeholder-transparent"
                                                    placeholder="Nickname"
                                                />
                                                <label
                                                    className={`absolute left-4 pointer-events-none font-body transition-all duration-200 ${friendFocused === 'af-nick' || friendFormNickname ? 'top-1.5 text-[9px] font-bold uppercase tracking-wider text-[#5C7A52]' : 'top-3.5 text-sm text-[#2B2118]/50'}`}
                                                >
                                                    Nickname (optional)
                                                </label>
                                            </div>
                                            <div className="relative w-full">
                                                <input
                                                    type="text"
                                                    value={friendFormPhone}
                                                    onChange={(e) =>
                                                        setFriendFormPhone(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onFocus={() =>
                                                        setFriendFocused(
                                                            'af-phone',
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        setFriendFocused(null)
                                                    }
                                                    className="w-full bg-[#FBF4EC]/80 border border-[#2B2118]/15 text-[#2B2118] rounded-xl px-4 pt-5 pb-1.5 text-sm focus:outline-none focus:ring-2 focus:border-[#5C7A52] focus:ring-[#5C7A52]/20 transition-all font-body placeholder-transparent"
                                                    placeholder="Phone"
                                                />
                                                <label
                                                    className={`absolute left-4 pointer-events-none font-body transition-all duration-200 ${friendFocused === 'af-phone' || friendFormPhone ? 'top-1.5 text-[9px] font-bold uppercase tracking-wider text-[#5C7A52]' : 'top-3.5 text-sm text-[#2B2118]/50'}`}
                                                >
                                                    Phone (optional)
                                                </label>
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setFriendFormMode(null)
                                                    }
                                                    className="flex-1 py-2.5 rounded-xl border border-[#2B2118]/15 text-[#2B2118]/60 hover:text-[#2B2118] hover:bg-[#2B2118]/5 text-xs font-bold font-body transition-all"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={
                                                        friendFormSubmitting
                                                    }
                                                    className="flex-1 py-2.5 rounded-xl bg-[#5C7A52] hover:bg-[#5C7A52]/90 text-white text-xs font-bold font-body shadow-[0_4px_15px_rgba(92,122,82,0.25)] transition-all disabled:opacity-50"
                                                >
                                                    {friendFormSubmitting
                                                        ? 'Adding…'
                                                        : '+ Add Friend'}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Add Friend button (when list exists and form not open) */}
                                    {!friendsLoading &&
                                        friendFormMode === null &&
                                        friends.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    setFriendFormMode('add');
                                                    setFriendFormName('');
                                                    setFriendFormNickname('');
                                                    setFriendFormPhone('');
                                                    setFriendFormError('');
                                                }}
                                                className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#5C7A52]/30 hover:border-[#5C7A52]/60 text-[#5C7A52] text-sm font-bold font-body transition-all duration-200 flex items-center justify-center gap-2 hover:bg-[#5C7A52]/5"
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
                                                        d="M12 4v16m8-8H4"
                                                    />
                                                </svg>
                                                Add Friend
                                            </button>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
