import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  Image,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal QR Code
  const [qrCodeImage, setQrCodeImage] = useState(null); // Armazena a string base64 do QR Code

  // Função para buscar os dados do perfil
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          Alert.alert("Erro", "Token não encontrado. Faça login novamente.");
          return;
        }

        const baseURL = Platform.OS === "web" ? "http://localhost:3000" : "http://192.168.10.4:3000";
        const response = await axios.get(`${baseURL}/api/usuarios/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserData(response.data);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        Alert.alert("Erro", "Não foi possível carregar o perfil. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Função para gerar o QR Code
  const generateQRCode = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Erro", "Token não encontrado. Faça login novamente.");
        return;
      }

      if (!userData || !userData.cpf) {
        Alert.alert("Erro", "Dados do usuário não carregados.");
        return;
      }

      const baseURL = Platform.OS === "web" ? "http://localhost:3000" : "http://192.168.10.4:3000";
      const response = await axios.post(
        `${baseURL}/api/usuarios/generate-qrcode`,
        { cpf: userData.cpf },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setQrCodeImage(response.data.qrCodeURL);
      setIsModalVisible(true);
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      Alert.alert(
        "Erro",
        error.response?.data?.message || "Não foi possível gerar o QR Code."
      );
    }
  };

  // Função para salvar o QR Code (mobile e web)
  const saveQRCode = async () => {
    try {
      const base64Data = qrCodeImage.replace("data:image/png;base64,", "");

      if (Platform.OS !== "web") {
        // Mobile: usar expo-media-library e expo-file-system
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Erro", "Permissão para acessar a galeria foi negada.");
          return;
        }

        const fileUri = `${FileSystem.cacheDirectory}qrcode.png`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await MediaLibrary.saveToLibraryAsync(fileUri);
        Alert.alert("Sucesso", "QR Code salvo na galeria!");
      } else {
        // Web: fazer download do arquivo
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/png" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "qrcode.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert("Sucesso", "QR Code baixado!");
      }
    } catch (error) {
      console.error("Erro ao salvar QR Code:", error);
      Alert.alert("Erro", "Não foi possível salvar o QR Code.");
    }
  };

  // Função para compartilhar o QR Code (mobile e web)
  const shareQRCode = async () => {
    try {
      const base64Data = qrCodeImage.replace("data:image/png;base64,", "");

      if (Platform.OS !== "web") {
        // Mobile: usar expo-sharing e expo-file-system
        const fileUri = `${FileSystem.cacheDirectory}qrcode.png`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Sharing.shareAsync(fileUri);
      } else {
        // Web: usar Web Share API ou fallback para download
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/png" });
        const file = new File([blob], "qrcode.png", { type: "image/png" });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "QR Code",
            text: "Meu QR Code do Diaconato 2025",
          });
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "qrcode.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          Alert.alert("Sucesso", "Web Share não suportado. QR Code baixado!");
        }
      }
    } catch (error) {
      console.error("Erro ao compartilhar QR Code:", error);
      Alert.alert("Erro", "Não foi possível compartilhar o QR Code.");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>Não foi possível carregar os dados do perfil.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil do Usuário</Text>
      <Text style={styles.info}>Nome: {userData.nome || "Não informado"}</Text>
      <Text style={styles.info}>CPF: {userData.cpf || "Não informado"}</Text>
      <Text style={styles.info}>Área: {userData.area || "Não informado"}</Text>
      <Text style={styles.info}>
        Congregação: {userData.congregacao || "Não informado"}
      </Text>
      <Text style={styles.info}>
        Email: {userData.email || "Não informado"}
      </Text>

      <TouchableOpacity style={styles.qrCodeButton} onPress={generateQRCode}>
        <Text style={styles.qrCodeButtonText}>Gerar QR Code</Text>
      </TouchableOpacity>

      {/* Modal para exibir o QR Code */}
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Diaconato 2025</Text>
            <View style={styles.dadosEventoContainer}>
              <Text style={styles.titleDadosEvento}>Data:</Text>
              <Text style={styles.contentDadosEvento}>
                {new Date().toLocaleDateString("pt-BR")}
              </Text>
              <Text style={styles.titleDadosEvento}>Horário:</Text>
              <Text style={styles.contentDadosEvento}>08:00</Text>
            </View>
            {qrCodeImage && (
              <View style={styles.qrCodeImageContainer}>
                <Image source={{ uri: qrCodeImage }} style={styles.qrCodeImage} />
              </View>
            )}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={saveQRCode}>
                <Text style={styles.actionButtonText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={shareQRCode}>
                <Text style={styles.actionButtonText}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  info: {
    fontSize: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f1901d",
    padding: 10,
    width: "90%",
    borderRadius: 5,
  },
  qrCodeButton: {
    padding: 10,
    backgroundColor: "#f1901d",
    borderRadius: 5,
    marginBottom: 10,
    width: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  qrCodeButtonText: {
    fontWeight: "bold",
    color: "#ffffff",
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
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 20,
  },
  qrCodeImageContainer: {
    marginBottom: 20,
    width: "85%",
    justifyContent: "center",
    alignItems: "center",
  },
  qrCodeImage: {
    width: 250,
    height: 250,
  },
  closeButton: {
    padding: 10,
    backgroundColor: "#000000",
    borderRadius: 5,
    width: "85%",
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  dadosEventoContainer: {
    width: "85%",
  },
  titleDadosEvento: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  contentDadosEvento: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "85%",
    marginBottom: 10,
  },
  actionButton: {
    padding: 10,
    backgroundColor: "#f1901d",
    borderRadius: 5,
    width: "48%",
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});