# PayPal and Pago Móvil Configuration

## PayPal Setup

### 1. Create PayPal Business Account
- Go to https://developer.paypal.com
- Create a business account
- Get your Client ID and Secret

### 2. Environment Variables
Add to your `.env` file:

```env
# PayPal Credentials
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_ENV=sandbox  # or 'production'
```

### 3. Webhook Configuration (Optional)
Set up PayPal webhooks to receive payment notifications:
- Webhook URL: `https://yourdomain.com/api/store/payment/paypal/webhook`
- Events to subscribe:
  - PAYMENT.CAPTURE.COMPLETED
  - PAYMENT.CAPTURE.DECLINED

---

## Pago Móvil Setup

### 1. Bank Configuration
Update the Pago Móvil details in checkout page:

```typescript
// In checkout page, Step 3
<p><strong>Banco:</strong> Tu Banco Aquí</p>
<p><strong>Teléfono:</strong> 0412-XXXXXXX</p>
<p><strong>RIF:</strong> J-XXXXXXXX-X</p>
```

### 2. Manual Verification Process
Pago Móvil payments require manual verification:

1. Customer submits payment info
2. Order status: "pending_verification"
3. Admin verifies payment in bank
4. Admin approves/rejects via:
   ```
   PATCH /api/store/payment/pago-movil/verify
   {
     "orderId": "xxx",
     "approved": true
   }
   ```

### 3. Admin Panel (TODO)
Create admin page to verify Pago Móvil payments:
- `/dashboard/ordenes-online`
- Filter by "pending_verification"
- View payment details
- Approve/Reject button

---

## Payment Flow

### Cashea
1. Select product → Add to cart
2. Checkout → Choose "Cashea"
3. Redirect to Cashea payment page
4. Customer pays
5. Webhook confirms → Order approved
6. Stock deducted automatically

### PayPal
1. Select product → Add to cart
2. Checkout → Choose "PayPal"
3. Redirect to PayPal
4. Customer pays
5. Return to site → Capture payment
6. Order approved → Stock deducted

### Pago Móvil
1. Select product → Add to cart
2. Checkout → Choose "Pago Móvil"
3. See bank details
4. Order created (pending)
5. Customer makes transfer
6. Customer submits reference number
7. Admin verifies (24-48h)
8. If approved → Stock deducted

---

## Testing

### PayPal Sandbox
Use PayPal sandbox accounts for testing:
- https://developer.paypal.com/developer/accounts
- Create buyer and seller test accounts

### Pago Móvil Testing
For testing, you can auto-approve Pago Móvil payments or create a test mode.

---

## Supported Currencies

- **Cashea:** USD, VES
- **PayPal:** USD only
- **Pago Móvil:** VES only

---

## Security Notes

1. Never commit API keys to git
2. Use `.env` for all credentials
3. Validate all payment amounts server-side
4. Log all payment attempts
5. Implement rate limiting on payment endpoints
