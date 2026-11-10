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
  ChevronDown,
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

// ── Upload to ImageKit client-side with real XHR progress ───────────────────
async function uploadToImageKit(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
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

  // Upload state
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

  const isHawker          = businessType === 'hawker';
  const docFile           = isHawker ? hawkerDocFile        : retailDocFile;
  const docPreview        = isHawker ? hawkerDocPreview     : retailDocPreview;
  const activeUploadedUrl = isHawker ? hawkerUploadedUrl   : retailUploadedUrl;
  const isUploading       = isHawker ? hawkerUploading     : retailUploading;
  const uploadProgress    = isHawker ? hawkerProgress      : retailProgress;

  const cameraInputRef  = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setError('Photo must be under 15MB.');
      return;
    }

    setError(null);
    const currentIsHawker = businessType === 'hawker';

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

    if (!fullName.trim()) {
      setError('Please enter your full name (अपना नाम दर्ज करें).');
      return;
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      setError('Please enter a valid 10-digit mobile number (10 अंकों का मोबाइल नंबर).');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      setError('Please enter a valid email address (वैध ईमेल दर्ज करें).');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters (पासवर्ड कम से कम 6 अक्षरों का हो).');
      return;
    }
    if (!shopAddress.trim()) {
      setError('Please enter complete address / shop name (पता या दुकान का नाम दर्ज करें).');
      return;
    }
    if (!city.trim()) {
      setError('Please enter your city/town (शहर दर्ज करें).');
      return;
    }
    if (!state) {
      setError('Please select your state (राज्य चुनें).');
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      setError('Please enter a valid 6-digit PIN code (6 अंकों का पिन कोड दर्ज करें).');
      return;
    }
    if (hasGstin && gstin.trim().length !== 15) {
      setError('GSTIN must be exactly 15 characters (GSTIN 15 अंकों का होना चाहिए).');
      return;
    }
    if (!activeUploadedUrl) {
      setError(
        businessType === 'hawker'
          ? 'Please upload your photo with goods or vehicle (फेरी का फोटो अपलोड करें).'
          : 'Please upload your visiting card or shop front photo (दुकान या विजिटिंग कार्ड की फोटो).'
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        password,
        shopAddress: shopAddress.trim(),
        landmark: landmark.trim() || null,
        city: city.trim(),
        state,
        pincode: pincode.trim(),
        businessType,
        hasGstin,
        gstin: hasGstin ? gstin.trim().toUpperCase() : null,
        verificationDocUrl: activeUploadedUrl,
      };

      const res = await fetch('/api/business/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please check your details.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Success / Pending Verification Screen (Exact Screenshot 4 UI) ──────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#07090e] bg-[radial-gradient(ellipse_at_top_left,#182740_0%,transparent_50%),radial-gradient(ellipse_at_bottom_left,#182740_0%,transparent_50%),radial-gradient(ellipse_at_top_right,#635123_0%,transparent_55%),radial-gradient(ellipse_at_bottom_right,#635123_0%,transparent_55%)] relative overflow-hidden flex items-center justify-center px-4 py-8 text-white">
        {/* Left Side Navy Blend (#182740) */}
        <div className="pointer-events-none absolute -top-16 -left-16 w-[450px] h-[550px] rounded-full bg-[#182740]/85 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-[450px] h-[550px] rounded-full bg-[#182740]/85 blur-[100px]" />

        {/* Right Side Gold Blend (#635123) */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-[450px] h-[550px] rounded-full bg-[#635123]/80 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 w-[450px] h-[550px] rounded-full bg-[#635123]/70 blur-[100px]" />

        <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto text-center">
          {/* Logo */}
          <Link href="/" className="inline-block mb-3">
            <div className="relative h-14 w-28 mx-auto filter drop-shadow-[0_2px_12px_rgba(245,208,97,0.4)]">
              <Image
                src="/home-images/logo.png"
                alt="AR Garment"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-[10px] tracking-[0.35em] text-[#f5d061] uppercase font-bold mt-1 block">
              A R GARMENT
            </span>
          </Link>

          <h2 className="text-lg font-bold text-white tracking-wide">
            Verification Status
          </h2>
          <p className="text-sm font-semibold text-[#f5d061] mb-6">
            सत्यापन स्थिति
          </p>

          {/* Golden Circular Status Badge (Screenshot 4) */}
          <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/40 animate-pulse shadow-[0_0_35px_rgba(245,208,97,0.35)]" />
            <div className="w-28 h-28 rounded-full border-2 border-amber-400 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-2 shadow-inner">
              <Clock size={32} className="text-[#f5d061] mb-1" />
              <span className="text-[10px] uppercase font-bold text-[#f5d061] leading-tight">
                Verification<br />Pending
              </span>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-wider">
            STATUS: <span className="text-[#f5d061]">PENDING</span>
          </h3>
          <p className="text-xs text-amber-200 font-semibold mb-3">
            (जांच प्रगति पर है)
          </p>

          <p className="text-xs text-gray-300 mb-4 px-2">
            Your registration is under manual review.<br />
            आपका रजिस्ट्रेशन वेरिफिकेशन के लिए पेंडिंग है।
          </p>

          {/* Golden border card with explanation */}
          <div className="rounded-2xl p-4 sm:p-5 border border-amber-500/30 bg-[#0d1624]/60 backdrop-blur-xl text-left text-xs text-gray-200 mb-6 space-y-2 leading-relaxed shadow-[0_0_20px_rgba(245,208,97,0.1)]">
            <p className="text-center text-amber-100 font-medium">
              You can explore the products, but wholesale prices will be visible once your profile is manually verified by the admin within 24 to 48 hours.
            </p>
            <p className="text-center text-amber-300/80 text-[11px] pt-1 border-t border-white/10">
              (आप प्रोडक्ट्स देख सकते हैं, लेकिन आपके प्रोफाइल को एडमिन द्वारा 24 से 48 घंटे में मैन्युअली वेरिफाई किए जाने के बाद ही थोक (wholesale) भाव दिखेंगे।)
            </p>
          </div>

          {/* Cyan Glow Pill Button */}
          <Link
            href="/"
            className="w-full py-3.5 rounded-full font-bold text-sm text-white bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_4px_25px_rgba(6,182,212,0.5)] flex flex-col items-center justify-center"
          >
            <span>Explore Catalog</span>
            <span className="text-[10px] font-normal opacity-90">कैटलॉग देखें</span>
          </Link>

          <div className="mt-5 text-xs text-gray-400">
            Need help?{' '}
            <Link href="/contact" className="text-cyan-400 hover:underline">
              Contact Support / सहायता चाहिए? संपर्क करें
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration Form (Exact Screenshot 2 & 3 UI) ──────────────────────────
  return (
    <div className="min-h-screen bg-[#07090e] bg-[radial-gradient(ellipse_at_top_left,#182740_0%,transparent_50%),radial-gradient(ellipse_at_bottom_left,#182740_0%,transparent_50%),radial-gradient(ellipse_at_top_right,#635123_0%,transparent_55%),radial-gradient(ellipse_at_bottom_right,#635123_0%,transparent_55%)] relative overflow-hidden flex items-center justify-center px-4 py-8 text-white">
      {/* ── Left Side Navy Blend (#182740) ── */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-[450px] h-[550px] rounded-full bg-[#182740]/85 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-[450px] h-[550px] rounded-full bg-[#182740]/85 blur-[100px]" />

      {/* ── Right Side Gold Blend (#635123) ── */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-[450px] h-[550px] rounded-full bg-[#635123]/80 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-[450px] h-[550px] rounded-full bg-[#635123]/70 blur-[100px]" />

      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto">
        
        {/* Header with ARG Logo */}
        <div className="text-center mb-3">
          <Link href="/" className="inline-block">
            <div className="relative h-14 w-28 mx-auto filter drop-shadow-[0_2px_12px_rgba(245,208,97,0.4)]">
              <Image
                src="/home-images/logo.png"
                alt="AR Garment"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-[10px] tracking-[0.35em] text-[#f5d061] uppercase font-bold mt-1 block">
              A R GARMENT
            </span>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide mt-1">
            Business Registration
          </h1>
          <p className="text-xs text-gray-400">
            Step 1 of 2: Business Details
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 bg-red-950/70 border border-red-500/50 text-red-200 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5 backdrop-blur-md">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">

          {/* Full Name */}
          <div>
            <input
              type="text"
              required
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-4 py-2.5 bg-black/40 border border-amber-500/40 rounded-xl text-xs sm:text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]"
            />
          </div>

          {/* Mobile */}
          <div>
            <input
              type="tel"
              required
              maxLength={10}
              pattern="\d{10}"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Mobile Number (+91 | Enter 10-digit mobile"
              className="w-full px-4 py-2.5 bg-black/40 border border-amber-500/40 rounded-xl text-xs sm:text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]"
            />
          </div>

          {/* Email ID */}
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email ID"
              className="w-full px-4 py-2.5 bg-black/40 border border-amber-500/40 rounded-xl text-xs sm:text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]"
            />
          </div>

          {/* Password (Required for account setup) */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create Password (कम से कम 6 अक्षर)"
              className="w-full pl-4 pr-10 py-2.5 bg-black/40 border border-amber-500/40 rounded-xl text-xs sm:text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-300 p-0.5"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* ── Complete Address Box (Exact Screenshot 2 & 3 Cyan Box) ── */}
          <div className="rounded-2xl p-3.5 border border-amber-500/30 bg-[#0d1624]/60 backdrop-blur-xl shadow-[0_0_15px_rgba(6,182,212,0.1)] space-y-2.5">
            <p className="text-xs font-semibold text-[#f5d061]">
              Complete Address (पूरा पता)
            </p>

            <input
              type="text"
              required
              maxLength={200}
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              placeholder="Shop Name / House No. / गली / मोहल्ला"
              className="w-full px-3.5 py-2 bg-black/40 border border-cyan-500/40 rounded-xl text-xs text-white placeholder:text-gray-400 focus:outline-none focus:border-cyan-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]"
            />

            <input
              type="text"
              maxLength={100}
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Landmark / लैंडमार्क (Optional)"
              className="w-full px-3.5 py-2 bg-black/40 border border-cyan-500/40 rounded-xl text-xs text-white placeholder:text-gray-400 focus:outline-none focus:border-cyan-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]"
            />

            <input
              type="text"
              required
              maxLength={80}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City / Town / शहर"
              className="w-full px-3.5 py-2 bg-black/40 border border-cyan-500/40 rounded-xl text-xs text-white placeholder:text-gray-400 focus:outline-none focus:border-cyan-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]"
            />

            <div className="relative">
              <select
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2 bg-black/40 border border-cyan-500/40 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 appearance-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]"
              >
                <option value="" className="bg-[#0d1624] text-gray-400">State / राज्य</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s} className="bg-[#0d1624] text-white">{s}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
            </div>

            <input
              type="text"
              required
              maxLength={6}
              pattern="\d{6}"
              inputMode="numeric"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit PIN Code / पिन कोड"
              className="w-full px-3.5 py-2 bg-black/40 border border-cyan-500/40 rounded-xl text-xs text-white placeholder:text-gray-400 focus:outline-none focus:border-cyan-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]"
            />
          </div>

          {/* ── Select Business Type (Exact Toggle UI in Screenshot 2 & 3) ── */}
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-semibold text-white">
              Select Business Type <span className="text-[#f5d061] text-[11px] font-normal">(बिजनेस का प्रकार चुनें)</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBusinessType('retail_store')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  businessType === 'retail_store'
                    ? 'bg-gradient-to-r from-[#e5a93b] to-[#d6982f] text-black border-amber-400 shadow-[0_2px_10px_rgba(245,208,97,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <span>Retail Store Owner</span>
                {businessType === 'retail_store' && <span>✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setBusinessType('hawker')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  businessType === 'hawker'
                    ? 'bg-gradient-to-r from-[#e5a93b] to-[#d6982f] text-black border-amber-400 shadow-[0_2px_10px_rgba(245,208,97,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <span>Hawker</span>
                {businessType === 'hawker' && <span>✓</span>}
              </button>
            </div>
          </div>

          {/* ── GSTIN Optional (Retail Store Only — Screenshot 3) ── */}
          {businessType === 'retail_store' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#f5d061]">GSTIN (Optional)</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHasGstin(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      hasGstin
                        ? 'bg-gradient-to-r from-[#e5a93b] to-[#d6982f] text-black border-amber-400'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    Yes {hasGstin && '✓'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHasGstin(false); setGstin(''); }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      !hasGstin
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {hasGstin && (
                <input
                  type="text"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="Enter 15-digit GSTIN (if available)"
                  className="w-full px-3.5 py-2 bg-black/40 border border-amber-500/40 rounded-xl text-xs text-white placeholder:text-gray-400 focus:outline-none focus:border-amber-400 font-mono tracking-wider shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]"
                />
              )}
            </div>
          )}

          {/* ── Document Upload Box (Exact Screenshot 2 & 3 UI) ── */}
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-semibold text-white">
              Upload Verification Document
            </p>
            <p className="text-[11px] text-[#f5d061]">
              (वेरिफिकेशन डॉक्यूमेंट अपलोड करें)
            </p>

            {/* Upload Area */}
            <div className="border border-dashed border-amber-400/40 rounded-2xl p-4 bg-[#0d1624]/60 backdrop-blur-xl text-center shadow-[0_0_15px_rgba(245,208,97,0.1)]">
              {docPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-amber-400/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={docPreview} alt="Doc preview" className="w-full max-h-40 object-contain bg-black/50" />
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={removeDoc}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow"
                    >
                      <X size={13} />
                    </button>
                  )}
                  <div className="p-2 bg-black/70 text-[11px] text-amber-200 truncate">
                    {isUploading ? `Uploading ${uploadProgress}%...` : activeUploadedUrl ? 'Document uploaded ✓' : 'Upload failed'}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-white">
                    {businessType === 'hawker'
                      ? 'Upload Photo with Cart, Vehicle, or Goods'
                      : 'Upload Visiting Card or Shop Front Photo'}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {businessType === 'hawker'
                      ? '(फेरी पर जाते समय गाड़ी, ठेले या माल के साथ अपनी फोटो अपलोड करें)'
                      : '(अपनी दुकान का Visiting Card या दुकान के सामने की फोटो अपलोड करें)'}
                  </p>

                  {/* Camera / Upload Icons */}
                  <div className="flex items-center justify-center gap-5 py-1 text-[#f5d061]">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-2 hover:scale-110 transition-transform"
                      title="Take Photo"
                    >
                      <Camera size={26} />
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="p-2 hover:scale-110 transition-transform"
                      title="Upload from Gallery"
                    >
                      <Upload size={26} />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#f5d061]">
                    Tap to Capture or Upload (Max 5MB)
                  </p>
                  <p className="text-[10px] text-gray-400">
                    / कैमरा से फोटो लें या अपलोड करें
                  </p>
                </div>
              )}
            </div>

            {/* Hidden Inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleDocChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleDocChange}
            />
          </div>

          {/* ── Submit for Verification Golden Pill Button ── */}
          <button
            type="submit"
            disabled={loading || isUploading}
            className="w-full py-3.5 rounded-full font-extrabold text-sm text-black bg-gradient-to-r from-[#e5a93b] via-[#f5d061] to-[#d6982f] hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_4px_20px_rgba(245,208,97,0.4)] flex flex-col items-center justify-center disabled:opacity-60 mt-4"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-black" />
                <span>Submitting Details...</span>
              </div>
            ) : isUploading ? (
              <span>Uploading photo... {uploadProgress}%</span>
            ) : (
              <>
                <span>Submit for Verification</span>
                <span className="text-[10px] font-bold opacity-90">सबमिट करें</span>
              </>
            )}
          </button>

          <div className="text-center pt-2 text-xs text-gray-400">
            Already registered?{' '}
            <Link href="/login" className="font-bold text-cyan-400 hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
