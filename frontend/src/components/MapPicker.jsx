import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const MapPicker = ({ lat, lng, onChangeLocation }) => {
  const { t } = useLanguage();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const initialLat = lat || 17.3616;
      const initialLng = lng || 78.4747;

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
      
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        if (onChangeLocation) {
          onChangeLocation(position.lat, position.lng);
        }
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        if (onChangeLocation) {
          onChangeLocation(e.latlng.lat, e.latlng.lng);
        }
      });

      mapRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium text-slate-700">
        <span className="flex items-center space-x-1.5">
          <MapPin className="w-4 h-4 text-red-500" />
          <span>{t('map_picker.label')}</span>
        </span>
        <span className="text-xs text-slate-500 font-mono">
          Lat: {lat?.toFixed(4)}, Lng: {lng?.toFixed(4)}
        </span>
      </div>

      <div ref={mapContainerRef} className="h-64 w-full rounded-xl border border-slate-300 shadow-inner z-10" />
      <p className="text-xs text-slate-500">
        {t('map_picker.instructions')}
      </p>
    </div>
  );
};

export default MapPicker;
