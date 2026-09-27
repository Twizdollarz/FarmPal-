import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  CloudRain,
  Sun,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldAlert,
  Compass,
  RefreshCw,
} from 'lucide-react';
import { AgroWeatherReport, CropThreatAlert } from '../types';

export const WeatherAdvisoryView: React.FC = () => {
  const [weather, setWeather] = useState<AgroWeatherReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWeather = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/weather');
      if (res.ok) {
        setWeather(await res.json());
      }
    } catch (err) {
      console.error('Error fetching agro-weather telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  if (isLoading || !weather) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Fetching Hyperlocal Agricultural Weather Telemetry...</p>
      </div>
    );
  }

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'cloud-rain':
        return <CloudRain className="w-6 h-6 text-blue-500" />;
      case 'cloud-lightning':
        return <CloudLightning className="w-6 h-6 text-amber-500" />;
      case 'sun':
        return <Sun className="w-6 h-6 text-amber-500" />;
      case 'wind':
        return <Wind className="w-6 h-6 text-teal-500" />;
      default:
        return <CloudSun className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Current Telemetry */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Phase 4 Climate Intelligence
              </span>
              <span className="text-xs text-stone-400 font-mono">Location: {weather.location}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Hyperlocal Agro-Weather & Pest Advisory
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">
              Microclimate forecasting tailored to active crop growth stages to prevent fungal disease outbreaks and protect pesticide/fertilizer investments.
            </p>
          </div>

          <button
            onClick={fetchWeather}
            className="flex items-center gap-1.5 self-start lg:self-auto px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Update Telemetry</span>
          </button>
        </div>

        {/* Current Metric Gauges */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-medium mb-1">
              <Thermometer className="w-4 h-4 text-rose-500" />
              <span>Temperature</span>
            </div>
            <p className="text-2xl font-black text-stone-900 font-mono">{weather.temperatureC}°C</p>
            <p className="text-[11px] text-stone-500 mt-0.5">{weather.condition}</p>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-medium mb-1">
              <CloudRain className="w-4 h-4 text-blue-500" />
              <span>Rain Probability</span>
            </div>
            <p className="text-2xl font-black text-blue-700 font-mono">{weather.rainfallProbability}%</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Low risk today</p>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-medium mb-1">
              <Droplets className="w-4 h-4 text-teal-500" />
              <span>Relative Humidity</span>
            </div>
            <p className="text-2xl font-black text-stone-900 font-mono">{weather.humidityPercent}%</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Favorable canopy dry</p>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-medium mb-1">
              <Wind className="w-4 h-4 text-stone-500" />
              <span>Wind Speed</span>
            </div>
            <p className="text-2xl font-black text-stone-900 font-mono">{weather.windSpeedKmh} <span className="text-xs font-normal text-stone-500">km/h</span></p>
            <p className="text-[11px] text-stone-500 mt-0.5">Gentle breeze (Ideal)</p>
          </div>
        </div>

        {/* Actionable Agronomic Window Badges */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-stone-100">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Chemical & Fertilizer Spray Window</span>
              </div>
              <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                {weather.spraySuitability} Window
              </span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">{weather.sprayAdvisory}</p>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Droplets className="w-4 h-4 text-blue-600" />
                <span>Furrow & Drip Irrigation Guidance</span>
              </div>
              <span className="text-[10px] uppercase font-black tracking-wider bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                Water Advisory
              </span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">{weather.irrigationRecommendation}</p>
          </div>
        </div>
      </div>

      {/* 5-Day Outlook */}
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-bold text-stone-900">
          5-Day Agricultural Weather Outlook
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {weather.dailyForecast.map((day, idx) => {
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs text-center space-y-2 flex flex-col justify-between hover:border-emerald-300 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-stone-900">{day.day}</p>
                  <p className="text-[10px] text-stone-400">{day.date}</p>
                </div>

                <div className="flex justify-center my-1">
                  {getWeatherIcon(day.icon)}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-stone-900 font-mono">
                    {day.tempMax}° / <span className="text-stone-400">{day.tempMin}°</span>
                  </p>
                  <p className="text-[10px] text-stone-600 truncate">{day.condition}</p>
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-blue-600">
                    <Droplets className="w-3 h-3" />
                    <span>{day.rainProb}% Rain</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Crop Disease & Climate Threat Alerts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              Crop Disease & Microclimate Threat Alerts
            </h2>
            <p className="text-xs text-stone-500">
              Correlated against forecasted humidity spikes and precipitation patterns.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {weather.cropThreatAlerts.map((alert) => {
            return (
              <div
                key={alert.id}
                className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-3 hover:border-rose-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        alert.severity === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alert.severity === 'high' ? 'High Risk Threat' : 'Medium Risk Warning'}
                    </span>
                    <span className="text-xs font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                      Target Crop: {alert.cropName}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-stone-900">{alert.threatType}</span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">{alert.description}</p>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-900">Preventative Protocol: </span>
                    <span className="text-stone-700">{alert.preventativeAction}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
