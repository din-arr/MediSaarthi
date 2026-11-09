/**
 * Staff screens (pharmacist, store, operations) in Bengali and Hindi.
 * Keys are the English text, so English needs no table and anything
 * missing falls back to English. `{name}` placeholders are filled in by `s()`.
 * Drug names, schedule codes, OTC, UPI, AI and CSV stay as they are.
 */
export const staffText: Record<"bn" | "hi", Record<string, string>> = {
  bn: {
    // Header
    "Queue": "কিউ", "Store orders": "স্টোরের অর্ডার", "View only. Store staff pick, pack and hand over orders.": "শুধু দেখার জন্য। স্টোরের কর্মীরা অর্ডার বেছে, প্যাক করে রাইডারকে দেন।", "Dashboard": "ড্যাশবোর্ড", "Pharmacist": "ফার্মাসিস্ট", "Store": "স্টোর", "Operations": "অপারেশনস", "Staff": "স্টাফ", "Log out": "লগ আউট", "Schedule {code}": "শিডিউল {code}",
    // Queue
    "Couldn't load the queue. Try logging in again.": "কিউ লোড করা যায়নি। আবার লগ ইন করে দেখুন।",
    "Verification queue": "যাচাইয়ের কিউ",
    "Oldest first. Every Schedule H and H1 item needs your decision.": "সবচেয়ে পুরনো আগে। প্রতিটি শিডিউল H ও H1 ওষুধে আপনার সিদ্ধান্ত লাগবে।",
    "Refresh": "রিফ্রেশ", "Waiting now": "এখন অপেক্ষায়", "Median time today": "আজকের মাঝারি সময়", "Target: under 10 min": "লক্ষ্য: ১০ মিনিটের কম",
    "Approved today": "আজ অনুমোদিত", "Rejected today": "আজ বাতিল", "Search order ID or customer": "অর্ডার নম্বর বা গ্রাহক খুঁজুন",
    "All stores": "সব স্টোর", "All schedules": "সব শিডিউল", "OTC only": "শুধু OTC", "All caught up": "সব কাজ শেষ",
    "New orders will appear here automatically.": "নতুন অর্ডার এখানে নিজে থেকেই আসবে।",
    "Order": "অর্ডার", "Customer": "গ্রাহক", "Items": "ওষুধ", "Schedule": "শিডিউল", "Waiting": "অপেক্ষা", "AI read": "AI পাঠ",
    "for {name}": "{name}-এর জন্য", "Review →": "দেখুন →",
    "{n} min": "{n} মিনিট", "{h} h {m} min": "{h} ঘণ্টা {m} মিনিট", "{h} h": "{h} ঘণ্টা", "{d} d": "{d} দিন",
    // Dashboard
    "Orders, verification time and rejections across Kolkata and Howrah.": "কলকাতা ও হাওড়া জুড়ে অর্ডার, যাচাইয়ের সময় ও বাতিল।",
    "Today": "আজ", "{n} days": "{n} দিন",
    "{n} order(s) left a store with an unapproved Schedule H item": "{n}টি অর্ডার অননুমোদিত শিডিউল H ওষুধ নিয়ে স্টোর থেকে বেরিয়েছে",
    "No Schedule H or H1 item dispatched without approval": "অনুমোদন ছাড়া কোনো শিডিউল H বা H1 ওষুধ পাঠানো হয়নি",
    "Check {list} now.": "এখনই {list} দেখুন।",
    "Every prescription medicine that left a store was approved by a registered pharmacist.": "স্টোর থেকে যাওয়া প্রতিটি প্রেসক্রিপশনের ওষুধ একজন রেজিস্টার্ড ফার্মাসিস্ট অনুমোদন করেছেন।",
    "Orders": "অর্ডার", "{d} delivered · {w} waiting": "{d}টি ডেলিভারি · {w}টি অপেক্ষায়", "Median verification": "মাঝারি যাচাই সময়",
    "Target under 10 min": "লক্ষ্য ১০ মিনিটের কম", "{p}% on time": "{p}% সময়মতো", "Rejected": "বাতিল", "{p}% of orders": "অর্ডারের {p}%",
    "Re-upload asked": "আবার আপলোড চাওয়া হয়েছে", "Unreadable or unclear": "পড়া যায়নি বা অস্পষ্ট",
    "Orders by store": "স্টোর অনুযায়ী অর্ডার", "Only active stores": "শুধু সক্রিয় স্টোর", "Show all 46": "৪৬টিই দেখান",
    "No orders in this period.": "এই সময়ে কোনো অর্ডার নেই।", "Delivered": "ডেলিভারি হয়েছে", "Median check": "মাঝারি যাচাই",
    "Why items get rejected": "ওষুধ কেন বাতিল হয়", "No rejections in this period.": "এই সময়ে কিছু বাতিল হয়নি।",
    "Refill reminders": "রিফিল রিমাইন্ডার", "Runs every morning. Texts customers whose medicine runs out within 5 days.": "প্রতিদিন সকালে চলে। যাঁদের ওষুধ ৫ দিনের মধ্যে ফুরোবে, তাঁদের মেসেজ পাঠায়।",
    "Checked {c} refills, sent {r} reminders.": "{c}টি রিফিল দেখা হয়েছে, {r}টি রিমাইন্ডার পাঠানো হয়েছে।", "Run now": "এখনই চালান",
    "Schedule H1 register": "শিডিউল H1 রেজিস্টার", "Every H1 sale with patient, prescriber and dispensing pharmacist. Last 90 days.": "রোগী, প্রেসক্রাইবার ও ফার্মাসিস্ট সহ প্রতিটি H1 বিক্রি। গত ৯০ দিন।",
    "Download CSV": "CSV ডাউনলোড",
    // Store
    "To pick and pack": "বেছে প্যাক করতে হবে", "Ready for handover": "হস্তান্তরের জন্য তৈরি", "Out for delivery": "ডেলিভারির পথে",
    "Pick the approved items, pack with the store invoice number, then hand over to the rider.": "অনুমোদিত ওষুধ বেছে নিন, স্টোরের ইনভয়েস নম্বর দিয়ে প্যাক করুন, তারপর রাইডারকে দিন।",
    "Your store": "আপনার স্টোর", "All 46 stores": "সব ৪৬টি স্টোর", "Nothing here right now.": "এখন এখানে কিছু নেই।",
    "Paid": "পেমেন্ট হয়েছে", "COD ₹{n}": "ক্যাশ অন ডেলিভারি ₹{n}", "Awaiting payment": "পেমেন্টের অপেক্ষা",
    "Store invoice no.": "স্টোর ইনভয়েস নম্বর", "Mark packed": "প্যাক হয়েছে", "Waiting for the customer to choose UPI or cash on delivery.": "গ্রাহক UPI বা ক্যাশ অন ডেলিভারি বেছে নেওয়ার অপেক্ষা।",
    "Tick every item as you pick it.": "প্রতিটি ওষুধ নেওয়ার সময় টিক দিন।", "Invoice {no}": "ইনভয়েস {no}", "Rider": "রাইডার", "Rider's name": "রাইডারের নাম",
    "Hand over to rider": "রাইডারকে দিন", "With {name}": "{name}-এর কাছে", "Mark delivered": "ডেলিভারি হয়েছে", "Mark delivered (cash collected)": "ডেলিভারি হয়েছে (টাকা নেওয়া হয়েছে)",
    // Order review
    "Couldn't load this order.": "এই অর্ডার লোড করা যায়নি।", "ordered by {name}": "অর্ডার করেছেন {name}", "Store not assigned": "স্টোর ঠিক হয়নি",
    "Self": "নিজে", "Mother": "মা", "Father": "বাবা", "Spouse": "স্বামী/স্ত্রী", "Child": "সন্তান", "Other": "অন্যান্য",
    "Access is logged": "দেখা রেকর্ড হয়", "No prescription uploaded. Only OTC items can be approved.": "কোনো প্রেসক্রিপশন আপলোড হয়নি। শুধু OTC ওষুধ অনুমোদন করা যাবে।",
    "Prescription details": "প্রেসক্রিপশনের তথ্য", "Check these against the image. Required for Schedule H and H1.": "ছবির সঙ্গে মিলিয়ে নিন। শিডিউল H ও H1-এর জন্য দরকার।",
    "Doctor's name": "ডাক্তারের নাম", "Registration no.": "রেজিস্ট্রেশন নম্বর", "Date on prescription": "প্রেসক্রিপশনের তারিখ", "Patient address (H1 register)": "রোগীর ঠিকানা (H1 রেজিস্টার)",
    "AI draft, check each one": "AI খসড়া, প্রতিটি যাচাই করুন", "A approve · R reject · ↑↓ move": "A অনুমোদন · R বাতিল · ↑↓ সরান",
    "(customer asked for {n})": "(গ্রাহক চেয়েছিলেন {n})", "Low confidence. Read the image carefully.": "কম নিশ্চয়তা। ছবিটি মন দিয়ে পড়ুন।", "Rejected: {reason}": "বাতিল: {reason}",
    "Generic offered. Waiting for the customer to accept.": "জেনেরিক প্রস্তাব করা হয়েছে। গ্রাহকের সম্মতির অপেক্ষা।", "Customer accepted the generic": "গ্রাহক জেনেরিক নিয়েছেন", "Customer kept the original brand": "গ্রাহক আগের ব্র্যান্ডই রেখেছেন",
    "Offer generic:": "জেনেরিক প্রস্তাব:", "(saves ₹{n})": "(₹{n} বাঁচবে)", "Approve": "অনুমোদন", "Edit": "বদলান", "Reject": "বাতিল", "Confirm reject": "বাতিল নিশ্চিত করুন",
    "Reason for the customer": "গ্রাহকের জন্য কারণ", "Tablets per day": "দিনে কটা ট্যাবলেট", "Used for the refill reminder": "রিফিল রিমাইন্ডারের জন্য",
    "What should the customer fix?": "গ্রাহককে কী ঠিক করতে হবে?", "Why is this order rejected?": "অর্ডারটি কেন বাতিল?", "The photo is blurred. Please upload a clearer photo of the whole prescription.": "ছবিটি ঝাপসা। পুরো প্রেসক্রিপশনের একটি পরিষ্কার ছবি আপলোড করুন।",
    "Cancel": "বাতিল করুন", "Ask for re-upload": "আবার আপলোড চান", "Reject order": "অর্ডার বাতিল", "Approve order ({n} item)": "অর্ডার অনুমোদন ({n}টি ওষুধ)", "Approve order ({n} items)": "অর্ডার অনুমোদন ({n}টি ওষুধ)",
    "Decide every item to approve the order.": "অর্ডার অনুমোদনের আগে প্রতিটি ওষুধে সিদ্ধান্ত নিন।", "Fill in the doctor's details above.": "উপরে ডাক্তারের তথ্য দিন।", "Add the patient's address for the H1 register.": "H1 রেজিস্টারের জন্য রোগীর ঠিকানা দিন।",
    "Request re-upload": "আবার আপলোড চান", "Reason given: {reason}": "দেওয়া কারণ: {reason}", "History": "ইতিহাস", "by {name}": "{name}", "Save and approve": "সেভ করে অনুমোদন",
    // Reject reasons
    "Not on the prescription": "প্রেসক্রিপশনে নেই", "Unreadable": "পড়া যাচ্ছে না", "Prescription expired": "প্রেসক্রিপশনের মেয়াদ শেষ", "Wrong strength": "ভুল মাত্রা", "Quantity too high": "পরিমাণ বেশি",
    // Statuses and history actions
    "awaiting pharmacist": "ফার্মাসিস্টের অপেক্ষায়", "approved": "অনুমোদিত", "rejected": "বাতিল", "reupload requested": "আবার আপলোড চাওয়া হয়েছে", "partial": "আংশিক", "packed": "প্যাক হয়েছে", "out for delivery": "ডেলিভারির পথে", "delivered": "ডেলিভারি হয়েছে",
    "item approved": "ওষুধ অনুমোদিত", "item edited": "ওষুধ বদলানো হয়েছে", "item rejected": "ওষুধ বাতিল", "item pending": "ওষুধ আবার অপেক্ষায়", "generic offered": "জেনেরিক প্রস্তাব", "generic accepted": "জেনেরিক গ্রহণ", "generic declined": "জেনেরিক প্রত্যাখ্যান", "reuploaded": "আবার আপলোড হয়েছে",
  },
  hi: {
    // Header
    "Queue": "कतार", "Store orders": "स्टोर के ऑर्डर", "View only. Store staff pick, pack and hand over orders.": "सिर्फ़ देखने के लिए। स्टोर स्टाफ़ ऑर्डर चुनते, पैक करते और राइडर को देते हैं।", "Dashboard": "डैशबोर्ड", "Pharmacist": "फार्मासिस्ट", "Store": "स्टोर", "Operations": "ऑपरेशंस", "Staff": "स्टाफ", "Log out": "लॉग आउट", "Schedule {code}": "शेड्यूल {code}",
    // Queue
    "Couldn't load the queue. Try logging in again.": "कतार लोड नहीं हो सकी। फिर से लॉग इन करके देखें।",
    "Verification queue": "जाँच की कतार",
    "Oldest first. Every Schedule H and H1 item needs your decision.": "सबसे पुराने पहले। हर शेड्यूल H और H1 दवा पर आपका फ़ैसला चाहिए।",
    "Refresh": "रिफ़्रेश", "Waiting now": "अभी इंतज़ार में", "Median time today": "आज का मीडियन समय", "Target: under 10 min": "लक्ष्य: 10 मिनट से कम",
    "Approved today": "आज मंज़ूर", "Rejected today": "आज रद्द", "Search order ID or customer": "ऑर्डर नंबर या ग्राहक खोजें",
    "All stores": "सभी स्टोर", "All schedules": "सभी शेड्यूल", "OTC only": "सिर्फ़ OTC", "All caught up": "सब काम पूरा",
    "New orders will appear here automatically.": "नए ऑर्डर यहाँ अपने-आप दिखेंगे।",
    "Order": "ऑर्डर", "Customer": "ग्राहक", "Items": "दवाएँ", "Schedule": "शेड्यूल", "Waiting": "इंतज़ार", "AI read": "AI पढ़त",
    "for {name}": "{name} के लिए", "Review →": "देखें →",
    "{n} min": "{n} मिनट", "{h} h {m} min": "{h} घंटे {m} मिनट", "{h} h": "{h} घंटे", "{d} d": "{d} दिन",
    // Dashboard
    "Orders, verification time and rejections across Kolkata and Howrah.": "कोलकाता और हावड़ा में ऑर्डर, जाँच का समय और रद्द।",
    "Today": "आज", "{n} days": "{n} दिन",
    "{n} order(s) left a store with an unapproved Schedule H item": "{n} ऑर्डर बिना मंज़ूरी वाली शेड्यूल H दवा के साथ स्टोर से निकले",
    "No Schedule H or H1 item dispatched without approval": "बिना मंज़ूरी कोई शेड्यूल H या H1 दवा नहीं भेजी गई",
    "Check {list} now.": "अभी {list} देखें।",
    "Every prescription medicine that left a store was approved by a registered pharmacist.": "स्टोर से निकली हर प्रिस्क्रिप्शन दवा को एक रजिस्टर्ड फार्मासिस्ट ने मंज़ूर किया।",
    "Orders": "ऑर्डर", "{d} delivered · {w} waiting": "{d} डिलीवर · {w} इंतज़ार में", "Median verification": "मीडियन जाँच समय",
    "Target under 10 min": "लक्ष्य 10 मिनट से कम", "{p}% on time": "{p}% समय पर", "Rejected": "रद्द", "{p}% of orders": "ऑर्डर का {p}%",
    "Re-upload asked": "दोबारा अपलोड माँगा", "Unreadable or unclear": "पढ़ा नहीं गया या साफ़ नहीं",
    "Orders by store": "स्टोर के हिसाब से ऑर्डर", "Only active stores": "सिर्फ़ सक्रिय स्टोर", "Show all 46": "सभी 46 दिखाएँ",
    "No orders in this period.": "इस अवधि में कोई ऑर्डर नहीं।", "Delivered": "डिलीवर", "Median check": "मीडियन जाँच",
    "Why items get rejected": "दवाएँ क्यों रद्द होती हैं", "No rejections in this period.": "इस अवधि में कुछ रद्द नहीं हुआ।",
    "Refill reminders": "रिफ़िल रिमाइंडर", "Runs every morning. Texts customers whose medicine runs out within 5 days.": "हर सुबह चलता है। जिनकी दवा 5 दिन में ख़त्म होगी, उन्हें मैसेज भेजता है।",
    "Checked {c} refills, sent {r} reminders.": "{c} रिफ़िल देखे, {r} रिमाइंडर भेजे।", "Run now": "अभी चलाएँ",
    "Schedule H1 register": "शेड्यूल H1 रजिस्टर", "Every H1 sale with patient, prescriber and dispensing pharmacist. Last 90 days.": "मरीज़, डॉक्टर और फार्मासिस्ट के साथ हर H1 बिक्री। पिछले 90 दिन।",
    "Download CSV": "CSV डाउनलोड",
    // Store
    "To pick and pack": "चुनकर पैक करना है", "Ready for handover": "सौंपने के लिए तैयार", "Out for delivery": "डिलीवरी के रास्ते में",
    "Pick the approved items, pack with the store invoice number, then hand over to the rider.": "मंज़ूर दवाएँ चुनें, स्टोर इनवॉइस नंबर के साथ पैक करें, फिर राइडर को दें।",
    "Your store": "आपका स्टोर", "All 46 stores": "सभी 46 स्टोर", "Nothing here right now.": "अभी यहाँ कुछ नहीं।",
    "Paid": "भुगतान हो गया", "COD ₹{n}": "कैश ऑन डिलीवरी ₹{n}", "Awaiting payment": "भुगतान का इंतज़ार",
    "Store invoice no.": "स्टोर इनवॉइस नंबर", "Mark packed": "पैक हो गया", "Waiting for the customer to choose UPI or cash on delivery.": "ग्राहक के UPI या कैश ऑन डिलीवरी चुनने का इंतज़ार।",
    "Tick every item as you pick it.": "हर दवा उठाते समय टिक करें।", "Invoice {no}": "इनवॉइस {no}", "Rider": "राइडर", "Rider's name": "राइडर का नाम",
    "Hand over to rider": "राइडर को दें", "With {name}": "{name} के पास", "Mark delivered": "डिलीवर हो गया", "Mark delivered (cash collected)": "डिलीवर हो गया (पैसे मिल गए)",
    // Order review
    "Couldn't load this order.": "यह ऑर्डर लोड नहीं हो सका।", "ordered by {name}": "{name} ने ऑर्डर किया", "Store not assigned": "स्टोर तय नहीं",
    "Self": "ख़ुद", "Mother": "माँ", "Father": "पिता", "Spouse": "पति/पत्नी", "Child": "बच्चा", "Other": "अन्य",
    "Access is logged": "देखना रिकॉर्ड होता है", "No prescription uploaded. Only OTC items can be approved.": "कोई प्रिस्क्रिप्शन अपलोड नहीं हुआ। सिर्फ़ OTC दवाएँ मंज़ूर हो सकती हैं।",
    "Prescription details": "प्रिस्क्रिप्शन की जानकारी", "Check these against the image. Required for Schedule H and H1.": "इन्हें तस्वीर से मिलाएँ। शेड्यूल H और H1 के लिए ज़रूरी।",
    "Doctor's name": "डॉक्टर का नाम", "Registration no.": "रजिस्ट्रेशन नंबर", "Date on prescription": "प्रिस्क्रिप्शन की तारीख़", "Patient address (H1 register)": "मरीज़ का पता (H1 रजिस्टर)",
    "AI draft, check each one": "AI ड्राफ़्ट, हर एक जाँचें", "A approve · R reject · ↑↓ move": "A मंज़ूर · R रद्द · ↑↓ बदलें",
    "(customer asked for {n})": "(ग्राहक ने {n} माँगे)", "Low confidence. Read the image carefully.": "कम भरोसा। तस्वीर ध्यान से पढ़ें।", "Rejected: {reason}": "रद्द: {reason}",
    "Generic offered. Waiting for the customer to accept.": "जेनेरिक सुझाई गई। ग्राहक की सहमति का इंतज़ार।", "Customer accepted the generic": "ग्राहक ने जेनेरिक ली", "Customer kept the original brand": "ग्राहक ने वही ब्रांड रखा",
    "Offer generic:": "जेनेरिक सुझाएँ:", "(saves ₹{n})": "(₹{n} बचेंगे)", "Approve": "मंज़ूर", "Edit": "बदलें", "Reject": "रद्द", "Confirm reject": "रद्द पक्का करें",
    "Reason for the customer": "ग्राहक के लिए कारण", "Tablets per day": "रोज़ कितनी गोलियाँ", "Used for the refill reminder": "रिफ़िल रिमाइंडर के लिए",
    "What should the customer fix?": "ग्राहक क्या ठीक करे?", "Why is this order rejected?": "यह ऑर्डर क्यों रद्द है?", "The photo is blurred. Please upload a clearer photo of the whole prescription.": "तस्वीर धुंधली है। पूरे प्रिस्क्रिप्शन की साफ़ तस्वीर अपलोड करें।",
    "Cancel": "रहने दें", "Ask for re-upload": "दोबारा अपलोड माँगें", "Reject order": "ऑर्डर रद्द करें", "Approve order ({n} item)": "ऑर्डर मंज़ूर करें ({n} दवा)", "Approve order ({n} items)": "ऑर्डर मंज़ूर करें ({n} दवाएँ)",
    "Decide every item to approve the order.": "ऑर्डर मंज़ूर करने से पहले हर दवा पर फ़ैसला करें।", "Fill in the doctor's details above.": "ऊपर डॉक्टर की जानकारी भरें।", "Add the patient's address for the H1 register.": "H1 रजिस्टर के लिए मरीज़ का पता डालें।",
    "Request re-upload": "दोबारा अपलोड माँगें", "Reason given: {reason}": "बताया गया कारण: {reason}", "History": "इतिहास", "by {name}": "{name} द्वारा", "Save and approve": "सेव करके मंज़ूर करें",
    // Reject reasons
    "Not on the prescription": "प्रिस्क्रिप्शन में नहीं", "Unreadable": "पढ़ा नहीं जा रहा", "Prescription expired": "प्रिस्क्रिप्शन की मियाद ख़त्म", "Wrong strength": "गलत ताक़त", "Quantity too high": "मात्रा ज़्यादा",
    // Statuses and history actions
    "awaiting pharmacist": "फार्मासिस्ट का इंतज़ार", "approved": "मंज़ूर", "rejected": "रद्द", "reupload requested": "दोबारा अपलोड माँगा", "partial": "आंशिक", "packed": "पैक हुआ", "out for delivery": "डिलीवरी के रास्ते में", "delivered": "डिलीवर हुआ",
    "item approved": "दवा मंज़ूर", "item edited": "दवा बदली गई", "item rejected": "दवा रद्द", "item pending": "दवा फिर इंतज़ार में", "generic offered": "जेनेरिक सुझाई गई", "generic accepted": "जेनेरिक ली गई", "generic declined": "जेनेरिक मना की गई", "reuploaded": "दोबारा अपलोड हुआ",
  },
};

/** Looks up `text` for `lang` and fills `{placeholders}`. Falls back to English. */
export function translateStaff(lang: string, text: string, vars?: Record<string, string | number>) {
  const table = lang === "bn" || lang === "hi" ? staffText[lang] : undefined;
  const template = table?.[text] ?? text;
  return vars ? template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match)) : template;
}
