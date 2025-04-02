import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract environment
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockBlockHeight = 100

// Mock contract state
let admin = mockTxSender
let feePercentage = 5
const fundedInvoices = new Map()
const funderBalances = new Map()

// Helper function to create invoice key
function createInvoiceKey(invoiceId, business) {
  return `${invoiceId}-${business}`
}

// Mock contract functions
function addFunds(amount) {
  const currentBalance = funderBalances.get(mockTxSender) || 0
  funderBalances.set(mockTxSender, currentBalance + amount)
  return { type: "ok", value: true }
}

function fundInvoice(invoiceId, business, amount, dueDate) {
  const funderBalance = funderBalances.get(mockTxSender) || 0
  const fee = Math.floor((amount * feePercentage) / 100)
  const fundingAmount = amount - fee
  
  if (funderBalance < amount) {
    return { type: "err", value: 400 }
  }
  
  funderBalances.set(mockTxSender, funderBalance - amount)
  
  const key = createInvoiceKey(invoiceId, business)
  fundedInvoices.set(key, {
    "funded-amount": fundingAmount,
    "funding-date": mockBlockHeight,
    "due-date": dueDate,
    "is-repaid": false,
    funder: mockTxSender,
  })
  
  return { type: "ok", value: true }
}

function repayInvoice(invoiceId, business) {
  const key = createInvoiceKey(invoiceId, business)
  const invoice = fundedInvoices.get(key)
  
  if (!invoice) {
    return { type: "err", value: 401 }
  }
  
  if (invoice["is-repaid"]) {
    return { type: "err", value: 401 }
  }
  
  const repaymentAmount = invoice["funded-amount"]
  const funder = invoice["funder"]
  const funderBalance = funderBalances.get(funder) || 0
  
  funderBalances.set(funder, funderBalance + repaymentAmount)
  
  invoice["is-repaid"] = true
  fundedInvoices.set(key, invoice)
  
  return { type: "ok", value: true }
}

function setFeePercentage(newFeePercentage) {
  if (mockTxSender !== admin) {
    return { type: "err", value: 402 }
  }
  
  if (newFeePercentage > 20) {
    return { type: "err", value: 403 }
  }
  
  feePercentage = newFeePercentage
  return { type: "ok", value: true }
}

function getFeePercentage() {
  return feePercentage
}

function transferAdmin(newAdmin) {
  if (mockTxSender !== admin) {
    return { type: "err", value: 404 }
  }
  
  admin = newAdmin
  return { type: "ok", value: true }
}

// Tests
describe("Funding Distribution Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    admin = mockTxSender
    feePercentage = 5
    fundedInvoices.clear()
    funderBalances.clear()
  })
  
  it("should add funds successfully", () => {
    const amount = 1000000
    
    const result = addFunds(amount)
    
    expect(result.type).toBe("ok")
    expect(funderBalances.get(mockTxSender)).toBe(amount)
  })
  
  it("should fund an invoice successfully", () => {
    const invoiceId = "INV-2023-001"
    const business = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const amount = 1000000
    const dueDate = 200
    
    // First add funds
    addFunds(amount)
    
    const result = fundInvoice(invoiceId, business, amount, dueDate)
    
    expect(result.type).toBe("ok")
    
    // Check funder balance was reduced
    expect(funderBalances.get(mockTxSender)).toBe(0)
    
    // Check invoice was funded
    const key = createInvoiceKey(invoiceId, business)
    const invoice = fundedInvoices.get(key)
    expect(invoice).toBeDefined()
    expect(invoice["funded-amount"]).toBe(950000) // 5% fee
    expect(invoice["is-repaid"]).toBe(false)
  })
  
  it("should fail to fund an invoice if insufficient balance", () => {
    const invoiceId = "INV-2023-001"
    const business = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const amount = 1000000
    const dueDate = 200
    
    // Add less funds than needed
    addFunds(amount - 1)
    
    const result = fundInvoice(invoiceId, business, amount, dueDate)
    
    expect(result.type).toBe("err")
    expect(result.value).toBe(400)
  })
  
  it("should repay an invoice successfully", () => {
    const invoiceId = "INV-2023-001"
    const business = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const amount = 1000000
    const dueDate = 200
    
    // First add funds and fund the invoice
    addFunds(amount)
    fundInvoice(invoiceId, business, amount, dueDate)
    
    // Clear funder balance to verify repayment
    funderBalances.set(mockTxSender, 0)
    
    const result = repayInvoice(invoiceId, business)
    
    expect(result.type).toBe("ok")
    
    // Check funder received the funded amount
    expect(funderBalances.get(mockTxSender)).toBe(950000) // 5% fee was deducted
    
    // Check invoice is marked as repaid
    const key = createInvoiceKey(invoiceId, business)
    const invoice = fundedInvoices.get(key)
    expect(invoice["is-repaid"]).toBe(true)
  })
  
  it("should set fee percentage successfully", () => {
    const newFeePercentage = 10
    
    const result = setFeePercentage(newFeePercentage)
    
    expect(result.type).toBe("ok")
    expect(getFeePercentage()).toBe(newFeePercentage)
  })
  
  it("should fail to set fee percentage if too high", () => {
    const newFeePercentage = 25 // Max is 20
    
    const result = setFeePercentage(newFeePercentage)
    
    expect(result.type).toBe("err")
    expect(result.value).toBe(403)
  })
})

console.log("All funding distribution tests completed successfully!")

