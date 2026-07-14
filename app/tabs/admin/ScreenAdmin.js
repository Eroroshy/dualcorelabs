import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Searchbar } from "react-native-paper";
import { supabase } from "../../subapaseClient";

const TEXTOS_ADMIN = {
  es: {
    tag: "PANEL DE CONTROL",
    titulo: "SISTEMA DE",
    sub: "GESTIÓN",
    buscar_placeholder: "Buscar atleta por nombre...",
    admin_label: "ADMIN",
    tester_label: "TESTER",
    user_label: "ATLETA",
    accion_pass: "Reset Clave",
    accion_eliminar: "Eliminar",
    accion_ban: "Suspender",
    accion_unban: "Activar",
    vacio: "No se encontraron registros.",
    total_usuarios: "TOTAL",
    total_admins: "ADMINS",
    total_testers: "TESTERS",
    filtro_todos: "Todos",
    salir: "SALIR",
    confirmar_salir: "¿Estás seguro que deseas cerrar sesión?",
  },
  en: {
    tag: "CONTROL PANEL",
    titulo: "MANAGEMENT",
    sub: "SYSTEM",
    buscar_placeholder: "Search athlete by name...",
    admin_label: "ADMIN",
    tester_label: "TESTER",
    user_label: "ATHLETE",
    accion_pass: "Reset Pass",
    accion_eliminar: "Delete",
    accion_ban: "Suspend",
    accion_unban: "Activate",
    vacio: "No records found.",
    total_usuarios: "TOTAL",
    total_admins: "ADMINS",
    total_testers: "TESTERS",
    filtro_todos: "All",
    salir: "LOGOUT",
    confirmar_salir: "Are you sure you want to sign out?",
  },
};

