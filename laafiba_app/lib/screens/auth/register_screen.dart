import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nomCtrl = TextEditingController();
  final _prenomCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  void _handleRegister() async {
    if (_formKey.currentState!.validate()) {
      final success = await context.read<AuthProvider>().register({
        'nom': _nomCtrl.text.trim(),
        'prenom': _prenomCtrl.text.trim(),
        'telephone': _phoneCtrl.text.trim(),
        'password': _passCtrl.text.trim(),
        'role': 'patient',
      });
      if (success && mounted) {
        Navigator.pushReplacementNamed(context, '/home');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Créer un compte')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: ListView(
              children: [
                TextFormField(controller: _nomCtrl, decoration: const InputDecoration(labelText: 'Nom'), validator: (v) => v!.isEmpty ? 'Requis' : null),
                const SizedBox(height: 12),
                TextFormField(controller: _prenomCtrl, decoration: const InputDecoration(labelText: 'Prénom'), validator: (v) => v!.isEmpty ? 'Requis' : null),
                const SizedBox(height: 12),
                TextFormField(controller: _phoneCtrl, decoration: const InputDecoration(labelText: 'Téléphone'), keyboardType: TextInputType.phone, validator: (v) => v!.length < 10 ? 'Invalide' : null),
                const SizedBox(height: 12),
                TextFormField(controller: _passCtrl, decoration: const InputDecoration(labelText: 'Mot de passe'), obscureText: true, validator: (v) => v!.length < 6 ? 'Min 6 caractères' : null),
                const SizedBox(height: 24),
                if (auth.error != null) Text(auth.error!, style: const TextStyle(color: Colors.red)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: auth.isLoading ? null : _handleRegister,
                  style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50), backgroundColor: Colors.green),
                  child: auth.isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('S\'inscrire'),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}