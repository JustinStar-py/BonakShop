# ZarinPal Payment Gateway (PG v4) — Integration Documentation (for Next.js)

**Audience:** developers (e.g., Next.js apps) who need to integrate ZarinPal Internet Payment Gateway using REST JSON APIs.  
**Scope:** payment initiation (request), user redirect, callback handling, and payment verification (verify).  
**Official docs referenced:** ZarinPal “Connect to Gateway” guide and “Error List”. citeturn2view0turn2view2turn2view3

---

## 1) Core payment flow

1. **Create a payment request** (server-to-server) and receive an **authority** code. citeturn2view0  
2. **Redirect the user** to ZarinPal payment page using the authority. citeturn2view0turn2view3  
3. After payment/cancel, ZarinPal redirects the user to your **callback_url** with query params (Status, Authority). citeturn2view0  
4. If `Status=OK`, **verify** the payment (server-to-server) using the authority + amount. citeturn2view0  
5. On successful verification, store the transaction and show `ref_id` to the user. citeturn2view0  

---

## 2) Endpoints

### 2.1 Payment Request
**URL (official):**
- `POST https://payment.zarinpal.com/pg/v4/payment/request.json` citeturn2view0

**Headers:**
- `Content-Type: application/json`
- `Accept: application/json` citeturn2view0

**Request body fields (JSON):** citeturn2view0

| Field | Type | Required | Notes |
|---|---:|:---:|---|
| merchant_id | string | ✅ | 36-character merchant ID |
| amount | integer | ✅ | transaction amount |
| currency | string | ❌ | `IRR` or `IRT` |
| description | string | ✅ | up to 500 chars |
| callback_url | string | ✅ | your return URL |
| referrer_id | string | ❌ | affiliate/referrer code |
| metadata | object | ❌ | may include `mobile`, `email`, `order_id` |
| metadata.mobile | string | ❌ | customer mobile |
| metadata.email | string | ❌ | customer email |
| metadata.order_id | string | ❌ | your order number |

**Success response (example):** citeturn2view0
```json
{
  "data": {
    "code": 100,
    "message": "Success",
    "authority": "A0000000000000000000000000000wwOGYpd",
    "fee_type": "Merchant",
    "fee": 100
  },
  "errors": []
}
```

**Meaning of key fields:**
- `data.code = 100` → request created successfully. citeturn2view0turn2view2  
- `data.authority` → unique payment authority code used for redirect and verify. citeturn2view0  

---

### 2.2 Redirect user to payment page

After you receive `authority`, redirect the user to:

- **Redirect pattern (docs):**  
  `https://payment.zarinpal.com/pg/StartPay/{authority}` citeturn2view0  
- **Alternative pattern seen in ZarinPal “next” guide:**  
  `https://www.zarinpal.com/pg/StartPay/{authority}` citeturn2view3  

> Use the redirect host recommended in the same documentation set you’re following (the “Connect to Gateway” guide uses the `payment.zarinpal.com` host). citeturn2view0

---

### 2.3 Callback / Return to merchant website

ZarinPal redirects the user to your `callback_url` after payment attempt. citeturn2view0

**Query parameters (docs):** citeturn2view0
- `Status` → `"OK"` or `"NOK"`
- `Authority` → authority code

**Example:** citeturn2view0
```
https://your-callback-url?Authority=A0000...&Status=OK
```

**Important rule (docs):**
- Call **verify** only if `Status=OK`. citeturn2view0

---

### 2.4 Payment Verify

**URL (official):**
- `POST https://payment.zarinpal.com/pg/v4/payment/verify.json` citeturn2view0

**Headers:**
- `Content-Type: application/json`
- `Accept: application/json`

**Request body (JSON):** citeturn2view0
```json
{
  "merchant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "amount": 1000,
  "authority": "A0000000000000000000000000000wwOGYpd"
}
```

**Verify response fields (docs):** citeturn2view0
- `code` (integer) → payment result status
- `ref_id` (integer) → transaction reference number (on success)
- `card_pan` (string) → masked card number
- `card_hash` (string) → SHA256 card hash
- `fee_type`, `fee` → fee info

**Successful verification codes:**
- `code = 100` → payment verified successfully. citeturn2view0turn2view2  
- `code = 101` → already verified once (still indicates success). citeturn2view0turn2view2  

**Note about idempotency (docs):**
- For a successful transaction, `verify` returns code **100 only once**; subsequent verifies return **101**. citeturn2view0turn2view2  

---

## 3) Error handling (selected)

ZarinPal returns error codes; implement robust handling and logging. citeturn2view2

Common examples from the official error list: citeturn2view2
- `-9` Validation error (missing/invalid inputs such as merchant_id, callback_url, description length, amount range)
- `-10` Invalid terminal (merchant_id or IP mismatch)
- `-14` Callback URL domain mismatch with the registered terminal domain
- `-50` Amount mismatch between verify and the paid amount
- `-54` Invalid authority
- `100` Success
- `101` Verified (already verified)

---

## 4) Next.js integration notes (architecture guidance)

Even if your UI is Next.js, treat payment operations as **server responsibilities**:

- **Never** expose `merchant_id` or run `verify` from the browser.
- Implement:
  - a server endpoint to call **payment/request** and return a redirect URL
  - a server callback route to read `Status`/`Authority` and call **payment/verify**
- Store an order record **before redirect**, and update it **after verify**.
- Always compare:
  - expected order amount (your DB)
  - amount you send to `verify`
  - response `code` and `ref_id` from verify

These are standard gateway security practices and align with ZarinPal’s requirement to verify after callback. citeturn2view0

---

## 5) Minimal reference sequence (pseudo)

```text
1) Server: POST /pg/v4/payment/request.json  -> receives authority
2) Client: Redirect to StartPay/{authority}
3) ZarinPal -> redirects user back to callback_url?Status=OK&Authority=...
4) Server: if Status=OK then POST /pg/v4/payment/verify.json
5) Server: if code in {100,101} mark order paid and store ref_id
```

---

## 6) Source links (official)

- ZarinPal — Connect to Gateway (Payment Request, Redirect, Callback, Verify) citeturn2view0  
- ZarinPal — Error List citeturn2view2  
- ZarinPal “next” guide — redirect URL pattern citeturn2view3  
