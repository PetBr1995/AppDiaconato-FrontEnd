import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
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
  const [status, setStatus] = useState({ message: "", type: "" }); // { message, type: "success" | "error" | "warning" }

  // Log inicial para verificar carregamento
  useEffect(() => {
    console.log("HomeScreen montado com sucesso.");
    console.log("Plataforma atual:", Platform.OS);
  }, []);

  // Função para exibir mensagens
  const showMessage = (msg, type) => {
    console.log(`${type.toUpperCase()}: ${msg}`);
    setStatus({ message: msg, type: type.toLowerCase() });
    setTimeout(() => setStatus({ message: "", type: "" }), 5000); // Limpa após 5 segundos
  };

  // Função para verificar presenças e gerar certificado
  const generateCertificate = async () => {
    try {
      console.log("1. Iniciando geração de certificado...");
      showMessage("Iniciando geração de certificado...", "info");

      const token = await AsyncStorage.getItem("userToken");
      console.log("2. Token obtido:", token || "Nenhum token encontrado.");
      if (!token) {
        showMessage("Token não encontrado. Faça login novamente.", "error");
        return;
      }

      const baseURL = Platform.OS === "web" ? "https://appdiaconato.ddns.net:3000" : "https://localhost:3000";
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
          "Você precisa ter presença registrada na manhã e na tarde para gerar o certificado.",
          "warning"
        );
        alert('Você precisa ter presença registrada na manhã e na tarde para gerar o certificado.')
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
        showMessage("Certificado gerado com sucesso!", "success");
      } else {
        showMessage("Imagem do certificado não recebida do servidor.", "error");
      }
    } catch (error) {
      console.error("Erro ao gerar certificado:", error);
      if (error.response) {
        console.log("Erro do backend:", error.response.data);
        showMessage(
          error.response.data.message || "Não foi possível gerar o certificado.",
          "error"
        );
      } else if (error.request) {
        console.log("Nenhuma resposta recebida:", error.request);
        showMessage("Sem resposta do servidor. Verifique a conexão.", "error");
      } else {
        console.log("Erro na configuração:", error.message);
        showMessage("Erro ao configurar a requisição: " + error.message, "error");
      }
    }
  };

  // Função para salvar o certificado (mobile e web)
  const saveCertificate = async () => {
    try {
      console.log("Iniciando salvamento do certificado...");
      if (!certificateImage) {
        showMessage("Nenhum certificado disponível para salvar.", "error");
        return;
      }

      const base64Data = certificateImage.replace("data:image/png;base64,", "");

      if (Platform.OS !== "web") {
        console.log("Mobile: Solicitando permissão para galeria...");
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          showMessage("Permissão para acessar a galeria foi negada.", "error");
          return;
        }

        const fileUri = `${FileSystem.cacheDirectory}certificate.png`;
        console.log("Mobile: Salvando arquivo em:", fileUri);
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log("Mobile: Salvando na galeria...");
        await MediaLibrary.saveToLibraryAsync(fileUri);
        showMessage("Certificado salvo na galeria!", "success");
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

        showMessage("Certificado baixado!", "success");
      }
    } catch (error) {
      console.error("Erro ao salvar certificado:", error);
      showMessage("Não foi possível salvar o certificado.", "error");
    }
  };

  // Função para compartilhar o certificado (mobile e web)
  const shareCertificate = async () => {
    try {
      console.log("Iniciando compartilhamento do certificado...");
      if (!certificateImage) {
        showMessage("Nenhum certificado disponível para compartilhar.", "error");
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
        showMessage("Certificado compartilhado com sucesso!", "success");
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
          showMessage("Certificado compartilhado com sucesso!", "success");
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
          showMessage("Web Share não suportado. Certificado baixado!", "success");
        }
      }
    } catch (error) {
      console.error("Erro ao compartilhar certificado:", error);
      showMessage("Não foi possível compartilhar o certificado.", "error");
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

      {/* Exibir mensagens na tela */}
      {status.message ? (
        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.statusMessage,
              status.type === "success" && styles.successMessage,
              status.type === "error" && styles.errorMessage,
              status.type === "warning" && styles.warningMessage,
              status.type === "info" && styles.infoMessage,
            ]}
          >
            {status.message}
          </Text>
        </View>
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
  statusContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
    alignItems: "center",
    zIndex: 10,
  },
  statusMessage: {
    fontSize: 18,
    textAlign: "center",
    padding: 15,
    borderRadius: 8,
    color: "#fff",
    opacity: 0,
    animation: "fadeIn 0.5s forwards",
  },
  successMessage: {
    backgroundColor: "rgba(0, 128, 0, 0.9)", // Verde para sucesso
  },
  errorMessage: {
    backgroundColor: "rgba(255, 0, 0, 0.9)", // Vermelho para erro
  },
  warningMessage: {
    backgroundColor: "rgba(255, 165, 0, 0.9)", // Amarelo para aviso
  },
  infoMessage: {
    backgroundColor: "rgba(0, 0, 255, 0.9)", // Azul para informação
  },
});

// Adicionar animação CSS inline para React Native Web
const keyframes = `
  @keyframes fadeIn {
    0% { opacity: 0; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1); }
  }
`;
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerHTML = keyframes;
document.head.appendChild(styleSheet);