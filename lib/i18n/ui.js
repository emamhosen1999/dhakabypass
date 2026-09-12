import { DEFAULT_LOCALE } from './locales.js';
import { UI_NS, stringKey, readUiOverride } from './overrides.js';

/**
 * THE FALLBACK COPY OF EVERY UI STRING. Since W1.6 the editable copy lives in
 * the `ui_strings` table and is edited at /admin/translations; this file is
 * what the site renders when the database has no row, no table, or no pulse.
 *
 * The header comment here used to read "Chrome strings only — page content
 * lives in the CMS, never here", and that was not true: the audit found the
 * complete contact-page prose, every travel-page H1 and lede, the newsroom and
 * gallery headings, and the provenance wording that appears 129 times across
 * the recovered content, all sitting in this file with no way to edit any of
 * it. It is now all editable, and the values below are the fallback.
 *
 * A KEY ADDED HERE IS EDITABLE AUTOMATICALLY — lib/i18n/catalogue.js derives
 * the admin screen's list from this file and lib/i18n/map-ui.js, and
 * db/sql/09-ui-strings.sql stores overrides only, so no seed and no schema
 * change follow a new key. What DOES follow it is a translation: give it `bn`
 * and `zh` values here as well, or it renders in English for every reader
 * until someone types them into /admin/translations.
 *
 * The reason the code values survive at all is unchanged, and is why the
 * database can only replace a string and never remove one: a link whose label
 * came from the database would disappear from the header the moment a query
 * failed — on a memory-limited host where every reader is written to degrade
 * rather than throw, that is a navigation bar that empties itself during an
 * outage.
 *
 * Bengali and Chinese are written by Claude and have NOT been reviewed by a
 * native speaker. That is the client's recorded decision
 * (docs/source-data/2026-09-03-client-decisions.md §3) and the open risk on the
 * site.
 */
