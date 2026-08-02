import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { BottomNavigation } from '../src/features/home/components/BottomNavigation';
import { AppThemeProvider } from '../src/theme/AppThemeProvider';

it('renders unfinished destinations without interactive tab semantics', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <BottomNavigation />
      </AppThemeProvider>,
    );
  });

  expect(
    renderer!.root.findAll(node => node.props.accessibilityRole === 'tab'),
  ).toHaveLength(0);
  expect(
    renderer!.root
      .findAllByType(Text)
      .filter(node => node.props.children === 'Home'),
  ).toHaveLength(1);

  await ReactTestRenderer.act(() => renderer!.unmount());
});
