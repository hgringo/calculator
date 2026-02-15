// vne-command-type.enum.ts
export enum VneCommandType {

  // Payments
  PaymentRequest = 1,
  PaymentPolling = 2,
  DeletePendingPayment = 3,
  PendingPaymentsList = 5,

  // Withdrawals
  OperatorWithdrawalRequest = 10,
  OperatorWithdrawalPolling = 11,
  EndOperatorWithdrawal = 12,

  // Machine status
  MachineStatus = 20,

  // Refill
  StartRefill = 30,
  EndRefill = 31,
  ManualRefill = 32,
  PollingRefill = 33,

  // Operator session
  OperatorLogin = 40,
  OperatorLogout = 41,

  // Emptying
  HopperEmptying = 50,
  RecyclerEmptying = 51,
  StackerCancellation = 52,
  EmptyingPolling = 53,
  CoinDispenserEmptying = 54,
  DoorOpening = 55,

  // Cash closing
  CashClosing = 60,

  // Refund
  Refund = 65,
  RefundPolling = 66,

  // Logs
  WithdrawalsList = 70,
  PaymentsList = 71,
  OpeningsList = 72,
  CashClosingList = 73,

  // System
  MenuAccess = 80,
  RebootShutdown = 81,
  MachineVersion = 82,

  // Config
  PeripheralsConfiguration = 90,
  SoftwareConfiguration = 91,
  PettyCashSetting = 92,
  EndPettyCashRestore = 93
}