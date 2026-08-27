import QuotationConfigService from '../../services/quotationConfigService.js'

const state = {
  hourlyRate: 0,
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  hoursPerDay: 8,
  loading: false,
  error: null
}

const getters = {
  isConfigured: (state) => state.hourlyRate > 0,

  configSummary: (state) => ({
    hourlyRate: state.hourlyRate,
    workingDays: state.workingDays,
    hoursPerDay: state.hoursPerDay
  })
}

const mutations = {
  SET_CONFIG(state, config) {
    state.hourlyRate = config.hourlyRate
    state.workingDays = config.workingDays
    state.hoursPerDay = config.hoursPerDay
  },

  SET_LOADING(state, bool) {
    state.loading = bool
  },

  SET_ERROR(state, errorMsg) {
    state.error = errorMsg
  }
}

const actions = {
  async loadConfig({ commit }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      const config = QuotationConfigService.load()
      commit('SET_CONFIG', config)
    } catch (error) {
      commit('SET_ERROR', error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async saveConfig({ commit }, config) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      const { valid, errors } = QuotationConfigService.validate(config)

      if (!valid) {
        const errorMsg = errors.join(', ')
        commit('SET_ERROR', errorMsg)
        throw new Error(errorMsg)
      }

      QuotationConfigService.save(config)
      commit('SET_CONFIG', config)
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
