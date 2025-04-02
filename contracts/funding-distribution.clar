;; Funding Distribution Contract
;; Manages early payment to small businesses

(define-data-var admin principal tx-sender)
(define-data-var fee-percentage uint u5) ;; 5% default fee

;; Map to track funded invoices
(define-map funded-invoices (tuple (invoice-id (string-utf8 50)) (business principal))
  {
    funded-amount: uint,
    funding-date: uint,
    due-date: uint,
    is-repaid: bool,
    funder: principal
  }
)

;; Map to track available funds
(define-map funder-balances principal uint)

;; Public function to add funds (for funders)
(define-public (add-funds (amount uint))
  (let ((current-balance (default-to u0 (map-get? funder-balances tx-sender))))
    (ok (map-set funder-balances tx-sender (+ current-balance amount)))
  )
)

;; Public function to fund an invoice
(define-public (fund-invoice
    (invoice-id (string-utf8 50))
    (business principal)
    (amount uint)
    (due-date uint))
  (let (
    (funder-balance (default-to u0 (map-get? funder-balances tx-sender)))
    (fee (/ (* amount (var-get fee-percentage)) u100))
    (funding-amount (- amount fee))
  )
    (asserts! (>= funder-balance amount) (err u400))
    (map-set funder-balances tx-sender (- funder-balance amount))
    (ok (map-set funded-invoices (tuple (invoice-id invoice-id) (business business))
      {
        funded-amount: funding-amount,
        funding-date: block-height,
        due-date: due-date,
        is-repaid: false,
        funder: tx-sender
      }
    ))
  )
)

;; Public function to repay a funded invoice
(define-public (repay-invoice (invoice-id (string-utf8 50)) (business principal))
  (let (
    (invoice (default-to
      { funded-amount: u0, funding-date: u0, due-date: u0, is-repaid: false, funder: tx-sender }
      (map-get? funded-invoices (tuple (invoice-id invoice-id) (business business)))))
    (repayment-amount (get funded-amount invoice))
    (funder (get funder invoice))
    (funder-balance (default-to u0 (map-get? funder-balances funder)))
  )
    (asserts! (not (get is-repaid invoice)) (err u401))
    (map-set funder-balances funder (+ funder-balance repayment-amount))
    (ok (map-set funded-invoices (tuple (invoice-id invoice-id) (business business))
      (merge invoice { is-repaid: true })
    ))
  )
)

;; Public function to set fee percentage
(define-public (set-fee-percentage (new-fee-percentage uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u402))
    (asserts! (<= new-fee-percentage u20) (err u403)) ;; Max 20% fee
    (ok (var-set fee-percentage new-fee-percentage))
  )
)

;; Read-only function to get current fee percentage
(define-read-only (get-fee-percentage)
  (var-get fee-percentage)
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u404))
    (ok (var-set admin new-admin))
  )
)

