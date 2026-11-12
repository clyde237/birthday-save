import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

const BRAND_DISPLAY_MS = 650;
const IMAGE_FALLBACK_MS = 1500;
const SPLASH_BACKGROUND = '#B12552';
const BRAND_LOCKUP = require('../../assets/birthday-save-brand/expo/splash-screen-1024.png');

export function LaunchScreen({ onShown }: { onShown: () => void }) {
  const { width, height } = useWindowDimensions();
  const [laidOut, setLaidOut] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const size = Math.min(width * 1.05, height * 0.6, 420);

  useEffect(() => {
    if (imageReady || useFallback) return;
    const timeout = setTimeout(() => setUseFallback(true), IMAGE_FALLBACK_MS);
    return () => clearTimeout(timeout);
  }, [imageReady, useFallback]);

  const artworkReady = imageReady || useFallback;
  useEffect(() => {
    if (!laidOut || !artworkReady) return;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let mounted = true;
    void SplashScreen.hideAsync().catch(() => undefined).then(() => {
      if (mounted) timeout = setTimeout(onShown, BRAND_DISPLAY_MS);
    });
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [laidOut, artworkReady, onShown]);

  return (
    <View style={styles.screen} onLayout={() => setLaidOut(true)} testID="birthday-launch">
      <StatusBar style="light" />
      {useFallback ? (
        <View style={[styles.brand, { width: size }]}>
          <Text style={styles.fallback}>BS</Text>
          <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit style={[styles.wordmark, { fontSize: Math.min(width * 0.09, 42) }]}>
            BIRTHDAY-SAVE
          </Text>
        </View>
      ) : (
        <Image
          source={BRAND_LOCKUP}
          accessible
          accessibilityRole="image"
          accessibilityLabel="Birthday Save"
          style={{ width: size, height: size }}
          resizeMode="contain"
          fadeDuration={0}
          onLoad={() => setImageReady(true)}
          onError={() => setUseFallback(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { alignItems: 'center', gap: 7 },
  wordmark: { color: '#FFF2DB', fontWeight: '900', letterSpacing: 0.6, textAlign: 'center' },
  fallback: { color: '#FFF2DB', fontSize: 80, fontWeight: '900' },
});
