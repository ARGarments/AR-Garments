/**
 * AR Garments Official Wholesale Tax Invoice Utilities
 */

export function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + a[n % 10] : '');
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  };

  const integerPart = Math.floor(Math.abs(num));
  let remaining = integerPart;
  const parts: string[] = [];

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  if (crore > 0) {
    parts.push(inWords(crore) + ' Crore');
  }

  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  if (lakh > 0) {
    parts.push(inWords(lakh) + ' Lakh');
  }

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  if (thousand > 0) {
    parts.push(inWords(thousand) + ' Thousand');
  }

  const hundred = remaining;
  if (hundred > 0) {
    parts.push(inWords(hundred));
  }

  const result = parts.join(' ').replace(/\s+/g, ' ').trim();
  return result ? `${result} Rupees Only` : 'Zero Rupees Only';
}

export function getGarmentHsnCode(name: string = '', category: string = ''): string {
  const text = `${name} ${category}`.toLowerCase();
  if (text.includes('t-shirt') || text.includes('tshirt') || text.includes('men') || text.includes('shirt')) {
    return '6203';
  }
  if (text.includes('dupatta') || text.includes('shawl') || text.includes('scarf')) {
    return '6211';
  }
  if (text.includes('kids') || text.includes('frock')) {
    return '6209';
  }
  // Sarees, Kurti & Sets, Blouses, Suits, Dress Materials
  return '6204';
}

export interface InvoiceItemCalculation {
  sNo: number;
  id: string;
  name: string;
  image?: string;
  category?: string;
  hsnCode: string;
  quantity: number;
  ratePerSet: number;
  lineTotal: number;
  taxableAmount: number;
  gstRate: number; // 5% standard garment rate
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface InvoiceCalculationSummary {
  items: InvoiceItemCalculation[];
  isInterState: boolean;
  totalTaxable: number;
  totalGst: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  subtotal: number;
  discount: number;
  shipping: number;
  grandTotal: number;
  amountInWords: string;
}

export function calculateInvoice(order: {
  items: Array<{
    id?: string;
    name: string;
    price: string | number;
    numericPrice?: number;
    image?: string;
    quantity: number;
    category?: string;
  }>;
  shippingAddress?: {
    state?: string;
    pincode?: string;
  };
  subtotal?: number;
  discount?: number;
  shipping?: number;
  total?: number;
}): InvoiceCalculationSummary {
  const sellerStateCode = '09'; // Uttar Pradesh
  const buyerState = (order.shippingAddress?.state || 'Uttar Pradesh').trim().toLowerCase();
  // Check if buyer state is Uttar Pradesh
  const isInterState = !buyerState.includes('uttar pradesh') && !buyerState.includes('up');

  let totalTaxable = 0;
  let totalGst = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const items: InvoiceItemCalculation[] = order.items.map((item, idx) => {
    let rate = 0;
    if (typeof item.numericPrice === 'number' && item.numericPrice > 0) {
      rate = item.numericPrice;
    } else if (typeof item.price === 'number') {
      rate = item.price;
    } else if (typeof item.price === 'string') {
      const parsed = parseFloat(item.price.replace(/[^0-9.]/g, ''));
      rate = isNaN(parsed) ? 0 : parsed;
    }

    const qty = item.quantity || 1;
    const lineTotal = rate * qty;
    const gstRate = 5; // 5% standard garment GST
    // Back-calculate taxable value from inclusive total
    const taxableAmount = Math.round((lineTotal / (1 + gstRate / 100)) * 100) / 100;
    const gstAmount = Math.round((lineTotal - taxableAmount) * 100) / 100;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = gstAmount;
    } else {
      cgst = Math.round((gstAmount / 2) * 100) / 100;
      sgst = Math.round((gstAmount - cgst) * 100) / 100;
    }

    totalTaxable += taxableAmount;
    totalGst += gstAmount;
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;

    return {
      sNo: idx + 1,
      id: item.id || `item-${idx}`,
      name: item.name,
      image: item.image,
      category: item.category,
      hsnCode: getGarmentHsnCode(item.name, item.category),
      quantity: qty,
      ratePerSet: rate,
      lineTotal,
      taxableAmount,
      gstRate,
      gstAmount,
      cgst,
      sgst,
      igst,
    };
  });

  const subtotal = order.subtotal ?? items.reduce((acc, i) => acc + i.lineTotal, 0);
  const discount = order.discount ?? 0;
  const shipping = order.shipping ?? 0;
  const grandTotal = order.total ?? Math.max(0, subtotal - discount + shipping);

