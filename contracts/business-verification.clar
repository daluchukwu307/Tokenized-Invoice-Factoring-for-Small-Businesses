;; Business Verification Contract
;; Validates the legitimacy of small enterprises

(define-data-var admin principal tx-sender)

;; Map to store verified businesses
(define-map verified-businesses principal
  {
    business-name: (string-utf8 100),
    registration-number: (string-utf8 50),
    verification-date: uint,
    is-verified: bool
  }
)

;; Public function to verify a business
(define-public (verify-business
    (business principal)
    (business-name (string-utf8 100))
    (registration-number (string-utf8 50)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (map-set verified-businesses business
      {
        business-name: business-name,
        registration-number: registration-number,
        verification-date: block-height,
        is-verified: true
      }
    ))
  )
)

;; Public function to revoke verification
(define-public (revoke-verification (business principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u101))
    (ok (map-delete verified-businesses business))
  )
)

;; Read-only function to check if a business is verified
(define-read-only (is-business-verified (business principal))
  (default-to false (get is-verified (map-get? verified-businesses business)))
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u102))
    (ok (var-set admin new-admin))
  )
)

