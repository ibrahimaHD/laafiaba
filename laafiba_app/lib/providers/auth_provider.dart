import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final StorageService _storage = StorageService();

  UserModel? _user;
  bool _isLoading = false;
  String? _error;
  bool _isInitialized = false;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  bool get isInitialized => _isInitialized;

  // Vérification au lancement de l'app
  Future<void> checkAuth() async {
    _isLoading = true;
    notifyListeners();
    try {
      final token = await _storage.getToken();
      if (token != null) {
        final response = await _apiService.getProfile();
        if (response['success'] == true) {
          _user = UserModel.fromJson(response['profile']);
        }
      }
    } catch (_) {
      // Token invalide ou expiré
      await _storage.clearStorage();
    } finally {
      _isInitialized = true;
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String telephone, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.login(telephone, password);
      if (response['success'] == true) {
        await _storage.saveToken(response['token']);
        _user = UserModel.fromJson(response['user']);
        return true;
      }
      return false;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> register(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.register(data);
      if (response['success'] == true) {
        await _storage.saveToken(response['token']);
        _user = UserModel.fromJson(response['user']);
        return true;
      }
      return false;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void logout() {
    _user = null;
    _storage.clearStorage();
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}