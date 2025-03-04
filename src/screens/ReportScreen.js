import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

export default function ReportScreen() {
  const [chartData, setChartData] = useState({
    labels: ["Total", "Presentes", "Ausentes"],
    datasets: [
      {
        data: [0, 0, 0], // Valores iniciais
      },
    ],
  });

  // Função para obter o token (compatível com web e mobile)
  const getToken = async () => {
    if (Platform.OS === "web") {
      return localStorage.getItem("userToken");
    } else {
      return await AsyncStorage.getItem("userToken");
    }
  };

  // Função para buscar os dados do backend
  const fetchRelatorio = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.error("Token não encontrado.");
        return;
      }

      const baseURL = Platform.OS === "web" ? "https://201.75.89.242:3000" :  "https://localhost:3000";
      console.log("URL da requisição:", baseURL);

      const response = await axios.get(`${baseURL}/api/usuarios/relatorio?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { totalUsuarios, presentes, ausentes } = response.data;
      console.log("Dados recebidos do backend:", { totalUsuarios, presentes, ausentes });

      const updatedChartData = {
        labels: ["Total", "Presentes", "Ausentes"],
        datasets: [
          {
            data: [Number(totalUsuarios) || 0, Number(presentes) || 0, Number(ausentes) || 0],
          },
        ],
      };

      console.log("Dados enviados ao gráfico:", updatedChartData);
      setChartData({ ...updatedChartData });
    } catch (error) {
      console.error("Erro ao buscar relatório:", error);
      Alert.alert("Erro", "Falha ao carregar o relatório.");
    }
  };

  // Função para exportar dados (mobile e web)
  const handleExport = async (type) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error("Token não encontrado.");
        return;
      }

      const baseURL = Platform.OS === "web" ? "https://201.75.89.242:3000" :  "https://localhost:3000";
      const url = `${baseURL}/api/usuarios/export/${type}`;

      if (Platform.OS !== "web") {
        // Mobile: usar expo-file-system e StorageAccessFramework
        const downloadPath = `${FileSystem.documentDirectory}usuarios.${type}`;
        const downloadResumable = FileSystem.createDownloadResumable(url, downloadPath, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { uri } = await downloadResumable.downloadAsync();

        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            `usuarios.${type}`,
            type === "xlsx"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "application/pdf"
          );

          const fileContent = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          await FileSystem.writeAsStringAsync(newUri, fileContent, {
            encoding: FileSystem.EncodingType.Base64,
          });

          Alert.alert("Sucesso", `Arquivo salvo em: ${newUri}`);
        } else {
          Alert.alert("Erro", "Permissão negada para acessar a pasta de Downloads.");
        }
      } else {
        // Web: fazer download direto
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob", // Receber como Blob para download
        });

        const blob = new Blob([response.data], {
          type:
            type === "xlsx"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "application/pdf",
        });
        const urlBlob = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = urlBlob;
        link.download = `usuarios.${type}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(urlBlob);

        Alert.alert("Sucesso", `Arquivo ${type.toUpperCase()} baixado!`);
      }
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      Alert.alert("Erro", "Falha ao exportar dados");
    }
  };

  // Atualização dinâmica com useEffect
  useEffect(() => {
    fetchRelatorio(); // Busca inicial
    const intervalId = setInterval(() => {
      fetchRelatorio();
    }, 10000); // Atualiza a cada 10 segundos
    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar
  }, []);

  // Configuração do gráfico
  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0, // Sem decimais
    color: (opacity = 1) => `rgba(241, 144, 29, ${opacity})`, // Cor laranja (#f1901d)
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Cor dos rótulos
    style: {
      borderRadius: 16,
    },
    propsForBars: {
      strokeWidth: "2",
      stroke: "#f1901d",
    },
    barPercentage: 1.5, // Ajustar a largura das barras
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Relatório de Presenças</Text>
      <BarChart
        style={styles.chart}
        data={chartData}
        width={Dimensions.get("window").width - 40}
        height={225}
        yAxisLabel=""
        chartConfig={chartConfig}
        verticalLabelRotation={0}
        fromZero // Forçar o eixo Y a começar do zero
      />

      <View style={styles.buttonConteiner}>
        <TouchableOpacity style={styles.exportsButton} onPress={() => handleExport("xlsx")}>
          <Text style={styles.exportsButtonText}>Exportar para Excel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportsButton} onPress={() => handleExport("pdf")}>
          <Text style={styles.exportsButtonText}>Exportar para PDF</Text>
        </TouchableOpacity>
      </View>
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    marginTop: 30,
  },
  buttonConteiner: {
    marginTop: 20,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  exportsButton: {
    backgroundColor: "#000000",
    padding: 10,
    borderRadius: 5,
    width: "85%",
    alignItems: "center",
    marginBottom: 10,
  },
  exportsButtonText: {
    fontWeight: "bold",
    color: "#ffffff",
  },
});