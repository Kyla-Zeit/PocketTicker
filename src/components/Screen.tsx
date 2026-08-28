import React from 'react';
import {ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppTheme} from '../theme';

type Props = React.PropsWithChildren<{
  scroll?: boolean;
  contentContainerStyle?: ViewStyle | ViewStyle[];
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}> & Omit<ScrollViewProps, 'contentContainerStyle'>;

export function Screen({children, scroll = false, contentContainerStyle, edges = ['top'], ...props}: Props) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const edgePadding = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...props}
      contentContainerStyle={[styles.content, contentContainerStyle]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentContainerStyle]}>{children}</View>
  );

  return (
    <View style={[styles.flex, edgePadding, {backgroundColor: theme.colors.background}]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({flex: {flex: 1}, content: {flexGrow: 1}});
