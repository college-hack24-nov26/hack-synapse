/** Shared UI phrases. Model IDs, stored scores, sensor packets and input values stay unchanged. */
(() => {
    const rows = `
Prediction|पूर्वानुमान|अंदाज
YOUR PRACTICE OUTLOOK|आपके अभ्यास की दिशा|तुमच्या सरावाची दिशा
Explore progress toward a practice goal.|अभ्यास लक्ष्य की ओर प्रगति देखें।|सरावाच्या ध्येयाकडील प्रगती पाहा.
About this model|इस मॉडल के बारे में|या मॉडेलविषयी
Practice goal|अभ्यास लक्ष्य|सरावाचे ध्येय
Data to explore|दिखाने के लिए डेटा|पाहण्यासाठी डेटा
My glove sessions|मेरे ग्लव सत्र|माझी ग्लोव्ह सत्रे
Synthetic example|कृत्रिम उदाहरण|कृत्रिम उदाहरण
Practice trend|अभ्यास का रुझान|सरावाचा कल
Latest daily average|नवीनतम दैनिक औसत|नवीनतम दैनिक सरासरी
Observed weekly trend|देखा गया साप्ताहिक रुझान|नोंदवलेला साप्ताहिक कल
What the estimate uses|अनुमान के आधार|अंदाजाचे आधार
Practice-goal estimates are experimental. They do not predict medical recovery or replace a clinician’s assessment.|अभ्यास लक्ष्य के अनुमान प्रायोगिक हैं। वे चिकित्सा सुधार का पूर्वानुमान नहीं हैं और चिकित्सक के मूल्यांकन का विकल्प नहीं हैं।|सरावाच्या ध्येयाचे अंदाज प्रायोगिक आहेत. ते वैद्यकीय पुनर्प्राप्तीचे भाकीत नाहीत आणि डॉक्टरांच्या मूल्यमापनाची जागा घेत नाहीत.

Rest naturally|स्वाभाविक रूप से आराम दें|नैसर्गिकरीत्या सैल ठेवा
STEP 1 OF 3|चरण 1 / 3|टप्पा 1 / 3
STEP 2 OF 3|चरण 2 / 3|टप्पा 2 / 3
STEP 3 OF 3|चरण 3 / 3|टप्पा 3 / 3
Let your hand rest naturally|अपने हाथ को स्वाभाविक रूप से आराम दें|हात नैसर्गिकरीत्या सैल ठेवा
Relax your fingers in their natural position. Support your wrist and hold still. You do not need to straighten or close your hand.|उंगलियों को उनकी स्वाभाविक स्थिति में ढीला छोड़ें। कलाई को सहारा दें और स्थिर रहें। हाथ सीधा या बंद करना जरूरी नहीं है।|बोटे त्यांच्या नैसर्गिक स्थितीत सैल सोडा. मनगटाला आधार द्या आणि स्थिर ठेवा. हात सरळ किंवा बंद करण्याची गरज नाही.
Capture resting position|आराम की स्थिति की रीडिंग लें|विश्रांतीच्या स्थितीचे मोजमाप घ्या
Open and closed readings captured.|खुले और बंद हाथ की रीडिंग ले ली गई है।|उघड्या आणि बंद हाताचे मोजमाप घेतले आहे.
Keep your hand relaxed and still, then capture your resting position again.|हाथ आराम से स्थिर रखें और आराम की स्थिति की रीडिंग फिर लें।|हात सैल आणि स्थिर ठेवा, नंतर विश्रांतीच्या स्थितीचे मोजमाप पुन्हा घ्या.
YOUR RECORDS|आपके रिकॉर्ड|तुमच्या नोंदी
Review saved sessions and download your reports.|सहेजे गए सत्र देखें और रिपोर्ट डाउनलोड करें।|जतन केलेली सत्रे पहा आणि अहवाल डाउनलोड करा.
Search exercises|व्यायाम खोजें|व्यायाम शोधा
Exercise & session|व्यायाम और सत्र|व्यायाम आणि सत्र
Date & time|दिनांक और समय|तारीख आणि वेळ
Repetitions|दोहराव|पुनरावृत्ती
Range of motion|गति का विस्तार|हालचालीची व्याप्ती
Reports|रिपोर्ट|अहवाल
Previous|पिछला|मागील
Next|अगला|पुढील
Page|पृष्ठ|पृष्ठ
Showing|दिखा रहे हैं|दाखवत आहोत
of|में से|पैकी
saved session|सहेजा गया सत्र|जतन केलेले सत्र
saved sessions|सहेजे गए सत्र|जतन केलेली सत्रे
active attempts|सक्रिय प्रयास|सक्रिय प्रयत्न
Avg rep|औसत दोहराव|सरासरी पुनरावृत्ती
Download PDF|PDF डाउनलोड करें|PDF डाउनलोड करा
Download CSV|CSV डाउनलोड करें|CSV डाउनलोड करा
Close session history|सत्र इतिहास बंद करें|सत्रांचा इतिहास बंद करा
Unable to load history. Please try again.|इतिहास लोड नहीं हुआ। फिर प्रयास करें।|इतिहास लोड झाला नाही. पुन्हा प्रयत्न करा.
No matching sessions.|कोई मेल खाता सत्र नहीं है।|जुळणारे सत्र नाही.
No sessions recorded yet.|अभी कोई सत्र दर्ज नहीं है।|अजून सत्र नोंदवलेले नाही.
MAKE IT YOURS|अपने हाथ के अनुसार बनाएं|तुमच्या हातानुसार करा
Set your natural range of movement.|अपने हाथ की सहज गति के अनुसार सेट करें।|तुमच्या हाताच्या सहज हालचालीनुसार सेट करा.
Hold comfortably|आराम से स्थिर रखें|आरामात स्थिर ठेवा
We’ll take a short, steady reading.|हम एक छोटी, स्थिर रीडिंग लेंगे।|आम्ही एक लहान, स्थिर मोजमाप घेऊ.
All five fingers, personalised together|पाँचों उंगलियाँ, एक साथ अनुकूलित|पाचही बोटे, एकत्र वैयक्तिकीकृत
Saved for your next session.|आपके अगले सत्र के लिए सुरक्षित।|तुमच्या पुढील सत्रासाठी जतन केलेले.
sec|सेकंड|सेकंद
Glove personalisation|ग्लोव का व्यक्तिगत अनुकूलन|ग्लोव्ह वैयक्तिकीकरण
A reading is already being captured. Please wait.|रीडिंग पहले से ली जा रही है। कृपया प्रतीक्षा करें।|मोजमाप आधीच सुरू आहे. कृपया थांबा.
Capture the open hand first, then the closed hand.|पहले खुले हाथ की और फिर बंद हाथ की रीडिंग लें।|आधी उघड्या आणि नंतर बंद हाताचे मोजमाप घ्या.
Finish your guided exercise session before saving personalisation.|अनुकूलन सहेजने से पहले व्यायाम सत्र समाप्त करें।|वैयक्तिकीकरण जतन करण्यापूर्वी व्यायाम सत्र पूर्ण करा.
GLOVE PERSONALISATION|ग्लोव का व्यक्तिगत अनुकूलन|ग्लोव्ह वैयक्तिकीकरण
A fit for your hand|आपके हाथ के अनुसार|तुमच्या हातासाठी योग्य
Two simple readings. A glove that follows you.|दो सरल रीडिंग। आपके हाथ के अनुसार ग्लोव।|दोन सोपी मोजमापे. तुमच्या हातानुसार ग्लोव्ह.
Personalisation steps|व्यक्तिगत अनुकूलन के चरण|वैयक्तिकीकरणाचे टप्पे
Open hand|हाथ खोलें|हात उघडा
Close hand|हाथ बंद करें|हात बंद करा
Close glove personalisation|ग्लोव अनुकूलन बंद करें|ग्लोव्ह वैयक्तिकीकरण बंद करा
STEP 1 OF 2|चरण 1 / 2|टप्पा 1 / 2
STEP 2 OF 2|चरण 2 / 2|टप्पा 2 / 2
PERSONALISATION COMPLETE|व्यक्तिगत अनुकूलन पूरा हुआ|वैयक्तिकीकरण पूर्ण झाले
Keep your hand open|अपना हाथ खुला रखें|हात उघडा ठेवा
Straighten all five fingers comfortably. Rest your wrist and keep your hand still.|पाँचों उंगलियाँ आराम से सीधी करें। कलाई को सहारा दें और हाथ स्थिर रखें।|पाचही बोटे आरामात सरळ करा. मनगटाला आधार द्या आणि हात स्थिर ठेवा.
Gently close your hand|धीरे से हाथ बंद करें|हात हळूवार बंद करा
Make a comfortable fist with all five fingers. Keep your wrist relaxed and hold still.|पाँचों उंगलियों से आराम से मुट्ठी बनाएं। कलाई ढीली और हाथ स्थिर रखें।|पाचही बोटांनी आरामात मूठ करा. मनगट सैल आणि हात स्थिर ठेवा.
Open-hand readings captured.|खुले हाथ की रीडिंग ले ली गई है।|उघड्या हाताचे मोजमाप घेतले आहे.
Your glove is personalised|आपका ग्लोव आपके हाथ के अनुसार तैयार है|ग्लोव्ह तुमच्या हातानुसार तयार आहे
Your dashboard is now adjusted to your hand. You’re ready to begin.|डैशबोर्ड अब आपके हाथ के अनुसार तैयार है। आप शुरू कर सकते हैं।|डॅशबोर्ड आता तुमच्या हातानुसार तयार आहे. तुम्ही सुरुवात करू शकता.
Open and relax|हाथ खोलें और आराम दें|हात उघडा आणि सैल ठेवा
Close gently|धीरे से बंद करें|हळूवार बंद करा
Ready for your hand|आपके हाथ के लिए तैयार|तुमच्या हातासाठी तयार
Capture open hand|खुले हाथ की रीडिंग लें|उघड्या हाताचे मोजमाप घ्या
Capture closed hand|बंद हाथ की रीडिंग लें|बंद हाताचे मोजमाप घ्या
Taking readings…|रीडिंग ली जा रही है…|मोजमाप घेत आहोत…
Connecting to your glove…|ग्लोव से जुड़ रहे हैं…|ग्लोव्हशी जोडत आहोत…
Connecting…|जुड़ रहे हैं…|जोडत आहोत…
Reconnect glove|ग्लोव फिर जोड़ें|ग्लोव्ह पुन्हा जोडा
Back to dashboard|डैशबोर्ड पर वापस जाएं|डॅशबोर्डवर परत जा
Start again|फिर शुरू करें|पुन्हा सुरू करा
Keep still while we take your readings.|रीडिंग लेते समय हाथ स्थिर रखें।|मोजमाप घेताना हात स्थिर ठेवा.
All five fingers · Saved to your profile|पाँचों उंगलियाँ · आपकी प्रोफ़ाइल में सुरक्षित|पाचही बोटे · तुमच्या प्रोफाइलमध्ये जतन
Reading capture progress|रीडिंग लेने की प्रगति|मोजमापाची प्रगती
Right hand opening and closing demonstration|दायाँ हाथ खोलने और बंद करने का प्रदर्शन|उजवा हात उघडण्याचे आणि बंद करण्याचे प्रात्यक्षिक
Connect your glove to personalise it. Simulated readings cannot be used.|अनुकूलन के लिए ग्लोव जोड़ें। सिम्युलेटेड रीडिंग उपयोग नहीं की जा सकती।|वैयक्तिकीकरणासाठी ग्लोव्ह जोडा. सिम्युलेटेड मोजमापे वापरता येत नाहीत.
Glove readings paused. Check the connection and try again.|ग्लोव की रीडिंग रुक गई है। कनेक्शन जांचें और फिर प्रयास करें।|ग्लोव्हचे मोजमाप थांबले. जोडणी तपासा आणि पुन्हा प्रयत्न करा.
All five finger sensors need to be connected. Check your glove and try again.|पाँचों उंगलियों के सेंसर जुड़े होने चाहिए। ग्लोव जांचें और फिर प्रयास करें।|पाचही बोटांचे सेन्सर जोडलेले असावेत. ग्लोव्ह तपासा आणि पुन्हा प्रयत्न करा.
Finish your guided exercise session before personalising the glove.|ग्लोव अनुकूलन से पहले व्यायाम सत्र समाप्त करें।|ग्लोव्ह वैयक्तिकीकरणापूर्वी व्यायाम सत्र पूर्ण करा.
Not enough glove readings. Keep your hand still and try again.|पर्याप्त रीडिंग नहीं मिली। हाथ स्थिर रखें और फिर प्रयास करें।|पुरेशी मोजमापे मिळाली नाहीत. हात स्थिर ठेवा आणि पुन्हा प्रयत्न करा.
Some finger readings are too similar or unsteady. Adjust the glove and capture your closed hand again.|कुछ उंगलियों की रीडिंग बहुत समान या अस्थिर है। ग्लोव ठीक करें और बंद हाथ की रीडिंग फिर लें।|काही बोटांची मोजमापे खूप समान किंवा अस्थिर आहेत. ग्लोव्ह नीट करा आणि बंद हाताचे मोजमाप पुन्हा घ्या.
This setup has ended. Start glove personalisation again.|यह सेटअप समाप्त हो गया है। ग्लोव अनुकूलन फिर शुरू करें।|हा सेटअप संपला आहे. ग्लोव्ह वैयक्तिकीकरण पुन्हा सुरू करा.
Calibration changed during setup. Start personalisation again.|सेटअप के दौरान कैलिब्रेशन बदल गया। फिर शुरू करें।|सेटअपदरम्यान कॅलिब्रेशन बदलले. वैयक्तिकीकरण पुन्हा सुरू करा.
Unable to take readings. Check the connection and try again.|रीडिंग नहीं ली जा सकी। कनेक्शन जांचें और फिर प्रयास करें।|मोजमाप घेता आले नाही. जोडणी तपासा आणि पुन्हा प्रयत्न करा.
Bend one finger to jump|कूदने के लिए एक उंगली मोड़ें|उडीसाठी एक बोट वाकवा
Tap a number on the right hand. Bend only that finger toward your palm to make your kangaroo jump.|दाएँ हाथ का क्रमांक चुनें। कंगारू को कुदाने के लिए केवल वही उंगली हथेली की ओर मोड़ें।|उजव्या हातावरील क्रमांक निवडा. कंगारूला उडी मारण्यासाठी फक्त ते बोट तळव्याकडे वाकवा.
Straighten the finger to get ready for the next jump. The other fingers do not control the game.|अगली छलाँग के लिए उंगली सीधी करें। बाकी उंगलियाँ खेल को नियंत्रित नहीं करतीं।|पुढील उडीसाठी बोट सरळ करा. इतर बोटे खेळ नियंत्रित करत नाहीत.
Choose a finger, then bend it|उंगली चुनें, फिर मोड़ें|बोट निवडा, नंतर वाकवा
Straighten your chosen finger before the next jump.|अगली छलाँग से पहले चुनी हुई उंगली सीधी करें।|पुढील उडीपूर्वी निवडलेले बोट सरळ करा.
Finger bend needed|आवश्यक उंगली मोड़|आवश्यक बोट वाकवणे
Finger bent · straighten it before the next jump|उंगली मुड़ी है · अगली छलाँग से पहले सीधी करें|बोट वाकलेले · पुढील उडीपूर्वी सरळ करा
Finger straight · ready to bend|उंगली सीधी है · मोड़ने के लिए तैयार|बोट सरळ · वाकवण्यासाठी तयार
Keep bending gently|धीरे-धीरे मोड़ते रहें|हळूहळू वाकवत रहा
Kangaroo Hop: bend your chosen finger toward your palm to jump|कंगारू हॉप: कूदने के लिए चुनी हुई उंगली हथेली की ओर मोड़ें|कांगारू हॉप: उडीसाठी निवडलेले बोट तळव्याकडे वाकवा

USB glove|USB ग्लोव|USB ग्लोव्ह
USB glove sessions|USB ग्लोव के सत्र|USB ग्लोव्हची सत्रे
Not connected|कनेक्ट नहीं है|जोडलेले नाही
Based on flex and pressure readings. EMG is not connected.|फ्लेक्स और दबाव की रीडिंग पर आधारित। EMG कनेक्ट नहीं है।|फ्लेक्स आणि दाबाच्या मोजमापांवर आधारित. EMG जोडलेले नाही.

YOUR PROGRESS|आपकी प्रगति|तुमची प्रगती
Daily target achievement|दैनिक लक्ष्य प्राप्ति|दैनिक लक्ष्य साध्य
Hover or tap the chart to see details.|विवरण के लिए ग्राफ पर होवर या टैप करें।|तपशीलासाठी आलेखावर होव्हर किंवा टॅप करा.

Time range|समय सीमा|कालावधी
Last 14 days|पिछले 14 दिन|मागील 14 दिवस
Last 7 days|पिछले 7 दिन|मागील 7 दिवस
Latest average|नवीनतम औसत|नवीनतम सरासरी
Best day|सर्वश्रेष्ठ दिन|सर्वोत्तम दिवस
Practice days|अभ्यास के दिन|सरावाचे दिवस
Hover, tap or use arrow keys to explore each day.|हर दिन देखने के लिए होवर करें, टैप करें या तीर कुंजियाँ दबाएँ।|प्रत्येक दिवस पाहण्यासाठी होव्हर करा, टॅप करा किंवा बाण की वापरा.
Daily averages across completed reach-and-return attempts.|पूरे हुए लक्ष्य तक पहुँचने और लौटने के प्रयासों का दैनिक औसत।|पूर्ण झालेल्या लक्ष्य गाठून परत येण्याच्या प्रयत्नांची दैनिक सरासरी.

Choose one of six exercises|छह व्यायामों में से एक चुनें|सहा व्यायामांपैकी एक निवडा
Grip & Release Pressure|पकड़ का दबाव और छोड़ना|पकडीचा दाब आणि सोडणे
Gently squeeze a soft object, then release your grip.|नरम वस्तु को धीरे दबाएँ, फिर पकड़ छोड़ें।|मऊ वस्तू हलके दाबा, नंतर पकड सोडा.
FSR grip pressure|FSR पकड़ का दबाव|FSR पकडीचा दाब
How to practise →|अभ्यास कैसे करें →|सराव कसा करावा →
View progress|प्रगति देखें|प्रगती पहा
Enter session|सत्र में जाएँ|सत्रात प्रवेश करा
Back to exercises|व्यायामों पर वापस जाएँ|व्यायामांकडे परत जा
Close progress|प्रगति बंद करें|प्रगती बंद करा
Rest your forearm on a comfortable surface.|अपनी बाँह को आरामदायक सतह पर रखें।|तुमचा पुढचा हात आरामदायक पृष्ठभागावर ठेवा.
Slowly close all five fingers, then hold briefly.|धीरे-धीरे पाँचों उंगलियाँ बंद करें और थोड़ा रोकें।|पाचही बोटे हळूहळू मिटा आणि थोडे थांबा.
Open your hand again and relax. Repeat at your own pace.|हाथ फिर खोलें और आराम दें। अपनी गति से दोहराएँ।|हात पुन्हा उघडा आणि आराम करा. आपल्या गतीने पुन्हा करा.
Keep your hand supported and the other fingers relaxed.|हाथ को सहारा दें और बाकी उंगलियाँ ढीली रखें।|हाताला आधार द्या आणि इतर बोटे सैल ठेवा.
Bend the finger named on screen, then straighten it.|स्क्रीन पर बताई उंगली मोड़ें, फिर सीधी करें।|स्क्रीनवर सांगितलेले बोट वाकवा, नंतर सरळ करा.
Continue through each finger without rushing.|बिना जल्दी किए हर उंगली से करें।|घाई न करता प्रत्येक बोटाने करा.
Keep your hand relaxed with your palm facing up.|हथेली ऊपर रखें और हाथ ढीला छोड़ें।|तळवा वर ठेवून हात सैल ठेवा.
Move your thumb gently toward one fingertip at a time.|अंगूठे को धीरे-धीरे एक-एक उंगली के सिरे की ओर लाएँ।|अंगठा हळूहळू एका वेळी एका बोटाच्या टोकाकडे न्या.
Return your thumb to rest after each movement.|हर बार अंगूठे को आराम की स्थिति में लौटाएँ।|प्रत्येक हालचालीनंतर अंगठा मूळ स्थितीत आणा.
Support your forearm and keep your hand relaxed.|बाँह को सहारा दें और हाथ ढीला रखें।|पुढच्या हाताला आधार देऊन हात सैल ठेवा.
Slowly lift your wrist, then return to the centre.|कलाई धीरे ऊपर उठाएँ, फिर बीच में लौटाएँ।|मनगट हळूहळू वर उचला, नंतर मध्यावर आणा.
Lower your wrist gently, then return to the centre.|कलाई धीरे नीचे करें, फिर बीच में लौटाएँ।|मनगट हळूहळू खाली न्या, नंतर मध्यावर आणा.
Rest your elbow and keep your wrist comfortable.|कोहनी को सहारा दें और कलाई आराम से रखें।|कोपराला आधार द्या आणि मनगट आरामात ठेवा.
Turn your palm upward, then return to the centre.|हथेली ऊपर घुमाएँ, फिर बीच में लौटाएँ।|तळवा वर वळवा, नंतर मध्यावर आणा.
Turn your palm downward, then return to the centre.|हथेली नीचे घुमाएँ, फिर बीच में लौटाएँ।|तळवा खाली वळवा, नंतर मध्यावर आणा.
Hold a soft object against the grip sensor.|पकड़ सेंसर के पास एक नरम वस्तु पकड़ें।|पकडीच्या सेन्सरजवळ मऊ वस्तू धरा.
Squeeze gently and hold the pressure briefly.|धीरे दबाएँ और दबाव थोड़ा बनाए रखें।|हलके दाबा आणि थोडा वेळ दाब ठेवा.
Release the pressure completely and relax before repeating.|दबाव पूरी तरह छोड़ें और दोहराने से पहले आराम करें।|दाब पूर्ण सोडा आणि पुन्हा करण्यापूर्वी आराम करा.
Squeeze gently, then release the pressure.|धीरे दबाएँ, फिर दबाव छोड़ें।|हलके दाबा, नंतर दाब सोडा.

Next: choose your finger|अगला: अपनी उंगली चुनें|पुढे: तुमचे बोट निवडा
Back to instructions|निर्देशों पर वापस जाएँ|सूचनांकडे परत जा
Gameplay preview|खेल की झलक|खेळाची झलक
Looping gameplay preview|खेल की दोहराती झलक|खेळाची पुन्हा पुन्हा दिसणारी झलक
Adjust sensitivity|संवेदनशीलता बदलें|संवेदनशीलता बदला
Close instructions|निर्देश बंद करें|सूचना बंद करा
Explore your hand|अपने हाथ को जानें|तुमचा हात जाणून घ्या
Hand structure|हाथ की संरचना|हाताची रचना
Front|सामने|समोर
Back|पीछे|मागे
Side|बगल|बाजू
Loading hand anatomy…|हाथ की संरचना लोड हो रही है…|हाताची रचना लोड होत आहे…
Preparing the 3D structures.|3D संरचनाएँ तैयार हो रही हैं।|3D रचना तयार होत आहेत.
Reset view|दृश्य रीसेट करें|दृश्य पूर्ववत करा
Show layers|परतें दिखाएँ|स्तर दाखवा
Bones|हड्डियाँ|हाडे
Hand muscles|हाथ की मांसपेशियाँ|हाताचे स्नायू
Forearm tendons|अग्रबाहु के कंडरा|अग्रबाहूचे कंडर
Drag to rotate|घुमाने के लिए खींचें|फिरवण्यासाठी ओढा
Shift-drag to move|खिसकाने के लिए Shift दबाकर खींचें|हलवण्यासाठी Shift दाबून ओढा
Point & scroll to zoom|ज़ूम के लिए उस जगह पॉइंटर रखकर स्क्रॉल करें|झूमसाठी त्या जागी पॉइंटर ठेवून स्क्रोल करा
Bone|हड्डी|हाड
Muscle|मांसपेशी|स्नायू
Selected|चयनित|निवडलेले
Select a structure|संरचना चुनें|रचना निवडा
Choose a bone or muscle from the model or list to learn more.|जानकारी के लिए मॉडल या सूची से हड्डी या मांसपेशी चुनें।|माहितीसाठी मॉडेल किंवा यादीतून हाड किंवा स्नायू निवडा.
CONNECTED TO YOUR MOVEMENT|आपकी गति से संबंध|तुमच्या हालचालीशी संबंध
Five flex sensors follow finger bending. The IMU follows wrist orientation, and the FSR follows contact pressure.|पाँच फ्लेक्स सेंसर उँगलियों का मुड़ना मापते हैं। IMU कलाई की दिशा और FSR संपर्क दबाव मापता है।|पाच फ्लेक्स सेन्सर बोटे वाकणे मोजतात. IMU मनगटाची दिशा आणि FSR संपर्क दाब मोजतो.
Isolate selection|केवल चयन दिखाएँ|फक्त निवड दाखवा
Focus|केंद्रित करें|लक्ष केंद्रित करा
Read structure guide ↗|संरचना की जानकारी पढ़ें ↗|रचनेची माहिती वाचा ↗
Structure library|संरचनाओं की सूची|रचनांची यादी
Find a bone or muscle|हड्डी या मांसपेशी खोजें|हाड किंवा स्नायू शोधा
Search structures…|संरचनाएँ खोजें…|रचना शोधा…
All|सभी|सर्व
Muscles|मांसपेशियाँ|स्नायू
Thumb|अंगूठा|अंगठा
Index|तर्जनी|तर्जनी
Middle|मध्यमा|मधले बोट
Ring|अनामिका|अनामिका
Little|छोटी उँगली|करंगळी
Pinky|छोटी उँगली|करंगळी
Index finger|तर्जनी|तर्जनी
Middle finger|मध्यमा|मधले बोट
Ring finger|अनामिका|अनामिका
Little finger|छोटी उँगली|करंगळी
Flex sensor|फ्लेक्स सेंसर|फ्लेक्स सेन्सर
3D anatomy:|3D शरीर रचना:|3D शरीररचना:
· Hand collection assembled by|· हाथ का संग्रह तैयार किया|· हाताचा संग्रह तयार केला
. Display colours and orientation adapted for NeuroGlove. This collection shows selected structures, not every tissue in the hand.|. प्रदर्शन के रंग और दिशा NeuroGlove के अनुसार बदले गए हैं। इस संग्रह में चुनिंदा संरचनाएँ हैं, हाथ के सभी ऊतक नहीं।|. प्रदर्शनाचे रंग आणि दिशा NeuroGlove साठी बदलले आहेत. या संग्रहात निवडक रचना आहेत, हातातील सर्व ऊती नाहीत.
No matching structures. Try another name.|कोई संरचना नहीं मिली। दूसरा नाम आज़माएँ।|रचना सापडली नाही. दुसरे नाव वापरून पाहा.
3D view is unavailable|3D दृश्य उपलब्ध नहीं है|3D दृश्य उपलब्ध नाही
Retry|फिर कोशिश करें|पुन्हा प्रयत्न करा
YOUR DAILY PRACTICE|आपका दैनिक अभ्यास|तुमचा रोजचा सराव
Guided exercises|निर्देशित व्यायाम|मार्गदर्शित व्यायाम
Practise at your own pace and follow your progress.|अपनी गति से अभ्यास करें और प्रगति देखें।|आपल्या गतीने सराव करा आणि प्रगती पाहा.
Waiting for sensor data|सेंसर डेटा की प्रतीक्षा|सेन्सर डेटाची प्रतीक्षा
Choose an exercise|व्यायाम चुनें|व्यायाम निवडा
Ready when you are|आप तैयार हों तो शुरू करें|तुम्ही तयार असाल तेव्हा सुरू करा
DEMONSTRATION|प्रदर्शन|प्रात्यक्षिक
Exercise demonstration|व्यायाम का प्रदर्शन|व्यायामाचे प्रात्यक्षिक
10-second loop|10 सेकंड का दोहराव|10 सेकंदांची पुनरावृत्ती
Your own pace|अपनी गति से|आपल्या गतीने
Demonstration could not load. You can still practise at your own pace.|प्रदर्शन लोड नहीं हुआ। आप अपनी गति से अभ्यास कर सकते हैं।|प्रात्यक्षिक लोड झाले नाही. तुम्ही आपल्या गतीने सराव करू शकता.
Start in a comfortable resting position.|आरामदायक स्थिति से शुरू करें।|आरामदायी स्थितीतून सुरू करा.
YOUR SENSOR READINGS|आपके सेंसर की रीडिंग|तुमच्या सेन्सरची मोजमापे
Your hand, right now|अभी आपके हाथ की स्थिति|तुमच्या हाताची सध्याची स्थिती
Waiting|प्रतीक्षा|प्रतीक्षा
This hand follows sensor data. It never copies the demonstration.|यह हाथ सेंसर डेटा के अनुसार चलता है। यह प्रदर्शन की नकल नहीं करता।|हा हात सेन्सर डेटानुसार हलतो. तो प्रात्यक्षिकाची नक्कल करत नाही.
Current target reached|वर्तमान लक्ष्य की प्राप्ति|सध्याचे लक्ष्य साध्य
Session average|सत्र का औसत|सत्राची सरासरी
Active practice time|सक्रिय अभ्यास का समय|सक्रिय सरावाचा वेळ
Targets achieved|प्राप्त लक्ष्य|साध्य केलेली लक्ष्ये
Start session|सत्र शुरू करें|सत्र सुरू करा
Resume|जारी रखें|पुन्हा सुरू करा
Pause|रोकें|थांबवा
Finish & save|समाप्त करके सहेजें|पूर्ण करून जतन करा
Choose an exercise and get comfortable.|व्यायाम चुनें और आरामदायक स्थिति में बैठें।|व्यायाम निवडा आणि आरामदायी स्थितीत बसा.
SESSION SAVED|सत्र सहेजा गया|सत्र जतन झाले
Your practice, recorded.|आपका अभ्यास दर्ज हुआ।|तुमचा सराव नोंदवला आहे.
Average target achievement|लक्ष्य प्राप्ति का औसत|लक्ष्य साध्य करण्याची सरासरी
BUILDING YOUR PROGRESS|आपकी प्रगति|तुमची प्रगती
Daily average target achievement|दैनिक औसत लक्ष्य प्राप्ति|दैनंदिन सरासरी लक्ष्य साध्य
Last 30 days|पिछले 30 दिन|मागील 30 दिवस
Selected exercise|चयनित व्यायाम|निवडलेला व्यायाम
Average across reach-and-return attempts|लक्ष्य तक पहुँचकर लौटने के प्रयासों का औसत|लक्ष्य गाठून परत येण्याच्या प्रयत्नांची सरासरी
Results to show|दिखाने के परिणाम|दाखवायचे निकाल
Simulated sessions|सिम्युलेटेड सत्र|सिम्युलेटेड सत्रे
Glove sessions|ग्लव के सत्र|ग्लोव्हची सत्रे
No saved sessions yet.|अभी कोई सत्र सहेजा नहीं गया।|अद्याप कोणतेही सत्र जतन केलेले नाही.
Your first completed session will appear here. No sample results have been added.|आपका पहला पूर्ण सत्र यहाँ दिखेगा। नमूना परिणाम नहीं जोड़े गए हैं।|तुमचे पहिले पूर्ण सत्र येथे दिसेल. नमुना निकाल जोडलेले नाहीत.
Your first completed, scored session will appear here. No sample results have been added.|आपका पहला पूर्ण और अंकित सत्र यहाँ दिखेगा। नमूना परिणाम नहीं जोड़े गए हैं।|तुमचे पहिले पूर्ण व गुणांकित सत्र येथे दिसेल. नमुना निकाल जोडलेले नाहीत.
Recent sessions|हाल के सत्र|अलीकडील सत्रे
Date|तारीख|दिनांक
Active time|सक्रिय समय|सक्रिय वेळ
Target achievement|लक्ष्य प्राप्ति|लक्ष्य साध्य
Status|स्थिति|स्थिती
Reach the movement target, then return to rest. Each reach-and-return attempt records the range achieved; full credit requires reaching and briefly settling at the target before returning. Moving slowly does not reduce your score. Pauses and missing data discard unfinished attempts. This is sensor feedback, not a clinical assessment. Thumb opposition measures thumb bending only.|गति का लक्ष्य प्राप्त करें, फिर आराम की स्थिति में लौटें। हर प्रयास में प्राप्त गति-सीमा दर्ज होती है। पूरे अंक के लिए लक्ष्य पर थोड़ी देर स्थिर रहकर लौटना आवश्यक है। धीरे चलने से अंक कम नहीं होते। रुकने या डेटा न मिलने पर अधूरे प्रयास नहीं गिने जाते। यह सेंसर की प्रतिक्रिया है, चिकित्सकीय आकलन नहीं। अंगूठे का व्यायाम केवल उसका मुड़ना मापता है।|हालचालीचे लक्ष्य गाठा, नंतर विश्रांतीच्या स्थितीत या. प्रत्येक प्रयत्नातील साध्य हालचालीची व्याप्ती नोंदवली जाते. पूर्ण गुणांसाठी लक्ष्यावर थोडे स्थिर राहून परत येणे आवश्यक आहे. सावकाश हलल्याने गुण कमी होत नाहीत. थांबणे किंवा डेटा नसल्यास अपूर्ण प्रयत्न मोजले जात नाहीत. हा सेन्सरचा अभिप्राय आहे, वैद्यकीय मूल्यमापन नाही. अंगठ्याचा व्यायाम फक्त अंगठा वाकणे मोजतो.
Hand Opening & Closing|हाथ खोलना और बंद करना|हात उघडणे आणि बंद करणे
Individual Finger Movement|एक-एक उँगली की गति|प्रत्येक बोटाची स्वतंत्र हालचाल
Thumb Opposition|अंगूठे को उँगलियों की ओर लाना|अंगठा बोटांकडे नेणे
Wrist Flexion & Extension|कलाई मोड़ना और सीधा करना|मनगट वाकवणे आणि सरळ करणे
Forearm Rotation|अग्रबाहु घुमाना|अग्रबाहू फिरवणे
Gently close your hand, then open and relax.|हाथ धीरे बंद करें, फिर खोलकर आराम दें।|हात हळू बंद करा, नंतर उघडून सैल सोडा.
Bend and straighten one finger at a time.|एक समय में एक उँगली मोड़ें और सीधी करें।|एका वेळी एक बोट वाकवा आणि सरळ करा.
Move your thumb toward each fingertip.|अंगूठे को हर उँगली के सिरे की ओर ले जाएँ।|अंगठा प्रत्येक बोटाच्या टोकाकडे न्या.
Move your wrist up and down comfortably.|कलाई को आराम से ऊपर-नीचे करें।|मनगट आरामात वर-खाली हलवा.
Turn your palm upward, then downward.|हथेली ऊपर की ओर घुमाएँ, फिर नीचे।|तळहात वरच्या दिशेने फिरवा, नंतर खाली.
Five independent flex sensors|पाँच स्वतंत्र फ्लेक्स सेंसर|पाच स्वतंत्र फ्लेक्स सेन्सर
Partial score: thumb bend pattern only. Fingertip contact and opposition position are not measured.|आंशिक अंक: केवल अंगूठे के मुड़ने का पैटर्न। उँगली के सिरे का संपर्क और अंगूठे की सटीक स्थिति नहीं मापी जाती।|अंशतः गुण: फक्त अंगठा वाकण्याचा नमुना. बोटाच्या टोकाचा स्पर्श आणि अंगठ्याची अचूक स्थिती मोजली जात नाही.
IMU wrist tilt relative to your resting position|विश्राम की स्थिति के सापेक्ष IMU से कलाई का झुकाव|विश्रांतीच्या स्थितीच्या तुलनेत IMU द्वारे मनगटाचा कल
IMU forearm rotation relative to your resting position|विश्राम की स्थिति के सापेक्ष IMU से अग्रबाहु का घुमाव|विश्रांतीच्या स्थितीच्या तुलनेत IMU द्वारे अग्रबाहूचे फिरणे
Rest your hand comfortably before Start; this records your neutral position.|शुरू करने से पहले हाथ आराम से रखें; इससे सामान्य स्थिति दर्ज होती है।|सुरू करण्यापूर्वी हात आरामात ठेवा; यामुळे मूळ स्थिती नोंदवली जाते.
Paused|रुका हुआ|थांबवलेले
take your time|आराम से करें|सावकाश करा
Session in progress|सत्र जारी है|सत्र सुरू आहे
Rest when you need. Resume when you’re ready.|ज़रूरत हो तो आराम करें। तैयार होने पर जारी रखें।|गरज वाटल्यास विश्रांती घ्या. तयार झाल्यावर पुन्हा सुरू करा.
Movement tracking is on hold until fresh, complete sensor readings return.|नई और पूरी सेंसर रीडिंग मिलने तक गति की निगरानी रुकी है।|नवीन व पूर्ण सेन्सर मोजमापे मिळेपर्यंत हालचालींची नोंद थांबवली आहे.
Receiving sensor data|सेंसर डेटा मिल रहा है|सेन्सर डेटा मिळत आहे
Waiting for readings|रीडिंग की प्रतीक्षा|मोजमापांची प्रतीक्षा
Glove sensor session|ग्लव सेंसर का सत्र|ग्लोव्ह सेन्सरचे सत्र
Simulated sensor session|सिम्युलेटेड सेंसर का सत्र|सिम्युलेटेड सेन्सरचे सत्र
Session stopped: sensor source changed.|सत्र रुका: सेंसर स्रोत बदला गया।|सत्र थांबले: सेन्सरचा स्रोत बदलला.
Session stopped: calibration changed.|सत्र रुका: कैलिब्रेशन बदला गया।|सत्र थांबले: कॅलिब्रेशन बदलले.
Session saved without a score.|सत्र बिना अंक के सहेजा गया।|सत्र गुणांशिवाय जतन केले.
No reach-and-return attempts were completed.|लक्ष्य तक पहुँचकर लौटने का कोई प्रयास पूरा नहीं हुआ।|लक्ष्य गाठून परत येण्याचा कोणताही प्रयत्न पूर्ण झाला नाही.
History could not load. Change the exercise or results filter to retry.|इतिहास लोड नहीं हुआ। फिर कोशिश के लिए व्यायाम या परिणाम फ़िल्टर बदलें।|इतिहास लोड झाला नाही. पुन्हा प्रयत्नासाठी व्यायाम किंवा निकालाचा फिल्टर बदला.
No scored sessions yet.|अभी कोई अंकित सत्र नहीं है।|अद्याप गुणांकित सत्र नाही.
First day recorded|पहले दिन का रिकॉर्ड|पहिल्या दिवसाची नोंद
Saved|सहेजा गया|जतन केले
Interrupted|बाधित|खंडित
Calibration changed|कैलिब्रेशन बदला|कॅलिब्रेशन बदलले
Source changed|स्रोत बदला|स्रोत बदलला
Simulated data|सिम्युलेटेड डेटा|सिम्युलेटेड डेटा
Glove data|ग्लव का डेटा|ग्लोव्हचा डेटा
Return to a comfortable resting position.|आरामदायक विश्राम स्थिति में लौटें।|आरामदायी विश्रांतीच्या स्थितीत या.
Target reached. Slowly return to rest.|लक्ष्य प्राप्त। धीरे-धीरे विश्राम की स्थिति में लौटें।|लक्ष्य गाठले. सावकाश विश्रांतीच्या स्थितीत या.
Gently close your hand, then open and return to rest.|हाथ धीरे बंद करें, फिर खोलकर विश्राम की स्थिति में लौटें।|हात हळू बंद करा, नंतर उघडून विश्रांतीच्या स्थितीत या.
Gently bend your thumb toward a fingertip, then relax. Contact is not scored.|अंगूठे को उँगली के सिरे की ओर धीरे मोड़ें, फिर आराम दें। संपर्क के अंक नहीं हैं।|अंगठा बोटाच्या टोकाकडे हळू वाकवा, नंतर सैल सोडा. स्पर्शासाठी गुण दिले जात नाहीत.
Lift your wrist, then return to centre.|कलाई ऊपर उठाएँ, फिर बीच में लौटें।|मनगट वर उचला, नंतर मध्यावर आणा.
Lower your wrist, then return to centre.|कलाई नीचे करें, फिर बीच में लौटें।|मनगट खाली करा, नंतर मध्यावर आणा.
Turn your forearm one way, then return to centre.|अग्रबाहु एक ओर घुमाएँ, फिर बीच में लौटें।|अग्रबाहू एका बाजूला फिरवा, नंतर मध्यावर आणा.
Turn your forearm the other way, then return to centre.|अग्रबाहु दूसरी ओर घुमाएँ, फिर बीच में लौटें।|अग्रबाहू दुसऱ्या बाजूला फिरवा, नंतर मध्यावर आणा.
PATIENT WORKSPACE|रोगी कार्यक्षेत्र|रुग्ण कार्यक्षेत्र
YOUR REHABILITATION|आपका पुनर्वास|तुमचे पुनर्वसन
Small movements.|छोटी-छोटी गतिविधियाँ।|छोट्या हालचाली.
Meaningful progress.|महत्त्वपूर्ण प्रगति।|अर्थपूर्ण प्रगती.
Take your time. Every attempt counts.|आराम से करें। हर प्रयास मायने रखता है।|सावकाश करा. प्रत्येक प्रयत्न महत्त्वाचा आहे.
Session history|सत्र का इतिहास|सत्रांचा इतिहास
Rehabilitation platform|पुनर्वास मंच|पुनर्वसन प्रणाली
A real-time mirror of finger, wrist and grip sensor readings.|उँगली, कलाई और पकड़ के सेंसर रीडिंग का सीधा दृश्य।|बोटे, मनगट आणि पकडीच्या सेन्सर मोजमापांचे थेट दृश्य.
Right hand|दायाँ हाथ|उजवा हात
Simulated sensor mirror|सिम्युलेटेड सेंसर का दृश्य|सिम्युलेटेड सेन्सरचे दृश्य
Live sensor mirror|लाइव सेंसर का दृश्य|थेट सेन्सर दृश्य
Demo|डेमो|डेमो
Waiting for simulated data|सिम्युलेटेड डेटा की प्रतीक्षा|सिम्युलेटेड डेटाची प्रतीक्षा
The hand will follow simulated finger and wrist readings when the demo feed resumes.|डेमो डेटा फिर शुरू होने पर हाथ उँगलियों और कलाई की सिम्युलेटेड रीडिंग का अनुसरण करेगा।|डेमो डेटा पुन्हा सुरू झाल्यावर हात बोटे व मनगटाच्या सिम्युलेटेड मोजमापांनुसार हलेल.
Waiting for glove|ग्लव की प्रतीक्षा|ग्लोव्हची प्रतीक्षा
Finger and wrist readings will appear when your glove sends data.|ग्लव से डेटा मिलने पर उँगली और कलाई की रीडिंग दिखेगी।|ग्लोव्हकडून डेटा आल्यावर बोटे व मनगटाची मोजमापे दिसतील.
Ring Flex|अनामिका का मुड़ना|अनामिका वाकणे
Little finger Flex|छोटी उँगली का मुड़ना|करंगळी वाकणे
Hand Movement Mapping|हाथ की गति का मानचित्रण|हाताच्या हालचालींचे नकाशांकन
Reference poses for the live movement estimate.|वर्तमान गति के अनुमान के लिए संदर्भ मुद्राएँ।|सध्याच्या हालचालीच्या अंदाजासाठी संदर्भ मुद्रा.
Waiting for estimate|अनुमान की प्रतीक्षा|अंदाजाची प्रतीक्षा
Finger positions|उँगलियों की स्थितियाँ|बोटांच्या स्थिती
Fingers extended|उँगलियाँ सीधी|बोटे सरळ
Current estimate|वर्तमान अनुमान|सध्याचा अंदाज
Grip held|पकड़ बनाए हुए|पकड कायम
Thumb & index|अंगूठा और तर्जनी|अंगठा आणि तर्जनी
Fist closed|मुट्ठी बंद|मूठ बंद
Wrist & rest|कलाई और विश्राम|मनगट आणि विश्रांती
Bend downward|नीचे मोड़ें|खाली वाकवा
Bend upward|ऊपर मोड़ें|वर वाकवा
Hand at rest|हाथ विश्राम में|हात विश्रांतीत
The highlighted pose is the model’s estimate. The hand mirror follows your sensor readings.|हाइलाइट की गई मुद्रा मॉडल का अनुमान है। हाथ का दृश्य सेंसर रीडिंग के अनुसार चलता है।|ठळक मुद्रा हा मॉडेलचा अंदाज आहे. हाताचे दृश्य सेन्सर मोजमापांनुसार हलते.
Waiting for data|डेटा की प्रतीक्षा|डेटाची प्रतीक्षा
Estimated movement|अनुमानित गति|अंदाजित हालचाल
Confidence trend|विश्वसनीयता का रुझान|विश्वास पातळीचा कल
Model confidence|मॉडल की विश्वसनीयता|मॉडेलची विश्वास पातळी
Waiting for a movement estimate from sensor readings.|सेंसर रीडिंग से गति के अनुमान की प्रतीक्षा।|सेन्सर मोजमापांवरून हालचालीच्या अंदाजाची प्रतीक्षा.
Model estimate|मॉडल का अनुमान|मॉडेलचा अंदाज
Estimated from incoming sensor readings.|प्राप्त सेंसर रीडिंग से अनुमानित।|मिळणाऱ्या सेन्सर मोजमापांवरून अंदाजित.
The current sensor signal is uncertain.|वर्तमान सेंसर सिग्नल अनिश्चित है।|सध्याचा सेन्सर संकेत अनिश्चित आहे.
No fresh glove readings are available.|ग्लव की नई रीडिंग उपलब्ध नहीं है।|ग्लोव्हची नवीन मोजमापे उपलब्ध नाहीत.
Simulated|सिम्युलेटेड|सिम्युलेटेड
Roll|रोल|रोल
Pitch|पिच|पिच
Yaw|यॉ|यॉ
Let’s make movement a little more fun.|आइए गतिविधियों को थोड़ा मज़ेदार बनाएँ।|चला, हालचाली आणखी मजेदार करूया.
Choose an activity. Get comfortable. Go at your own pace.|गतिविधि चुनें। आराम से बैठें। अपनी गति से खेलें।|खेळ निवडा. आरामात बसा. आपल्या गतीने खेळा.
Three activities. One movement at a time.|तीन गतिविधियाँ। एक समय में एक गति।|तीन खेळ. एका वेळी एक हालचाल.
Choose your activity|अपनी गतिविधि चुनें|तुमचा खेळ निवडा
You can try any activity.|आप कोई भी गतिविधि आज़मा सकते हैं।|तुम्ही कोणताही खेळ खेळू शकता.
HAND OPEN & CLOSE|हाथ खोलना और बंद करना|हात उघडणे आणि बंद करणे
The Orchard|फलों का बाग|फळबाग
Pick a fruit. Place it in the basket.|फल तोड़ें। टोकरी में रखें।|फळ तोडा. टोपलीत ठेवा.
Gentle grasp & release|हल्के से पकड़ें और छोड़ें|हळू पकडा आणि सोडा
Personal best|आपका सर्वोच्च स्कोर|तुमचे सर्वोत्तम गुण
HAND MOVEMENT|हाथ की गति|हाताची हालचाल
NEW|नया|नवीन
Kangaroo Hop|कंगारू हॉप|कांगारू हॉप
A familiar little runner. Your pace.|जाना-पहचाना छोटा धावक। आपकी गति से।|ओळखीचा छोटा धावपटू. तुमच्या गतीने.
Lift one finger to jump|कूदने के लिए एक उँगली उठाएँ|उडीसाठी एक बोट उचला
WRIST MOVEMENT|कलाई की गति|मनगटाची हालचाल
Sky Journey|आसमान की सैर|आकाशाची सफर
Guide a balloon through the sky.|गुब्बारे को आसमान में ले जाएँ।|फुगा आकाशात मार्गस्थ करा.
Steady wrist control|कलाई का स्थिर नियंत्रण|मनगटाचे स्थिर नियंत्रण
Your practice space|आपके अभ्यास की जगह|तुमच्या सरावाची जागा
Take a break whenever you need.|ज़रूरत पड़ने पर विश्राम करें।|गरज वाटेल तेव्हा विश्रांती घ्या.
Choose another activity|दूसरी गतिविधि चुनें|दुसरा खेळ निवडा
A little space to focus on your movement.|अपनी गति पर ध्यान देने की जगह।|हालचालींवर लक्ष देण्यासाठी जागा.
GRASP & RELEASE|पकड़ें और छोड़ें|पकडा आणि सोडा
JUMP & RELAX|कूदें और आराम दें|उडी मारा आणि सैल सोडा
WRIST CONTROL|कलाई का नियंत्रण|मनगटाचे नियंत्रण
Change finger|उँगली बदलें|बोट बदला
Change|बदलें|बदला
BEFORE YOU BEGIN|शुरू करने से पहले|सुरू करण्यापूर्वी
Which finger would you like to use?|कौन-सी उँगली इस्तेमाल करना चाहेंगे?|तुम्हाला कोणते बोट वापरायचे आहे?
Tap a number on the right hand. Lift only that finger to make your kangaroo jump.|दाएँ हाथ पर संख्या चुनें। कंगारू को कुदाने के लिए केवल वही उँगली उठाएँ।|उजव्या हातावरील क्रमांक निवडा. कंगारूला उडी मारण्यासाठी फक्त तेच बोट उचला.
Choose a finger to begin|शुरू करने के लिए उँगली चुनें|सुरू करण्यासाठी बोट निवडा
Rest your hand comfortably before choosing.|चुनने से पहले हाथ आराम से रखें।|निवडण्यापूर्वी हात आरामात ठेवा.
Set resting position|विश्राम स्थिति सेट करें|विश्रांतीची स्थिती ठरवा
Lower the finger to get ready for the next jump. The other fingers do not control the game.|अगली छलाँग के लिए उँगली नीचे करें। अन्य उँगलियाँ खेल नियंत्रित नहीं करतीं।|पुढील उडीसाठी बोट खाली करा. इतर बोटे खेळ नियंत्रित करत नाहीत.
Close hand|हाथ बंद करें|हात बंद करा
Open hand|हाथ खोलें|हात उघडा
Rise ↑|ऊपर ↑|वर ↑
Descend ↓|नीचे ↓|खाली ↓
Jump|कूदें|उडी मारा
Start activity|गतिविधि शुरू करें|खेळ सुरू करा
Finish activity|गतिविधि समाप्त करें|खेळ पूर्ण करा
Start when you feel ready.|तैयार होने पर शुरू करें।|तयार झाल्यावर सुरू करा.
Practice complete. Well done.|अभ्यास पूरा हुआ। बहुत अच्छा।|सराव पूर्ण झाला. छान केले.
Movements completed|पूरी की गई गतिविधियाँ|पूर्ण झालेल्या हालचाली
Practice time|अभ्यास का समय|सरावाचा वेळ
Points earned|प्राप्त अंक|मिळालेले गुण
Every movement is a start. Set your first personal best.|हर गतिविधि एक शुरुआत है। अपना पहला सर्वोच्च स्कोर बनाएँ।|प्रत्येक हालचाल ही सुरुवात आहे. तुमचे पहिले सर्वोत्तम गुण मिळवा.
Best scores saved in this browser.|सर्वोच्च स्कोर इस ब्राउज़र में सहेजे जाते हैं।|सर्वोत्तम गुण या ब्राउझरमध्ये जतन होतात.
Best scores available for this visit. Browser storage is unavailable.|स्कोर केवल इस बार उपलब्ध हैं। ब्राउज़र स्टोरेज उपलब्ध नहीं है।|गुण फक्त या भेटीसाठी उपलब्ध आहेत. ब्राउझर स्टोरेज उपलब्ध नाही.
A LITTLE GUIDANCE|थोड़ा मार्गदर्शन|थोडे मार्गदर्शन
Here’s how to play|ऐसे खेलें|असे खेळा
Gently close your hand|हाथ धीरे बंद करें|हात हळू बंद करा
Pick the fruit when it reaches the circle.|फल घेरे में आने पर उसे पकड़ें।|फळ वर्तुळात आल्यावर पकडा.
Open your hand|हाथ खोलें|हात उघडा
Release the fruit into the basket.|फल को टोकरी में छोड़ें।|फळ टोपलीत सोडा.
The fruit waits for you. There’s no time limit.|फल आपका इंतज़ार करता है। समय की सीमा नहीं है।|फळ तुमची वाट पाहते. वेळेची मर्यादा नाही.
Tilt your wrist up|कलाई ऊपर झुकाएँ|मनगट वर झुकवा
Your balloon will gently rise.|आपका गुब्बारा धीरे ऊपर जाएगा।|तुमचा फुगा हळू वर जाईल.
Tilt down to descend|नीचे जाने के लिए कलाई नीचे झुकाएँ|खाली जाण्यासाठी मनगट खाली झुकवा
Line up with the next ring and hold briefly to pass through.|अगले घेरे की ऊँचाई पर आकर थोड़ी देर स्थिर रहें।|पुढील कड्याच्या उंचीवर येऊन थोडे स्थिर रहा.
Each ring waits until you reach its height.|आप ऊँचाई तक पहुँचें तब तक घेरा इंतज़ार करता है।|तुम्ही उंची गाठेपर्यंत प्रत्येक कडे थांबते.
Set my resting position|मेरी विश्राम स्थिति सेट करें|माझी विश्रांतीची स्थिती ठरवा
Choose a finger, then lift it|उँगली चुनें, फिर उठाएँ|बोट निवडा, नंतर उचला
Help your kangaroo jump over a cactus.|कंगारू को कैक्टस के ऊपर से कुदाएँ।|कंगारूला निवडुंगावरून उडी मारायला मदत करा.
Relax, then try again|आराम दें, फिर कोशिश करें|सैल सोडा, नंतर पुन्हा प्रयत्न करा
Lower your chosen finger before the next jump.|अगली छलाँग से पहले चुनी हुई उँगली नीचे करें।|पुढील उडीपूर्वी निवडलेले बोट खाली करा.
In gentle mode, the cactus waits for your jump.|आसान मोड में कैक्टस आपकी छलाँग का इंतज़ार करता है।|सोप्या मोडमध्ये निवडुंग तुमच्या उडीची वाट पाहते.
YOUR MOVEMENT|आपकी गति|तुमची हालचाल
Hand closed|हाथ बंद|हात बंद
Hand open|हाथ खुला|हात उघडा
release|छोड़ें|सोडा
Grip pressure|पकड़ का दबाव|पकडीचा दाब
Wrist tilt|कलाई का झुकाव|मनगटाचा कल
Resting position|विश्राम स्थिति|विश्रांतीची स्थिती
HOW YOU PLAY|खेलने का तरीका|खेळण्याची पद्धत
Use glove|ग्लव इस्तेमाल करें|ग्लोव्ह वापरा
Try with buttons|बटन से आज़माएँ|बटणांनी वापरून पाहा
Your glove movements control the activity.|आपके ग्लव की गति गतिविधि नियंत्रित करती है।|तुमच्या ग्लोव्हच्या हालचाली खेळ नियंत्रित करतात.
Make it comfortable|आरामदायक बनाएँ|आरामदायी करा
Hand movement needed|आवश्यक हाथ की गति|आवश्यक हाताची हालचाल
Wrist response|कलाई की प्रतिक्रिया|मनगटाचा प्रतिसाद
Small movements|छोटी गतिविधियाँ|छोट्या हालचाली
Standard|सामान्य|सामान्य
Gentle response|हल्की प्रतिक्रिया|सौम्य प्रतिसाद
Finger lift needed|आवश्यक उँगली उठाव|आवश्यक बोट उचलणे
When I lift, my sensor reading|उठाने पर मेरी सेंसर रीडिंग|उचलल्यावर माझे सेन्सर मोजमाप
Decreases (extension)|घटती है (सीधा करना)|कमी होते (सरळ करणे)
Increases (reverse mounting)|बढ़ती है (उल्टी फिटिंग)|वाढते (उलट बसवलेले)
Running pace|दौड़ने की गति|धावण्याची गती
Slow|धीरे|सावकाश
Steady|स्थिर|स्थिर
Lively|तेज़|वेगवान
Let obstacles wait for me|बाधाओं को मेरा इंतज़ार करने दें|अडथळ्यांना माझी वाट पाहू द्या
Gentle sound feedback|हल्के ध्वनि संकेत|सौम्य ध्वनी अभिप्राय
A comfortable movement is enough. You can pause or finish at any time.|आरामदायक गतिविधि पर्याप्त है। आप कभी भी रोक या समाप्त कर सकते हैं।|आरामदायी हालचाल पुरेशी आहे. तुम्ही कधीही थांबवू किंवा पूर्ण करू शकता.
NeuroGlove · Movement rehabilitation|NeuroGlove · गतिविधि पुनर्वास|NeuroGlove · हालचालींचे पुनर्वसन
Research workspace|अनुसंधान कार्यक्षेत्र|संशोधन कार्यक्षेत्र
Patient privacy|रोगी की गोपनीयता|रुग्णाची गोपनीयता
WORKSPACE PREFERENCES|कार्यक्षेत्र की प्राथमिकताएँ|कार्यक्षेत्राच्या पसंती
Connect your glove and tune how your movements are measured.|ग्लव कनेक्ट करें और गति मापने की सेटिंग बदलें।|ग्लोव्ह जोडा आणि हालचाली मोजण्याच्या सेटिंग बदला.
Current profile|वर्तमान प्रोफ़ाइल|सध्याची प्रोफाइल
01 / CONNECTION|01 / कनेक्शन|01 / जोडणी
Choose your data source|डेटा स्रोत चुनें|डेटाचा स्रोत निवडा
The selected source is used across your workspace.|चुना गया स्रोत पूरे कार्यक्षेत्र में इस्तेमाल होता है।|निवडलेला स्रोत संपूर्ण कार्यक्षेत्रात वापरला जातो.
Data source|डेटा स्रोत|डेटाचा स्रोत
Simulation active|सिम्युलेशन सक्रिय|सिम्युलेशन सुरू
Glove receiving data|ग्लव का डेटा मिल रहा है|ग्लोव्हचा डेटा मिळत आहे
Waiting for glove readings|ग्लव की रीडिंग की प्रतीक्षा|ग्लोव्हच्या मोजमापांची प्रतीक्षा
Waiting for glove connection|ग्लव कनेक्शन की प्रतीक्षा|ग्लोव्ह जोडणीची प्रतीक्षा
Explore the hand mirror and games with generated sensor readings.|बनाई गई सेंसर रीडिंग से हाथ का दृश्य और खेल आज़माएँ।|तयार केलेल्या सेन्सर मोजमापांसह हाताचे दृश्य आणि खेळ पाहा.
Ready to explore|आज़माने के लिए तैयार|पाहण्यासाठी तयार
No glove needed|ग्लव की ज़रूरत नहीं|ग्लोव्हची गरज नाही
Connect your glove|अपना ग्लव कनेक्ट करें|तुमचा ग्लोव्ह जोडा
Mirror your hand using the connected ESP32 and its sensors.|जुड़े ESP32 और उसके सेंसर से हाथ की गति दिखाएँ।|जोडलेल्या ESP32 आणि त्याच्या सेन्सरद्वारे हाताच्या हालचाली पाहा.
Live input|लाइव इनपुट|थेट इनपुट
Glove connection required|ग्लव कनेक्शन आवश्यक|ग्लोव्ह जोडणे आवश्यक
Source changes apply immediately. Calibration changes are saved separately below.|स्रोत के बदलाव तुरंत लागू होते हैं। कैलिब्रेशन के बदलाव नीचे अलग से सहेजे जाते हैं।|स्रोताचे बदल लगेच लागू होतात. कॅलिब्रेशनचे बदल खाली स्वतंत्रपणे जतन होतात.
02 / FINGER MOVEMENT|02 / उँगलियों की गति|02 / बोटांची हालचाल
Flex sensor calibration|फ्लेक्स सेंसर कैलिब्रेशन|फ्लेक्स सेन्सर कॅलिब्रेशन
Enter each sensor’s reading with the finger relaxed, then comfortably closed.|हर सेंसर की रीडिंग पहले उँगली आराम से रखकर, फिर आराम से मोड़कर दर्ज करें।|प्रत्येक सेन्सरचे मोजमाप आधी बोट सैल ठेवून, नंतर आरामात वाकवून नोंदवा.
Raw ADC|कच्चा ADC|मूळ ADC
Finger|उँगली|बोट
Relaxed hand|आराम की स्थिति में हाथ|सैल हात
Closed hand|बंद हाथ|बंद हात
Relaxed and closed readings must differ. A reverse-mounted sensor may have a lower closed reading.|आराम और बंद स्थिति की रीडिंग अलग होनी चाहिए। उल्टा लगा सेंसर बंद स्थिति में कम रीडिंग दे सकता है।|सैल आणि बंद स्थितीतील मोजमापे वेगळी असावीत. उलट बसवलेल्या सेन्सरचे बंद स्थितीतील मोजमाप कमी असू शकते.
03 / SIGNAL DETECTION|03 / सिग्नल पहचान|03 / संकेत ओळख
Signal thresholds|सिग्नल की सीमाएँ|संकेतांच्या मर्यादा
Set when muscle activity and grip contact are detected.|मांसपेशी गतिविधि और पकड़ का संपर्क पहचानने की सीमा तय करें।|स्नायूंची सक्रियता आणि पकडीचा स्पर्श ओळखण्याची मर्यादा ठरवा.
Muscle activity|मांसपेशी गतिविधि|स्नायूंची सक्रियता
Minimum signal for active muscle effort.|सक्रिय मांसपेशी प्रयास के लिए न्यूनतम सिग्नल।|सक्रिय स्नायू प्रयत्नासाठी किमान संकेत.
Grip contact|पकड़ का संपर्क|पकडीचा स्पर्श
Minimum pressure reading for contact.|संपर्क के लिए न्यूनतम दबाव रीडिंग।|स्पर्शासाठी किमान दाब मोजमाप.
A comfortable position comes first.|आरामदायक स्थिति सबसे ज़रूरी है।|आरामदायी स्थितीला प्राधान्य द्या.
Keep the glove in the same position while recording both readings. Use a comfortable movement range.|दोनों रीडिंग दर्ज करते समय ग्लव एक ही स्थिति में रखें। आरामदायक गति-सीमा का इस्तेमाल करें।|दोन्ही मोजमापे नोंदवताना ग्लोव्ह एकाच स्थितीत ठेवा. आरामदायी हालचालींची व्याप्ती वापरा.
Changing the data source does not erase your saved calibration.|डेटा स्रोत बदलने से सहेजा कैलिब्रेशन मिटता नहीं है।|डेटाचा स्रोत बदलल्याने जतन केलेले कॅलिब्रेशन पुसले जात नाही.
Calibration up to date|कैलिब्रेशन अद्यतित है|कॅलिब्रेशन अद्ययावत आहे
Your saved values are loaded for this profile.|इस प्रोफ़ाइल के सहेजे मान लोड किए गए हैं।|या प्रोफाइलसाठी जतन केलेली मूल्ये लोड केली आहेत.
Discard changes|बदलाव रद्द करें|बदल रद्द करा
Save calibration|कैलिब्रेशन सहेजें|कॅलिब्रेशन जतन करा
Unsaved changes|बदलाव सहेजे नहीं गए|बदल जतन केलेले नाहीत
Saving…|सहेजा जा रहा है…|जतन होत आहे…
Calibration saved|कैलिब्रेशन सहेजा गया|कॅलिब्रेशन जतन झाले
Check your readings|अपनी रीडिंग जाँचें|तुमची मोजमापे तपासा
Complete each field using the allowed range.|हर फ़ील्ड अनुमत सीमा के भीतर भरें।|प्रत्येक रकाना अनुमत मर्यादेत भरा.
The source could not be changed. Please try again.|स्रोत बदला नहीं जा सका। फिर कोशिश करें।|स्रोत बदलता आला नाही. पुन्हा प्रयत्न करा.
Practice in progress|अभ्यास जारी है|सराव सुरू आहे
Practice complete|अभ्यास पूरा हुआ|सराव पूर्ण झाला
Pause activity|गतिविधि रोकें|खेळ थांबवा
Resume activity|गतिविधि जारी रखें|खेळ पुन्हा सुरू करा
Finish & choose another|समाप्त करके दूसरा चुनें|पूर्ण करून दुसरा निवडा
Finish this activity to choose another.|दूसरी गतिविधि चुनने के लिए यह समाप्त करें।|दुसरा खेळ निवडण्यासाठी हा खेळ पूर्ण करा.
Choose a finger first|पहले उँगली चुनें|आधी बोट निवडा
Practice again|फिर अभ्यास करें|पुन्हा सराव करा
Start picking|फल तोड़ना शुरू करें|फळे तोडायला सुरुवात करा
Begin flight|उड़ान शुरू करें|उड्डाण सुरू करा
Try again|फिर कोशिश करें|पुन्हा प्रयत्न करा
Choose your control finger|नियंत्रण की उँगली चुनें|नियंत्रणासाठी बोट निवडा
Practice buttons|अभ्यास के बटन|सरावाची बटणे
no sensor input|सेंसर इनपुट नहीं|सेन्सर इनपुट नाही
Glove connected|ग्लव कनेक्ट है|ग्लोव्ह जोडलेला आहे
live movement|लाइव गति|थेट हालचाल
simulated glove|सिम्युलेटेड ग्लव|सिम्युलेटेड ग्लोव्ह
Sensor data unavailable|सेंसर डेटा उपलब्ध नहीं|सेन्सर डेटा उपलब्ध नाही
movement on hold|गतिविधि रुकी हुई है|हालचाल थांबवलेली आहे
Paused. Rest your hand, then resume.|रुका हुआ है। हाथ को आराम दें, फिर जारी रखें।|थांबवले आहे. हाताला विश्रांती द्या, नंतर पुन्हा सुरू करा.
Waiting for sensor data. Your activity is on hold.|सेंसर डेटा की प्रतीक्षा। गतिविधि रुकी हुई है।|सेन्सर डेटाची प्रतीक्षा. खेळ थांबवलेला आहे.
Now open your hand to release the fruit.|अब फल छोड़ने के लिए हाथ खोलें।|आता फळ सोडण्यासाठी हात उघडा.
Well done. Let your hand relax.|बहुत अच्छा। हाथ को आराम दें।|छान केले. हात सैल सोडा.
Gently close your hand to pick the fruit.|फल पकड़ने के लिए हाथ धीरे बंद करें।|फळ पकडण्यासाठी हात हळू बंद करा.
Tilt your wrist gently to guide the balloon.|गुब्बारे को दिशा देने के लिए कलाई धीरे झुकाएँ।|फुग्याला दिशा देण्यासाठी मनगट हळू झुकवा.
Press Jump or the space bar to jump over the cactus.|कैक्टस के ऊपर से कूदने के लिए कूदें बटन या स्पेस बार दबाएँ।|निवडुंगावरून उडी मारण्यासाठी उडी बटण किंवा स्पेस बार दाबा.
Choose a finger on the hand diagram to begin.|शुरू करने के लिए हाथ के चित्र पर उँगली चुनें।|सुरू करण्यासाठी हाताच्या आकृतीवर बोट निवडा.
That’s okay. Try again whenever you feel ready.|कोई बात नहीं। तैयार होने पर फिर कोशिश करें।|हरकत नाही. तयार झाल्यावर पुन्हा प्रयत्न करा.
Let’s try that again|फिर कोशिश करें|पुन्हा प्रयत्न करूया
Take a moment to rest|थोड़ा आराम करें|थोडी विश्रांती घ्या
Waiting for your glove|आपके ग्लव की प्रतीक्षा|तुमच्या ग्लोव्हची प्रतीक्षा
Your progress is here. Continue when you feel ready.|आपकी प्रगति सुरक्षित है। तैयार होने पर जारी रखें।|तुमची प्रगती येथे आहे. तयार झाल्यावर पुढे सुरू करा.
The activity will continue when sensor data returns.|सेंसर डेटा वापस मिलने पर गतिविधि जारी होगी।|सेन्सर डेटा परत मिळाल्यावर खेळ पुढे सुरू होईल.
One gentle movement at a time|एक समय में एक हल्की गति|एका वेळी एक सौम्य हालचाल
FRUIT COLLECTED|इकट्ठे फल|गोळा केलेली फळे
BASKET|टोकरी|टोपली
Fruit picked|फल पकड़ा|फळ पकडले
Pick point|पकड़ने की जगह|पकडण्याची जागा
02 / RELEASE|02 / छोड़ें|02 / सोडा
01 / PICK|01 / पकड़ें|01 / पकडा
Gently open your hand|हाथ धीरे खोलें|हात हळू उघडा
Place the fruit in the basket.|फल टोकरी में रखें।|फळ टोपलीत ठेवा.
The fruit will wait for you.|फल आपका इंतज़ार करेगा।|फळ तुमची वाट पाहील.
Find your height. Float through.|सही ऊँचाई पर आकर आगे बढ़ें।|योग्य उंची गाठून पुढे जा.
RINGS REACHED|पार किए घेरे|गाठलेली कडी
Hold steady|स्थिर रहें|स्थिर रहा
Tilt up to rise|ऊपर जाने के लिए ऊपर झुकाएँ|वर जाण्यासाठी वर झुकवा
Tilt down to descend|नीचे जाने के लिए नीचे झुकाएँ|खाली जाण्यासाठी खाली झुकवा
Stay inside the ring for a moment.|कुछ देर घेरे के भीतर रहें।|थोडा वेळ कड्यात स्थिर रहा.
Small wrist movements are enough.|कलाई की छोटी गतिविधियाँ पर्याप्त हैं।|मनगटाच्या छोट्या हालचाली पुरेशा आहेत.
Ring reached. Well done.|घेरा प्राप्त। बहुत अच्छा।|कडे गाठले. छान केले.
NEXT RING|अगला घेरा|पुढील कडे
Waiting for your jump|आपकी छलाँग की प्रतीक्षा|तुमच्या उडीची प्रतीक्षा
One jump, then relax.|एक छलाँग, फिर आराम।|एक उडी, मग सैल सोडा.
Resting position set|विश्राम स्थिति सेट हुई|विश्रांतीची स्थिती ठरवली
Rising|ऊपर जा रहा है|वर जात आहे
Descending|नीचे जा रहा है|खाली जात आहे
Hand closed · ready to catch|हाथ बंद · पकड़ने के लिए तैयार|हात बंद · पकडण्यासाठी तयार
Keep moving gently|धीरे-धीरे हलाते रहें|हळूहळू हलवत रहा
Select a finger on the hand diagram.|हाथ के चित्र पर उँगली चुनें।|हाताच्या आकृतीवर बोट निवडा.
Finger lifted · lower it before the next jump|उँगली उठी हुई · अगली छलाँग से पहले नीचे करें|बोट उचललेले · पुढील उडीपूर्वी खाली करा
Finger resting · ready to lift|उँगली विश्राम में · उठाने के लिए तैयार|बोट विश्रांतीत · उचलण्यासाठी तयार
Keep lifting gently|धीरे-धीरे उठाते रहें|हळूहळू उचलत रहा
Button practice selected. No sensor calibration needed.|बटन से अभ्यास चुना गया। सेंसर कैलिब्रेशन की ज़रूरत नहीं है।|बटणांनी सराव निवडला आहे. सेन्सर कॅलिब्रेशनची गरज नाही.
The request could not be completed.|अनुरोध पूरा नहीं हुआ।|विनंती पूर्ण झाली नाही.
Choose one of the five exercises.|पाँच व्यायामों में से एक चुनें।|पाच व्यायामांपैकी एक निवडा.
Waiting for fresh sensor readings. Connect your glove or select simulated data.|नई सेंसर रीडिंग की प्रतीक्षा। ग्लव कनेक्ट करें या सिम्युलेटेड डेटा चुनें।|नवीन सेन्सर मोजमापांची प्रतीक्षा. ग्लोव्ह जोडा किंवा सिम्युलेटेड डेटा निवडा.
The glove is disconnected.|ग्लव डिस्कनेक्ट है।|ग्लोव्ह जोडलेला नाही.
Waiting for all sensors needed by this exercise.|इस व्यायाम के सभी आवश्यक सेंसर की प्रतीक्षा।|या व्यायामासाठी आवश्यक सर्व सेन्सरची प्रतीक्षा.
This session is no longer active.|यह सत्र अब सक्रिय नहीं है।|हे सत्र आता सक्रिय नाही.
No sessions recorded yet. Start your first session!|अभी कोई सत्र दर्ज नहीं है। अपना पहला सत्र शुरू करें!|अद्याप सत्र नोंदवलेले नाही. तुमचे पहिले सत्र सुरू करा!
Failed to load history.|इतिहास लोड नहीं हुआ।|इतिहास लोड झाला नाही.
Connected|कनेक्ट है|जोडलेले
Receiving data|डेटा मिल रहा है|डेटा मिळत आहे
Idle|निष्क्रिय|निष्क्रिय
Live glove|लाइव ग्लव|थेट ग्लोव्ह
Demo mode|डेमो मोड|डेमो मोड
GRASP|पकड़|पकड
CLOSE|बंद|बंद
OPEN|खुला|उघडा
REST|विश्राम|विश्रांती
UNKNOWN|अज्ञात|अज्ञात
UNCERTAIN|अनिश्चित|अनिश्चित
PINCH|चुटकी की पकड़|चिमटीची पकड
WRIST_FLEX|कलाई नीचे मोड़ना|मनगट खाली वाकवणे
WRIST_EXT|कलाई ऊपर मोड़ना|मनगट वर वाकवणे
ACTIVE_ATTEMPT|सक्रिय प्रयास|सक्रिय प्रयत्न
MOVEMENT_WITHOUT_ACTIVATION|मांसपेशी सक्रियता के बिना गति|स्नायू सक्रियतेशिवाय हालचाल
ATTEMPT_WITHOUT_MOVEMENT|गति के बिना प्रयास|हालचालीशिवाय प्रयत्न
A long bone in the palm that connects the wrist to the base of a finger.|हथेली की लंबी हड्डी जो कलाई को उँगली के आधार से जोड़ती है।|तळहातातील लांब हाड जे मनगटाला बोटाच्या मुळाशी जोडते.
A finger bone. The thumb has two phalanges; each of the other four fingers has three.|उँगली की हड्डी। अंगूठे में दो और अन्य चार उँगलियों में तीन-तीन हड्डियाँ होती हैं।|बोटाचे हाड. अंगठ्यात दोन आणि इतर चार बोटांत प्रत्येकी तीन हाडे असतात.
One of the eight carpal bones that form the wrist and connect the forearm to the palm.|कलाई बनाने और अग्रबाहु को हथेली से जोड़ने वाली आठ कार्पल हड्डियों में से एक।|मनगट बनवणाऱ्या आणि अग्रबाहूला तळहाताशी जोडणाऱ्या आठ कार्पल हाडांपैकी एक.
The IMU tracks wrist orientation. It does not measure the movement of individual wrist bones.|IMU कलाई की दिशा मापता है। यह कलाई की हर हड्डी की गति अलग से नहीं मापता।|IMU मनगटाची दिशा मोजतो. तो मनगटाच्या प्रत्येक हाडाची हालचाल स्वतंत्रपणे मोजत नाही.
Muscles between the metacarpal bones help spread the fingers apart or bring them together.|मेटाकार्पल हड्डियों के बीच की मांसपेशियाँ उँगलियाँ फैलाने और पास लाने में मदद करती हैं।|मेटाकार्पल हाडांमधील स्नायू बोटे पसरवण्यास किंवा जवळ आणण्यास मदत करतात.
Small hand muscles help bend the knuckles while straightening the finger joints.|हाथ की छोटी मांसपेशियाँ उँगलियों के जोड़ सीधे रखते हुए पोर मोड़ने में मदद करती हैं।|हाताचे छोटे स्नायू बोटांचे सांधे सरळ ठेवून मुळाचे सांधे वाकवण्यास मदत करतात.
Part of the thumb movement system, supporting positioning, bending or grip.|अंगूठे की गति प्रणाली का हिस्सा, जो स्थिति, मुड़ने या पकड़ में मदद करता है।|अंगठ्याच्या हालचाल प्रणालीचा भाग, जो स्थिती, वाकणे किंवा पकड यांना मदत करतो.
Part of the little finger movement system, supporting positioning and grip.|छोटी उँगली की गति प्रणाली का हिस्सा, जो स्थिति और पकड़ में मदद करता है।|करंगळीच्या हालचाल प्रणालीचा भाग, जो स्थिती आणि पकड यांना मदत करतो.
A forearm muscle whose tendon carries force toward the wrist or fingers. Show the forearm layer to explore its full length.|अग्रबाहु की मांसपेशी जिसका कंडरा कलाई या उँगलियों तक बल पहुँचाता है। पूरी लंबाई देखने के लिए अग्रबाहु की परत दिखाएँ।|अग्रबाहूचा स्नायू ज्याचा कंडर मनगट किंवा बोटांपर्यंत बल पोहोचवतो. पूर्ण लांबी पाहण्यासाठी अग्रबाहूचा स्तर दाखवा.
A muscle structure involved in coordinating hand movement.|हाथ की गति के समन्वय में शामिल मांसपेशी संरचना।|हाताच्या हालचालींच्या समन्वयात सहभागी स्नायूची रचना.
Flex sensors show finger bending, the FSR shows contact pressure, and the IMU shows wrist orientation. These readings do not identify which individual muscle is active.|फ्लेक्स सेंसर उँगलियों का मुड़ना, FSR संपर्क दबाव और IMU कलाई की दिशा दिखाता है। इनसे किसी एक मांसपेशी की सक्रियता की पहचान नहीं होती।|फ्लेक्स सेन्सर बोटे वाकणे, FSR संपर्क दाब आणि IMU मनगटाची दिशा दाखवतो. यावरून कोणता स्वतंत्र स्नायू सक्रिय आहे हे ओळखता येत नाही.
Scaphoid|स्कैफॉइड|स्कॅफॉइड
Lunate|ल्यूनेट|ल्यूनेट
Triquetrum|ट्राइक्वेट्रम|ट्रायक्वेट्रम
Pisiform|पिसीफॉर्म|पिसीफॉर्म
Trapezium|ट्रैपीज़ियम|ट्रॅपीझियम
Trapezoid|ट्रैपीज़ॉइड|ट्रॅपीझॉइड
Capitate|कैपिटेट|कॅपिटेट
Hamate|हैमेट|हॅमेट
First metacarpal|पहली मेटाकार्पल हड्डी|पहिले मेटाकार्पल हाड
Second metacarpal|दूसरी मेटाकार्पल हड्डी|दुसरे मेटाकार्पल हाड
Third metacarpal|तीसरी मेटाकार्पल हड्डी|तिसरे मेटाकार्पल हाड
Fourth metacarpal|चौथी मेटाकार्पल हड्डी|चौथे मेटाकार्पल हाड
Fifth metacarpal|पाँचवीं मेटाकार्पल हड्डी|पाचवे मेटाकार्पल हाड
Abductor pollicis brevis|एब्डक्टर पॉलिसिस ब्रेविस|अॅब्डक्टर पॉलिसिस ब्रेविस
Opponens pollicis|ओपोनेन्स पॉलिसिस|ओपोनेन्स पॉलिसिस
Flexor pollicis brevis|फ्लेक्सर पॉलिसिस ब्रेविस|फ्लेक्सर पॉलिसिस ब्रेविस
superficial head|सतही भाग|वरचा भाग
Abductor digiti minimi of hand|हाथ की एब्डक्टर डिजिटी मिनिमी|हाताचा अॅब्डक्टर डिजिटी मिनिमी
Flexor digiti minimi brevis of hand|हाथ की फ्लेक्सर डिजिटी मिनिमी ब्रेविस|हाताचा फ्लेक्सर डिजिटी मिनिमी ब्रेविस
Opponens digiti minimi of hand|हाथ की ओपोनेन्स डिजिटी मिनिमी|हाताचा ओपोनेन्स डिजिटी मिनिमी
Dorsal interossei of hand|हाथ की डॉर्सल इंटरॉसिआई|हाताचे डॉर्सल इंटरॉसिआई
Palmar interossei of hand|हाथ की पाल्मर इंटरॉसिआई|हाताचे पाल्मर इंटरॉसिआई
Lumbricals of hand|हाथ की लुम्ब्रिकल्स|हाताचे लुम्ब्रिकल्स
group|समूह|गट
Adductor pollicis|एडक्टर पॉलिसिस|अॅडक्टर पॉलिसिस
oblique head|तिरछा भाग|तिरपा भाग
transverse head|अनुप्रस्थ भाग|आडवा भाग
Flexor carpi radialis|फ्लेक्सर कार्पी रेडियालिस|फ्लेक्सर कार्पी रेडियालिस
Palmaris longus|पाल्मारिस लॉन्गस|पाल्मारिस लॉन्गस
Extensor carpi radialis longus|एक्सटेंसर कार्पी रेडियालिस लॉन्गस|एक्स्टेन्सर कार्पी रेडियालिस लॉन्गस
Extensor carpi radialis brevis|एक्सटेंसर कार्पी रेडियालिस ब्रेविस|एक्स्टेन्सर कार्पी रेडियालिस ब्रेविस
Flexor digitorum profundus|फ्लेक्सर डिजिटोरम प्रोफंडस|फ्लेक्सर डिजिटोरम प्रोफंडस
Flexor pollicis longus|फ्लेक्सर पॉलिसिस लॉन्गस|फ्लेक्सर पॉलिसिस लॉन्गस

View direction|दृश्य की दिशा|दृश्याची दिशा
Interactive right-hand anatomy. Drag to rotate; use the structure list to select a bone or muscle.|दाएँ हाथ की इंटरैक्टिव संरचना। घुमाने के लिए खींचें; हड्डी या मांसपेशी चुनने के लिए सूची इस्तेमाल करें।|उजव्या हाताची संवादात्मक रचना. फिरवण्यासाठी ओढा; हाड किंवा स्नायू निवडण्यासाठी यादी वापरा.
Camera controls|कैमरा नियंत्रण|कॅमेरा नियंत्रणे
Zoom in|ज़ूम बढ़ाएँ|झूम वाढवा
Zoom out|ज़ूम घटाएँ|झूम कमी करा
Structure category|संरचना की श्रेणी|रचनेचा प्रकार
Hand structures|हाथ की संरचनाएँ|हाताच्या रचना
Five finger sensor channels|पाँच उँगलियों के सेंसर चैनल|पाच बोटांचे सेन्सर चॅनेल
Choose one of five exercises|पाँच व्यायामों में से एक चुनें|पाच व्यायामांपैकी एक निवडा
Right-hand opening and closing demonstration|दायाँ हाथ खोलने और बंद करने का प्रदर्शन|उजवा हात उघडणे व बंद करण्याचे प्रात्यक्षिक
Live right hand driven only by sensor readings|केवल सेंसर रीडिंग से चलने वाला दायाँ हाथ|फक्त सेन्सर मोजमापांनुसार हलणारा उजवा हात
Daily average target achievement for the selected exercise|चुने व्यायाम की दैनिक औसत लक्ष्य प्राप्ति|निवडलेल्या व्यायामाची दैनंदिन सरासरी लक्ष्य प्राप्ती
Collapse navigation|नेविगेशन समेटें|नेव्हिगेशन आटोपते करा
Close navigation|नेविगेशन बंद करें|नेव्हिगेशन बंद करा
Patient menu|रोगी मेन्यू|रुग्ण मेनू
Main navigation|मुख्य नेविगेशन|मुख्य नेव्हिगेशन
Front View|सामने का दृश्य|समोरील दृश्य
Back / Dorsal View|पीछे का दृश्य|मागील दृश्य
Side View|बगल का दृश्य|बाजूचे दृश्य
Interactive right hand reflecting finger flexion and wrist movement|उँगलियों और कलाई की गति दिखाने वाला दायाँ हाथ|बोटे व मनगटाची हालचाल दाखवणारा उजवा हात
Wrist and resting positions|कलाई और विश्राम की स्थितियाँ|मनगट आणि विश्रांतीच्या स्थिती
Recent model confidence trend|मॉडल की विश्वसनीयता का हालिया रुझान|मॉडेलच्या विश्वास पातळीचा अलीकडील कल
Rehabilitation activities|पुनर्वास गतिविधियाँ|पुनर्वसन खेळ
Choose a finger on the right hand|दाएँ हाथ पर उँगली चुनें|उजव्या हातावर बोट निवडा
Sensor-controlled rehabilitation activity|सेंसर से नियंत्रित पुनर्वास गतिविधि|सेन्सरवर चालणारा पुनर्वसन खेळ
Current activity progress|वर्तमान गतिविधि की प्रगति|सध्याच्या खेळाची प्रगती
Activity instructions and controls|गतिविधि के निर्देश और नियंत्रण|खेळाच्या सूचना आणि नियंत्रणे
Activity input|गतिविधि का इनपुट|खेळाचा इनपुट
Reps|दोहराव|पुनरावृत्ती
Loading history...|इतिहास लोड हो रहा है...|इतिहास लोड होत आहे...
Loading session history...|सत्र का इतिहास लोड हो रहा है...|सत्रांचा इतिहास लोड होत आहे...
Unsaved calibration changes|कैलिब्रेशन के बदलाव सहेजे नहीं गए|कॅलिब्रेशनचे बदल जतन केलेले नाहीत
Save when you’re ready to use these readings.|इन रीडिंग का उपयोग करने के लिए तैयार होने पर सहेजें।|ही मोजमापे वापरण्यास तयार असाल तेव्हा जतन करा.
Your last saved values have been restored.|पिछली सहेजी गई रीडिंग वापस लाई गई हैं।|मागील जतन केलेली मूल्ये परत आणली आहेत.
Check your finger readings|उँगलियों की रीडिंग जाँचें|बोटांची मोजमापे तपासा
Use two different readings between 0 and 4095 for each finger.|हर उँगली के लिए 0 से 4095 के बीच दो अलग रीडिंग दें।|प्रत्येक बोटासाठी 0 ते 4095 दरम्यानची दोन वेगळी मोजमापे द्या.
Check your thresholds|सिग्नल की सीमाएँ जाँचें|संकेतांच्या मर्यादा तपासा
Enter a non-negative EMG threshold and an FSR reading between 0 and 4095.|EMG सीमा शून्य या अधिक और FSR रीडिंग 0 से 4095 के बीच दर्ज करें।|EMG मर्यादा शून्य किंवा अधिक आणि FSR मोजमाप 0 ते 4095 दरम्यान द्या.
Saving calibration|कैलिब्रेशन सहेजा जा रहा है|कॅलिब्रेशन जतन होत आहे
Applying your readings to this profile.|इस प्रोफ़ाइल पर आपकी रीडिंग लागू हो रही हैं।|या प्रोफाइलवर तुमची मोजमापे लागू होत आहेत.
Your readings could not be saved. Please try again.|रीडिंग सहेजी नहीं गईं। फिर कोशिश करें।|मोजमापे जतन झाली नाहीत. पुन्हा प्रयत्न करा.
Newer changes are not saved|नए बदलाव सहेजे नहीं गए|नवीन बदल जतन केलेले नाहीत
The submitted readings were saved. Save again to apply your latest edits.|भेजी गई रीडिंग सहेजी गई हैं। नए बदलाव लागू करने के लिए फिर सहेजें।|पाठवलेली मोजमापे जतन झाली. नवीन बदल लागू करण्यासाठी पुन्हा जतन करा.
Your hand mirror and sensor readings now use these values.|हाथ का दृश्य और सेंसर रीडिंग अब इन मानों का उपयोग करते हैं।|हाताचे दृश्य आणि सेन्सर मोजमापे आता ही मूल्ये वापरतात.
Calibration not saved|कैलिब्रेशन सहेजा नहीं गया|कॅलिब्रेशन जतन झाले नाही
Your changes are still here. Check the connection and try again.|बदलाव सुरक्षित हैं। कनेक्शन जाँचकर फिर कोशिश करें।|तुमचे बदल येथे आहेत. जोडणी तपासून पुन्हा प्रयत्न करा.
Your first personal best. A lovely start.|आपका पहला सर्वोच्च स्कोर। अच्छी शुरुआत।|तुमचे पहिले सर्वोत्तम गुण. छान सुरुवात.
You matched your personal best. Well done.|आपने अपने सर्वोच्च स्कोर की बराबरी की। बहुत अच्छा।|तुम्ही सर्वोत्तम गुणांची बरोबरी केली. छान केले.
A good movement. Well done.|अच्छी गतिविधि। बहुत अच्छा।|छान हालचाल. छान केले.
New personal best|नया सर्वोच्च स्कोर|नवीन सर्वोत्तम गुण
First personal best|पहला सर्वोच्च स्कोर|पहिले सर्वोत्तम गुण
Personal best matched|सर्वोच्च स्कोर की बराबरी|सर्वोत्तम गुणांची बरोबरी
Still learning your movement|आपकी गति समझी जा रही है|तुमची हालचाल समजून घेत आहे
Jump when you feel ready|तैयार होने पर कूदें|तयार झाल्यावर उडी मारा
JUMPS COMPLETED|पूरी की गई छलाँगें|पूर्ण झालेल्या उड्या
1. Investigational Device Software Exemption|1. अनुसंधान उपकरण सॉफ्टवेयर छूट|1. संशोधन उपकरण सॉफ्टवेअर सूट
The NeuroGlove Multimodal Edge-AI Rehabilitation System is provided for clinical investigation, neuromuscular rehabilitation research, and qualified physiological monitoring under institutional clinical protocols compliant with IEC 62304 / ISO 13485 guidelines.|NeuroGlove मल्टीमोडल एज-AI पुनर्वास प्रणाली IEC 62304 / ISO 13485 दिशानिर्देशों के अनुरूप संस्थागत चिकित्सकीय प्रोटोकॉल के अंतर्गत चिकित्सकीय अनुसंधान, तंत्रिका-मांसपेशीय पुनर्वास अनुसंधान और योग्य शारीरिक निगरानी के लिए प्रदान की गई है।|NeuroGlove मल्टीमोडल एज-AI पुनर्वसन प्रणाली IEC 62304 / ISO 13485 मार्गदर्शक तत्त्वांशी सुसंगत संस्थात्मक वैद्यकीय प्रोटोकॉलनुसार वैद्यकीय संशोधन, मज्जासंस्था-स्नायू पुनर्वसन संशोधन आणि योग्य शारीरिक निरीक्षणासाठी दिली आहे.
2. Professional Clinical Oversight|2. पेशेवर चिकित्सकीय देखरेख|2. व्यावसायिक वैद्यकीय देखरेख
All motor training sessions, range-of-motion assessments, and biofeedback routines must be conducted under the direction of a certified physical therapist, occupational therapist, or licensed rehabilitation clinician. Software metrics represent assistive biomechanical estimations and do not substitute for formal diagnostic evaluations.|सभी गति-प्रशिक्षण सत्र, गति-सीमा आकलन और बायोफीडबैक अभ्यास प्रमाणित फिजियोथेरेपिस्ट, ऑक्युपेशनल थेरेपिस्ट या लाइसेंसधारी पुनर्वास चिकित्सक के निर्देशन में किए जाने चाहिए। सॉफ्टवेयर के माप सहायक जैव-यांत्रिक अनुमान हैं और औपचारिक निदान का विकल्प नहीं हैं।|सर्व हालचाल प्रशिक्षण सत्रे, हालचालींच्या व्याप्तीचे मूल्यमापन आणि बायोफीडबॅक सराव प्रमाणित फिजिओथेरपिस्ट, ऑक्युपेशनल थेरपिस्ट किंवा परवानाधारक पुनर्वसन चिकित्सक यांच्या मार्गदर्शनाखाली करावेत. सॉफ्टवेअर मोजमापे ही सहाय्यक जैवयांत्रिक अनुमाने असून औपचारिक निदानाचा पर्याय नाहीत.
3. Hardware Operating Tolerances & Safety Cutoffs|3. हार्डवेयर संचालन सीमाएँ और सुरक्षा रोक|3. हार्डवेअर कार्यमर्यादा आणि सुरक्षा बंद व्यवस्था
Ensure all 5 flex sensor channels, MPU-6050 IMU, sEMG differential leads, and palmar FSR sensors undergo zero-point calibration before patient engagement. In the event of skin irritation, sensory fatigue, or hardware telemetry desynchronization, immediately terminate the active session and power down the glove controller.|रोगी के उपयोग से पहले सभी 5 फ्लेक्स सेंसर चैनल, MPU-6050 IMU, sEMG डिफरेंशियल लीड और हथेली के FSR सेंसर का शून्य-बिंदु कैलिब्रेशन करें। त्वचा में जलन, संवेदनात्मक थकान या हार्डवेयर टेलीमेट्री में तालमेल न होने पर सक्रिय सत्र तुरंत समाप्त करें और ग्लव नियंत्रक बंद करें।|रुग्णाच्या वापरापूर्वी सर्व 5 फ्लेक्स सेन्सर चॅनेल, MPU-6050 IMU, sEMG डिफरेंशियल लीड आणि तळहाताचे FSR सेन्सर यांचे शून्य-बिंदू कॅलिब्रेशन करा. त्वचेची जळजळ, संवेदनात्मक थकवा किंवा हार्डवेअर टेलिमेट्रीचा ताळमेळ बिघडल्यास सक्रिय सत्र त्वरित थांबवा आणि ग्लोव्ह नियंत्रक बंद करा.
4. Calibration & Signal Integrity|4. कैलिब्रेशन और सिग्नल की अखंडता|4. कॅलिब्रेशन आणि संकेतांची अखंडता
Analog-to-digital conversions (ADC) and surface electromyography envelopes are calibrated per individual subject anatomy. Data collected with uncalibrated sensors must not be utilized for longitudinal clinical progress scoring.|एनालॉग-टू-डिजिटल रूपांतरण (ADC) और सतही इलेक्ट्रोमायोग्राफी एनवेलप का कैलिब्रेशन प्रत्येक व्यक्ति की शारीरिक संरचना के अनुसार होता है। बिना कैलिब्रेशन वाले सेंसर का डेटा दीर्घकालिक चिकित्सकीय प्रगति के अंकन के लिए उपयोग नहीं करना चाहिए।|अनालॉग-टू-डिजिटल रूपांतरणे (ADC) आणि पृष्ठीय इलेक्ट्रोमायोग्राफी एन्व्हलप यांचे कॅलिब्रेशन प्रत्येक व्यक्तीच्या शरीररचनेनुसार केले जाते. कॅलिब्रेशन न केलेल्या सेन्सरचा डेटा दीर्घकालीन वैद्यकीय प्रगतीच्या गुणांकनासाठी वापरू नये.
1. Protected Health Information (PHI) De-Identification|1. संरक्षित स्वास्थ्य जानकारी (PHI) की पहचान हटाना|1. संरक्षित आरोग्य माहितीची (PHI) ओळख काढणे
In accordance with 45 CFR § 164.514 (HIPAA Privacy Rule), all kinematic session logs, flex angles, EMG root-mean-square values, and motor attempt classifications are recorded against pseudo-anonymized Session IDs. No direct patient identifiers (name, MRN, date of birth) are transmitted over unencrypted telemetry channels.|45 CFR § 164.514 (HIPAA गोपनीयता नियम) के अनुसार सभी गति-सत्र लॉग, फ्लेक्स कोण, EMG रूट-मीन-स्क्वायर मान और गति-प्रयास श्रेणियाँ छद्म-अनाम सत्र ID के साथ दर्ज की जाती हैं। सीधे रोगी पहचानकर्ता (नाम, MRN, जन्मतिथि) बिना एन्क्रिप्शन वाले टेलीमेट्री चैनलों पर नहीं भेजे जाते।|45 CFR § 164.514 (HIPAA गोपनीयता नियम) नुसार सर्व हालचाल सत्र नोंदी, फ्लेक्स कोन, EMG रूट-मीन-स्क्वेअर मूल्ये आणि हालचाल प्रयत्न वर्गीकरणे छद्म-अनाम सत्र ID सह नोंदवली जातात. थेट रुग्ण ओळखचिन्हे (नाव, MRN, जन्मतारीख) एन्क्रिप्शन नसलेल्या टेलिमेट्री चॅनेलवर पाठवली जात नाहीत.
2. Local Edge Architecture & Data Locality|2. स्थानीय एज आर्किटेक्चर और डेटा स्थान|2. स्थानिक एज रचना आणि डेटाचे स्थान
All machine learning inference (Random Forest classifier and EMG envelope feature extraction) operates on-premise at the edge controller (Raspberry Pi / local workstation). No biomechanical raw time-series feeds are uploaded to third-party public cloud endpoints.|सभी मशीन लर्निंग अनुमान (रैंडम फॉरेस्ट क्लासिफायर और EMG एनवेलप फीचर निष्कर्षण) स्थानीय एज नियंत्रक (Raspberry Pi / स्थानीय वर्कस्टेशन) पर चलते हैं। जैव-यांत्रिक कच्चा समय-श्रृंखला डेटा तीसरे पक्ष के सार्वजनिक क्लाउड पर अपलोड नहीं किया जाता।|सर्व मशीन लर्निंग अनुमाने (रँडम फॉरेस्ट वर्गीकरण आणि EMG एन्व्हलप वैशिष्ट्य निष्कर्षण) स्थानिक एज नियंत्रकावर (Raspberry Pi / स्थानिक वर्कस्टेशन) चालतात. जैवयांत्रिक मूळ कालमालिका डेटा तृतीय पक्षाच्या सार्वजनिक क्लाउडवर अपलोड केला जात नाही.
3. Secure Local Transport & Logging|3. सुरक्षित स्थानीय संचार और लॉगिंग|3. सुरक्षित स्थानिक वहन आणि नोंदी
Telemetry between the ESP32 wearable acquisition node and the workstation broker utilizes TLS-authenticated MQTT protocols. Local SQLite history records reside solely on the physical workstation filesystem under authenticated clinical user accounts.|ESP32 पहनने योग्य डेटा-संग्रह नोड और वर्कस्टेशन ब्रोकर के बीच टेलीमेट्री TLS-प्रमाणित MQTT प्रोटोकॉल का उपयोग करती है। स्थानीय SQLite इतिहास केवल भौतिक वर्कस्टेशन की फाइल प्रणाली में प्रमाणित चिकित्सकीय उपयोगकर्ता खातों के अंतर्गत रहता है।|ESP32 परिधान करण्यायोग्य डेटा-संकलन नोड आणि वर्कस्टेशन ब्रोकर यांतील टेलिमेट्री TLS-प्रमाणित MQTT प्रोटोकॉल वापरते. स्थानिक SQLite इतिहास फक्त भौतिक वर्कस्टेशनच्या फाइल प्रणालीमध्ये प्रमाणित वैद्यकीय वापरकर्ता खात्यांखाली राहतो.
4. Patient Rights of Inspection & Erasure|4. रोगी के निरीक्षण और डेटा मिटाने के अधिकार|4. रुग्णाचे तपासणी आणि डेटा पुसण्याचे अधिकार
Under clinical research standards, patients or their legal guardians may request an export or secure erasure of their rehabilitation trajectory logs at any time through the workstation administration console.|चिकित्सकीय अनुसंधान मानकों के अंतर्गत रोगी या उनके कानूनी अभिभावक वर्कस्टेशन प्रशासन कंसोल के माध्यम से किसी भी समय पुनर्वास प्रगति लॉग के निर्यात या सुरक्षित रूप से मिटाने का अनुरोध कर सकते हैं।|वैद्यकीय संशोधन मानकांनुसार रुग्ण किंवा त्यांचे कायदेशीर पालक वर्कस्टेशन प्रशासन कन्सोलद्वारे पुनर्वसन प्रगती नोंदी निर्यात करण्याची किंवा सुरक्षितपणे पुसण्याची विनंती कधीही करू शकतात.

Press Jump to jump|कूदने के लिए कूदें बटन दबाएँ|उडी मारण्यासाठी उडी बटण दाबा
Press Jump or use the space bar. No glove needed.|कूदें बटन या स्पेस बार दबाएँ। ग्लव की ज़रूरत नहीं है।|उडी बटण किंवा स्पेस बार वापरा. ग्लोव्हची गरज नाही.
Use the buttons below. No glove needed.|नीचे के बटन इस्तेमाल करें। ग्लव की ज़रूरत नहीं है।|खालील बटणे वापरा. ग्लोव्हची गरज नाही.
Choose finger|उँगली चुनें|बोट निवडा
Your first personal best. A lovely start.|आपका पहला सर्वोच्च स्कोर। अच्छी शुरुआत।|तुमचे पहिले सर्वोत्तम गुण. छान सुरुवात.
Active Contraction|सक्रिय संकुचन|सक्रिय आकुंचन
Baseline|आधार स्तर|मूळ पातळी
Firm Contact|मज़बूत संपर्क|घट्ट स्पर्श
No Contact|संपर्क नहीं|स्पर्श नाही
The 3D library could not load.|3D लाइब्रेरी लोड नहीं हुई।|3D लायब्ररी लोड झाली नाही.
The anatomy collection could not load.|शरीर रचना का संग्रह लोड नहीं हुआ।|शरीररचनेचा संग्रह लोड झाला नाही.
The anatomy collection is incomplete.|शरीर रचना का संग्रह अधूरा है।|शरीररचनेचा संग्रह अपूर्ण आहे.
Please try again.|फिर कोशिश करें।|पुन्हा प्रयत्न करा.
Refresh to retry.|फिर कोशिश के लिए पेज रीफ़्रेश करें।|पुन्हा प्रयत्नासाठी पान रीफ्रेश करा.
3D rendering was interrupted. Refresh to restore the viewer.|3D दृश्य बाधित हुआ। वापस लाने के लिए पेज रीफ़्रेश करें।|3D दृश्य खंडित झाले. पुन्हा दाखवण्यासाठी पान रीफ्रेश करा.
SESSION RESULTS|सत्र के परिणाम|सत्राचे निकाल
Your practice is complete|आपका अभ्यास पूरा हुआ|तुमचा सराव पूर्ण झाला
Your score|आपका स्कोर|तुमचा गुणांक
Highest score|सर्वोच्च स्कोर|सर्वाधिक गुण
Play again|फिर खेलें|पुन्हा खेळा
Exit to games|खेलों पर वापस जाएँ|खेळांकडे परत जा
Done|हो गया|झाले
New personal best. Well done.|नया व्यक्तिगत सर्वश्रेष्ठ। बहुत अच्छा।|नवीन वैयक्तिक सर्वोत्तम गुण. छान केले.
Every movement counts. Keep going at your own pace.|हर गतिविधि मायने रखती है। अपनी गति से जारी रखें।|प्रत्येक हालचाल महत्त्वाची आहे. आपल्या गतीने सुरू ठेवा.
Choose a finger|एक उंगली चुनें|एक बोट निवडा
Practice prediction|अभ्यास का अनुमान|सरावाच्या प्रगतीचा अंदाज
PROGRESS OUTLOOK|प्रगति का अनुमान|प्रगतीचा आढावा
See how your recent practice is moving toward your selected goal.|देखें कि आपका अभ्यास चुने हुए लक्ष्य की ओर कैसे बढ़ रहा है।|तुमचा अलीकडील सराव निवडलेल्या ध्येयाकडे कसा पुढे जात आहे ते पाहा.
ESTIMATED TIME TO GOAL|लक्ष्य तक पहुँचने का अनुमानित समय|ध्येय गाठण्यासाठी अंदाजे वेळ
Latest achievement|नवीनतम उपलब्धि|अलीकडील कामगिरी
Weekly pace|साप्ताहिक प्रगति|आठवड्याची प्रगती
Most recent practice day|अभ्यास का सबसे हाल का दिन|सरावाचा सर्वात अलीकडील दिवस
Percentage points / week|प्रतिशत अंक / सप्ताह|टक्के गुण / आठवडा
ACHIEVEMENT OVER TIME|समय के साथ प्रगति|कालावधीनुसार कामगिरी
Recorded|दर्ज किया गया|नोंदवलेले
Projected|अनुमानित|अंदाजित
Expected range|संभावित सीमा|अपेक्षित मर्यादा
Visible layers|दिखाई देने वाली परतें|दिसणारे थर
Quick isolate|भाग अलग दिखाएँ|निवडलेला भाग दाखवा
Skin opacity|त्वचा की अपारदर्शिता|त्वचेची अपारदर्शकता
Explore your hand|अपने हाथ की संरचना देखें|तुमच्या हाताची रचना जाणून घ्या
3D Hand Anatomy|हाथ की 3D संरचना|हाताची त्रिमितीय रचना
Full Hand|पूरा हाथ|संपूर्ण हात
Skin Only|केवल त्वचा|फक्त त्वचा
Anatomy Only|केवल आंतरिक संरचना|फक्त आतील रचना
Skin|त्वचा|त्वचा
Bones & Tendons|हड्डियाँ और कंडराएँ|हाडे आणि कंडरा
Muscles|मांसपेशियाँ|स्नायू
Cartilage & Sheaths|उपास्थि और आवरण|कूर्चा आणि आवरणे
Anatomy Library|शारीरिक संरचना की सूची|शरीररचनेची सूची
STEP 1 OF 4|चरण 1 / 4|टप्पा 1 / 4
STEP 2 OF 4|चरण 2 / 4|टप्पा 2 / 4
STEP 3 OF 4|चरण 3 / 4|टप्पा 3 / 4
STEP 4 OF 4|चरण 4 / 4|टप्पा 4 / 4
Hold a soft ball and squeeze|नरम गेंद पकड़कर दबाएँ|मऊ चेंडू हातात धरून दाबा
Hold steady pressure|एक समान दबाव बनाए रखें|दाब स्थिर ठेवा
Capture grip pressure|पकड़ का दबाव मापें|पकडीचा दाब मोजा
Finger and resting-pressure readings captured.|उंगलियों और आराम की स्थिति का दबाव माप लिया गया है।|बोटांचे आणि विश्रांतीतील दाबाचे मोजमाप घेतले आहे.
Rest your fingers naturally with no pressure on the FSR. Do not hold the ball yet. Keep your wrist still.|उंगलियाँ आराम से रखें और दबाव सेंसर पर कोई दबाव न दें। अभी गेंद न पकड़ें। कलाई स्थिर रखें।|बोटे नैसर्गिकपणे सैल ठेवा. दाब सेन्सरवर दाब देऊ नका. अजून चेंडू धरू नका. मनगट स्थिर ठेवा.
Place a soft ball against the pressure sensor in your palm. Squeeze firmly but comfortably and keep the same pressure for 3 seconds. This sets your personal pressure range.|हथेली के दबाव सेंसर पर नरम गेंद रखें। आराम से दबाएँ और 3 सेकंड तक दबाव स्थिर रखें। इससे आपकी दबाव सीमा तय होगी।|तळहातातील दाब सेन्सरवर मऊ चेंडू ठेवा. आरामात दाबा आणि 3 सेकंद दाब स्थिर ठेवा. यावरून तुमच्या पकडीच्या दाबाची मर्यादा ठरेल.
`;
    const phrases = new Map();
    const normalize = text => String(text).replace(/\s+/g,' ').trim();
    Object.keys(TRANSLATIONS.en).forEach(key => {
        const en=TRANSLATIONS.en[key];
        phrases.set(normalize(en).toLowerCase(), {en,hi:TRANSLATIONS.hi[key]||en,mr:TRANSLATIONS.mr[key]||en});
    });
    rows.trim().split('\n').forEach(row=>{const [en,hi,mr]=row.split('|');phrases.set(normalize(en).toLowerCase(),{en,hi,mr});});
    const patterns=[];
    function pattern(regex,hi,mr){patterns.push({regex,hi,mr});}
    function translate(value,depth=0){
        const original=String(value??''),text=normalize(original),lang=currentLang;
        if(lang==='en'||!text||depth>5)return original;
        const item=phrases.get(text.toLowerCase());if(item)return item[lang];
        for(const rule of patterns){const match=text.match(rule.regex);if(match)return rule[lang](...match.slice(1));}
        if(text.includes(' · '))return text.split(' · ').map(p=>translate(p,depth+1)).join(' · ');
        const numbered=text.match(/^(\d+\.?)\s+(.+)$/);if(numbered)return numbered[1]+' '+translate(numbered[2],depth+1);
        if(text.startsWith('At your pace: '))return (lang==='hi'?'अपनी गति से: ':'आपल्या गतीने: ')+translate(text.slice(14),depth+1);
        // IMU labels keep measured numbers and physical units untouched.
        if(/^Roll:/.test(text))return text.replace(/Roll|Pitch|Yaw/g,label=>translate(label,depth+1));
        if(text.endsWith('.') && phrases.has(text.slice(0,-1).toLowerCase()))return translate(text.slice(0,-1),depth+1)+'.';
        if(text.startsWith('. '))return '. '+translate(text.slice(2),depth+1);
        if(text.endsWith(' Refresh to retry.'))return translate(text.slice(0,-18),depth+1)+' '+translate('Refresh to retry.',depth+1);
        // Combined feedback can include a source label followed by a coverage paragraph.
        for(const prefix of ['Simulated data. ','Glove data. '])if(text.startsWith(prefix))return translate(prefix.slice(0,-2),depth+1)+'. '+translate(text.slice(prefix.length),depth+1);
        return original;
    }
    const tr=x=>translate(x);
    pattern(/^(\d+) visible structures?$/,n=>`${n} दृश्य संरचनाएँ`,n=>`${n} दिसणाऱ्या रचना`);
    pattern(/^(\d+) bones$/,n=>`${n} हड्डियाँ`,n=>`${n} हाडे`);
    pattern(/^(\d+) muscle structures$/,n=>`${n} मांसपेशी संरचनाएँ`,n=>`${n} स्नायू रचना`);
    pattern(/^(Thumb|Index|Middle finger|Ring|Little finger) (proximal|middle|distal) phalanx$/i,(finger,part)=>`${tr(finger)} की ${ {proximal:'निकटस्थ',middle:'मध्य',distal:'दूरस्थ'}[part]} हड्डी`,(finger,part)=>`${tr(finger)} चे ${ {proximal:'मुळाजवळचे',middle:'मधले',distal:'टोकाचे'}[part]} हाड`);
    pattern(/^Flex sensor (\d+) follows bending of the (.+)\. A single flex sensor measures the finger bend, rather than each joint separately\.$/,(n,f)=>`फ्लेक्स सेंसर ${n} ${tr(f)} का मुड़ना मापता है। एक सेंसर पूरी उँगली का मुड़ना मापता है, हर जोड़ को अलग नहीं।`,(n,f)=>`फ्लेक्स सेन्सर ${n} ${tr(f)} वाकणे मोजतो. एक सेन्सर पूर्ण बोट वाकणे मोजतो, प्रत्येक सांधा स्वतंत्रपणे नाही.`);
    pattern(/^Bend your (.+) finger, keeping the others relaxed, then return\.$/,f=>`${tr(f)} मोड़ें, अन्य उँगलियाँ आराम से रखें, फिर वापस लाएँ।`,f=>`${tr(f)} वाकवा, इतर बोटे सैल ठेवा, नंतर परत आणा.`);
    pattern(/^([+−-]?[\d.]+) percentage points from first to latest recorded day$/,n=>`पहले से अंतिम दर्ज दिन तक ${n} प्रतिशत अंकों का बदलाव`,n=>`पहिल्या ते शेवटच्या नोंदवलेल्या दिवसापर्यंत ${n} टक्के गुणांचा बदल`);
    pattern(/^(\d+) pts$/,n=>`${n} अंक`,n=>`${n} गुण`);
    pattern(/^(\d+) points$/,n=>`${n} अंक`,n=>`${n} गुण`);
    pattern(/^(\d+) movements completed$/,n=>`${n} गतिविधियाँ पूरी`,n=>`${n} हालचाली पूर्ण`);
    pattern(/^(\d+) targets achieved$/,n=>`${n} लक्ष्य प्राप्त`,n=>`${n} लक्ष्ये साध्य`);
    pattern(/^(\d+) reach-and-return attempts$/,n=>`${n} लक्ष्य तक पहुँचकर लौटने के प्रयास`,n=>`${n} लक्ष्य गाठून परत येण्याचे प्रयत्न`);
    pattern(/^([\d:]+) of measured practice$/,n=>`${n} मापा गया अभ्यास`,n=>`${n} मोजलेला सराव`);
    pattern(/^(\d+) points to your personal best\. Go at your own pace\.$/,n=>`सर्वोच्च स्कोर के लिए ${n} अंक और। अपनी गति से खेलें।`,n=>`सर्वोत्तम गुणांसाठी आणखी ${n} गुण. आपल्या गतीने खेळा.`);
    pattern(/^New personal best · (\d+) points above your previous best$/,n=>`नया सर्वोच्च स्कोर · पिछले से ${n} अंक अधिक`,n=>`नवीन सर्वोत्तम गुण · मागीलपेक्षा ${n} गुण अधिक`);
    pattern(/^Lift your (.+) to jump\. Lower it to get ready again\.$/,f=>`कूदने के लिए ${tr(f)} उठाएँ। अगली बार के लिए नीचे करें।`,f=>`उडीसाठी ${tr(f)} उचला. पुन्हा तयार होण्यासाठी खाली करा.`);
    pattern(/^Lift your (.+) to jump, then lower it to get ready again\.$/,f=>`कूदने के लिए ${tr(f)} उठाएँ, फिर नीचे करें।`,f=>`उडीसाठी ${tr(f)} उचला, नंतर खाली करा.`);
    pattern(/^Your (.+) is selected\. Start when you feel ready\.$/,f=>`${tr(f)} चुनी गई है। तैयार होने पर शुरू करें।`,f=>`${tr(f)} निवडले आहे. तयार झाल्यावर सुरू करा.`);
    pattern(/^Waiting for your (.+) sensor\. Rest it comfortably\.$/,f=>`${tr(f)} के सेंसर की प्रतीक्षा। आराम से रखें।`,f=>`${tr(f)} च्या सेन्सरची प्रतीक्षा. आरामात ठेवा.`);
    pattern(/^Resting position recorded for your (.+)\.$/,f=>`${tr(f)} की विश्राम स्थिति दर्ज हुई।`,f=>`${tr(f)} ची विश्रांतीची स्थिती नोंदवली.`);
    pattern(/^(.+) selected$/,f=>`${tr(f)} चयनित`,f=>`${tr(f)} निवडलेले`);
    pattern(/^(.+) lift$/,f=>`${tr(f)} का उठाव`,f=>`${tr(f)} उचलणे`);
    pattern(/^(.+), relaxed ADC reading$/,f=>`${tr(f)}, विश्राम स्थिति की ADC रीडिंग`,f=>`${tr(f)}, सैल स्थितीतील ADC मोजमाप`);
    pattern(/^(.+), closed ADC reading$/,f=>`${tr(f)}, बंद स्थिति की ADC रीडिंग`,f=>`${tr(f)}, बंद स्थितीतील ADC मोजमाप`);

    pattern(/^Lift your (.+) to jump$/,f=>`कूदने के लिए ${tr(f)} उठाएँ`,f=>`उडीसाठी ${tr(f)} उचला`);
    pattern(/^Well done\. (\d+) repetitions completed\.$/,n=>`बहुत अच्छा। ${n} दोहराव पूरे हुए।`,n=>`छान केले. ${n} पुनरावृत्ती पूर्ण झाल्या.`);
    pattern(/^([\d:]+) of practice(.*)$/,(time,result)=>`${time} अभ्यास${tr(result)}`,(time,result)=>`${time} सराव${tr(result)}`);
    pattern(/^New personal best \(([+\d]+) points\)$/,n=>`नया सर्वोच्च स्कोर (${n} अंक)`,n=>`नवीन सर्वोत्तम गुण (${n} गुण)`);
    pattern(/^Movement threshold (\d+)%$/,n=>`गति की सीमा ${n}%`,n=>`हालचालीची मर्यादा ${n}%`);
    pattern(/^Release at (\d+)%$/,n=>`${n}% पर छोड़ें`,n=>`${n}% वर सोडा`);
    pattern(/^(\d{4}-\d{2}-\d{2}): ([\d.]+)%, (\d+) sessions$/,(date,score,count)=>`${date}: ${score}%, ${count} सत्र`,(date,score,count)=>`${date}: ${score}%, ${count} सत्रे`);
    pattern(/^Kangaroo Hop: lift your chosen finger to jump over cacti$/,()=> 'कंगारू हॉप: कैक्टस के ऊपर से कूदने के लिए चुनी हुई उँगली उठाएँ',()=> 'कांगारू हॉप: निवडुंगावरून उडी मारण्यासाठी निवडलेले बोट उचला');
    pattern(/^The Orchard: close and open your hand to collect fruit$/,()=> 'फलों का बाग: फल इकट्ठा करने के लिए हाथ बंद करें और खोलें',()=> 'फळबाग: फळे गोळा करण्यासाठी हात बंद करा आणि उघडा');
    pattern(/^Sky Journey: tilt your wrist to guide the balloon$/,()=> 'आसमान की सैर: गुब्बारे को दिशा देने के लिए कलाई झुकाएँ',()=> 'आकाशाची सफर: फुग्याला दिशा देण्यासाठी मनगट झुकवा');
    pattern(/^Bend your (.+) toward your palm to jump\. Straighten it to get ready again\.$/,f=>`कूदने के लिए ${tr(f)} हथेली की ओर मोड़ें। फिर सीधी करें।`,f=>`उडीसाठी ${tr(f)} तळव्याकडे वाकवा. नंतर सरळ करा.`);
    pattern(/^Bend your (.+) toward your palm to jump, then straighten it to get ready again\.$/,f=>`कूदने के लिए ${tr(f)} हथेली की ओर मोड़ें, फिर सीधी करें।`,f=>`उडीसाठी ${tr(f)} तळव्याकडे वाकवा, नंतर सरळ करा.`);
    pattern(/^Bend your (.+) toward your palm to jump$/,f=>`कूदने के लिए ${tr(f)} हथेली की ओर मोड़ें`,f=>`उडीसाठी ${tr(f)} तळव्याकडे वाकवा`);
    pattern(/^(.+) bend$/,f=>`${tr(f)} मोड़`,f=>`${tr(f)} वाकवणे`);
    const textState=new WeakMap(),attributeState=new WeakMap();
    function translateNode(node){
        if(!node.parentElement||node.parentElement.closest('script,style,code,pre,textarea,[data-no-translate]'))return;
        const value=node.nodeValue,previous=textState.get(node);
        const source=previous&&value===previous.output?previous.source:value;
        const translated=translate(source),output=translated===source?source:source.replace(source.trim(),translated);
        textState.set(node,{source,output});if(value!==output)node.nodeValue=output;
    }
    function translateAttributes(element){
        let state=attributeState.get(element);if(!state){state={};attributeState.set(element,state);}
        for(const name of ['placeholder','title','aria-label']){
            if(!element.hasAttribute(name))continue;const value=element.getAttribute(name),old=state[name];
            const source=old&&value===old.output?old.source:value,output=translate(source);
            state[name]={source,output};if(value!==output)element.setAttribute(name,output);
        }
    }
    function walk(root){
        if(root.nodeType===3){translateNode(root);return;}
        if(root.nodeType!==1)return;
        if(root.matches('script,style,code,pre,textarea,[data-no-translate]'))return;
        translateAttributes(root);
        for(const child of root.childNodes)walk(child);
    }
    window.ngI18n={translate,apply(){if(document.body)walk(document.body);},get fontFamily(){return currentLang==='en'?'Poppins, Arial, sans-serif':'"NeuroGlove Devanagari", "Nirmala UI", sans-serif';}};
    document.addEventListener('DOMContentLoaded',()=>{
        document.documentElement.lang=currentLang;window.ngI18n.apply();
        new MutationObserver(records=>{
            const roots=new Set();for(const record of records){if(record.type==='characterData'||record.type==='attributes')roots.add(record.target);else for(const child of record.addedNodes)roots.add(child);}
            roots.forEach(walk);
        }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});
    });
})();
