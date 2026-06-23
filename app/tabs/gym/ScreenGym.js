import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScreenGym() {
    const [location, setLocation] = useState(null);
    const [gyms, setGyms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [showFavorites, setShowFavorites] = useState(false);

    useEffect(() => {
        loadFavorites();
        getUserLocation();
    }, []);

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
                setError("Permiso de ubicacion denegado");
                setLoading(false);
                return;
            }
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            setLocation(loc.coords);
            await fetchNearbyGyms(loc.coords.latitude, loc.coords.longitude);
        } catch (e) {
            setError("No se pudo obtener la ubicacion");
            setLoading(false);
        }
    };

    const fetchNearbyGyms = async (lat, lng) => {
        try {
            const url = `http://192.168.100.6:3000/api/gyms/nearby?lat=${lat}&lng=${lng}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await response.json();
            setGyms(data.gyms || []);
        } catch (e) {
            console.log("MENSAJE:", e.message);
            setError("Error al buscar gimnasio");
        } finally {
            setLoading(false);
        }
    };

    const openInMaps = (gym) => {
        const query = encodeURIComponent(`${gym.name} ${gym.address}`);
        const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        Linking.openURL(url);
    };

    const displayData = showFavorites ? favorites : gyms;

    const renderGym = ({ item }) => (
        <TouchableOpacity style={styles.gymCard} onPress={() => openInMaps(item)}>
            <View style={styles.gymCardLeft}>
                <MaterialIcons name="fitness-center" size={24} color="#88adff" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.gymName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.gymAddress} numberOfLines={1}>{item.address}</Text>
                    {item.phone && (
                        <Text style={styles.gymPhone}>{item.phone}</Text>
                    )}
                </View>
            </View>
            <TouchableOpacity onPress={() => toggleFavorite(item)}>
                <Ionicons
                    name={isFavorite(item) ? "heart" : "heart-outline"}
                    size={22}
                    color={isFavorite(item) ? "#ff716c" : "#747578"}
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>K I N E T I C</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={styles.sectionLabel}>
                        {showFavorites ? "FAVORITOS" : "GIMNASIOS CERCANOS"}
                    </Text>
                    <TouchableOpacity onPress={() => setShowFavorites(!showFavorites)}>
                        <Ionicons
                            name={showFavorites ? "list" : "heart"}
                            size={22}
                            color="#88adff"
                        />
                    </TouchableOpacity>
                </View>

                {location && !showFavorites && (
                    <View style={styles.locationBadge}>
                        <Ionicons name="location" size={14} color="#88adff" />
                        <Text style={styles.locationText}>
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </Text>
                        <TouchableOpacity onPress={getUserLocation}>
                            <Ionicons name="refresh" size={16} color="#88adff" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                )}

                {loading && (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#88adff" />
                        <Text style={styles.loadingText}>Buscando gimnasios...</Text>
                    </View>
                )}

                {error && !loading && (
                    <View style={styles.centered}>
                        <MaterialIcons name="location-off" size={48} color="#747578" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={getUserLocation}>
                            <Text style={styles.retryText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!loading && !error && (
                    <FlatList
                        data={displayData}
                        keyExtractor={(item) => item.place_id}
                        renderItem={renderGym}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        ListEmptyComponent={
                            <View style={styles.centered}>
                                <Ionicons
                                    name={showFavorites ? "heart-outline" : "fitness"}
                                    size={48}
                                    color="#747578"
                                />
                                <Text style={styles.errorText}>
                                    {showFavorites ? "No tienes favoritos aún" : "No se encontraron gimnasios"}
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
    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    sectionLabel: { fontFamily: "Manrope_500Medium", fontSize: 12, color: "#88adff", letterSpacing: 1 },
    locationBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#171a1c", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 },
    locationText: { fontFamily: "Manrope_400Regular", fontSize: 12, color: "#aaabad", marginLeft: 6 },
    gymCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#171a1c", borderRadius: 12, padding: 16, marginBottom: 10 },
    gymCardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
    gymName: { fontFamily: "Lexend_700Bold", fontSize: 14, color: "#eeeef0" },
    gymAddress: { fontFamily: "Manrope_400Regular", fontSize: 12, color: "#aaabad", marginTop: 2 },
    gymPhone: { fontFamily: "Manrope_400Regular", fontSize: 12, color: "#88adff", marginTop: 2 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 60, gap: 12 },
    loadingText: { fontFamily: "Manrope_400Regular", color: "#aaabad", fontSize: 14 },
    errorText: { fontFamily: "Manrope_400Regular", color: "#aaabad", fontSize: 14, textAlign: "center" },
    retryBtn: { backgroundColor: "#88adff", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
    retryText: { fontFamily: "Manrope_700Bold", color: "#002052", fontSize: 14 },
});