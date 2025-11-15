import type { WeatherSettings } from '../types'

type SettingsPanelProps = {
  open: boolean
  settings: WeatherSettings
  onChange: (next: WeatherSettings) => void
  onClose: () => void
}

const toggles: Array<{
  key: keyof WeatherSettings
  title: string
  description: string
}> = [
  {
    key: 'showFeelsLike',
    title: 'Ощущается как',
    description: 'Показывать дополнительный индикатор "ощущается как".',
  },
  {
    key: 'showHumidity',
    title: 'Влажность',
    description: 'Отображать относительную влажность выбранного города.',
  },
  {
    key: 'showWind',
    title: 'Скорость ветра',
    description: 'Добавлять скорость ветра в метрах в секунду.',
  },
  {
    key: 'showSunTimes',
    title: 'Рассвет и закат',
    description: 'Показывать местное время рассвета и заката.',
  },
]

const SettingsPanel = ({ open, settings, onChange, onClose }: SettingsPanelProps) => {
  if (!open) {
    return null
  }

  const handleToggle = (key: keyof WeatherSettings) => {
    onChange({ ...settings, [key]: !settings[key] })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-10">
      <div className="glass-panel w-full max-w-2xl p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-white">Настройки отображения</h3>
            <p className="text-sm text-white/70">Выберите дополнительные показатели, которые нужно показать на карточке погоды.</p>
          </div>
          <button type="button" className="btn-secondary whitespace-nowrap" onClick={onClose}>
            Готово
          </button>
        </div>
        <div className="mt-8 space-y-4">
          {toggles.map((toggle) => {
            const isEnabled = settings[toggle.key]
            return (
              <button
                type="button"
                key={toggle.key}
                onClick={() => handleToggle(toggle.key)}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left transition ${
                  isEnabled
                    ? 'border-sky-400/70 bg-sky-400/15'
                    : 'border-white/10 bg-white/5 hover:border-sky-400/40 hover:bg-white/10'
                }`}
              >
                <div>
                  <p className="font-medium text-white">{toggle.title}</p>
                  <p className="text-sm text-white/70">{toggle.description}</p>
                </div>
                <span
                  className={`inline-flex h-8 w-14 items-center rounded-full p-1 transition ${
                    isEnabled ? 'bg-sky-400' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-full bg-white transition ${
                      isEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

SettingsPanel.displayName = 'SettingsPanel'

export default SettingsPanel
