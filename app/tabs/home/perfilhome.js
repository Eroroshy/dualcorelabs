import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator, Alert, Dimensions, Image,
  Modal,
  ScrollView,
  StyleSheet, Text,
  TextInput,
  TouchableOpacity, View
} from "react-native";
import { Switch } from "react-native-paper";

// IMPORTACIÓN DIRECTA DE i18n y SUPABASE
import { AuthContext } from "../../context/AuthContext";
import i18n from "../../i18n";
import { supabase } from "../../subapaseClient";

const MyComponent = () => {
  const [isSwitchOn, setIsSwitchOn] = React.useState(false);
  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);
  return <Switch value={isSwitchOn} onValueChange={onToggleSwitch} theme={{ colors: { primary: '#88adff' } }} />;
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout, updateAvatar } = useContext(AuthContext);
  const { t } = useTranslation(); 
  
  // ESTADOS
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  const profile = user?.profile;
  const avatarUrl = profile?.foto_url || profile?.avatar_url || null;
  
  // ⚡ CORREGIDO: Texto por defecto preparado para i18n
  const userName = profile?.nombre || user?.nombre || t("default_athlete", "Athlete");

  // TRADUCTOR DINÁMICO DE NIVEL
  const obtenerNivelTraducido = (nivelBD) => {
    if (!nivelBD) return t("level_principiante", "BEGINNER").toUpperCase();
    const nivelLower = nivelBD.toLowerCase();
    if (nivelLower.includes("principiante")) return t("level_principiante", "BEGINNER").toUpperCase();
    if (nivelLower.includes("intermedio")) return t("level_intermedio", "INTERMEDIATE").toUpperCase();
    if (nivelLower.includes("avanzado")) return t("level_avanzado", "ADVANCED").toUpperCase();
    return nivelBD.toUpperCase();
  };

  // TRADUCTOR DINÁMICO DE OBJETIVO
  const obtenerObjetivoTraducido = (objetivoBD) => {
    if (!objetivoBD) return t("obj_perder_grasa", "LOSE FAT").toUpperCase();
    const objLower = objetivoBD.toLowerCase();
    if (objLower.includes("perder") || objLower.includes("grasa")) return t("obj_perder_grasa", "LOSE FAT").toUpperCase();
    if (objLower.includes("ganar") || objLower.includes("músculo") || objLower.includes("musculo")) return t("obj_ganar_musculo", "BUILD MUSCLE").toUpperCase();
    if (objLower.includes("mantener")) return t("obj_mantener_peso", "MAINTAIN WEIGHT").toUpperCase();
    if (objLower.includes("resistencia")) return t("obj_resistencia", "ENDURANCE").toUpperCase();
    return objetivoBD.toUpperCase();
  };

  const userLevel = obtenerNivelTraducido(profile?.nivel_experiencia || profile?.nivel);
  const userObjective = obtenerObjetivoTraducido(profile?.objetivo);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t("perm_required", "Permission denied"), t("perm_msg", "Gallery access is needed."));
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return; 

    try {
      setUploading(true);
      await updateAvatar(result.assets[0].uri); 
      Alert.alert(t("success", "Success"), t("photo_updated", "Photo updated."));
    } catch (error) {
      Alert.alert(t("error", "Error"), t("photo_error", "Upload failed: ") + error.message);
    } finally {
      setUploading(false);
    }
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert(t("error", "Error"), t("pwd_min_length", "Password must be at least 6 characters."));
      return;
    }
    
    try {
      setIsUpdatingPwd(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      Alert.alert(t("success", "Success"), t("pwd_updated_success", "Your password has been updated."));
      setModalVisible(false);
      setNewPassword("");
    } catch (error) {
      Alert.alert(t("error", "Error"), error.message);
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      t("sign_out", "Sign Out"),
      t("sign_out_confirm", "Are you sure you want to log out?"),
      [
        { text: t("cancel", "Cancel"), style: "cancel" },
        { 
          text: t("exit", "Log Out"), 
          style: "destructive", 
          onPress: async () => {
            try { if (logout) await logout(); } catch (error) { console.error(error); }
          } 
        }
      ]
    );
  };

  const changeAppLanguage = () => {
    Alert.alert(
      t("select_lang", "Select Language"),
      t("choose_lang", "Choose your preferred language:"),
      [
        { text: "Español", onPress: () => i18n.changeLanguage("es") },
        { text: "English", onPress: () => i18n.changeLanguage("en") },
        { text: t("cancel", "Cancel"), style: "cancel" }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>K I N E T I C</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* AVATAR Y RANGO */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer} disabled={uploading} activeOpacity={0.8}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholderCircle}>
                <Ionicons name="person" size={60} color="#747578" />
              </View>
            )}

            {uploading && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="small" color="#88adff" />
              </View>
            )}
            
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{userLevel}</Text>
            </View>

            <View style={styles.editIconContainer}>
              <MaterialIcons name="edit" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>{t("active_profile", "ACTIVE PROFILE").toUpperCase()}</Text>
        <Text style={styles.name}>{userName}</Text>

        {/* CONTENEDOR DE MÉTRICAS */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.statValue}>{profile?.edad ?? "20"}</Text>
              <Text style={styles.statLabel}>{t("age", "AGE").toUpperCase()}</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.statValue}>{profile?.peso_kg ? `${profile.peso_kg}kg` : "80kg"}</Text>
              <Text style={styles.statLabel}>{t("weight", "WEIGHT").toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.statValue}>{profile?.altura_cm ? `${profile.altura_cm}cm` : "190cm"}</Text>
              <Text style={styles.statLabel}>{t("height", "HEIGHT").toUpperCase()}</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={[styles.statValue, styles.objectiveText]} numberOfLines={1} adjustsFontSizeToFit>
                {userObjective}
              </Text>
              <Text style={styles.statLabel}>{t("objective", "OBJECTIVE").toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* PREFERENCIAS DEL SISTEMA */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("system_preferences", "SYSTEM PREFERENCES")}</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="notifications" size={22} color="#88adff" />
              <View>
                <Text style={styles.rowTitle}>{t("push_notifications", "Push Notifications")}</Text>
                <Text style={styles.rowSubtitle}>{t("alerts_milestones", "Alerts and reminders")}</Text>
              </View>
            </View>
            <MyComponent />
          </View>

          <TouchableOpacity style={styles.row} onPress={changeAppLanguage}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="language" size={22} color="#88adff" />
              <View>
                <Text style={styles.rowTitle}>{t("language", "Language")}</Text>
                <Text style={styles.rowSubtitle}>{t("current_language", "Current app language")}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#747578" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("Editar Perfil")}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="person" size={22} color="#88adff" />
              <View>
                <Text style={styles.rowTitle}>{t("edit_profile", "Edit Profile")}</Text>
                <Text style={styles.rowSubtitle}>{t("modify_info", "Modify your information")}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#747578" />
          </TouchableOpacity>

          {/* ⚡ BOTÓN DE SEGURIDAD CORREGIDO */}
          <TouchableOpacity style={styles.row} onPress={() => setModalVisible(true)}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="security" size={22} color="#88adff" />
              <View>
                <Text style={styles.rowTitle}>{t("security", "Security")}</Text>
                <Text style={styles.rowSubtitle}>{t("change_password", "Change password")}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#747578" />
          </TouchableOpacity>

        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#ff716c" />
          <Text style={styles.logoutText}>{t("sign_out", "Sign Out")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ⚡ MODAL MULTIPLATAFORMA PARA CONTRASEÑA */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t("update_password", "Update Password")}</Text>
            <Text style={styles.modalSubtitle}>{t("enter_new_password", "Enter your new password:")}</Text>
            
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              placeholder="******"
              placeholderTextColor="#747578"
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { setModalVisible(false); setNewPassword(""); }}>
                <Text style={styles.modalBtnTextCancel}>{t("cancel", "Cancel")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalBtnSubmit} onPress={submitNewPassword} disabled={isUpdatingPwd}>
                {isUpdatingPwd ? (
                  <ActivityIndicator size="small" color="#002052" />
                ) : (
                  <Text style={styles.modalBtnTextSubmit}>{t("update", "Update")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0e10" },
  header: { paddingTop: 45, paddingBottom: 15, backgroundColor: "#111416", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#171a1c" },
  headerTitle: { fontFamily: "Lexend_800ExtraBold", fontSize: 16, color: "#eeeef0", letterSpacing: 2 },
  scrollContent: { padding: 16, paddingBottom: 140 }, 
  profileSection: { alignItems: "center", marginBottom: 12, marginTop: 15 },
  avatarContainer: { position: "relative", width: 130, height: 130 },
  avatar: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: "#88adff" },
  avatarPlaceholderCircle: { width: 130, height: 130, borderRadius: 65, backgroundColor: "#171a1c", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#24282c" },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(12,14,16,0.6)", borderRadius: 65, justifyContent: "center", alignItems: "center" },
  editIconContainer: { position: "absolute", bottom: 5, right: 5, backgroundColor: "#88adff", padding: 6, borderRadius: 15, borderWidth: 2, borderColor: "#0c0e10" },
  rankBadge: { position: "absolute", bottom: -12, alignSelf: "center", backgroundColor: "#88adff", paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10, borderWidth: 2, borderColor: "#0c0e10", zIndex: 10 },
  rankText: { color: "#002052", fontFamily: "Lexend_700Bold", fontSize: 10, letterSpacing: 0.5 },
  label: { fontFamily: "Manrope_600SemiBold", fontSize: 11, color: "#88adff", textAlign: "center", letterSpacing: 1, marginTop: 18 },
  name: { fontFamily: "Lexend_800ExtraBold", fontSize: 24, color: "#fff", textAlign: "center", textTransform: "uppercase", marginTop: 2, marginBottom: 20 },
  gridContainer: { width: "100%", gap: 12, marginVertical: 10 },
  gridRow: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  gridItem: { backgroundColor: "#171a1c", width: (Dimensions.get("window").width - 44) / 2, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#24282c" },
  statValue: { fontFamily: "Lexend_700Bold", fontSize: 18, color: "#a1faff", textAlign: "center", marginBottom: 2 },
  objectiveText: { color: "#a1faff", fontSize: 15 },
  statLabel: { fontFamily: "Manrope_500Medium", fontSize: 11, color: "#747578", textTransform: "uppercase", letterSpacing: 0.5 },
  card: { backgroundColor: "#171a1c", borderRadius: 14, padding: 16, marginTop: 10, borderWidth: 1, borderColor: "#24282c" },
  cardTitle: { fontFamily: "Lexend_700Bold", fontSize: 14, color: "#eeeef0", marginBottom: 5 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 10 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowTitle: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: "#eeeef0" },
  rowSubtitle: { fontFamily: "Manrope_400Regular", fontSize: 11, color: "#747578" },
  logoutBtn: { marginTop: 20, flexDirection: "row", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255, 113, 108, 0.3)", backgroundColor: "rgba(255, 113, 108, 0.05)", padding: 14, borderRadius: 12, gap: 8 },
  logoutText: { fontFamily: "Manrope_700Bold", color: "#ff716c", fontSize: 13 },
  
  /* ESTILOS DEL MODAL */
  modalOverlay: { flex: 1, backgroundColor: "rgba(12,14,16,0.8)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "85%", backgroundColor: "#171a1c", borderRadius: 14, padding: 22, borderWidth: 1, borderColor: "#24282c" },
  modalTitle: { fontFamily: "Lexend_700Bold", fontSize: 17, color: "#eeeef0", marginBottom: 8 },
  modalSubtitle: { fontFamily: "Manrope_400Regular", fontSize: 13, color: "#747578", marginBottom: 15 },
  modalInput: { backgroundColor: "#0c0e10", color: "#eeeef0", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#24282c", fontFamily: "Manrope_500Medium", marginBottom: 20 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, justifyContent: "center" },
  modalBtnTextCancel: { color: "#747578", fontFamily: "Manrope_600SemiBold", fontSize: 14 },
  modalBtnSubmit: { backgroundColor: "#88adff", paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, minWidth: 90, alignItems: "center", justifyContent: "center" },
  modalBtnTextSubmit: { color: "#002052", fontFamily: "Manrope_700Bold", fontSize: 14 },
});