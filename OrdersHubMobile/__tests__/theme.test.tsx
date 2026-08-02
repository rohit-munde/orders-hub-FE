import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {
  AppThemeProvider,
  ThemeMode,
  useAppTheme,
} from '../src/theme/AppThemeProvider';

let changeTheme: (mode: ThemeMode) => void;

function ThemeProbe(): React.JSX.Element {
  const { setMode, theme } = useAppTheme();
  changeTheme = setMode;
  return <Text>{theme.mode}</Text>;
}

test('switches between light and dark themes at runtime', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <ThemeProbe />
      </AppThemeProvider>,
    );
  });

  expect(renderer!.root.findByType(Text).props.children).toBe('light');

  await ReactTestRenderer.act(() => changeTheme('dark'));

  expect(renderer!.root.findByType(Text).props.children).toBe('dark');
});
