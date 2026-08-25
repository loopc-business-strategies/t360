import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AppLocale { en, ta }

final localeProvider = StateNotifierProvider<LocaleNotifier, AppLocale>((ref) {
  return LocaleNotifier();
});

class LocaleNotifier extends StateNotifier<AppLocale> {
  LocaleNotifier() : super(AppLocale.en);

  void setLocale(AppLocale locale) => state = locale;

  void toggle() => state = state == AppLocale.en ? AppLocale.ta : AppLocale.en;
}

final stringsProvider = Provider<AppStrings>((ref) {
  return AppStrings(ref.watch(localeProvider));
});

class AppStrings {
  AppStrings(this.locale);

  final AppLocale locale;

  String get _l => locale == AppLocale.ta ? 'ta' : 'en';

  String _t(String en, String ta) => _l == 'ta' ? ta : en;

  String get brand => _t('THARAGAI', 'தாரகை');
  String get tagline => _t('Readymades for every celebration', 'எல்லா கொண்டாட்டங்களுக்கும் ரெடிமேட்ஸ்');
  String get home => _t('Home', 'முகப்பு');
  String get categories => _t('Categories', 'வகைகள்');
  String get wishlist => _t('Wishlist', 'விருப்பப்பட்டியல்');
  String get cart => _t('Cart', 'கூடை');
  String get account => _t('Account', 'கணக்கு');
  String get orders => _t('Orders', 'ஆர்டர்கள்');
  String get checkout => _t('Checkout', 'செக்அவுட்');
  String get addToCart => _t('Add to Cart', 'கூடையில் சேர்');
  String get loading => _t('Loading…', 'ஏற்றுகிறது…');
  String get retry => _t('Retry', 'மீண்டும்');
  String get errorTitle => _t('Something went wrong', 'பிழை ஏற்பட்டது');
  String get emptyProducts => _t('No products yet', 'பொருட்கள் இல்லை');
  String get emptyCart => _t('Your cart is empty', 'கூடை காலியாக உள்ளது');
  String get emptyWishlist => _t('Your wishlist is empty', 'விருப்பப்பட்டியல் காலியாக உள்ளது');
  String get loginRequired => _t('Sign in to continue', 'தொடர உள்நுழையவும்');
  String get mobile => _t('Mobile (+91)', 'மொபைல் (+91)');
  String get otp => _t('OTP code', 'OTP குறியீடு');
  String get requestOtp => _t('Send OTP', 'OTP அனுப்பு');
  String get verifyOtp => _t('Verify & continue', 'சரிபார்த்து தொடரவும்');
  String get logout => _t('Log out', 'வெளியேறு');
  String get profile => _t('Profile', 'சுயவிவரம்');
  String get name => _t('Name', 'பெயர்');
  String get save => _t('Save', 'சேமி');
  String get addresses => _t('Addresses', 'முகவரிகள்');
  String get addAddress => _t('Add address', 'முகவரி சேர்');
  String get delivery => _t('Delivery', 'டெலிவரி');
  String get pickup => _t('Store pickup', 'கடை எடுப்பு');
  String get placeOrder => _t('Place order', 'ஆர்டர் செய்');
  String get orderTotal => _t('Total', 'மொத்தம்');
  String get shipping => _t('Shipping', 'ஷிப்பிங்');
  String get discount => _t('Discount', 'தள்ளுபடி');
  String get couponCode => _t('Coupon code', 'கூப்பன் குறியீடு');
  String get applyCoupon => _t('Apply coupon', 'கூப்பன் பயன்படுத்து');
  String get loyaltyBalance => _t('Loyalty balance', 'லாயல்டி இருப்பு');
  String get loyaltyPoints => _t('Loyalty points', 'லாயல்டி புள்ளிகள்');
  String get redeemPoints => _t('Points to redeem', 'பரிமாற்ற புள்ளிகள்');
  String get payCod => _t('Cash on delivery', 'டெலிவரியில் பணம்');
  String get payOnline => _t('Pay online', 'ஆன்லைன் செலுத்து');
  String get payMock => _t('Complete mock payment', 'மாக் பேமெண்ட் முடி');
  String get cancelOrder => _t('Cancel order', 'ஆர்டர் ரத்து');
  String get returnOrder => _t('Request return', 'திரும்பக் கோரு');
  String get qty => _t('Qty', 'அளவு');
  String get remove => _t('Remove', 'நீக்கு');
  String get localeToggle => _t('தமிழ்', 'English');
  String get search => _t('Search', 'தேடல்');
  String get inStock => _t('In stock', 'கையிருப்பில்');
  String get outOfStock => _t('Out of stock', 'ஸ்டாக் இல்லை');
  String get branch => _t('Branch', 'கிளை');
  String get selectAddress => _t('Select address', 'முகவரி தேர்வு');
  String get gallery => _t('Design gallery', 'டிசைன் கேலரி');
  String get phone => _t('Phone', 'தொலைபேசி');
  String get line1 => _t('Address line 1', 'முகவரி வரி 1');
  String get city => _t('City', 'நகரம்');
  String get state => _t('State', 'மாநிலம்');
  String get pincode => _t('Pincode', 'பின்கோடு');
  String get delete => _t('Delete', 'நீக்கு');
  String get notifications => _t('Notifications', 'அறிவிப்புகள்');
  String get notificationPrefs => _t('Marketing preferences', 'சந்தைப்படுத்தல் விருப்பங்கள்');
  String get prefEmail => _t('Email offers', 'மின்னஞ்சல் சலுகைகள்');
  String get prefSms => _t('SMS offers', 'SMS சலுகைகள்');
  String get prefPush => _t('Push offers', 'புஷ் சலுகைகள்');
  String get prefWhatsapp => _t('WhatsApp offers', 'WhatsApp சலுகைகள்');
  String get registerDevice => _t('Register device (stub)', 'சாதனம் பதிவு (ஸ்டப்)');
  String get wishlistLogin => _t('Sign in to save favourites', 'பிடித்தவற்றை சேமிக்க உள்நுழையவும்');
  String get aiTitle => _t('Tharagai AI', 'தாரகை AI');
  String get aiHint => _t('Ask about products…', 'பொருட்களைப் பற்றி கேளுங்கள்…');
  String get send => _t('Send', 'அனுப்பு');
  String get openAi => _t('Tharagai AI chat', 'தாரகை AI அரட்டை');
  String get tryMe => _t('✨ TRY ME', '✨ TRY ME');
  String get tryMeUnavailable => _t("Try Me isn't available for this product yet.", 'இந்த தயாரிப்புக்கு Try Me இன்னும் இல்லை.');
  String get tryMeTitle => _t('Virtual Try-On', 'மெய்நிகர் அணிமுயற்சி');
  String get tryMeGuide => _t(
        'For best results: one person, face visible, front-facing, good lighting, and stand naturally.',
        'சிறந்த முடிவுக்கு: ஒரு நபர், முகம் தெரியும், முன் பார்வை, நல்ல வெளிச்சம், இயல்பாக நிற்கவும்.',
      );
  String get tryMeTakePhoto => _t('Take a photo', 'புகைப்படம் எடு');
  String get tryMeUpload => _t('Upload from gallery', 'கேலரியிலிருந்து பதிவேற்று');
  String get tryMeRetake => _t('Retake', 'மீண்டும் எடு');
  String get tryMeConfirm => _t('Start Virtual Try-On', 'அணிமுயற்சியை தொடங்கு');
  String get tryMeProcessing => _t('Creating your virtual try-on…', 'உங்கள் மெய்நிகர் அணிமுயற்சி உருவாக்கப்படுகிறது…');
  String get tryMeStepPrepare => _t('Preparing your photo', 'புகைப்படம் தயார்');
  String get tryMeStepMatch => _t('Matching the outfit', 'ஆடையை பொருத்துதல்');
  String get tryMeStepGenerate => _t('Generating your preview', 'முன்னோட்டம் உருவாக்கம்');
  String get tryMeStepFinish => _t('Finishing your look', 'தோற்றம் முடிவு');
  String get tryMeResult => _t('Your Try-On Result', 'உங்கள் அணிமுயற்சி முடிவு');
  String get tryMeDisclaimer => _t(
        'Virtual Try-On is an AI-generated preview. Actual fit, color and appearance may vary.',
        'மெய்நிகர் அணிமுயற்சி AI முன்னோட்டம். உண்மையான பொருத்தம், நிறம் வேறுபடலாம்.',
      );
  String get tryMeShare => _t('Share', 'பகிர்');
  String get tryMeAnother => _t('Try another product', 'வேறு தயாரிப்பு முயற்சி');
  String get tryMeAgain => _t('Try again', 'மீண்டும் முயற்சி');
  String get tryMeFailed => _t("We couldn't create your try-on.", 'அணிமுயற்சியை உருவாக்க முடியவில்லை.');
  String get tryMeHistory => _t('My Try-Ons', 'என் அணிமுயற்சிகள்');
  String get viewProduct => _t('View product', 'தயாரிப்பைப் பார்');
}

@immutable
class LocaleLabel {
  const LocaleLabel(this.en, this.ta);
  final String en;
  final String ta;
}
