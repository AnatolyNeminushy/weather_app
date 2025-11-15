import type { WeatherSettings, WeatherSnapshot } from '../types'
import { formatDate, formatLocalTime, formatRelativeUpdatedAt, formatTemperature, titleCase } from '../utils/format'

type WeatherCardProps = {
  data?: WeatherSnapshot | null
  settings: WeatherSettings
  isLoading: boolean
  isCurrentLocation: boolean
  locationStatus: 'idle' | 'pending' | 'ready' | 'error'
  onRefresh: () => void
  statusMessage?: string | null
  missingKey: boolean
}

const LOCATION_STATUS_TEXT: Record<WeatherCardProps['locationStatus'], string> = {
  idle: 'Разрешите геолокацию, чтобы увидеть погоду поблизости.',
  pending: 'Определяем ваши координаты...',
  ready: 'Местоположение определено.',
  error: 'Геолокация недоступна.',
}

const WeatherCard = ({
  data,
  settings,
  isLoading,
  isCurrentLocation,
  locationStatus,
  onRefresh,
  statusMessage,
  missingKey,
}: WeatherCardProps) => {
  const stats = [
    settings.showFeelsLike && {
      label: 'Ощущается как',
      value: data ? formatTemperature(data.feelsLike) : '-',
    },
    settings.showHumidity && {
      label: 'Влажность',
      value: data ? `${Math.round(data.humidity)}%` : '-',
    },
    settings.showWind && {
      label: 'Ветер',
      value: data ? `${Math.round(data.windSpeed)} м/с` : '-',
    },
    settings.showSunTimes && data && {
      label: 'Рассвет',
      value: formatLocalTime(data.sunrise, data.timezoneOffset),
    },
    settings.showSunTimes && data && {
      label: 'Закат',
      value: formatLocalTime(data.sunset, data.timezoneOffset),
    },
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <section className="glass-panel relative overflow-hidden p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">{formatDate(Date.now())}</p>
          <h1 className="text-3xl font-semibold text-white">
            {data?.name || (isCurrentLocation ? 'Моё местоположение' : 'Выберите город')}
          </h1>
          {data?.country && <p className="text-white/70">{data.country}</p>}
        </div>
        <div className="flex flex-col items-end gap-3 text-right">
          {isCurrentLocation && (
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
              {LOCATION_STATUS_TEXT[locationStatus]}
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="btn-secondary text-sm disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? 'Обновляем...' : 'Обновить'}
          </button>
        </div>
      </div>

      {missingKey && (
        <div className="mt-4 rounded-2xl border border-yellow-200/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
          Добавьте ключ OpenWeather в файл <code className="font-mono text-yellow-200">.env</code>, чтобы получать данные.
        </div>
      )}

      {statusMessage && (
        <div className="mt-4 rounded-2xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm text-white/90">
          {statusMessage}
        </div>
      )}

      {!data && !isLoading && (
        <p className="mt-6 text-center text-white/70">Выберите город или разрешите геолокацию, чтобы увидеть прогноз.</p>
      )}

      {data && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-baseline gap-4">
              <span className="text-7xl font-semibold text-white">{formatTemperature(data.temperature)}</span>
              <div className="text-lg text-white/70">{titleCase(data.description)}</div>
            </div>
            {data && settings.showFeelsLike && (
              <p className="mt-2 text-sm text-white/60">
                Ощущается как {formatTemperature(data.feelsLike)} - обновлено {formatRelativeUpdatedAt(data.updatedAt)}
              </p>
            )}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/60">{stat.label}</p>
                  <p className="text-lg font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-3">
            <img
              src={`https://openweathermap.org/img/wn/${data.icon}@4x.png`}
              alt={data.description}
              className="h-36 w-36 object-contain"
            />
            <p className="text-xs text-white/60">Источник: OpenWeather</p>
          </div>
        </div>
      )}
    </section>
  )
}

WeatherCard.displayName = 'WeatherCard'

export default WeatherCard
