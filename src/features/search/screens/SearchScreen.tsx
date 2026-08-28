import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {Search, Trash2} from 'lucide-react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../navigation';
import type {RecentSearch, SearchResult} from '../../../types';
import {useAssetSearch} from '../hooks/useAssetSearch';
import {useRecentSearches} from '../../../repositories';
import {Button, EmptyState, ErrorState, LoadingState, Screen, SectionHeader, TextField} from '../../../components';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

function SearchGap() {
  return <View style={styles.resultGap} />;
}

export function SearchScreen({navigation}: Props) {
  const {items: recentSearches, add: addRecent, clear: clearRecent} = useRecentSearches();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const search = useAssetSearch(debouncedQuery, {enabled: debouncedQuery.trim().length >= 2});

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const openResult = useCallback((result: SearchResult) => {
    addRecent(debouncedQuery || result.symbol).catch(() => {});
    navigation.navigate('AssetDetails', {assetId: result.id});
  }, [addRecent, debouncedQuery, navigation]);

  const handleClearRecent = useCallback(() => {
    clearRecent().catch(() => {});
  }, [clearRecent]);

  const handleRefetch = useCallback(() => {
    search.refetch().catch(() => {});
  }, [search]);

  const renderRecentItem = useCallback(({item}: {item: RecentSearch}) => (
    <Button label={item.query} onPress={() => setQuery(item.query)} variant="ghost" icon={Search} style={styles.result} />
  ), []);

  const renderSearchResultItem = useCallback(({item}: {item: SearchResult}) => (
    <Button
      label={`${item.name}  ·  ${item.symbol.toUpperCase()}`}
      onPress={() => openResult(item)}
      variant="ghost"
      icon={Search}
      style={styles.result}
    />
  ), [openResult]);

  const showResults = debouncedQuery.length >= 2;

  return (
    <Screen edges={[]} contentContainerStyle={styles.screen}>
      <TextField
        autoFocus
        icon={Search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search Bitcoin, ETH, Solana…"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Search cryptocurrency assets"
      />
      {!showResults ? (
        recentSearches.length ? (
          <View style={styles.flex}>
            <SectionHeader title="Recent searches" actionLabel="Clear" onAction={handleClearRecent} />
            <FlatList
              data={recentSearches}
              keyExtractor={item => `${item.query}-${item.searchedAt}`}
              renderItem={renderRecentItem}
              ItemSeparatorComponent={SearchGap}
            />
          </View>
        ) : <EmptyState title="Find an asset" message="Search by coin name or ticker symbol. Your recent searches will appear here." icon={Search} />
      ) : search.isLoading ? <LoadingState label="Searching assets…" />
        : search.isError ? <ErrorState message={search.error.userMessage} onRetry={handleRefetch} />
          : search.data?.length ? (
            <FlatList
              data={search.data}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={renderSearchResultItem}
              ItemSeparatorComponent={SearchGap}
            />
          ) : <EmptyState title="No assets found" message={`No results matched “${debouncedQuery}”. Check the spelling and try again.`} />}
      {recentSearches.length > 0 && !showResults ? <Button label="Clear recent searches" onPress={handleClearRecent} variant="ghost" icon={Trash2} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({screen: {padding: 16, gap: 18}, flex: {flex: 1, gap: 12}, result: {justifyContent: 'flex-start'}, resultGap: {height: 8}});
