import React from 'react';
import {CircleAlert} from 'lucide-react-native';
import {EmptyState} from './EmptyState';

export function ErrorState({message = 'We could not load this information.', onRetry}: {message?: string; onRetry?: () => void}) {
  return <EmptyState title="Something went wrong" message={message} actionLabel={onRetry ? 'Try again' : undefined} onAction={onRetry} icon={CircleAlert} />;
}
