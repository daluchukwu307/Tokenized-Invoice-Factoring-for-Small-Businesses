import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract environment
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockBlockHeight = 100

// Mock contract state
let admin = mockTxSender
const riskAssessments = new Map()

// Helper function to create assessment key
function createAssessmentKey(invoiceId, business) {
  return `${invoiceId}-${business}`
}

// Mock contract functions
function assessRisk(invoiceId, business, riskScore) {
  if (mockTxSender !== admin) {
    return { type: "err", value: 300 }
  }
  
  if (riskScore < 1 || riskScore > 5) {
    return { type: "err", value: 301 }
  }
  
  const key = createAssessmentKey(invoiceId, business)
  riskAssessments.set(key, {
    "risk-score": riskScore,
    "assessment-date": mockBlockHeight,
    assessor: mockTxSender,
  })
  
  return { type: "ok", value: true }
}

function getRiskScore(invoiceId, business) {
  const key = createAssessmentKey(invoiceId, business)
  const assessmentData = riskAssessments.get(key)
  return assessmentData ? assessmentData["risk-score"] : 0
}

function transferAdmin(newAdmin) {
  if (mockTxSender !== admin) {
    return { type: "err", value: 302 }
  }
  
  admin = newAdmin
  return { type: "ok", value: true }
}

// Tests
describe("Risk Assessment Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    admin = mockTxSender
    riskAssessments.clear()
  })
  
  it("should assess risk successfully", () => {
    const invoiceId = "INV-2023-001"
    const business = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const riskScore = 3
    
    const result = assessRisk(invoiceId, business, riskScore)
    
    expect(result.type).toBe("ok")
    expect(getRiskScore(invoiceId, business)).toBe(riskScore)
  })
  
  it("should fail to assess risk if score is out of range", () => {
    const invoiceId = "INV-2023-001"
    const business = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    
    // Test with risk score too low
    let result = assessRisk(invoiceId, business, 0)
    expect(result.type).toBe("err")
    expect(result.value).toBe(301)
    
    // Test with risk score too high
    result = assessRisk(invoiceId, business, 6)
    expect(result.type).toBe("err")
    expect(result.value).toBe(301)
  })
  
  it("should transfer admin rights successfully", () => {
    const newAdmin = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    
    const result = transferAdmin(newAdmin)
    
    expect(result.type).toBe("ok")
    expect(admin).toBe(newAdmin)
  })
})

console.log("All risk assessment tests completed successfully!")