  return {
    items,
    isInterState,
    totalTaxable: Math.round(totalTaxable * 100) / 100,
    totalGst: Math.round(totalGst * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    subtotal,
    discount,
    shipping,
    grandTotal,
    amountInWords: numberToIndianWords(grandTotal),
  };
}

export function generatePrintableInvoiceHtml(order: any): string {
  const calc = calculateInvoice(order);
  const invoiceNo = `INV-${(order.id || '').replace('#', '')}`;
  const address = order.shippingAddress || {
    fullName: order.userName || 'Valued Buyer',
    phone: '',
    addressLine1: '',
    city: '',
    state: 'Uttar Pradesh',
    pincode: '',
  };
  const buyerState = address.state || 'Uttar Pradesh';
  const placeOfSupply = `${buyerState.toLowerCase().includes('uttar pradesh') || buyerState.toLowerCase().includes('up') ? '09 - Uttar Pradesh' : buyerState} ${address.pincode ? `(${address.pincode})` : ''}`;

  let formattedDate = '';
  try {
    const d = new Date(order.createdAt || Date.now());
    formattedDate = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    formattedDate = order.createdAt || '';
  }

  const paymentModeText = order.paymentMethod === 'cod'
    ? 'Cash on Delivery (COD)'
    : `Razorpay Online ${order.razorpayPaymentId ? `(${order.razorpayPaymentId})` : ''}`;

  const paymentStatusText = order.paymentStatus === 'paid'
    ? 'PAID'
    : (order.status === 'Cancelled' ? 'CANCELLED' : 'PENDING (COD)');

  const paymentStatusColor = order.paymentStatus === 'paid'
    ? '#065f46'
    : (order.status === 'Cancelled' ? '#991b1b' : '#92400e');
  const paymentStatusBg = order.paymentStatus === 'paid'
    ? '#d1fae5'
    : (order.status === 'Cancelled' ? '#fee2e2' : '#fef3c7');

  const itemsRows = calc.items.map((item) => `
    <tr>
      <td style="padding: 5px 6px; text-align: center; border: 1px solid #d1d5db; font-weight: bold; color: #4b5563;">${item.sNo}</td>
      <td style="padding: 4px; text-align: center; border: 1px solid #d1d5db; width: 38px;">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 30px; height: 30px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; display: block; margin: 0 auto;" />` : `<div style="width: 30px; height: 30px; background: #f3f4f6; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #9ca3af; margin: 0 auto;">No Img</div>`}
      </td>
      <td style="padding: 5px 6px; border: 1px solid #d1d5db;">
        <div style="font-weight: 800; font-size: 11px; color: #111827; line-height: 1.2;">${item.name}</div>
        ${item.category ? `<div style="font-size: 9px; color: #6b7280; margin-top: 2px;">Category: ${item.category}</div>` : ''}
      </td>
      <td style="padding: 5px 6px; text-align: center; border: 1px solid #d1d5db; font-family: monospace; font-size: 10px; color: #374151;">${item.hsnCode}</td>
      <td style="padding: 5px 6px; text-align: center; border: 1px solid #d1d5db; font-weight: bold; color: #1f2937;">${item.quantity} ${item.quantity === 1 ? 'Set' : 'Sets'}</td>
      <td style="padding: 5px 6px; text-align: right; border: 1px solid #d1d5db; font-family: monospace; color: #374151;">₹${item.ratePerSet.toLocaleString('en-IN')}</td>
      <td style="padding: 5px 6px; text-align: right; border: 1px solid #d1d5db; font-family: monospace; color: #374151;">₹${item.taxableAmount.toLocaleString('en-IN')}</td>
      <td style="padding: 5px 6px; text-align: right; border: 1px solid #d1d5db; font-family: monospace; font-size: 9px; color: #4b5563;">
        ${calc.isInterState ? `₹${item.igst.toFixed(2)}` : `<div>C: ₹${item.cgst.toFixed(2)}</div><div>S: ₹${item.sgst.toFixed(2)}</div>`}
      </td>
      <td style="padding: 5px 6px; text-align: right; border: 1px solid #d1d5db; font-family: monospace; font-weight: 800; color: #111827;">₹${item.lineTotal.toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice_${invoiceNo}_${order.id}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: #ffffff;
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .invoice-wrapper {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
      border: 1.5px solid #083028;
      border-radius: 8px;
      padding: 14px 18px;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #083028;
      padding-bottom: 10px;
      margin-bottom: 8px;
    }
    .brand-col {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .brand-logo {
      width: 44px;
      height: 44px;
      background: #083028;
      color: #C9972B;
      font-family: serif;
      font-size: 20px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      border: 1px solid #C9972B;
      flex-shrink: 0;
    }
    .brand-info h1 {
      font-size: 17px;
      font-weight: 900;
      color: #083028;
      letter-spacing: -0.5px;
      line-height: 1;
    }
    .brand-info .tagline {
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #8A6414;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .brand-info .address {
      font-size: 9.5px;
      color: #4b5563;
      margin-top: 2px;
    }
    .brand-info .meta-row {
      font-size: 9.5px;
      color: #4b5563;
      margin-top: 2px;
    }
    .invoice-badge-col {
      text-align: right;
    }
    .invoice-badge {
      display: inline-block;
      background: #083028;
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 900;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .invoice-badge small {
      display: block;
      font-size: 7.5px;
      font-weight: normal;
      color: #a7f3d0;
    }
    .metadata-list {
      margin-top: 6px;
      font-size: 9.5px;
      color: #374151;
      line-height: 1.35;
    }
    .metadata-list strong {
      color: #111827;
    }
    .buyer-payment-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .section-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 6px 9px;
    }
    .section-title {
      font-size: 8.5px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #8A6414;
      margin-bottom: 3px;
    }
    .buyer-name {
      font-size: 11px;
      font-weight: 800;
      color: #111827;
    }
    .buyer-address {
      font-size: 9.5px;
      color: #4b5563;
      margin-top: 2px;
    }
    .buyer-contact {
      font-size: 9.5px;
      color: #4b5563;
      margin-top: 2px;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      margin-bottom: 2px;
    }
    .status-pill {
      font-weight: 800;
      font-size: 8.5px;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
      background: ${paymentStatusBg};
      color: ${paymentStatusColor};
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 9.5px;
    }
    table.items-table th {
      background: #083028;
      color: #ffffff;
      padding: 4px 6px;
      font-weight: 800;
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #064e3b;
    }
    .summary-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      padding-top: 6px;
      border-top: 1px solid #e5e7eb;
    }
    .words-box {
      flex: 1;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 6px;
      padding: 6px 9px;
    }
    .words-label {
      font-size: 8.5px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #083028;
    }
    .words-value {
      font-size: 9.5px;
      font-weight: 800;
      font-style: italic;
      color: #064e3b;
      margin-top: 2px;
    }
    .totals-box {
      width: 210px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #4b5563;
      margin-bottom: 2px;
    }
    .total-row.grand {
      font-size: 12px;
      font-weight: 900;
      color: #083028;
      border-top: 2px solid #083028;
      padding-top: 3px;
      margin-top: 3px;
    }
    .total-row span.val {
      font-family: monospace;
      font-weight: bold;
      color: #111827;
    }
    .total-row.grand span.val {
      color: #083028;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <!-- TOP HEADER: SELLER DETAILS -->
    <div class="header-bar">
      <div class="brand-col">
        <div class="brand-logo">AR</div>
        <div class="brand-info">
          <h1>A R GARMENT</h1>
          <div class="tagline">Wholesale Garment Partner</div>
          <div class="address">11A/14A, K.P. Kakkad Road, Eidgah, Prayagraj, UP - 211003</div>
          <div class="meta-row">
            <strong>GSTIN:</strong> 09ABCDE1234F1Z5 (State: 09 - UP) &nbsp;|&nbsp; <strong>PAN:</strong> ABCDE1234F
          </div>
          <div class="meta-row">
            <strong>Email:</strong> support@argarment.com &nbsp;|&nbsp; <strong>Phone:</strong> +91 98765 43210
          </div>
        </div>
      </div>
      <div class="invoice-badge-col">
        <div class="invoice-badge">
          TAX INVOICE / बिल
          <small>Original for Recipient</small>
        </div>
        <div class="metadata-list">
          <div>Invoice No: <strong>${invoiceNo}</strong></div>
          <div>Order ID: <strong style="color: #083028;">${order.id}</strong></div>
          <div>Date & Time: <span>${formattedDate}</span></div>
        </div>
      </div>
    </div>

    <!-- BUYER DETAILS & PAYMENT DETAILS -->
    <div class="buyer-payment-grid">
      <div class="section-box">
        <div class="section-title">Buyer Details (Bill To / Ship To)</div>
        <div class="buyer-name">${address.fullName || order.userName || 'Valued Buyer'}</div>
        <div class="buyer-address">
          ${[address.addressLine1, address.addressLine2, address.city, address.state, address.pincode].filter(Boolean).join(', ')}
        </div>
        <div class="buyer-contact">
          <strong>Mobile:</strong> ${address.phone || '—'} &nbsp;|&nbsp; <strong>Email:</strong> ${order.userEmail || '—'}
        </div>
        <div class="buyer-contact">
          <strong>Buyer GSTIN:</strong> Unregistered / Consumer
        </div>
      </div>

      <div class="section-box">
        <div class="section-title">Payment & Supply Details</div>
        <div class="payment-row">
          <span style="color: #6b7280;">Payment Mode:</span>
          <span style="font-weight: bold; color: #111827;">${paymentModeText}</span>
        </div>
        <div class="payment-row">
          <span style="color: #6b7280;">Payment Status:</span>
          <span class="status-pill">${paymentStatusText}</span>
        </div>
        <div class="payment-row">
          <span style="color: #6b7280;">Place of Supply:</span>
          <span style="font-weight: bold; color: #111827;">${placeOfSupply}</span>
        </div>
        ${order.awbNumber ? `
        <div class="payment-row">
          <span style="color: #6b7280;">AWB Tracking:</span>
          <span style="font-family: monospace; font-weight: bold; color: #083028;">${order.awbNumber} (${order.courierName || 'Carrier'})</span>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- PRODUCT ITEMS TABLE -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 26px; text-align: center;">#</th>
          <th style="width: 36px; text-align: center;">Image</th>
          <th>Item Description</th>
          <th style="width: 48px; text-align: center;">HSN</th>
          <th style="width: 44px; text-align: center;">Qty</th>
          <th style="width: 60px; text-align: right;">Rate (₹)</th>
          <th style="width: 64px; text-align: right;">Taxable (₹)</th>
          <th style="width: 72px; text-align: right;">${calc.isInterState ? 'IGST (5%)' : 'CGST+SGST'}</th>
          <th style="width: 68px; text-align: right;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- TOTALS & SUMMARY -->
    <div class="summary-grid">
      <div class="words-box">
        <div class="words-label">Amount in Words (INR):</div>
        <div class="words-value">${calc.amountInWords}</div>
        <div style="font-size: 8px; color: #047857; margin-top: 3px;">
          ✓ Statutory wholesale tax invoice with standard 5% garment GST
        </div>
      </div>

      <div class="totals-box">
        <div class="total-row">
          <span>Items Subtotal:</span>
          <span class="val">₹${calc.subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div class="total-row">
          <span>Total Taxable Value:</span>
          <span class="val">₹${calc.totalTaxable.toFixed(2)}</span>
        </div>
        ${calc.isInterState ? `
        <div class="total-row">
          <span>IGST (5%):</span>
          <span class="val">₹${calc.totalIgst.toFixed(2)}</span>
        </div>
        ` : `
        <div class="total-row">
          <span>CGST (2.5%):</span>
          <span class="val">₹${calc.totalCgst.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>SGST (2.5%):</span>
          <span class="val">₹${calc.totalSgst.toFixed(2)}</span>
        </div>
        `}
        ${calc.discount > 0 ? `
        <div class="total-row" style="color: #047857; font-weight: bold;">
          <span>Discount Savings:</span>
          <span class="val" style="color: #047857;">-₹${calc.discount.toLocaleString('en-IN')}</span>
        </div>
        ` : ''}
        <div class="total-row">
          <span>Delivery / Shipping:</span>
          <span class="val" style="color: #065f46;">${calc.shipping > 0 ? `₹${calc.shipping}` : 'FREE'}</span>
        </div>
        <div class="total-row grand">
          <span>Grand Total:</span>
          <span class="val">₹${calc.grandTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function printInvoiceDocument(order: any): void {
  if (typeof window === 'undefined') return;

  const html = generatePrintableInvoiceHtml(order);

  // Remove any leftover print iframes
  const existingIframe = document.getElementById('ar-invoice-print-frame');
  if (existingIframe && existingIframe.parentNode) {
    existingIframe.parentNode.removeChild(existingIframe);
  }

  // Create an isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'ar-invoice-print-frame';
  iframe.setAttribute('style', 'position: fixed; right: 0; bottom: 0; width: 0; height: 0; border: 0; opacity: 0; pointer-events: none;');
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    // Fallback to popup window if iframe is blocked
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    }
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // Fallback popup if browser blocks iframe print
      const printWindow = window.open('', '_blank', 'width=850,height=950');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 350);
      }
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 3000);
    }
  };

  if (iframe.contentWindow) {
    iframe.contentWindow.onload = triggerPrint;
    setTimeout(triggerPrint, 400);
  } else {
    setTimeout(triggerPrint, 350);
  }
}
