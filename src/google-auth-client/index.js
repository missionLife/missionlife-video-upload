const KEYS = {
    "client_id": process.env.GOOGLE_CLIENT_ID,
    "project_id": "video-messaging",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": process.env.GOOGLE_CLIENT_SECRET,
    "javascript_origins": ["http://localhost:3000"],
    "redirect_uris": ['http://localhost:3000/oauth2callback'],
};
const INVALID_REDIRECT_URI = `The provided keyfile does not define a valid
redirect URI. There must be at least one redirect URI defined, and this sample
assumes it redirects to 'http://localhost:3000/oauth2callback'.  Please edit
your keyfile, and add a 'redirect_uris' section.  For example:
"redirect_uris": [
  "http://localhost:3000/oauth2callback"
]
`;

const GOOGLE_AUTH_CLIENT_SCOPE = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
];
export default class GoogleAuthClient {
    constructor({ google }) {
        this.google = google;

        // validate the redirectUri.  This is a frequent cause of confusion.
        if (!KEYS.redirect_uris || KEYS.redirect_uris.length === 0) {
            throw new Error(INVALID_REDIRECT_URI);
        }
        const redirectUri = KEYS.redirect_uris[KEYS.redirect_uris.length - 1];
        const parts = new url.URL(redirectUri);
        if (
            redirectUri.length === 0 ||
            parts.port !== '3000' ||
            parts.hostname !== 'localhost' ||
            parts.pathname !== '/oauth2callback'
        ) {
            throw new Error(INVALID_REDIRECT_URI);
        }

        // create an oAuth client to authorize the API call
        this.oAuth2Client = new this.google.auth.OAuth2(
            KEYS.client_id,
            KEYS.client_secret,
            redirectUri
        );
        console.log('got here 2');
        this.authorizeUrl = this.oAuth2Client.generateAuthUrl({
            'scope': GOOGLE_AUTH_CLIENT_SCOPE,
            'access_type':'offline',
            'approval_prompt':'force',
            'response_type':'code'
        });
        console.log('The Authorization URL: ', this.authorizeUrl);
    }
}