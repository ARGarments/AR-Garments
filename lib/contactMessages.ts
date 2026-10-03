export type ContactStatus = 'unread' | 'read' | 'replied' | 'archived';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  adminNotes?: string;
  createdAt: string;
}

// Initial realistic queries so admin has immediate data to preview and test
export const memoryContactMessages: ContactMessage[] = [
  {
    id: 'msg-101',
    name: 'Ananya Deshmukh',
    email: 'ananya.deshmukh@gmail.com',
    phone: '+91 98201 34567',
    subject: 'Bridal / Custom Order',
    message: 'Hello, I am interested in customizing 5 Banarasi silk sarees for a wedding in November. Do you offer custom blouse stitching and matching latkans? Please share your catalog and bulk pricing.',
    status: 'unread',
    adminNotes: 'Interested in bridal trousseau package for 5 sarees.',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
  },
  {
    id: 'msg-102',
    name: 'Vikram Sengupta',
    email: 'vikram.sen@outlook.com',
    phone: '+91 98450 88921',
    subject: 'Order Tracking',
    message: 'Hi team, I placed order #ORD-1002 yesterday. Could you please confirm if express dispatch is available to Kolkata? Needed by Friday for an anniversary.',
    status: 'read',
    adminNotes: 'Customer requested expedited shipping to Kolkata.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
  },
  {
    id: 'msg-103',
    name: 'Pooja Agarwal',
    email: 'pooja.agarwal@yahoo.co.in',
    phone: '+91 97112 55409',
    subject: 'Wholesale Inquiry',
    message: 'We run a boutique store in Jaipur and would love to stock your Chanderi and Organza festive collections. What is the minimum order quantity for wholesale rates?',
    status: 'replied',
    adminNotes: 'Wholesale catalog & price sheet sent via email.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // Yesterday
  },
  {
    id: 'msg-104',
    name: 'Meera Nair',
    email: 'meera.nair@gmail.com',
    phone: '+91 94470 12345',
    subject: 'Returns / Exchange',
    message: 'Received the Kanjeevaram Saree today. The quality is gorgeous, but I would like to exchange the color from Wine Red to Emerald Green if stock allows.',
    status: 'unread',
    adminNotes: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), // 2 days ago
  },
];
