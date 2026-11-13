export const PROFILE_THEMES = [
  {
    id: 'framboise',
    label: 'Framboise',
    primary: '#B92554',
    primaryDark: '#8D1740',
    background: '#FDF1E9',
    surface: '#F4E0EB',
    card: '#FFF7F1',
    border: '#EED6D1',
    avatar: '#EBCDF0',
  },
  {
    id: 'lavande',
    label: 'Lavande',
    primary: '#7651A6',
    primaryDark: '#57377F',
    background: '#F7F1FC',
    surface: '#EDE3F8',
    card: '#FCF9FF',
    border: '#DED0EE',
    avatar: '#E6D8F4',
  },
  {
    id: 'peche',
    label: 'Pêche',
    primary: '#C45C3C',
    primaryDark: '#93402A',
    background: '#FFF4EC',
    surface: '#FBE4D6',
    card: '#FFFAF6',
    border: '#EFD2C1',
    avatar: '#F7D8C6',
  },
  {
    id: 'sauge',
    label: 'Sauge',
    primary: '#4E8069',
    primaryDark: '#355C4B',
    background: '#F0F7F2',
    surface: '#DDECE1',
    card: '#F8FCF8',
    border: '#C9DDCE',
    avatar: '#D8E9DC',
  },
  {
    id: 'ciel',
    label: 'Ciel',
    primary: '#477B9A',
    primaryDark: '#315B73',
    background: '#EFF6FA',
    surface: '#DDECF4',
    card: '#F8FCFE',
    border: '#C9DDE9',
    avatar: '#D7E9F2',
  },
] as const;

export type ProfileThemeId = (typeof PROFILE_THEMES)[number]['id'];
export type ProfileTheme = (typeof PROFILE_THEMES)[number];

export const DEFAULT_PROFILE_THEME_ID: ProfileThemeId = 'framboise';

export function isProfileThemeId(value: unknown): value is ProfileThemeId {
  return typeof value === 'string' && PROFILE_THEMES.some(theme => theme.id === value);
}

export function getProfileTheme(value?: string | null): ProfileTheme {
  return PROFILE_THEMES.find(theme => theme.id === value) ?? PROFILE_THEMES[0];
}
