import pathlib, sys

OPS = [
 ("lib/core/client.dart", [
  ("  String? role;\n  Set<String>? _autorises;\n  bool _tout = false;",
   "  String? role;\n  Set<String>? _autorises;\n  bool _tout = false;\n  bool codeADefinir = false;\n  static void Function()? onExpire;"),
  ("        c.complete(await _wait!.future.timeout(Duration(seconds: delai)));",
   "        final rep = await _wait!.future.timeout(Duration(seconds: delai));\n        if (rep['admin_requis'] == true) onExpire?.call();\n        c.complete(rep);"),
  ("      _tout = pm == '*';",
   "      _tout = pm == '*';\n      codeADefinir = r['code_a_definir'] == true;"),
  ("    role = null;\n    _autorises = null;\n    _tout = false;",
   "    role = null;\n    _autorises = null;\n    _tout = false;\n    codeADefinir = false;"),
 ], None),
 ("lib/screens/login_screen.dart", [
  ("import 'home_screen.dart';", "import 'code_screen.dart';\nimport 'home_screen.dart';"),
  ("    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));",
   "    Navigator.of(context).pushReplacement(MaterialPageRoute(\n        builder: (_) => Api.i.codeADefinir\n            ? const CodeScreen(changer: false, obligatoire: true)\n            : const HomeScreen()));"),
 ], None),
 ("lib/core/menu.dart", [
  ("  Entree('Définir le code', Icons.lock_outline, 'Première fois seulement', 'admin_definir_code',\n      ecran: () => const CodeScreen(changer: false)),\n", ""),
 ], None),
 ("lib/widgets/ui.dart", [
  ("  final r = await Api.i.envoyer({'action': e.action, ...p});",
   "  final r = await executer(context, {'action': e.action, ...p});"),
 ], """
/// Envoie une action ; si le serveur demande le code admin (actions sensibles), le demande et réessaie.
Future<Map<String, dynamic>> executer(BuildContext c, Map<String, dynamic> p,
    {int delai = 12}) async {
  var r = await Api.i.envoyer(p, delai: delai);
  var essais = 0;
  while (r['code_requis'] == true && c.mounted && essais < 3) {
    final code = await demanderCode(c, (r['msg'] ?? 'Retape ton code admin.').toString());
    if (code == null) return {'ok': false, 'msg': 'Action annulée.'};
    r = await Api.i.envoyer({...p, 'code_confirm': code}, delai: delai);
    essais++;
  }
  return r;
}

Future<String?> demanderCode(BuildContext c, String texte) {
  final ctrl = TextEditingController();
  return showModalBottomSheet<String>(
    context: c,
    isScrollControlled: true,
    backgroundColor: C.s1,
    shape: _forme,
    builder: (ctx) => Padding(
      padding: EdgeInsets.fromLTRB(18, 16, 18, 20 + MediaQuery.of(ctx).viewInsets.bottom),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Text('Confirmer avec ton code admin',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Text(texte, style: const TextStyle(color: C.mu, fontSize: 13)),
        const SizedBox(height: 12),
        TextField(
          controller: ctrl,
          obscureText: true,
          autofocus: true,
          autocorrect: false,
          enableSuggestions: false,
          decoration: const InputDecoration(labelText: 'Code admin'),
        ),
        const SizedBox(height: 10),
        ElevatedButton(onPressed: () => Navigator.pop(ctx, ctrl.text), child: const Text('Confirmer')),
      ]),
    ),
  );
}
"""),
 ("lib/screens/action_screen.dart", [
  ("    final r = await Api.i.envoyer({'action': widget.e.action, ...widget.e.fixes, ...p});",
   "    final r = await executer(context, {'action': widget.e.action, ...widget.e.fixes, ...p});"),
 ], None),
 ("lib/screens/ecole_form_screen.dart", [
  ("import '../core/theme.dart';", "import '../core/theme.dart';\nimport '../widgets/ui.dart';"),
  ("final r = await Api.i.envoyer({\n      'action': 'admin_edumap_ajouter',",
   "final r = await executer(context, {\n      'action': 'admin_edumap_ajouter',"),
 ], None),
 ("lib/screens/home_screen.dart", [
  ("class _HomeScreenState extends State<HomeScreen> {",
   "class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {\n  DateTime? _pause;"),
  ("    super.initState();\n    _reset();",
   "    super.initState();\n    WidgetsBinding.instance.addObserver(this);\n    _reset();"),
  ("    _idle?.cancel();\n    super.dispose();",
   "    WidgetsBinding.instance.removeObserver(this);\n    _idle?.cancel();\n    super.dispose();"),
  ("  void _reset() {",
   "  @override\n  void didChangeAppLifecycleState(AppLifecycleState s) {\n    if (s == AppLifecycleState.paused) {\n      _pause = DateTime.now();\n    } else if (s == AppLifecycleState.resumed) {\n      final p = _pause;\n      _pause = null;\n      if (p != null && DateTime.now().difference(p) > const Duration(seconds: 60)) {\n        _verrouiller();\n      }\n    }\n  }\n\n  void _reset() {"),
 ], None),
]

def main(racine="."):
    base = pathlib.Path(racine)
    nouveaux = []
    for chemin, paires, ajout in OPS:
        p = base / chemin
        if not p.exists():
            sys.exit("ÉCHEC : fichier introuvable : %s" % chemin)
        s = p.read_text(encoding="utf-8")
        if "codeADefinir" in s and chemin.endswith("client.dart"):
            sys.exit("Patch déjà appliqué.")
        for ancien, nouveau in paires:
            if s.count(ancien) != 1:
                sys.exit("ÉCHEC dans %s : ligne attendue introuvable ou en double :\n  %s\nRien n'a été modifié." % (chemin, ancien.strip().splitlines()[0][:90]))
            s = s.replace(ancien, nouveau)
        if ajout:
            s = s.rstrip("\n") + "\n" + ajout
        nouveaux.append((p, s))
    for p, s in nouveaux:
        p.write_text(s, encoding="utf-8")
    print("OK : %d fichiers mis à jour." % len(nouveaux))

if __name__ == "__main__":
    main()
