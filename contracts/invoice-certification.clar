;; Invoice Certification Contract
;; Confirms delivery of goods or services

(define-data-var admin principal tx-sender)

;; Map to store certified invoices
(define-map certified-invoices (tuple (invoice-id (string-utf8 50)) (business principal))
  {
    amount: uint,
    due-date: uint,
    payer: principal,
    certification-date: uint,
    is-certified: bool
  }
)

;; Public function to certify an invoice
(define-public (certify-invoice
    (invoice-id (string-utf8 50))
    (business principal)
    (amount uint)
    (due-date uint)
    (payer principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u200))
    (ok (map-set certified-invoices (tuple (invoice-id invoice-id) (business business))
      {
        amount: amount,
        due-date: due-date,
        payer: payer,
        certification-date: block-height,
        is-certified: true
      }
    ))
  )
)

;; Public function to revoke certification
(define-public (revoke-certification (invoice-id (string-utf8 50)) (business principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u201))
    (ok (map-delete certified-invoices (tuple (invoice-id invoice-id) (business business))))
  )
)

;; Read-only function to check if an invoice is certified
(define-read-only (is-invoice-certified (invoice-id (string-utf8 50)) (business principal))
  (default-to false (get is-certified (map-get? certified-invoices (tuple (invoice-id invoice-id) (business business)))))
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u202))
    (ok (var-set admin new-admin))
  )
)

