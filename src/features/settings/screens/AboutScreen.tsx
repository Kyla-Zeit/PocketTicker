import React, {useCallback} from 'react';
import {Linking, StyleSheet, View} from 'react-native';
import {Code2, ExternalLink, GitFork, ShieldCheck, Smartphone} from 'lucide-react-native';
import {APP_VERSION, GITHUB_URL, PORTFOLIO_URL} from '../../../config/app';
import {AppText, Button, Card, Screen, SectionHeader} from '../../../components';
import {useAppTheme} from '../../../theme';

export function AboutScreen() {
  const theme = useAppTheme();

  const handleOpenGitHub = useCallback(() => {
    Linking.openURL(GITHUB_URL).catch(() => {});
  }, []);

  const handleOpenPortfolio = useCallback(() => {
    Linking.openURL(PORTFOLIO_URL).catch(() => {});
  }, []);

  const logoTextColor = theme.dark ? '#10101A' : '#FFFFFF';

  return (
    <Screen scroll edges={[]} contentContainerStyle={styles.screen}>
      <View style={[styles.brand, {backgroundColor: theme.colors.primarySoft}]}>
        <View style={[styles.logo, {backgroundColor: theme.colors.primary}]}>
          <AppText variant="title" style={[styles.logoText, {color: logoTextColor}]}>PT</AppText>
        </View>
        <AppText variant="display">PocketTicker</AppText>
        <AppText color="muted">Version {APP_VERSION}</AppText>
      </View>
      <Card style={styles.about}>
        <AppText variant="heading">Built to demonstrate mobile engineering</AppText>
        <AppText color="muted">PocketTicker is a React Native market intelligence portfolio application demonstrating mobile architecture, API integration, offline persistence, biometric security, notifications, testing, and Android-native functionality.</AppText>
      </Card>
      <SectionHeader title="Engineering focus" />
      <View style={styles.focus}>
        {[
          [Smartphone, 'Native Android', 'React Native CLI, Gradle, Android Studio, deep links'],
          [ShieldCheck, 'Local security', 'Device authentication, privacy mode, secure sentinel'],
          [Code2, 'Reliable architecture', 'Typed providers, runtime validation, caching, repositories, CI'],
        ].map(([Icon, title, copy]) => {
          const ItemIcon = Icon as typeof Smartphone;
          return (
            <Card key={String(title)} style={styles.focusCard}>
              <ItemIcon size={23} color={theme.colors.primary} />
              <View style={styles.focusText}>
                <AppText variant="bodyStrong">{String(title)}</AppText>
                <AppText variant="caption" color="muted">{String(copy)}</AppText>
              </View>
            </Card>
          );
        })}
      </View>
      <Button label="View source on GitHub" icon={GitFork} variant="secondary" onPress={handleOpenGitHub} />
      <Button label="Visit portfolio website" icon={ExternalLink} variant="ghost" onPress={handleOpenPortfolio} />
      <AppText variant="caption" color="muted" style={styles.disclaimer}>This is a portfolio project. It does not support trading, custody, wallets, transfers, brokerage services, or real financial transactions.</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {padding: 20, paddingBottom: 42, gap: 18},
  brand: {padding: 26, borderRadius: 24, alignItems: 'center', gap: 7},
  logo: {width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4},
  logoText: {fontWeight: '700'},
  about: {gap: 9},
  focus: {gap: 10},
  focusCard: {flexDirection: 'row', gap: 13, alignItems: 'flex-start'},
  focusText: {flex: 1, gap: 3},
  disclaimer: {textAlign: 'center', marginTop: 6},
});
