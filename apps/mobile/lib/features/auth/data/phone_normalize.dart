/// Normalize Indian mobile input to E.164 `+91XXXXXXXXXX`.
String normalizeIndianMobile(String raw) {
  var s = raw.trim().replaceAll(RegExp(r'[\s\-()]'), '');
  if (s.startsWith('00')) s = '+${s.substring(2)}';
  if (RegExp(r'^\d{10}$').hasMatch(s) && RegExp(r'^[6-9]').hasMatch(s)) {
    return '+91$s';
  }
  if (RegExp(r'^91[6-9]\d{9}$').hasMatch(s)) {
    return '+$s';
  }
  if (s.startsWith('+91') && s.length == 13) return s;
  return s;
}

/// True when [raw] normalizes to E.164 Indian mobile `+91[6-9]XXXXXXXXX`.
bool isValidIndianMobile(String raw) {
  return RegExp(r'^\+91[6-9]\d{9}$').hasMatch(normalizeIndianMobile(raw));
}
