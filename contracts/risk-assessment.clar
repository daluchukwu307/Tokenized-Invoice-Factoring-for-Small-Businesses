;; Risk Assessment Contract
;; Evaluates likelihood of invoice payment

(define-data-var admin principal tx-sender)

;; Risk levels: 1 (lowest risk) to 5 (highest risk)
(define-map risk-assessments (tuple (invoice-id (string-utf8 50)) (business principal))
  {
    risk-score: uint,
    assessment-date: uint,
    assessor: principal
  }
)

;; Public function to assess invoice risk
(define-public (assess-risk
    (invoice-id (string-utf8 50))
    (business principal)
    (risk-score uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u300))
    (asserts! (and (>= risk-score u1) (<= risk-score u5)) (err u301))
    (ok (map-set risk-assessments (tuple (invoice-id invoice-id) (business business))
      {
        risk-score: risk-score,
        assessment-date: block-height,
        assessor: tx-sender
      }
    ))
  )
)

;; Read-only function to get risk score
(define-read-only (get-risk-score (invoice-id (string-utf8 50)) (business principal))
  (get risk-score (default-to
    { risk-score: u0, assessment-date: u0, assessor: tx-sender }
    (map-get? risk-assessments (tuple (invoice-id invoice-id) (business business)))))
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u302))
    (ok (var-set admin new-admin))
  )
)

