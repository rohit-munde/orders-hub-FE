import React from 'react';
import { StatusBar, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { AppScreen } from '../src/components/layout/AppScreen';
import { AppThemeProvider } from '../src/theme/AppThemeProvider';

it('uses light status-bar content for the resolved dark theme', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider initialMode="dark">
        <AppScreen>
          <Text>content</Text>
        </AppScreen>
      </AppThemeProvider>,
    );
  });

  expect(renderer!.root.findByType(StatusBar).props.barStyle).toBe(
    'light-content',
  );

  await ReactTestRenderer.act(() => renderer!.unmount());
});
