import 'package:dio/dio.dart';
import '../config/app_config.dart';
import 'storage_service.dart';

class ApiService {
  final Dio _dio = Dio();
  final StorageService _storage = StorageService();

  ApiService() {
    print('🔧 Initialisation ApiService avec baseUrl: ${AppConfig.baseUrl}');
    
    _dio.options.baseUrl = AppConfig.baseUrl;
    _dio.options.connectTimeout = AppConfig.timeout;
    _dio.options.receiveTimeout = AppConfig.timeout;
    _dio.options.headers = {'Content-Type': 'application/json'};

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        print('📡 Requête: ${options.method} ${options.uri}');
        handler.next(options);
      },
    ));
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    try {
      print('📝 Tentative d\'inscription...');
      print('🌐 URL complète: ${AppConfig.baseUrl}/auth/register');
      print('📤 Données: $userData');
      
      final response = await _dio.post('/auth/register', data: userData);
      
      print('✅ Inscription réussie: ${response.data}');
      return response.data;
    } on DioException catch (e) {
      print('❌ Erreur Dio type: ${e.type}');
      print('❌ Message: ${e.message}');
      print('❌ URL appelée: ${e.requestOptions.uri}');
      print('❌ Réponse: ${e.response?.data}');
      print('❌ Status code: ${e.response?.statusCode}');
      
      String errorMessage = 'Erreur réseau';
      if (e.type == DioExceptionType.connectionTimeout) {
        errorMessage = 'Délai de connexion dépassé';
      } else if (e.type == DioExceptionType.receiveTimeout) {
        errorMessage = 'Délai de réception dépassé';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Impossible de se connecter au serveur';
      } else if (e.response?.data != null) {
        errorMessage = e.response!.data['message'] ?? 'Erreur serveur';
      }
      
      throw Exception(errorMessage);
    }
  }

  Future<Map<String, dynamic>> login(String telephone, String password) async {
    try {
      print('🔐 Tentative de connexion...');
      final response = await _dio.post('/auth/login', data: {
        'telephone': telephone,
        'password': password,
      });
      print('✅ Connexion réussie');
      return response.data;
    } on DioException catch (e) {
      print('❌ Erreur login: ${e.type} - ${e.message}');
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }

  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await _dio.get('/auth/profile');
      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }
}