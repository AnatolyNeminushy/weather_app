export type Coordinates = {
  lat: number
  lon: number
}

export type SavedCity = {
  id: string
  name: string
  country: string
  state?: string
  coords: Coordinates
}

export type WeatherSnapshot = {
  cityId: string
  name: string
  country: string
  coords: Coordinates
  description: string
  icon: string
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  sunrise: number
  sunset: number
  timezoneOffset: number
  updatedAt: number
}

export type WeatherSettings = {
  showFeelsLike: boolean
  showHumidity: boolean
  showSunTimes: boolean
  showWind: boolean
}

export type GeocodedCity = {
  name: string
  country: string
  state?: string
  coords: Coordinates
}

