import { createStore, Store } from '../mvuex';

export default createStore({
  state: {
    userInfo: {
      name: 'hangye',
      age: 18,
      money: 9999,
    }
  },
  getters: {
    getMoneyPlus(state) {
      return state.userInfo.money * 10;
    },
  },
  mutations: {
    addMoney(state, money = 2) {
      state.userInfo.money = state.userInfo.money * money;
    }
  },
  actions: {
    addMoneyAsync({ commit }, money = 1) {
      setTimeout(() => {
        commit('addMoney')
      }, 1000)
    }
  },
//   modules: {
//     job: {
//       state: {
//         type: 'it',
//         title: 'web front end',
//         money: 50000,
//       },
//       mutations: {
//         addMoney(state) {
//           state.money = state.money + 5000;
//         }
//       },
//       actions: {
//         addMoneyAsync({ commit }) {
//           setTimeout(() => {
//             commit('addMoney');
//           }, 2000);
//         }
//       },
//       getters: {
//         getJobMoneyAfterTax(state) {
//           return state.money - 5000;
//         },
//       }
//     }
//   }
})
