import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Home from './pages/Home.js';
import FormPage from './pages/FormPage.js';

export default function App() {
  const [activeFormId, setActiveFormId] = useState(null);

  return (
    <SafeAreaProvider>
      {!activeFormId ? (
        <Home onSelectForm={setActiveFormId} />
      ) : (
        <FormPage
          formId={activeFormId}
          onBack={() => setActiveFormId(null)}
        />
      )}
    </SafeAreaProvider>
  );
}
