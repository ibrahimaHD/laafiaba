class UserModel {
  final int id;
  final String uuid;
  final String role;
  final String telephone;
  final String nom;
  final String prenom;
  final String? email;
  final String? qrCodeToken;

  UserModel({
    required this.id,
    required this.uuid,
    required this.role,
    required this.telephone,
    required this.nom,
    required this.prenom,
    this.email,
    this.qrCodeToken,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      uuid: json['uuid'] ?? '',
      role: json['role'] ?? 'patient',
      telephone: json['telephone'] ?? '',
      nom: json['nom'] ?? '',
      prenom: json['prenom'] ?? '',
      email: json['email'],
      qrCodeToken: json['qr_code_token'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'uuid': uuid,
        'role': role,
        'telephone': telephone,
        'nom': nom,
        'prenom': prenom,
        'email': email,
        'qr_code_token': qrCodeToken,
      };
}