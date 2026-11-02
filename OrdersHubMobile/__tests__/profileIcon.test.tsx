import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ProfileIcon } from '../src/features/home/components/profile/ProfileIcon';
import { AppThemeProvider } from '../src/theme/AppThemeProvider';

describe('ProfileIcon Component', () => {
  it('renders fallback avatar text when pictureUrl is null or empty', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(
        <AppThemeProvider>
          <ProfileIcon
            firstName="Rohit"
            pictureUrl={null}
            onProfilePress={jest.fn()}
          />
        </AppThemeProvider>
      );
    });

    const textComponent = component!.root.findByProps({ testID: 'fallback-avatar-text' });
    expect(textComponent.props.children).toBe('R');

    await ReactTestRenderer.act(async () => {
      component.unmount();
    });
  });

  it('renders image when pictureUrl is provided', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(
        <AppThemeProvider>
          <ProfileIcon
            firstName="Rohit"
            pictureUrl="https://example.com/avatar.jpg"
            onProfilePress={jest.fn()}
          />
        </AppThemeProvider>
      );
    });

    const imageComponent = component!.root.findByProps({ testID: 'profile-image' });
    expect(imageComponent.props.source.uri).toBe('https://example.com/avatar.jpg');

    await ReactTestRenderer.act(async () => {
      component.unmount();
    });
  });

  it('falls back to text avatar when image loading fails', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(
        <AppThemeProvider>
          <ProfileIcon
            firstName="Rohit"
            pictureUrl="https://example.com/avatar.jpg"
            onProfilePress={jest.fn()}
          />
        </AppThemeProvider>
      );
    });

    const imageComponent = component!.root.findByProps({ testID: 'profile-image' });
    
    // Simulate image error
    await ReactTestRenderer.act(async () => {
      imageComponent.props.onError();
    });

    const textComponent = component!.root.findByProps({ testID: 'fallback-avatar-text' });
    expect(textComponent.props.children).toBe('R');

    await ReactTestRenderer.act(async () => {
      component.unmount();
    });
  });
});
