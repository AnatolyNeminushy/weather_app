import { useCallback, useEffect, useMemo, useState } from "react";
import CityManager from "./components/CityManager";
import SettingsPanel from "./components/SettingsPanel";
import WeatherCard from "./components/WeatherCard";
import {
  CURRENT_LOCATION_ID,
  DEFAULT_SETTINGS,
  STALE_AFTER_MS,
  STORAGE_KEYS,
} from "./constants";
import { usePersistentState } from "./hooks/usePersistentState";
import { fetchWeatherByCoords, lookupCityByName } from "./services/weather";
import type { SavedCity, WeatherSnapshot, WeatherSettings } from "./types";

type CityDescriptor = {
  name: string;
  country: string;
  coords: { lat: number; lon: number };
};

const App = () => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  const [settings, setSettings] = usePersistentState<WeatherSettings>(
    STORAGE_KEYS.settings,
    () => DEFAULT_SETTINGS
  );
  const [cities, setCities] = usePersistentState<SavedCity[]>(
    STORAGE_KEYS.cities,
    () => []
  );
  const [selectedCityId, setSelectedCityId] = usePersistentState<string | null>(
    STORAGE_KEYS.selectedCity,
    () => null
  );
  const [weatherById, setWeatherById] = usePersistentState<
    Record<string, WeatherSnapshot>
  >(STORAGE_KEYS.weatherCache, () => ({}));
  const [currentLocation, setCurrentLocation] = usePersistentState<{
    lat: number;
    lon: number;
  } | null>(STORAGE_KEYS.currentLocation, () => null);
  const [citySearch, setCitySearch] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "pending" | "ready" | "error"
  >(currentLocation ? "ready" : "idle");

  const missingKey = !apiKey;

  useEffect(() => {
    if (!statusMessage || typeof window === "undefined") {
      return;
    }
    const timeout = window.setTimeout(() => setStatusMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  const refreshWeatherForCity = useCallback(
    async (cityId: string, descriptor: CityDescriptor) => {
      try {
        const payload = await fetchWeatherByCoords(descriptor.coords, apiKey);
        setWeatherById((prev) => ({
          ...prev,
          [cityId]: {
            ...payload,
            cityId,
            name: descriptor.name || payload.name,
            country: descriptor.country || payload.country,
            updatedAt: Date.now(),
          },
        }));
        setStatusMessage(null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось обновить прогноз.";
        setStatusMessage(message);
        throw new Error(message);
      }
    },
    [apiKey, setWeatherById]
  );

  const getDescriptor = useCallback(
    (cityId: string): CityDescriptor | null => {
      if (cityId === CURRENT_LOCATION_ID) {
        if (!currentLocation) {
          return null;
        }
        const fallback = weatherById[CURRENT_LOCATION_ID];
        return {
          name: fallback?.name || "Моё местоположение",
          country: fallback?.country || "",
          coords: currentLocation,
        };
      }
      const city = cities.find((item) => item.id === cityId);
      if (!city) {
        return null;
      }
      return {
        name: city.name,
        country: city.country,
        coords: city.coords,
      };
    },
    [cities, currentLocation, weatherById]
  );

  useEffect(() => {
    if (selectedCityId) {
      return;
    }
    if (currentLocation) {
      setSelectedCityId(CURRENT_LOCATION_ID);
      return;
    }
    if (cities.length > 0) {
      setSelectedCityId(cities[0].id);
    }
  }, [selectedCityId, currentLocation, cities, setSelectedCityId]);

  useEffect(() => {
    if (
      currentLocation ||
      locationStatus === "pending" ||
      locationStatus === "ready"
    ) {
      return;
    }
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setCurrentLocation(coords);
        setLocationStatus("ready");
        setSelectedCityId((prev) => prev ?? CURRENT_LOCATION_ID);
        refreshWeatherForCity(CURRENT_LOCATION_ID, {
          name: "My location",
          country: "",
          coords,
        }).catch((error) => {
          setStatusMessage(error.message);
        });
      },
      () => {
        setLocationStatus("error");
        if (!selectedCityId && cities[0]) {
          setSelectedCityId(cities[0].id);
        }
      }
    );
  }, [
    currentLocation,
    locationStatus,
    setCurrentLocation,
    refreshWeatherForCity,
    setSelectedCityId,
    cities,
    selectedCityId,
  ]);

  useEffect(() => {
    if (!selectedCityId) {
      return;
    }
    const descriptor = getDescriptor(selectedCityId);
    if (!descriptor) {
      return;
    }
    const cached = weatherById[selectedCityId];
    const isStale = !cached || Date.now() - cached.updatedAt > STALE_AFTER_MS;
    if (!isStale) {
      return;
    }
    setIsRefreshing(true);
    refreshWeatherForCity(selectedCityId, descriptor)
      .catch((error) => setStatusMessage(error.message))
      .finally(() => setIsRefreshing(false));
  }, [selectedCityId, weatherById, getDescriptor, refreshWeatherForCity]);

  const handleAddCity = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        return "Введите название города.";
      }
      if (!apiKey) {
        return "Добавьте ключ OpenWeather в .env.";
      }
      setIsAddingCity(true);
      try {
        const geocoded = await lookupCityByName(query, apiKey);
        const exists = cities.some(
          (city) =>
            city.name.toLowerCase() === geocoded.name.toLowerCase() &&
            city.country === geocoded.country
        );
        if (exists) {
          return "Город уже есть в списке.";
        }
        const newCity: SavedCity = {
          id: crypto.randomUUID(),
          name: geocoded.name,
          country: geocoded.country,
          state: geocoded.state,
          coords: geocoded.coords,
        };
        setCities((prev) => [...prev, newCity]);
        setSelectedCityId(newCity.id);
        await refreshWeatherForCity(newCity.id, {
          name: newCity.name,
          country: newCity.country,
          coords: newCity.coords,
        });
        setStatusMessage(`Добавлен ${newCity.name}.`);
        return undefined;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Не удалось добавить город.";
        setStatusMessage(message);
        return message;
      } finally {
        setIsAddingCity(false);
      }
    },
    [apiKey, cities, refreshWeatherForCity, setCities, setSelectedCityId]
  );

  const handleRemoveCity = useCallback(
    (cityId: string) => {
      setCities((prevCities) => {
        const updated = prevCities.filter((city) => city.id !== cityId);
        setSelectedCityId((current) => {
          if (current !== cityId) {
            return current;
          }
          return (
            updated[0]?.id ?? (currentLocation ? CURRENT_LOCATION_ID : null)
          );
        });
        return updated;
      });
      setWeatherById((prev) => {
        const next = { ...prev };
        delete next[cityId];
        return next;
      });
      setStatusMessage("Город удалён из списка.");
    },
    [setCities, setSelectedCityId, currentLocation, setWeatherById]
  );

  const handleRefresh = useCallback(async () => {
    if (!selectedCityId) {
      return;
    }
    const descriptor = getDescriptor(selectedCityId);
    if (!descriptor) {
      return;
    }
    setIsRefreshing(true);
    try {
      await refreshWeatherForCity(selectedCityId, descriptor);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Не удалось обновить прогноз."
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedCityId, getDescriptor, refreshWeatherForCity]);

  const selectedWeather = selectedCityId ? weatherById[selectedCityId] : null;
  const currentWeather = weatherById[CURRENT_LOCATION_ID];

  const totalCities = useMemo(
    () => cities.length + (currentWeather ? 1 : 0),
    [cities.length, currentWeather]
  );

  return (
    <div className="min-h-screen  text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-white">
              Метеорологическое веб-приложение
            </h1>
            <p className="mt-1 text-white/70">
              Отслеживайте прогноз в текущем месте, управляйте списком городов и
              настраивайте отображение показателей.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="rounded-2xl bg-[#05044b4f] backdrop-blur-xl border border-white/10 px-4 py-2 text-right">
              <p className="text-xs text-white/60">Городов в работе</p>
              <p className="text-xl font-semibold text-white">{totalCities}</p>
            </div>
            <button
              className="btn-primary"
              type="button"
              onClick={() => setSettingsOpen(true)}
            >
              Настройки
            </button>
          </div>
        </header>

        <main className="mt-8 grid gap-6 lg:grid-cols-[320px,1fr]">
          <CityManager
            savedCities={cities}
            weatherById={weatherById}
            currentWeather={currentWeather}
            selectedCityId={selectedCityId}
            onSelectCity={setSelectedCityId}
            onRemoveCity={handleRemoveCity}
            searchTerm={citySearch}
            onSearchTermChange={setCitySearch}
            onAddCity={handleAddCity}
            isAddingCity={isAddingCity}
            locationStatus={locationStatus}
          />
          <WeatherCard
            data={selectedWeather}
            settings={settings}
            isLoading={isRefreshing}
            isCurrentLocation={selectedCityId === CURRENT_LOCATION_ID}
            locationStatus={locationStatus}
            onRefresh={handleRefresh}
            statusMessage={statusMessage}
            missingKey={missingKey}
          />
        </main>
      </div>

      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
