import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // <-- Hook de traducción
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ScreenGym() {
    const { t } = useTranslation(); // Activamos el motor de idiomas
    const [location, setLocation] = useState(null);
    const [gyms, setGyms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [showFavorites, setShowFavorites] = useState(false);
    
    const [search, setSearch] = useState("");
    const [selectedRadio, setSelectedRadio] = useState(5); 

    useEffect(() => {
        loadFavorites();
        getUserLocation();
    }, [selectedRadio, search]); 

    const loadFavorites = async () => {
        try {
            const stored = await AsyncStorage.getItem("gym_favorites");
            if (stored) setFavorites(JSON.parse(stored));
        } catch (e) {}
    };

    const toggleFavorite = async (gym) => {
        try {
            const isFav = favorites.some(f => f.place_id === gym.place_id);
            const updated = isFav
                ? favorites.filter(f => f.place_id !== gym.place_id)
                : [...favorites, gym];
            setFavorites(updated);
            await AsyncStorage.setItem("gym_favorites", JSON.stringify(updated));
        } catch (e) {}
    };

    const isFavorite = (gym) => favorites.some(f => f.place_id === gym.place_id);

    const getUserLocation = async () => {
        try {
            setLoading(true);
            setError(null);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                setError(t("perm_denied"));
                setLoading(false);
                return;
            }
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            setLocation(loc.coords);
            await fetchNearbyGyms(loc.coords.latitude, loc.coords.longitude);
        } catch (e) {
            setError(t("loc_error"));
            setLoading(false);
        }
    };

    const fetchNearbyGyms = async (lat, lng) => {
        const apiKey = '38r6oqYIM7Zxp8mhmPnanSfhZkB8QknU';
        let url = "";

        if (search.trim().length > 0) {
            const queryClean = encodeURIComponent(search);
            url = `https://api.tomtom.com/search/2/search/${queryClean}.json?key=${apiKey}&lat=${lat}&lon=${lng}&radius=50000&limit=20`;
        } else {
            const radiusInMeters = selectedRadio * 1000;
            url = `https://api.tomtom.com/search/2/search/gimnasio.json?key=${apiKey}&lat=${lat}&lon=${lng}&radius=${radiusInMeters}&limit=20`;
        }

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || !data.results) {
                throw new Error(data.error?.description || 'Error API');
            }

            const formattedGyms = data.results.map(result => ({
                place_id: result.id,
                name: result.poi?.name || t("unnamed_gym"),
                address: result.address?.freeformAddress || t("no_address"),
                phone: result.poi?.phone || null,
                distance: result.distance ? (result.distance / 1000).toFixed(1) : null
            }));

            setGyms(formattedGyms); 
    
        } catch (e) {
            console.error("ERROR:", e.message);
            setError(t("search_error"));
        } finally {
            setLoading(false);
        }
    };

    const openInMaps = (gym) => {
        const query = encodeURIComponent(`${gym.name} ${gym.address}`);
        const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        Linking.openURL(url);
    };

    const displayData = showFavorites 
        ? favorites.filter(gym => gym.name?.toLowerCase().includes(search.toLowerCase())) 
        : gyms;

    const renderGym = ({ item }) => (
        <View style={styles.gymCard}>
            <TouchableOpacity style={styles.gymCardLeft} onPress={() => openInMaps(item)}>
                <MaterialIcons name="fitness-center" size={24} color="#88adff" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.gymName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.gymAddress} numberOfLines={1}>{item.address}</Text>
                    {item.distance && (
                        <Text style={styles.gymDistanceText}>
                            {t("distance_away", { distance: item.distance })}
                        </Text>
                    )}
                    {item.phone && (
                        <Text style={styles.gymPhone}>{item.phone}</Text>
                    )}
                </View>
            </TouchableOpacity>
            
            <View style={styles.actionsBox}>
                <TouchableOpacity onPress={() => toggleFavorite(item)} style={{ padding: 6 }}>
                    <Ionicons
                        name={isFavorite(item) ? "heart" : "heart-outline"}
                        size={24}
                        color={isFavorite(item) ? "#ff716c" : "#747578"}
                    />
                </TouchableOpacity>

                <TouchableOpacity style={styles.mapsIconButton} onPress={() => openInMaps(item)}>
                    <MaterialIcons name="directions" size={20} color="#0c0e10" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>K I N E T I C</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={styles.sectionLabel}>
                        {showFavorites ? t("favorites_title") : t("gyms_nearby")}
                    </Text>
                    <TouchableOpacity onPress={() => setShowFavorites(!showFavorites)}>
                        <Ionicons
                            name={showFavorites ? "list" : "heart"}
                            size={22}
                            color="#88adff"
                        />
                    </TouchableOpacity>
                </View>

                {/* Barra de Búsqueda */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color="#747578" />
                    <TextInput
                        style={styles.searchBar}
                        placeholder={t("search_gym_placeholder")}
                        placeholderTextColor="#46484a"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Selector de radio */}
                {!showFavorites && search.trim().length === 0 && (
                    <View style={styles.radioContainer}>
                        <Text style={styles.radioTitle}>{t("radius_label")}</Text>
                        <View style={styles.radioRow}>
                            {[2, 5, 10].map((km) => (
                                <TouchableOpacity 
                                    key={km} 
                                    style={[styles.radioBtn, selectedRadio === km && styles.radioBtnActive]} 
                                    onPress={() => setSelectedRadio(km)}
                                >
                                    <Text style={[styles.radioText, selectedRadio === km && styles.textBlack]}>{km} KM</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Badge de ubicación */}
                {location && !showFavorites && (
                    <View style={styles.locationBadge}>
                        <Ionicons name="location" size={14} color="#88adff" />
                        <Text style={styles.locationText}>
                            {search.trim().length > 0 ? t("wide_search_active") : t("gps_established")}
                        </Text>
                        <TouchableOpacity onPress={getUserLocation} style={{ marginLeft: 'auto' }}>
                            <Ionicons name="refresh" size={16} color="#88adff" />
                        </TouchableOpacity>
                    </View>
                )}

                {loading && (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#88adff" />
                        <Text style={styles.loadingText}>{t("searching_gyms")}</Text>
                    </View>
                )}

                {error && !loading && (
                    <View style={styles.centered}>
                        <MaterialIcons name="location-off" size={48} color="#747578" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={getUserLocation}>
                            <Text style={styles.retryText}>{t("retry")}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!loading && !error && (
                    <FlatList
                        data={displayData}
                        keyExtractor={(item) => item.place_id}
                        renderItem={renderGym}
                        // 🛠 SOLUCIÓN AL TRASLAPE: Colchón de 140px asignado al final de la lista 
                        // para que los últimos gimnasios suban por completo sobre el Tab bar flotante.
                        contentContainerStyle={styles.listScrollContent} 
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.centered}>
                                <Ionicons
                                    name={showFavorites ? "heart-outline" : "fitness"}
                                    size={48}
                                    color="#747578"
                                />
                                <Text style={styles.errorText}>
                                    {showFavorites ? t("no_favorites") : t("no_gyms_found")}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0c0e10" },
    header: { marginTop: 40, padding: 16, backgroundColor: "#111416", alignItems: "center" },
    headerTitle: { fontFamily: "Lexend_800ExtraBold", fontSize: 18, color: "#eeeef0" },
    content: { flex: 1, padding: 16 },
    
    // Nueva regla de espaciado responsivo para la lista
    listScrollContent: { paddingBottom: 140 }, 

    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    sectionLabel: { fontFamily: "Manrope_500Medium", fontSize: 12, color: "#88adff", letterSpacing: 1 },
    searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#171a1c", paddingHorizontal: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: "#24282c" },
    searchBar: { flex: 1, color: "#fff", paddingVertical: 10, paddingLeft: 8, fontSize: 14, fontFamily: "Manrope_400Regular" },
    radioContainer: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 10 },
    radioTitle: { fontFamily: "Manrope_500Medium", fontSize: 12, color: "#747578" },
    radioRow: { flexDirection: "row", gap: 8 },
    radioBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 16, backgroundColor: "#171a1c", borderWidth: 1, borderColor: "#24282c" },
    radioBtnActive: { backgroundColor: "#88adff", borderColor: "#88adff" },
    radioText: { color: "#aaabad", fontSize: 11, fontFamily: "Manrope_700Bold" },
    textBlack: { color: "#0c0e10" },
    locationBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#171a1c", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 },
    locationText: { fontFamily: "Manrope_400Regular", fontSize: 12, color: "#aaabad", marginLeft: 6 },
    gymCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#171a1c", borderRadius: 12, padding: 16, marginBottom: 10 },
    gymCardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
    gymName: { fontFamily: "Lexend_700Bold", fontSize: 14, color: "#eeeef0" },
    gymAddress: { fontFamily: "Manrope_400Regular", fontSize: 12, color: "#aaabad", marginTop: 2 },
    gymDistanceText: { fontFamily: "Manrope_400Regular", fontSize: 11, color: "#88adff", marginTop: 2, fontWeight: "600" },
    gymPhone: { fontFamily: "Manrope_400Regular", fontSize: 12, color: "#88adff", marginTop: 2 },
    actionsBox: { flexDirection: "row", alignItems: "center", gap: 10 },
    mapsIconButton: { backgroundColor: "#88ff88", padding: 8, borderRadius: 8, justifyContent: "center", alignItems: "center" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 40, gap: 12 },
    loadingText: { fontFamily: "Manrope_400Regular", color: "#aaabad", fontSize: 14 },
    errorText: { fontFamily: "Manrope_400Regular", color: "#aaabad", fontSize: 14, textAlign: "center" },
    retryBtn: { backgroundColor: "#88adff", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
    retryText: { fontFamily: "Manrope_700Bold", color: "#002052", fontSize: 14 },
});