import { useMemo, useState } from "react";
import { CURRENT_LOCATION_ID } from "../constants";
import { formatTemperature, titleCase } from "../utils/format";
import type { SavedCity, WeatherSnapshot } from "../types";

export type CityManagerProps = {
  savedCities: SavedCity[];
  weatherById: Record<string, WeatherSnapshot>;
  currentWeather?: WeatherSnapshot | null;
  selectedCityId: string | null;
  onSelectCity: (cityId: string) => void;
  onRemoveCity: (cityId: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onAddCity: (query: string) => Promise<string | undefined>;
  isAddingCity: boolean;
  locationStatus: "idle" | "pending" | "ready" | "error";
};

const LOCATION_STATUS_TEXT: Record<CityManagerProps["locationStatus"], string> =
  {
    idle: "Разрешите геолокацию, чтобы увидеть погоду поблизости.",
    pending: "Определяем ваши координаты...",
    ready: "Координаты получены.",
    error: "Геолокация недоступна. Выберите город вручную.",
  };

const CityManager = ({
  savedCities,
  weatherById,
  currentWeather,
  selectedCityId,
  onSelectCity,
  onRemoveCity,
  searchTerm,
  onSearchTermChange,
  onAddCity,
  isAddingCity,
  locationStatus,
}: CityManagerProps) => {
  const [newCity, setNewCity] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const filteredCities = useMemo(() => {
    if (!searchTerm.trim()) {
      return savedCities;
    }
    const query = searchTerm.trim().toLowerCase();
    return savedCities.filter((city) => {
      return (
        city.name.toLowerCase().includes(query) ||
        city.country.toLowerCase().includes(query) ||
        city.state?.toLowerCase().includes(query)
      );
    });
  }, [savedCities, searchTerm]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newCity.trim()) {
      setFormError("Введите название города.");
      return;
    }
    const outcome = await onAddCity(newCity);
    if (outcome) {
      setFormError(outcome);
    } else {
      setFormError(null);
      setNewCity("");
    }
  };

  return (
    <aside className="glass-panel  space-y-5 p-5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">Мои города</h2>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            {savedCities.length}
          </span>
        </div>
        <p className="mt-1 text-sm text-white/70">
          Добавляйте города и переключайтесь между ними в один клик.
        </p>
      </div>

      <label className="block text-sm text-white/70">
        Поиск по сохранённым городам
        <input
          type="search"
          name="search-city"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Например, Казань"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-sky focus:bg-white/10"
        />
      </label>

      <div className="rounded-2xl border border-white/5 bg-white/5">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">
              Текущее местоположение
            </p>
            <p className="text-xs text-white/70">
              {LOCATION_STATUS_TEXT[locationStatus]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectCity(CURRENT_LOCATION_ID)}
            className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
              selectedCityId === CURRENT_LOCATION_ID
                ? "bg-sky-400 text-slate-900"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            Открыть
          </button>
        </div>
        {currentWeather ? (
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">
                {currentWeather.name || "Моё местоположение"}
              </p>
              <p className="text-xs text-white/70">{currentWeather.country}</p>
            </div>
            <span className="text-lg font-semibold text-white">
              {formatTemperature(currentWeather.temperature)}
            </span>
          </div>
        ) : (
          <p className="px-4 py-3 text-xs text-white/60">
            Данных пока нет. Разрешите доступ к геолокации.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-white/80">Сохранённые города</p>
        <div className="saved-cities-scroll space-y-2">
          {filteredCities.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/60">
              Ничего не найдено. Измените запрос.
            </p>
          )}
          {filteredCities.map((city) => {
            const weather = weatherById[city.id];
            const subtitle = city.state
              ? `${city.country}, ${city.state}`
              : city.country;
            const isSelected = city.id === selectedCityId;

            return (
              <div
                key={city.id}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
                  isSelected
                    ? "border-sky-400/60 bg-white/10"
                    : "border-white/5 bg-white/5 hover:border-sky-400/40 hover:bg-white/10"
                }`}
              >
                <button
                  type="button"
                  className="flex flex-1 flex-col items-start text-left"
                  onClick={() => onSelectCity(city.id)}
                >
                  <span className="text-sm font-semibold text-white">
                    {city.name}
                  </span>
                  <span className="text-xs text-white/70">{subtitle}</span>
                </button>
                <div className="flex items-center gap-2">
                  {weather && (
                    <span className="text-base font-semibold text-white">
                      {formatTemperature(weather.temperature)}
                    </span>
                  )}
                  <button
                    type="button"
                    className="text-xs font-medium text-white/60 transition hover:text-red-400"
                    onClick={() => onRemoveCity(city.id)}
                    aria-label={`Удалить ${titleCase(city.name)}`}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-white">
          Добавить город
          <input
            type="text"
            value={newCity}
            onChange={(event) => setNewCity(event.target.value)}
            placeholder="Например, Санкт-Петербург"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-sky focus:bg-white/10"
          />
        </label>
        {formError && <p className="text-xs text-red-400">{formError}</p>}
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isAddingCity}
        >
          {isAddingCity ? "Сохраняем..." : "Сохранить"}
        </button>
        <p className="text-xs text-white/60">
          Используем геокодер OpenWeather. Укажите страну, если нужный город не
          находится.
        </p>
      </form>
    </aside>
  );
};

CityManager.displayName = "CityManager";

export default CityManager;
