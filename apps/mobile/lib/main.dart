import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(const ProviderScope(child: CivicPulseApp()));
}

class AppTheme {
  static const Color primary = Color(0xFF1D9E75);
  static const Color critical = Color(0xFFE24B4A);
  static const Color warning = Color(0xFFBA7517);
  static const Color success = Color(0xFF639922);
  
  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: primary),
    fontFamily: 'Inter',
    appBarTheme: const AppBarTheme(
      elevation: 0,
      backgroundColor: Colors.white,
      foregroundColor: Color(0xFF2C2C2A),
      titleTextStyle: TextStyle(
        fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF2C2C2A)
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFD3D1C7), width: 0.5),
      ),
    ),
  );
}

class CivicPulseApp extends StatelessWidget {
  const CivicPulseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CivicPulse AI',
      theme: AppTheme.lightTheme,
      home: const Scaffold(
        body: Center(
          child: Text('CivicPulse Mobile - See TRD for implementation'),
        ),
      ),
    );
  }
}
