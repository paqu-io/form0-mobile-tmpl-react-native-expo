import React, { useState } from 'react';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, form0Fonts } from 'form0-react-native';
import Home from './pages/Home.js';
import FormPage from './pages/FormPage.js';
import form0Config from '../form0.config.js';

/**
 * Main App Component
 *
 * Handles:
 * - Navigation between Home and FormPage
 * - StatusBar styling based on theme configuration
 * - Safe area handling
 * - Global theme provider for consistent theming
 */
export default function App() {
  const [activeFormId, setActiveFormId] = useState(null);
  const [fontsLoaded] = useFonts(form0Fonts);

  // Determine the color mode from config for StatusBar and theme
  const configColorMode = form0Config.theme?.mode || 'light';

  // StatusBar style:
  // 'light' statusBar style = light text (for dark backgrounds)
  // 'dark' statusBar style = dark text (for light backgrounds)
  // For 'system', expo-status-bar's 'auto' will handle it
  const statusBarStyle =
    configColorMode === 'system' ? 'auto' : configColorMode === 'dark' ? 'light' : 'dark';

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      {/* StatusBar adapts to the theme mode */}
      <StatusBar style={statusBarStyle} />

      {/* ThemeProvider wraps everything for consistent theming */}
      <ThemeProvider colorMode={configColorMode}>
        {!activeFormId ? (
          <Home onSelectForm={setActiveFormId} />
        ) : (
          <FormPage formId={activeFormId} onBack={() => setActiveFormId(null)} />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
