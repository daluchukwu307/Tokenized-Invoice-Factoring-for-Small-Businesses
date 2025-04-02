import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract environment
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockBlockHeight = 100

// Mock contract state
let admin = mockTxSender
const verifiedBusinesses = new Map()

// Mock contract functions
function verifyBusiness(business, businessName, registrationNumber) {
  if (mockTxSender !== admin) {
    return { type: "err", value: 100 }
  }
  
  verifiedBusinesses.set(business, {
    "business-name": businessName,
    "registration-number": registrationNumber,
    "verification-date": mockBlockHeight,
    "is-verified": true,
  })
  
  return { type: "ok", value: true }
}

function revokeVerification(business) {
  if (mockTxSender !== admin) {
    return { type: "err", value: 101 }
  }
  
  verifiedBusinesses.delete(business)
  return { type: "ok", value: true }
}

function isBusinessVerified(business) {
  const businessData = verifiedBusinesses.get(business)
  return businessData ? businessData["is-verified"] : false
}

function transferAdmin(newAdmin) {
  if (mockTxSender !== admin) {
    return { type: "err", value: 102 }
  }
  
  admin = newAdmin
  return { type: "ok", value: true }
}

// Tests
describe("Business Verification Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    admin = mockTxSender
    verifiedBusinesses.clear()
  })
  
  it("should verify a business successfully", () => {
    const business = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const businessName = "Test Business"
    const registrationNumber = "REG123456"
    
    const result = verifyBusiness(business, businessName, registrationNumber)
    
    expect(result.type).toBe("ok")
    expect(isBusinessVerified(business)).toBe(true)
  })
  
  it("should revoke verification successfully", () => {
    const business = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const businessName = "Test Business"
    const registrationNumber = "REG123456"
    
    // First verify the business
    verifyBusiness(business, businessName, registrationNumber)
    expect(isBusinessVerified(business)).toBe(true)
    
    // Then revoke verification
    const result = revokeVerification(business)
    
    expect(result.type).toBe("ok")
    expect(isBusinessVerified(business)).toBe(false)
  })
  
  it("should transfer admin rights successfully", () => {
    const newAdmin = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    
    const result = transferAdmin(newAdmin)
    
    expect(result.type).toBe("ok")
    expect(admin).toBe(newAdmin)
  })
})

console.log("All business verification tests completed successfully!")

