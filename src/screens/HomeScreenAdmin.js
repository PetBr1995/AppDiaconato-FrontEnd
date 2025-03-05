import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreenAdmin() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [cpf, setCpf] = useState("");
  const navigation = useNavigation();

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setCpf("");
  };

  const promoteUser = async () => {
    try {
      if (!cpf || cpf.length !== 11 || isNaN(cpf)) {
        Alert.alert("Erro", "CPF inválido. Insira exatamente 11 dígitos numéricos.");
        return;
      }

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Erro", "Token não encontrado. Faça login novamente.");
        return;
      }

      const response = await axios.put(
        "https://appdiaconato.ddns.net:3000/api/usuarios/users/promote",
        { cpf },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.message) {
        Alert.alert("Sucesso", response.data.message);
        closeModal();
      }
    } catch (error) {
      console.error("Erro ao promover usuário:", error);
      Alert.alert("Erro", error.response?.data?.message || "Ocorreu um erro ao promover o usuário.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Diaconato 2025</Text>
      <TouchableOpacity onPress={() => navigation.navigate("ScanScreen")} style={styles.linkPerfil}>
        <Text style={styles.linkPerfilText}>Scan QRCode</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.linkPerfil}>
        <Text style={styles.linkPerfilText}>Perfil</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("ReportScreen")} style={styles.linkPerfil}>
        <Text style={styles.linkPerfilText}>Relatório de presenças</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={openModal} style={styles.linkPerfil}>
        <Text style={styles.linkPerfilText}>Promover Administrador</Text>
      </TouchableOpacity>

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Promover Usuário</Text>
            <TextInput
              style={styles.input}
              placeholder="CPF (11 dígitos)"
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
              maxLength={11}
            />
            <TouchableOpacity style={styles.promoteButton} onPress={promoteUser}>
              <Text style={styles.promoteButtonText}>Promover</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 14,
  },
  linkPerfil: {
    backgroundColor: "#f1901d",
    padding: 12,
    borderRadius: 5,
    marginTop: 6,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "bold",
    width: "90%",
  },
  linkPerfilText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    width: "85%",
  },
  promoteButton: {
    backgroundColor: "#f1901d",
    padding: 10,
    borderRadius: 5,
    width: "85%",
    alignItems: "center",
    marginBottom: 10,
  },
  promoteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: "#000000",
    padding: 10,
    borderRadius: 5,
    width: "85%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});