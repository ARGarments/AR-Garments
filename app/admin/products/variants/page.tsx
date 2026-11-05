'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Check, Box, Tag, DollarSign, Scale, Percent,
  FileCheck, Shirt, Trash2, Edit2, Plus, Info,
  Search, Layers, ImageIcon, Loader2, Package, Palette,
  Scissors, Ruler, Star, RefreshCw
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

type CustomSpec = {
  label: string;
  value: string;
};

export type VariantFormData = {
  id: string;
  productId: string;
  variantType: 'set_size' | 'individual';
  size: string;
  piecesPerSet: number;
  pricePerPiece: number;
  totalSetPrice: number;
  availableSets: number;
  totalStockPieces: number;
  availablePieces: number;
  weight: string;
  weightUnit: string;
  gstRate: string;
  skuId: string;
  purchasePrice: number;
  hsnCode: string;
  colour: string;
  fabric: string;
  work: string;
  fitShape: string;
  sleeveLength: string;
  length: string;
  occasion: string;
  customSpecifications: CustomSpec[];
};

type ParentProduct = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  image?: string;
  price?: string;
  totalSetPrice?: number;
  pricePerPiece?: number;
  hsnCode?: string;
  fabric?: string;
  weight?: string;
  weightUnit?: string;
  gstRate?: string;
};

const COMMON_HSN_CODES = [
  { code: '6204', desc: "Women's Sarees, Suits, Kurtis, Dress Material (Woven)" },
  { code: '5208', desc: 'Cotton Sarees & Cotton Fabrics' },
  { code: '5407', desc: 'Silk, Georgette, Chiffon & Synthetic Fabrics' },
  { code: '6211', desc: 'Ethnic Dupattas, Shawls & Traditional Wear' },
  { code: '6203', desc: "Men's Kurta, Sherwani & Ethnic Wear" },
  { code: '6209', desc: "Kids' Ethnic Wear & Garments" },
];

const GST_OPTIONS = ['0%', '5%', '12%', '18%', '28%'];

const SIZE_OPTIONS = [
  'Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL',
  'Set of All Sizes (S, M, L, XL, XXL)', 'Unstitched',
];

function inputCls(extra?: string) {
  return `w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#083028]/40 focus:border-[#083028] transition ${extra || ''}`;
}

function FieldLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
      {icon && <span className="text-[#083028]">{icon}</span>}
      {children}
    </label>
  );
}

function SectionCard({ title, subtitle, icon, children, action }: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#083028]/10 flex items-center justify-center text-[#083028]">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5 space-y-4">
        {children}
      </div>
    </div>
  );
}

function VariantPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const queryProductId = searchParams.get('productId') || '';
  const queryVariantId = searchParams.get('variantId') || '';
  const isDraftMode = searchParams.get('draft') === 'true';

  const [products, setProducts] = useState<ParentProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(queryProductId);
  const [selectedProduct, setSelectedProduct] = useState<ParentProduct | null>(null);
  const [existingVariants, setExistingVariants] = useState<VariantFormData[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [autoCopy, setAutoCopy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHsnModal, setShowHsnModal] = useState(false);
  const [newSpecLabel, setNewSpecLabel] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  const [variantForm, setVariantForm] = useState<VariantFormData>({
    id: queryVariantId || `var-${Date.now()}`,
    productId: queryProductId,
    variantType: 'set_size',
    size: 'Free Size',
    piecesPerSet: 6,
    pricePerPiece: 135,
    totalSetPrice: 810,
    availableSets: 25,
    totalStockPieces: 150,
    availablePieces: 150,
    weight: '5',
    weightUnit: 'kg',
    gstRate: '5%',
    skuId: `SKU-${Date.now().toString().slice(-6)}`,
    purchasePrice: 0,
    hsnCode: '6204',
    colour: '',
    fabric: '',
    work: '',
    fitShape: '',
    sleeveLength: '',
    length: '',
    occasion: '',
    customSpecifications: [],
  });

  // Fetch products list
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProducts(data);
            if (queryProductId) {
              const matched = data.find((p: ParentProduct) => String(p.id) === String(queryProductId));
              if (matched) setSelectedProduct(matched);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    }
    loadProducts();
  }, [queryProductId]);

  // Fetch variants when product changes
  useEffect(() => {
    if (!selectedProductId || selectedProductId === 'draft') return;

    async function loadVariants() {
      setLoadingVariants(true);
      try {
        const res = await fetch(`/api/products/${selectedProductId}/variants`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped: VariantFormData[] = data.map((v: Record<string, unknown>) => ({
              id: String(v.id),
              productId: String(v.product_id || selectedProductId),
              variantType: (v.variant_type as 'set_size' | 'individual') || 'set_size',
              size: String(v.size || 'Free Size'),
              piecesPerSet: Number(v.pieces_per_set) || 1,
              pricePerPiece: Number(v.price_per_piece) || 0,
              totalSetPrice: Number(v.total_set_price) || 0,
              availableSets: Number(v.available_sets) || 0,
              totalStockPieces: Number(v.total_stock_pieces) || 0,
              availablePieces: Number(v.available_pieces) || 0,
              weight: String(v.weight || ''),
              weightUnit: String(v.weight_unit || 'kg'),
              gstRate: String(v.gst_rate || '5%'),
              skuId: String(v.sku_id || ''),
              purchasePrice: Number(v.purchase_price) || 0,
              hsnCode: String(v.hsn_code || '6204'),
              colour: String(v.colour || ''),
              fabric: String(v.fabric || ''),
              work: String(v.work || ''),
              fitShape: String(v.fit_shape || ''),
              sleeveLength: String(v.sleeve_length || ''),
              length: String(v.length || ''),
              occasion: String(v.occasion || ''),
              customSpecifications: Array.isArray(v.custom_specifications)
                ? (v.custom_specifications as CustomSpec[])
                : [],
            }));
            setExistingVariants(mapped);

            if (queryVariantId) {
              const toEdit = mapped.find((item) => item.id === queryVariantId);
              if (toEdit) setVariantForm(toEdit);
            }
          }
        }
      } catch (err) {
        console.error('Error loading variants:', err);
      } finally {
        setLoadingVariants(false);
      }
    }
    loadVariants();
  }, [selectedProductId, queryVariantId]);

  const handlePricePerPieceChange = (val: number) => {
    const ppp = Math.max(0, val);
    const tsp = ppp * (variantForm.piecesPerSet || 1);
    setVariantForm((prev) => ({ ...prev, pricePerPiece: ppp, totalSetPrice: tsp }));
  };

  const handlePiecesChange = (val: number) => {
    const pcs = Math.max(1, val);
    const tsp = (variantForm.pricePerPiece || 0) * pcs;
    const totalStock = (variantForm.availableSets || 0) * pcs;
    setVariantForm((prev) => ({
      ...prev,
      piecesPerSet: pcs,
      totalSetPrice: tsp,
      totalStockPieces: totalStock,
      availablePieces: totalStock,
    }));
  };

  const handleAvailableSetsChange = (val: number) => {
    const sets = Math.max(0, val);
    const totalPcs = sets * (variantForm.piecesPerSet || 1);
    setVariantForm((prev) => ({
      ...prev,
      availableSets: sets,
      totalStockPieces: totalPcs,
      availablePieces: totalPcs,
    }));
  };

  const handleVariantTypeToggle = (type: 'set_size' | 'individual') => {
    if (type === 'individual') {
      setVariantForm((prev) => ({
        ...prev,
        variantType: 'individual',
        piecesPerSet: 1,
        totalSetPrice: prev.pricePerPiece,
        availablePieces: prev.totalStockPieces,
      }));
    } else {
      setVariantForm((prev) => {
        const pcs = prev.piecesPerSet > 1 ? prev.piecesPerSet : 6;
        return {
          ...prev,
          variantType: 'set_size',
          piecesPerSet: pcs,
          totalSetPrice: prev.pricePerPiece * pcs,
          totalStockPieces: prev.availableSets * pcs,
          availablePieces: prev.availableSets * pcs,
        };
      });
    }
  };

  const addCustomSpec = () => {
    if (!newSpecLabel.trim() || !newSpecValue.trim()) return;
    setVariantForm((prev) => ({
      ...prev,
      customSpecifications: [
        ...prev.customSpecifications,
        { label: newSpecLabel.trim(), value: newSpecValue.trim() },
      ],
    }));
    setNewSpecLabel('');
    setNewSpecValue('');
  };

  const removeCustomSpec = (index: number) => {
    setVariantForm((prev) => ({
      ...prev,
      customSpecifications: prev.customSpecifications.filter((_, i) => i !== index),
    }));
  };

  const handleAddVariant = () => {
    // Clone current form data as new variant (reset SKU and Size)
    if (autoCopy) {
      setVariantForm((prev) => ({
        ...prev,
        id: `var-${Date.now()}`,
        skuId: `SKU-${Date.now().toString().slice(-6)}`,
        size: 'Free Size',
      }));
    } else {
      setVariantForm((prev) => ({
        ...prev,
        id: `var-${Date.now()}`,
        skuId: `SKU-${Date.now().toString().slice(-6)}`,
        size: 'Free Size',
        piecesPerSet: 6,
        pricePerPiece: 0,
        totalSetPrice: 0,
        availableSets: 0,
        totalStockPieces: 0,
        availablePieces: 0,
        weight: '',
        purchasePrice: 0,
        colour: '',
        fabric: '',
        work: '',
        fitShape: '',
        sleeveLength: '',
        length: '',
        occasion: '',
        customSpecifications: [],
      }));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('New variant form ready. Fill in the details and save.');
  };

  const handleSave = async () => {
    if (!selectedProductId && !isDraftMode) {
      toast.error('Please select a parent product.');
      return;
    }

    setSaving(true);
    try {
      if (selectedProductId && selectedProductId !== 'draft') {
        const payload = {
          variant_type: variantForm.variantType,
          size: variantForm.size,
          pieces_per_set: variantForm.piecesPerSet,
          price_per_piece: variantForm.pricePerPiece,
          total_set_price: variantForm.totalSetPrice,
          available_sets: variantForm.availableSets,
          total_stock_pieces: variantForm.totalStockPieces,
          available_pieces: variantForm.availablePieces,
          weight: variantForm.weight,
          weight_unit: variantForm.weightUnit,
          gst_rate: variantForm.gstRate,
          sku_id: variantForm.skuId,
          purchase_price: variantForm.purchasePrice,
          hsn_code: variantForm.hsnCode,
          colour: variantForm.colour,
          fabric: variantForm.fabric,
          work: variantForm.work,
          fit_shape: variantForm.fitShape,
          sleeve_length: variantForm.sleeveLength,
          length: variantForm.length,
          occasion: variantForm.occasion,
          custom_specifications: variantForm.customSpecifications,
        };

        const res = await fetch(`/api/products/${selectedProductId}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to save variant.');
        }

        toast.success('Product variant saved successfully!', { title: 'Variant Saved' });
        router.push('/admin/products');
      } else {
        const existingDraftStr = sessionStorage.getItem('ar_draft_variants') || '[]';
        let draftList: VariantFormData[] = [];
        try { draftList = JSON.parse(existingDraftStr); } catch { draftList = []; }
        draftList.push({ ...variantForm, id: `var-${Date.now()}` });
        sessionStorage.setItem('ar_draft_variants', JSON.stringify(draftList));
        toast.success('Variant added to product draft!', { title: 'Draft Variant Saved' });
        router.push('/admin/products');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving variant.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;
    try {
      const res = await fetch(`/api/products/${selectedProductId}/variants?variant_id=${variantId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setExistingVariants((prev) => prev.filter((v) => v.id !== variantId));
        toast.success('Variant deleted.');
      } else {
        toast.error('Failed to delete variant.');
      }
    } catch {
      toast.error('Network error deleting variant.');
    }
  };

  const isSetSize = variantForm.variantType === 'set_size';

  return (
    <div className="min-h-screen bg-gray-50/60 pb-32">
      {/* ══════════════ TOP BAR ══════════════ */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft size={14} />
            Back to Products
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.info('Saved as draft')}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#083028] text-[#083028] rounded-xl text-xs font-semibold hover:bg-emerald-50 transition"
          >
            <Star size={13} />
            Save as Draft
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#083028] text-white rounded-xl text-xs font-bold hover:bg-[#051e19] transition disabled:opacity-60"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Publish Product
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Page Title */}
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Add New Product</h1>
          <p className="text-xs text-gray-500 mt-0.5">Fill in the details below to add a new product to your store.</p>
        </div>

        {/* ══════════════ VARIANT TYPE TOGGLE ══════════════ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-sm font-bold text-gray-900 whitespace-nowrap">Variant Type:</span>
            <div className="flex items-center gap-3">
              {/* Inventory (N) */}
              <button
                type="button"
                onClick={() => handleVariantTypeToggle('individual')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 text-sm font-bold transition ${
                  !isSetSize
                    ? 'bg-[#083028] border-[#083028] text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!isSetSize ? 'border-white bg-white' : 'border-gray-400'}`}>
                  {!isSetSize && <span className="w-2 h-2 rounded-full bg-[#083028] block" />}
                </span>
                <Package size={16} />
                Inventory (N)
              </button>

              {/* Set Size */}
              <button
                type="button"
                onClick={() => handleVariantTypeToggle('set_size')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 text-sm font-bold transition ${
                  isSetSize
                    ? 'bg-[#083028] border-[#083028] text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSetSize ? 'border-white bg-white' : 'border-gray-400'}`}>
                  {isSetSize && <span className="w-2 h-2 rounded-full bg-[#083028] block" />}
                </span>
                <Layers size={16} />
                Set Size
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════ PRODUCT DETAILS CARD ══════════════ */}
        <SectionCard
          title="Product Details *"
          subtitle="Basic product information"
          icon={<Shirt size={18} />}
        >
          {/* Select product row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel><span className="text-red-500 mr-0.5">*</span> Parent Category</FieldLabel>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setSelectedProductId(pid);
                  const found = products.find((p) => String(p.id) === String(pid));
                  setSelectedProduct(found || null);
                  if (found) {
                    setVariantForm((prev) => ({
                      ...prev,
                      productId: pid,
                      hsnCode: found.hsnCode || prev.hsnCode,
                      weight: found.weight || prev.weight,
                      weightUnit: found.weightUnit || prev.weightUnit,
                      gstRate: found.gstRate || prev.gstRate,
                      fabric: found.fabric || prev.fabric,
                    }));
                  }
                }}
                className={inputCls()}
              >
                <option value="">Parent Category *</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel><span className="text-red-500 mr-0.5">*</span> Subcategory</FieldLabel>
              <select className={inputCls()}>
                <option value="">Select subcategory</option>
                {selectedProduct && <option value={selectedProduct.subcategory || ''}>{selectedProduct.subcategory || selectedProduct.category}</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Brand</FieldLabel>
              <select className={inputCls()}>
                <option value="">Select brand</option>
                <option value="ar">AR Garments</option>
              </select>
            </div>
            <div>
              <FieldLabel><span className="text-red-500 mr-0.5">*</span> Product Name</FieldLabel>
              <input
                type="text"
                placeholder="Enter product name"
                defaultValue={selectedProduct?.name || ''}
                className={inputCls()}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <FieldLabel><span className="text-red-500 mr-0.5">*</span> Product Description</FieldLabel>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
                {['B', 'I', 'U'].map((f) => (
                  <button key={f} type="button" className={`w-7 h-7 rounded text-xs font-bold text-gray-700 hover:bg-gray-200 transition ${f === 'B' ? 'font-black' : f === 'I' ? 'italic' : 'underline'}`}>
                    {f}
                  </button>
                ))}
                <div className="w-px h-5 bg-gray-300 mx-1" />
                {['🔗', '⭐', '≡', '☰', '⇤', '⇥', '⊟'].map((icon, i) => (
                  <button key={i} type="button" className="w-7 h-7 rounded text-xs text-gray-600 hover:bg-gray-200 transition">
                    {icon}
                  </button>
                ))}
              </div>
              <textarea
                rows={4}
                placeholder="Write product description here..."
                className="w-full px-4 py-3 text-sm text-gray-700 focus:outline-none resize-none"
              />
              <div className="px-3 py-1.5 border-t border-gray-100 text-right text-[10px] text-gray-400">0 / 8000</div>
            </div>
          </div>

          {/* Images & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <FieldLabel>Product Images</FieldLabel>
              <div className="flex gap-3 items-stretch">
                {/* Main upload */}
                <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center py-5 px-3 text-center cursor-pointer hover:border-[#083028] transition bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-[#083028]/10 flex items-center justify-center mb-2">
                    <ImageIcon size={20} className="text-[#083028]" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">Upload Product Image</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Click to upload or drag and drop (.JPG, .PNG, .WEBP - Max 1mb)</p>
                </div>
                {/* Add more */}
                <div className="flex flex-col gap-2">
                  <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#083028] transition bg-gray-50 text-gray-400">
                    <ImageIcon size={18} />
                  </div>
                  <button type="button" className="px-2 py-1.5 border border-[#083028] text-[#083028] rounded-xl text-[10px] font-bold hover:bg-emerald-50 transition flex items-center gap-1">
                    <Plus size={11} /> Add More Images
                  </button>
                </div>
              </div>
            </div>

            <div>
              <FieldLabel><span className="text-red-500 mr-0.5">*</span> Size</FieldLabel>
              <select
                value={variantForm.size}
                onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                className={inputCls()}
              >
                {SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">Choose product size</p>

              {/* Show selected product preview */}
              {selectedProduct && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                  {selectedProduct.image ? (
                    <div className="w-10 h-12 relative bg-white rounded border border-emerald-200 overflow-hidden flex-shrink-0">
                      <Image src={selectedProduct.image} alt={selectedProduct.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-12 bg-white rounded border border-emerald-200 flex items-center justify-center flex-shrink-0">
                      <ImageIcon size={16} className="text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{selectedProduct.name}</p>
                    <p className="text-[10px] text-emerald-800 font-semibold">{selectedProduct.category}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ══════════════ PRODUCT SPECIFICATIONS ══════════════ */}
        <SectionCard
          title="Product Specifications"
          subtitle="Add product specifications for this product."
          icon={<Tag size={18} />}
          action={
            <button
              type="button"
              onClick={() => {
                const label = prompt('Specification label (e.g. Pattern):');
                const value = prompt('Specification value:');
                if (label && value) {
                  setVariantForm((prev) => ({
                    ...prev,
                    customSpecifications: [...prev.customSpecifications, { label, value }],
                  }));
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#083028] text-[#083028] rounded-xl text-xs font-bold hover:bg-emerald-50 transition"
            >
              <Plus size={13} /> Add Specification
            </button>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <FieldLabel icon={<Scissors size={13} />}>Fabric</FieldLabel>
              <input
                type="text"
                value={variantForm.fabric}
                onChange={(e) => setVariantForm({ ...variantForm, fabric: e.target.value })}
                placeholder="e.g. Cotton Blend"
                className={inputCls()}
              />
            </div>
            <div>
              <FieldLabel icon={<Palette size={13} />}>Colour</FieldLabel>
              <input
                type="text"
                value={variantForm.colour}
                onChange={(e) => setVariantForm({ ...variantForm, colour: e.target.value })}
                placeholder="e.g. Black"
                className={inputCls()}
              />
            </div>
            <div>
              <FieldLabel icon={<Star size={13} />}>Work</FieldLabel>
              <input
                type="text"
                value={variantForm.work}
                onChange={(e) => setVariantForm({ ...variantForm, work: e.target.value })}
                placeholder="e.g. Printed"
                className={inputCls()}
              />
            </div>
            <div>
              <FieldLabel icon={<Ruler size={13} />}>Length</FieldLabel>
              <input
                type="text"
                value={variantForm.length}
                onChange={(e) => setVariantForm({ ...variantForm, length: e.target.value })}
                placeholder="e.g. Standard Length"
                className={inputCls()}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel icon={<Star size={13} />}>Occasion</FieldLabel>
              <input
                type="text"
                value={variantForm.occasion}
                onChange={(e) => setVariantForm({ ...variantForm, occasion: e.target.value })}
                placeholder="e.g. Casual/Wedding"
                className={inputCls()}
              />
            </div>
            <div>
              <FieldLabel icon={<Shirt size={13} />}>Fit / Shape</FieldLabel>
              <input
                type="text"
                value={variantForm.fitShape}
                onChange={(e) => setVariantForm({ ...variantForm, fitShape: e.target.value })}
                placeholder="e.g. Regular Fit"
                className={inputCls()}
              />
            </div>
            <div>
              <FieldLabel icon={<Scissors size={13} />}>Sleeve Length</FieldLabel>
              <input
                type="text"
                value={variantForm.sleeveLength}
                onChange={(e) => setVariantForm({ ...variantForm, sleeveLength: e.target.value })}
                placeholder="e.g. Half Sleeve"
                className={inputCls()}
              />
            </div>
          </div>

          {/* Custom Specs */}
          {variantForm.customSpecifications.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {variantForm.customSpecifications.map((spec, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                  <div>
                    <span className="font-bold text-gray-800">{spec.label}:</span>{' '}
                    <span className="text-gray-600">{spec.value}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomSpec(index)}
                    className="p-1 text-red-400 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick add spec row */}
          <div className="grid grid-cols-5 gap-2 items-center">
            <input
              type="text"
              value={newSpecLabel}
              onChange={(e) => setNewSpecLabel(e.target.value)}
              placeholder="Label (e.g. Pattern)"
              className={`${inputCls()} col-span-2`}
            />
            <input
              type="text"
              value={newSpecValue}
              onChange={(e) => setNewSpecValue(e.target.value)}
              placeholder="Value"
              className={`${inputCls()} col-span-2`}
            />
            <button
              type="button"
              onClick={addCustomSpec}
              className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <Plus size={13} /> Add
            </button>
          </div>
        </SectionCard>

        {/* ══════════════ MAIN PRODUCT INFO (CONDITIONAL) ══════════════ */}
        <SectionCard
          title="Main Product Info"
          subtitle="Set cost, stock, weight and other details for this product."
          icon={<Box size={18} />}
        >
          {isSetSize ? (
            /* ── SET SIZE MODE ── */
            <>
              {/* Row 1: SKU | Pieces Per Set | Price Per Piece */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <FieldLabel icon={<Tag size={13} />}>SKU ID (Item Code)</FieldLabel>
                  <input
                    type="text"
                    value={variantForm.skuId}
                    onChange={(e) => setVariantForm({ ...variantForm, skuId: e.target.value })}
                    placeholder="e.g. ARG-KURTI-001-M"
                    className={inputCls('font-mono')}
                  />
                </div>
                <div>
                  <FieldLabel icon={<Box size={13} />}>Pieces Per Set</FieldLabel>
                  <input
                    type="number"
                    min="1"
                    value={variantForm.piecesPerSet}
                    onChange={(e) => handlePiecesChange(parseInt(e.target.value) || 1)}
                    placeholder="e.g. 9, 12, 18, 24"
                    className={inputCls()}
                  />
                </div>
                <div>
                  <FieldLabel icon={<DollarSign size={13} />}>Price Per Piece (₹)</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    value={variantForm.pricePerPiece || ''}
                    onChange={(e) => handlePricePerPieceChange(parseFloat(e.target.value) || 0)}
                    placeholder="Enter price per piece"
                    className={inputCls()}
                  />
                </div>
              </div>

              {/* Row 2: Total Set Price | Total Stock | Purchase Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <FieldLabel icon={<DollarSign size={13} />}>Total Set Price</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">₹</span>
                    <div className={`${inputCls('pl-8 bg-emerald-50/60 font-bold text-emerald-800 cursor-not-allowed')} flex items-center`}>
                      {variantForm.totalSetPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">({variantForm.piecesPerSet} pcs × ₹{variantForm.pricePerPiece})</p>
                </div>
                <div>
                  <FieldLabel icon={<Box size={13} />}>Total Stock (Pieces)</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    value={variantForm.availableSets}
                    onChange={(e) => handleAvailableSetsChange(parseInt(e.target.value) || 0)}
                    placeholder="e.g. 0"
                    className={inputCls()}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">({variantForm.piecesPerSet} pcs × {variantForm.availableSets} sets)</p>
                </div>
                <div>
                  <FieldLabel icon={<DollarSign size={13} />}>Purchase Price (₹)</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={variantForm.purchasePrice || ''}
                      onChange={(e) => setVariantForm({ ...variantForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter purchase price"
                      className={inputCls('pl-8')}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Total rate available in stock.</p>
                </div>
              </div>

              {/* Row 3: Weight | GST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel icon={<Scale size={13} />}>Weight</FieldLabel>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={variantForm.weight}
                      onChange={(e) => setVariantForm({ ...variantForm, weight: e.target.value })}
                      placeholder="Enter weight (e.g. fl)"
                      className={inputCls('flex-1')}
                    />
                    <select
                      value={variantForm.weightUnit}
                      onChange={(e) => setVariantForm({ ...variantForm, weightUnit: e.target.value })}
                      className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#083028]/40"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>
                <div>
                  <FieldLabel icon={<Percent size={13} />}>GST (%)</FieldLabel>
                  <select
                    value={variantForm.gstRate}
                    onChange={(e) => setVariantForm({ ...variantForm, gstRate: e.target.value })}
                    className={inputCls()}
                  >
                    {GST_OPTIONS.map((g) => (
                      <option key={g} value={g}>Select GST rate ({g})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">Select GST rate (p.g. 5%, 12%, 16%, 28%)</p>
                </div>
              </div>
            </>
          ) : (
            /* ── INVENTORY (N) MODE ── */
            <>
              {/* Row 1: SKU | Price Per Piece | Purchase Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <FieldLabel icon={<Tag size={13} />}>SKU ID (Item Code)</FieldLabel>
                  <input
                    type="text"
                    value={variantForm.skuId}
                    onChange={(e) => setVariantForm({ ...variantForm, skuId: e.target.value })}
                    placeholder="e.g. ARG-KURTI-001-M"
                    className={inputCls('font-mono')}
                  />
                </div>
                <div>
                  <FieldLabel icon={<DollarSign size={13} />}>Price Per Piece (₹)</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    value={variantForm.pricePerPiece || ''}
                    onChange={(e) => handlePricePerPieceChange(parseFloat(e.target.value) || 0)}
                    placeholder="Enter price price"
                    className={inputCls()}
                  />
                </div>
                <div>
                  <FieldLabel icon={<DollarSign size={13} />}>Purchase Price (₹)</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={variantForm.purchasePrice || ''}
                      onChange={(e) => setVariantForm({ ...variantForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter purchase price"
                      className={inputCls('pl-8')}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Total Stock | Weight | GST */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <FieldLabel icon={<Box size={13} />}>Total Stock (Pieces)</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    value={variantForm.totalStockPieces || ''}
                    onChange={(e) => setVariantForm({ ...variantForm, totalStockPieces: parseInt(e.target.value) || 0, availablePieces: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 0"
                    className={inputCls()}
                  />
                </div>
                <div>
                  <FieldLabel icon={<Scale size={13} />}>Weight</FieldLabel>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={variantForm.weight}
                      onChange={(e) => setVariantForm({ ...variantForm, weight: e.target.value })}
                      placeholder="Enter weight (e.g. fl)"
                      className={inputCls('flex-1')}
                    />
                    <select
                      value={variantForm.weightUnit}
                      onChange={(e) => setVariantForm({ ...variantForm, weightUnit: e.target.value })}
                      className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#083028]/40"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>
                <div>
                  <FieldLabel icon={<Percent size={13} />}>GST (%)</FieldLabel>
                  <select
                    value={variantForm.gstRate}
                    onChange={(e) => setVariantForm({ ...variantForm, gstRate: e.target.value })}
                    className={inputCls()}
                  >
                    {GST_OPTIONS.map((g) => (
                      <option key={g} value={g}>Select GST rate ({g})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Weight again (in inventory, weight shown again at bottom per screenshot) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <FieldLabel icon={<Scale size={13} />}>Weight</FieldLabel>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={variantForm.weight}
                      onChange={(e) => setVariantForm({ ...variantForm, weight: e.target.value })}
                      placeholder="Enter weight (e.g. fl)"
                      className={inputCls('flex-1')}
                    />
                    <select
                      value={variantForm.weightUnit}
                      onChange={(e) => setVariantForm({ ...variantForm, weightUnit: e.target.value })}
                      className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>
                <div>
                  <FieldLabel icon={<Percent size={13} />}>GST (%)</FieldLabel>
                  <select
                    value={variantForm.gstRate}
                    onChange={(e) => setVariantForm({ ...variantForm, gstRate: e.target.value })}
                    className={inputCls()}
                  >
                    {GST_OPTIONS.map((g) => (
                      <option key={g} value={g}>Select GST rate ({g})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">Select GST rate (p.g. 5%, 12%, 16%, 28%)</p>
                </div>
                <div>
                  {/* HSN Code */}
                  <FieldLabel icon={<FileCheck size={13} />}>HSN Code</FieldLabel>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={variantForm.hsnCode}
                      onChange={(e) => setVariantForm({ ...variantForm, hsnCode: e.target.value })}
                      placeholder="Enter or search HSN code"
                      className={inputCls('flex-1 font-mono')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowHsnModal(true)}
                      className="px-3 py-2.5 bg-[#083028]/10 text-[#083028] border border-[#083028]/20 rounded-xl text-xs font-bold hover:bg-[#083028]/20 transition flex items-center gap-1 whitespace-nowrap"
                    >
                      <Search size={12} /> Find Relevant HSN Code
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* HSN Code row for Set Size */}
          {isSetSize && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <FieldLabel icon={<FileCheck size={13} />}>HSN Code</FieldLabel>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={variantForm.hsnCode}
                    onChange={(e) => setVariantForm({ ...variantForm, hsnCode: e.target.value })}
                    placeholder="Enter or search HSN code"
                    className={inputCls('flex-1 font-mono')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowHsnModal(true)}
                    className="px-3 py-2.5 bg-[#083028]/10 text-[#083028] border border-[#083028]/20 rounded-xl text-xs font-bold hover:bg-[#083028]/20 transition flex items-center gap-1 whitespace-nowrap"
                  >
                    <Search size={12} /> Find Relevant HSN Code
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <Info size={13} className="text-[#083028]/60 flex-shrink-0" />
                Verify the suggested code for the product material and type before saving.
              </div>
            </div>
          )}
        </SectionCard>

        {/* ══════════════ EXISTING VARIANTS LIST ══════════════ */}
        {selectedProductId && selectedProductId !== 'draft' && (
          <SectionCard
            title={`All Configured Variants (${existingVariants.length})`}
            subtitle={`${existingVariants.length} variant(s) saved in database.`}
            icon={<Layers size={18} />}
          >
            {loadingVariants ? (
              <div className="py-8 flex justify-center">
                <Loader2 size={24} className="animate-spin text-[#083028]" />
              </div>
            ) : existingVariants.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <Layers size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-500">No variants created yet for this product.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5 text-left">SKU / Type</th>
                      <th className="px-4 py-2.5 text-left">Size & Pieces</th>
                      <th className="px-4 py-2.5 text-left">Colour / Fabric</th>
                      <th className="px-4 py-2.5 text-left">Price</th>
                      <th className="px-4 py-2.5 text-left">Stock</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {existingVariants.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50/70 transition">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                            {v.skuId || '—'}
                          </span>
                          <p className="text-[10px] text-emerald-800 font-semibold mt-0.5 capitalize">
                            {v.variantType === 'set_size' ? 'Set Size' : 'Inventory (N)'}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {v.size} • {v.piecesPerSet} pcs
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {v.colour || '—'} {v.fabric ? `(${v.fabric})` : ''}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-[#083028]">₹{v.totalSetPrice}</span>
                          <span className="text-[10px] text-gray-400 block">₹{v.pricePerPiece}/pc</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-700">
                          {v.totalStockPieces} pcs
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setVariantForm(v);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                toast.info(`Editing variant ${v.skuId || v.size}`);
                              }}
                              className="p-1.5 text-[#083028] hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVariant(v.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}
      </div>

      {/* ══════════════ BOTTOM ACTION BAR ══════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          {/* Auto-Copy Toggle */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setAutoCopy(!autoCopy)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                autoCopy ? 'bg-[#083028]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  autoCopy ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-xs text-gray-700 font-medium leading-tight">
              Auto-Copy (Clone) current data to next page? / जब भरा हुआ डेटा आगे पेज पर कॉपी करना है?
            </span>
          </div>

          {/* Buttons Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleAddVariant}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#083028] text-white rounded-xl text-xs font-bold hover:bg-[#051e19] transition"
            >
              <Plus size={14} />
              + Add Variant (Clone Current Product Data)
            </button>

            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
              <span>🌟</span>
              <span>Will duplicate all specs, GST, and Category on click!</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/admin/products"
                className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#083028] text-white rounded-xl text-xs font-bold hover:bg-[#051e19] transition disabled:opacity-60"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ HSN LOOKUP MODAL ══════════════ */}
      {showHsnModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-[#083028]" />
                <h3 className="text-sm font-bold text-gray-900">Standard Garment HSN Codes</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHsnModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {COMMON_HSN_CODES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setVariantForm({ ...variantForm, hsnCode: item.code });
                    setShowHsnModal(false);
                    toast.info(`HSN Code ${item.code} selected`);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-[#083028] hover:bg-emerald-50/50 transition flex items-center justify-between group"
                >
                  <div>
                    <span className="font-mono font-bold text-[#083028] text-sm">{item.code}</span>
                    <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                  </div>
                  <Check size={14} className="text-[#083028] opacity-0 group-hover:opacity-100 transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminVariantPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-[#083028]" />
        </div>
      }
    >
      <VariantPageContent />
    </Suspense>
  );
}
