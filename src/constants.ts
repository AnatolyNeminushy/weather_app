import type { WeatherSettings } from './types'

export const CURRENT_LOCATION_ID = 'current-location'
export const STALE_AFTER_MS = 15 * 60 * 1000

export const STORAGE_KEYS = {
  settings: 'wa:settings',
  cities: 'wa:cities',
  selectedCity: 'wa:selected-city',
  weatherCache: 'wa:weather-cache',
  currentLocation: 'wa:current-location',
} as const

export const DEFAULT_SETTINGS: WeatherSettings = {
  showFeelsLike: true,
  showHumidity: true,
  showSunTimes: true,
  showWind: true,
}

