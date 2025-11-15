import type { Coordinates, GeocodedCity } from '../types'

const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct'

type WeatherApiResponse = {
  name: string
  timezone: number
  weather: Array<{
    description: string
    icon: string
  }>
  main: {
    temp: number
    feels_like: number
    humidity: number
  }
  sys: {
    country: string
    sunrise: number
    sunset: number
  }
  wind: {
    speed: number
  }
}

type GeocodeApiResponse = Array<{
  name: string
  local_names?: Record<string, string>
  lat: number
  lon: number
  country: string
  state?: string
}>

export type WeatherPayload = {
  name: string
  country: string
  description: string
  icon: string
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  sunrise: number
  sunset: number
  timezoneOffset: number
  coords: Coordinates
}

const ensureApiKey = (key?: string) => {
  if (!key) {
    throw new Error('Добавьте переменную VITE_OPENWEATHER_API_KEY, чтобы приложение могло обращаться к API.')
  }
  return key
}

export const fetchWeatherByCoords = async (coords: Coordinates, apiKey?: string): Promise<WeatherPayload> => {
  const key = ensureApiKey(apiKey)
  const params = new URLSearchParams({
    lat: String(coords.lat),
    lon: String(coords.lon),
    appid: key,
    units: 'metric',
    lang: 'ru',
  })

  const response = await fetch(`${WEATHER_URL}?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Не удалось загрузить прогноз. Проверьте координаты и ключ API.')
  }

  const data = (await response.json()) as WeatherApiResponse
  const weather = data.weather?.[0]

  return {
    name: data.name,
    country: data.sys?.country ?? '',
    description: weather?.description ?? 'Без описания',
    icon: weather?.icon ?? '01d',
    temperature: data.main?.temp ?? 0,
    feelsLike: data.main?.feels_like ?? 0,
    humidity: data.main?.humidity ?? 0,
    windSpeed: data.wind?.speed ?? 0,
    sunrise: data.sys?.sunrise ?? 0,
    sunset: data.sys?.sunset ?? 0,
    timezoneOffset: data.timezone ?? 0,
    coords,
  }
}

export const lookupCityByName = async (query: string, apiKey?: string): Promise<GeocodedCity> => {
  const key = ensureApiKey(apiKey)
  const params = new URLSearchParams({
    q: query.trim(),
    limit: '5',
    appid: key,
  })

  const response = await fetch(`${GEO_URL}?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Не удалось определить координаты города. Попробуйте ещё раз.')
  }
  const results = (await response.json()) as GeocodeApiResponse
  const match = results[0]
  if (!match) {
    throw new Error('Город не найден. Уточните запрос.')
  }

  const localizedName = match.local_names?.ru ?? match.name

  return {
    name: localizedName,
    country: match.country ?? '',
    state: match.state,
    coords: { lat: match.lat, lon: match.lon },
  }
}
