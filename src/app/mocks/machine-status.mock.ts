export const MACHINE_STATUS_MOCK: MachineStatus = {
  tipo: 20,

  recycler: {
    error: 0,
    mess: "OK",
    totalInRecycle: 15500,
    stacker: "0",

    banconota_1: {
      max_level: "28",
      min_level: "10",
      alert: 0,
      valore: 500,
      quantita: "12"
    },
    banconota_2: {
      max_level: "28",
      min_level: "10",
      alert: 1,
      valore: 1000,
      quantita: "4"
    },
    banconota_3: {
      max_level: "28",
      min_level: "10",
      alert: 2,
      valore: 2000,
      quantita: "0"
    },
    banconota_4: {
      max_level: "28",
      min_level: "10",
      alert: 0,
      valore: 5000,
      quantita: "3"
    }
  },

  hopper: {
    error: 1,
    mess: "H01",
    totalInRecycle: 2485,
    stacker: 0,

    moneta_5: 20,
    moneta_5_alert: 3,

    moneta_10: 12,
    moneta_10_alert: 1,

    moneta_20: 5,
    moneta_20_alert: 0,

    moneta_50: 25,
    moneta_50_alert: 0,

    moneta_100: 2,
    moneta_100_alert: 1,

    moneta_200: 0,
    moneta_200_alert: 2
  }
};