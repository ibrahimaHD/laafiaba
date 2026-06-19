import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthProvider>().user!;
    return Scaffold(
      appBar: AppBar(
        title: const Text('LaafiBa'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              context.read<AuthProvider>().logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bienvenue,', style: TextStyle(fontSize: 18, color: Colors.grey)),
            Text('${user.nom} ${user.prenom}', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
            const SizedBox(height: 30),
            Card(
              child: ListTile(
                leading: const Icon(Icons.phone),
                title: const Text('Téléphone'),
                subtitle: Text(user.telephone),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.badge),
                title: const Text('QR Code Patient'),
                subtitle: Text(user.qrCodeToken ?? 'Non généré'),
                trailing: const Icon(Icons.qr_code),
              ),
            ),
            const Spacer(),
            const Center(child: Text('🏥 Carnet • 📍 Géolocalisation • 💊 Médicaments\nModules à venir...', textAlign: TextAlign.center)),
          ],
        ),
      ),
    );
  }
}