const i18next = require('i18next');
const middleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
const path = require('path');

module.exports = function(app) {
    i18next.use(middleware.LanguageDetector).use(Backend).init({
        debug: false,
        lng: 'en',
        fallbackLng: 'en',
        supportedLngs: ['en', 'ru'],
        load: 'all',
        preload: ['en', 'ru'],
        defaultNS: 'translation',
        saveMissing: true,
        detection: {
            // order and from where user language should be detected
            order: [/*'path', 'session', */ 'querystring', 'cookie', 'header'],

            // keys or params to lookup language from
            lookupQuerystring: 'lng',
            lookupCookie: 'i18next',
            lookupHeader: 'accept-language',
            lookupHeaderRegex: /(([a-z]{2})-?([A-Z]{2})?)\s*;?\s*(q=([0-9.]+))?/gi,
            lookupSession: 'lng',
            lookupPath: 'lng',
            lookupFromPathIndex: 0,

            // cache user language
            caches: false, // ['cookie']

            ignoreCase: true, // ignore case of detected language

            // optional expire and domain for set cookie
            cookieExpirationDate: new Date(),
            cookieDomain: 'myDomain',
            cookiePath: '/my/path',
            cookieSecure: true, // if need secure cookie
            cookieSameSite: 'strict' // 'strict', 'lax' or 'none'
        },
        backend: {
            // path where resources get loaded from, or a function
            // returning a path:
            // function(lngs, namespaces) { return customPath; }
            // the returned path will interpolate lng, ns if provided like giving a static path
            loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),

            // path to post missing resources
            addPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.missing.json')    
        }
    });

    app.use(middleware.handle(i18next));
}