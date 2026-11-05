'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Building2,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  ImageIcon,
  X,
  Clock,
} from 'lucide-react';

// ── Indian States ────────────────────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli and Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

// ── Field component helpers ──────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

function inputCls(extra = '') {
  return `w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:bg-white transition-all ${extra}`;
}

// ── Upload to ImageKit client-side with real XHR progress ───────────────────
async function uploadToImageKit(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  // 1. Fetch auth token from our secure backend
  const tokenRes = await fetch('/api/imagekit/upload-token');
  if (!tokenRes.ok) throw new Error('Could not get upload token.');
  const { token, expire, signature, publicKey } = await tokenRes.json();

  const fileName = `business_doc_${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('fileName', fileName);
  fd.append('folder', '/business-docs');
  fd.append('useUniqueFileName', 'true');
  fd.append('tags', 'business-registration,verification');
  fd.append('publicKey', publicKey);
  fd.append('signature', signature);
  fd.append('expire', String(expire));
  fd.append('token', token);

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.max(1, Math.min(99, Math.round((evt.loaded / evt.total) * 100)));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            onProgress(100);
            resolve(data.url);
          } else {
            reject(new Error('Upload succeeded but no URL returned.'));
          }
        } catch {
          reject(new Error('Invalid response from upload server.'));
        }
      } else {
        reject(new Error(`ImageKit upload failed (HTTP ${xhr.status}).`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during photo upload.'));
    xhr.send(fd);
  });
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function BusinessRegisterPage() {
  // Personal info
  const [fullName, setFullName]   = useState('');
  const [mobile, setMobile]       = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Address
  const [shopAddress, setShopAddress] = useState('');
  const [landmark, setLandmark]       = useState('');
  const [city, setCity]               = useState('');
  const [state, setState]             = useState('');
  const [pincode, setPincode]         = useState('');

  // Business type (default to retail_store)
  const [businessType, setBusinessType] = useState<'retail_store' | 'hawker'>('retail_store');
  const [hasGstin, setHasGstin]         = useState(false);
  const [gstin, setGstin]               = useState('');

  // ── FIX: Separate state per business type (no bleed across tabs) ──
  const [retailDocFile, setRetailDocFile]           = useState<File | null>(null);
  const [retailDocPreview, setRetailDocPreview]     = useState<string | null>(null);
  const [retailUploadedUrl, setRetailUploadedUrl]   = useState<string | null>(null);
  const [retailProgress, setRetailProgress]         = useState<number>(0);
  const [retailUploading, setRetailUploading]       = useState<boolean>(false);

  const [hawkerDocFile, setHawkerDocFile]           = useState<File | null>(null);
  const [hawkerDocPreview, setHawkerDocPreview]     = useState<string | null>(null);
  const [hawkerUploadedUrl, setHawkerUploadedUrl]   = useState<string | null>(null);
  const [hawkerProgress, setHawkerProgress]         = useState<number>(0);
  const [hawkerUploading, setHawkerUploading]       = useState<boolean>(false);

  // Active tab state getters
  const isHawker          = businessType === 'hawker';
  const docFile           = isHawker ? hawkerDocFile        : retailDocFile;
  const docPreview        = isHawker ? hawkerDocPreview     : retailDocPreview;
  const activeUploadedUrl = isHawker ? hawkerUploadedUrl   : retailUploadedUrl;
  const isUploading       = isHawker ? hawkerUploading     : retailUploading;
  const uploadProgress    = isHawker ? hawkerProgress      : retailProgress;

  // ── File input refs (camera + gallery) ──────────────────────────────────
  const cameraInputRef  = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // ── Handle file selection (shared by camera + gallery inputs) ────────────
  async function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setError('Photo must be under 15MB.');
      return;
    }

    setError(null);
    const currentIsHawker = businessType === 'hawker';

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      if (currentIsHawker) {
        setHawkerDocFile(file);
        setHawkerDocPreview(reader.result as string);
      } else {
        setRetailDocFile(file);
        setRetailDocPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Reset upload state for this tab
    if (currentIsHawker) {
      setHawkerUploadedUrl(null);
      setHawkerProgress(0);
      setHawkerUploading(true);
    } else {
      setRetailUploadedUrl(null);
      setRetailProgress(0);
      setRetailUploading(true);
    }

    try {
      const url = await uploadToImageKit(file, (pct) => {
        if (currentIsHawker) setHawkerProgress(pct);
        else setRetailProgress(pct);
      });

      if (currentIsHawker) {
        setHawkerUploadedUrl(url);
        setHawkerProgress(100);
      } else {
        setRetailUploadedUrl(url);
        setRetailProgress(100);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Photo upload failed. Please try again.');
      if (currentIsHawker) {
        setHawkerDocFile(null);
        setHawkerDocPreview(null);
        setHawkerUploadedUrl(null);
        setHawkerProgress(0);
      } else {
        setRetailDocFile(null);
        setRetailDocPreview(null);
        setRetailUploadedUrl(null);
        setRetailProgress(0);
      }
    } finally {
      if (currentIsHawker) setHawkerUploading(false);
      else setRetailUploading(false);
    }
  }

  function removeDoc() {
    if (businessType === 'hawker') {
      setHawkerDocFile(null);
      setHawkerDocPreview(null);
      setHawkerUploadedUrl(null);
      setHawkerProgress(0);
      setHawkerUploading(false);
    } else {
      setRetailDocFile(null);
      setRetailDocPreview(null);
      setRetailUploadedUrl(null);
      setRetailProgress(0);
      setRetailUploading(false);
    }
    if (cameraInputRef.current)  cameraInputRef.current.value  = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!businessType) {
      setError('Please select your business type.');
      return;
    }
    if (!docFile) {
      setError('Please upload a verification document photo.');
      return;
    }
    if (isUploading) {
      setError('Photo is still uploading. Please wait a moment.');
      return;
    }
    if (!activeUploadedUrl) {
      setError('Photo upload did not complete. Please remove and re-upload.');
      return;
    }

    setLoading(true);
    try {
      // ── Send only the already-uploaded URL — no file blob, no blocking ImageKit call ──
      const fd = new FormData();
      fd.append('full_name', fullName);
      fd.append('mobile', mobile);
      fd.append('email', email);
      fd.append('password', password);
      fd.append('shop_address', shopAddress);
      fd.append('landmark', landmark);
      fd.append('city', city);
      fd.append('state', state);
      fd.append('pincode', pincode);
      fd.append('business_type', businessType);
      fd.append('has_gstin', String(hasGstin));
      fd.append('gstin', hasGstin ? gstin : '');
      fd.append('document_url', activeUploadedUrl); // URL string, not a File blob

      const res  = await fetch('/api/business/register', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Success / Pending Screen ──────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
            {/* Clock icon */}
            <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center mx-auto mb-5">
              <Clock size={38} className="text-amber-500" />
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
              Registration Submitted! (पंजीकरण प्राप्त हुआ)
            </h2>
            <p className="text-sm font-semibold text-amber-600 mb-4">
              STATUS: PENDING — Verification Under Review (सत्यापन प्रक्रियाधीन है)
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-left text-xs sm:text-sm text-gray-700 mb-6 space-y-2">
              <p>✅ <strong>Application Received:</strong> आपका आवेदन प्राप्त हो गया है।</p>
              <p>🔍 <strong>Document Verification:</strong> हमारी टीम आपके फोटो और दस्तावेजों की जांच करेगी।</p>
              <p>⏳ <strong>Review Time:</strong> इसमें <strong>24 से 48 घंटे</strong> का समय लगता है।</p>
              <p>📦 <strong>Wholesale Access:</strong> अप्रूवल के बाद आप होलसेल रेट पर सीधे थोक माल खरीद सकेंगे।</p>
            </div>

            <p className="text-xs text-gray-500 mb-6">
              Need help? (मदद चाहिए?){' '}
              <Link href="/contact" className="font-bold text-[#083028] hover:underline">
                Contact Support (सहायता संपर्क)
              </Link>
            </p>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full bg-[#083028] hover:bg-[#051e19] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md text-sm"
            >
              Explore Catalog (कैटलॉग देखें)
              <ArrowRight size={15} />
            </Link>

            <div className="mt-4">
              <Link href="/login" className="text-xs font-bold text-[#083028] hover:underline">
                Already registered? Sign In (पहले से खाता है? लॉगिन करें)
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration Form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10">

          {/* Header */}
          <div className="text-center mb-7">
            <Link href="/" className="inline-block mb-3">
              <div className="relative h-12 w-24 mx-auto">
                <Image
                  src="/home-images/logo.png"
                  alt="AR Garment"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Business Registration
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
              व्यापारी / दुकान पंजीकरण — होलसेल रेट पर कपड़े खरीदने के लिए अपनी दुकान या व्यापार रजिस्टर करें
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Personal Info ── */}
            <p className="text-[10px] font-bold text-[#083028] uppercase tracking-widest border-b border-gray-100 pb-1">
              Personal Details (व्यक्तिगत जानकारी)
            </p>

            {/* Full Name */}
            <div>
              <Label>Full Name / पूरा नाम</Label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="अपना पूरा नाम लिखें (e.g. Ramesh Kumar)"
                  className={inputCls()}
                />
              </div>
            </div>

            {/* Mobile */}
            <div>
              <Label>Mobile Number / 10 अंकों का मोबाइल नंबर</Label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="\d{10}"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10 अंकों का मोबाइल नंबर दर्ज करें"
                  className={inputCls()}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label>Email ID / ईमेल आईडी</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com (यदि नहीं है तो name@gmail.com लिखें)"
                  className={inputCls()}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label>Password / पासवर्ड (कम से कम 6 अक्षर)</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="कम से कम 6 अक्षरों का पासवर्ड बनाएं"
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* ── Address ── */}
            <p className="text-[10px] font-bold text-[#083028] uppercase tracking-widest border-b border-gray-100 pb-1 pt-1">
              Complete Address (दुकान या व्यापार का पूरा पता)
            </p>

            {/* Shop Address */}
            <div>
              <Label>Shop Name / House No. / Gali (दुकान का नाम / मकान नं. / गली / मोहल्ला)</Label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="दुकान का नाम, मकान नंबर, गली या मोहल्ला लिखें"
                  className={inputCls()}
                />
              </div>
            </div>

            {/* Landmark */}
            <div>
              <Label>
                Landmark / लैंडमार्क <span className="text-gray-400 font-normal">(Optional — आसपास की प्रसिद्ध जगह)</span>
              </Label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  maxLength={100}
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="जैसे: मंदिर के पास, मेन मार्केट, अस्पताल के सामने"
                  className={inputCls()}
                />
              </div>
            </div>

            {/* City & State row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City / शहर या कस्बा</Label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="शहर (City)"
                    className={inputCls()}
                  />
                </div>
              </div>
              <div>
                <Label>State / राज्य</Label>
                <select
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:bg-white transition-all font-semibold"
                >
                  <option value="">राज्य चुनें (Select State)</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* PIN Code */}
            <div>
              <Label>6-digit PIN Code / 6 अंकों का पिन कोड</Label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  inputMode="numeric"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 अंकों का पिन कोड लिखें (e.g. 211003)"
                  className={inputCls()}
                />
              </div>
            </div>

            {/* ── Business Type ── */}
            <p className="text-[10px] font-bold text-[#083028] uppercase tracking-widest border-b border-gray-100 pb-1 pt-1">
              Select Business Type (व्यापार का प्रकार चुनें)
            </p>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: 'retail_store', label: 'Retail Store (दुकानदार / रिटेलर)' },
                  { value: 'hawker',       label: 'Hawker (फेरी वाला / ठेला)' },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBusinessType(value)}
                  className={`py-2.5 px-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-150 text-center ${
                    businessType === value
                      ? 'bg-[#083028] text-white border-[#083028] shadow-md'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#083028] hover:text-[#083028]'
                  }`}
                >
                  {label}
                  {businessType === value && ' ✓'}
                </button>
              ))}
            </div>

            {/* ── GSTIN — only for retail store ── */}
            {businessType === 'retail_store' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>GSTIN / GST नंबर (Optional - यदि हो)</Label>
                  <div className="flex gap-2">
                    {(['Yes', 'No'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setHasGstin(opt === 'Yes'); if (opt === 'No') setGstin(''); }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          (opt === 'Yes') === hasGstin
                            ? 'bg-[#083028] text-white border-[#083028]'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-[#083028]'
                        }`}
                      >
                        {opt === 'Yes' ? 'हाँ (Yes)' : 'नहीं (No)'}{(opt === 'Yes') === hasGstin ? ' ✓' : ''}
                      </button>
                    ))}
                  </div>
                </div>
                {hasGstin && (
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="15 अंकों का GSTIN नंबर दर्ज करें"
                    className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:bg-white transition-all font-mono tracking-widest"
                  />
                )}
              </div>
            )}

            {/* ── Document Upload ── */}
            <div>
              <p className="text-[10px] font-bold text-[#083028] uppercase tracking-widest border-b border-gray-100 pb-1 mb-2">
                {businessType === 'hawker'
                  ? 'Verification Photo (सत्यापन फोटो)'
                  : 'Shop / Card Photo (दुकान या विजिटिंग कार्ड की फोटो)'}
              </p>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                {businessType === 'hawker'
                  ? 'फेरी पर जाते समय माल, ठेले या गाड़ी के साथ अपनी फोटो अपलोड करें (Upload photo with goods/cart)'
                  : 'दुकान के बोर्ड के साथ सामने की फोटो या अपना Visiting Card अपलोड करें (Upload shop front or visiting card)'}
              </p>

              {/* ── Upload progress bar (shown while uploading) ── */}
              {isUploading && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[#083028]">फोटो अपलोड हो रही है (Uploading photo)…</span>
                    <span className="text-xs font-bold text-[#083028]">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#083028] h-2 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {docPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={docPreview} alt="Document preview" className="w-full max-h-52 object-contain bg-gray-50" />
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={removeDoc}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <div className={`px-3 py-2 border-t flex items-center gap-2 ${
                    isUploading
                      ? 'bg-blue-50 border-blue-100'
                      : activeUploadedUrl
                      ? 'bg-green-50 border-green-100'
                      : 'bg-red-50 border-red-100'
                  }`}>
                    {isUploading ? (
                      <Loader2 size={14} className="text-blue-600 flex-shrink-0 animate-spin" />
                    ) : activeUploadedUrl ? (
                      <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
                    )}
                    <p className={`text-xs font-medium truncate ${
                      isUploading ? 'text-blue-700' : activeUploadedUrl ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {isUploading
                        ? `अपलोड हो रहा है… ${uploadProgress}%`
                        : activeUploadedUrl
                        ? `फोटो तैयार है: ${docFile?.name}`
                        : 'अपलोड विफल रहा — कृपया दोबारा फोटो चुनें'}
                    </p>
                  </div>
                </div>
              ) : (
                /* ── Two-button upload: Camera + Gallery ── */
                <div className="border-2 border-dashed border-gray-300 hover:border-[#083028] rounded-xl py-6 px-4 transition-all bg-gray-50/50">
                  <div className="flex items-center justify-center mb-2">
                    <Upload size={26} className="text-gray-400" />
                  </div>
                  <p className="text-xs text-center text-gray-700 mb-1 font-bold">
                    Upload Photo / फोटो अपलोड करें
                  </p>
                  <p className="text-[11px] text-center text-gray-400 mb-3">
                    JPG, PNG — अधिकतम 15MB
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Camera button */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#083028] text-[#083028] text-xs font-bold hover:bg-[#083028] hover:text-white transition-all duration-150"
                    >
                      <Camera size={15} />
                      कैमरा (Take Photo)
                    </button>
                    {/* Gallery button */}
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:border-[#083028] hover:text-[#083028] transition-all duration-150"
                    >
                      <ImageIcon size={15} />
                      गैलरी (From Gallery)
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden camera input */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleDocChange}
              />
              {/* Hidden gallery input */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDocChange}
              />
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={loading || isUploading}
              className="w-full mt-3 bg-[#083028] hover:bg-[#051e19] text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting Details... (जमा हो रहा है...)</span>
                </>
              ) : isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Uploading photo… {uploadProgress}% (फोटो अपलोड हो रही है)</span>
                </>
              ) : (
                <>
                  <span>Submit for Verification (सत्यापन के लिए सबमिट करें)</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs sm:text-sm text-gray-600">
            Already registered? (पहले से खाता है?){' '}
            <Link href="/login" className="font-bold text-[#083028] hover:underline">
              Sign In (यहाँ लॉगिन करें)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
