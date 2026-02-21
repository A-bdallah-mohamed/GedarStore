// WhatsApp Service for sending order confirmations and payment instructions
// Using WhatsApp Web API integration

// Store WhatsApp number - change this to your WhatsApp number
const STORE_WHATSAPP_NUMBER = "201551932386";

// InstaPay transfer link
const INSTAPAY_TRANSFER_LINK = "https://ipn.eg/S/ghtwry2/instapay/1QrxX8";

/**
 * Build WhatsApp message for COD (Cash On Delivery)
 * @param {Object} order - The order object
 * @returns {String} - Formatted message text in English
 */
export const buildCODMessage = (order) => {
  const items = order.items?.map(item => 
    `• ${item.name} × ${item.quantity} = ${(item.price * item.quantity).toFixed(0)} EGP`
  ).join('\n') || "• No items";

  let message = `Order Confirmation - GedarStore\n\n`;
  message += `Thank you for your order!\n\n`;
  
  message += `*Order Details:*\n`;
  message += `Order ID: #${order.orderId}\n`;
  message += `Name: ${order.customer?.fullName || "N/A"}\n`;
  message += `Phone: ${order.customer?.phone || "N/A"}\n`;
  message += `City: ${order.customer?.city || "N/A"}\n`;
  message += `Address: ${order.customer?.address || "N/A"}\n\n`;

  message += `*Products:*\n${items}\n\n`;
  
  message += `*Order Summary:*\n`;
  message += `Subtotal: ${order.subtotal} EGP\n`;
  message += `Shipping: ${order.shipping} EGP\n`;
  
  // Add discount breakdown
  if (order.categoryDiscount && order.categoryDiscount > 0) {
    message += `Category Discount: -${Math.round(order.categoryDiscount)} EGP\n`;
  }
  if (order.bogoDiscount && order.bogoDiscount > 0) {
    message += `BOGO Discount: -${Math.round(order.bogoDiscount)} EGP\n`;
  }
  if (order.couponDiscount && order.couponDiscount > 0) {
    message += `Coupon Discount (${order.couponCode || 'Coupon'}): -${Math.round(order.couponDiscount)} EGP\n`;
  }
  if (order.discount && order.discount > 0) {
    message += `Total Discount: -${Math.round(order.discount)} EGP\n`;
  }
  
  message += `*Total: ${order.total} EGP*\n\n`;

  // Add notes if present
  if (order.notes && order.notes.trim()) {
    message += `*Customer Notes:*\n${order.notes}\n\n`;
  }

  message += `*Payment Method: Cash On Delivery*\n`;
  message += `Your order will be delivered soon.\n`;
  message += `Please make sure you have the exact amount ready.\n`;
  message += `Delivery time: 2-3 business days\n\n`;

  message += `Thank you for shopping with us!\n`;
  message += `GedarStore Team`;

  return message;
};

/**
 * Build WhatsApp message for InstaPay
 * @param {Object} order - The order object
 * @returns {String} - Formatted message text in English
 */
