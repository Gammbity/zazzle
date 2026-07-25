import { useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { Loader2, MapPin, PenLine } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import '@/lib/leafletIcons';

const TASHKENT_CENTER: [number, number] = [41.2995, 69.2401];

type Tab = 'map' | 'manual';

interface AddressMapPickerProps {
  address: string;
  latitude: number | null;
  longitude: number | null;
  onAddressChange: (address: string) => void;
  onCoordsChange: (latitude: number | null, longitude: number | null) => void;
  inputClassName: string;
}

async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz,ru`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data?.display_name === 'string' ? data.display_name : null;
  } catch {
    return null;
  }
}

function ClickToPlaceMarker({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function AddressMapPicker({
  address,
  latitude,
  longitude,
  onAddressChange,
  onCoordsChange,
  inputClassName,
}: AddressMapPickerProps) {
  const [tab, setTab] = useState<Tab>('map');
  const [geocoding, setGeocoding] = useState(false);

  const markerPosition: [number, number] | null =
    latitude != null && longitude != null ? [latitude, longitude] : null;

  const handleMapSelect = async (lat: number, lng: number) => {
    onCoordsChange(lat, lng);
    setGeocoding(true);
    const resolved = await reverseGeocode(lat, lng);
    setGeocoding(false);
    if (resolved) onAddressChange(resolved);
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    if (next === 'manual') {
      onCoordsChange(null, null);
    }
  };

  return (
    <div>
      <div className='inline-flex rounded-2xl border border-stone-200 p-1'>
        <button
          type='button'
          onClick={() => switchTab('map')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            tab === 'map'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 hover:bg-stone-50'
          }`}
        >
          <MapPin className='h-3.5 w-3.5' />
          Xaritadan tanlash
        </button>
        <button
          type='button'
          onClick={() => switchTab('manual')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            tab === 'manual'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 hover:bg-stone-50'
          }`}
        >
          <PenLine className='h-3.5 w-3.5' />
          Qo&apos;lda kiritish
        </button>
      </div>

      {tab === 'map' ? (
        <div className='mt-3'>
          <div className='overflow-hidden rounded-2xl border border-stone-200'>
            <MapContainer
              center={markerPosition ?? TASHKENT_CENTER}
              zoom={markerPosition ? 15 : 11}
              style={{ height: '260px', width: '100%' }}
            >
              <TileLayer
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                attribution='&copy; OpenStreetMap contributors'
              />
              <ClickToPlaceMarker onSelect={handleMapSelect} />
              {markerPosition && <Marker position={markerPosition} />}
            </MapContainer>
          </div>
          <p className='mt-2 text-xs text-slate-500'>
            Manzilni belgilash uchun xaritaga bosing.
            {geocoding && (
              <span className='ml-1.5 inline-flex items-center gap-1 text-amber-700'>
                <Loader2 className='h-3 w-3 animate-spin' />
                Manzil aniqlanmoqda...
              </span>
            )}
          </p>
          <input
            className={`${inputClassName} mt-2`}
            value={address}
            onChange={event => onAddressChange(event.target.value)}
            placeholder="Ko'cha, uy raqami, ofis (xaritadan tanlangan manzilni tahrirlashingiz mumkin)"
          />
        </div>
      ) : (
        <input
          className={`${inputClassName} mt-3`}
          value={address}
          onChange={event => onAddressChange(event.target.value)}
          placeholder="Ko'cha, uy raqami, ofis"
        />
      )}
    </div>
  );
}
