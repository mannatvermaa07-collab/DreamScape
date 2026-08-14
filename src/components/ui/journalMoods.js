import { Sun, CloudSun, Cloud, CloudDrizzle, CloudLightning } from 'lucide-react';

// Mood is expressed as weather, not a face — an ordered emotional gradient
// (clear skies → storm) that also doubles as the Journal page's color
// system. Lives in its own file (not JournalCard.jsx) so component files
// only export components — mixing component + data exports breaks Vite's
// Fast Refresh.
export const MOOD_LIST = ['Great', 'Good', 'Neutral', 'Bad', 'Very Bad'];

export const MOOD_META = {
  Great: { icon: Sun, color: '#E0A458', onColor: '#2B2116', label: 'Great' },
  Good: { icon: CloudSun, color: '#6B9C78', onColor: '#FFFFFF', label: 'Good' },
  Neutral: { icon: Cloud, color: '#8A94A6', onColor: '#FFFFFF', label: 'Neutral' },
  Bad: { icon: CloudDrizzle, color: '#C1694F', onColor: '#FFFFFF', label: 'Bad' },
  'Very Bad': { icon: CloudLightning, color: '#7A5980', onColor: '#FFFFFF', label: 'Very Bad' }
};