export const buildInstaPayMessageNew = (order) => {
  const items = order.items?.map(item => 
    `• ${item.name} × ${item.quantity} = ${(item.price * item.quantity).toFixed(0)} EGP`
  ).join('\n') || "• No items";

  let message = `Order Confirmation - GedarStore\n\n`;
  message += `Thank you for your order!\n\n`;
  
  message += `*Order Details:*\n`;
  message += `Order ID: #${order.orderId}\n`;
  message += `Name: ${order.customer?.fullName || "N/A"}\n`;
  message += `Phone: ${order.customer?.phone || "N/A"}\n`;
  message += `City: ${order.customer?.city || "N/A"}\n`;
  message += `Address: ${order.customer?.address || "N/A"}\n\n`;

  message += `*Products:*\n${items}\n\n`;
  
  message += `*Order Summary:*\n`;
  message += `Subtotal: ${order.subtotal} EGP\n`;
  message += `Shipping: ${order.shipping} EGP\n`;
  
  // Add discount breakdown
  if (order.categoryDiscount && order.categoryDiscount > 0) {
    message += `Category Discount: -${Math.round(order.categoryDiscount)} EGP\n`;
  }
  if (order.bogoDiscount && order.bogoDiscount > 0) {
    message += `BOGO Discount: -${Math.round(order.bogoDiscount)} EGP\n`;
  }
  if (order.couponDiscount && order.couponDiscount > 0) {
    message += `Coupon Discount (${order.couponCode || 'Coupon'}): -${Math.round(order.couponDiscount)} EGP\n`;
  }
  if (order.discount && order.discount > 0) {
    message += `Total Discount: -${Math.round(order.discount)} EGP\n`;
  }
  
  message += `*Total: ${order.total} EGP*\n\n`;

  // Add notes if present
  if (order.notes && order.notes.trim()) {
    message += `*Customer Notes:*\n${order.notes}\n\n`;
  }

  message += `*Payment Method: InstaPay*\n`;
  message += `Please complete your payment using the link below:\n\n`;
  message += `${INSTAPAY_TRANSFER_LINK}\n\n`;
  
  message += `*Payment Instructions:*\n`;
  message += `1. Click the link above or copy it to your browser\n`;
  message += `2. Enter amount: ${order.total} EGP\n`;
  message += `3. Complete the payment\n`;
  message += `4. Send us the payment confirmation screenshot\n`;
  message += `5. We will process and ship your order immediately\n\n`;

  message += `Thank you for shopping with us!\n`;
  message += `GedarStore Team`;

  return message;
};

/**
 * Build WhatsApp message for order confirmation (main function)
 * @param {Object} order - The order object
 * @param {String} paymentMethod - Payment method (cod, instapay, wallet, etc.)
 * @returns {String} - Formatted message text in English
 */
export const buildOrderConfirmationMessage = (order, paymentMethod = "cod") => {
  if (paymentMethod === "instapay") {
    return buildInstaPayMessageNew(order);
  } else {
    return buildCODMessage(order);
  }
};

/**
 * Generate WhatsApp URL for sending message
 * @param {String} message - The message to send
 * @param {String} phoneNumber - Optional phone number (default: store number)
 * @returns {String} - WhatsApp URL
 */
export const generateWhatsAppURL = (message, phoneNumber = STORE_WHATSAPP_NUMBER) => {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
};

/**
 * Open WhatsApp with message
 * @param {String} message - The message to send
 * @param {String} phoneNumber - Optional phone number
 */
export const openWhatsAppMessage = (message, phoneNumber = STORE_WHATSAPP_NUMBER) => {
  const url = generateWhatsAppURL(message, phoneNumber);
  window.open(url, "_blank");
};

/**
 * Build InstaPay payment message with reference code (legacy)
 * @param {Object} order - The order object
 * @param {String} instaPayTag - InstaPay tag to send payment to
 * @returns {String} - Formatted message
 */
export const buildInstaPayMessage = (order, instaPayTag) => {
  return buildInstaPayMessageNew(order);
};

/**
 * Send WhatsApp message via customer's phone (using message builder)
 * This opens WhatsApp Web for the user to send the message manually
 * @param {String} phoneNumber - Customer's phone number
 * @param {String} message - Message to send
 */
export const sendWhatsAppToCustomer = (phoneNumber, message) => {
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const formattedNumber = cleanNumber.startsWith('20') ? cleanNumber : '20' + cleanNumber;
  
  const url = generateWhatsAppURL(message, formattedNumber);
  window.open(url, "_blank");
};

/**
 * Copy message to clipboard for manual sending
 * @param {String} message - Message to copy
 */
export const copyMessageToClipboard = (message) => {
  navigator.clipboard.writeText(message).then(() => {
    return true;
  }).catch(err => {
    console.error("Failed to copy message:", err);
    return false;
  });
};

const whatsappService = {
  buildOrderConfirmationMessage,
  buildCODMessage,
  buildInstaPayMessageNew,
  generateWhatsAppURL,
  openWhatsAppMessage,
  buildInstaPayMessage,
  sendWhatsAppToCustomer,
  copyMessageToClipboard,
  STORE_WHATSAPP_NUMBER,
  INSTAPAY_TRANSFER_LINK
};

export default whatsappService;
