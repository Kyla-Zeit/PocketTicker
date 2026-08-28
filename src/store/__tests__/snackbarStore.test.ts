import { useSnackbarStore } from '../snackbarStore';

describe('useSnackbarStore', () => {
  beforeEach(() => {
    useSnackbarStore.setState({ message: null, variant: 'info' });
  });

  it('shows and dismisses feedback', () => {
    useSnackbarStore.getState().show('Added to watchlist', 'success');

    expect(useSnackbarStore.getState()).toMatchObject({
      message: 'Added to watchlist',
      variant: 'success',
    });

    useSnackbarStore.getState().dismiss();
    expect(useSnackbarStore.getState().message).toBeNull();
  });
});
