class AppConfig {
  // Adresse IP du serveur backend (PC de développement)
  // À modifier selon votre réseau local
  static const String baseUrl = 'http://192.168.11.106:5000/api';
  
  // Délai d'attente pour les requêtes réseau
  static const Duration timeout = Duration(seconds: 15);
}