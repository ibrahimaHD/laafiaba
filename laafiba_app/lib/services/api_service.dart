import 'package:dio/dio.dart';
import '../config/app_config.dart';
import 'storage_service.dart';

class ApiService {
  final Dio _dio = Dio();
  final StorageService _storage = StorageService();

  ApiService() {
    _dio.options.baseUrl = AppConfig.baseUrl;
    _dio.options.connectTimeout = AppConfig.timeout;
    _dio.options.receiveTimeout = AppConfig.timeout;
    _dio.options.headers = {'Content-Type': 'application/json'};

    // Interceptor pour injecter le token automatiquement
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        print('🌐 ${options.method} ${options.uri}');
        handler.next(options);
      },
      onResponse: (response, handler) {
        print('✅ Response: ${response.statusCode}');
        handler.next(response);
      },
      onError: (error, handler) async {
        print('❌ Error: ${error.response?.statusCode} - ${error.message}');
        print('📄 Response data: ${error.response?.data}');
        
        if (error.response?.statusCode == 401) {
          await _storage.clearStorage();
        }
        handler.next(error);
      },
    ));
  }

  Future<Map<String, dynamic>> login(String telephone, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'telephone': telephone,
        'password': password,
      });
      return response.data;
    } on DioException catch (e) {
      final message = e.response?.data['message'] ?? 
                     e.response?.data['error'] ?? 
                     e.message ?? 
                     'Erreur réseau';
      throw Exception(message);
    } catch (e) {
      throw Exception('Erreur inattendue: $e');
    }
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    try {
      final response = await _dio.post('/auth/register', data: userData);
      return response.data;
    } on DioException catch (e) {
      final message = e.response?.data['message'] ?? 
                     e.response?.data['error'] ?? 
                     e.message ?? 
                     'Erreur réseau';
      throw Exception(message);
    } catch (e) {
      throw Exception('Erreur inattendue: $e');
    }
  }

  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await _dio.get('/auth/profile');
      return response.data;
    } on DioException catch (e) {
      final message = e.response?.data['message'] ?? 
                     e.response?.data['error'] ?? 
                     e.message ?? 
                     'Erreur réseau';
      throw Exception(message);
    } catch (e) {
      throw Exception('Erreur inattendue: $e');
    }
  }
}