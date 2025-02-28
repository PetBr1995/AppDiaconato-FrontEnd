import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [isCertModalVisible, setIsCertModalVisible] = useState(false);
  const [certificateImage, setCertificateImage] = useState(null);
  const [message, setMessage] = useState(""); // Estado para exibir mensagens na tela

  // Log inicial para verificar carregamento
  useEffect(() => {
    console.log("HomeScreen montado com sucesso.");
    console.log("Plataforma atual:", Platform.OS);
  }, []);

  // Função para exibir mensagens (alternativa ao Alert.alert)
  const showMessage = (title, msg) => {
    console.log(`${title}: ${msg}`);
    setMessage(`${title}: ${msg}`);
    Alert.alert(title, msg); // Mantém o Alert.alert como fallback
    setTimeout(() => setMessage(""), 5000); // Limpa a mensagem após 5 segundos
  };

  // Função para verificar presenças e gerar certificado
  const generateCertificate = async () => {
    try {
      console.log("1. Iniciando geração de certificado...");
      showMessage("Info", "Iniciando geração de certificado...");

      const token = await AsyncStorage.getItem("userToken");
      console.log("2. Token obtido:", token || "Nenhum token encontrado.");
      if (!token) {
        showMessage("Erro", "Token não encontrado. Faça login novamente.");
        return;
      }

      const baseURL = Platform.OS === "web" ? "http://localhost:3000" : "http://192.168.10.4:3000";
      console.log("3. Base URL usada:", baseURL);

      console.log("4. Verificando presenças...");
      const attendanceResponse = await axios.get(
        `${baseURL}/api/usuarios/check-attendance`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("5. Resposta da verificação de presenças:", attendanceResponse.data);

      const { morning, afternoon } = attendanceResponse.data;
      if (!morning || !afternoon) {
        showMessage(
          "Atenção",
          "Você precisa ter presença registrada na manhã e na tarde para gerar o certificado."
        );
        return;
      }

      console.log("6. Gerando certificado...");
      const certResponse = await axios.get(
        `${baseURL}/api/usuarios/generate-certificate`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("7. Resposta da geração de certificado:", certResponse.data);

      if (certResponse.data.certificateImage) {
        setCertificateImage(certResponse.data.certificateImage);
        setIsCertModalVisible(true);
        console.log("8. Certificado gerado e modal aberto.");
        showMessage("Sucesso", "Certificado gerado com sucesso!");
      } else {
        showMessage("Erro", "Imagem do certificado não recebida do servidor.");
      }
    } catch (error) {
      console.error("Erro ao gerar certificado:", error);
      if (error.response) {
        console.log("Erro do backend:", error.response.data);
        showMessage("Erro", error.response.data.message || "Não foi possível gerar o certificado.");
      } else if (error.request) {
        console.log("Nenhuma resposta recebida:", error.request);
        showMessage("Erro", "Sem resposta do servidor. Verifique a conexão.");
      } else {
        console.log("Erro na configuração:", error.message);
        showMessage("Erro", "Erro ao configurar a requisição: " + error.message);
      }
    }
  };

  // Função para salvar o certificado (mobile e web)
  const saveCertificate = async () => {
    try {
      console.log("Iniciando salvamento do certificado...");
      if (!certificateImage) {
        showMessage("Erro", "Nenhum certificado disponível para salvar.");
        return;
      }

      const base64Data = certificateImage.replace("data:image/png;base64,", "");

      if (Platform.OS !== "web") {
        console.log("Mobile: Solicitando permissão para galeria...");
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          showMessage("Erro", "Permissão para acessar a galeria foi negada.");
          return;
        }

        const fileUri = `${FileSystem.cacheDirectory}certificate.png`;
        console.log("Mobile: Salvando arquivo em:", fileUri);
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log("Mobile: Salvando na galeria...");
        await MediaLibrary.saveToLibraryAsync(fileUri);
        showMessage("Sucesso", "Certificado salvo na galeria!");
      } else {
        console.log("Web: Convertendo base64 para Blob...");
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/png" });
        const url = URL.createObjectURL(blob);

        console.log("Web: Iniciando download...");
        const link = document.createElement("a");
        link.href = url;
        link.download = "certificate.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showMessage("Sucesso", "Certificado baixado!");
      }
    } catch (error) {
      console.error("Erro ao salvar certificado:", error);
      showMessage("Erro", "Não foi possível salvar o certificado.");
    }
  };

  // Função para compartilhar o certificado (mobile e web)
  const shareCertificate = async () => {
    try {
      console.log("Iniciando compartilhamento do certificado...");
      if (!certificateImage) {
        showMessage("Erro", "Nenhum certificado disponível para compartilhar.");
        return;
      }

      const base64Data = certificateImage.replace("data:image/png;base64,", "");

      if (Platform.OS !== "web") {
        const fileUri = `${FileSystem.cacheDirectory}certificate.png`;
        console.log("Mobile: Salvando arquivo para compartilhamento em:", fileUri);
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log("Mobile: Compartilhando arquivo...");
        await Sharing.shareAsync(fileUri);
        console.log("Certificado compartilhado no mobile.");
        showMessage("Sucesso", "Certificado compartilhado com sucesso!");
      } else {
        console.log("Web: Convertendo base64 para Blob...");
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/png" });
        const file = new File([blob], "certificate.png", { type: "image/png" });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          console.log("Web: Usando Web Share API...");
          await navigator.share({
            files: [file],
            title: "Certificado Diaconato 2025",
            text: "Meu certificado de participação!",
          });
          console.log("Certificado compartilhado via Web Share.");
          showMessage("Sucesso", "Certificado compartilhado com sucesso!");
        } else {
          console.log("Web: Web Share não suportado, usando fallback para download...");
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "certificate.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          showMessage("Sucesso", "Web Share não suportado. Certificado baixado!");
        }
      }
    } catch (error) {
      console.error("Erro ao compartilhar certificado:", error);
      showMessage("Erro", "Não foi possível compartilhar o certificado.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Diaconato 2025</Text>
      <Image
        source={require("../../assets/ieadam-logo.png")}
        style={styles.imgHome}
      />
      <TouchableOpacity
        onPress={() => {
          console.log("Navegando para Profile...");
          navigation.navigate("Profile");
        }}
        style={styles.linkPerfil}
      >
        <Text style={styles.linkPerfilText}>Perfil</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={generateCertificate} style={styles.linkPerfil}>
        <Text style={styles.linkPerfilText}>Gerar Certificado</Text>
      </TouchableOpacity>

      {/* Exibir mensagem na tela como alternativa ao Alert */}
      {message ? (
        <Text style={styles.messageText}>{message}</Text>
      ) : null}

      {/* Modal para exibir o Certificado */}
      <Modal visible={isCertModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Certificado de Participação</Text>
            {certificateImage && (
              <View style={styles.certImageContainer}>
                <Image source={{ uri: certificateImage }} style={styles.certImage} />
              </View>
            )}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={saveCertificate}>
                <Text style={styles.actionButtonText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={shareCertificate}>
                <Text style={styles.actionButtonText}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsCertModalVisible(false)}
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
  imgHome: {
    width: 210,
    height: 210,
    marginBottom: 25,
    borderRadius: 12,
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
    width: "95%",
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 20,
  },
  certImageContainer: {
    marginBottom: 20,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  certImage: {
    width: 400,
    height: 300,
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
  messageText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
});