export const UI = {
  en: {
    navTravel: 'Travel Info', navProject: 'Project', navImpact: 'Impact',
    navAbout: 'About', navNews: 'News', navContact: 'Contact',
    navSafety: 'Safety', navSustainability: 'Sustainability',
    navGovernance: 'Governance', navDisclosures: 'Disclosures',
    navTariff: 'Tariff notifications', navLandAcquisition: 'Land acquisition',
    navProcurement: 'Procurement', navGrievances: 'Grievances',
    footerNavLabel: 'Site sections', footerTravel: 'Travel',
    footerCompany: 'Company', footerDisclosure: 'Disclosure', footerContact: 'Contact',
    footerPrivacy: 'Privacy', footerTerms: 'Terms of use', footerAccessibility: 'Accessibility',
    pendingTag: 'Not yet published',
    legacyDataTag: 'Previous website information',
    legacyDataNotice: 'Recovered from the previous website. These details may have changed; use the form for general enquiries.',
    contactHeading: 'Contact DBEDC',
    contactIntro: 'Ask a question, report a problem on the expressway, or request a document.',
    contactWriteHeading: 'Send a message',
    contactWriteBody: 'Every message reaches DBEDC. Tell us where on the corridor, and when, if your message is about the road itself.',
    contactDetailsHeading: 'Office and telephone',
    contactDetailsPending: "For general enquiries, use the form below. The office address, public telephone, email and dedicated emergency hotline are awaiting confirmation.",
    contactOtherHeading: 'Other routes',
    contactOtherBody: 'A complaint about tolling, the road, land acquisition or a tender has its own route, with an account of what happens next.',
    formName: 'Your name', formEmail: 'Email address', formSubject: 'Subject',
    formMessage: 'Message', formSend: 'Send message', formSending: 'Sending…',
    formSentHeading: 'Message sent',
    formSentBody: 'Thank you. Your message has been recorded and will reach DBEDC.',
    formErrorRequired: 'Please give your name, an email address we can reply to, and a message.',
    formErrorUnavailable: 'Your message could not be recorded — nothing has been saved. Please try again shortly, or use another route to reach DBEDC.',
    /* Rate limiting (C-D16/C-S4). Deliberately says what happened and what to
       do, rather than a generic failure: a person reporting a hazard who is
       told only "something went wrong" has no reason to try a different route,
       and on a mobile network several unrelated people can share one address. */
    formErrorRateLimited: 'Several messages have already been sent from this connection. Please wait a few minutes before sending another. If this is urgent, use another route to reach DBEDC.',
    /* No character count in the copy on purpose — the limit lives in code, is
       enforced by the textarea's maxLength, and a number typed into two places
       drifts. */
    formErrorTooLong: 'Your message is longer than this form can record. Please shorten it, or send the detail by email.',
    formPrivacy: 'Your name and email are used only to answer you.',
    formHoneypot: 'Company (leave blank)',
    /* request-form block (INT.8): the tracked service request. */
    formPhone: 'Phone number', formVehicle: 'Vehicle registration number', formLocation: 'Where on the expressway',
    formContactEither: 'Give a phone number or an email address, so DBEDC can reach you.',
    requestErrorRequired: 'Please fill in the highlighted fields. Give a phone number or an email address so DBEDC can reach you.',
    requestSentHeading: 'Your request has been recorded',
    requestSentBody: 'DBEDC will contact you using the details you gave.',
    requestTrackingLabel: 'Tracking number', requestKeepNumber: 'Keep this number. Quote it in any follow-up.',
    requestKind_grievance: 'Lodge a grievance', requestKind_toll_dispute: 'Dispute a toll charge',
    requestKind_breakdown: 'Request breakdown assistance', requestKind_lost_found: 'Report lost or found property',
    requestKind_general: 'Make a request',
    /* newsletter-form and sitemap-list blocks. */
    newsletterHeading: 'Get operational notices by email',
    newsletterSubscribe: 'Subscribe', newsletterOk: 'Thank you. You are on the list.',
    newsletterInvalid: 'Please enter a valid email address.',
    newsletterNote: 'Your address is used only to send DBEDC notices, and you can ask to be removed at any time.',
    sitemapEmpty: 'No pages have been published yet.',
    pagingLabel: 'Pages of photographs',
    newsHeading: 'Newsroom',
    newsIntro: 'Announcements and operational notices from DBEDC.',
    newsEmpty: 'No items have been published yet.',
    newsInEnglish: 'This item has not been translated yet and is shown in English.',
    newsFallbackTag: 'English',
    newsSource: 'Source', newsBack: 'All news',
    navGallery: 'Gallery',
    galleryHeading: 'Photography',
    galleryIntro: 'The corridor, its construction and the communities along it.',
    galleryEmpty: 'No photographs have been published yet.',
    galleryResolutionNote: 'These photographs are the highest resolution DBEDC has supplied — the largest is 1024 pixels wide — so they will look soft on a large screen. Original files remain outstanding and will replace these when they arrive.',
    mapHeading: 'Corridor map', navMap: 'Corridor map',
    mapIntro: 'The alignment from Naojor to Madanpur, drawn from surveyed coordinates, with the condition of each section.',
    mapAltText: 'Map of the Dhaka Bypass Expressway corridor from Naojor to Madanpur, with each section coloured by traffic condition. The same information is in the section table beside it.',
    mapNoGeometry: 'The corridor geometry has not been published yet.',
    mapNoSections: 'No sections have been published yet.',
    mapSectionStatus: 'Section status', mapCorridorInfo: 'Corridor information',
    mapDistribution: 'Traffic distribution', mapMonthlyFlow: 'Monthly traffic flow',
    mapMonthlyFlowNote: 'Vehicles recorded at the toll plazas, by month.',
    mapLatestMonth: 'Latest month', mapMonthChange: 'Change on the month',
    mapStartPoint: 'Start', mapEndPoint: 'End', mapMeasuredLength: 'Measured length',
    mapSections: 'Sections', mapOverall: 'Overall condition',
    mapWaypoint: 'Waypoint', mapKmh: 'km/h',
    mapKm: 'km', mapNorth: 'N', mapWorst: 'Worst section condition',
    mapKeyTerminal: 'Corridor end', mapKeyWaypoint: 'Waypoint', mapPeak: 'Peak',
    mapZoomIn: 'Zoom in', mapZoomOut: 'Zoom out', mapResetView: 'Show the whole corridor',
    mapResetShort: 'Reset', mapSelectHint: 'Select a section to zoom to it on the map.',
    mapSchematicTag: 'Schematic alignment',
    mapSchematicBody: 'The line on this map joins the surveyed waypoints and facilities directly. It shows where the corridor runs and how long each section is, but not the road\u2019s exact curvature, which is not in the data DBEDC supplied. Once the centreline is imported the map draws the real alignment.',
    mapSampleTag: 'Sample data',
    mapSampleBody: 'The traffic conditions and monthly figures on this page are sample data, shown so the map can be reviewed before DBEDC\u2019s own measurements are connected. They describe nothing real. The corridor alignment, chainages and section lengths are surveyed and are correct.',
    traffic_free: 'Free flow', traffic_moderate: 'Moderate', traffic_slow: 'Slow',
    traffic_heavy: 'Heavy', traffic_closed: 'Closed', traffic_unknown: 'Not measured',
    consentHeading: 'Cookies',
    consentBody: 'We would like to use analytics cookies to understand which pages are useful. Nothing is recorded unless you agree, and the site works exactly the same either way.',
    consentAccept: 'Accept', consentReject: 'Decline',
    contactAddress: 'Office', contactPhone: 'Telephone',
    contactEmergency: 'Emergency assistance', contactEmail: 'Email',
    contactHours: 'Opening hours',
    skipToContent: 'Skip to content', language: 'Language', theme: 'Theme',
    videoPlay: 'Play video', videoTitle: 'Video', videoTranscript: 'Read the transcript', videoDownload: 'Download the video',
    emergency: 'Emergency', emergencyNational: 'National emergency', allRights: 'All rights reserved.',
    provisional: 'Provisional',
    provisionalBody: 'These figures are awaiting official confirmation and may change.',
    statusOpen: 'Open to traffic', statusConstruction: 'Under construction', statusPlanned: 'Planned',
    kindInterchange: 'Interchange', kindTollPlaza: 'Toll plaza', kindServiceArea: 'Service area',
    kindULoop: 'U-loop', kindPedestrianOverpass: 'Pedestrian overpass', kindBridge: 'Bridge',
    colLocation: 'Location', colChainage: 'Chainage', colType: 'Type', colConnects: 'Connects',
    colStatus: 'Status', colVehicle: 'Vehicle class', colToll: 'Toll',
    openToTraffic: 'Open to traffic', noInterchanges: 'No interchanges have been published yet.',
    prohibitedVehicles: 'Prohibited vehicles',
    prohibitedNote: 'These vehicles may not use the expressway.',
    sevInfo: 'Notice', sevWarning: 'Advisory', sevClosure: 'Closure',
    travelStatus: "What's open", travelToll: 'Toll rates', travelRoute: 'Route & interchanges',
    travelFacilities: 'Facilities', travelRules: 'Rules of the road',
    travelStatusIntro: 'Which sections of the expressway are carrying traffic today.',
    travelTollIntro: 'Toll rates for the section currently open to traffic. Rates for the full 48 km corridor have not yet been published.',
    colSection: 'Section', tollCaption: 'Toll rates currently in force.',
    interchangeCaption: 'Interchanges and facilities along the corridor, north to south.',
    noTollRates: 'No toll rates have been published yet.',
    travelRouteIntro: 'Where to join and leave the expressway.',
    travelFacilitiesIntro: 'Service areas and roadside assistance along the corridor.',
    travelRulesIntro: 'Speed limits, permitted vehicles and what to do if you break down.',
    routeCaption: 'Entry and exit points, north to south.',
    noFacilities: 'No service areas have been published yet.',
    rulesEmpty: 'The rules of the road have not been published yet.',
    homeCorridorHeading: 'The corridor today', seeAllTolls: 'All toll rates', seeRoute: 'Route & interchanges',
    homeNotCreated: 'No home page has been published yet.',
    brandTagline: 'Dhaka Bypass Expressway',
    /* The 404 fallback, used only while the `not-found` page row is absent. */
    notFoundHeading: 'Page not found', notFoundBody: 'The page you asked for does not exist or has moved.',
    notFoundHome: 'Back to the home page',
    /* Error boundaries — app/global-error.jsx and app/[locale]/error.jsx.
       These are the strings a reader sees when the site has already failed, so
       they are the ones most likely to render from THIS table rather than from
       ui_strings: global-error replaces the root layout, which means no
       UiStringsBridge and no database value, ever. */
    errorHeading: 'This page could not be shown',
    errorBody: 'Something failed at our end, not yours. Try again in a moment. If it keeps happening, quote the reference below when you contact DBEDC.',
    errorRetry: 'Try again',
    errorHome: 'Go to the home page',
    errorReference: 'Reference',
  },
  bn: {
    navTravel: 'ভ্রমণ তথ্য', navProject: 'প্রকল্প', navImpact: 'প্রভাব',
    navAbout: 'পরিচিতি', navNews: 'সংবাদ', navContact: 'যোগাযোগ',
    navSafety: 'নিরাপত্তা', navSustainability: 'টেকসই উন্নয়ন',
    navGovernance: 'পরিচালনা কাঠামো', navDisclosures: 'তথ্য প্রকাশ',
    navTariff: 'টোল বিজ্ঞপ্তি', navLandAcquisition: 'ভূমি অধিগ্রহণ',
    navProcurement: 'ক্রয় ও দরপত্র', navGrievances: 'অভিযোগ',
    footerNavLabel: 'সাইটের বিভাগসমূহ', footerTravel: 'ভ্রমণ',
    footerCompany: 'প্রতিষ্ঠান', footerDisclosure: 'তথ্য প্রকাশ', footerContact: 'যোগাযোগ',
    footerPrivacy: 'গোপনীয়তা', footerTerms: 'ব্যবহারের শর্ত', footerAccessibility: 'প্রবেশগম্যতা',
    pendingTag: 'এখনও প্রকাশিত হয়নি',
    legacyDataTag: 'আগের ওয়েবসাইটের তথ্য',
    legacyDataNotice: 'আগের ওয়েবসাইট থেকে সংরক্ষিত তথ্য। এগুলি পরিবর্তিত হয়ে থাকতে পারে; সাধারণ অনুসন্ধানের জন্য ফরম ব্যবহার করুন।',
    contactHeading: 'DBEDC-এর সঙ্গে যোগাযোগ',
    contactIntro: 'প্রশ্ন করুন, এক্সপ্রেসওয়ের কোনও সমস্যা জানান, কিংবা কোনও নথি চেয়ে নিন।',
    contactWriteHeading: 'বার্তা পাঠান',
    contactWriteBody: 'প্রতিটি বার্তা DBEDC-এর কাছে পৌঁছায়। আপনার বার্তা সড়ক সম্পর্কে হলে করিডোরের কোথায় এবং কখন, তা জানান।',
    contactDetailsHeading: 'কার্যালয় ও টেলিফোন',
    contactDetailsPending: "সাধারণ অনুসন্ধানের জন্য নিচের ফরম ব্যবহার করুন। অফিসের ঠিকানা, প্রকাশ্য টেলিফোন, ইমেইল ও নির্দিষ্ট জরুরি হটলাইন নিশ্চিতকরণের অপেক্ষায় রয়েছে।",
    contactOtherHeading: 'অন্যান্য পথ',
    contactOtherBody: 'টোল, সড়ক, ভূমি অধিগ্রহণ বা দরপত্র সংক্রান্ত অভিযোগের নিজস্ব পথ রয়েছে, এবং তারপর কী হয় তার বিবরণও।',
    formName: 'আপনার নাম', formEmail: 'ইমেইল ঠিকানা', formSubject: 'বিষয়',
    formMessage: 'বার্তা', formSend: 'বার্তা পাঠান', formSending: 'পাঠানো হচ্ছে…',
    formSentHeading: 'বার্তা পাঠানো হয়েছে',
    formSentBody: 'ধন্যবাদ। আপনার বার্তা সংরক্ষিত হয়েছে এবং DBEDC-এর কাছে পৌঁছাবে।',
    formErrorRequired: 'অনুগ্রহ করে আপনার নাম, উত্তর দেওয়ার মতো একটি ইমেইল ঠিকানা এবং বার্তা দিন।',
    formErrorUnavailable: 'আপনার বার্তা সংরক্ষণ করা যায়নি — কিছুই সংরক্ষিত হয়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন, অথবা DBEDC-এর সঙ্গে যোগাযোগের অন্য পথ ব্যবহার করুন।',
    formErrorRateLimited: 'এই সংযোগ থেকে ইতিমধ্যে বেশ কয়েকটি বার্তা পাঠানো হয়েছে। আরেকটি পাঠানোর আগে কয়েক মিনিট অপেক্ষা করুন। বিষয়টি জরুরি হলে DBEDC-এর সঙ্গে যোগাযোগের অন্য পথ ব্যবহার করুন।',
    formErrorTooLong: 'আপনার বার্তাটি এই ফর্মে সংরক্ষণযোগ্য দৈর্ঘ্যের চেয়ে বড়। অনুগ্রহ করে সংক্ষিপ্ত করুন, অথবা বিস্তারিত ইমেইলে পাঠান।',
    formPrivacy: 'আপনার নাম ও ইমেইল কেবল আপনাকে উত্তর দেওয়ার জন্য ব্যবহৃত হয়।',
    formHoneypot: 'প্রতিষ্ঠান (খালি রাখুন)',
    formPhone: 'ফোন নম্বর', formVehicle: 'যানবাহনের নিবন্ধন নম্বর', formLocation: 'এক্সপ্রেসওয়ের কোথায়',
    formContactEither: 'ফোন নম্বর বা ইমেইল ঠিকানা দিন, যাতে DBEDC আপনার সঙ্গে যোগাযোগ করতে পারে।',
    requestErrorRequired: 'অনুগ্রহ করে চিহ্নিত ঘরগুলি পূরণ করুন। DBEDC যাতে আপনার সঙ্গে যোগাযোগ করতে পারে সেজন্য ফোন নম্বর বা ইমেইল ঠিকানা দিন।',
    requestSentHeading: 'আপনার অনুরোধ সংরক্ষিত হয়েছে',
    requestSentBody: 'আপনার দেওয়া তথ্য ব্যবহার করে DBEDC আপনার সঙ্গে যোগাযোগ করবে।',
    requestTrackingLabel: 'ট্র্যাকিং নম্বর', requestKeepNumber: 'এই নম্বরটি সংরক্ষণ করুন। পরবর্তী যোগাযোগে এটি উল্লেখ করুন।',
    requestKind_grievance: 'অভিযোগ দাখিল করুন', requestKind_toll_dispute: 'টোল চার্জ নিয়ে আপত্তি জানান',
    requestKind_breakdown: 'যানবাহন বিকল হলে সহায়তা চান', requestKind_lost_found: 'হারানো বা পাওয়া জিনিস জানান',
    requestKind_general: 'অনুরোধ জানান',
    newsletterHeading: 'ইমেইলে পরিচালনা সংক্রান্ত বিজ্ঞপ্তি পান',
    newsletterSubscribe: 'সাবস্ক্রাইব করুন', newsletterOk: 'ধন্যবাদ। আপনি তালিকায় যুক্ত হয়েছেন।',
    newsletterInvalid: 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন।',
    newsletterNote: 'আপনার ঠিকানা কেবল DBEDC-এর বিজ্ঞপ্তি পাঠাতে ব্যবহৃত হবে, এবং যেকোনও সময় তালিকা থেকে বাদ দেওয়ার অনুরোধ করতে পারবেন।',
    sitemapEmpty: 'এখনও কোনও পাতা প্রকাশিত হয়নি।',
    pagingLabel: 'আলোকচিত্রের পাতা',
    newsHeading: 'সংবাদকক্ষ',
    newsIntro: 'DBEDC-এর ঘোষণা ও পরিচালনা সংক্রান্ত বিজ্ঞপ্তি।',
    newsEmpty: 'এখনও কোনও কিছু প্রকাশ করা হয়নি।',
    newsInEnglish: 'এটি এখনও অনুবাদ করা হয়নি, তাই ইংরেজিতে দেখানো হচ্ছে।',
    newsFallbackTag: 'ইংরেজি',
    newsSource: 'সূত্র', newsBack: 'সব সংবাদ',
    navGallery: 'গ্যালারি',
    galleryHeading: 'আলোকচিত্র',
    galleryIntro: 'করিডোর, তার নির্মাণকাজ এবং পাশের জনপদ।',
    galleryEmpty: 'এখনও কোনও আলোকচিত্র প্রকাশ করা হয়নি।',
    galleryResolutionNote: 'DBEDC থেকে পাওয়া সর্বোচ্চ রেজোলিউশনের ছবি এগুলিই — সবচেয়ে বড়টি ১০২৪ পিক্সেল চওড়া — তাই বড় পর্দায় ঝাপসা দেখাবে। মূল ফাইলগুলি এখনও পাওয়া যায়নি; সেগুলি এলে এই ছবিগুলির জায়গা নেবে।',
    mapHeading: 'করিডোর মানচিত্র', navMap: 'করিডোর মানচিত্র',
    mapIntro: 'নাওজোড় থেকে মদনপুর পর্যন্ত অ্যালাইনমেন্ট, জরিপকৃত স্থানাঙ্ক থেকে আঁকা, প্রতিটি অংশের অবস্থাসহ।',
    mapAltText: 'নাওজোড় থেকে মদনপুর পর্যন্ত Dhaka Bypass Expressway করিডোরের মানচিত্র, প্রতিটি অংশ যান চলাচলের অবস্থা অনুযায়ী রঙিন। একই তথ্য পাশের অংশ-তালিকায় রয়েছে।',
    mapNoGeometry: 'করিডোরের জ্যামিতি এখনও প্রকাশ করা হয়নি।',
    mapNoSections: 'এখনও কোনও অংশ প্রকাশ করা হয়নি।',
    mapSectionStatus: 'অংশের অবস্থা', mapCorridorInfo: 'করিডোরের তথ্য',
    mapDistribution: 'যান চলাচলের বণ্টন', mapMonthlyFlow: 'মাসিক যান চলাচল',
    mapMonthlyFlowNote: 'টোল প্লাজায় নথিভুক্ত যানবাহন, মাস অনুযায়ী।',
    mapLatestMonth: 'সর্বশেষ মাস', mapMonthChange: 'মাসিক পরিবর্তন',
    mapStartPoint: 'শুরু', mapEndPoint: 'শেষ', mapMeasuredLength: 'পরিমাপকৃত দৈর্ঘ্য',
    mapSections: 'অংশ', mapOverall: 'সামগ্রিক অবস্থা',
    mapWaypoint: 'ওয়েপয়েন্ট', mapKmh: 'কিমি/ঘণ্টা',
    mapKm: 'কিমি', mapNorth: 'উ', mapWorst: 'সবচেয়ে খারাপ অংশের অবস্থা',
    mapKeyTerminal: 'করিডোরের প্রান্ত', mapKeyWaypoint: 'ওয়েপয়েন্ট', mapPeak: 'সর্বোচ্চ',
    mapZoomIn: 'বড় করুন', mapZoomOut: 'ছোট করুন', mapResetView: 'পুরো করিডোর দেখান',
    mapResetShort: 'রিসেট', mapSelectHint: 'মানচিত্রে জুম করতে একটি অংশ নির্বাচন করুন।',
    mapSchematicTag: 'পরিকল্পিত রেখাচিত্র',
    mapSchematicBody: 'এই মানচিত্রের রেখাটি জরিপকৃত ওয়েপয়েন্ট ও স্থাপনাগুলিকে সরাসরি যুক্ত করে। এটি করিডোর কোথা দিয়ে গেছে ও প্রতিটি অংশের দৈর্ঘ্য দেখায়, কিন্তু সড়কের প্রকৃত বাঁকগুলি দেখায় না — সেই তথ্য DBEDC সরবরাহ করেনি। কেন্দ্ররেখা যুক্ত হলে মানচিত্রে প্রকৃত অ্যালাইনমেন্ট আঁকা হবে।',
    mapSampleTag: 'নমুনা তথ্য',
    mapSampleBody: 'এই পাতার যান চলাচলের অবস্থা ও মাসিক সংখ্যাগুলি নমুনা তথ্য — DBEDC-এর নিজস্ব পরিমাপ যুক্ত হওয়ার আগে মানচিত্রটি যাচাই করার জন্য দেখানো হচ্ছে। এগুলি বাস্তব কিছু বর্ণনা করে না। করিডোরের অ্যালাইনমেন্ট, চেইনেজ ও অংশের দৈর্ঘ্য জরিপকৃত এবং সঠিক।',
    traffic_free: 'স্বাভাবিক', traffic_moderate: 'মাঝারি', traffic_slow: 'ধীর',
    traffic_heavy: 'তীব্র যানজট', traffic_closed: 'বন্ধ', traffic_unknown: 'পরিমাপ করা হয়নি',
    consentHeading: 'কুকি',
    consentBody: 'কোন পাতাগুলি কাজে লাগছে তা বুঝতে আমরা অ্যানালিটিক্স কুকি ব্যবহার করতে চাই। আপনি সম্মতি না দিলে কিছুই সংরক্ষণ করা হয় না, এবং যেকোনও ক্ষেত্রেই সাইটটি একইভাবে কাজ করে।',
    consentAccept: 'সম্মতি', consentReject: 'প্রত্যাখ্যান',
    contactAddress: 'কার্যালয়', contactPhone: 'টেলিফোন',
    contactEmergency: 'জরুরি সহায়তা', contactEmail: 'ইমেইল',
    contactHours: 'খোলার সময়',
    skipToContent: 'মূল বিষয়বস্তুতে যান', language: 'ভাষা', theme: 'থিম',
    videoPlay: 'ভিডিও চালান', videoTitle: 'ভিডিও', videoTranscript: 'প্রতিলিপি পড়ুন', videoDownload: 'ভিডিও ডাউনলোড করুন',
    emergency: 'জরুরি', emergencyNational: 'জাতীয় জরুরি সেবা', allRights: 'সর্বস্বত্ব সংরক্ষিত।',
    provisional: 'অস্থায়ী',
    provisionalBody: 'এই তথ্য সরকারি নিশ্চিতকরণের অপেক্ষায় রয়েছে এবং পরিবর্তিত হতে পারে।',
    statusOpen: 'যান চলাচলের জন্য খোলা', statusConstruction: 'নির্মাণাধীন', statusPlanned: 'পরিকল্পিত',
    kindInterchange: 'ইন্টারচেঞ্জ', kindTollPlaza: 'টোল প্লাজা', kindServiceArea: 'সার্ভিস এরিয়া',
    kindULoop: 'ইউ-লুপ', kindPedestrianOverpass: 'পদচারী সেতু', kindBridge: 'সেতু',
    colLocation: 'অবস্থান', colChainage: 'চেইনেজ', colType: 'ধরন', colConnects: 'সংযোগ',
    colStatus: 'অবস্থা', colVehicle: 'যানবাহনের শ্রেণি', colToll: 'টোল',
    openToTraffic: 'যান চলাচলের জন্য খোলা', noInterchanges: 'এখনও কোনও ইন্টারচেঞ্জ প্রকাশ করা হয়নি।',
    prohibitedVehicles: 'নিষিদ্ধ যানবাহন',
    prohibitedNote: 'এই যানবাহনগুলি এক্সপ্রেসওয়ে ব্যবহার করতে পারবে না।',
    sevInfo: 'বিজ্ঞপ্তি', sevWarning: 'সতর্কতা', sevClosure: 'বন্ধ',
    travelStatus: 'কী খোলা আছে', travelToll: 'টোল হার', travelRoute: 'রুট ও ইন্টারচেঞ্জ',
    travelFacilities: 'সুবিধাসমূহ', travelRules: 'সড়ক বিধি',
    travelStatusIntro: 'এক্সপ্রেসওয়ের কোন অংশগুলি আজ যান চলাচলের জন্য খোলা।',
    travelTollIntro: 'বর্তমানে যান চলাচলের জন্য খোলা অংশের টোল হার এটি। সম্পূর্ণ ৪৮ কিলোমিটার করিডোরের টোল হার এখনও প্রকাশ করা হয়নি।',
    colSection: 'অংশ', tollCaption: 'বর্তমানে কার্যকর টোল হার।',
    interchangeCaption: 'করিডোর বরাবর ইন্টারচেঞ্জ ও সুবিধাসমূহ, উত্তর থেকে দক্ষিণে।',
    noTollRates: 'এখনও কোনও টোল হার প্রকাশ করা হয়নি।',
    travelRouteIntro: 'এক্সপ্রেসওয়েতে ওঠা ও নামার স্থান।',
    travelFacilitiesIntro: 'করিডোর বরাবর সার্ভিস এরিয়া ও সড়ক সহায়তা।',
    travelRulesIntro: 'গতিসীমা, অনুমোদিত যানবাহন এবং যানবাহন বিকল হলে করণীয়।',
    routeCaption: 'প্রবেশ ও প্রস্থানের স্থান, উত্তর থেকে দক্ষিণে।',
    noFacilities: 'এখনও কোনও সার্ভিস এরিয়া প্রকাশ করা হয়নি।',
    rulesEmpty: 'সড়ক বিধি এখনও প্রকাশ করা হয়নি।',
    homeCorridorHeading: 'আজকের করিডোর', seeAllTolls: 'সব টোল হার', seeRoute: 'রুট ও ইন্টারচেঞ্জ',
    homeNotCreated: 'হোম পেজ এখনও প্রকাশ করা হয়নি।',
    brandTagline: 'ঢাকা বাইপাস এক্সপ্রেসওয়ে',
    notFoundHeading: 'পাতাটি পাওয়া যায়নি', notFoundBody: 'আপনি যে পাতাটি চেয়েছেন তা নেই, অথবা সরানো হয়েছে।',
    notFoundHome: 'হোম পেজে ফিরে যান',
    errorHeading: 'এই পৃষ্ঠাটি দেখানো যায়নি',
    errorBody: 'ত্রুটিটি আমাদের প্রান্তে ঘটেছে, আপনার নয়। কিছুক্ষণ পর আবার চেষ্টা করুন। সমস্যা চলতেই থাকলে DBEDC-এর সঙ্গে যোগাযোগের সময় নিচের রেফারেন্স নম্বরটি জানান।',
    errorRetry: 'আবার চেষ্টা করুন',
    errorHome: 'হোম পেজে যান',
    errorReference: 'রেফারেন্স',
  },
  zh: {
    navTravel: '出行信息', navProject: '项目', navImpact: '影响',
    navAbout: '关于我们', navNews: '新闻', navContact: '联系我们',
    navSafety: '道路安全', navSustainability: '可持续发展',
    navGovernance: '治理架构', navDisclosures: '信息公开',
    navTariff: '通行费公告', navLandAcquisition: '征地与安置',
    navProcurement: '采购招标', navGrievances: '投诉',
    footerNavLabel: '网站栏目', footerTravel: '出行',
    footerCompany: '公司', footerDisclosure: '信息公开', footerContact: '联系',
    footerPrivacy: '隐私', footerTerms: '使用条款', footerAccessibility: '无障碍',
    pendingTag: '尚未公布',
    legacyDataTag: '旧版网站信息',
    legacyDataNotice: '以下信息恢复自旧版网站，可能已有变化。一般咨询请使用联系表单。',
    contactHeading: '联系 DBEDC',
    contactIntro: '咨询问题、反映快速路上的情况，或索取文件。',
    contactWriteHeading: '发送留言',
    contactWriteBody: '每一条留言都会送达 DBEDC。如与道路本身有关，请注明发生在走廊的何处、何时。',
    contactDetailsHeading: '办公地址与电话',
    contactDetailsPending: "一般咨询请使用下方表单。办公地址、公开电话、电子邮箱及专用紧急热线尚待确认。",
    contactOtherHeading: '其他渠道',
    contactOtherBody: '涉及通行费、道路状况、征地或招标的投诉设有专门渠道，并载明后续处理流程。',
    formName: '您的姓名', formEmail: '电子邮箱', formSubject: '主题',
    formMessage: '留言内容', formSend: '发送留言', formSending: '发送中…',
    formSentHeading: '留言已发送',
    formSentBody: '感谢您的留言。内容已记录，将送达 DBEDC。',
    formErrorRequired: '请填写您的姓名、可供回复的电子邮箱，以及留言内容。',
    formErrorUnavailable: '您的留言未能记录——系统未保存任何内容。请稍后重试，或通过其他渠道联系 DBEDC。',
    formErrorRateLimited: '此连接已发送多条留言。请等待几分钟后再发送。若情况紧急，请通过其他渠道联系 DBEDC。',
    formErrorTooLong: '您的留言超出本表单可记录的长度。请缩短内容，或将详情以电子邮件发送。',
    formPrivacy: '您的姓名与邮箱仅用于回复您。',
    formHoneypot: '公司（请留空）',
    formPhone: '电话号码', formVehicle: '车辆牌照号码', formLocation: '快速路上的位置',
    formContactEither: '请提供电话号码或电子邮箱，以便 DBEDC 与您联系。',
    requestErrorRequired: '请填写标出的栏目，并提供电话号码或电子邮箱，以便 DBEDC 与您联系。',
    requestSentHeading: '您的请求已记录',
    requestSentBody: 'DBEDC 将通过您提供的联系方式与您联系。',
    requestTrackingLabel: '查询编号', requestKeepNumber: '请保存此编号，后续联系时请注明。',
    requestKind_grievance: '提交申诉', requestKind_toll_dispute: '对通行费提出异议',
    requestKind_breakdown: '请求道路救援', requestKind_lost_found: '报告失物或拾物',
    requestKind_general: '提交请求',
    newsletterHeading: '通过电子邮件接收运营通知',
    newsletterSubscribe: '订阅', newsletterOk: '感谢您。您已加入订阅列表。',
    newsletterInvalid: '请输入有效的电子邮箱地址。',
    newsletterNote: '您的邮箱仅用于发送 DBEDC 通知，您可随时要求退订。',
    sitemapEmpty: '尚未发布任何页面。',
    pagingLabel: '照片分页',
    newsHeading: '新闻中心',
    newsIntro: 'DBEDC 的公告与运营通知。',
    newsEmpty: '尚未发布任何内容。',
    newsInEnglish: '本条目尚未翻译，暂以英文显示。',
    newsFallbackTag: '英文',
    newsSource: '来源', newsBack: '全部新闻',
    navGallery: '图片库',
    galleryHeading: '影像',
    galleryIntro: '走廊沿线的工程建设与周边社区。',
    galleryEmpty: '尚未发布任何照片。',
    galleryResolutionNote: '这些是 DBEDC 目前提供的最高分辨率图片，最大一张宽 1024 像素，在大屏幕上会显得不够清晰。原始文件仍在等待提供，届时将替换现有图片。',
    mapHeading: '走廊地图', navMap: '走廊地图',
    mapIntro: '自 Naojor 至 Madanpur 的线位，依据实测坐标绘制，并标注各路段的通行状况。',
    mapAltText: 'Dhaka Bypass Expressway 走廊地图，自 Naojor 至 Madanpur，各路段按通行状况着色。相同信息亦列于旁边的路段表中。',
    mapNoGeometry: '走廊线位尚未公布。',
    mapNoSections: '尚未发布任何路段。',
    mapSectionStatus: '路段状况', mapCorridorInfo: '走廊信息',
    mapDistribution: '通行状况分布', mapMonthlyFlow: '月度车流量',
    mapMonthlyFlowNote: '各收费站按月记录的车辆数。',
    mapLatestMonth: '最新月份', mapMonthChange: '环比变化',
    mapStartPoint: '起点', mapEndPoint: '终点', mapMeasuredLength: '实测长度',
    mapSections: '路段数', mapOverall: '整体状况',
    mapWaypoint: '路点', mapKmh: '公里/小时',
    mapKm: '公里', mapNorth: '北', mapWorst: '最差路段状况',
    mapKeyTerminal: '走廊端点', mapKeyWaypoint: '路点', mapPeak: '峰值',
    mapZoomIn: '放大', mapZoomOut: '缩小', mapResetView: '显示整条走廊',
    mapResetShort: '重置', mapSelectHint: '选择某一路段即可在地图上放大查看。',
    mapSchematicTag: '示意线位',
    mapSchematicBody: '本图中的线条直接连接实测路点与设施，可显示走廊走向与各路段长度，但并非道路的实际曲线——该数据 DBEDC 尚未提供。导入中心线后，地图将绘制真实线位。',
    mapSampleTag: '示例数据',
    mapSampleBody: '本页的通行状况与月度数据均为示例数据，用于在接入 DBEDC 自有监测数据之前审阅地图，并不反映任何真实情况。走廊线位、桩号与路段长度均来自实测，准确无误。',
    traffic_free: '畅通', traffic_moderate: '缓行', traffic_slow: '拥挤',
    traffic_heavy: '严重拥堵', traffic_closed: '封闭', traffic_unknown: '未监测',
    consentHeading: 'Cookie',
    consentBody: '我们希望使用分析 Cookie，以了解哪些页面对访客有用。未经您同意，我们不会记录任何信息；无论您是否同意，网站功能完全相同。',
    consentAccept: '同意', consentReject: '拒绝',
    contactAddress: '办公地址', contactPhone: '电话',
    contactEmergency: '紧急救援', contactEmail: '电子邮箱',
    contactHours: '办公时间',
    skipToContent: '跳到主要内容', language: '语言', theme: '主题',
    videoPlay: '播放视频', videoTitle: '视频', videoTranscript: '阅读文字稿', videoDownload: '下载视频',
    emergency: '紧急救援', emergencyNational: '国家紧急电话', allRights: '版权所有。',
    provisional: '暂定',
    provisionalBody: '以下数据尚待官方确认，可能会有变动。',
    statusOpen: '已通车', statusConstruction: '在建', statusPlanned: '规划中',
    kindInterchange: '互通立交', kindTollPlaza: '收费站', kindServiceArea: '服务区',
    kindULoop: '掉头匝道', kindPedestrianOverpass: '人行天桥', kindBridge: '桥梁',
    colLocation: '位置', colChainage: '桩号', colType: '类型', colConnects: '衔接',
    colStatus: '状态', colVehicle: '车型', colToll: '通行费',
    openToTraffic: '已通车', noInterchanges: '尚未发布互通立交信息。',
    prohibitedVehicles: '禁止通行车辆',
    prohibitedNote: '上述车辆不得驶入本高速公路。',
    sevInfo: '通知', sevWarning: '提醒', sevClosure: '封闭',
    travelStatus: '通车路段', travelToll: '通行费', travelRoute: '路线与互通',
    travelFacilities: '配套设施', travelRules: '通行规则',
    travelStatusIntro: '快速路目前已通车的路段。',
    travelTollIntro: '目前已通车路段的通行费标准。全长48公里快速路的通行费尚未公布。',
    colSection: '路段', tollCaption: '现行通行费标准。',
    interchangeCaption: '沿线互通立交与配套设施，由北至南。',
    noTollRates: '尚未发布通行费标准。',
    travelRouteIntro: '上下快速路的位置。',
    travelFacilitiesIntro: '沿线服务区与道路救援。',
    travelRulesIntro: '限速、准许通行车辆，以及车辆故障时的处理方式。',
    routeCaption: '出入口，由北至南。',
    noFacilities: '尚未发布服务区信息。',
    rulesEmpty: '尚未发布通行规则。',
    homeCorridorHeading: '今日通行状况', seeAllTolls: '全部通行费', seeRoute: '路线与互通',
    homeNotCreated: '首页尚未发布。',
    brandTagline: '达卡绕城高速公路',
    notFoundHeading: '页面未找到', notFoundBody: '您访问的页面不存在或已移动。',
    notFoundHome: '返回首页',
    errorHeading: '此页面无法显示',
    errorBody: '问题出在我们这一端，与您无关。请稍后重试。如果反复出现，请在联系 DBEDC 时提供下方的参考编号。',
    errorRetry: '重试',
    errorHome: '前往首页',
    errorReference: '参考编号',
  },
};

