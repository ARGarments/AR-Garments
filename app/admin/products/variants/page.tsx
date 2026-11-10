'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Check, Box, Tag, DollarSign, Scale, Percent,
  FileCheck, Shirt, Trash2, Edit2, Plus, Info,
  Search, Layers, ImageIcon, Loader2, Package, Palette,
  Scissors, Ruler, Star, RefreshCw, X, Settings
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
  description?: string;
  images?: string[];
  sizeChart?: {
    metrics: string[];
    rows: Array<{ size: string; values: Record<string, string> }>;
  };
  customSpecifications: CustomSpec[];
};

type ParentProduct = {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  category_id?: string;
  subcategory?: string;
  subcategoryId?: string | null;
  subcategory_id?: string | null;
  brand?: string;
  image?: string;
  images?: string[];
  price?: string;
  totalSetPrice?: number;
  pricePerPiece?: number;
  hsnCode?: string;
  fabric?: string;
  weight?: string;
  weightUnit?: string;
  gstRate?: string;
  size?: string;
  sizeChart?: {
    metrics: string[];
    rows: Array<{ size: string; values: Record<string, string> }>;
  };
  size_chart?: {
    metrics: string[];
    rows: Array<{ size: string; values: Record<string, string> }>;
  };
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
  const [editingVariantId, setEditingVariantId] = useState<string | null>(queryVariantId || null);
  const [autoCopy, setAutoCopy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHsnModal, setShowHsnModal] = useState(false);
  const [newSpecLabel, setNewSpecLabel] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [editingSpecIndex, setEditingSpecIndex] = useState<number | null>(null);
  const [editingSpecLabel, setEditingSpecLabel] = useState('');
  const [editingSpecValue, setEditingSpecValue] = useState('');

  // Description editor
  const editorRef = useRef<HTMLDivElement>(null);
  const [description, setDescription] = useState('');
  const [descCharCount, setDescCharCount] = useState(0);

  // Image upload
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Dynamic sizes list from DB
  const [sizesList, setSizesList] = useState<string[]>(SIZE_OPTIONS);
  const [showManageSizesModal, setShowManageSizesModal] = useState(false);
  const [showSizeChartModal, setShowSizeChartModal] = useState(false);
  const [newSizeInput, setNewSizeInput] = useState('');

  // Size chart state
  const [sizeChartMetrics, setSizeChartMetrics] = useState<string[]>([
    'Top Chest', 'Top Waist', 'Top Length', 'Shoulder', 'Inseam (Custom)'
  ]);
  const [sizeChartRows, setSizeChartRows] = useState<Array<{ size: string; values: Record<string, string> }>>([
    { size: 'M', values: { 'Top Chest': '38 in', 'Top Waist': '32 in', 'Top Length': '24 in', 'Shoulder': '24 in', 'Inseam (Custom)': '30 in' } },
    { size: 'S', values: { 'Top Chest': '39 in', 'Top Waist': '32 in', 'Top Length': '24 in', 'Shoulder': '26 in', 'Inseam (Custom)': '30 in' } },
    { size: 'L', values: { 'Top Chest': '32 in', 'Top Waist': '32 in', 'Top Length': '25 in', 'Shoulder': '26 in', 'Inseam (Custom)': '37 in' } },
    { size: 'Free Size', values: { 'Top Chest': '34 in', 'Top Waist': '32 in', 'Top Length': '26 in', 'Shoulder': '26 in', 'Inseam (Custom)': '26 in' } },
  ]);

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

  // Fetch sizes from DB
  useEffect(() => {
    async function loadSizes() {
      try {
        const res = await fetch('/api/sizes');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSizesList(data.map((item: { name: string }) => item.name));
          }
        }
      } catch (err) {
        console.error('Error fetching sizes:', err);
      }
    }
    loadSizes();
  }, []);

  // Fetch products list & categories
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
              if (matched) {
                setSelectedProduct(matched);
                // Pre-populate variant specs, size, and size chart from parent product!
                const sc = matched.sizeChart || matched.size_chart;
                if (sc && Array.isArray(sc.metrics) && Array.isArray(sc.rows)) {
                  setSizeChartMetrics(sc.metrics);
                  setSizeChartRows(sc.rows);
                }
                setVariantForm((prev) => ({
                  ...prev,
                  size: matched.size || prev.size,
                  hsnCode: matched.hsnCode || prev.hsnCode,
                  weight: matched.weight || prev.weight,
                  weightUnit: matched.weightUnit || prev.weightUnit,
                  gstRate: matched.gstRate || prev.gstRate,
                  fabric: matched.fabric || prev.fabric,
                  pricePerPiece: matched.pricePerPiece || prev.pricePerPiece,
                  totalSetPrice: matched.totalSetPrice || prev.totalSetPrice,
                }));
              }
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
              description: String(v.description || ''),
              images: Array.isArray(v.images) ? (v.images as string[]) : [],
              sizeChart: (v.size_chart || v.sizeChart) as VariantFormData['sizeChart'],
              customSpecifications: Array.isArray(v.custom_specifications)
                ? (v.custom_specifications as CustomSpec[])
                : [],
            }));
            setExistingVariants(mapped);

            if (queryVariantId) {
              const toEdit = mapped.find((item) => item.id === queryVariantId);
              if (toEdit) {
                setEditingVariantId(toEdit.id);
                setVariantForm(toEdit);
                if (toEdit.description) {
                  setDescription(toEdit.description);
                  setDescCharCount(toEdit.description.replace(/<[^>]*>/g, '').length);
                  if (editorRef.current) {
                    editorRef.current.innerHTML = toEdit.description;
                  }
                }
                if (Array.isArray(toEdit.images) && toEdit.images.length > 0) {
                  setUploadedImages(toEdit.images);
                }
                if (toEdit.sizeChart && Array.isArray(toEdit.sizeChart.metrics) && Array.isArray(toEdit.sizeChart.rows)) {
                  setSizeChartMetrics(toEdit.sizeChart.metrics);
                  setSizeChartRows(toEdit.sizeChart.rows);
                }
              }
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

  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  };

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsImageUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map(async (file) => {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('folder', '/products');
          fd.append('fileName', `product_${Date.now()}`);
          const res = await fetch('/api/upload', { method: 'POST', body: fd });
          const data = await res.json();
          if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');
          return data.url as string;
        })
      );
      setUploadedImages((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} image(s) uploaded!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleAddCustomSize = async (nameToAdd?: string) => {
    const sizeName = (nameToAdd || newSizeInput).trim();
    if (!sizeName) return;
    if (sizesList.includes(sizeName)) {
      toast.info('This size already exists.');
      return;
    }
    try {
      const res = await fetch('/api/sizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sizeName }),
      });
      if (res.ok) {
        setSizesList((prev) => [...prev, sizeName]);
        setVariantForm((prev) => ({ ...prev, size: sizeName }));
        setNewSizeInput('');
        toast.success(`Size "${sizeName}" added!`);
      } else {
        toast.error('Failed to add size.');
      }
    } catch {
      toast.error('Network error adding size.');
    }
  };

  const handleDeleteCustomSize = async (sizeName: string) => {
    if (!confirm(`Delete size "${sizeName}"?`)) return;
    try {
      const res = await fetch(`/api/sizes?name=${encodeURIComponent(sizeName)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSizesList((prev) => prev.filter((s) => s !== sizeName));
        if (variantForm.size === sizeName) {
          setVariantForm((prev) => ({ ...prev, size: sizesList[0] || 'Free Size' }));
        }
        toast.success(`Size "${sizeName}" deleted.`);
      }
    } catch {
      toast.error('Failed to delete size.');
    }
  };

  const handleEditCustomSize = async (oldSizeName: string) => {
    const newName = prompt(`Edit size name:`, oldSizeName);
    if (!newName || !newName.trim() || newName.trim() === oldSizeName) return;
    const trimmed = newName.trim();
    try {
      const res = await fetch('/api/sizes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName: oldSizeName, newName: trimmed }),
      });
      if (res.ok) {
        setSizesList((prev) => prev.map((s) => (s === oldSizeName ? trimmed : s)));
        if (variantForm.size === oldSizeName) {
          setVariantForm((prev) => ({ ...prev, size: trimmed }));
        }
        setSizeChartRows((prev) =>
          prev.map((r) => (r.size === oldSizeName ? { ...r, size: trimmed } : r))
        );
        toast.success(`Size updated to "${trimmed}"!`);
      } else {
        toast.error('Failed to update size.');
      }
    } catch {
      toast.error('Network error updating size.');
    }
  };

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
    if (!newSpecLabel.trim() || !newSpecValue.trim()) {
      toast.warning('Please enter both label and value');
      return;
    }
    setVariantForm((prev) => ({
      ...prev,
      customSpecifications: [
        ...prev.customSpecifications,
        { label: newSpecLabel.trim(), value: newSpecValue.trim() },
      ],
    }));
    setNewSpecLabel('');
    setNewSpecValue('');
    toast.success('Specification added');
  };

  const startEditCustomSpec = (index: number) => {
    const spec = variantForm.customSpecifications[index];
    if (!spec) return;
    setEditingSpecIndex(index);
    setEditingSpecLabel(spec.label);
    setEditingSpecValue(spec.value);
  };

  const saveEditCustomSpec = (index: number) => {
    if (!editingSpecLabel.trim() || !editingSpecValue.trim()) {
      toast.warning('Label and value cannot be empty');
      return;
    }
    setVariantForm((prev) => {
      const updated = [...prev.customSpecifications];
      updated[index] = { label: editingSpecLabel.trim(), value: editingSpecValue.trim() };
      return { ...prev, customSpecifications: updated };
    });
    setEditingSpecIndex(null);
    setEditingSpecLabel('');
    setEditingSpecValue('');
    toast.success('Specification updated');
  };

  const cancelEditCustomSpec = () => {
    setEditingSpecIndex(null);
    setEditingSpecLabel('');
    setEditingSpecValue('');
  };

  const removeCustomSpec = (index: number) => {
    setVariantForm((prev) => ({
      ...prev,
      customSpecifications: prev.customSpecifications.filter((_, i) => i !== index),
    }));
    if (editingSpecIndex === index) {
      cancelEditCustomSpec();
    }
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
          id: editingVariantId || undefined,
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
          description: description || '',
          images: uploadedImages,
          size_chart: {
            metrics: sizeChartMetrics,
            rows: sizeChartRows,
          },
          custom_specifications: variantForm.customSpecifications,
        };

        const method = editingVariantId ? 'PUT' : 'POST';
        const res = await fetch(`/api/products/${selectedProductId}/variants`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to save variant.');
        }

        // Update parent product description if provided
        if (selectedProductId && description) {
          try {
            await fetch(`/api/products?id=${selectedProductId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ description }),
            });
          } catch (patchErr) {
            console.error('Error updating parent product description:', patchErr);
          }
        }

        toast.success(editingVariantId ? 'Product variant updated successfully!' : 'Product variant saved successfully!', { title: 'Variant Saved' });
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
            {editingVariantId ? 'Update Variant' : 'Publish Product'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              {editingVariantId ? 'Edit Product Variant' : 'Add Product Variant'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {editingVariantId
                ? `Editing variant SKU: ${variantForm.skuId || variantForm.id}. Update values and click Update Variant.`
                : 'Configure sizes, colors, pricing, and stock for this product variant.'}
            </p>
          </div>
          {editingVariantId && (
            <button
              type="button"
              onClick={() => {
                setEditingVariantId(null);
                setVariantForm((prev) => ({
                  ...prev,
                  id: `var-${Date.now()}`,
                  skuId: `SKU-${Date.now().toString().slice(-6)}`,
                  colour: '',
                  pricePerPiece: 0,
                  totalSetPrice: 0,
                  totalStockPieces: 0,
                  availablePieces: 0,
                  availableSets: 0,
                }));
                setUploadedImages([]);
                toast.info('Switched to Add New Variant mode');
              }}
              className="text-xs font-bold text-[#083028] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition"
            >
              + Add New Variant Instead
            </button>
          )}
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
                    const sc = found.sizeChart || found.size_chart;
                    if (sc && Array.isArray(sc.metrics) && Array.isArray(sc.rows)) {
                      setSizeChartMetrics(sc.metrics);
                      setSizeChartRows(sc.rows);
                    }
                    setVariantForm((prev) => ({
                      ...prev,
                      productId: pid,
                      size: found.size || prev.size,
                      hsnCode: found.hsnCode || prev.hsnCode,
                      weight: found.weight || prev.weight,
                      weightUnit: found.weightUnit || prev.weightUnit,
                      gstRate: found.gstRate || prev.gstRate,
                      fabric: found.fabric || prev.fabric,
                      pricePerPiece: found.pricePerPiece || prev.pricePerPiece,
                      totalSetPrice: found.totalSetPrice || prev.totalSetPrice,
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
                <button type="button" onClick={() => applyFormat('bold')} title="Bold" className="w-7 h-7 rounded text-xs font-black text-gray-700 hover:bg-gray-200 transition">B</button>
                <button type="button" onClick={() => applyFormat('italic')} title="Italic" className="w-7 h-7 rounded text-xs italic font-bold text-gray-700 hover:bg-gray-200 transition">I</button>
                <button type="button" onClick={() => applyFormat('underline')} title="Underline" className="w-7 h-7 rounded text-xs underline font-bold text-gray-700 hover:bg-gray-200 transition">U</button>
                <div className="w-px h-5 bg-gray-300 mx-1" />
                <button type="button" onClick={() => applyFormat('insertUnorderedList')} title="Bullet List" className="w-7 h-7 rounded text-xs text-gray-600 hover:bg-gray-200 transition">≡</button>
                <button type="button" onClick={() => applyFormat('insertOrderedList')} title="Numbered List" className="w-7 h-7 rounded text-xs text-gray-600 hover:bg-gray-200 transition">☰</button>
                <div className="w-px h-5 bg-gray-300 mx-1" />
                <button type="button" onClick={() => applyFormat('justifyLeft')} title="Left" className="w-7 h-7 rounded text-xs text-gray-600 hover:bg-gray-200 transition">⇤</button>
                <button type="button" onClick={() => applyFormat('justifyRight')} title="Right" className="w-7 h-7 rounded text-xs text-gray-600 hover:bg-gray-200 transition">⇥</button>
                <button type="button" onClick={() => applyFormat('justifyFull')} title="Justify" className="w-7 h-7 rounded text-xs text-gray-600 hover:bg-gray-200 transition">⊟</button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  setDescription(el.innerHTML);
                  setDescCharCount(el.innerText.length);
                }}
                className="w-full px-4 py-3 text-sm text-gray-700 focus:outline-none min-h-[100px] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                data-placeholder="Write product description here..."
              />
              <div className="px-3 py-1.5 border-t border-gray-100 text-right text-[10px] text-gray-400">{descCharCount} / 8000</div>
            </div>
          </div>

          {/* Images & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <FieldLabel>Product Images</FieldLabel>
              {/* Hidden file input */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleVariantImageUpload}
              />
              <div className="space-y-2">
                {/* Main dropzone */}
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="flex-1 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center py-5 px-3 text-center cursor-pointer hover:border-[#083028] transition bg-gray-50"
                >
                  {isImageUploading ? (
                    <Loader2 size={20} className="animate-spin text-[#083028] mb-2" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#083028]/10 flex items-center justify-center mb-2">
                      <ImageIcon size={20} className="text-[#083028]" />
                    </div>
                  )}
                  <p className="text-xs font-semibold text-gray-700">
                    {isImageUploading ? 'Uploading...' : 'Upload Product Image'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Click to upload or drag and drop (.JPG, .PNG, .WEBP - Max 1mb)</p>
                </div>
                {/* Add more images button */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="px-3 py-1.5 border border-[#083028] text-[#083028] rounded-xl text-[10px] font-bold hover:bg-emerald-50 transition flex items-center gap-1"
                >
                  <Plus size={11} /> Add More Images
                </button>
                {/* Thumbnails */}
                {uploadedImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {uploadedImages.map((url, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                        <Image src={url} alt={`img-${i}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setUploadedImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 text-[10px] rounded-bl flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <FieldLabel><span className="text-red-500 mr-0.5">*</span> Size</FieldLabel>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSizeChartModal(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#083028] hover:underline"
                  >
                    <Ruler size={12} /> Size Chart
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => setShowManageSizesModal(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#083028] hover:underline"
                  >
                    <Settings size={12} /> Manage Sizes
                  </button>
                </div>
              </div>
              <select
                value={variantForm.size}
                onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                className={inputCls()}
              >
                {sizesList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">Choose product size or add custom sizes</p>
            </div>
          </div>
        </SectionCard>

        {/* ══════════════ PRODUCT SPECIFICATIONS ══════════════ */}
        <SectionCard
          title="Product Specifications"
          subtitle="Add product specifications for this product."
          icon={<Tag size={18} />}
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

          {/* Custom Specs List & Inline Edit */}
          {variantForm.customSpecifications.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Custom Specifications ({variantForm.customSpecifications.length})</p>
              {variantForm.customSpecifications.map((spec, index) => {
                const isEditing = editingSpecIndex === index;
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition ${
                      isEditing ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100/60'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center mr-2">
                        <input
                          type="text"
                          value={editingSpecLabel}
                          onChange={(e) => setEditingSpecLabel(e.target.value)}
                          placeholder="Label (e.g. Pattern)"
                          className={`${inputCls()} sm:col-span-2 !py-1.5`}
                        />
                        <input
                          type="text"
                          value={editingSpecValue}
                          onChange={(e) => setEditingSpecValue(e.target.value)}
                          placeholder="Value"
                          className={`${inputCls()} sm:col-span-2 !py-1.5`}
                        />
                        <div className="flex items-center gap-1.5 sm:col-span-1">
                          <button
                            type="button"
                            onClick={() => saveEditCustomSpec(index)}
                            className="px-2.5 py-1.5 bg-[#083028] text-white rounded-lg text-xs font-bold hover:bg-[#051e19] transition flex items-center gap-1"
                          >
                            <Check size={12} /> Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditCustomSpec}
                            className="px-2 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-300 transition"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="font-bold text-gray-900 text-xs sm:text-sm">{spec.label}:</span>
                          <span className="text-gray-700 text-xs sm:text-sm truncate">{spec.value}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditCustomSpec(index)}
                            className="p-1.5 text-gray-500 hover:text-[#083028] hover:bg-emerald-50 rounded-lg transition"
                            title="Edit specification"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCustomSpec(index)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete specification"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick add spec row */}
          <div className="pt-2">
            <FieldLabel>Add Custom Specification</FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
              <input
                type="text"
                value={newSpecLabel}
                onChange={(e) => setNewSpecLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSpec();
                  }
                }}
                placeholder="Label (e.g. Pattern, Neck, Pocket)"
                className={`${inputCls()} sm:col-span-2`}
              />
              <input
                type="text"
                value={newSpecValue}
                onChange={(e) => setNewSpecValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSpec();
                  }
                }}
                placeholder="Value (e.g. Printed, V-Neck, 2 Pockets)"
                className={`${inputCls()} sm:col-span-2`}
              />
              <button
                type="button"
                onClick={addCustomSpec}
                className="px-4 py-2.5 bg-[#083028] hover:bg-[#051e19] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
              >
                <Plus size={14} /> Add Specification
              </button>
            </div>
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
                  <FieldLabel icon={<span className="font-bold text-[#083028] text-xs">₹</span>}>Price Per Piece (₹)</FieldLabel>
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
                  <FieldLabel icon={<span className="font-bold text-[#083028] text-xs">₹</span>}>Total Set Price</FieldLabel>
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
                  <FieldLabel icon={<span className="font-bold text-[#083028] text-xs">₹</span>}>Purchase Price (₹)</FieldLabel>
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
                  <FieldLabel icon={<span className="font-bold text-[#083028] text-xs">₹</span>}>Price Per Piece (₹)</FieldLabel>
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
                  <FieldLabel icon={<span className="font-bold text-[#083028] text-xs">₹</span>}>Purchase Price (₹)</FieldLabel>
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
                                setEditingVariantId(v.id);
                                setVariantForm(v);
                                if (v.description) {
                                  setDescription(v.description);
                                  setDescCharCount(v.description.replace(/<[^>]*>/g, '').length);
                                  if (editorRef.current) {
                                    editorRef.current.innerHTML = v.description;
                                  }
                                } else {
                                  setDescription('');
                                  setDescCharCount(0);
                                  if (editorRef.current) {
                                    editorRef.current.innerHTML = '';
                                  }
                                }
                                if (Array.isArray(v.images) && v.images.length > 0) {
                                  setUploadedImages(v.images);
                                } else {
                                  setUploadedImages([]);
                                }
                                if (v.sizeChart && Array.isArray(v.sizeChart.metrics) && Array.isArray(v.sizeChart.rows)) {
                                  setSizeChartMetrics(v.sizeChart.metrics);
                                  setSizeChartRows(v.sizeChart.rows);
                                }
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
          {/* Buttons Row */}
          <div className="flex items-center justify-between gap-3">
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
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#083028] text-white rounded-xl text-xs font-bold hover:bg-[#051e19] transition disabled:opacity-60 shadow-sm"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {editingVariantId ? 'Update Variant' : 'Save Variant'}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════ MANAGE SIZES MODAL (Image 3 UI) ══════════════ */}
      {showManageSizesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">Manage Product Sizes</h3>
              <button
                type="button"
                onClick={() => setShowManageSizesModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Add Custom Size */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter size (e.g. 5XL, 36, 38)"
                value={newSizeInput}
                onChange={(e) => setNewSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSize();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#083028]"
              />
              <button
                type="button"
                onClick={() => handleAddCustomSize()}
                className="px-4 py-2 bg-[#083028] text-white rounded-xl text-xs font-bold hover:bg-[#051e19]"
              >
                Add
              </button>
            </div>

            {/* List with Add/Remove buttons matching the reference image */}
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 pr-1 space-y-1">
              {sizesList.map((s) => (
                <div key={s} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                    <span className="text-sm font-semibold text-gray-800 truncate">{s}</span>
                    <button
                      type="button"
                      onClick={() => handleEditCustomSize(s)}
                      title="Edit size name"
                      className="p-1 text-gray-400 hover:text-[#083028] hover:bg-emerald-50 rounded transition"
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setVariantForm((prev) => ({ ...prev, size: s }));
                        toast.success(`Selected size "${s}"`);
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition ${
                        variantForm.size === s
                          ? 'bg-[#083028] text-white border-[#083028]'
                          : 'border-[#083028] text-[#083028] hover:bg-emerald-50'
                      }`}
                    >
                      {variantForm.size === s ? 'Selected' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomSize(s)}
                      title="Delete size"
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowManageSizesModal(false)}
              className="w-full py-2.5 bg-[#083028] text-white rounded-xl text-xs font-bold hover:bg-[#051e19] transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ SIZE CHART MODAL (Image 2 UI styled to match website theme) ══════════════ */}
      {showSizeChartModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
            {/* Header with Dark Green Brand Color */}
            <div className="bg-[#083028] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Ruler size={18} className="text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold uppercase tracking-wide">Size Chart (All Sizes)</h3>
                  <p className="text-[11px] text-emerald-200">AR Garments custom measurement chart</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeChartModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-center text-gray-600 font-medium">
                Edit or type any value. Drag or delete columns and rows to customize.
              </p>

              {/* Responsive Table */}
              <div className="overflow-x-auto border border-emerald-100 rounded-2xl bg-emerald-50/20">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-emerald-50 text-gray-800 border-b border-emerald-100">
                      <th className="p-2.5 font-bold border-r border-emerald-100 w-24">Size</th>
                      {sizeChartMetrics.map((metric, mIdx) => (
                        <th key={mIdx} className="p-2.5 font-bold border-r border-emerald-100 text-center whitespace-nowrap min-w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <span>{metric}</span>
                            <div className="flex items-center gap-1 text-gray-400">
                              <button
                                type="button"
                                onClick={() => {
                                  const rename = prompt('Rename metric:', metric);
                                  if (rename && rename.trim()) {
                                    const next = [...sizeChartMetrics];
                                    next[mIdx] = rename.trim();
                                    setSizeChartMetrics(next);
                                  }
                                }}
                                title="Edit header"
                                className="hover:text-emerald-800"
                              >
                                <Edit2 size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSizeChartMetrics(sizeChartMetrics.filter((_, i) => i !== mIdx));
                                }}
                                title="Delete column"
                                className="hover:text-red-600"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </th>
                      ))}
                      <th className="p-2.5 text-center min-w-[90px]">
                        <button
                          type="button"
                          onClick={() => {
                            const newMet = prompt('Add Custom Metric (e.g. Hip, Sleeve):');
                            if (newMet && newMet.trim()) {
                              setSizeChartMetrics([...sizeChartMetrics, newMet.trim()]);
                            }
                          }}
                          className="text-[#083028] font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                        >
                          <Plus size={11} /> Metric
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeChartRows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-emerald-100 hover:bg-emerald-50/30">
                        <td className="p-2.5 border-r border-emerald-100 font-bold text-gray-900">
                          <div className="flex items-center justify-between gap-1">
                            <span>{row.size}</span>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  const rename = prompt('Rename size:', row.size);
                                  if (rename && rename.trim() && rename.trim() !== row.size) {
                                    const trimmed = rename.trim();
                                    const old = row.size;
                                    const updated = [...sizeChartRows];
                                    updated[rIdx].size = trimmed;
                                    setSizeChartRows(updated);
                                    if (sizesList.includes(old)) {
                                      try {
                                        await fetch('/api/sizes', {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ oldName: old, newName: trimmed }),
                                        });
                                        setSizesList((prev) => prev.map((s) => (s === old ? trimmed : s)));
                                        if (variantForm.size === old) {
                                          setVariantForm((prev) => ({ ...prev, size: trimmed }));
                                        }
                                      } catch {}
                                    }
                                    toast.success(`Size renamed to "${trimmed}"`);
                                  }
                                }}
                                title="Edit size"
                                className="text-gray-400 hover:text-emerald-800 p-0.5"
                              >
                                <Edit2 size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSizeChartRows(sizeChartRows.filter((_, i) => i !== rIdx));
                                }}
                                title="Delete row"
                                className="text-gray-400 hover:text-red-500 p-0.5"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </td>
                        {sizeChartMetrics.map((metric, mIdx) => (
                          <td key={mIdx} className="p-2 border-r border-emerald-100">
                            <input
                              type="text"
                              value={row.values[metric] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...sizeChartRows];
                                updated[rIdx].values[metric] = val;
                                setSizeChartRows(updated);
                              }}
                              className="w-full text-center py-1 px-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#083028] bg-white"
                            />
                          </td>
                        ))}
                        <td className="p-2 bg-emerald-50/10"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const addSize = prompt('Enter Size name to add row (e.g. XL, 38):');
                    if (addSize && addSize.trim()) {
                      const vals: Record<string, string> = {};
                      sizeChartMetrics.forEach((m) => { vals[m] = '0 in'; });
                      setSizeChartRows([...sizeChartRows, { size: addSize.trim(), values: vals }]);
                    }
                  }}
                  className="w-full py-2.5 border-2 border-[#083028] text-[#083028] rounded-xl text-xs font-bold hover:bg-emerald-50 transition flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> Add Row Size
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newMet = prompt('Add Custom Metric (e.g. Hip, Sleeve):');
                    if (newMet && newMet.trim()) {
                      setSizeChartMetrics([...sizeChartMetrics, newMet.trim()]);
                    }
                  }}
                  className="w-full py-2.5 border-2 border-[#083028] text-[#083028] rounded-xl text-xs font-bold hover:bg-emerald-50 transition flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> Add Custom Metric
                </button>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    if (selectedProductId && selectedProductId !== 'draft') {
                      await fetch(`/api/products?id=${selectedProductId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          size_chart: {
                            metrics: sizeChartMetrics,
                            rows: sizeChartRows,
                          },
                        }),
                      });
                    }
                    toast.success('Size chart saved and applied to product!');
                    setShowSizeChartModal(false);
                  } catch {
                    toast.error('Failed to save size chart.');
                  }
                }}
                className="w-full py-3 bg-[#083028] text-white rounded-xl text-xs font-bold hover:bg-[#051e19] transition flex items-center justify-center gap-2 shadow-md"
              >
                <Check size={15} /> Save & Apply to Product
              </button>
            </div>
          </div>
        </div>
      )}

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
