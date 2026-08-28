import React from 'react';
import {AppProviders} from './src/app/AppProviders';
import {StartupGate} from './src/app/StartupGate';
import {RootNavigator} from './src/navigation';

function App() {
  return (
    <AppProviders>
      <StartupGate>
        <RootNavigator />
      </StartupGate>
    </AppProviders>
  );
}

export default App;
