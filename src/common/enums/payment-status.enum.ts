export enum PaymentStatus {
  PENDING             = 'pending',
  PAID                = 'paid',
  PAYOUT_QUEUED       = 'payout_queued',
  PAYOUT_SENT         = 'payout_sent',
  REFUNDED            = 'refunded',
  PARTIALLY_REFUNDED  = 'partially_refunded',
  FAILED              = 'failed',
  TEST_COMMISSION     = 'test_commission',
}