export default function ScreenAdmin() {
  const { i18n } = useTranslation();
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [buscar, setBuscar] = useState("");
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState("all"); 
  const [expandedUser, setExpandedUser] = useState(null); 

  const idioma = i18n.language?.startsWith("es") ? "es" : "en";
  const txt = TEXTOS_ADMIN[idioma];

  useEffect(() => {
    cargarUsuarios();
  }, [buscar]);

  useEffect(() => {
    aplicarFiltros();
  }, [usuarios, filtroRol]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("perfiles")
        .select("*")
        .order("nombre", { ascending: true });

      if (buscar.trim() !== "") {
        query = query.ilike("nombre", `%${buscar}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    if (filtroRol === "all") {
      setFilteredUsuarios(usuarios);
    } else {
      setFilteredUsuarios(usuarios.filter(u => (u.rol || "user") === filtroRol));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      txt.salir,
      txt.confirmar_salir,
      [
        { text: idioma === "es" ? "Cancelar" : "Cancel", style: "cancel" },
        {
          text: txt.salir,
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  const stats = {
    total: usuarios.length,
    admins: usuarios.filter(u => u.rol === "admin").length,
    testers: usuarios.filter(u => u.rol === "tester").length,
  };

  const forzarRestablecimiento = async (email, nombre) => {
    if (!email) {
      Alert.alert(idioma === "es" ? "Aviso" : "Notice", "Este perfil no cuenta con un correo registrado.");
      return;
    }
    Alert.alert(
      idioma === "es" ? "Confirmar Envío" : "Confirm Send",
      `¿Enviar enlace de recuperación a ${email}?`,
      [
        { text: idioma === "es" ? "Cancelar" : "Cancel", style: "cancel" },
        {
          text: idioma === "es" ? "Enviar" : "Send",
          onPress: async () => {
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(email);
              if (error) throw error;
              Alert.alert("Éxito", "Enlace enviado exitosamente.");
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  const asignarRol = async (userId, nuevoRol, nombre) => {
    Alert.alert(
      "Confirmar Rol",
      `¿Asignar el rol de ${nuevoRol.toUpperCase()} a ${nombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              const { error } = await supabase.from("perfiles").update({ rol: nuevoRol }).eq("id", userId);
              if (error) throw error;
              Alert.alert("Éxito", `Rol actualizado correctamente.`);
              cargarUsuarios();
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  };

  const toggleSuspensionUsuario = async (userId, estaSuspendido, nombre) => {
    const accionTexto = estaSuspendido ? "activar" : "suspender";
    Alert.alert(
      "Confirmar Estado",
      `¿Deseas ${accionTexto} la cuenta de ${nombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: estaSuspendido ? "ACTIVAR" : "SUSPENDER",
          style: estaSuspendido ? "default" : "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("perfiles")
                .update({ activo: estaSuspendido ? true : false }) 
                .eq("id", userId);

              if (error) throw error;
              Alert.alert("Éxito", `Usuario modificado.`);
              cargarUsuarios();
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  };

  const eliminarUsuario = async (userId, nombre) => {
    Alert.alert(
      "¡PELIGRO ELIMINACIÓN!",
      `¿Eliminar permanentemente a ${nombre}? Esta acción alterará permanentemente la base de datos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "ELIMINAR",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("perfiles").delete().eq("id", userId);
              if (error) throw error;
              Alert.alert("Éxito", "Usuario borrado.");
              cargarUsuarios();
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  const renderUsuario = ({ item }) => {
    const rolActual = item.rol || "user";
    const estaBaneado = item.activo === false; 
    const isExpanded = expandedUser === item.id;
    
    let etiquetaRol = txt.user_label;
    if (rolActual === "admin") etiquetaRol = txt.admin_label;
    if (rolActual === "tester") etiquetaRol = txt.tester_label;

    const userEmail = item.email || item.correo || "Sin correo registrado";

    return (
      <View style={[styles.userCard, estaBaneado && styles.cardBanned]}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => setExpandedUser(isExpanded ? null : item.id)}
          style={styles.cardHeaderPress}
        >
          <View style={styles.cardInfoLeft}>
            <Text style={[styles.userName, estaBaneado && styles.textMuted]}>
              {item.nombre || "Atleta Anónimo"}
            </Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
          </View>
          
          <View style={styles.cardInfoRight}>
            <View style={[styles.roleBadge, rolActual === "admin" && styles.badgeAdmin, rolActual === "tester" && styles.badgeTester, estaBaneado && styles.badgeBanned]}>
              <Text style={[styles.roleBadgeText, rolActual === "admin" && styles.textAdmin, rolActual === "tester" && styles.textTester, estaBaneado && styles.textBannedText]}>
                {estaBaneado ? "SUSPENDED" : etiquetaRol}
              </Text>
            </View>
            <Text style={styles.arrowIcon}>{isExpanded ? "▲" : "▼"}</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.dividerLine} />
            
            <Text style={styles.detailsText}>ASIGNAR ROL:</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={[styles.actionBtn, rolActual === 'user' ? styles.btnRoleActive : styles.btnOutline]} 
                onPress={() => asignarRol(item.id, 'user', item.nombre)}
              >
                <Text style={rolActual === 'user' ? styles.textRoleActive : styles.textHighlight}>{txt.user_label}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, rolActual === 'tester' ? styles.btnRoleActive : styles.btnOutline]} 
                onPress={() => asignarRol(item.id, 'tester', item.nombre)}
              >
                <Text style={rolActual === 'tester' ? styles.textRoleActive : styles.textHighlight}>{txt.tester_label}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, rolActual === 'admin' ? styles.btnRoleActive : styles.btnOutline]} 
                onPress={() => asignarRol(item.id, 'admin', item.nombre)}
              >
                <Text style={rolActual === 'admin' ? styles.textRoleActive : styles.textHighlight}>{txt.admin_label}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={() => forzarRestablecimiento(item.email || item.correo, item.nombre)}
              >
                <Text style={styles.actionBtnText}>{txt.accion_pass}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, estaBaneado ? styles.btnSuccess : styles.btnWarning]} 
                onPress={() => toggleSuspensionUsuario(item.id, estaBaneado, item.nombre)}
              >
                <Text style={estaBaneado ? styles.btnSuccessText : styles.btnWarningText}>
                  {estaBaneado ? txt.accion_unban : txt.accion_ban}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, styles.btnDanger]} 
                onPress={() => eliminarUsuario(item.id, item.nombre)}
              >
                <Text style={styles.btnDangerText}>{txt.accion_eliminar}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>K I N E T I C  •  C O N S O L E</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>{txt.salir}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.tag}>{txt.tag}</Text>
        <Text style={styles.title}>
          {txt.titulo}{"\n"}
          <Text style={styles.highlight}>{txt.sub}</Text>
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>{txt.total_usuarios}</Text>
          </View>
          <View style={[styles.statBox, styles.borderAdmin]}>
            <Text style={[styles.statValue, styles.textAdmin]}>{stats.admins}</Text>
            <Text style={styles.statLabel}>{txt.total_admins}</Text>
          </View>
          <View style={[styles.statBox, styles.borderTester]}>
            <Text style={[styles.statValue, styles.textTester]}>{stats.testers}</Text>
            <Text style={styles.statLabel}>{txt.total_testers}</Text>
          </View>
        </View>

        <Searchbar
          placeholder={txt.buscar_placeholder}
          placeholderTextColor="#555"
          value={buscar}
          onChangeText={setBuscar}
          style={styles.search}
          inputStyle={{ color: "#fff", minHeight: 0 }}
          iconColor="#ff716c"
        />

        <View style={styles.chipsContainer}>
          {["all", "admin", "tester", "user"].map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.chip, filtroRol === role && styles.chipActive]}
              onPress={() => setFiltroRol(role)}
            >
              <Text style={[styles.chipText, filtroRol === role && styles.chipTextActive]}>
                {role === "all" ? txt.filtro_todos : role.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#ff716c" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredUsuarios}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={renderUsuario}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            keyboardShouldPersistTaps="handled" 
            ListEmptyComponent={<Text style={styles.emptyText}>{txt.vacio}</Text>}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0e10" },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 40, 
    padding: 16, 
    backgroundColor: "#111416", 
    alignItems: "center", 
    borderBottomWidth: 1, 
    borderColor: "#1c2024" 
  },
  headerTitle: { fontFamily: "Lexend_800ExtraBold", fontSize: 14, color: "#88adff", letterSpacing: 2 },
  logoutBtn: { backgroundColor: '#171a1c', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#24282c' },
  logoutText: { color: '#ff716c', fontSize: 10, fontFamily: 'Lexend_700Bold', letterSpacing: 1 },
  
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  tag: { color: "#ff716c", fontSize: 11, letterSpacing: 3, fontFamily: "Manrope_800ExtraBold" },
  title: { fontSize: 36, color: "#fff", fontFamily: "Lexend_800ExtraBold", lineHeight: 42, marginVertical: 4 },
  highlight: { color: "#ff716c" },
  
  statsContainer: { flexDirection: "row", gap: 10, marginVertical: 14 },
  statBox: { flex: 1, backgroundColor: "#111416", padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#24282c" },
  borderAdmin: { borderBottomWidth: 3, borderBottomColor: "#ff716c" },
  borderTester: { borderBottomWidth: 3, borderBottomColor: "#88adff" },
  statValue: { fontSize: 22, fontFamily: "Lexend_800ExtraBold", color: "#fff" },
  statLabel: { fontSize: 9, fontFamily: "Manrope_700Bold", color: "#5c5e61", marginTop: 2, letterSpacing: 1 },

  search: { backgroundColor: "#111416", borderRadius: 10, marginBottom: 14, height: 50 },
  
  chipsContainer: { flexDirection: "row", gap: 6, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#171a1c", borderWidth: 1, borderColor: "#24282c" },
  chipActive: { backgroundColor: "#ff716c", borderColor: "#ff716c" },
  chipText: { color: "#aaabad", fontSize: 11, fontFamily: "Lexend_700Bold" },
  chipTextActive: { color: "#0c0e10" },

  listContainer: { paddingBottom: 120 },
  
  emptyText: { color: "#747578", textAlign: "center", marginTop: 40, fontFamily: "Manrope_400Regular" },

  userCard: { backgroundColor: "#171a1c", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#24282c" },
  cardBanned: { borderColor: "#4a1515", backgroundColor: "#1a1111" },
  cardHeaderPress: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardInfoLeft: { flex: 1, paddingRight: 10 },
  cardInfoRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  userName: { color: "#fff", fontSize: 15, fontFamily: "Lexend_700Bold" },
  userEmail: { color: "#6e7277", fontSize: 12, fontFamily: "Manrope_500Medium", marginTop: 1 },
  arrowIcon: { color: "#5c5e61", fontSize: 12 },
  textMuted: { color: "#8a6666", textDecorationLine: "line-through" },

  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#232629" },
  roleBadgeText: { fontSize: 9, fontFamily: "Lexend_800ExtraBold", color: "#aaabad", letterSpacing: 0.5 },
  badgeAdmin: { backgroundColor: "rgba(255, 113, 108, 0.12)" },
  textAdmin: { color: "#ff716c" },
  badgeTester: { backgroundColor: "rgba(136, 173, 255, 0.12)" },
  textTester: { color: "#88adff" },
  badgeBanned: { backgroundColor: "#ff3b30" },
  textBannedText: { color: "#fff" },

  expandedContent: { marginTop: 14 },
  dividerLine: { height: 1, backgroundColor: "#24282c", marginBottom: 10 },
  detailsText: { fontSize: 10, fontFamily: "Lexend_700Bold", color: "#5c5e61", marginBottom: 8, letterSpacing: 1 },
  actionsGrid: { flexDirection: "row", gap: 8, marginBottom: 8 },
  actionBtn: { flex: 1, backgroundColor: "#232629", paddingVertical: 11, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  actionBtnText: { fontSize: 12, fontFamily: "Manrope_700Bold", color: "#eeeef0" },
  
  btnOutline: { borderWidth: 1, borderColor: "#88adff", backgroundColor: "transparent" },
  textHighlight: { color: "#88adff", fontSize: 11, fontFamily: "Manrope_700Bold" },
  
  btnRoleActive: { backgroundColor: "#88adff", borderWidth: 1, borderColor: "#88adff" },
  textRoleActive: { color: "#0c0e10", fontSize: 11, fontFamily: "Manrope_800ExtraBold" },

  btnDanger: { backgroundColor: "rgba(255, 75, 75, 0.15)", borderWidth: 1, borderColor: "#ff4b4b" },
  btnDangerText: { fontSize: 12, fontFamily: "Manrope_700Bold", color: "#ff4b4b" },
  btnWarning: { backgroundColor: "rgba(255, 159, 10, 0.15)", borderWidth: 1, borderColor: "#ff9f0a" },
  btnWarningText: { fontSize: 12, fontFamily: "Manrope_700Bold", color: "#ff9f0a" },
  btnSuccess: { backgroundColor: "rgba(48, 209, 88, 0.15)", borderWidth: 1, borderColor: "#30d158" },
  btnSuccessText: { fontSize: 12, fontFamily: "Manrope_700Bold", color: "#30d158" }
});