export enum VneMessCode {

  GenericRequestError = 100,
  UnknownTipoParameter = 101,
  GenericProcessingError = 102,
  PaymentOrWithdrawalError = 103,
  UnknownTransactionId = 104,
  PaymentAlreadyInProgress = 105,
  DenominationNotAvailable = 106,
  LogoutNotAllowedPaymentPending = 107,
  InvalidCredentials = 108,

  OperationAlreadyInProgress = 110,

  PosCancelError = 113,
  CancelNotAllowedDifferentUser = 114,

  AuthenticationFailed = 120
}