/**
 * A chrome string for `locale`.
 *
 * The signature is fixed — around 240 call sites depend on it, and none of them
 * can await anything — so the database overrides are read synchronously from
 * the module store in ./overrides.js, which the locale layout fills before it
 * renders anything (server) and <UiStringsBridge> fills on the browser.
 *
 * The chain, in order, and every step exists because the one before it can be
 * missing in production:
 *
 *   1. the database value for this locale        — what an editor typed
 *   2. the code value for this locale            — the shipped translation,
 *                                                  and what an outage renders
 *   3. the database value for English            — reaches a key that was
 *                                                  created in the admin and has
 *                                                  no code value at all
 *   4. the code value for English                — the last real string
 *   5. the key itself                            — never blank; a visible
 *                                                  `navTravel` is a bug report,
 *                                                  an empty link is not
 *
 * A blank or whitespace-only database value is treated as absent at step 1 and
 * 3 (see `usable()` in ./overrides.js), so no row an editor saves by accident
 * can empty a label.
 */
export function t(locale, key) {
  const fullKey = stringKey(UI_NS, key);

  const override = readUiOverride(locale, fullKey);
  if (override) return override;

  const table = UI[locale] || UI[DEFAULT_LOCALE];
  if (table[key]) return table[key];

  const englishOverride = readUiOverride(DEFAULT_LOCALE, fullKey);
  if (englishOverride) return englishOverride;

  return UI[DEFAULT_LOCALE][key] || key;
}
