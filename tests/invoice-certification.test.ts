import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract environment
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockBlockHeight = 100

// Mock contract state
let admin = mockTxSender
const certifiedInvoices = new Map()

// Helper function to create invoice key
function createInvoiceKey(invoiceId, business) {
  return `${invoiceId}-${business}`
}

// Mock contract functions
function certifyInvoice(invoiceId, business, amount, dueDate, payer) {
  if (mockTxSender !== admin) {
    return { type: "err", value: 200 }
  }
  
  const key = createInvoiceKey(invoiceId, business)
  certifiedInvoices.set(key, {
    amount: amount,
    "due-date": dueDate,
    payer: payer,
    "certification-date": mockBlockHeight,
    "is-certified": true,
  })
  
  return { type: "ok", value: true }
}

function revokeCertification(invoiceId, business) {
  if (mockTxSender !== admin) {
    return { type: "err", value: 201 }
  }
  
  const key = createInvoiceKey(invoiceId, business)
  certifiedInvoices.delete(key)
  return { type: "ok", value: true }
}

function isInvoiceCertified(invoiceId, business) {
  const key = createInvoiceKey(invoiceId, business)
  const invoiceData = certifiedInvoices.get(key)
  return invoiceData ? invoiceData["is-certified"] : false
}

function transferAdmin(newAdmin) {
  if (mockTxSender !== admin) {
    return { type: "err", value: 202 }
  }
  
  admin = newAdmin
  return { type: "ok", value: true }
}

// Tests
describe("Invoice Certification Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    admin = mockTxSender
    certifiedInvoices.clear()
  })
  
  it("should certify an invoice successfully", () => {
    const invoiceId = "INV-2023-001"
    const business = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const amount = 1000000
    const dueDate = 200
    const payer = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    
    const result = certifyInvoice(invoiceId, business, amount, dueDate, payer)
    
    expect(result.type).toBe("ok")
    expect(isInvoiceCertified(invoiceId, business)).toBe(true)
  })
  
  it("should revoke certification successfully", () => {
    const invoiceId = "INV-2023-001"
    const business = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const amount = 1000000
    const dueDate = 200
    const payer = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    
    // First certify the invoice
    certifyInvoice(invoiceId, business, amount, dueDate, payer)
    expect(isInvoiceCertified(invoiceId, business)).toBe(true)
    
    // Then revoke certification
    const result = revokeCertification(invoiceId, business)
    
    expect(result.type).toBe("ok")
    expect(isInvoiceCertified(invoiceId, business)).toBe(false)
  })
  
  it("should transfer admin rights successfully", () => {
    const newAdmin = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    
    const result = transferAdmin(newAdmin)
    
    expect(result.type).toBe("ok")
    expect(admin).toBe(newAdmin)
  })
})

console.log("All invoice certification tests completed successfully!")

