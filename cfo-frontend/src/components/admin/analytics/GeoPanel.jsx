// Geography Panel - Country/city breakdowns

import React from 'react';
import { MapPin, Globe } from 'lucide-react';

// Simple country flag emoji from country code
function CountryFlag({ code }) {
  if (!code || code.length !== 2) return null;
  const flag = code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('');
  return <span className="text-base">{flag}</span>;
}

export default function GeoPanel({ data }) {
  if (!data) return null;

  const countries = data.country_breakdown || [];
  const cities = data.city_breakdown || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country Breakdown */}
        <div className="bg-white border border-slate-200 rounded-sm p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Top Countries
          </h3>
          {countries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 font-medium text-slate-500">Country</th>
                    <th className="text-right py-2 font-medium text-slate-500">Visits</th>
                    <th className="text-right py-2 font-medium text-slate-500">Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {countries.map((c) => (
                    <tr key={c.country_code || c.country}>
                      <td className="py-1.5 flex items-center gap-2">
                        <CountryFlag code={c.country_code} />
                        <span className="text-slate-700">{c.country}</span>
                      </td>
                      <td className="py-1.5 text-right font-medium text-slate-800">{c.count}</td>
                      <td className="py-1.5 text-right text-slate-600">{c.unique_sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No location data for this period</p>
          )}
        </div>

        {/* City Breakdown */}
        <div className="bg-white border border-slate-200 rounded-sm p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Top Cities
          </h3>
          {cities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 font-medium text-slate-500">City</th>
                    <th className="text-left py-2 font-medium text-slate-500">Region</th>
                    <th className="text-right py-2 font-medium text-slate-500">Visits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cities.map((c, i) => (
                    <tr key={`${c.city}-${c.region}-${i}`}>
                      <td className="py-1.5 text-slate-700">{c.city}</td>
                      <td className="py-1.5 text-slate-500">{c.region}</td>
                      <td className="py-1.5 text-right font-medium text-slate-800">{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No city data for this period</p>
          )}
        </div>
      </div>
    </div>
  );
}
